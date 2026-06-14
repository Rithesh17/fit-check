import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    title: "Log in seconds",
    body: "Strength, cardio or racquet. Weight/rep steppers, a rest timer, and routines that prefill your sets.",
  },
  {
    title: "See your muscles work",
    body: "A living body map shades each muscle by how hard you've trained it — daily, 3-day and weekly.",
  },
  {
    title: "Real progress",
    body: "Personal records, 12-week volume, estimated 1RM and weekly sets per muscle — computed from your data.",
  },
  {
    title: "Routines & templates",
    body: "Build Push / Pull / Leg days once, then start a full session from a template in one tap.",
  },
  {
    title: "Form on tap",
    body: "Every exercise has an info card: your defaults, last-session values, history graph and a YouTube form video.",
  },
  {
    title: "Body & goals",
    body: "Track weight, composition and measurements, set weekly targets, and watch the streak build.",
  },
];

export function Landing() {
  return (
    <div className="min-h-[100dvh] bg-sand text-ink">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-sand/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4">
          <Logo size={32} withWordmark />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-[14px] font-semibold text-ink2 hover:text-ink"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-ink px-4 py-2 text-[14px] font-bold text-white"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-[1100px] px-5 pb-10 pt-14 sm:pt-20">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="kicker mb-5">Your training, in rhythm</div>
          <h1 className="display text-[40px] font-extrabold leading-[1.02] sm:text-[60px]">
            Track every rep.
            <br />
            Feel your <span className="text-pulse">pulse</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-[540px] text-[16px] leading-relaxed text-muted2 sm:text-[18px]">
            Pulse is a clean, fast fitness tracker for strength, cardio and
            racquet sport. Log workouts, watch your muscles light up, and see
            real progress over time.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-[14px] bg-pulse px-6 py-[14px] text-[15px] font-bold text-white shadow-fab"
            >
              Start free →
            </Link>
            <Link
              href="/login"
              className="rounded-[14px] border border-line bg-paper px-6 py-[14px] text-[15px] font-bold text-ink"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-[940px]">
          <div className="overflow-hidden rounded-[20px] border border-line2 shadow-card">
            <Image
              src="/hero-dashboard.png"
              alt="Pulse dashboard"
              width={1280}
              height={900}
              priority
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-[1100px] px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-card border border-line2 bg-card p-6 shadow-card"
            >
              <div className="mb-2 h-[6px] w-[6px] rounded-full bg-pulse" />
              <h3 className="display text-[18px] font-bold">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted2">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* split showcase */}
      <section className="mx-auto max-w-[1100px] px-5 py-12">
        <div className="grid items-center gap-10 rounded-card border border-line2 bg-card p-6 shadow-card sm:grid-cols-2 sm:p-10">
          <div>
            <div className="kicker mb-3">Built for the gym floor</div>
            <h2 className="display text-[30px] font-bold leading-tight">
              A logger that keeps up with your set.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted2">
              Big tap targets, automatic rest timer, plate calculator and live
              volume — designed to be used between sets, on your phone, fast.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-[14px] bg-ink px-6 py-[13px] text-[15px] font-bold text-white"
            >
              Create your account
            </Link>
          </div>
          <div className="mx-auto w-[260px]">
            <div className="overflow-hidden rounded-[22px] border border-line2 shadow-card">
              <Image
                src="/hero-mobile.png"
                alt="Pulse logger on mobile"
                width={402}
                height={880}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1100px] px-5 py-12">
        <div
          className="rounded-card p-10 text-center text-white"
          style={{ background: "linear-gradient(135deg,#1A1712,#2A241B)" }}
        >
          <h2 className="display text-[28px] font-bold sm:text-[34px]">
            Start your streak today.
          </h2>
          <p className="mx-auto mt-3 max-w-[460px] text-[15px]" style={{ color: "rgba(255,255,255,.65)" }}>
            Free to use. Your data stays yours.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-[14px] bg-pulse px-7 py-[14px] text-[15px] font-bold text-white shadow-fab"
          >
            Get started →
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-[1100px] px-5 py-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <Logo size={26} withWordmark />
          <div className="text-[13px] text-muted">
            © {new Date().getFullYear()} Pulse · Train with rhythm
          </div>
        </div>
      </footer>
    </div>
  );
}
