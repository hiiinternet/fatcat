/* ─────────────────────────────────────────────────────────────────────────
 * MOTION STORYBOARD  ·  Le Chaton Fat
 *
 * Spring-first, GPU-only (transform/opacity). All timing/physics lives here so
 * the whole feel is tunable from one file.
 *
 *   on mount      HUD drops in (−24y), side panels slide in (±28x),
 *                 bottom controls rise (+28y), cat fades up — lightly staggered
 *   on feed       cat squashes (scaleY .86) then stretches (1.08) and settles
 *                 a "+N" pops (scale .4→1.4→1), rises 96px, fades out
 *   passive       counter eases toward target ~20%/frame (see Counter.tsx)
 *   bars          fills animate via scaleX (compositor-only) on a soft spring
 *   zoomies       powerup pops in (snappy spring) and idles with a CSS bob
 *   reduced-motion honored globally via <MotionConfig reducedMotion="user">
 * ───────────────────────────────────────────────────────────────────────── */

import type { Transition, TargetAndTransition } from "framer-motion";

const spring = (stiffness: number, damping: number): Transition => ({ type: "spring", stiffness, damping });

export const SPRING = {
  smooth: spring(300, 30), // cards / modals settle
  snappy: spring(520, 26), // pop-ins, toasts, badges
  balanced: spring(360, 30), // slide entrances
  bar: spring(200, 26), // progress / benchmark fills
  soft: spring(150, 20), // the big cat growth between stages
};

/* Cat feed reaction — squash on impact, stretch on rebound, settle. */
export const CAT_BOUNCE: TargetAndTransition = {
  scaleX: [1, 1.13, 0.95, 1.03, 1],
  scaleY: [1, 0.86, 1.08, 0.98, 1],
  transition: { duration: 0.42, times: [0, 0.16, 0.42, 0.72, 1], ease: "easeOut" },
};

/* Floating "+N" feedback — overshoot pop, rise, fade. */
export const FLOATER = {
  initial: { y: 6, opacity: 0, scale: 0.4 },
  animate: { y: -96, opacity: [0, 1, 1, 0], scale: [0.4, 1.4, 1.12, 1] },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } as Transition,
};

/* Entrance offsets (paired with a spring + small delay at the call site). */
export const ENTER = {
  hud: { initial: { y: -24, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  left: { initial: { x: -28, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  right: { initial: { x: 28, opacity: 0 }, animate: { x: 0, opacity: 1 } },
  bottom: { initial: { y: 28, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  cat: { initial: { y: 22, opacity: 0 }, animate: { y: 0, opacity: 1 } },
};
