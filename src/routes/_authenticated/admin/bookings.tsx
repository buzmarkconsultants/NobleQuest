import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminDataState, AdminHeader, AreaField, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BOOKING_STATUSES, downloadCsv, fmtDate, usd } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: BookingsPage,
});

type Booking = {
  id: string;
  reference: string;
  trip_title: string;
  trip_type: string;
  travel_date: string;
  travelers: number;
  full_name: string;
  email: string;
  phone: string;
  country: string | null;
  pickup_location: string | null;
  notes: string | null;
  admin_notes: string | null;
  payment_method: string;
  payment_plan: string;
  total_usd: number;
  amount_due_usd: number;
  status: string;
  created_at: string;
};

function BookingsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [notes, setNotes] = useState("");
  const bookings = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (bookings.data ?? []).filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const matchesSearch =
        !needle ||
        [row.reference, row.full_name, row.email, row.trip_title].some((v) =>
          v.toLowerCase().includes(needle),
        );
      return matchesStatus && matchesSearch;
    });
  }, [bookings.data, search, status]);

  const changeStatus = async (id: string, value: string) => {
    const { error } = await supabase.from("bookings").update({ status: value }).eq("id", id);
    if (error) {
      toast.error(`Couldn't update booking: ${error.message}`);
      return;
    }
    toast.success("Booking status updated.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
  };

  const openDetails = (row: Booking) => {
    setSelected(row);
    setNotes(row.admin_notes ?? "");
  };

  const saveNotes = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("bookings")
      .update({ admin_notes: notes.trim() || null })
      .eq("id", selected.id);
    if (error) {
      toast.error(`Couldn't save notes: ${error.message}`);
      return;
    }
    toast.success("Booking notes saved.");
    setSelected(null);
    await queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
  };

  return (
    <>
      <AdminHeader
        title="Bookings"
        description="Review guest details, payment plans and travel dates."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv("noblequest-bookings.csv", [
                [
                  "Reference",
                  "Guest",
                  "Email",
                  "Trip",
                  "Travel date",
                  "Travelers",
                  "Total USD",
                  "Amount due USD",
                  "Status",
                ],
                ...rows.map((r) => [
                  r.reference,
                  r.full_name,
                  r.email,
                  r.trip_title,
                  r.travel_date,
                  r.travelers,
                  r.total_usd,
                  r.amount_due_usd,
                  r.status,
                ]),
              ])
            }
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label="Search bookings"
          placeholder="Search reference, guest, email or trip…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg sm:max-w-sm"
        />
        <select
          aria-label="Filter bookings by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm sm:w-48"
        >
          <option value="all">All statuses</option>
          {BOOKING_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.replace("-", " ")}
            </option>
          ))}
        </select>
      </div>
      <AdminDataState
        loading={bookings.isLoading}
        error={bookings.error}
        empty={rows.length === 0}
        retry={() => void bookings.refetch()}
      >
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Booking / guest</th>
              <th className="px-4 py-3">Trip / date</th>
              <th className="px-4 py-3">Travelers / total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{row.reference}</p>
                  <p>{row.full_name}</p>
                  <a className="text-xs text-primary hover:underline" href={`mailto:${row.email}`}>
                    {row.email}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.trip_title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(row.travel_date)}</p>
                </td>
                <td className="px-4 py-3">
                  {row.travelers} · {usd(row.total_usd)}
                  <p className="text-xs text-muted-foreground">Due {usd(row.amount_due_usd)}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={row.status} />
                    <select
                      aria-label={`Status for ${row.reference}`}
                      value={row.status}
                      onChange={(e) => void changeStatus(row.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {BOOKING_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {value.replace("-", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => openDetails(row)}>
                    <Eye /> View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminDataState>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Booking {selected.reference}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Guest</span>
                  <br />
                  {selected.full_name}
                </p>
                <p>
                  <span className="text-muted-foreground">Contact</span>
                  <br />
                  {selected.email} · {selected.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Trip</span>
                  <br />
                  {selected.trip_title} ({selected.trip_type})
                </p>
                <p>
                  <span className="text-muted-foreground">Travel date</span>
                  <br />
                  {fmtDate(selected.travel_date)} · {selected.travelers} travelers
                </p>
                <p>
                  <span className="text-muted-foreground">Payment</span>
                  <br />
                  {selected.payment_method} · {selected.payment_plan}
                </p>
                <p>
                  <span className="text-muted-foreground">Pickup</span>
                  <br />
                  {selected.pickup_location || "Not specified"}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Guest notes</span>
                  <br />
                  {selected.notes || "None"}
                </p>
              </div>
              <AreaField
                id="booking-admin-notes"
                label="Internal notes"
                value={notes}
                onChange={setNotes}
                rows={3}
              />
              <div className="flex justify-end">
                <Button variant="forest" onClick={() => void saveNotes()}>
                  Save notes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
