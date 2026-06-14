"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, Kicker } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { TYPE_META, type WorkoutType } from "@/lib/types";

interface Item {
  id: string;
  name: string;
  type: WorkoutType;
  count: number;
}

export function RoutinesView({ items }: { items: Item[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("workout_templates")
      .insert({
        user_id: user.id,
        name: "New routine",
        type: "gym",
        position: items.length,
      })
      .select("id")
      .single();
    if (data) router.push(`/routines/${data.id}`);
  }

  return (
    <div className="flex flex-col gap-3 animate-popIn">
      <button
        onClick={create}
        disabled={creating}
        className="flex items-center justify-center gap-2 rounded-card bg-ink py-[15px] text-[15px] font-bold text-white disabled:opacity-60"
      >
        <Icon name="plus" size={18} color="#fff" />
        New routine
      </button>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-[14px] text-muted">
          No routines yet. Create reusable templates like Push Day, Pull Day or
          Leg Day and start a session from them in one tap.
        </Card>
      ) : (
        items.map((t) => {
          const tm = TYPE_META[t.type];
          return (
            <Link key={t.id} href={`/routines/${t.id}`}>
              <Card className="flex items-center gap-[14px] p-[15px]">
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
                    {t.type === "gym" ? `${t.count} exercises` : tm.label}
                  </div>
                </div>
                <Kicker>Edit →</Kicker>
              </Card>
            </Link>
          );
        })
      )}
    </div>
  );
}
