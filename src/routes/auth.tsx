import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { images } from "@/data/images";
import { site } from "@/data/site";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Staff Sign-in | ${site.name}` },
      { name: "description", content: `Team sign-in for the ${site.name} admin console.` },
      { property: "og:title", content: `Staff Sign-in | ${site.name}` },
      { property: "og:description", content: `Team sign-in for the ${site.name} admin console.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  name: z.string().trim().max(100).optional(),
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void navigate({ to: "/admin", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    if (mode === "forgot") {
      if (!z.string().email().safeParse(email.trim()).success)
        return setError("Enter a valid email");
      setBusy(true);
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (err) return setError(err.message);
      setNotice("Check your inbox for a link to set a new password.");
      return;
    }
    const r = schema.safeParse({
      email,
      password: fd.get("password"),
      name: fd.get("name") || undefined,
    });
    if (!r.success) return setError(r.error.issues[0]?.message ?? "Check your details");
    if (mode === "signup") {
      const confirmPassword = String(fd.get("confirmPassword") ?? "");
      if (!confirmPassword) return setError("Confirm your password.");
      if (r.data.password !== confirmPassword) return setError("Passwords do not match.");
    }
    setBusy(true);
    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: r.data.email,
        password: r.data.password,
      });
      setBusy(false);
      if (err)
        setError(
          err.message === "Invalid login credentials" ? "Wrong email or password." : err.message,
        );
      return;
    }
    const { data, error: err } = await supabase.auth.signUp({
      email: r.data.email,
      password: r.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: r.data.name ?? "" },
      },
    });
    setBusy(false);
    if (err) return setError(err.message);
    if (!data.session)
      setNotice("Almost there — check your email and click the confirmation link, then sign in.");
  };

  const google = async () => {
    setError("");
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if ("error" in res && res.error) toast.error("Google sign-in didn't work. Please try again.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img
          src={images.pageHeaders.staff}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute bottom-10 left-10 right-10 text-on-image">
          <p className="eyebrow text-accent-soft">Team area</p>
          <h1 className="mt-2 text-4xl font-semibold">
            Run your trips, bookings and website in one place.
          </h1>
        </div>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h2 className="mt-10 text-3xl font-semibold">
            {mode === "signin"
              ? "Staff sign-in"
              : mode === "signup"
                ? "Create a staff account"
                : "Reset your password"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "After you sign up, an admin needs to give you access."
              : mode === "forgot"
                ? "We'll email you a link to set a new password."
                : "For the NobleQuest team only."}
          </p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="a-name">Your name</Label>
                <Input
                  id="a-name"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  className="h-11 rounded-xl"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="a-email">Email</Label>
              <Input
                id="a-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={255}
                className="h-11 rounded-xl"
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="a-pass">Password</Label>
                  {mode === "signup" ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {showPassword ? "Hide passwords" : "Show passwords"}
                    </button>
                  ) : mode === "signin" ? (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setShowPassword(false);
                        setMode("forgot");
                      }}
                    >
                      Forgot password?
                    </button>
                  ) : null}
                </div>
                <Input
                  id="a-pass"
                  name="password"
                  type={mode === "signup" && showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  maxLength={72}
                  className="h-11 rounded-xl"
                />
              </div>
            )}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="a-pass-confirm">Confirm password</Label>
                <Input
                  id="a-pass-confirm"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={72}
                  className="h-11 rounded-xl"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-xl bg-secondary p-3 text-sm">
                {notice}
              </p>
            )}
            <Button type="submit" variant="forest" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button type="button" variant="outline" size="lg" className="w-full" onClick={google}>
                Continue with Google
              </Button>
            </>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New team member?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setShowPassword(false);
                    setMode("signup");
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  setShowPassword(false);
                  setMode("signin");
                }}
              >
                Back to sign-in
              </button>
            )}
          </p>
          <p className="mt-4 text-center text-xs">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              ← Back to website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
