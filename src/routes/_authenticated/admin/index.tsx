import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Mail, Map, MessageSquareQuote } from "lucide-react";
import { AdminHeader, Empty, StatusBadge } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, useMe, usd } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

async function count(table: "bookings" | "quote_requests" | "trips" | "newsletter_subscribers", filter?: [string, string | boolean]) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count: n } = await q;
  return n ?? 0;
}

function Dashboard() {
  const me = useMe();
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [newBookings, newQuotes, trips, subs, recent, quotes] = await Promise.all([
        count("bookings", ["status", "new"]),
        count("quote_requests", ["status", "new"]),
        count("trips", ["published", true]),
        count("newsletter_subscribers"),
        supabase.from("bookings").select("id, reference, full_name, trip_title, travel_date, travelers, total_usd, status").order("created_at", { ascending: false }).limit(6),
        supabase.from("quote_requests").select("id, kind, full_name, company, travel_dates, group_size, status").order("created_at", { ascending: false }).limit(6),
      ]);
      return { newBookings, newQuotes, trips, subs, recent: recent.data ?? [], quotes: quotes.data ?? [] };
    },
  });
  const s = stats.data;
  const cards = [
    { label: "New bookings", value: s?.newBookings, to: "/admin/bookings" as const, Icon: CalendarCheck },
    { label: "New quote requests", value: s?.newQuotes, to: "/admin/quotes" as const, Icon: MessageSquareQuote },
    { label: "Trips on the website", value: s?.trips, to: "/admin/trips" as const, Icon: Map },
    { label: "Newsletter subscribers", value: s?.subs, to: "/admin/subscribers" as const, Icon: Mail },
  ];

  return (
    <>
      <AdminHeader title={`Jambo${me.data?.name ? `, ${me.data.name.split(" ")[0]}` : ""}`} description="Here's what's happening today." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, to, Icon }) => (
          <Link key={label} to={to} className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5">
            <Icon className="h-5 w-5 text-accent" />
            <p className="mt-3 font-display text-4xl font-semibold">{value ?? "…"}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Latest bookings</h2>
            <Link to="/admin/bookings" className="text-sm text-primary hover:underline">See all</Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {s?.recent.length === 0 && <Empty>No bookings yet.</Empty>}
            {s?.recent.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.full_name} · <span className="text-muted-foreground">{b.reference}</span></p>
                  <p className="truncate text-muted-foreground">{b.trip_title} · {fmtDate(b.travel_date)} · {b.travelers} pax · {usd(b.total_usd)}</p>
                </div>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Latest quote requests</h2>
            <Link to="/admin/quotes" className="text-sm text-primary hover:underline">See all</Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {s?.quotes.length === 0 && <Empty>No quote requests yet.</Empty>}
            {s?.quotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{q.company || q.full_name} {q.kind === "corporate" && <span className="text-xs text-accent">· Corporate</span>}</p>
                  <p className="truncate text-muted-foreground">{q.travel_dates || "Dates flexible"} · {q.group_size || "?"} people</p>
                </div>
                <StatusBadge status={q.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
