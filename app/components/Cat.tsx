"use client";

/**
 * Le Chaton Fat — the pixel sprite cat.
 *
 * Renders one frame of the 5x2 fatness sheet (public/sprites/cat-fatness-normalized.png)
 * as a CSS background-image — chosen by `fat` (0 skinny -> 9 chonky). Using a
 * background-image (not an <img>) means no loading-placeholder box flashes in on
 * refresh. Crown appears at the final stage.
 */

export const COLS = 5;
export const ROWS = 2;
export const FRAME_COUNT = COLS * ROWS;

const SHEET = "/sprites/cat-fatness-normalized.png";
const TILE = 232;

export default function Cat({ fat = 0, stageIndex = 0 }: { fat?: number; stageIndex?: number }) {
  const f = Math.max(0, Math.min(1, fat));
  const glow = stageIndex >= 4;
  const crowned = stageIndex >= 7;

  const frame = Math.round(f * (FRAME_COUNT - 1));
  const col = frame % COLS;
  const row = Math.floor(frame / COLS);

  return (
    <div className="animate-breathe" style={{ position: "relative", width: TILE, height: TILE }}>
      {/* ground shadow */}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: TILE * (0.4 + f * 0.45),
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
        <div style={{ position: "absolute", left: "50%", top: -6, transform: "translateX(-50%)", fontSize: 34, zIndex: 9, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))" }}>👑</div>
      )}

      <div
        style={{
          width: TILE,
          height: TILE,
          backgroundImage: `url(${SHEET})`,
          backgroundSize: `${TILE * COLS}px ${TILE * ROWS}px`,
          backgroundPosition: `${-col * TILE}px ${-row * TILE}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
