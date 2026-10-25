import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1100px] px-5 py-10">
      <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
        <Link href="/" aria-label="Pulse home">
          <Logo size={26} withWordmark />
        </Link>
        <div className="flex flex-col items-center gap-2 text-[13px] text-muted sm:flex-row sm:gap-5">
          <nav className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms of Service
            </Link>
          </nav>
          <div>© {new Date().getFullYear()} Pulse · Train with rhythm</div>
        </div>
      </div>
    </footer>
  );
}
