/**
 * Shared trip types and destination info.
 * Trips, guest reviews and articles are stored in the database and edited in the admin console (/admin).
 * Destinations (and their photos) stay here because they change rarely.
 */
import { images } from "./images";

export type TripType = "safari" | "day-trip" | "beach" | "corporate";

export const tripTypeLabels: Record<TripType, { one: string; many: string; listing: "/safaris" | "/day-trips" | "/beach-holidays" | "/corporate" }> = {
  safari: { one: "Safari", many: "Safaris", listing: "/safaris" },
  "day-trip": { one: "Day trip", many: "Day Trips", listing: "/day-trips" },
  beach: { one: "Beach holiday", many: "Beach Holidays", listing: "/beach-holidays" },
  corporate: { one: "Corporate trip", many: "Corporate Trips", listing: "/corporate" },
};

export interface ItineraryDay {
  day: string;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  slug: string;
  type: TripType;
  title: string;
  destination: string;
  /** Days for multi-day trips; 1 for day trips */
  days: number;
  /** Hours for day trips */
  hours?: number | undefined;
  durationLabel: string;
  priceUSD: number;
  /** Smallest group that can book (e.g. corporate packages) */
  minGroup: number;
  pickup: string;
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string }[];
  summary: string;
  highlights: string[];
  itinerary: ItineraryDay[];
  included: string[];
  excluded: string[];
  faqs: { q: string; a: string }[];
  featured: boolean;
  groupSize: string;
}

export type DestinationSlug =
  | "maasai-mara"
  | "amboseli"
  | "tsavo"
  | "samburu"
  | "lake-nakuru"
  | "naivasha"
  | "nairobi"
  | "laikipia"
  | "diani"
  | "watamu"
  | "lamu"
  | "malindi";

export interface Destination {
  slug: DestinationSlug;
  name: string;
  region: string;
  image: string;
  imageAlt: string;
  blurb: string;
  bestTime: string;
  lat: number;
  lng: number;
  showInGrid: boolean;
  /** coast destinations link to the Beach Holidays page */
  coast?: boolean;
}

export const destinations: Destination[] = [
  {
    slug: "maasai-mara",
    name: "Maasai Mara",
    region: "Narok County",
    image: images.destinations["maasai-mara"],
    imageAlt: "Lion and cub resting on green grass in the Maasai Mara",
    blurb: "Big cats, endless plains and the world-famous Great Migration river crossings.",
    bestTime: "Jul – Oct",
    lat: -1.4061,
    lng: 35.0167,
    showInGrid: true,
  },
  {
    slug: "amboseli",
    name: "Amboseli",
    region: "Kajiado County",
    image: images.destinations["amboseli"],
    imageAlt: "Mount Kilimanjaro rising above acacia trees in Amboseli",
    blurb: "Giant-tusked elephants framed by the snowy peak of Mount Kilimanjaro.",
    bestTime: "Jun – Oct, Jan – Feb",
    lat: -2.6527,
    lng: 37.2606,
    showInGrid: true,
  },
  {
    slug: "tsavo",
    name: "Tsavo",
    region: "Taita-Taveta County",
    image: images.destinations["tsavo"],
    imageAlt: "Large elephant walking across open grassland in Tsavo",
    blurb: "Kenya's largest wilderness — red elephants, lava flows and Mzima Springs.",
    bestTime: "Jun – Oct",
    lat: -2.9833,
    lng: 38.4667,
    showInGrid: true,
  },
  {
    slug: "samburu",
    name: "Samburu",
    region: "Samburu County",
    image: images.destinations["samburu"],
    imageAlt: "Reticulated giraffes and Grevy's zebras by the river in Samburu",
    blurb: "Rugged northern frontier with the 'Samburu Special Five' and vibrant culture.",
    bestTime: "Jun – Oct, Dec – Mar",
    lat: 0.6167,
    lng: 37.5333,
    showInGrid: true,
  },
  {
    slug: "lake-nakuru",
    name: "Lake Nakuru",
    region: "Nakuru County",
    image: images.destinations["lake-nakuru"],
    imageAlt: "Thousands of pink flamingos wading in Lake Nakuru",
    blurb: "Flamingo-lined shores and a sanctuary for black and white rhinos.",
    bestTime: "Year-round",
    lat: -0.3667,
    lng: 36.0833,
    showInGrid: true,
  },
  {
    slug: "naivasha",
    name: "Naivasha & Hell's Gate",
    region: "Nakuru County",
    image: images.destinations["naivasha"],
    imageAlt: "Hippos and pelicans on Lake Naivasha at golden hour",
    blurb: "Boat rides among hippos, walking safaris and cycling through Hell's Gate gorge.",
    bestTime: "Year-round",
    lat: -0.7667,
    lng: 36.4333,
    showInGrid: true,
  },
  {
    slug: "nairobi",
    name: "Nairobi",
    region: "Nairobi County",
    image: images.destinations["nairobi"],
    imageAlt: "Nairobi city skyline at sunrise",
    blurb: "The only capital city with a national park — lions with a skyline view.",
    bestTime: "Year-round",
    lat: -1.3733,
    lng: 36.8581,
    showInGrid: false,
  },
  {
    slug: "laikipia",
    name: "Ol Pejeta & Laikipia",
    region: "Laikipia County",
    image: images.destinations["laikipia"],
    imageAlt: "Two rhinos walking across a dusty plain",
    blurb: "Home to the last northern white rhinos and a chimpanzee sanctuary.",
    bestTime: "Year-round",
    lat: 0.0,
    lng: 36.9,
    showInGrid: false,
  },
  {
    slug: "diani",
    name: "Diani Beach",
    region: "Kwale County",
    image: images.destinations["diani"],
    imageAlt: "Palm trees leaning over the white sand of Diani Beach",
    blurb: "Powder-white sand, turquoise lagoons, colobus monkeys and kitesurfing.",
    bestTime: "Dec – Mar, Jul – Oct",
    lat: -4.3167,
    lng: 39.5833,
    showInGrid: false,
    coast: true,
  },
  {
    slug: "watamu",
    name: "Watamu",
    region: "Kilifi County",
    image: images.destinations["watamu"],
    imageAlt: "Turquoise water and coral islets in Watamu Marine Park",
    blurb: "Protected coral gardens, sea turtles and the Gede ruins in the forest.",
    bestTime: "Oct – Apr",
    lat: -3.3540,
    lng: 40.0240,
    showInGrid: false,
    coast: true,
  },
  {
    slug: "lamu",
    name: "Lamu Island",
    region: "Lamu County",
    image: images.destinations["lamu"],
    imageAlt: "Narrow stone street in Lamu Old Town with a donkey",
    blurb: "A UNESCO Swahili town with no cars, dhow sailing and quiet dunes.",
    bestTime: "Nov – Mar",
    lat: -2.2717,
    lng: 40.9020,
    showInGrid: false,
    coast: true,
  },
  {
    slug: "malindi",
    name: "Malindi",
    region: "Kilifi County",
    image: images.destinations["malindi"],
    imageAlt: "Fishing boats on the beach at Malindi",
    blurb: "Historic coastal town with marine parks, Italian flavour and Marafa canyon.",
    bestTime: "Oct – Apr",
    lat: -3.2192,
    lng: 40.1169,
    showInGrid: false,
    coast: true,
  },
];

export function getDestination(slug: string) {
  return destinations.find((d) => d.slug === slug);
}

export interface Testimonial {
  id: string;
  name: string;
  country: string;
  flag: string;
  rating: number;
  trip: string;
  quote: string;
  source: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  readTime: string;
  date: string;
  body: { heading: string; text: string }[];
}
