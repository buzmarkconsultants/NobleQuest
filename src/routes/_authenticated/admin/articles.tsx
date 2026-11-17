import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { fmtDate, slugify } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/articles")({
  component: ArticlesPage,
});

type Article = Tables<"articles">;
type BodyPart = { heading: string; text: string };
type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  image_alt: string;
  read_time: string;
  published_on: string;
  body_text: string;
  published: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);
const blankDraft = (): Draft => ({
  title: "",
  slug: "",
  excerpt: "",
  image: "",
  image_alt: "",
  read_time: "4 min read",
  published_on: today(),
  body_text: "",
  published: false,
});

function decodeBody(body: unknown): string {
  if (!Array.isArray(body)) return "";
  return (body as BodyPart[])
    .map((part) => `${part.heading ? `## ${part.heading}\n` : ""}${part.text}`)
    .join("\n\n");
}

function encodeBody(text: string): BodyPart[] {
  const sections: BodyPart[] = [];
  let heading = "Overview";
  let paragraphs: string[] = [];
  const flush = () => {
    const body = paragraphs.join("\n\n").trim();
    if (body) sections.push({ heading, text: body });
    paragraphs = [];
  };

  for (const block of text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)) {
    const match = /^##\s+(.+)\n([\s\S]*)$/.exec(block);
    if (!match) {
      paragraphs.push(block);
      continue;
    }
    flush();
    heading = match[1]!.trim();
    paragraphs.push(match[2]!.trim());
  }
  flush();
  return sections;
}

function ArticlesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [busy, setBusy] = useState(false);
  const articles = useQuery({
    queryKey: ["admin", "articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("published_on", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openEditor = (article?: Article) => {
    setEditing(article ?? null);
    setDraft(
      article
        ? {
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            image: article.image,
            image_alt: article.image_alt,
            read_time: article.read_time,
            published_on: article.published_on,
            body_text: decodeBody(article.body),
            published: article.published,
          }
        : blankDraft(),
    );
    setDialogOpen(true);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = slugify(draft.slug || draft.title);
    if (
      !draft.title.trim() ||
      !slug ||
      !draft.excerpt.trim() ||
      !draft.image ||
      !draft.body_text.trim()
    ) {
      toast.error("Add a title, excerpt, photo and article content before saving.");
      return;
    }
    setBusy(true);
    const payload = {
      title: draft.title.trim(),
      slug,
      excerpt: draft.excerpt.trim(),
      image: draft.image,
      image_alt: draft.image_alt.trim(),
      read_time: draft.read_time.trim(),
      published_on: draft.published_on,
      body: encodeBody(draft.body_text),
      published: draft.published,
    };
    const result = editing
      ? await supabase.from("articles").update(payload).eq("id", editing.id)
      : await supabase.from("articles").insert(payload);
    setBusy(false);
    if (result.error) {
      toast.error(`Couldn't save article: ${result.error.message}`);
      return;
    }
    toast.success(editing ? "Article updated." : "Article added.");
    setDialogOpen(false);
    await queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
  };

  const remove = async (article: Article) => {
    if (!window.confirm(`Delete "${article.title}"?`)) return;
    const { error } = await supabase.from("articles").delete().eq("id", article.id);
    if (error) {
      toast.error(`Couldn't delete article: ${error.message}`);
      return;
    }
    toast.success("Article deleted.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
  };

  return (
    <>
      <AdminHeader
        title="Articles"
        description="Write and publish travel guides and trip stories."
        actions={
          <Button variant="forest" onClick={() => openEditor()}>
            <Plus /> Add article
          </Button>
        }
      />
      <AdminDataState
        loading={articles.isLoading}
        error={articles.error}
        empty={(articles.data?.length ?? 0) === 0}
        retry={() => void articles.refetch()}
      >
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Published date</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {articles.data?.map((article) => (
              <tr key={article.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{article.title}</p>
                  <p className="text-xs text-muted-foreground">/blog/{article.slug}</p>
                </td>
                <td className="px-4 py-3">{fmtDate(article.published_on)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={article.published ? "published" : "draft"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditor(article)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={`Delete ${article.title}`}
                      onClick={() => void remove(article)}
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
            <DialogTitle>{editing ? "Edit article" : "Create an article"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void save(event)} className="space-y-4">
            <TextField
              id="article-title"
              label="Title"
              value={draft.title}
              onChange={(v) =>
                setDraft({ ...draft, title: v, slug: editing ? draft.slug : slugify(v) })
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="article-slug"
                label="URL slug"
                value={draft.slug}
                onChange={(v) => setDraft({ ...draft, slug: slugify(v) })}
              />
              <TextField
                id="article-read-time"
                label="Reading time"
                value={draft.read_time}
                onChange={(v) => setDraft({ ...draft, read_time: v })}
              />
              <Field label="Publication date" id="article-date">
                <Input
                  id="article-date"
                  type="date"
                  value={draft.published_on}
                  onChange={(e) => setDraft({ ...draft, published_on: e.target.value })}
                />
              </Field>
            </div>
            <AreaField
              id="article-excerpt"
              label="Summary"
              value={draft.excerpt}
              onChange={(v) => setDraft({ ...draft, excerpt: v })}
              rows={2}
              maxLength={500}
            />
            <PhotoField
              id="article-photo"
              label="Cover photo"
              value={draft.image}
              onChange={(image) => setDraft({ ...draft, image })}
              alt={draft.image_alt || draft.title}
            />
            <TextField
              id="article-photo-alt"
              label="Photo description"
              value={draft.image_alt}
              onChange={(v) => setDraft({ ...draft, image_alt: v })}
            />
            <AreaField
              id="article-body"
              label="Article content"
              hint="Use ## Heading on a line by itself to start a section."
              value={draft.body_text}
              onChange={(v) => setDraft({ ...draft, body_text: v })}
              rows={10}
              maxLength={20000}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />{" "}
              Publish on the website
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="forest" disabled={busy}>
                {busy ? "Saving…" : "Save article"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
