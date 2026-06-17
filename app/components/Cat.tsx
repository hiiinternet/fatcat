"use client";

/**
 * Le Chaton Fat — the pixel sprite cat.
 *
 * Renders the clean transparent sprite (public/sprites/cat.png) as a CSS
 * background-image (no <img>, so no loading-box flash). Skinny → chonky is done
 * by squishing it narrower at low `fat` and letting the parent scale handle size.
 * Crown appears at the final stage.
 *
 * (The 5x2 fatness sheet is unused — its source was exported without real
 * transparency, so its background couldn't be keyed out cleanly.)
 */

const SPRITE = "/sprites/cat.png";
const TILE = 232;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function Cat({ fat = 0, stageIndex = 0 }: { fat?: number; stageIndex?: number }) {
  const f = Math.max(0, Math.min(1, fat));
  const glow = stageIndex >= 4;
  const crowned = stageIndex >= 7;
  const squish = lerp(0.72, 1, f); // slimmer when skinny, full when chonky

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
          backgroundImage: `url(${SPRITE})`,
          backgroundSize: "contain",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          transform: `scaleX(${squish})`,
          transformOrigin: "center bottom",
        }}
      />
    </div>
  );
}
