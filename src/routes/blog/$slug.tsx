import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { unsplashSized } from "@/data/images";
import { site } from "@/data/site";
import { loadArticles } from "@/lib/content";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = (await loadArticles()).find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [
          { title: `Article unavailable | ${site.name}` },
          { name: "robots", content: "noindex" },
        ],
      };
    const { post } = loaderData;
    const title = `${post.title} | ${site.name}`;
    const img = unsplashSized(post.image, 1200, 630);
    return {
      meta: [
        { title },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img.startsWith("https://")
          ? [
              { property: "og:image", content: img },
              { name: "twitter:image", content: img },
            ]
          : []),
      ],
    };
  },
  component: PostPage,
});

function PostPage() {
  const { post } = Route.useLoaderData();
  return (
    <article>
      <PageHeader
        eyebrow={post.readTime}
        title={post.title}
        description={post.excerpt}
        image={post.image}
        imageAlt={post.imageAlt}
      />
      <div className="container-site max-w-3xl py-16">
        {post.body.map((b, index) => (
          <section key={`${index}-${b.heading}`} className="mb-10">
            <h2 className="text-2xl font-semibold">{b.heading}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{b.text}</p>
          </section>
        ))}
        <Link to="/safaris" className="font-semibold text-accent hover:underline">
          Explore our safaris →
        </Link>
      </div>
    </article>
  );
}
