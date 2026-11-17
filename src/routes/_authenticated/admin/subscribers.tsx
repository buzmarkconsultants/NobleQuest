import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminDataState, AdminHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, fmtDate } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/subscribers")({
  component: SubscribersPage,
});

function SubscribersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const subscribers = useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (subscribers.data ?? []).filter((row) => row.email.toLowerCase().includes(needle));
  }, [subscribers.data, search]);

  const remove = async (id: string, email: string) => {
    if (!window.confirm(`Remove ${email} from the newsletter list?`)) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) {
      toast.error(`Couldn't remove subscriber: ${error.message}`);
      return;
    }
    toast.success("Subscriber removed.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "subscribers"] });
  };

  return (
    <>
      <AdminHeader
        title="Subscribers"
        description={`${subscribers.data?.length ?? "…"} newsletter subscribers`}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv("noblequest-subscribers.csv", [
                ["Email", "Subscribed"],
                ...rows.map((r) => [r.email, fmtDate(r.created_at)]),
              ])
            }
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-4">
        <Input
          aria-label="Search subscribers"
          placeholder="Search email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg sm:max-w-sm"
        />
      </div>
      <AdminDataState
        loading={subscribers.isLoading}
        error={subscribers.error}
        empty={rows.length === 0}
        retry={() => void subscribers.refetch()}
      >
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Subscribed</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-medium">{row.email}</td>
                <td className="px-4 py-3">{fmtDate(row.created_at)}</td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void remove(row.id, row.email)}
                  >
                    <Trash2 /> Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminDataState>
    </>
  );
}
