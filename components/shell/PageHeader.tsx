"use client";

import { useUnits } from "@/lib/units";
import { Avatar } from "./AppFrame";

export function PageHeader({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  const { units, toggle } = useUnits();
  return (
    <header
      className="sticky top-0 z-30 px-[18px] pb-3 pt-5 lg:px-[34px] lg:pb-4 lg:pt-[26px]"
      style={{
        background: "rgba(241,236,227,.86)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="kicker mb-[9px]">{kicker}</div>
          <h1 className="display text-[26px] font-bold leading-[1.02] lg:text-[30px]">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-[9px]">
          <button
            onClick={toggle}
            className="mono flex items-center gap-[6px] rounded-full border border-line bg-paper px-[13px] py-2 text-[11px] font-semibold text-ink lg:hidden"
            style={{ letterSpacing: ".06em" }}
          >
            {units === "imperial" ? "LB · MI" : "KG · KM"}
          </button>
          <Avatar size={40} />
        </div>
      </div>
    </header>
  );
}

// content wrapper matching the design's page padding
export function PageContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-[18px] pb-7 pt-1 lg:px-[34px] lg:pb-12">{children}</main>
  );
}
