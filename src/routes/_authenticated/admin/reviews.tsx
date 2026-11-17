import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AdminDataState,
  AdminHeader,
  AreaField,
  Field,
  StatusBadge,
  TextField,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: ReviewsPage,
});

type Review = Tables<"reviews">;
type Draft = Pick<
  Review,
  "name" | "country" | "flag" | "rating" | "trip" | "quote" | "source" | "sort_order" | "published"
>;

const blankDraft = (): Draft => ({
  name: "",
  country: "",
  flag: "",
  rating: 5,
  trip: "",
  quote: "",
  source: "Google",
  sort_order: 0,
  published: false,
});

function ReviewsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [busy, setBusy] = useState(false);
  const reviews = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openEditor = (review?: Review) => {
    setEditing(review ?? null);
    setDraft(
      review
        ? {
            name: review.name,
            country: review.country,
            flag: review.flag,
            rating: review.rating,
            trip: review.trip,
            quote: review.quote,
            source: review.source,
            sort_order: review.sort_order,
            published: review.published,
          }
        : blankDraft(),
    );
    setDialogOpen(true);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.quote.trim()) {
      toast.error("Add a guest name and review before saving.");
      return;
    }
    setBusy(true);
    const result = editing
      ? await supabase.from("reviews").update(draft).eq("id", editing.id)
      : await supabase.from("reviews").insert(draft);
    setBusy(false);
    if (result.error) {
      toast.error(`Couldn't save review: ${result.error.message}`);
      return;
    }
    toast.success(editing ? "Review updated." : "Review added.");
    setDialogOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
  };

  const remove = async (review: Review) => {
    if (!window.confirm(`Delete the review from ${review.name}?`)) return;
    const { error } = await supabase.from("reviews").delete().eq("id", review.id);
    if (error) {
      toast.error(`Couldn't delete review: ${error.message}`);
      return;
    }
    toast.success("Review deleted.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
  };

  const setPublished = async (review: Review, published: boolean) => {
    const { error } = await supabase.from("reviews").update({ published }).eq("id", review.id);
    if (error) {
      toast.error(`Couldn't update review: ${error.message}`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
  };

  return (
    <>
      <AdminHeader
        title="Reviews"
        description="Publish guest stories on the website."
        actions={
          <Button variant="forest" onClick={() => openEditor()}>
            <Plus /> Add review
          </Button>
        }
      />
      <AdminDataState
        loading={reviews.isLoading}
        error={reviews.error}
        empty={(reviews.data?.length ?? 0) === 0}
        retry={() => void reviews.refetch()}
      >
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Guest / trip</th>
              <th className="px-4 py-3">Review</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.data?.map((review) => (
              <tr key={review.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {review.flag} {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.country} · {review.trip || "Trip not specified"}
                  </p>
                </td>
                <td className="max-w-sm px-4 py-3">
                  <p className="line-clamp-2">{review.quote}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{review.source}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-gold text-gold" /> {review.rating}/5
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void setPublished(review, !review.published)}
                    aria-label={`${review.published ? "Unpublish" : "Publish"} ${review.name}`}
                  >
                    <StatusBadge status={review.published ? "published" : "draft"} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditor(review)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={`Delete ${review.name}`}
                      onClick={() => void remove(review)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit review" : "Add a review"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="review-name"
                label="Guest name"
                value={draft.name}
                onChange={(v) => setDraft({ ...draft, name: v })}
              />
              <TextField
                id="review-country"
                label="Country"
                value={draft.country}
                onChange={(v) => setDraft({ ...draft, country: v })}
              />
              <TextField
                id="review-flag"
                label="Country flag"
                hint="Optional emoji, e.g. 🇬🇧"
                value={draft.flag}
                onChange={(v) => setDraft({ ...draft, flag: v })}
              />
              <TextField
                id="review-trip"
                label="Trip name"
                value={draft.trip}
                onChange={(v) => setDraft({ ...draft, trip: v })}
              />
              <TextField
                id="review-rating"
                label="Rating (1–5)"
                type="number"
                value={draft.rating}
                onChange={(v) =>
                  setDraft({ ...draft, rating: Math.min(5, Math.max(1, Number(v) || 1)) })
                }
              />
              <TextField
                id="review-source"
                label="Review source"
                value={draft.source}
                onChange={(v) => setDraft({ ...draft, source: v })}
              />
              <TextField
                id="review-sort"
                label="Sort order"
                type="number"
                value={draft.sort_order}
                onChange={(v) => setDraft({ ...draft, sort_order: Number(v) || 0 })}
              />
            </div>
            <AreaField
              id="review-quote"
              label="Review"
              value={draft.quote}
              onChange={(v) => setDraft({ ...draft, quote: v })}
              rows={4}
            />
            <Field label="Visibility" id="review-published">
              <span className="flex items-center gap-2 text-sm">
                <input
                  id="review-published"
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                />
                Show on the public website
              </span>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="forest" disabled={busy}>
                {busy ? "Saving…" : "Save review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
