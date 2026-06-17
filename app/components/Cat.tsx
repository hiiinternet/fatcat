"use client";

/**
 * Le Chaton Fat — a vector (SVG) cat, so it stays crisp at any scale (the cat
 * grows huge late-game). Skinny → chonky via a horizontal squish; crown + glow
 * at the top stages.
 */

const SIZE = 240;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function Cat({ fat = 0, stageIndex = 0 }: { fat?: number; stageIndex?: number }) {
  const f = Math.max(0, Math.min(1, fat));
  const glow = stageIndex >= 4;
  const crowned = stageIndex >= 7;
  const squish = lerp(0.74, 1, f); // slimmer when skinny

  return (
    <div className="animate-breathe" style={{ position: "relative", width: SIZE, height: SIZE }}>
      {/* ground shadow */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: SIZE * (0.42 + f * 0.42),
          height: 22,
          background: "radial-gradient(ellipse at center, rgba(26,22,19,0.18), transparent 70%)",
          filter: "blur(2px)",
        }}
      />
      {glow && (
        <div
          style={{
            position: "absolute",
            inset: -24,
            background: "radial-gradient(circle at 50% 55%, rgba(255,138,61,0.4), transparent 62%)",
            filter: "blur(10px)",
          }}
        />
      )}
      {crowned && (
        <div style={{ position: "absolute", left: "50%", top: -8, transform: "translateX(-50%)", fontSize: 36, zIndex: 9, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))" }}>👑</div>
      )}

      <svg
        viewBox="0 0 240 240"
        width={SIZE}
        height={SIZE}
        style={{ display: "block", transform: `scaleX(${squish})`, transformOrigin: "center bottom", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="catBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e6eaf1" />
          </linearGradient>
          <radialGradient id="catBelly" cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g stroke="#b4bac6" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
          {/* ears (behind the body) */}
          <path d="M70 92 C60 56 72 44 82 48 C95 62 103 80 106 92 Z" fill="url(#catBody)" />
          <path d="M170 92 C180 56 168 44 158 48 C145 62 137 80 134 92 Z" fill="url(#catBody)" />
          {/* inner ears */}
          <path d="M78 84 C74 64 80 58 84 60 C90 70 92 78 92 84 Z" fill="#f3aebb" stroke="none" />
          <path d="M162 84 C166 64 160 58 156 60 C150 70 148 78 148 84 Z" fill="#f3aebb" stroke="none" />

          {/* body / head blob */}
          <path
            d="M120 52 C66 52 30 100 32 152 C34 204 72 232 120 232 C168 232 206 204 208 152 C210 100 174 52 120 52 Z"
            fill="url(#catBody)"
          />
        </g>

        {/* belly highlight */}
        <ellipse cx="120" cy="176" rx="62" ry="58" fill="url(#catBelly)" />

        {/* front paws */}
        <g stroke="#b4bac6" strokeWidth="3" strokeLinejoin="round">
          <ellipse cx="92" cy="196" rx="18" ry="13" fill="url(#catBody)" />
          <ellipse cx="148" cy="196" rx="18" ry="13" fill="url(#catBody)" />
        </g>

        {/* back feet + pads */}
        <g stroke="#b4bac6" strokeWidth="3.2" strokeLinejoin="round">
          <ellipse cx="74" cy="224" rx="27" ry="18" fill="url(#catBody)" />
          <ellipse cx="166" cy="224" rx="27" ry="18" fill="url(#catBody)" />
        </g>
        {[74, 166].map((cx) => (
          <g key={cx} fill="#f0a6b0">
            <ellipse cx={cx} cy={222} rx="11" ry="8.5" />
            <circle cx={cx - 11} cy={214} r="3.4" />
            <circle cx={cx} cy={211} r="3.4" />
            <circle cx={cx + 11} cy={214} r="3.4" />
          </g>
        ))}

        {/* blush */}
        <ellipse cx="83" cy="150" rx="12" ry="6.5" fill="#f6c0c4" opacity="0.75" />
        <ellipse cx="157" cy="150" rx="12" ry="6.5" fill="#f6c0c4" opacity="0.75" />

        {/* closed happy eyes */}
        <g stroke="#5b4636" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M84 138 Q97 128 110 138" />
          <path d="M130 138 Q143 128 156 138" />
        </g>

        {/* nose + mouth */}
        <path d="M113 150 L127 150 L120 158 Z" fill="#e8929f" />
        <g stroke="#5b4636" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M120 158 Q113 166 106 161" />
          <path d="M120 158 Q127 166 134 161" />
        </g>

        {/* whiskers */}
        <g stroke="#b9bdc8" strokeWidth="2.4" strokeLinecap="round">
          <path d="M86 150 L52 146" />
          <path d="M86 158 L52 160" />
          <path d="M154 150 L188 146" />
          <path d="M154 158 L188 160" />
        </g>
      </svg>
    </div>
  );
}
