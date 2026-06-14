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

// Minimalist heart-rate / pulse waveform inside a rounded tile.
export function PulseMark({ size = 34 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: "#1A1712",
      }}
      aria-label="Pulse"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 16.5 H10 L12.4 16.5 L14.6 9.5 L17.6 22.5 L20 16.5 H28"
          stroke="#FF5A3C"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="14.6" cy="9.5" r="1.7" fill="#FF5A3C">
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
