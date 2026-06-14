"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUnits } from "@/lib/units";
import { Card, Kicker, Chip } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useExerciseInfo, InfoButton } from "@/components/exercise/ExerciseInfo";
import { ExerciseForm } from "@/components/exercise/ExerciseForm";

export interface ExItem {
  id: string;
  name: string;
  category: string;
  equipment: string;
  bestLb: number;
  custom: boolean;
}

const CATS = ["All", "Mine", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

function catColor(c: string) {
  return c === "Cardio" ? "#2F6BFF" : "#FF5A3C";
}

export function ExercisesView({ items }: { items: ExItem[] }) {
  const { fmt } = useUnits();
  const router = useRouter();
  const { open } = useExerciseInfo();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter(
      (e) =>
        (cat === "All" ||
          (cat === "Mine" ? e.custom : e.category === cat)) &&
        (!query || e.name.toLowerCase().includes(query)),
    );
  }, [items, cat, q]);

  return (
    <div className="flex flex-col gap-3 animate-popIn">
      <div className="flex gap-2">
        <Card className="flex flex-1 items-center gap-[10px] px-4 py-[13px]">
          <span className="text-[16px] text-faint">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${items.length} exercises…`}
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-[#B3AB9C]"
          />
        </Card>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-card bg-ink px-4 text-[14px] font-bold text-white"
        >
          <Icon name="plus" size={18} color="#fff" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      <div className="scrollx flex gap-2 overflow-x-auto pb-[2px]">
        {CATS.map((c) => (
          <Chip
            key={c}
            active={cat === c}
            onClick={() => setCat(c)}
            activeColor={c === "Cardio" ? "#2F6BFF" : "#1A1712"}
          >
            {c}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <Card className="p-8 text-center text-[14px] text-muted">
          {cat === "Mine"
            ? "You haven't added any custom exercises yet."
            : `No exercises match “${q}”.`}
        </Card>
      ) : (
        list.map((e) => {
          const col = catColor(e.category);
          return (
            <Card
              key={e.id}
              className="flex cursor-pointer items-center gap-[14px] p-[15px]"
              onClick={() => open(e.id)}
            >
              <div
                className="w-1 self-stretch rounded-full"
                style={{ background: col }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[15px] font-bold">
                  {e.name}
                  {e.custom && (
                    <span className="text-[10px] font-semibold text-racquet">
                      CUSTOM
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="mono rounded-[5px] px-[7px] py-[3px] text-[10.5px] font-semibold"
                    style={{ color: col, background: col + "15" }}
                  >
                    {e.category.toUpperCase()}
                  </span>
                  <span className="text-[12px] text-muted">{e.equipment}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Kicker>Best</Kicker>
                <div className="display mt-[5px] text-[14px] font-bold">
                  {e.bestLb > 0 ? `${fmt.wt(e.bestLb)} ${fmt.wtU()}` : "—"}
                </div>
              </div>
              <InfoButton exerciseId={e.id} />
            </Card>
          );
        })
      )}

      {creating && (
        <ExerciseForm
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
