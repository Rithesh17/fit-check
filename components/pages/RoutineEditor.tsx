"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnits } from "@/lib/units";
import { createClient } from "@/lib/supabase/client";
import { Card, Kicker, Chip } from "@/components/ui";
import { InfoButton } from "@/components/exercise/ExerciseInfo";
import { ExercisePicker, type LibItem } from "@/components/pages/LogWorkout";
import type { WorkoutTemplate, WorkoutType } from "@/lib/types";

interface Row {
  key: string;
  exercise_id: string;
  name: string;
  target: string | null;
  sets: string;
  reps: string;
  weight: string; // display units
}

let seq = 0;

export function RoutineEditor({
  template,
  lib,
}: {
  template: WorkoutTemplate;
  lib: LibItem[];
}) {
  const { fmt, imperial } = useUnits();
  const router = useRouter();

  const [name, setName] = useState(template.name);
  const [type, setType] = useState<WorkoutType>(template.type);
  const [rows, setRows] = useState<Row[]>(
    (template.template_exercises || []).map((te) => ({
      key: `r${seq++}`,
      exercise_id: te.exercise_id ?? "",
      name: te.name,
      target: te.target,
      sets: te.default_sets != null ? String(te.default_sets) : "3",
      reps: te.default_reps != null ? String(te.default_reps) : "10",
      weight:
        te.default_weight_lb != null ? String(fmt.wt(te.default_weight_lb)) : "",
    })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  function addExercise(item: LibItem) {
    setRows((r) => [
      ...r,
      {
        key: `r${seq++}`,
        exercise_id: item.id,
        name: item.name,
        target: item.target,
        sets: item.default_sets != null ? String(item.default_sets) : "3",
        reps: item.default_reps != null ? String(item.default_reps) : "10",
        weight:
          item.default_weight_lb != null
            ? String(fmt.wt(item.default_weight_lb))
            : "",
      },
    ]);
    setPickerOpen(false);
  }
  const setField = (key: string, f: keyof Row, v: string) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, [f]: v } : x)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const copy = r.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("workout_templates")
      .update({ name: name.trim() || "Routine", type })
      .eq("id", template.id);
    await supabase
      .from("template_exercises")
      .delete()
      .eq("template_id", template.id);
    if (type === "gym" && rows.length) {
      await supabase.from("template_exercises").insert(
        rows.map((r, i) => ({
          template_id: template.id,
          exercise_id: r.exercise_id || null,
          name: r.name,
          target: r.target,
          position: i,
          default_sets: r.sets ? parseInt(r.sets) : null,
          default_reps: r.reps ? parseInt(r.reps) : null,
          default_weight_lb: r.weight
            ? Math.round((imperial ? +r.weight : +r.weight / 0.453592) * 10) / 10
            : null,
        })),
      );
    }
    router.push("/routines");
    router.refresh();
  }

  async function del() {
    const supabase = createClient();
    await supabase.from("workout_templates").delete().eq("id", template.id);
    router.push("/routines");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-[14px] animate-popIn">
      <Card className="flex flex-col gap-4 p-5">
        <label className="block">
          <span className="kicker mb-2 block">Routine name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push Day"
            className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[16px] font-semibold outline-none focus:border-pulse"
          />
        </label>
        <div className="flex gap-2">
          {(["gym", "run", "racquet"] as WorkoutType[]).map((t) => (
            <Chip
              key={t}
              active={type === t}
              onClick={() => setType(t)}
              activeColor={t === "gym" ? "#FF5A3C" : t === "run" ? "#2F6BFF" : "#7A4DFF"}
            >
              {t === "gym" ? "Strength" : t === "run" ? "Cardio" : "Racquet"}
            </Chip>
          ))}
        </div>
      </Card>

      {type === "gym" && (
        <>
          <Kicker className="mt-1">Exercises</Kicker>
          {rows.map((r, i) => (
            <Card key={r.key} className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[15px] font-bold">{r.name}</div>
                  {r.target && (
                    <div className="text-[12px] capitalize text-muted">{r.target}</div>
                  )}
                </div>
                {r.exercise_id && <InfoButton exerciseId={r.exercise_id} />}
                <button
                  onClick={() => move(i, -1)}
                  className="h-[30px] w-[30px] rounded-[8px] bg-sand text-muted"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  className="h-[30px] w-[30px] rounded-[8px] bg-sand text-muted"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => setRows((rr) => rr.filter((x) => x.key !== r.key))}
                  className="h-[30px] w-[30px] rounded-[8px] bg-sand text-[15px] text-muted"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Mini label="Sets" value={r.sets} onChange={(v) => setField(r.key, "sets", v)} />
                <Mini label="Reps" value={r.reps} onChange={(v) => setField(r.key, "reps", v)} />
                <Mini
                  label={fmt.wtU()}
                  value={r.weight}
                  onChange={(v) => setField(r.key, "weight", v)}
                />
              </div>
            </Card>
          ))}
          <button
            onClick={() => setPickerOpen(true)}
            className="w-full rounded-card border border-dashed border-[#DCD4C5] bg-paper py-[15px] text-[14px] font-semibold text-muted2"
          >
            + Add exercise
          </button>
        </>
      )}

      <div className="mt-2 flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-[16px] bg-ink py-[15px] text-[15px] font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save routine"}
        </button>
        {confirmDel ? (
          <button
            onClick={del}
            className="rounded-[16px] bg-pulse px-5 text-[14px] font-bold text-white"
          >
            Confirm
          </button>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            className="rounded-[16px] border border-line bg-paper px-5 text-[14px] font-semibold text-muted2"
          >
            Delete
          </button>
        )}
      </div>

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

function Mini({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="kicker mb-2 block">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-full rounded-[10px] border border-line bg-paper px-3 py-2 text-[15px] outline-none focus:border-pulse"
      />
    </label>
  );
}
