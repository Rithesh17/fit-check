"use client";

import { useState } from "react";
import { useUnits } from "@/lib/units";
import { createClient } from "@/lib/supabase/client";
import { Chip } from "@/components/ui";
import type { Exercise, UserExercisePrefs } from "@/lib/types";

const CATS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];
const EQUIP = ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight", "Other"];

// mode:
//  - "create"     -> insert a new user-owned exercise
//  - "edit-own"   -> update a user-owned exercise
//  - "edit-prefs" -> upsert a per-user overlay on a global/own exercise
export function ExerciseForm({
  mode,
  exercise,
  prefs,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit-own" | "edit-prefs";
  exercise?: Exercise;
  prefs?: UserExercisePrefs | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { fmt, imperial } = useUnits();
  const ownEditable = mode === "create" || mode === "edit-own";

  const [name, setName] = useState(exercise?.name ?? "");
  const [category, setCategory] = useState(exercise?.category ?? "Chest");
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "Barbell");
  const [isCardio, setIsCardio] = useState(
    exercise?.is_cardio ?? exercise?.category === "Cardio",
  );

  const src = prefs ?? exercise;
  const [sets, setSets] = useState(str(src?.default_sets));
  const [reps, setReps] = useState(str(src?.default_reps));
  const [weight, setWeight] = useState(
    src?.default_weight_lb != null ? String(fmt.wt(src.default_weight_lb)) : "",
  );
  const [duration, setDuration] = useState(
    src?.default_duration_sec != null
      ? String(Math.round(src.default_duration_sec / 60))
      : "",
  );
  const [cues, setCues] = useState(src?.cues ?? "");
  const [video, setVideo] = useState(src?.video_url ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardio = ownEditable ? isCardio || category === "Cardio" : exercise?.is_cardio;

  async function save(e: React.FormEvent) {
    e.preventDefault();
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

    const wLb = weight ? (imperial ? +weight : +weight / 0.453592) : null;
    const defaults = {
      default_sets: sets ? parseInt(sets) : null,
      default_reps: reps ? parseInt(reps) : null,
      default_weight_lb: wLb != null ? Math.round(wLb * 10) / 10 : null,
      default_duration_sec: duration ? parseInt(duration) * 60 : null,
      cues: cues.trim() || null,
      video_url: video.trim() || null,
    };

    try {
      if (mode === "create") {
        const { error } = await supabase.from("exercises").insert({
          user_id: user.id,
          name: name.trim(),
          category,
          equipment,
          is_cardio: !!cardio,
          intensity: 0.6,
          ...defaults,
        });
        if (error) throw error;
      } else if (mode === "edit-own") {
        const { error } = await supabase
          .from("exercises")
          .update({
            name: name.trim(),
            category,
            equipment,
            is_cardio: !!cardio,
            ...defaults,
          })
          .eq("id", exercise!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_exercise_prefs").upsert(
          {
            user_id: user.id,
            exercise_id: exercise!.id,
            ...defaults,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,exercise_id" },
        );
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={titleFor(mode, exercise)}>
      <form onSubmit={save} className="flex flex-col gap-4">
        {ownEditable ? (
          <>
            <Field label="Name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Incline DB Press"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  {CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Equipment">
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className={inputCls}
                >
                  {EQUIP.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Chip active={!cardio} onClick={() => setIsCardio(false)}>
                Strength
              </Chip>
              <Chip
                active={!!cardio}
                onClick={() => setIsCardio(true)}
                activeColor="#2F6BFF"
              >
                Cardio / timed
              </Chip>
            </div>
          </>
        ) : (
          <div className="rounded-[12px] bg-paper px-4 py-3 text-[13px] text-muted2">
            Editing your defaults &amp; video for{" "}
            <span className="font-semibold text-ink">{exercise?.name}</span>.
            The shared exercise itself isn&rsquo;t changed.
          </div>
        )}

        <div className="kicker pt-1">Defaults</div>
        {cardio ? (
          <Field label="Duration (min)">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              className={inputCls}
            />
          </Field>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sets">
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="3"
                className={inputCls}
              />
            </Field>
            <Field label="Reps">
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="10"
                className={inputCls}
              />
            </Field>
            <Field label={`Weight (${fmt.wtU()})`}>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="—"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        <Field label="YouTube link (form video)">
          <input
            value={video}
            onChange={(e) => setVideo(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className={inputCls}
          />
        </Field>
        <Field label="Form cues (optional)">
          <textarea
            value={cues}
            onChange={(e) => setCues(e.target.value)}
            rows={2}
            placeholder="Brace, control the eccentric, full ROM…"
            className={inputCls + " resize-none"}
          />
        </Field>

        {error && (
          <div className="rounded-[10px] bg-pulseSoft px-3 py-2 text-[13px] font-medium text-pulse">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 w-full rounded-[14px] bg-ink py-[14px] text-[15px] font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}

const inputCls =
  "w-full rounded-[12px] border border-line bg-paper px-[14px] py-[11px] text-[15px] text-ink outline-none focus:border-pulse";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="kicker mb-2 block">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="scrolly flex max-h-[88dvh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-[24px] bg-sand p-5 sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="display text-[18px] font-bold">{title}</div>
          <button onClick={onClose} className="text-[22px] leading-none text-muted">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function str(n: number | null | undefined) {
  return n != null ? String(n) : "";
}
function titleFor(mode: string, ex?: Exercise) {
  if (mode === "create") return "New exercise";
  if (mode === "edit-own") return `Edit ${ex?.name ?? "exercise"}`;
  return `Customise ${ex?.name ?? "exercise"}`;
}
