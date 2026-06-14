"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { Units } from "./types";
import { makeFmt, type Fmt } from "./format";
import { createClient } from "./supabase/client";

interface UnitsCtx {
  units: Units;
  imperial: boolean;
  setUnits: (u: Units) => void;
  toggle: () => void;
  fmt: Fmt;
}

const Ctx = createContext<UnitsCtx | null>(null);

export function UnitsProvider({
  initial,
  children,
}: {
  initial: Units;
  children: React.ReactNode;
}) {
  const [units, setUnitsState] = useState<Units>(initial);

  const setUnits = useCallback((u: Units) => {
    setUnitsState(u);
    try {
      localStorage.setItem("pulse:units", u);
    } catch {}
    // persist to profile (fire and forget)
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .update({ units: u })
          .eq("id", data.user.id)
          .then(() => {});
      }
    });
  }, []);

  const toggle = useCallback(
    () => setUnits(units === "imperial" ? "metric" : "imperial"),
    [units, setUnits],
  );

  const value = useMemo<UnitsCtx>(
    () => ({
      units,
      imperial: units === "imperial",
      setUnits,
      toggle,
      fmt: makeFmt(units),
    }),
    [units, setUnits, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUnits() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUnits must be used within UnitsProvider");
  return ctx;
}
