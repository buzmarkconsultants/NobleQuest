/** Shared queries for trips, reviews and articles, shaped for the website. */
import { photo } from "@/data/images";
import type { BlogPost, Testimonial, Tour, TripType } from "@/data/tours";
import { listArticles, listReviews, listTrips, type ArticleRow, type ReviewRow, type TripRow } from "./content.functions";

const TYPES: TripType[] = ["safari", "day-trip", "beach", "corporate"];

export function toTour(r: TripRow): Tour {
  return {
    id: r.id,
    slug: r.slug,
    type: (TYPES as string[]).includes(r.type) ? (r.type as TripType) : "safari",
    title: r.title,
    destination: r.destination,
    days: r.days,
    hours: r.hours ?? undefined,
    durationLabel: r.duration_label,
    priceUSD: r.price_usd,
    minGroup: Math.max(1, r.min_group),
    pickup: r.pickup,
    groupSize: r.group_size,
    image: photo(r.image),
    imageAlt: r.image_alt,
    gallery: r.gallery.map((g) => ({ src: photo(g.src), alt: g.alt })).filter((g) => g.src),
    summary: r.summary,
    highlights: r.highlights,
    itinerary: r.itinerary,
    included: r.included,
    excluded: r.excluded,
    faqs: r.faqs,
    featured: r.featured,
  };
}

export function toTestimonial(r: ReviewRow): Testimonial {
  return { ...r };
}

export function toPost(a: ArticleRow): BlogPost {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    image: photo(a.image),
    imageAlt: a.image_alt,
    readTime: a.read_time,
    date: a.published_on,
    body: a.body,
  };
}

/** Loaders call these; the results travel with the page so it renders fully on first load. */
export const loadTrips = async () => (await listTrips()).map(toTour);
export const loadReviews = async () => (await listReviews()).map(toTestimonial);
export const loadArticles = async () => (await listArticles()).map(toPost);

export const byType = (tours: Tour[], type: TripType) => tours.filter((t) => t.type === type);
