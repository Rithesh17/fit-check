"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnits } from "@/lib/units";
import { createClient } from "@/lib/supabase/client";
import { Card, Kicker } from "@/components/ui";
import { Modal } from "@/components/exercise/ExerciseForm";
import { BodyView, type BodyData } from "./BodyView";
import type { Profile } from "@/lib/types";

const PARTS = ["Chest", "Waist", "Hips", "L Arm", "Thigh", "Calf"];

export function AccountView({
  profile,
  body,
  email,
}: {
  profile: Profile;
  body: BodyData;
  email: string;
}) {
  const { units, setUnits, fmt, imperial } = useUnits();
  const router = useRouter();

  const [name, setName] = useState(profile.display_name);
  const [weightGoal, setWeightGoal] = useState(
    profile.weight_goal_lb != null ? String(fmt.wt(profile.weight_goal_lb)) : "",
  );
  const [workoutGoal, setWorkoutGoal] = useState(
    profile.weekly_workout_goal != null ? String(profile.weekly_workout_goal) : "",
  );
  const [volumeGoal, setVolumeGoal] = useState(
    profile.weekly_volume_goal_lb != null
      ? String(fmt.wt(profile.weekly_volume_goal_lb))
      : "",
  );
  const [savedMsg, setSavedMsg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMeas, setEditMeas] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const toLb = (v: string) =>
      v ? Math.round((imperial ? +v : +v / 0.453592) * 10) / 10 : null;
    await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || "Athlete",
        weight_goal_lb: toLb(weightGoal),
        weekly_workout_goal: workoutGoal ? parseInt(workoutGoal) : null,
        weekly_volume_goal_lb: toLb(volumeGoal),
      })
      .eq("id", profile.id);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
    router.refresh();
  }

  async function deleteAccount() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.rpc("delete_my_account");
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-[14px] animate-popIn">
      {/* profile */}
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <Kicker>Profile</Kicker>
          <span className="text-[12px] text-muted">{email}</span>
        </div>
        <label className="block">
          <span className="kicker mb-2 block">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[12px] text-[15px] outline-none focus:border-pulse"
          />
        </label>
        <div>
          <span className="kicker mb-2 block">Units</span>
          <div className="flex w-[220px] rounded-[12px] bg-sand p-1">
            <Seg on={units === "imperial"} onClick={() => setUnits("imperial")}>
              LB / MI
            </Seg>
            <Seg on={units === "metric"} onClick={() => setUnits("metric")}>
              KG / KM
            </Seg>
          </div>
        </div>
      </Card>

      {/* goals */}
      <Card className="flex flex-col gap-4 p-5">
        <Kicker>Goals</Kicker>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Workouts / week"
            value={workoutGoal}
            onChange={setWorkoutGoal}
            placeholder="4"
          />
          <Field
            label={`Volume / week (${fmt.wtU()})`}
            value={volumeGoal}
            onChange={setVolumeGoal}
            placeholder="40000"
          />
          <Field
            label={`Target weight (${fmt.wtU()})`}
            value={weightGoal}
            onChange={setWeightGoal}
            placeholder="168"
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="rounded-[14px] bg-ink py-[13px] text-[15px] font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : savedMsg ? "Saved ✓" : "Save profile & goals"}
        </button>
      </Card>

      {/* body metrics (reused) */}
      <div className="flex items-center justify-between pt-1">
        <Kicker>Body</Kicker>
        <button
          onClick={() => setEditMeas(true)}
          className="text-[12px] font-semibold text-pulse"
        >
          Update measurements →
        </button>
      </div>
      <BodyView data={body} />

      {/* danger zone */}
      <Card className="flex flex-col gap-3 p-5">
        <Kicker color="#C18A3A">Account</Kicker>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-[12px] border border-line bg-paper py-[12px] text-[14px] font-semibold text-ink"
          >
            Sign out
          </button>
        </form>
        {confirmDelete ? (
          <div className="flex flex-col gap-2 rounded-[12px] bg-pulseSoft p-3">
            <div className="text-[13px] font-medium text-pulse">
              This permanently deletes your account and all data. This can&rsquo;t
              be undone.
            </div>
            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleting}
                className="flex-1 rounded-[10px] bg-pulse py-[10px] text-[13px] font-bold text-white"
              >
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-[10px] border border-line bg-card px-4 text-[13px] font-semibold text-muted2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-[12px] border border-[#F0CFC6] bg-card py-[12px] text-[14px] font-semibold text-pulse"
          >
            Delete account
          </button>
        )}
      </Card>

      {editMeas && (
        <MeasurementsEditor
          current={body.measurements}
          onClose={() => setEditMeas(false)}
          onSaved={() => {
            setEditMeas(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function MeasurementsEditor({
  current,
  onClose,
  onSaved,
}: {
  current: { part: string; value_in: number }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { fmt, imperial } = useUnits();
  const init: Record<string, string> = {};
  for (const p of PARTS) {
    const c = current.find((m) => m.part === p);
    init[p] = c ? String(fmt.len(c.value_in)) : "";
  }
  const [vals, setVals] = useState(init);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const rows = PARTS.filter((p) => vals[p]).map((p) => ({
      user_id: user.id,
      measured_on: today,
      part: p,
      value_in: Math.round((imperial ? +vals[p] : +vals[p] / 2.54) * 10) / 10,
    }));
    // remove today's rows for these parts then insert
    await supabase
      .from("body_measurements")
      .delete()
      .eq("user_id", user.id)
      .eq("measured_on", today);
    if (rows.length) await supabase.from("body_measurements").insert(rows);
    setSaving(false);
    onSaved();
  }

  return (
    <Modal title="Update measurements" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {PARTS.map((p) => (
          <Field
            key={p}
            label={`${p} (${fmt.lenU()})`}
            value={vals[p]}
            onChange={(v) => setVals((s) => ({ ...s, [p]: v }))}
            placeholder="—"
          />
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 w-full rounded-[14px] bg-ink py-[13px] text-[15px] font-bold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save measurements"}
      </button>
    </Modal>
  );
}

function Field({
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
        className="w-full rounded-[12px] border border-line bg-paper px-[14px] py-[11px] text-[15px] outline-none focus:border-pulse"
      />
    </label>
  );
}

function Seg({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="mono flex-1 rounded-[9px] px-[10px] py-[8px] text-[11px] font-semibold"
      style={{
        letterSpacing: ".04em",
        background: on ? "#fff" : "transparent",
        color: on ? "#1A1712" : "#A39B8B",
        boxShadow: on ? "0 1px 3px rgba(0,0,0,.08)" : "none",
      }}
    >
      {children}
    </button>
  );
}
