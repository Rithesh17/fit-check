"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export function ResetForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The /auth/callback route has already exchanged the recovery code for a
  // session by the time we get here, so a valid user should exist.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setValidSession(!!data.user);
      setChecking(false);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-sand px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={44} />
          <h1 className="display mt-5 text-[28px] font-bold leading-tight">
            Choose a new password
          </h1>
          <p className="mt-2 text-[14px] text-muted2">
            Pick something you'll remember this time.
          </p>
        </div>

        {checking ? (
          <div className="rounded-card border border-line2 bg-card p-6 text-center text-[14px] text-muted2 shadow-card">
            One moment…
          </div>
        ) : !validSession ? (
          <div className="rounded-card border border-line2 bg-card p-6 text-center shadow-card">
            <div className="rounded-[10px] bg-pulseSoft px-3 py-3 text-[13.5px] font-medium text-pulse">
              This reset link is invalid or has expired. Request a new one.
            </div>
            <Link
              href="/forgot"
              className="mt-5 block w-full rounded-[14px] bg-ink py-[15px] text-[15px] font-bold text-white"
            >
              Send a new link
            </Link>
          </div>
        ) : done ? (
          <div className="rounded-card border border-line2 bg-card p-6 text-center shadow-card">
            <div className="rounded-[10px] bg-goodSoft px-3 py-3 text-[13.5px] font-medium text-good">
              Password updated. Taking you to your dashboard…
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-card border border-line2 bg-card p-6 shadow-card"
          >
            <label className="mb-4 block">
              <span className="kicker mb-2 block">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[15px] text-ink outline-none transition-colors focus:border-pulse"
              />
            </label>
            <label className="mb-4 block last:mb-0">
              <span className="kicker mb-2 block">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[15px] text-ink outline-none transition-colors focus:border-pulse"
              />
            </label>

            {error && (
              <div className="mt-4 rounded-[10px] bg-pulseSoft px-3 py-2 text-[13px] font-medium text-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-[14px] bg-ink py-[15px] text-[15px] font-bold text-white transition-opacity disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
