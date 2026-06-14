import * as React from "react";

// ---- Card ----
export function Card({
  className = "",
  style,
  children,
  as: As = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
}) {
  return (
    <As
      className={
        "rounded-card border border-line2 bg-card shadow-card " + className
      }
      style={style}
      {...rest}
    >
      {children}
    </As>
  );
}

// ---- Kicker (mono uppercase label) ----
export function Kicker({
  children,
  color,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={"kicker " + className}
      style={color ? { color } : undefined}
    >
      {children}
    </div>
  );
}

// ---- Big display number ----
export function BigNum({
  children,
  size = 34,
  color,
  className = "",
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={"display font-bold leading-none " + className}
      style={{ fontSize: size, letterSpacing: "-.03em", color }}
    >
      {children}
    </span>
  );
}

// ---- Pill / chip toggle ----
export function Chip({
  active,
  onClick,
  children,
  activeColor = "#1A1712",
  className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  activeColor?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 whitespace-nowrap rounded-full px-[14px] py-2 text-[12.5px] font-semibold transition-colors " +
        className
      }
      style={{
        border: active ? "none" : "1px solid #E7E0D3",
        background: active ? activeColor : "#FAF7F2",
        color: active ? "#fff" : "#7E776A",
      }}
    >
      {children}
    </button>
  );
}

// ---- coloured delta badge ----
export function Delta({
  children,
  color = "#FF5A3C",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="mono rounded-md px-[6px] py-[3px] text-[10px] font-semibold leading-none"
      style={{ color, background: color + "18" }}
    >
      {children}
    </span>
  );
}

export function GoodDelta({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mono rounded-md px-[7px] py-[4px] text-[10px] font-semibold leading-none"
      style={{ color: "#6FB52B", background: "#EEF7DD" }}
    >
      {children}
    </span>
  );
}
