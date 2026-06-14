"use client";

import { useState } from "react";
import { useUnits } from "@/lib/units";
import { Card, Kicker, BigNum, Chip, GoodDelta } from "@/components/ui";
import { LineChart } from "@/components/LineChart";
import { lerp } from "@/lib/muscles";
import { relDate } from "@/lib/format";

export interface ProgressData {
  volSeries: number[];
  volTotal: number;
  volTrendPct: number;
  e1rm: Record<string, number[]>;
  liftNames: string[];
  muscle: [string, number][];
  prs: { lift: string; lb: number; at: string; up: number }[];
}

export function ProgressView({ data }: { data: ProgressData }) {
  const { fmt } = useUnits();
  const [lift, setLift] = useState(data.liftNames[0] || "");

  const liftSeries = (data.e1rm[lift] || []).map((v) => fmt.wt(v));
  const maxSets = Math.max(1, ...data.muscle.map((m) => m[1]));

  return (
    <div className="flex flex-col gap-[14px] animate-popIn">
      {/* personal records */}
      <Kicker className="mt-[2px]">Personal Records</Kicker>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.prs.length === 0 && (
          <Card className="col-span-full p-6 text-center text-[13px] text-muted">
            Log some lifts to start setting records.
          </Card>
        )}
        {data.prs.map((p) => (
          <Card key={p.lift} className="p-4">
            <div className="flex items-center justify-between">
              <Kicker>{p.lift}</Kicker>
              {p.up > 0 && <GoodDelta>↑ {fmt.wt(p.up)}</GoodDelta>}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <BigNum size={30}>{fmt.wt(p.lb)}</BigNum>
              <span className="text-[13px] font-semibold text-muted">
                {fmt.wtU()}
              </span>
            </div>
            <div className="mt-[3px] text-[11.5px] text-muted">
              set {relDate(p.at).day.toLowerCase()}
            </div>
          </Card>
        ))}
      </div>

      {/* weekly volume */}
      <Card className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <Kicker>Weekly Volume</Kicker>
            <div className="display mt-[7px] text-[19px] font-bold">
              {data.volTrendPct >= 0 ? "Trending up" : "Down"}{" "}
              {Math.abs(data.volTrendPct)}%
            </div>
          </div>
          <div className="text-right">
            <BigNum size={24}>{fmt.vol(data.volTotal)}</BigNum>
            <span className="ml-[3px] text-[12px] text-muted">{fmt.wtU()}</span>
          </div>
        </div>
        <LineChart
          vals={data.volSeries.map((v) => fmt.wt(v))}
          color="#FF5A3C"
          height={140}
        />
        <div className="mono mt-2 flex justify-between text-[10px] text-faint">
          <span>12W AGO</span>
          <span>NOW</span>
        </div>
      </Card>

      {/* estimated 1RM */}
      {data.liftNames.length > 0 && (
        <Card className="p-5">
          <Kicker>Estimated 1RM</Kicker>
          <div className="display my-[7px] mb-[14px] text-[19px] font-bold">
            Strength Progression
          </div>
          <div className="scrollx mb-[14px] flex gap-[7px] overflow-x-auto">
            {data.liftNames.map((n) => (
              <Chip key={n} active={lift === n} onClick={() => setLift(n)}>
                {n}
              </Chip>
            ))}
          </div>
          <LineChart vals={liftSeries} color="#7A4DFF" height={130} />
        </Card>
      )}

      {/* sets per muscle */}
      <Card className="p-5">
        <div className="mb-[14px]">
          <Kicker>Weekly Sets per Muscle</Kicker>
          <div className="display mt-[7px] text-[19px] font-bold">
            Volume Balance
          </div>
        </div>
        {data.muscle.map((m, i) => (
          <div key={i} className="mb-[11px] flex items-center gap-3">
            <div className="w-[74px] text-[13px] font-semibold text-ink2">
              {m[0]}
            </div>
            <div className="h-[9px] flex-1 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(m[1] / maxSets) * 100}%`,
                  background: lerp(0.4 + (0.5 * m[1]) / maxSets),
                }}
              />
            </div>
            <div className="mono w-[46px] text-right text-[12px] text-muted">
              {m[1]} sets
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
