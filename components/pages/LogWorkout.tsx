"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUnits } from "@/lib/units";
import { createClient } from "@/lib/supabase/client";
import { Card, Kicker, BigNum, Chip } from "@/components/ui";
import { fmtClock } from "@/lib/format";
import type { WorkoutType } from "@/lib/types";

interface LibItem {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string | null;
}
interface SetRow {
  w: number; // canonical lb
  r: number;
  done: boolean;
}
interface ExEntry {
  key: string;
  exercise_id: string;
  name: string;
  target: string | null;
  sets: SetRow[];
}

const REST_SECONDS = 90;

export function LogWorkout({ lib }: { lib: LibItem[] }) {
  const { fmt, imperial } = useUnits();
  const router = useRouter();

  const [type, setType] = useState<WorkoutType>("gym");
  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<ExEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState<{ remaining: number; next: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // cardio / racquet fields
  const [distance, setDistance] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [kcal, setKcal] = useState("");
  const [rallies, setRallies] = useState("");
  const [score, setScore] = useState("");

  // elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // rest countdown
  useEffect(() => {
    if (!rest) return;
    if (rest.remaining <= 0) {
      setRest(null);
      return;
    }
    const t = setTimeout(
      () => setRest((r) => (r ? { ...r, remaining: r.remaining - 1 } : null)),
      1000,
    );
    return () => clearTimeout(t);
  }, [rest]);

  const stepLb = imperial ? 5 : 2.5 / 0.453592;

  function addExercise(item: LibItem) {
    const last = exercises.find((e) => e.exercise_id === item.id);
    const seed = last?.sets[last.sets.length - 1];
    setExercises((xs) => [
      ...xs,
      {
        key: item.id + ":" + Date.now(),
        exercise_id: item.id,
        name: item.name,
        target: item.target,
        sets: [{ w: seed?.w ?? 45, r: seed?.r ?? 10, done: false }],
      },
    ]);
    setPickerOpen(false);
  }

  function update(setFn: (xs: ExEntry[]) => ExEntry[]) {
    setExercises(setFn);
  }
  function addSet(ek: string) {
    update((xs) =>
      xs.map((e) => {
        if (e.key !== ek) return e;
        const last = e.sets[e.sets.length - 1] || { w: 45, r: 10 };
        return { ...e, sets: [...e.sets, { w: last.w, r: last.r, done: false }] };
      }),
    );
  }
  function stepW(ek: string, i: number, d: number) {
    update((xs) =>
      xs.map((e) =>
        e.key === ek
          ? {
              ...e,
              sets: e.sets.map((s, j) =>
                j === i
                  ? { ...s, w: Math.max(0, Math.round((s.w + d) * 10) / 10) }
                  : s,
              ),
            }
          : e,
      ),
    );
  }
  function stepR(ek: string, i: number, d: number) {
    update((xs) =>
      xs.map((e) =>
        e.key === ek
          ? {
              ...e,
              sets: e.sets.map((s, j) =>
                j === i ? { ...s, r: Math.max(0, s.r + d) } : s,
              ),
            }
          : e,
      ),
    );
  }
  function toggleDone(ek: string, i: number) {
    let justDone = false;
    update((xs) =>
      xs.map((e) => {
        if (e.key !== ek) return e;
        return {
          ...e,
          sets: e.sets.map((s, j) => {
            if (j !== i) return s;
            justDone = !s.done;
            return { ...s, done: !s.done };
          }),
        };
      }),
    );
    if (justDone) {
      const ex = exercises.find((e) => e.key === ek);
      setRest({ remaining: REST_SECONDS, next: ex?.name ?? "Next set" });
    }
  }

  // summary
  let vol = 0;
  let done = 0;
  let total = 0;
  for (const e of exercises)
    for (const s of e.sets) {
      total++;
      if (s.done) {
        done++;
        vol += s.w * s.r;
      }
    }

  async function save() {
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setSaving(false);
      return;
    }

    const dur =
      type === "gym"
        ? elapsed
        : Math.round((parseFloat(durationMin) || 0) * 60) || elapsed;

    const base: Record<string, unknown> = {
      user_id: user.id,
      type,
      title: title.trim() || defaultTitle(type, exercises),
      performed_at: new Date().toISOString(),
      duration_sec: dur,
    };

    if (type === "run") {
      const distMi = imperial
        ? parseFloat(distance) || 0
        : (parseFloat(distance) || 0) / 1.60934;
      base.distance_mi = Math.round(distMi * 100) / 100;
      base.kcal = parseInt(kcal) || null;
      // derive pace from distance + duration
      base.pace_spm = distMi > 0 ? Math.round(dur / distMi) : null;
    } else if (type === "racquet") {
      base.kcal = parseInt(kcal) || null;
      base.rallies = parseInt(rallies) || null;
      base.score = parseScore(score);
    }

    try {
      const { data: wk, error: e1 } = await supabase
        .from("workouts")
        .insert(base)
        .select("id")
        .single();
      if (e1 || !wk) throw e1 || new Error("Could not save workout");

      if (type === "gym") {
        for (let p = 0; p < exercises.length; p++) {
          const ex = exercises[p];
          const { data: we, error: e2 } = await supabase
            .from("workout_exercises")
            .insert({
              workout_id: wk.id,
              exercise_id: ex.exercise_id,
              name: ex.name,
              target: ex.target,
              position: p,
            })
            .select("id")
            .single();
          if (e2 || !we) throw e2 || new Error("Could not save exercise");
          const rows = ex.sets.map((s, i) => ({
            workout_exercise_id: we.id,
            position: i,
            weight_lb: s.w,
            reps: s.r,
            done: s.done,
          }));
          if (rows.length) {
            const { error: e3 } = await supabase.from("sets").insert(rows);
            if (e3) throw e3;
          }
        }
      }

      router.push(`/history/${wk.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  const canSave =
    type === "gym"
      ? exercises.length > 0
      : type === "run"
        ? !!distance
        : !!score || !!rallies;

  return (
    <div className="flex flex-col gap-3 animate-popIn">
      {/* type switch */}
      <div className="scrollx flex gap-2 overflow-x-auto">
        {(["gym", "run", "racquet"] as WorkoutType[]).map((t) => (
          <Chip
            key={t}
            active={type === t}
            onClick={() => setType(t)}
            activeColor={
              t === "gym" ? "#FF5A3C" : t === "run" ? "#2F6BFF" : "#7A4DFF"
            }
          >
            {t === "gym" ? "Strength" : t === "run" ? "Cardio" : "Racquet"}
          </Chip>
        ))}
      </div>

      {/* top bar */}
      <div
        className="sticky top-[78px] z-20 flex items-center justify-between gap-[14px] rounded-card p-[18px] text-white lg:static"
        style={{ background: "linear-gradient(135deg,#1A1712,#2A241B)" }}
      >
        <div className="flex gap-[22px]">
          <div>
            <Kicker color="#FF8B73">Elapsed</Kicker>
            <div className="mt-[7px]">
              <BigNum size={26} color="#fff">
                {fmtClock(elapsed)}
              </BigNum>
            </div>
          </div>
          {type === "gym" && (
            <>
              <div>
                <Kicker color="#FF8B73">Volume</Kicker>
                <div className="mt-[7px] flex items-baseline gap-[3px]">
                  <BigNum size={26} color="#fff">
                    {fmt.vol(vol)}
                  </BigNum>
                  <span
                    className="text-[12px]"
                    style={{ color: "rgba(255,255,255,.55)" }}
                  >
                    {fmt.wtU()}
                  </span>
                </div>
              </div>
              <div>
                <Kicker color="#FF8B73">Sets</Kicker>
                <div className="mt-[7px]">
                  <BigNum size={26} color="#fff">
                    {done}/{total}
                  </BigNum>
                </div>
              </div>
            </>
          )}
        </div>
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="self-center whitespace-nowrap rounded-[13px] bg-pulse px-[18px] py-[12px] text-[14px] font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Finish"}
        </button>
      </div>

      {/* title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={defaultTitle(type, exercises)}
        className="rounded-card border border-line2 bg-card px-4 py-[14px] text-[16px] font-semibold shadow-card outline-none placeholder:text-faint focus:border-pulse"
      />

      {error && (
        <div className="rounded-[12px] bg-pulseSoft px-4 py-3 text-[13px] font-medium text-pulse">
          {error}
        </div>
      )}

      {/* rest pill */}
      {type === "gym" && rest && (
        <div
          className="flex items-center gap-[10px] rounded-[14px] border px-4 py-3"
          style={{ background: "#EFE9FF", borderColor: "#E2D9FA" }}
        >
          <div className="h-[10px] w-[10px] animate-pulseRing rounded-full bg-racquet" />
          <div className="flex-1">
            <span className="text-[13.5px] font-semibold" style={{ color: "#3A2B6B" }}>
              Resting
            </span>
            <span className="ml-2 text-[12.5px]" style={{ color: "#7E73A8" }}>
              {rest.next}
            </span>
          </div>
          <div className="display text-[18px] font-bold text-racquet">
            {fmtClock(rest.remaining)}
          </div>
        </div>
      )}

      {/* ===== GYM ===== */}
      {type === "gym" && (
        <>
          {exercises.map((e, ei) => {
            const allDone = e.sets.length > 0 && e.sets.every((s) => s.done);
            return (
              <Card key={e.key} className="p-4">
                <div className="mb-[10px] flex items-center gap-3">
                  <div
                    className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] text-[13px] font-bold"
                    style={{
                      background: allDone ? "#EEF7DD" : "#F1ECE3",
                      color: allDone ? "#6FB52B" : "#A39B8B",
                      fontFamily: "var(--font-bricolage)",
                    }}
                  >
                    {allDone ? "✓" : ei + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[15.5px] font-bold">{e.name}</div>
                    {e.target && (
                      <div className="text-[12px] capitalize text-muted">
                        {e.target}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      update((xs) => xs.filter((x) => x.key !== e.key))
                    }
                    className="h-[30px] w-[30px] rounded-[8px] bg-sand text-[15px] text-muted"
                    aria-label="Remove exercise"
                  >
                    ×
                  </button>
                </div>

                <div
                  className="grid items-center gap-2 border-b border-[#F4F0E8] px-[2px] pb-2"
                  style={{ gridTemplateColumns: "26px 1fr 96px 96px 38px" }}
                >
                  {["SET", "PREV", fmt.wtU().toUpperCase(), "REPS", ""].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="mono text-[9.5px] text-faint"
                        style={{
                          letterSpacing: ".1em",
                          textAlign: i >= 2 && i <= 3 ? "center" : "left",
                        }}
                      >
                        {h}
                      </div>
                    ),
                  )}
                </div>

                {e.sets.map((s, i) => (
                  <div
                    key={i}
                    className="grid items-center gap-2 rounded-[8px] px-[2px] py-[7px]"
                    style={{
                      gridTemplateColumns: "26px 1fr 96px 96px 38px",
                      background: s.done ? "#FBFDF6" : "transparent",
                    }}
                  >
                    <div className="display text-[13px] font-bold text-muted">
                      {i + 1}
                    </div>
                    <div className="text-[12px] text-faint">—</div>
                    <Stepper
                      value={fmt.wt(s.w)}
                      onMinus={() => stepW(e.key, i, -stepLb)}
                      onPlus={() => stepW(e.key, i, stepLb)}
                    />
                    <Stepper
                      value={s.r}
                      onMinus={() => stepR(e.key, i, -1)}
                      onPlus={() => stepR(e.key, i, 1)}
                    />
                    <button
                      onClick={() => toggleDone(e.key, i)}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-[9px] text-[15px]"
                      style={{
                        background: s.done ? "#6FB52B" : "#F1ECE3",
                        color: s.done ? "#fff" : "#C3BBAC",
                      }}
                    >
                      ✓
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addSet(e.key)}
                  className="mt-2 w-full rounded-[10px] border border-dashed border-[#DCD4C5] bg-paper py-[9px] text-[12.5px] font-semibold text-[#9A9183]"
                >
                  + Add set
                </button>
              </Card>
            );
          })}

          <button
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-card border border-dashed border-[#DCD4C5] bg-paper py-[15px] text-[14px] font-semibold text-muted2"
          >
            + Add exercise
          </button>
        </>
      )}

      {/* ===== RUN ===== */}
      {type === "run" && (
        <Card className="flex flex-col gap-4 p-5">
          <NumberField
            label={`Distance (${fmt.distU()})`}
            value={distance}
            onChange={setDistance}
            placeholder="5.0"
          />
          <NumberField
            label="Duration (min)"
            value={durationMin}
            onChange={setDurationMin}
            placeholder="42"
          />
          <NumberField label="Calories" value={kcal} onChange={setKcal} placeholder="540" />
        </Card>
      )}

      {/* ===== RACQUET ===== */}
      {type === "racquet" && (
        <Card className="flex flex-col gap-4 p-5">
          <NumberField
            label="Duration (min)"
            value={durationMin}
            onChange={setDurationMin}
            placeholder="60"
          />
          <NumberField label="Calories" value={kcal} onChange={setKcal} placeholder="520" />
          <NumberField
            label="Rallies"
            value={rallies}
            onChange={setRallies}
            placeholder="180"
          />
          <label className="block">
            <span className="kicker mb-2 block">Score (e.g. 21-18, 19-21, 21-15)</span>
            <input
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="21-18, 19-21, 21-15"
              className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[15px] outline-none focus:border-pulse"
            />
          </label>
        </Card>
      )}

      <button
        onClick={save}
        disabled={!canSave || saving}
        className="mt-1 w-full rounded-[16px] bg-ink py-[17px] text-[15px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Finish & save workout"}
      </button>

      {/* exercise picker */}
      {pickerOpen && (
        <ExercisePicker
          lib={lib}
          onPick={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function Stepper({
  value,
  onMinus,
  onPlus,
}: {
  value: number | string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-[2px] rounded-[9px] px-[6px] py-[4px]"
      style={{ background: "#F7F3EC" }}
    >
      <button
        onClick={onMinus}
        className="w-4 text-[15px] font-bold leading-none text-[#B3AB9C]"
      >
        −
      </button>
      <span className="display text-[14px] font-semibold text-ink">{value}</span>
      <button
        onClick={onPlus}
        className="w-4 text-[15px] font-bold leading-none text-[#B3AB9C]"
      >
        +
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="kicker mb-2 block">{label}</span>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[15px] outline-none focus:border-pulse"
      />
    </label>
  );
}

function ExercisePicker({
  lib,
  onPick,
  onClose,
}: {
  lib: LibItem[];
  onPick: (e: LibItem) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...Array.from(new Set(lib.map((e) => e.category)))];
  const list = lib.filter(
    (e) =>
      (cat === "All" || e.category === cat) &&
      (!q || e.name.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80dvh] w-full max-w-[480px] flex-col rounded-t-[24px] bg-sand p-4 sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="display text-[18px] font-bold">Add exercise</div>
          <button onClick={onClose} className="text-[20px] text-muted">
            ×
          </button>
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises…"
          className="mb-3 w-full rounded-[12px] border border-line bg-card px-4 py-3 text-[15px] outline-none focus:border-pulse"
        />
        <div className="scrollx mb-3 flex gap-2 overflow-x-auto">
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="scrolly flex flex-col gap-2 overflow-y-auto">
          {list.map((e) => (
            <button
              key={e.id}
              onClick={() => onPick(e)}
              className="flex items-center justify-between rounded-[14px] border border-line2 bg-card px-4 py-3 text-left"
            >
              <div>
                <div className="text-[14.5px] font-semibold">{e.name}</div>
                <div className="text-[12px] text-muted">
                  {e.category} · {e.equipment}
                </div>
              </div>
              <span className="text-[18px] text-pulse">+</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function defaultTitle(type: WorkoutType, exercises: ExEntry[]) {
  if (type === "run") return "Run";
  if (type === "racquet") return "Match";
  if (exercises.length) return "Strength Session";
  return "New Workout";
}

function parseScore(s: string): number[][] | null {
  const games = s
    .split(/[,;]/)
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => g.split(/[-–:]/).map((n) => parseInt(n.trim())))
    .filter((g) => g.length === 2 && g.every((n) => !isNaN(n)));
  return games.length ? games : null;
}
