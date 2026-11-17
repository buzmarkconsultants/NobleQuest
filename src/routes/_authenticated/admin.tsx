import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarCheck,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MessageSquareQuote,
  Map,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: `Admin Console | ${site.name}` },
      {
        name: "description",
        content: `Manage trips, bookings, quotes and website content for ${site.name}.`,
      },
      { property: "og:title", content: `Admin Console | ${site.name}` },
      {
        property: "og:description",
        content: `Manage trips, bookings, quotes and website content for ${site.name}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", Icon: CalendarCheck },
  { to: "/admin/quotes", label: "Quote requests", Icon: MessageSquareQuote },
  { to: "/admin/trips", label: "Trips & prices", Icon: Map },
  { to: "/admin/reviews", label: "Reviews", Icon: Star },
  { to: "/admin/articles", label: "Articles", Icon: BookOpen },
  { to: "/admin/subscribers", label: "Subscribers", Icon: Mail },
] as const;

function AdminLayout() {
  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Couldn't sign out: ${error.message}`);
      return;
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    void navigate({ to: "/auth", replace: true });
  };

  if (me.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!me.data?.isTeam) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md text-center">
          <Logo className="justify-center" />
          <h1 className="mt-8 text-3xl font-semibold">Waiting for access</h1>
          <p className="mt-3 text-muted-foreground">
            You're signed in as <strong className="text-foreground">{me.data?.email}</strong>, but
            an admin hasn't given you access to the console yet. Ask them to add you under{" "}
            <em>Staff</em>.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={() => void me.refetch()}>
              Check again
            </Button>
            <Button variant="forest" onClick={() => void signOut()}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const links = me.data.isAdmin
    ? [...nav, { to: "/admin/staff" as const, label: "Staff", Icon: Users }]
    : nav;

  return (
    <div className="min-h-screen bg-secondary/40 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:py-6">
          <Logo />
        </div>
        <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {links.map(({ to, label, Icon, ...rest }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: "exact" in rest }}
                  className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-primary" }}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-3 pb-3 lg:pb-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-lg px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
        <div className="hidden border-t border-border p-4 text-sm lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:block">
          <p className="truncate font-medium">{me.data.name}</p>
          <p className="text-xs text-muted-foreground">{me.data.isAdmin ? "Admin" : "Staff"}</p>
          <div className="mt-3 flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Website
              </a>
            </Button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
