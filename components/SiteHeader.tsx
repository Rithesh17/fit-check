import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-sand/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Pulse home">
          <Logo size={32} withWordmark />
        </Link>
        <Link
          href="/download"
          className="rounded-full bg-ink px-4 py-2 text-[14px] font-bold text-white"
        >
          Download
        </Link>
      </div>
    </header>
  );
}
