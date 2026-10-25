import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const FEATURES = [
  {
    title: "Routines, ready to go",
    body: "Build Push, Pull and Leg days once. Today's workout is waiting on the home screen, one tap from starting.",
  },
  {
    title: "A logger for the gym floor",
    body: "Big tap targets for weight and reps, a rest timer that rings even with the screen off, and your last session's numbers right there.",
  },
  {
    title: "GPS runs",
    body: "Record a run with the screen off and get the route on a map, plus distance, pace and elevation. Plan your run week, too.",
  },
  {
    title: "A real exercise library",
    body: "100+ movements, from warm-ups and stretches to cardio and strength, almost all with a form video. Add your own whenever you like.",
  },
  {
    title: "Your history, in full",
    body: "Every session logged with its sets, reps and weights, plus body weight and body fat over time.",
  },
  {
    title: "Works offline",
    body: "Everything is stored on your phone first, so a basement gym with no signal is fine. It syncs to your account when you're back online.",
  },
];

/** Screens captured from the Android app, shown left to right. */
const SCREENS = [
  { src: "/screens/home.png", alt: "Home screen with today's workout" },
  { src: "/screens/session.png", alt: "Logging sets during a workout" },
  { src: "/screens/run.png", alt: "A recorded run on the map" },
  { src: "/screens/exercises.png", alt: "The exercise library" },
];

function Phone({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] border-[6px] border-ink bg-ink shadow-card ${className}`}
    >
      <Image src={src} alt={alt} width={1080} height={2400} className="h-auto w-full" />
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-[100dvh] bg-sand text-ink">
      <SiteHeader />

      {/* hero */}
      <section className="mx-auto grid max-w-[1100px] items-center gap-12 px-5 pb-12 pt-12 sm:pt-20 md:grid-cols-[1.1fr_1fr]">
        <div className="text-center md:text-left">
          <div className="kicker mb-5">For Android</div>
          <h1 className="display text-[40px] font-extrabold leading-[1.02] sm:text-[60px]">
            Lift. Run.
            <br />
            Feel your <span className="text-pulse">pulse</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-[16px] leading-relaxed text-muted2 sm:text-[18px] md:mx-0">
            Pulse is a clean, fast training log for your phone. Plan your gym
            and run week, log every set, record runs with GPS, and keep your
            whole history in your pocket.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href="/download"
              className="rounded-[14px] bg-pulse px-6 py-[14px] text-[15px] font-bold text-white shadow-fab"
            >
              Get the Android app →
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-muted">Free. No ads. Your data stays yours.</p>
        </div>

        <div className="relative mx-auto flex w-full max-w-[440px] items-end justify-center">
          <Phone {...SCREENS[1]} className="w-[46%] -rotate-[4deg] translate-x-4 translate-y-6" />
          <Phone {...SCREENS[0]} className="relative z-10 w-[52%]" />
        </div>
      </section>

      {/* features */}
      <section className="mx-auto max-w-[1100px] px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-card border border-line2 bg-card p-6 shadow-card">
              <div className="mb-2 h-[6px] w-[6px] rounded-full bg-pulse" />
              <h3 className="display text-[18px] font-bold">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* screens */}
      <section className="mx-auto max-w-[1100px] px-5 py-12">
        <div className="mb-8 text-center">
          <div className="kicker mb-3">Inside the app</div>
          <h2 className="display text-[30px] font-bold leading-tight">Gym and run, side by side.</h2>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:gap-8 md:grid-cols-4">
          {SCREENS.map((s) => (
            <Phone key={s.src} {...s} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1100px] px-5 py-12">
        <div
          className="rounded-card p-10 text-center text-white"
          style={{ background: "linear-gradient(135deg,#1A1712,#2A241B)" }}
        >
          <h2 className="display text-[28px] font-bold sm:text-[34px]">Start your streak today.</h2>
          <p className="mx-auto mt-3 max-w-[460px] text-[15px]" style={{ color: "rgba(255,255,255,.65)" }}>
            Download Pulse for Android and log your first workout in under a minute.
          </p>
          <Link
            href="/download"
            className="mt-6 inline-block rounded-[14px] bg-pulse px-7 py-[14px] text-[15px] font-bold text-white shadow-fab"
          >
            Get the Android app →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
