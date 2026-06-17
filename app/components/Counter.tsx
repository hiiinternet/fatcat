"use client";

import { useEffect, useRef, useState } from "react";
import { formatParams } from "../lib/game";

/**
 * Smoothly counts the displayed value toward the real value.
 *
 * Uses ONE long-lived animation loop that reads the latest target from a ref,
 * rather than restarting on every prop change — so it stays stable even when an
 * auto-clicker slams the value hundreds of times per second.
 */
export default function Counter({ value, className }: { value: number; className?: string }) {
  const target = useRef(value);
  target.current = value;
  const display = useRef(value);
  const [text, setText] = useState(() => formatParams(value));

  useEffect(() => {
    let raf = 0;
    let last = "";
    const tick = () => {
      const t = target.current;
      const cur = display.current;
      if (!isFinite(t)) {
        display.current = t;
      } else {
        const diff = t - cur;
        // snap when within a small relative/absolute epsilon, else ease 20%/frame
        display.current = Math.abs(diff) < Math.max(1, Math.abs(t) * 1e-4) ? t : cur + diff * 0.2;
      }
      const next = formatParams(display.current);
      if (next !== last) {
        last = next;
        setText(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <span className={className}>{text}</span>;
}
