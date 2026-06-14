"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Kicker } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { TYPE_META, type WorkoutType } from "@/lib/types";
import { LogWorkout, type LibItem, type InitialConfig } from "./LogWorkout";

export interface TemplateLite {
  id: string;
  name: string;
  type: WorkoutType;
  exercises: {
    exercise_id: string | null;
    name: string;
    target: string | null;
    default_sets: number | null;
    default_reps: number | null;
    default_weight_lb: number | null;
  }[];
}

export function LogFlow({
  lib,
  templates,
  repeat,
}: {
  lib: LibItem[];
  templates: TemplateLite[];
  repeat: InitialConfig | null;
}) {
  const [initial, setInitial] = useState<InitialConfig | null>(null);
  const [started, setStarted] = useState(false);

  if (started) return <LogWorkout lib={lib} initial={initial ?? undefined} />;

  function startTemplate(t: TemplateLite) {
    if (t.type === "gym") {
      setInitial({
        type: "gym",
        title: t.name,
        exercises: t.exercises
          .filter((e) => e.exercise_id)
          .map((e) => ({
            exercise_id: e.exercise_id as string,
            name: e.name,
            target: e.target,
            sets: Array.from({ length: Math.max(1, e.default_sets ?? 3) }, () => ({
              w: e.default_weight_lb ?? 0,
              r: e.default_reps ?? 10,
            })),
          })),
      });
    } else {
      setInitial({ type: t.type, title: t.name });
    }
    setStarted(true);
  }

  const quick: { label: string; sub: string; type: WorkoutType; color: string; icon: "dumbbell" | "run" | "racquet" }[] = [
    { label: "Empty strength", sub: "Build as you go", type: "gym", color: "#FF5A3C", icon: "dumbbell" },
    { label: "Cardio", sub: "Run · ride · row", type: "run", color: "#2F6BFF", icon: "run" },
    { label: "Racquet", sub: "Match or rally", type: "racquet", color: "#7A4DFF", icon: "racquet" },
  ];

  return (
    <div className="flex flex-col gap-[18px] animate-popIn">
      {repeat && (
        <button
          onClick={() => {
            setInitial(repeat);
            setStarted(true);
          }}
          className="flex items-center justify-between gap-4 rounded-card p-5 text-left text-white"
          style={{ background: "linear-gradient(135deg,#1A1712,#2A241B)" }}
        >
          <div>
            <Kicker color="#FF8B73">Repeat last</Kicker>
            <div className="display mt-[6px] text-[20px] font-bold">
              {repeat.title}
            </div>
            <div className="text-[13px]" style={{ color: "rgba(255,255,255,.6)" }}>
              {repeat.exercises?.length
                ? `${repeat.exercises.length} exercises, prefilled`
                : "Start again"}
            </div>
          </div>
          <span className="rounded-[12px] bg-pulse px-4 py-3 text-[14px] font-bold">
            Start →
          </span>
        </button>
      )}

      <div>
        <Kicker className="mb-3">Quick start</Kicker>
        <div className="grid grid-cols-3 gap-3">
          {quick.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                setInitial({ type: q.type });
                setStarted(true);
              }}
              className="flex flex-col items-start gap-3 rounded-card border border-line2 bg-card p-4 text-left shadow-card"
            >
              <span
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px]"
                style={{ background: q.color + "18" }}
              >
                <Icon name={q.icon} color={q.color} size={22} />
              </span>
              <div>
                <div className="text-[14px] font-bold leading-tight">{q.label}</div>
                <div className="mt-1 text-[11.5px] text-muted">{q.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Kicker>Your routines</Kicker>
          <Link href="/routines" className="text-[12px] font-semibold text-pulse">
            Manage →
          </Link>
        </div>
        {templates.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="text-[13.5px] text-muted">
              No routines yet. Build reusable templates like Push / Pull / Legs.
            </div>
            <Link
              href="/routines"
              className="rounded-[12px] bg-ink px-4 py-2 text-[13px] font-bold text-white"
            >
              Create a routine
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map((t) => {
              const tm = TYPE_META[t.type];
              return (
                <Card key={t.id} className="flex items-center gap-[14px] p-[15px]">
                  <div
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]"
                    style={{ background: tm.soft }}
                  >
                    <Icon
                      name={t.type === "gym" ? "dumbbell" : t.type === "run" ? "run" : "racquet"}
                      color={tm.color}
                      size={22}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">{t.name}</div>
                    <div className="mt-[3px] text-[12.5px] text-muted">
                      {t.type === "gym"
                        ? `${t.exercises.length} exercises`
                        : tm.label}
                    </div>
                  </div>
                  <Link
                    href={`/routines/${t.id}`}
                    className="rounded-[10px] border border-line bg-paper px-3 py-2 text-[12.5px] font-semibold text-muted2"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => startTemplate(t)}
                    className="rounded-[10px] bg-pulse px-4 py-2 text-[13px] font-bold text-white"
                  >
                    Start
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
