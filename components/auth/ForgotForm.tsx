"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-sand px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={44} />
          <h1 className="display mt-5 text-[28px] font-bold leading-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-[14px] text-muted2">
            {sent
              ? "If an account exists for that email, a reset link is on its way."
              : "Enter your email and we'll send you a link to set a new password."}
          </p>
        </div>

        {sent ? (
          <div className="rounded-card border border-line2 bg-card p-6 text-center shadow-card">
            <div className="rounded-[10px] bg-goodSoft px-3 py-3 text-[13.5px] font-medium text-good">
              Check your inbox (and spam) for the reset link. It expires after a
              short while, so use it soon.
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-card border border-line2 bg-card p-6 shadow-card"
          >
            <label className="mb-4 block">
              <span className="kicker mb-2 block">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
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
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[13.5px] text-muted2">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-pulse">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
