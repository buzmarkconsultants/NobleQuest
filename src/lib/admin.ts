/** Helpers for the staff admin console. All reads/writes use the signed-in user's session, so database rules decide access. */
import { useQuery } from "@tanstack/react-query";
import { photo } from "@/data/images";
import { supabase } from "@/integrations/supabase/client";
import { PHOTO_BUCKET, UPLOAD_PREFIX } from "@/lib/content.functions";

export const BOOKING_STATUSES = ["new", "confirmed", "deposit-paid", "paid", "completed", "cancelled"] as const;
export const QUOTE_STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
export const TRIP_TYPES = [
  { value: "safari", label: "Safari" },
  { value: "day-trip", label: "Day trip" },
  { value: "beach", label: "Beach holiday" },
  { value: "corporate", label: "Corporate trip" },
] as const;

export function useMe() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const list = (roles ?? []).map((r) => r.role);
      return {
        id: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.["full_name"] as string | undefined) || user.email || "",
        isAdmin: list.includes("admin"),
        isTeam: list.length > 0,
      };
    },
    staleTime: 60_000,
  });
}

/** Turn a saved photo value (built-in file name or uploaded file) into something the browser can show. */
export function usePhotoUrl(path: string) {
  const uploaded = path.startsWith(UPLOAD_PREFIX);
  const q = useQuery({
    queryKey: ["admin", "photo", path],
    enabled: uploaded,
    queryFn: async () => {
      const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60);
      return data?.signedUrl ?? "";
    },
    staleTime: 30 * 60_000,
  });
  return uploaded ? (q.data ?? "") : photo(path);
}

export async function uploadPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Photos must be under 10 MB.");
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${UPLOAD_PREFIX}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error("Upload failed. Please try again.");
  return path;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 120);

export const linesToList = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function downloadCsv(name: string, rows: (string | number | null)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
