import { createFileRoute } from "@tanstack/react-router";
import { BlogCard } from "@/components/home/BlogCard";
import { PageHeader } from "@/components/site/PageHeader";
import { images } from "@/data/images";
import { loadArticles } from "@/lib/content";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Kenya Safari Travel Tips | NobleQuest Safaris" },
      { name: "description", content: "Expert advice on the best time to visit the Maasai Mara, what to pack and the Great Migration calendar." },
      { property: "og:title", content: "Kenya Safari Travel Tips | NobleQuest Safaris" },
      { property: "og:description", content: "Expert advice on the best time to visit the Maasai Mara, what to pack and the Great Migration calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async () => ({ posts: await loadArticles() }),
  component: BlogIndex,
});

function BlogIndex() {
  const { posts: blogPosts } = Route.useLoaderData();
  return (
    <>
      <PageHeader eyebrow="Travel tips" title="Safari guides & advice" image={images.pageHeaders.blog} imageAlt="Zebras in golden grass" />
      <section className="container-site grid gap-8 py-16 md:grid-cols-3">
        {blogPosts.map((p) => <BlogCard key={p.slug} post={p} />)}
      </section>
    </>
  );
}
