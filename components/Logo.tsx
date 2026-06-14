export function Logo({
  size = 34,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  const dot = Math.round(size * 0.38);
  return (
    <div className="flex items-center gap-[11px]">
      <div
        className="flex items-center justify-center"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          background: "#1A1712",
        }}
      >
        <div
          className="rounded-full bg-pulse animate-pulseRing"
          style={{ width: dot, height: dot }}
        />
      </div>
      {withWordmark && (
        <div
          className="display font-extrabold"
          style={{ fontSize: 20, letterSpacing: "-.02em" }}
        >
          PULSE
        </div>
      )}
    </div>
  );
}
