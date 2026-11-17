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
import { downloadCsv, fmtDate, QUOTE_STATUSES } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/quotes")({
  component: QuotesPage,
});

type Quote = {
  id: string;
  kind: string;
  full_name: string;
  email: string;
  phone: string;
  company: string | null;
  travel_dates: string | null;
  group_size: string | null;
  budget: string | null;
  interests: string[];
  trip_slug: string | null;
  message: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
};

function QuotesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Quote | null>(null);
  const [notes, setNotes] = useState("");
  const quotes = useQuery({
    queryKey: ["admin", "quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quote[];
    },
  });

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (quotes.data ?? []).filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const matchesSearch =
        !needle ||
        [row.full_name, row.email, row.company ?? "", row.trip_slug ?? ""].some((v) =>
          v.toLowerCase().includes(needle),
        );
      return matchesStatus && matchesSearch;
    });
  }, [quotes.data, search, status]);

  const changeStatus = async (id: string, value: string) => {
    const { error } = await supabase.from("quote_requests").update({ status: value }).eq("id", id);
    if (error) {
      toast.error(`Couldn't update request: ${error.message}`);
      return;
    }
    toast.success("Request status updated.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "quotes"] });
  };

  const openDetails = (row: Quote) => {
    setSelected(row);
    setNotes(row.admin_notes ?? "");
  };

  const saveNotes = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("quote_requests")
      .update({ admin_notes: notes.trim() || null })
      .eq("id", selected.id);
    if (error) {
      toast.error(`Couldn't save notes: ${error.message}`);
      return;
    }
    toast.success("Request notes saved.");
    setSelected(null);
    await queryClient.invalidateQueries({ queryKey: ["admin", "quotes"] });
  };

  return (
    <>
      <AdminHeader
        title="Quote requests"
        description="Follow up on custom itineraries and corporate enquiries."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv("noblequest-quote-requests.csv", [
                [
                  "Name",
                  "Email",
                  "Phone",
                  "Company",
                  "Travel dates",
                  "Group size",
                  "Budget",
                  "Status",
                ],
                ...rows.map((r) => [
                  r.full_name,
                  r.email,
                  r.phone,
                  r.company,
                  r.travel_dates,
                  r.group_size,
                  r.budget,
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
          aria-label="Search quote requests"
          placeholder="Search name, company or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg sm:max-w-sm"
        />
        <select
          aria-label="Filter requests by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm sm:w-48"
        >
          <option value="all">All statuses</option>
          {QUOTE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      <AdminDataState
        loading={quotes.isLoading}
        error={quotes.error}
        empty={rows.length === 0}
        retry={() => void quotes.refetch()}
      >
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Enquiry</th>
              <th className="px-4 py-3">Travel plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{row.company || row.full_name}</p>
                  <p>
                    {row.full_name}
                    {row.kind === "corporate" ? " · Corporate" : ""}
                  </p>
                  <a className="text-xs text-primary hover:underline" href={`mailto:${row.email}`}>
                    {row.email}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <p>
                    {row.travel_dates || "Dates flexible"} ·{" "}
                    {row.group_size || "Group size not given"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.budget || "Budget not given"}
                    {row.trip_slug ? ` · ${row.trip_slug}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={row.status} />
                    <select
                      aria-label={`Status for ${row.full_name}`}
                      value={row.status}
                      onChange={(e) => void changeStatus(row.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {QUOTE_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {value}
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
                <DialogTitle>Quote request</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Contact</span>
                  <br />
                  {selected.full_name} · {selected.email} · {selected.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Company / kind</span>
                  <br />
                  {selected.company || "Personal"} · {selected.kind}
                </p>
                <p>
                  <span className="text-muted-foreground">Travel plan</span>
                  <br />
                  {selected.travel_dates || "Flexible dates"} ·{" "}
                  {selected.group_size || "Group size not specified"}
                </p>
                <p>
                  <span className="text-muted-foreground">Budget / trip</span>
                  <br />
                  {selected.budget || "Not specified"} · {selected.trip_slug || "Custom itinerary"}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Interests</span>
                  <br />
                  {selected.interests.join(", ") || "None specified"}
                </p>
                <p className="sm:col-span-2 whitespace-pre-wrap">
                  <span className="text-muted-foreground">Message</span>
                  <br />
                  {selected.message || "No message"}
                </p>
                <p>
                  <span className="text-muted-foreground">Received</span>
                  <br />
                  {fmtDate(selected.created_at)}
                </p>
              </div>
              <AreaField
                id="quote-admin-notes"
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
