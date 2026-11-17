import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, UserPlus, UserRoundX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminDataState, AdminHeader, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { useMe } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/staff")({
  component: StaffPage,
});

type Role = { id: string; user_id: string; role: Enums<"app_role">; created_at: string };
type Profile = { id: string; email: string | null; full_name: string | null };

function StaffPage() {
  const queryClient = useQueryClient();
  const me = useMe();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Enums<"app_role">>("staff");
  const [busy, setBusy] = useState(false);
  const staff = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name").order("full_name"),
        supabase.from("user_roles").select("id, user_id, role, created_at").order("created_at"),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      return {
        profiles: (profilesResult.data ?? []) as Profile[],
        roles: (rolesResult.data ?? []) as Role[],
      };
    },
  });

  const addRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      toast.error("Choose a team member first.");
      return;
    }
    if (staff.data?.roles.some((item) => item.user_id === userId && item.role === role)) {
      toast.error("That team member already has this role.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    setBusy(false);
    if (error) {
      toast.error(`Couldn't add team access: ${error.message}`);
      return;
    }
    toast.success("Team access granted.");
    setUserId("");
    await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
  };

  const removeRole = async (item: Role, name: string) => {
    if (item.user_id === me.data?.id) {
      toast.error("You can't remove your own access here.");
      return;
    }
    if (!window.confirm(`Remove ${item.role} access for ${name}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", item.id);
    if (error) {
      toast.error(`Couldn't remove access: ${error.message}`);
      return;
    }
    toast.success("Team access removed.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
  };

  const profiles = staff.data?.profiles ?? [];
  const roles = staff.data?.roles ?? [];
  const profileFor = (id: string) => profiles.find((profile) => profile.id === id);
  const candidates = profiles.filter(
    (profile) => !roles.some((item) => item.user_id === profile.id && item.role === role),
  );

  return (
    <>
      <AdminHeader title="Staff" description="Manage who can access the admin console." />
      <form
        onSubmit={(event) => void addRole(event)}
        className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card"
      >
        <h2 className="flex items-center gap-2 font-semibold">
          <UserPlus className="h-4 w-4 text-accent" /> Grant access
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Team members must create an account on the sign-in page before they appear here.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            aria-label="Team member"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Choose a team member</option>
            {candidates.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || profile.email || profile.id} ({profile.email || "no email"})
              </option>
            ))}
          </select>
          <select
            aria-label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value === "admin" ? "admin" : "staff")}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm sm:w-40"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            type="submit"
            variant="forest"
            disabled={busy || staff.isLoading || candidates.length === 0}
          >
            <Shield /> Grant access
          </Button>
        </div>
      </form>
      <AdminDataState
        loading={staff.isLoading}
        error={staff.error}
        empty={roles.length === 0}
        retry={() => void staff.refetch()}
      >
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Team member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((item) => {
              const profile = profileFor(item.user_id);
              const name = profile?.full_name || profile?.email || item.user_id;
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{name}</p>
                    <p className="break-all text-xs text-muted-foreground">
                      {profile?.email || item.user_id}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.role} />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.user_id === me.data?.id}
                      onClick={() => void removeRole(item, name)}
                    >
                      <UserRoundX /> Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminDataState>
    </>
  );
}
