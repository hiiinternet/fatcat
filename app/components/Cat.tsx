"use client";

/**
 * Le Chaton Fat — a white chonky cat drawn entirely in CSS (no image asset, so
 * nothing flashes in on load). Morphs skinny → fat via `fat` (0..1); gains a glow
 * at higher stages and a tiny crown at the very top.
 */

const TILE = 232;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const WHITE = "linear-gradient(180deg, #ffffff 0%, #dfe3eb 100%)";
const SHADE = "#7a8090";
const PAD_PINK = "#f0a6b0";

export default function Cat({ fat = 0, stageIndex = 0 }: { fat?: number; stageIndex?: number }) {
  const f = Math.max(0, Math.min(1, fat));
  const glow = stageIndex >= 4;
  const crowned = stageIndex >= 7;

  const bodyW = lerp(118, 210, f);
  const bodyH = lerp(150, 178, f);
  const headW = lerp(96, 116, f);
  const footSpread = lerp(30, 64, f);
  const eyeGap = lerp(20, 28, f);
  const half = TILE / 2;

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

      <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 3px 5px rgba(26,22,19,0.12))" }}>
        {crowned && (
          <div style={{ position: "absolute", left: "50%", top: -10, transform: "translateX(-50%)", fontSize: 34, zIndex: 9, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))" }}>👑</div>
        )}

        {/* ears */}
        <div style={{ position: "absolute", left: half - headW / 2 + 6, top: 16, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderBottom: "30px solid #f4f5f8", transform: "rotate(-18deg)", zIndex: 2 }}>
          <div style={{ position: "absolute", left: -7, top: 12, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "15px solid #f2b8bf" }} />
        </div>
        <div style={{ position: "absolute", left: half + headW / 2 - 38, top: 16, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderBottom: "30px solid #f4f5f8", transform: "rotate(18deg)", zIndex: 2 }}>
          <div style={{ position: "absolute", left: -7, top: 12, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "15px solid #f2b8bf" }} />
        </div>

        {/* body */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 14,
            transform: "translateX(-50%)",
            width: bodyW,
            height: bodyH,
            borderRadius: `${lerp(46, 49, f)}% ${lerp(46, 49, f)}% 44% 44% / ${lerp(40, 50, f)}% ${lerp(40, 50, f)}% 48% 48%`,
            background: WHITE,
            boxShadow: `inset 0 -14px 22px rgba(110,116,130,0.16), inset 0 10px 16px rgba(255,255,255,0.7), 0 0 0 2.5px ${SHADE}`,
            zIndex: 1,
          }}
        >
          <div style={{ position: "absolute", left: "50%", bottom: 6, transform: "translateX(-50%)", width: bodyW * 0.6, height: bodyH * 0.6, borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
          <div style={{ position: "absolute", left: "50%", bottom: bodyH * 0.28, transform: `translateX(calc(-50% - ${bodyW * 0.16}px))`, width: 26, height: 18, borderRadius: 99, background: WHITE, boxShadow: `0 0 0 2px ${SHADE}` }} />
          <div style={{ position: "absolute", left: "50%", bottom: bodyH * 0.28, transform: `translateX(calc(-50% + ${bodyW * 0.16}px))`, width: 26, height: 18, borderRadius: 99, background: WHITE, boxShadow: `0 0 0 2px ${SHADE}` }} />
        </div>

        {/* back feet + pink pads */}
        {[-1, 1].map((s) => (
          <div key={s} style={{ position: "absolute", left: `calc(50% + ${s * footSpread - 22}px)`, bottom: 6, width: 44, height: 30, borderRadius: "46% 46% 50% 50%", background: WHITE, boxShadow: `0 0 0 2px ${SHADE}`, zIndex: 3 }}>
            <div style={{ position: "absolute", left: "50%", top: 7, transform: "translateX(-50%)", width: 16, height: 12, borderRadius: 99, background: PAD_PINK }} />
            <div style={{ position: "absolute", left: 6, top: 3, width: 6, height: 6, borderRadius: 99, background: PAD_PINK }} />
            <div style={{ position: "absolute", right: 6, top: 3, width: 6, height: 6, borderRadius: 99, background: PAD_PINK }} />
          </div>
        ))}

        {/* closed happy eyes */}
        {[-1, 1].map((s) => (
          <div key={s} style={{ position: "absolute", left: `calc(50% + ${s * (eyeGap / 2) - 10}px)`, top: 74, width: 20, height: 11, borderTop: "3px solid #3a3a3a", borderRadius: "50% 50% 0 0", zIndex: 5 }} />
        ))}
        {/* nose + smile */}
        <div style={{ position: "absolute", left: "50%", top: 86, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #e89aa6", zIndex: 6 }} />
        <div style={{ position: "absolute", left: "50%", top: 95, transform: "translateX(-50%)", width: 16, height: 8, borderBottom: "2.5px solid #6b5b52", borderRadius: "0 0 12px 12px", zIndex: 6 }} />
        {/* whiskers */}
        {[-1, 1].map((s) =>
          [0, 1].map((i) => (
            <div key={`${s}-${i}`} style={{ position: "absolute", top: 86 + i * 8, left: s < 0 ? half - 54 : half + 18, width: 34, height: 1.5, background: "rgba(120,120,120,0.5)", borderRadius: 99, transform: `rotate(${s * (i === 0 ? -6 : 8)}deg)`, transformOrigin: s < 0 ? "right center" : "left center", zIndex: 5 }} />
          )),
        )}
      </div>
    </div>
  );
}
