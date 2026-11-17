# NobleQuest Safaris

Build a mobile-first, high-converting homepage and supporting pages for a Kenyan tours and travels company offering SAFARIS and LOCAL DAY TRIPS. Use the placeholder business name "NobleQuest Safaris" (easy to rename). 

DESIGN: Warm, earthy safari palette (deep forest green, sand/cream, terracotta/sunset orange accent, charcoal text). Elegant serif headings (e.g. Playfair Display) with clean sans-serif body (e.g. Inter). Large, full-bleed wildlife and landscape photography (use high-quality Unsplash placeholder images of Maasai Mara, Amboseli with Kilimanjaro, giraffes, elephants, Lake Naivasha, Hell's Gate). Fast, lightweight, lazy-loaded images, rounded cards, subtle hover animations.

HOMEPAGE SECTIONS (in order):
1. Sticky navbar: logo, Safaris, Day Trips, Destinations, About, Reviews, Contact, and a prominent "Book Now" button. Mobile hamburger menu.
2. Hero: full-screen image with headline "Experience the Wild Heart of Kenya", subtext, and two CTAs: "Explore Safaris" and "Book a Day Trip". Small trust row beneath: "Licensed & Insured", "Local Expert Guides", "Pay with M-Pesa or Card".
3. Quick search/filter bar: destination, trip type (Safari / Day Trip), duration, number of travelers, and a Search button.
4. Featured Safaris (3 cards): e.g. "3-Day Maasai Mara Classic" , "4-Day Amboseli & Tsavo Explorer", "5-Day Mara & Lake Nakuru Combo". Each card shows image, duration badge, "From $X per person", highlights, and "View Details" + "Request Quote" buttons.
5. Popular Day Trips (4 cards): Nairobi National Park, Hell's Gate & Lake Naivasha, Giraffe Centre & Karen Blixen Museum, Ol Pejeta/Sheldrick Elephant Orphanage. Each shows price in KES and USD, duration, pickup point, and an instant "Book Now" button.
6. Why Choose Us: 4 icon blocks (expert local guides, 4x4 safari vehicles with pop-up roofs, flexible custom itineraries, transparent pricing with no hidden fees).
7. Destinations grid: Maasai Mara, Amboseli, Tsavo, Samburu, Lake Nakuru, Naivasha with hover overlays.
8. How It Works: 3 steps (Choose your trip, Confirm & pay a deposit via M-Pesa or card, Enjoy your adventure).
9. Custom Safari Request form: name, email, phone/WhatsApp, travel dates, group size, budget range, interests (Big Five, Migration, Photography, Culture, Family), message. Submit button "Get My Free Quote".
10. Testimonials carousel with star ratings, guest names, country flags, plus TripAdvisor and Google review badges.
11. Great Migration teaser banner with best-months info and a CTA.
12. Blog/Travel Tips preview (3 cards, e.g. "Best Time to Visit the Maasai Mara", "What to Pack for a Safari", "Great Migration Calendar").
13. Footer: contact details, tourism license number placeholder, social icons, newsletter signup, payment method icons (M-Pesa, Visa, Mastercard).

GLOBAL FEATURES:
- Floating WhatsApp chat button on every page (click-to-chat link).
- Currency toggle between USD and KES.
- Individual tour detail page template with: image gallery, day-by-day itinerary accordion, included/excluded lists, map placeholder, FAQs, sidebar booking card with date picker, traveler count, and "Book Now / Request Quote" buttons.
- Separate /safaris and /day-trips listing pages with filters (price, duration, destination).
- Booking flow: select a date and travelers, enter details, then pay by M-Pesa Sandbox STK Push or use the card demo. M-Pesa bookings are confirmed only after the Safaricom callback verifies payment.
- SEO-friendly page titles and meta descriptions, semantic HTML, accessible contrast and alt text.

Keep the code clean, componentized, and easy to edit. Use placeholder data in a single data file so tours can be added or changed easily.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/998b7a16-68cc-4718-868a-ce7ac7c08ef0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## M-Pesa Sandbox

Configure these as server-side Lovable secrets; do not commit their values:

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL` — a publicly reachable HTTPS URL ending in `/api/mpesa/callback`

The checkout currently uses Daraja Sandbox, so test transactions do not charge real money. The Supabase `mpesa_payments` table must match the fields declared in `src/lib/mpesa.types.ts`. Card payments remain demo-only.
