"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name || undefined } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice(
            "Account created. Check your email to confirm, then sign in.",
          );
          setLoading(false);
          return;
        }
        await supabase.rpc("seed_demo_for_me");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push(next);
      router.refresh();
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
            {isSignup ? "Start your streak" : "Welcome back"}
          </h1>
          <p className="mt-2 text-[14px] text-muted2">
            {isSignup
              ? "Create an account to track every session."
              : "Sign in to pick up where you left off."}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-card border border-line2 bg-card p-6 shadow-card"
        >
          {isSignup && (
            <Field
              label="Name"
              value={name}
              onChange={setName}
              type="text"
              placeholder="Alex Mercer"
              autoComplete="name"
            />
          )}
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={6}
          />

          {error && (
            <div className="mt-4 rounded-[10px] bg-pulseSoft px-3 py-2 text-[13px] font-medium text-pulse">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-4 rounded-[10px] bg-goodSoft px-3 py-2 text-[13px] font-medium text-good">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-[14px] bg-ink py-[15px] text-[15px] font-bold text-white transition-opacity disabled:opacity-60"
          >
            {loading
              ? "One moment…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13.5px] text-muted2">
          {isSignup ? "Already training with Pulse?" : "New to Pulse?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-pulse"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="mb-4 block last:mb-0">
      <span className="kicker mb-2 block">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[15px] text-ink outline-none transition-colors focus:border-pulse"
      />
    </label>
  );
}
