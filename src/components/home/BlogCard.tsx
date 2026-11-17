import { Link } from "@tanstack/react-router";
import { SmartImage } from "@/components/site/SmartImage";
import type { BlogPost } from "@/data/tours";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="zoom-img group">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
        <div className="aspect-[3/2] overflow-hidden rounded-3xl">
          <SmartImage src={post.image} alt={post.imageAlt} width={640} />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-accent">{post.readTime}</p>
        <h3 className="mt-2 text-2xl font-semibold leading-snug group-hover:text-primary">{post.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
      </Link>
    </article>
  );
}
