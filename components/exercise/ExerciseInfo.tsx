"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useUnits } from "@/lib/units";
import { createClient } from "@/lib/supabase/client";
import { effectiveDefaults, e1rm } from "@/lib/exercise";
import { youtubeEmbed } from "@/lib/youtube";
import { getExerciseHistory, type ExerciseSession } from "@/lib/queries";
import type { Exercise, UserExercisePrefs } from "@/lib/types";
import { LineChart } from "@/components/LineChart";
import { Icon } from "@/components/Icon";
import { Kicker } from "@/components/ui";
import { ExerciseForm, Modal } from "./ExerciseForm";
import { relDate } from "@/lib/format";

const Ctx = createContext<{ open: (id: string) => void } | null>(null);

export function ExerciseInfoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [id, setId] = useState<string | null>(null);
  const open = useCallback((x: string) => setId(x), []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {id && <ExerciseInfoSheet exerciseId={id} onClose={() => setId(null)} />}
    </Ctx.Provider>
  );
}

export function useExerciseInfo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExerciseInfo must be used within provider");
  return ctx;
}

export function InfoButton({ exerciseId }: { exerciseId: string }) {
  const { open } = useExerciseInfo();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        open(exerciseId);
      }}
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-sand text-muted transition-colors hover:text-ink"
      aria-label="Exercise info"
    >
      <Icon name="info" size={17} color="currentColor" />
    </button>
  );
}

function ExerciseInfoSheet({
  exerciseId,
  onClose,
}: {
  exerciseId: string;
  onClose: () => void;
}) {
  const { fmt } = useUnits();
  const [ex, setEx] = useState<Exercise | null>(null);
  const [prefs, setPrefs] = useState<UserExercisePrefs | null>(null);
  const [history, setHistory] = useState<ExerciseSession[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUid(user?.id ?? null);
    const [{ data: exRow }, { data: prefRow }, hist] = await Promise.all([
      supabase.from("exercises").select("*").eq("id", exerciseId).maybeSingle(),
      supabase
        .from("user_exercise_prefs")
        .select("*")
        .eq("exercise_id", exerciseId)
        .maybeSingle(),
      getExerciseHistory(supabase, exerciseId),
    ]);
    setEx(exRow as Exercise);
    setPrefs((prefRow as UserExercisePrefs) ?? null);
    setHistory(hist);
    setLoading(false);
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (editing && ex) {
    return (
      <ExerciseForm
        mode={ex.user_id && ex.user_id === uid ? "edit-own" : "edit-prefs"}
        exercise={ex}
        prefs={prefs}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          load();
        }}
      />
    );
  }

  const eff = ex ? effectiveDefaults(ex, prefs) : null;
  const embed = youtubeEmbed(eff?.video_url);
  const own = ex?.user_id != null && ex.user_id === uid;
  const last = history[0];
  const bestE1rm = Math.max(
    0,
    ...history.flatMap((s) => s.sets.map((x) => e1rm(x.w, x.r))),
  );
  const trend = history
    .slice()
    .reverse()
    .map((s) => fmt.wt(s.topWeight))
    .filter((v) => v > 0);

  async function del() {
    const supabase = createClient();
    await supabase.from("exercises").delete().eq("id", exerciseId);
    onClose();
  }

  return (
    <Modal title={ex?.name ?? "Exercise"} onClose={onClose}>
      {loading || !ex || !eff ? (
        <div className="py-10 text-center text-[13px] text-muted">Loading…</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className="mono rounded-[5px] px-[7px] py-[3px] text-[10.5px] font-semibold"
              style={{
                color: ex.is_cardio ? "#2F6BFF" : "#FF5A3C",
                background: (ex.is_cardio ? "#2F6BFF" : "#FF5A3C") + "15",
              }}
            >
              {ex.category.toUpperCase()}
            </span>
            <span className="text-[12px] text-muted">{ex.equipment}</span>
            {own && (
              <span className="text-[11px] font-semibold text-racquet">
                · Custom
              </span>
            )}
          </div>

          {embed && (
            <div
              className="overflow-hidden rounded-[14px] bg-black"
              style={{ aspectRatio: "16/9" }}
            >
              <iframe
                src={embed}
                title="Form video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          )}

          {/* defaults + last */}
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Default">
              {ex.is_cardio
                ? eff.duration_sec
                  ? `${Math.round(eff.duration_sec / 60)} min`
                  : "—"
                : eff.sets || eff.reps
                  ? `${eff.sets ?? "–"} × ${eff.reps ?? "–"}${
                      eff.weight_lb ? ` @ ${fmt.wt(eff.weight_lb)} ${fmt.wtU()}` : ""
                    }`
                  : "—"}
            </Stat>
            <Stat label="Last session">
              {last
                ? ex.is_cardio
                  ? relDate(last.date).day
                  : `${last.sets.length} × ${
                      last.sets[last.sets.length - 1]?.r ?? "–"
                    } @ ${fmt.wt(last.topWeight)} ${fmt.wtU()}`
                : "No history yet"}
            </Stat>
            {!ex.is_cardio && bestE1rm > 0 && (
              <Stat label="Est. 1RM">
                {fmt.wt(bestE1rm)} {fmt.wtU()}
              </Stat>
            )}
            <Stat label="Sessions">{history.length}</Stat>
          </div>

          {trend.length > 1 && (
            <div>
              <Kicker className="mb-2">Top set over time</Kicker>
              <LineChart vals={trend} color="#7A4DFF" height={90} />
            </div>
          )}

          {eff.cues && (
            <div>
              <Kicker className="mb-2">Form cues</Kicker>
              <p className="text-[13.5px] leading-relaxed text-ink2">{eff.cues}</p>
            </div>
          )}

          {/* actions */}
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-ink py-[12px] text-[14px] font-bold text-white"
            >
              <Icon name="edit" size={16} color="#fff" />
              {own ? "Edit" : "Customise"}
            </button>
            {own &&
              (confirmDel ? (
                <button
                  onClick={del}
                  className="rounded-[12px] bg-pulse px-4 text-[14px] font-bold text-white"
                >
                  Confirm delete
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDel(true)}
                  className="flex items-center justify-center rounded-[12px] border border-line bg-paper px-4 text-muted2"
                  aria-label="Delete exercise"
                >
                  <Icon name="trash" size={16} color="currentColor" />
                </button>
              ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[12px] bg-paper p-3">
      <Kicker>{label}</Kicker>
      <div className="mt-[6px] text-[14px] font-bold text-ink">{children}</div>
    </div>
  );
}
