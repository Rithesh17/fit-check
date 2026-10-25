import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { APK_URL } from "@/lib/download";

export const metadata: Metadata = {
  title: "Download — Pulse",
  description: "Get Pulse for Android.",
};

const STEPS = [
  "On your Android phone, tap Get the Android App above. The file is called pulse.apk.",
  "When the download finishes, open it. If Android asks, allow your browser to install unknown apps.",
  "Tap Install, open Pulse, and sign in with Google or create an account with your email.",
];

export default function DownloadPage() {
  return (
    <div className="min-h-[100dvh] bg-sand text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-6 pt-12 text-center sm:pt-20">
        <Image
          src="/pulse-icon.png"
          alt="Pulse"
          width={96}
          height={96}
          className="mx-auto rounded-[24px] shadow-card"
          priority
        />
        <h1 className="display mt-8 text-[36px] font-extrabold leading-[1.05] sm:text-[48px]">
          Get Pulse for Android
        </h1>
        <p className="mx-auto mt-4 max-w-[480px] text-[16px] leading-relaxed text-muted2">
          Free, no ads. Requires Android 7.0 or newer.
        </p>

        <a
          href={APK_URL}
          className="mt-8 inline-flex items-center gap-2.5 rounded-[14px] bg-pulse px-8 py-[16px] text-[16px] font-bold text-white shadow-fab"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Get the Android App
        </a>

        <ol className="mx-auto mt-14 max-w-[520px] space-y-4 text-left">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-4 rounded-card border border-line2 bg-card p-5 shadow-card">
              <span className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-[15px] leading-relaxed text-ink2">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-[520px] text-[13px] leading-relaxed text-muted">
          Pulse is installed directly rather than from the Play Store, which is why Android asks
          for permission. By installing it you agree to the{" "}
          <Link href="/terms" className="font-semibold text-ink2 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-ink2 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
