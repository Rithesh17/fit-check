"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UnitsProvider, useUnits } from "@/lib/units";
import type { Profile } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { ExerciseInfoProvider } from "@/components/exercise/ExerciseInfo";
import { NAV, BOTTOM_ORDER, BOTTOM_LABELS, isActive } from "./nav";

export function AppFrame({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <UnitsProvider initial={profile.units}>
      <ExerciseInfoProvider>
        <div className="flex min-h-[100dvh] justify-center bg-sand">
          <Sidebar profile={profile} />
          <div className="flex w-full min-w-0 flex-1 flex-col pb-[96px] lg:max-w-[1200px] lg:pb-0">
            {children}
          </div>
          <BottomNav />
        </div>
      </ExerciseInfoProvider>
    </UnitsProvider>
  );
}

function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const { units, setUnits } = useUnits();
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-[6px] self-stretch border-r border-line bg-paper px-[18px] py-[26px] lg:flex">
      <div className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <Logo size={34} withWordmark />
      </div>
      {NAV.map((n) => {
        const active = isActive(pathname, n.key);
        return (
          <Link
            key={n.key}
            href={n.href}
            className="flex items-center gap-3 rounded-[12px] px-3 py-[11px] text-[14.5px] transition-colors"
            style={{
              fontWeight: active ? 600 : 500,
              color: active ? "#1A1712" : "#7E776A",
              background: active ? "#F1ECE3" : "transparent",
            }}
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <Icon
                name={n.icon}
                color={active ? "#1A1712" : "#9A9183"}
                size={20}
              />
            </span>
            <span>{n.label}</span>
            {active && (
              <span className="ml-auto h-[6px] w-[6px] rounded-full bg-pulse" />
            )}
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex rounded-[12px] bg-sand p-1">
          <SegBtn
            on={units === "imperial"}
            onClick={() => setUnits("imperial")}
          >
            LB / MI
          </SegBtn>
          <SegBtn on={units === "metric"} onClick={() => setUnits("metric")}>
            KG / KM
          </SegBtn>
        </div>
        <Link
          href="/account"
          className="flex items-center gap-[11px] rounded-[10px] border-t border-line p-2 transition-colors hover:bg-sand"
        >
          <Avatar size={36} />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold">
              {profile.display_name}
            </div>
            <div className="text-[12px] text-muted">
              {profile.streak_days > 0
                ? `Day ${profile.streak_days} streak`
                : "View account"}
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function SegBtn({
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
      className="mono flex-1 rounded-[9px] px-[10px] py-[7px] text-[11px] font-semibold"
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

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center lg:hidden">
      <div
        className="pointer-events-auto flex w-full max-w-[480px] items-end gap-1 border-t border-line px-[14px] pt-[9px]"
        style={{
          background: "rgba(250,247,242,.92)",
          backdropFilter: "blur(14px)",
          paddingBottom: "calc(9px + env(safe-area-inset-bottom))",
        }}
      >
        {BOTTOM_ORDER.map((key) => {
          const item = NAV.find((n) => n.key === key)!;
          const active = isActive(pathname, key);
          if (key === "log") {
            return (
              <Link
                key={key}
                href="/log"
                className="flex flex-1 flex-col items-center pb-[2px]"
              >
                <span
                  className="-mt-[22px] flex h-[50px] w-[50px] items-center justify-center rounded-[17px] bg-pulse shadow-fab"
                >
                  <Icon name="plus" color="#fff" size={24} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={key}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <span className="flex h-6 w-6 items-center justify-center">
                <Icon
                  name={item.icon}
                  color={active ? "#1A1712" : "#B3AB9C"}
                  size={22}
                />
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? "#1A1712" : "#B3AB9C" }}
              >
                {BOTTOM_LABELS[key]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Avatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg,#FF5A3C,#7A4DFF)",
      }}
    />
  );
}
