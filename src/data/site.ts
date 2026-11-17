/**
 * Business details — edit here to rename the company or update contacts.
 * Everything on the site (navbar, footer, WhatsApp button, SEO titles) reads from this file.
 */
export const site = {
  name: "NobleQuest Safaris",
  shortName: "NobleQuest",
  // small line under the name in the logo
  logoSubtitle: "Safaris",
  tagline: "Safaris & day trips across Kenya",
  phone: "+254 700 123 456",
  whatsappNumber: "254700123456", // international format, digits only
  whatsappMessage: "Hello NobleQuest Safaris! I'd like to plan a trip.",
  email: "hello@noblequestsafaris.co.ke",
  address: "Westlands, Nairobi, Kenya",
  hours: "Mon–Sat, 7:00am – 8:00pm EAT",
  licenseNo: "TRA/TO/2026/XXXX",
  kato: "KATO Member No. XXXX",
  socials: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    youtube: "https://youtube.com/",
    twitter: "https://x.com/",
  },
  ratings: {
    tripadvisor: { score: 5.0, count: 412 },
    google: { score: 4.9, count: 268 },
  },
};

export function whatsappLink(message: string = site.whatsappMessage) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
