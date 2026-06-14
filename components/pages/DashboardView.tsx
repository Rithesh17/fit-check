"use client";

import Link from "next/link";
import { useUnits } from "@/lib/units";
import { Card, Kicker, BigNum, Delta } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { BodyMap, type WindowKey } from "@/components/BodyMap";
import { WorkoutRow, type WorkoutRowData } from "@/components/WorkoutRow";

export interface DashboardData {
  hasData: boolean;
  firstName: string;
  loads: Record<WindowKey, Record<string, number>>;
  stats: {
    workoutsCount: number;
    workoutsDelta: number;
    volumeLb: number;
    volumeDeltaPct: number;
    distanceMi: number;
    distanceDelta: number;
    activeHrs: number;
    activeDelta: number;
  };
  week: {
    totalHrs: number;
    maxMin: number;
    days: { label: string; isToday: boolean; gym: number; run: number; racquet: number }[];
  };
  recent: WorkoutRowData[];
  nextUp: { title: string; subtitle: string } | null;
}

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col gap-[18px] animate-popIn">
      <div className="grid gap-[18px] lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <BodyMap loads={data.loads} />
        </Card>
        <div className="flex flex-col gap-[14px]">
          <ReadyCard nextUp={data.nextUp} />
          <div className="grid grid-cols-2 gap-[14px]">
            <StatCards stats={data.stats} />
          </div>
        </div>
      </div>

      <div className="grid gap-[18px] lg:grid-cols-[1.1fr_.9fr]">
        <WeekCard week={data.week} />
        <RecentCard recent={data.recent} />
      </div>

      <Link
        href="/exercises"
        className="flex w-full items-center gap-[14px] rounded-card border border-line2 bg-card p-[17px] text-left shadow-card"
      >
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-sand">
          <Icon name="grid" color="#1A1712" size={22} />
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-bold">Exercise Library</div>
          <div className="mt-[2px] text-[12.5px] text-muted">
            60+ movements · form cues &amp; personal records
          </div>
        </div>
        <span className="text-[18px] text-faint">→</span>
      </Link>
    </div>
  );
}

function ReadyCard({ nextUp }: { nextUp: DashboardData["nextUp"] }) {
  return (
    <div
      className="flex h-full flex-col items-start justify-between gap-4 rounded-card p-5 text-white"
      style={{ background: "linear-gradient(135deg,#1A1712,#2A241B)" }}
    >
      <div>
        <Kicker color="#FF8B73">Next up · Today</Kicker>
        <div className="display my-[6px] text-[24px] font-bold">
          {nextUp?.title ?? "Start a session"}
        </div>
        <div className="text-[13px]" style={{ color: "rgba(255,255,255,.6)" }}>
          {nextUp?.subtitle ?? "Log strength, cardio or a racquet match"}
        </div>
      </div>
      <Link
        href="/log"
        className="rounded-[14px] bg-pulse px-[22px] py-[14px] text-[15px] font-bold text-white shadow-fab"
      >
        Start session →
      </Link>
    </div>
  );
}

function StatCards({ stats }: { stats: DashboardData["stats"] }) {
  const { fmt } = useUnits();
  const cards = [
    {
      k: "Workouts",
      v: String(stats.workoutsCount),
      u: "",
      sub: "this week",
      c: "#FF5A3C",
      delta: (stats.workoutsDelta >= 0 ? "+" : "") + stats.workoutsDelta,
    },
    {
      k: "Volume",
      v: fmt.vol(stats.volumeLb),
      u: fmt.wtU(),
      sub: "lifted",
      c: "#FF5A3C",
      delta: (stats.volumeDeltaPct >= 0 ? "+" : "") + stats.volumeDeltaPct + "%",
    },
    {
      k: "Distance",
      v: fmt.dist(stats.distanceMi),
      u: fmt.distU(),
      sub: "run",
      c: "#2F6BFF",
      delta: (stats.distanceDelta >= 0 ? "+" : "") + stats.distanceDelta,
    },
    {
      k: "Active",
      v: String(stats.activeHrs),
      u: "hrs",
      sub: "this week",
      c: "#7A4DFF",
      delta: (stats.activeDelta >= 0 ? "+" : "") + stats.activeDelta,
    },
  ];
  return (
    <>
      {cards.map((s) => (
        <Card key={s.k} className="p-4">
          <div className="flex items-center justify-between">
            <Kicker>{s.k}</Kicker>
            <Delta color={s.c}>{s.delta}</Delta>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <BigNum size={30}>{s.v}</BigNum>
            {s.u && (
              <span className="text-[13px] font-semibold text-muted">{s.u}</span>
            )}
          </div>
          <div className="mt-[2px] text-[12px] text-muted">{s.sub}</div>
        </Card>
      ))}
    </>
  );
}

function WeekCard({ week }: { week: DashboardData["week"] }) {
  const max = Math.max(week.maxMin, 1);
  const seg = (val: number, c: string) =>
    val > 0 ? (
      <div
        className="rounded-[5px]"
        style={{ height: `${(val / max) * 100}%`, background: c, minHeight: 5 }}
      />
    ) : null;
  const legend: [string, string][] = [
    ["#FF5A3C", "Strength"],
    ["#2F6BFF", "Cardio"],
    ["#7A4DFF", "Racquet"],
  ];
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Kicker>This Week</Kicker>
          <div className="display mt-[7px] text-[19px] font-bold">
            Training Load
          </div>
        </div>
        <div className="text-right">
          <BigNum size={26}>{week.totalHrs}</BigNum>
          <span className="ml-[3px] text-[13px] font-semibold text-muted">hrs</span>
        </div>
      </div>
      <div className="flex items-end gap-[5px]">
        {week.days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-[7px]">
            <div
              className="flex w-full max-w-[26px] flex-col-reverse justify-start gap-[3px]"
              style={{ height: 120 }}
            >
              {seg(d.gym, "#FF5A3C")}
              {seg(d.run, "#2F6BFF")}
              {seg(d.racquet, "#7A4DFF")}
            </div>
            <div
              className="mono text-[11px] font-semibold"
              style={{ color: d.isToday ? "#1A1712" : "#B3AB9C" }}
            >
              {d.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 border-t border-sand pt-[14px]">
        {legend.map((l, i) => (
          <div key={i} className="flex items-center gap-[6px]">
            <span
              className="h-[9px] w-[9px] rounded-[3px]"
              style={{ background: l[0] }}
            />
            <span className="text-[12px] font-medium text-muted2">{l[1]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentCard({ recent }: { recent: WorkoutRowData[] }) {
  return (
    <Card className="px-5 pb-[14px] pt-0">
      <div className="flex items-center justify-between pb-1 pt-4">
        <Kicker>Recent Activity</Kicker>
        <Link href="/history" className="text-[12px] font-semibold text-pulse">
          View all →
        </Link>
      </div>
      {recent.length === 0 && (
        <div className="py-8 text-center text-[13px] text-muted">
          No workouts yet — log your first session.
        </div>
      )}
      {recent.map((w, i) => (
        <WorkoutRow
          key={w.id}
          w={w}
          variant="plain"
          last={i === recent.length - 1}
        />
      ))}
    </Card>
  );
}
