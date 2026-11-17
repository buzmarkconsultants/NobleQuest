/**
 * Public website data: trips, reviews and articles (read), plus bookings,
 * quote requests and newsletter sign-ups (write). Everything here runs on the
 * server with the public key, so database rules decide what is allowed.
 */
import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { allowsDeposit, depositUSD, tripTotalUSD } from "@/lib/pricing";

export const PHOTO_BUCKET = "site-photos";
export const UPLOAD_PREFIX = "uploads/";

function publicDb() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

type Db = ReturnType<typeof publicDb>;

/** Photos uploaded in the admin console live in private storage: swap their paths for temporary links. */
async function signUploads(db: Db, paths: string[]) {
  const uploads = [...new Set(paths.filter((p) => p.startsWith(UPLOAD_PREFIX)))];
  const map = new Map<string, string>();
  if (uploads.length === 0) return map;
  const { data } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(uploads, 60 * 60 * 24 * 7);
  for (const row of data ?? []) if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  return map;
}

export interface TripRow {
  id: string;
  slug: string;
  type: string;
  title: string;
  destination: string;
  days: number;
  hours: number | null;
  duration_label: string;
  price_usd: number;
  min_group: number;
  pickup: string;
  group_size: string;
  image: string;
  image_alt: string;
  gallery: { src: string; alt: string }[];
  summary: string;
  highlights: string[];
  itinerary: { day: string; title: string; description: string }[];
  included: string[];
  excluded: string[];
  faqs: { q: string; a: string }[];
  featured: boolean;
}

export const listTrips = createServerFn({ method: "GET" }).handler(async (): Promise<TripRow[]> => {
  const db = publicDb();
  const { data, error } = await db
    .from("trips")
    .select(
      "id, slug, type, title, destination, days, hours, duration_label, price_usd, min_group, pickup, group_size, image, image_alt, gallery, summary, highlights, itinerary, included, excluded, faqs, featured",
    )
    .eq("published", true)
    .order("sort_order")
    .order("title");
  if (error) {
    console.error("listTrips", error);
    throw new Error("Trips are unavailable right now. Please try again shortly.");
  }
  const rows = (data ?? []).map((r) => ({
    ...r,
    gallery: (Array.isArray(r.gallery) ? r.gallery : []) as TripRow["gallery"],
    itinerary: (Array.isArray(r.itinerary) ? r.itinerary : []) as TripRow["itinerary"],
    faqs: (Array.isArray(r.faqs) ? r.faqs : []) as TripRow["faqs"],
  }));
  const signed = await signUploads(db, rows.flatMap((r) => [r.image, ...r.gallery.map((g) => g.src)]));
  if (signed.size === 0) return rows;
  return rows.map((r) => ({
    ...r,
    image: signed.get(r.image) ?? r.image,
    gallery: r.gallery.map((g) => ({ ...g, src: signed.get(g.src) ?? g.src })),
  }));
});

export interface ReviewRow {
  id: string;
  name: string;
  country: string;
  flag: string;
  rating: number;
  trip: string;
  quote: string;
  source: string;
}

export const listReviews = createServerFn({ method: "GET" }).handler(async (): Promise<ReviewRow[]> => {
  const { data, error } = await publicDb()
    .from("reviews")
    .select("id, name, country, flag, rating, trip, quote, source")
    .eq("published", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listReviews", error);
    return [];
  }
  return data ?? [];
});

export interface ArticleRow {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  image_alt: string;
  read_time: string;
  published_on: string;
  body: { heading: string; text: string }[];
}

export const listArticles = createServerFn({ method: "GET" }).handler(async (): Promise<ArticleRow[]> => {
  const db = publicDb();
  const { data, error } = await db
    .from("articles")
    .select("slug, title, excerpt, image, image_alt, read_time, published_on, body")
    .eq("published", true)
    .order("published_on", { ascending: false });
  if (error) {
    console.error("listArticles", error);
    return [];
  }
  const rows = (data ?? []).map((a) => ({ ...a, body: (Array.isArray(a.body) ? a.body : []) as ArticleRow["body"] }));
  const signed = await signUploads(db, rows.map((a) => a.image));
  return rows.map((a) => ({ ...a, image: signed.get(a.image) ?? a.image }));
});

// ───────── Bookings ─────────

const bookingInput = z.object({
  tripSlug: z.string().min(1).max(120),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travelers: z.number().int().min(1).max(500),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  country: z.string().trim().max(60).optional(),
  pickup: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["mpesa", "card"]),
  paymentPlan: z.enum(["deposit", "full"]),
});

function makeReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `NQ-${s}`;
}

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingInput.parse(input))
  .handler(async ({ data }) => {
    const db = publicDb();
    // Price always comes from the saved trip, never from the browser.
    const { data: trip } = await db
      .from("trips")
      .select("slug, title, type, price_usd, min_group")
      .eq("slug", data.tripSlug)
      .eq("published", true)
      .maybeSingle();
    if (!trip) return { ok: false as const, error: "This trip is no longer available." };
    if (data.travelers < trip.min_group) {
      return { ok: false as const, error: `This package needs at least ${trip.min_group} travelers.` };
    }
    const total = tripTotalUSD(trip.price_usd, data.travelers);
    const plan = allowsDeposit(trip.type) ? data.paymentPlan : "full";
    const due = plan === "deposit" ? depositUSD(total, trip.type) : total;

    for (let attempt = 0; attempt < 3; attempt++) {
      const reference = makeReference();
      const { error } = await db.from("bookings").insert({
        reference,
        trip_slug: trip.slug,
        trip_title: trip.title,
        trip_type: trip.type,
        travel_date: data.travelDate,
        travelers: data.travelers,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        country: data.country || null,
        pickup_location: data.pickup || null,
        notes: data.notes || null,
        payment_method: data.paymentMethod,
        payment_plan: plan,
        total_usd: total,
        amount_due_usd: due,
      });
      if (!error) return { ok: true as const, reference, totalUSD: total, amountDueUSD: due };
      if (error.code !== "23505") {
        console.error("createBooking", error);
        break;
      }
    }
    return { ok: false as const, error: "We couldn't save your booking. Please try again or WhatsApp us." };
  });

// ───────── Quote requests ─────────

const quoteInput = z.object({
  kind: z.enum(["custom", "corporate"]),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(20),
  company: z.string().trim().max(120).optional(),
  travelDates: z.string().trim().max(100).optional(),
  groupSize: z.string().trim().max(20).optional(),
  budget: z.string().trim().max(60).optional(),
  interests: z.array(z.string().max(40)).max(10),
  tripSlug: z.string().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
});

export const createQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => quoteInput.parse(input))
  .handler(async ({ data }) => {
    const { error } = await publicDb().from("quote_requests").insert({
      kind: data.kind,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      company: data.company || null,
      travel_dates: data.travelDates || null,
      group_size: data.groupSize || null,
      budget: data.budget || null,
      interests: data.interests,
      trip_slug: data.tripSlug || null,
      message: data.message || null,
    });
    if (error) {
      console.error("createQuoteRequest", error);
      return { ok: false as const, error: "We couldn't send your request. Please try again or WhatsApp us." };
    }
    return { ok: true as const };
  });

// ───────── Newsletter ─────────

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email: z.string().trim().toLowerCase().email().max(255) }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await publicDb().from("newsletter_subscribers").insert({ email: data.email });
    if (error && error.code !== "23505") {
      console.error("subscribeNewsletter", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
