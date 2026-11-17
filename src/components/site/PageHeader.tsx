import type { ReactNode } from "react";
import { SmartImage } from "./SmartImage";

export function PageHeader({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image: string;
  imageAlt: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <SmartImage src={image} alt={imageAlt} width={2000} sizes="100vw" priority className="absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-hero-overlay" />
      <div className="container-site py-20 md:py-28">
        {eyebrow && <p className="eyebrow mb-3 text-accent-soft">{eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-on-image md:text-6xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-on-image-muted md:text-lg">{description}</p>}
        {children}
      </div>
    </section>
  );
}
