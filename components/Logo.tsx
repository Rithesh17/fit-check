import Image from "next/image";

export function Logo({
  size = 34,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <div className="flex items-center gap-[11px]">
      <PulseMark size={size} />
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

// The app icon (same artwork as the Android launcher icon and the favicon).
export function PulseMark({ size = 34 }: { size?: number }) {
  return (
    <Image
      src="/pulse-icon.png"
      alt="Pulse"
      width={size}
      height={size}
      className="shrink-0"
      style={{ borderRadius: size * 0.24 }}
      priority
    />
  );
}
