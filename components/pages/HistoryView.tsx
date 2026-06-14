"use client";

import { useState } from "react";
import { Card, Kicker, BigNum, Chip } from "@/components/ui";
import { WorkoutRow, type WorkoutRowData } from "@/components/WorkoutRow";
import { TYPE_META, type WorkoutType } from "@/lib/types";

export interface HistoryData {
  rows: WorkoutRowData[];
  monthLabel: string;
  total: number;
  counts: Record<WorkoutType, number>;
  strip: (WorkoutType | null)[];
}

const FILTERS: { label: string; type: WorkoutType | null }[] = [
  { label: "All", type: null },
  { label: "Strength", type: "gym" },
  { label: "Cardio", type: "run" },
  { label: "Racquet", type: "racquet" },
];

export function HistoryView({ data }: { data: HistoryData }) {
  const [filter, setFilter] = useState<WorkoutType | null>(null);
  const list = filter ? data.rows.filter((r) => r.type === filter) : data.rows;

  return (
    <div className="flex flex-col gap-[14px] animate-popIn">
      <Card className="p-[18px]">
        <div className="mb-[14px] flex items-start justify-between">
          <div>
            <Kicker>{data.monthLabel}</Kicker>
            <div className="display mt-[7px] text-[19px] font-bold">
              {data.total} sessions
            </div>
          </div>
          <div className="flex gap-[18px]">
            <SummaryStat n={data.counts.gym} label="strength" />
            <SummaryStat n={data.counts.run} label="cardio" />
            <SummaryStat n={data.counts.racquet} label="racquet" />
          </div>
        </div>
        <div className="flex gap-1">
          {data.strip.map((t, i) => (
            <div
              key={i}
              className="h-[30px] flex-1 rounded-[6px]"
              style={{
                background: t ? TYPE_META[t].color : "#EBE5DA",
                opacity: t ? 1 : 0.6,
              }}
            />
          ))}
        </div>
        <div className="mono mt-[7px] flex justify-between text-[10px] text-faint">
          <span>2 WEEKS AGO</span>
          <span>TODAY</span>
        </div>
      </Card>

      <div className="scrollx flex gap-2 overflow-x-auto pb-[2px]">
        {FILTERS.map((f) => (
          <Chip
            key={f.label}
            active={filter === f.type}
            onClick={() => setFilter(f.type)}
            activeColor={f.type ? TYPE_META[f.type].color : "#1A1712"}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="p-8 text-center text-[14px] text-muted">
          No sessions in this category yet.
        </Card>
      ) : (
        list.map((w) => <WorkoutRow key={w.id} w={w} />)
      )}
    </div>
  );
}

function SummaryStat({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-right">
      <BigNum size={22}>{n}</BigNum>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
