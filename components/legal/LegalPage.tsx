import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const CONTACT_EMAIL = "rithhem20@gmail.com";
export const EFFECTIVE_DATE = "October 24, 2026";

/** Shared shell for the Privacy Policy and Terms of Service pages. */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-sand text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-6 pt-12 sm:pt-16">
        <div className="kicker mb-4">Legal</div>
        <h1 className="display text-[36px] font-extrabold leading-[1.05] sm:text-[48px]">
          {title}
        </h1>
        <p className="mt-3 text-[14px] text-muted2">Effective {EFFECTIVE_DATE}</p>
        <div className="legal mt-10">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="display mb-3 text-[22px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function ContactLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-pulse">
      {CONTACT_EMAIL}
    </a>
  );
}
