import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AdminDataState,
  AdminHeader,
  AreaField,
  Field,
  PhotoField,
  StatusBadge,
  TextField,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { linesToList, slugify, TRIP_TYPES, usd } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/trips")({
  component: TripsPage,
});

type Trip = Tables<"trips">;
type Draft = {
  title: string;
  slug: string;
  type: string;
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
  summary: string;
  highlights_text: string;
  included_text: string;
  excluded_text: string;
  itinerary_text: string;
  faqs_text: string;
  published: boolean;
  featured: boolean;
};

const blankDraft = (): Draft => ({
  title: "",
  slug: "",
  type: "safari",
  destination: "",
  days: 1,
  hours: null,
  duration_label: "1 day",
  price_usd: 0,
  min_group: 1,
  pickup: "",
  group_size: "",
  image: "",
  image_alt: "",
  summary: "",
  highlights_text: "",
  included_text: "",
  excluded_text: "",
  itinerary_text: "",
  faqs_text: "",
  published: false,
  featured: false,
});

function asList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((line): line is string => typeof line === "string")
    : [];
}

function asItineraryText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) return "";
      const day = "day" in item && typeof item.day === "string" ? item.day : "";
      const title = "title" in item && typeof item.title === "string" ? item.title : "";
      const description =
        "description" in item && typeof item.description === "string" ? item.description : "";
      return [day, title, description].join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function asFaqText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) return "";
      const q = "q" in item && typeof item.q === "string" ? item.q : "";
      const a = "a" in item && typeof item.a === "string" ? item.a : "";
      return [q, a].join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

function toDraft(trip?: Trip): Draft {
  if (!trip) return blankDraft();
  return {
    title: trip.title,
    slug: trip.slug,
    type: trip.type,
    destination: trip.destination,
    days: trip.days,
    hours: trip.hours,
    duration_label: trip.duration_label,
    price_usd: trip.price_usd,
    min_group: trip.min_group,
    pickup: trip.pickup,
    group_size: trip.group_size,
    image: trip.image,
    image_alt: trip.image_alt,
    summary: trip.summary,
    highlights_text: asList(trip.highlights).join("\n"),
    included_text: asList(trip.included).join("\n"),
    excluded_text: asList(trip.excluded).join("\n"),
    itinerary_text: asItineraryText(trip.itinerary),
    faqs_text: asFaqText(trip.faqs),
    published: trip.published,
    featured: trip.featured,
  };
}

function parseItinerary(text: string) {
  return linesToList(text).map((line, index) => {
    const [day, title, ...description] = line.split("|").map((part) => part.trim());
    return {
      day: day || `Day ${index + 1}`,
      title: title || "Explore",
      description: description.join(" | "),
    };
  });
}

function parseFaqs(text: string) {
  return linesToList(text).map((line) => {
    const [q, ...answer] = line.split("|").map((part) => part.trim());
    return { q: q || "", a: answer.join(" | ") };
  });
}

function TripsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const trips = useQuery({
    queryKey: ["admin", "trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("sort_order")
        .order("title");
      if (error) throw error;
      return data;
    },
  });
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (trips.data ?? []).filter((trip) =>
      `${trip.title} ${trip.destination} ${trip.type}`.toLowerCase().includes(needle),
    );
  }, [trips.data, search]);

  const openEditor = (trip?: Trip) => {
    setEditing(trip ?? null);
    setDraft(toDraft(trip));
    setDialogOpen(true);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = slugify(draft.slug || draft.title);
    if (
      !draft.title.trim() ||
      !slug ||
      !draft.destination.trim() ||
      !draft.image ||
      draft.price_usd < 0 ||
      !draft.summary.trim()
    ) {
      toast.error("Add a title, destination, summary, price and cover photo before saving.");
      return;
    }
    setBusy(true);
    const payload = {
      title: draft.title.trim(),
      slug,
      type: draft.type,
      destination: draft.destination.trim(),
      days: Math.max(1, draft.days),
      hours: draft.hours,
      duration_label: draft.duration_label.trim() || `${draft.days} days`,
      price_usd: draft.price_usd,
      min_group: Math.max(1, draft.min_group),
      pickup: draft.pickup.trim(),
      group_size: draft.group_size.trim(),
      image: draft.image,
      image_alt: draft.image_alt.trim(),
      summary: draft.summary.trim(),
      highlights: linesToList(draft.highlights_text),
      included: linesToList(draft.included_text),
      excluded: linesToList(draft.excluded_text),
      itinerary: parseItinerary(draft.itinerary_text),
      faqs: parseFaqs(draft.faqs_text),
      published: draft.published,
      featured: draft.featured,
    };
    const result = editing
      ? await supabase.from("trips").update(payload).eq("id", editing.id)
      : await supabase.from("trips").insert({ ...payload, gallery: [] });
    setBusy(false);
    if (result.error) {
      toast.error(`Couldn't save trip: ${result.error.message}`);
      return;
    }
    toast.success(editing ? "Trip updated." : "Trip added.");
    setDialogOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["admin", "trips"] });
  };

  const remove = async (trip: Trip) => {
    if (
      !window.confirm(
        `Delete "${trip.title}"? Existing bookings will remain in the booking records.`,
      )
    )
      return;
    const { error } = await supabase.from("trips").delete().eq("id", trip.id);
    if (error) {
      toast.error(`Couldn't delete trip: ${error.message}`);
      return;
    }
    toast.success("Trip deleted.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "trips"] });
  };

  const setPublished = async (trip: Trip, published: boolean) => {
    const { error } = await supabase.from("trips").update({ published }).eq("id", trip.id);
    if (error) {
      toast.error(`Couldn't update trip: ${error.message}`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin", "trips"] });
  };

  return (
    <>
      <AdminHeader
        title="Trips & prices"
        description="Edit itineraries, prices, photos and website visibility."
        actions={
          <Button variant="forest" onClick={() => openEditor()}>
            <Plus /> Add trip
          </Button>
        }
      />
      <div className="mb-4">
        <Input
          aria-label="Search trips"
          placeholder="Search trips or destinations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg sm:max-w-sm"
        />
      </div>
      <AdminDataState
        loading={trips.isLoading}
        error={trips.error}
        empty={rows.length === 0}
        retry={() => void trips.refetch()}
      >
        <table className="w-full min-w-[790px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Type / duration</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((trip) => (
              <tr key={trip.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{trip.title}</p>
                  <p className="text-xs text-muted-foreground">{trip.destination}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="capitalize">{trip.type.replace("-", " ")}</p>
                  <p className="text-xs text-muted-foreground">{trip.duration_label}</p>
                </td>
                <td className="px-4 py-3 font-medium">{usd(trip.price_usd)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void setPublished(trip, !trip.published)}
                    aria-label={`${trip.published ? "Unpublish" : "Publish"} ${trip.title}`}
                  >
                    <StatusBadge status={trip.published ? "published" : "draft"} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditor(trip)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={`Delete ${trip.title}`}
                      onClick={() => void remove(trip)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminDataState>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit trip and price" : "Add a trip"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="trip-title"
                label="Trip title"
                value={draft.title}
                onChange={(v) =>
                  setDraft({ ...draft, title: v, slug: editing ? draft.slug : slugify(v) })
                }
              />
              <TextField
                id="trip-slug"
                label="URL slug"
                value={draft.slug}
                onChange={(v) => setDraft({ ...draft, slug: slugify(v) })}
              />
              <Field label="Trip type" id="trip-type">
                <select
                  id="trip-type"
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {TRIP_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              <TextField
                id="trip-destination"
                label="Destination"
                value={draft.destination}
                onChange={(v) => setDraft({ ...draft, destination: v })}
              />
              <TextField
                id="trip-days"
                label="Days"
                type="number"
                value={draft.days}
                onChange={(v) => setDraft({ ...draft, days: Math.max(1, Number(v) || 1) })}
              />
              <TextField
                id="trip-hours"
                label="Hours (day trips)"
                type="number"
                value={draft.hours ?? ""}
                onChange={(v) =>
                  setDraft({ ...draft, hours: v ? Math.max(1, Number(v) || 1) : null })
                }
              />
              <TextField
                id="trip-duration"
                label="Duration label"
                value={draft.duration_label}
                onChange={(v) => setDraft({ ...draft, duration_label: v })}
              />
              <TextField
                id="trip-price"
                label="Price (USD)"
                type="number"
                value={draft.price_usd}
                onChange={(v) => setDraft({ ...draft, price_usd: Math.max(0, Number(v) || 0) })}
              />
              <TextField
                id="trip-min-group"
                label="Minimum group"
                type="number"
                value={draft.min_group}
                onChange={(v) => setDraft({ ...draft, min_group: Math.max(1, Number(v) || 1) })}
              />
              <TextField
                id="trip-pickup"
                label="Pickup location"
                value={draft.pickup}
                onChange={(v) => setDraft({ ...draft, pickup: v })}
              />
              <TextField
                id="trip-group-size"
                label="Group size"
                value={draft.group_size}
                onChange={(v) => setDraft({ ...draft, group_size: v })}
              />
            </div>
            <PhotoField
              id="trip-photo"
              label="Cover photo"
              value={draft.image}
              onChange={(image) => setDraft({ ...draft, image })}
              alt={draft.image_alt || draft.title}
            />
            <TextField
              id="trip-photo-alt"
              label="Photo description"
              value={draft.image_alt}
              onChange={(v) => setDraft({ ...draft, image_alt: v })}
            />
            <AreaField
              id="trip-summary"
              label="Summary"
              value={draft.summary}
              onChange={(v) => setDraft({ ...draft, summary: v })}
              rows={3}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <AreaField
                id="trip-highlights"
                label="Highlights"
                hint="One item per line"
                value={draft.highlights_text}
                onChange={(v) => setDraft({ ...draft, highlights_text: v })}
                rows={4}
              />
              <AreaField
                id="trip-included"
                label="Included"
                hint="One item per line"
                value={draft.included_text}
                onChange={(v) => setDraft({ ...draft, included_text: v })}
                rows={4}
              />
            </div>
            <AreaField
              id="trip-excluded"
              label="Not included"
              hint="One item per line"
              value={draft.excluded_text}
              onChange={(v) => setDraft({ ...draft, excluded_text: v })}
              rows={3}
            />
            <AreaField
              id="trip-itinerary"
              label="Itinerary"
              hint="One day per line: Day 1 | Heading | Description"
              value={draft.itinerary_text}
              onChange={(v) => setDraft({ ...draft, itinerary_text: v })}
              rows={5}
            />
            <AreaField
              id="trip-faqs"
              label="FAQs"
              hint="One question per line: Question | Answer"
              value={draft.faqs_text}
              onChange={(v) => setDraft({ ...draft, faqs_text: v })}
              rows={4}
            />
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                />{" "}
                Publish on website
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                />{" "}
                Feature this trip
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="forest" disabled={busy}>
                {busy ? "Saving…" : "Save trip"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
