/**
 * PHOTO LIBRARY — every spot on the website has its OWN photo file.
 * No two spots share a file, so replacing one photo never changes another.
 *
 * To change a photo: replace the file at the path shown (keep the same name).
 *   src/assets/home/          → home page photos
 *   src/assets/page-headers/  → the big banner at the top of each page
 *   src/assets/destinations/  → one photo per destination
 *   src/assets/blog/          → one photo per article
 *   src/assets/tours/<tour>/  → cover + gallery photos for each trip
 *
 * Trips and articles saved in the database refer to photos by these paths
 * (e.g. "tours/4-day-diani-beach-escape/1-cover.jpg"). Photos uploaded in the
 * admin console are stored online and arrive as full web addresses.
 */
const files = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

/** Turn a saved photo path ("tours/x/1-cover.jpg") or web address into something an <img> can show. */
export function photo(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path) || path.startsWith("/assets/")) return path;
  return files[`/src/assets/${path.replace(/^\/+/, "")}`] ?? "";
}

export const images = {
  home: {
    hero: photo("home/hero.jpg"),
    migrationBanner: photo("home/migration-banner.jpg"),
    quoteSection: photo("home/quote-section.jpg"),
  },
  pageHeaders: {
    about: photo("page-headers/about.jpg"),
    blog: photo("page-headers/blog.jpg"),
    contact: photo("page-headers/contact.jpg"),
    dayTrips: photo("page-headers/day-trips-new.jpg"),
    destinations: photo("page-headers/destinations.jpg"),
    reviews: photo("page-headers/reviews.jpg"),
    safaris: photo("page-headers/safaris-new.jpg"),
    beachHolidays: photo("page-headers/beach-holidays-new.jpg"),
    corporate: photo("page-headers/corporate.jpg"),
    staff: photo("page-headers/staff-sign-in.jpg"),
  },
  destinations: {
    amboseli: photo("destinations/amboseli.jpg"),
    laikipia: photo("destinations/laikipia.jpg"),
    "lake-nakuru": photo("destinations/lake-nakuru.jpg"),
    "maasai-mara": photo("destinations/maasai-mara.jpg"),
    nairobi: photo("destinations/nairobi.jpg"),
    naivasha: photo("destinations/naivasha.jpg"),
    samburu: photo("destinations/samburu.jpg"),
    tsavo: photo("destinations/tsavo.jpg"),
    diani: photo("destinations/diani-new.jpg"),
    watamu: photo("destinations/watamu-new.jpg"),
    lamu: photo("destinations/lamu-new.jpg"),
    malindi: photo("destinations/malindi.jpg"),
  },
};

export function isUnsplash(src: string) {
  return src.startsWith("https://images.unsplash.com/");
}

/** Sized URL for remote Unsplash photos; other photos are returned unchanged. */
export function unsplashSized(src: string, w: number, h?: number) {
  if (!isUnsplash(src)) return src;
  return `${src}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=75`;
}
