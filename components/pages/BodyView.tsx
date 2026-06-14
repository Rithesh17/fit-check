"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnits } from "@/lib/units";
import { createClient } from "@/lib/supabase/client";
import { Card, Kicker, BigNum, GoodDelta } from "@/components/ui";
import { LineChart } from "@/components/LineChart";

export interface BodyData {
  weightSeries: number[];
  weightStart: number | null;
  weightCur: number | null;
  goalLb: number | null;
  bodyFat: number | null;
  bodyFatDelta: number | null;
  leanMass: number | null;
  leanDelta: number | null;
  bmi: number | null;
  bmiDelta: number | null;
  measurements: { part: string; value_in: number }[];
  updatedOn: string | null;
}

export function BodyView({ data }: { data: BodyData }) {
  const { fmt, imperial } = useUnits();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  const cur = data.weightCur ?? 0;
  const start = data.weightStart ?? cur;
  const goal = data.goalLb ?? cur;
  const prog =
    start === goal
      ? 100
      : Math.max(0, Math.min(100, Math.round(((start - cur) / (start - goal)) * 100)));
  const lost = start - cur;

  async function saveWeight(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(val);
    if (!n) return;
    setSaving(true);
    const lb = imperial ? n : n / 0.453592; // store canonical lb
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("body_metrics").upsert(
        {
          user_id: user.id,
          measured_on: new Date().toISOString().slice(0, 10),
          weight_lb: Math.round(lb * 10) / 10,
        },
        { onConflict: "user_id,measured_on" },
      );
    }
    setSaving(false);
    setAdding(false);
    setVal("");
    router.refresh();
  }

  const comp: [string, string, string, number | null][] = [
    ["Body Fat", data.bodyFat != null ? data.bodyFat.toFixed(1) : "—", "%", data.bodyFatDelta],
    [
      "Lean Mass",
      data.leanMass != null ? fmt.wt1(data.leanMass) : "—",
      fmt.wtU(),
      data.leanDelta,
    ],
    ["BMI", data.bmi != null ? data.bmi.toFixed(1) : "—", "", data.bmiDelta],
  ];

  return (
    <div className="flex flex-col gap-[14px] animate-popIn">
      {/* weight */}
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <Kicker>Body Weight</Kicker>
            <div className="mt-[10px] flex items-baseline gap-[5px]">
              <BigNum size={40}>{cur ? fmt.wt1(cur) : "—"}</BigNum>
              <span className="text-[15px] font-semibold text-muted">
                {fmt.wtU()}
              </span>
            </div>
          </div>
          {lost > 0 && (
            <span
              className="mono rounded-[8px] px-[9px] py-[5px] text-[11px] font-semibold"
              style={{ color: "#6FB52B", background: "#EEF7DD" }}
            >
              ↓ {fmt.wt1(lost)} {fmt.wtU()}
            </span>
          )}
        </div>

        {data.weightSeries.length > 1 && (
          <div className="my-4">
            <LineChart
              vals={data.weightSeries.map((v) => (imperial ? v : v * 0.453592))}
              color="#FF5A3C"
              height={110}
            />
          </div>
        )}

        {data.goalLb != null && (
          <div className="mt-3 border-t border-[#F4F0E8] pt-4">
            <div className="mb-[9px] flex justify-between">
              <span className="text-[12.5px] font-semibold text-muted2">
                Goal: {fmt.wt1(goal)} {fmt.wtU()}
              </span>
              <span className="mono text-[12px] font-semibold text-pulse">
                {prog}%
              </span>
            </div>
            <div className="h-[10px] overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${prog}%`,
                  background: "linear-gradient(90deg,#FF8B73,#FF5A3C)",
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          {adding ? (
            <form onSubmit={saveWeight} className="flex gap-2">
              <input
                autoFocus
                type="number"
                step="0.1"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={`Today's weight (${fmt.wtU()})`}
                className="flex-1 rounded-[12px] border border-line bg-paper px-[14px] py-[11px] text-[15px] outline-none focus:border-pulse"
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-[12px] bg-ink px-4 text-[14px] font-bold text-white disabled:opacity-60"
              >
                {saving ? "…" : "Save"}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full rounded-[12px] border border-dashed border-[#DCD4C5] bg-paper py-[11px] text-[13px] font-semibold text-muted2"
            >
              + Log today&rsquo;s weight
            </button>
          )}
        </div>
      </Card>

      {/* composition */}
      <div className="grid grid-cols-3 gap-3">
        {comp.map((c) => (
          <Card key={c[0]} className="p-4">
            <Kicker>{c[0]}</Kicker>
            <div className="mt-[10px] flex items-baseline gap-[3px]">
              <BigNum size={24}>{c[1]}</BigNum>
              <span className="text-[12px] font-semibold text-muted">{c[2]}</span>
            </div>
            {c[3] != null && (
              <div
                className="mt-1 text-[11px] font-semibold"
                style={{ color: c[3] <= 0 ? "#6FB52B" : "#C18A3A" }}
              >
                {c[3] > 0 ? "↑" : "↓"} {Math.abs(c[3])}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* measurements */}
      {data.measurements.length > 0 && (
        <Card className="p-5">
          <div className="mb-4">
            <Kicker>Measurements</Kicker>
            <div
              suppressHydrationWarning
              className="display mt-[7px] text-[19px] font-bold"
            >
              {data.updatedOn
                ? `Updated ${new Date(data.updatedOn).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`
                : "Latest"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-[14px]">
            {data.measurements.map((m) => (
              <div
                key={m.part}
                className="flex items-baseline justify-between border-b border-[#F4F0E8] pb-3 pt-3"
              >
                <div className="text-[13px] font-semibold text-ink2">{m.part}</div>
                <div className="flex items-baseline gap-[2px]">
                  <BigNum size={20}>{fmt.len(m.value_in)}</BigNum>
                  <span className="text-[11px] text-muted">{fmt.lenU()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* progress photos placeholder */}
      <Card className="p-5">
        <Kicker className="mb-[14px]">Progress Photos</Kicker>
        <div className="grid grid-cols-3 gap-[10px]">
          {["", "", ""].map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-[6px] rounded-[14px] border border-line2"
              style={{
                aspectRatio: "3/4",
                background:
                  "repeating-linear-gradient(135deg,#F1ECE3,#F1ECE3 9px,#F7F3EC 9px,#F7F3EC 18px)",
              }}
            >
              <span className="text-[18px] opacity-30">＋</span>
              <span className="mono text-[10px] text-[#B3AB9C]">Add</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
