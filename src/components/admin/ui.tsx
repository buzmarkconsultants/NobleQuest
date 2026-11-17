import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadPhoto, usePhotoUrl } from "@/lib/admin";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  id,
  hint,
  className,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  id,
  value,
  onChange,
  hint,
  type = "text",
  className,
  maxLength = 200,
}: {
  label: string;
  id: string;
  value: string | number;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  className?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} id={id} {...(hint ? { hint } : {})} {...(className ? { className } : {})}>
      <Input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg"
      />
    </Field>
  );
}

export function AreaField({
  label,
  id,
  value,
  onChange,
  hint,
  rows = 4,
  className,
  maxLength = 5000,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
  className?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} id={id} {...(hint ? { hint } : {})} {...(className ? { className } : {})}>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg"
      />
    </Field>
  );
}

const statusTone: Record<string, string> = {
  new: "bg-accent text-accent-foreground",
  confirmed: "bg-primary text-primary-foreground",
  "deposit-paid": "bg-gold text-foreground",
  paid: "bg-primary text-primary-foreground",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
  contacted: "bg-gold text-foreground",
  quoted: "bg-primary/80 text-primary-foreground",
  won: "bg-primary text-primary-foreground",
  lost: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("rounded-full border-0 capitalize", statusTone[status] ?? "bg-secondary")}>
      {status.replace("-", " ")}
    </Badge>
  );
}

export function Thumb({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const src = usePhotoUrl(path);
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={cn("rounded-lg object-cover", className)} />
  ) : (
    <div className={cn("rounded-lg bg-muted", className)} aria-label="No photo" />
  );
}

export function PhotoField({
  label,
  id,
  value,
  onChange,
  alt,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (path: string) => void;
  alt: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadPhoto(file));
      toast.success("Photo uploaded — remember to save.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <Field label={label} id={id}>
      <div className="flex items-center gap-3">
        <Thumb path={value} alt={alt} className="h-20 w-28 shrink-0" />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {value ? "Replace photo" : "Upload photo"}
          </button>
          <span className="text-xs text-muted-foreground">JPG or PNG, under 10 MB</span>
        </div>
        <input
          id={id}
          ref={ref}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </div>
    </Field>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function AdminDataState({
  loading,
  error,
  empty,
  retry,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  retry: () => void;
  children: React.ReactNode;
}) {
  if (loading) return <Empty>Loading…</Empty>;
  if (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return (
      <div role="alert" className="rounded-2xl border border-destructive/30 bg-card p-6 text-sm">
        <p>Couldn't load this section: {message}</p>
        <button
          type="button"
          className="mt-3 font-medium text-primary hover:underline"
          onClick={retry}
        >
          Try again
        </button>
      </div>
    );
  }
  if (empty) return <Empty>No records yet.</Empty>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      {children}
    </div>
  );
}
