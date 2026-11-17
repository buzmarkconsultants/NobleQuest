import { isUnsplash } from "@/data/images";
import { cn } from "@/lib/utils";

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  /** Largest rendered width in px — used to build a responsive srcset */
  width?: number;
  height?: number;
  priority?: boolean;
}

const widths = [480, 768, 1080, 1600, 2000];

/** Lazy-loaded, responsive image. Unsplash URLs get automatic srcset sizing. */
export function SmartImage({ src, alt, width = 1080, height, priority, className, sizes, ...rest }: Props) {
  if (!src) {
    return <div role="img" aria-label={alt} className={cn("h-full w-full bg-muted", className)} />;
  }
  const unsplash = isUnsplash(src);
  const url = (w: number) => `${src}?auto=format&fit=crop&w=${w}&q=70`;
  const set = unsplash ? widths.filter((w) => w <= width * 2).map((w) => `${url(w)} ${w}w`).join(", ") : undefined;

  return (
    <img
      src={unsplash ? url(width) : src}
      srcSet={set}
      sizes={sizes ?? (unsplash ? `(max-width: 768px) 100vw, ${width}px` : undefined)}
      alt={alt}
      width={width}
      height={height ?? Math.round(width * 0.7)}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      className={cn("h-full w-full object-cover", className)}
      {...rest}
    />
  );
}
