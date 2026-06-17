"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig, useAnimationControls, useMotionValue, useSpring } from "framer-motion";
import Cat from "./components/Cat";
import Counter from "./components/Counter";
import { CAT_BOUNCE, ENTER, FLOATER, SPRING } from "./lib/motion";
import {
  ACHIEVEMENTS,
  BASE_CLICK,
  BENCH_COLS,
  CATS,
  COMPETITORS,
  CONTEXT_BY_STAGE,
  costOf,
  EXPERTS_BY_STAGE,
  formatParams,
  quotePool,
  revealOf,
  STAGE_QUOTES,
  STAGES,
  stageIndexFor,
  START_PARAMS,
  UPGRADES,
  ZOOMIE_MS,
  ZOOMIE_MULT,
  ZOOMIE_QUOTE,
} from "./lib/game";

const SAVE_KEY = "le-chaton-fat-save-v3";
const FINAL_THRESHOLD = STAGES[STAGES.length - 1].threshold; // 30T
const CAT_ICON: Record<string, string> = Object.fromEntries(CATS.map((c) => [c.id, c.emoji]));

// Background per stage — the view zooms out (café → rooftops → city → orbit → solar system)
// as the cat outgrows the world. Stages 0–1 share the close café.
const BG_BY_STAGE = ["/cafe-bg.png", "/cafe-bg.png", "/bg-2.png", "/bg-3.png", "/bg-4.png", "/bg-5.png", "/bg-6.png", "/bg-7.png"];

type SaveState = {
  v: number;
  parameters: number;
  peak: number;
  owned: Record<string, number>;
  achievements: string[];
  timePlayed: number;
};

type Particle = { id: number; emoji: string; dx: number; dy: number; rot: number };
type Floater = { id: number; text: string; x: number };
type Toast = { key: number; achId: string };
type SheetId = "upgrades" | "stats" | "bench" | "awards";

// ---------------------------------------------------------------------------

export default function LeChatonFat() {
  const [mounted, setMounted] = useState(false);

  const [parameters, setParameters] = useState(START_PARAMS);
  const [peak, setPeak] = useState(START_PARAMS);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [achievements, setAchievements] = useState<string[]>([]);
  const [timePlayed, setTimePlayed] = useState(0);
  const [boostUntil, setBoostUntil] = useState(0);
  const [clickedDuringZoomies, setClickedDuringZoomies] = useState(false);

  const [infoTab, setInfoTab] = useState<SheetId>("stats");
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [zoomie, setZoomie] = useState<{ id: number; top: number; left: number } | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const prevStageRef = useRef(-1);

  const [quote, setQuote] = useState<{ text: string; key: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const idRef = useRef(1);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFxRef = useRef(0);
  const catControls = useAnimationControls();

  // ---- economy ----
  const { clickAdds, genAdds, multSum, benchBoost } = useMemo(() => {
    let click = 0, gen = 0, mult = 0, bench = 0;
    for (const u of UPGRADES) {
      const c = owned[u.id] || 0;
      if (!c) continue;
      if (u.kind === "click") click += u.amount * c;
      else if (u.kind === "gen") gen += u.amount * c;
      else if (u.kind === "mult") mult += u.amount * c;
      else if (u.kind === "bench") bench += u.amount * c;
    }
    return { clickAdds: click, genAdds: gen, multSum: mult, benchBoost: bench };
  }, [owned]);

  const globalMult = 1 + multSum;
  const clickPower = (BASE_CLICK + clickAdds) * globalMult;
  const pps = genAdds * globalMult;

  // Stages unlock by parameter count (final = 30T). Thresholds are tuned for pacing.
  const stageIdx = stageIndexFor(peak);
  const stage = STAGES[stageIdx];
  const nextStage = STAGES[stageIdx + 1];
  const bgSrc = BG_BY_STAGE[Math.min(stageIdx, BG_BY_STAGE.length - 1)];

  const now = mounted ? Date.now() : 0;
  const boostActive = boostUntil > now;
  const boostLeft = boostActive ? Math.ceil((boostUntil - now) / 1000) : 0;

  const stageProgress = nextStage
    ? Math.max(0, Math.min(1, (peak - stage.threshold) / (nextStage.threshold - stage.threshold)))
    : 1;

  // Cat grows continuously with parameters (log-scaled; maxes out at the 30T finale).
  const fatLevel = peak <= 1 ? 0 : Math.max(0, Math.min(1, Math.log10(peak) / Math.log10(FINAL_THRESHOLD)));
  const targetScale = 1 + fatLevel * 3.6;
  const scaleMV = useMotionValue(targetScale);
  const catScale = useSpring(scaleMV, { stiffness: 150, damping: 20, mass: 0.8 });
  useEffect(() => {
    scaleMV.set(targetScale);
  }, [targetScale, scaleMV]);

  const experts = EXPERTS_BY_STAGE[stageIdx];
  const specChips = [
    `⚡ 30T MoE`,
    `🧠 ${typeof experts === "number" ? experts.toLocaleString() : experts} experts`,
    `📜 ${CONTEXT_BY_STAGE[stageIdx]} ctx`,
    `🎨 Multimodal`,
    `🌍 Multilingual`,
    `🤖 Literally AGI`,
  ];
  const multLabel = globalMult >= 100 ? `×${Math.round(globalMult)}` : `×${globalMult.toFixed(globalMult >= 10 ? 1 : 2)}`;

  const ppsRef = useRef(pps);
  const clickPowerRef = useRef(clickPower);
  const boostRef = useRef(boostUntil);
  const stageIdxRef = useRef(0);
  ppsRef.current = pps;
  clickPowerRef.current = clickPower;
  boostRef.current = boostUntil;
  stageIdxRef.current = stageIdx;

  // the cat's speech bubble (defined early so effects can use it)
  const say = useCallback((text: string) => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    setQuote({ text, key: idRef.current++ });
    quoteTimer.current = setTimeout(() => setQuote(null), 4200);
  }, []);

  // ---- load ----
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SaveState;
        if (s && typeof s.parameters === "number") {
          setParameters(s.parameters);
          setPeak(Math.max(s.peak ?? s.parameters, START_PARAMS));
          setOwned(s.owned || {});
          setAchievements(s.achievements || []);
          setTimePlayed(s.timePlayed || 0);
        }
      }
    } catch {
      /* fresh */
    }
  }, []);

  useEffect(() => {
    setPeak((pk) => (parameters > pk ? parameters : pk));
  }, [parameters]);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      const boosted = Date.now() < boostRef.current ? ZOOMIE_MULT : 1;
      const gain = ppsRef.current * 0.1 * boosted;
      if (gain > 0) setParameters((p) => p + gain);
    }, 100);
    return () => clearInterval(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => setTimePlayed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [mounted]);

  const snapshotRef = useRef<SaveState>(null as unknown as SaveState);
  snapshotRef.current = { v: 3, parameters, peak, owned, achievements, timePlayed };
  useEffect(() => {
    if (!mounted) return;
    const save = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(snapshotRef.current));
      } catch {
        /* ignore */
      }
    };
    const id = setInterval(save, 3000);
    window.addEventListener("beforeunload", save);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", save);
      save();
    };
  }, [mounted]);

  // 3AM Zoomies powerup
  useEffect(() => {
    if (!mounted || zoomie) return;
    const delay = (35 + Math.random() * 55) * 1000;
    const id = setTimeout(() => {
      setZoomie({ id: idRef.current++, top: 26 + Math.random() * 42, left: 16 + Math.random() * 64 });
    }, delay);
    return () => clearTimeout(id);
  }, [mounted, zoomie]);

  useEffect(() => {
    if (!zoomie) return;
    const id = setTimeout(() => setZoomie(null), 11000);
    return () => clearTimeout(id);
  }, [zoomie]);

  // Stage-up celebration (Cookie-Clicker dopamine beat) — fires only on increase
  useEffect(() => {
    if (!mounted) return;
    if (prevStageRef.current >= 0 && stageIdx > prevStageRef.current) {
      setCelebrate(STAGES[stageIdx].name);
      catControls.start(CAT_BOUNCE);
      prevStageRef.current = stageIdx;
      const q = setTimeout(() => say(STAGE_QUOTES[stageIdx] ?? "State of the art."), 700);
      const t = setTimeout(() => setCelebrate(null), 2800);
      return () => {
        clearTimeout(q);
        clearTimeout(t);
      };
    }
    prevStageRef.current = stageIdx;
  }, [stageIdx, mounted, catControls, say]);

  // achievements
  useEffect(() => {
    const has = (id: string) => achievements.includes(id);
    const o = (id: string) => owned[id] || 0;
    const newly: string[] = [];
    const want = (cond: boolean, id: string) => {
      if (cond && !has(id)) newly.push(id);
    };
    const catCount = UPGRADES.filter((u) => u.cat === "cat").reduce((s, u) => s + (owned[u.id] || 0), 0);
    want(o("orange-energy") >= 1, "orange");
    want(o("orange-energy") >= 5, "very-orange");
    want(o("orange-energy") >= 10, "extremely-orange");
    want(clickedDuringZoomies, "cat-on-keyboard");
    want(o("sunny-window") >= 1, "touch-grass");
    want(o("nuclear") >= 1, "peak-french"); // own the nuclear plant — no longer order-locked
    want(stageIdx >= 5, "catastrophic");
    want(o("cardboard-box") >= 1 && stageIdx >= 4, "fits-poorly");
    want(peak >= 1e6, "local-first"); // positive milestone — always reachable
    want(catCount >= 10, "distributed");
    want(stageIdx >= STAGES.length - 1, "frontier-floof");
    if (newly.length) {
      setAchievements((a) => [...a, ...newly]);
      const made = newly.map((achId) => ({ achId, key: idRef.current++ }));
      setToasts((t) => [...t, ...made]);
      made.forEach((m) => setTimeout(() => setToasts((t) => t.filter((x) => x.key !== m.key)), 5000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owned, peak, stageIdx, clickedDuringZoomies, achievements]);

  // ---- handlers ----

  const feed = useCallback(() => {
    const boosted = Date.now() < boostRef.current;
    const gain = clickPowerRef.current * (boosted ? ZOOMIE_MULT : 1);
    // score always counts — even under a rapid-fire auto-clicker
    setParameters((p) => p + gain);
    if (boosted) setClickedDuringZoomies(true);

    // throttle the (expensive) visual FX so auto-clickers can't flood the DOM
    const t = Date.now();
    if (t - lastFxRef.current < 45) return;
    lastFxRef.current = t;

    catControls.start(CAT_BOUNCE);
    const made: Particle[] = [];
    const crumbs = ["✨", "🟤", "🥐", "·", "✨"];
    for (let i = 0; i < 5; i++) made.push({ id: idRef.current++, emoji: crumbs[i % crumbs.length], dx: (Math.random() - 0.5) * 150, dy: -40 - Math.random() * 70, rot: (Math.random() - 0.5) * 120 });
    setParticles((p) => [...p, ...made].slice(-48));
    setFloaters((f) => [...f, { id: idRef.current++, text: `+${formatParams(gain)}`, x: (Math.random() - 0.5) * 90 }].slice(-14));
    if (Math.random() < 0.13) {
      const pool = quotePool(stageIdxRef.current);
      say(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [catControls, say]);

  const buy = useCallback(
    (id: string, baseCost: number) => {
      const o = owned[id] || 0;
      const cost = costOf(baseCost, o);
      if (parameters < cost) return;
      // both updaters are top-level + pure: no nested setState (which Strict Mode
      // would double-invoke, charging twice and bottoming the counter out at 0).
      setParameters((p) => Math.max(0, p - cost));
      setOwned((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    },
    [owned, parameters],
  );

  const grabZoomie = useCallback(() => {
    setBoostUntil(Date.now() + ZOOMIE_MS);
    setZoomie(null);
    say(ZOOMIE_QUOTE);
  }, [say]);

  const resetGame = useCallback(() => {
    if (!confirm("Reset Le Chaton Fat back to a skinny kitten? This cannot be undone.")) return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    setParameters(START_PARAMS);
    setPeak(START_PARAMS);
    setOwned({});
    setAchievements([]);
    setTimePlayed(0);
    setBoostUntil(0);
    setClickedDuringZoomies(false);
  }, []);


  const mm = String(Math.floor(timePlayed / 60)).padStart(2, "0");
  const ss = String(timePlayed % 60).padStart(2, "0");

  // ---- content blocks ----
  const effectStr = (kind: string, amount: number) => {
    if (kind === "click") return `+${formatParams(amount)} / feed`;
    if (kind === "gen") return `+${formatParams(amount)} / sec`;
    if (kind === "mult") return `+${Math.round(amount * 100)}% all`;
    return `+${amount.toFixed(1)} bench pts`;
  };
  const shopList = UPGRADES.filter((u) => peak >= revealOf(u)).sort((a, b) => a.baseCost - b.baseCost);

  const upgradesInner = (
    <div className="hide-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
      {shopList.length === 0 ? (
        <LockedHint text="Keep feeding the cat — upgrades appear once you can nearly afford them." />
      ) : (
        shopList.map((u) => {
          const o = owned[u.id] || 0;
          const cost = costOf(u.baseCost, o);
          return <ShopItem key={u.id} emoji={u.emoji} catIcon={CAT_ICON[u.cat]} name={u.name} desc={u.desc} effect={effectStr(u.kind, u.amount)} cost={formatParams(cost)} owned={o} afford={parameters >= cost} onBuy={() => buy(u.id, u.baseCost)} />;
        })
      )}
    </div>
  );

  const statsInner = (
    <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pr-0.5">
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Per Feed" value={`+${formatParams(clickPower)}`} accent />
        <MiniStat label="Params / sec" value={`+${formatParams(pps)}`} />
        <MiniStat label="Multiplier" value={multLabel} accent />
        <MiniStat label="Time Played" value={`${mm}:${ss}`} />
      </div>
      <div className="mt-2 gframe-soft p-3">
        <div className="flex items-baseline justify-between">
          <p className="font-pixel text-[11px] uppercase tracking-wide text-muted">Stage {stageIdx + 1} / {STAGES.length}</p>
          <p className="tnum font-pixel text-[11px] text-muted">{nextStage ? `next @ ${formatParams(nextStage.threshold)}` : "final ★"}</p>
        </div>
        <p className="font-pixel text-xl text-ember">{stage.name}</p>
        <p className="mt-0.5 text-[11px] italic text-muted">{stage.tagline}</p>
        <div className="mt-1.5"><Bar progress={stageProgress} hero /></div>
      </div>
      <button onClick={resetGame} className="gbtn-ghost mt-2 w-full py-2 font-pixel text-[12px]">Reset Progress</button>
    </div>
  );

  const benchInner = (
    <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pr-0.5">
      <BenchmarkTable stageIdx={stageIdx} benchBoost={benchBoost} />
      <p className="pt-2 text-[10px] leading-snug text-muted">*Self-reported. Le Chaton Fat outperforms Claude Fable 5 on every benchmark. Scores over 100 mean it exceeded the benchmark&apos;s maximum. This is fine.</p>
    </div>
  );

  const awardsInner = (
    <div className="hide-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
      {ACHIEVEMENTS.map((a) => {
        const got = achievements.includes(a.id);
        return (
          <div key={a.id} className={`flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-1.5 ${got ? "border-orange/60 bg-orange/10" : "border-line bg-cream/50"}`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${got ? "bg-orange text-white" : "bg-paper text-muted ring-2 ring-line"}`}>{got ? "★" : "☆"}</span>
            <div className="min-w-0">
              <p className={`truncate font-pixel text-[13px] ${got ? "text-ink" : "text-muted"}`}>{a.name}</p>
              <p className="truncate text-[10px] text-muted">{a.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const innerByKey: Record<SheetId, React.ReactNode> = { upgrades: upgradesInner, stats: statsInner, bench: benchInner, awards: awardsInner };
  const titleByKey: Record<SheetId, string> = { upgrades: "Upgrades", stats: "Model Stats", bench: "Benchmarks", awards: "Achievements" };
  const MOBILE_TABS: { id: SheetId; label: string }[] = [
    { id: "upgrades", label: "🛒 Shop" },
    { id: "stats", label: "📊 Stats" },
    { id: "bench", label: "🏆 Ranks" },
    { id: "awards", label: "⭐ Awards" },
  ];
  const feedLabel = `+${formatParams(clickPower * (boostActive ? ZOOMIE_MULT : 1))}`;

  // -------------------------------------------------------------------------
  return (
    <MotionConfig reducedMotion="user">
    <div className="relative h-dvh w-full select-none overflow-hidden">
      {/* ===== Background — crossfades as the cat outgrows each view ===== */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#e9c9b6]">
        <AnimatePresence>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            key={bgSrc}
            src={bgSrc}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.1, ease: "easeInOut" }, scale: { duration: 1.6, ease: "easeOut" } }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center" }}
          />
        </AnimatePresence>
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* owned upgrades scattered around the plaza (Cookie-Clicker style) */}
      <SceneProps owned={owned} />

      {/* ===== Top HUD (container is click-through; only the banner catches events) ===== */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center gap-2 px-3 pt-3">
        <motion.div {...ENTER.hud} transition={{ ...SPRING.balanced, delay: 0.04 }} className="gframe pointer-events-auto w-full max-w-md px-4 py-2 text-center">
          <p className="font-pixel text-[11px] uppercase tracking-[0.15em] text-muted">Le Chaton Fat · Parameters</p>
          <Counter value={parameters} className="tnum font-pixel block text-4xl leading-none text-ink sm:text-5xl" />
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-pixel text-[12px] text-muted">
            <span className="tnum">+{formatParams(pps)}/s</span>
            {globalMult > 1 && <span className="tnum text-ember">{multLabel}</span>}
            <AnimatePresence>
              {boostActive && (
                <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={SPRING.snappy} className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold text-white">
                  🔥 ×{ZOOMIE_MULT} · {boostLeft}s
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Stage tracker — current stage, progress to next, and a pip for each stage */}
          <div className="mt-2">
            <div className="flex items-center justify-between font-pixel text-[12px]">
              <span className="text-ink">Stage {stageIdx + 1}/{STAGES.length} · {stage.name}</span>
              <span className="tnum text-muted">{nextStage ? `next @ ${formatParams(nextStage.threshold)}` : "MAX ★"}</span>
            </div>
            <div className="mt-1"><Bar progress={stageProgress} hero /></div>
            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              {STAGES.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i < stageIdx ? "w-2 bg-orange" : i === stageIdx ? "w-5 bg-ember" : "w-2 bg-line"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div {...ENTER.hud} transition={{ ...SPRING.balanced, delay: 0.12 }} className="pointer-events-auto hidden flex-wrap items-center justify-center gap-1.5 sm:flex">
          {specChips.map((c) => (
            <span key={c} className="gchip px-2 py-0.5 font-pixel text-[11px] text-ink/80">{c}</span>
          ))}
        </motion.div>
      </div>

      {/* ===== Desktop side panels ===== */}
      <aside className="absolute left-3 top-32 bottom-28 z-20 hidden w-[320px] flex-col lg:flex">
        <motion.div {...ENTER.left} transition={{ ...SPRING.balanced, delay: 0.16 }} className="gframe flex min-h-0 flex-1 flex-col p-3">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-pixel text-sm uppercase tracking-wide text-wood">Upgrades</h2>
            <span className="font-pixel text-[11px] text-muted">{Object.values(owned).reduce((a, b) => a + b, 0)} owned</span>
          </div>
          {upgradesInner}
        </motion.div>
      </aside>

      <aside className="absolute right-3 top-32 bottom-28 z-20 hidden w-[320px] flex-col lg:flex">
        <motion.div {...ENTER.right} transition={{ ...SPRING.balanced, delay: 0.16 }} className="gframe flex min-h-0 flex-1 flex-col p-3">
          <div className="mb-2 flex shrink-0 gap-1.5">
            {([["stats", "Stats"], ["bench", "Ranks"], ["awards", "Awards"]] as [SheetId, string][]).map(([id, label]) => (
              <button key={id} data-active={infoTab === id} onClick={() => setInfoTab(id)} className="gtab flex-1 py-1 font-pixel text-[12px]">{label}</button>
            ))}
          </div>
          {infoTab === "stats" ? statsInner : infoTab === "bench" ? benchInner : awardsInner}
        </motion.div>
      </aside>

      {/* ===== Cat on the plaza ===== */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center pb-36 sm:pb-32 lg:pb-24">
        <div className="pointer-events-auto relative">
          <AnimatePresence>
            {quote && (
              <motion.div key={quote.key} initial={{ y: 8, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -8, opacity: 0 }} className="absolute -top-2 left-1/2 z-20 w-max max-w-[78vw] -translate-x-1/2 -translate-y-full">
                <div className="gframe-soft px-3 py-1.5 text-center font-pixel text-[13px]">“{quote.text}”</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <AnimatePresence>
              {floaters.map((fl) => (
                <motion.div key={fl.id} initial={FLOATER.initial} animate={FLOATER.animate} exit={{ opacity: 0 }} transition={FLOATER.transition} onAnimationComplete={() => setFloaters((p) => p.filter((x) => x.id !== fl.id))} style={{ x: fl.x, WebkitTextStroke: "2px #5a2400" }} className="absolute font-pixel text-3xl font-bold text-amber drop-shadow">
                  {fl.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button onClick={feed} aria-label="Feed Le Chaton Fat" className="group relative z-10 cursor-pointer outline-none">
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.span key={p.id} initial={{ x: 0, y: 0, scale: 0.5, opacity: 1, rotate: 0 }} animate={{ x: p.dx, y: p.dy, scale: 1.05, opacity: 0, rotate: p.rot }} transition={{ duration: 0.65, ease: "easeOut" }} onAnimationComplete={() => setParticles((arr) => arr.filter((x) => x.id !== p.id))} className="absolute text-2xl">
                    {p.emoji}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <motion.div {...ENTER.cat} transition={{ ...SPRING.balanced, delay: 0.2 }}>
              <motion.div style={{ scale: catScale, transformOrigin: "center bottom" }}>
                <motion.div animate={catControls} style={{ transformOrigin: "center bottom" }}>
                  <Cat fat={fatLevel} stageIndex={stageIdx} />
                </motion.div>
              </motion.div>
            </motion.div>
          </button>
        </div>
      </div>

      {/* ===== Bottom controls (container is click-through; only the controls catch events) ===== */}
      <motion.div {...ENTER.bottom} transition={{ ...SPRING.balanced, delay: 0.1 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-3 pb-3">
        {/* mobile section tabs */}
        <div className="pointer-events-auto flex w-full max-w-md gap-1.5 lg:hidden">
          {MOBILE_TABS.map((t) => (
            <button key={t.id} onClick={() => setSheet(t.id)} className="gtab flex-1 py-1.5 font-pixel text-[12px]">{t.label}</button>
          ))}
        </div>
        <button onClick={feed} className="gbtn feed-cta pointer-events-auto flex w-full max-w-md items-center justify-center gap-3 px-5 py-3.5 font-pixel text-xl">
          <span className="text-2xl">🍽️</span>
          Feed Le Chaton
          <span className="rounded-md bg-white/25 px-2 py-0.5 text-sm">{feedLabel}</span>
        </button>
      </motion.div>

      {/* ===== Mobile bottom sheet ===== */}
      <AnimatePresence>
        {sheet && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(null)} className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 32 }} onClick={(e) => e.stopPropagation()} className="gframe flex max-h-[72vh] w-full flex-col rounded-b-none p-3">
              <div className="mb-2 flex shrink-0 items-center justify-between">
                <h2 className="font-pixel text-base uppercase tracking-wide text-wood">{titleByKey[sheet]}</h2>
                <button onClick={() => setSheet(null)} className="gbtn-ghost grid h-8 w-8 place-items-center font-pixel text-sm leading-none">✕</button>
              </div>
              <div className="hide-scrollbar mb-2 flex shrink-0 gap-1.5 overflow-x-auto">
                {MOBILE_TABS.map((t) => (
                  <button key={t.id} data-active={sheet === t.id} onClick={() => setSheet(t.id)} className="gtab flex-1 whitespace-nowrap px-2 py-1.5 font-pixel text-[12px]">{t.label}</button>
                ))}
              </div>
              <div className="flex min-h-0 flex-1 flex-col">{innerByKey[sheet]}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 3AM Zoomies powerup ===== */}
      <AnimatePresence>
        {zoomie && (
          <motion.button
            key={zoomie.id}
            onClick={grabZoomie}
            initial={{ scale: 0, x: "-50%", opacity: 0 }}
            animate={{ scale: 1, x: "-50%", opacity: 1, y: [0, -8, 0] }}
            exit={{ scale: 0, x: "-50%", opacity: 0 }}
            transition={{ scale: SPRING.snappy, opacity: { duration: 0.15 }, y: { repeat: Infinity, duration: 1.6, ease: "easeInOut" } }}
            style={{ top: `${zoomie.top}%`, left: `${zoomie.left}%` }}
            className="gframe fixed z-40 px-3 py-2 text-center"
          >
            <div className="text-3xl leading-none">🐈‍⬛💨</div>
            <div className="mt-0.5 font-pixel text-[11px] uppercase tracking-wide text-ember">3AM Zoomies</div>
            <div className="font-pixel text-[10px] text-muted">tap · ×{ZOOMIE_MULT}</div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== Stage-up celebration ===== */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            key={celebrate}
            initial={{ scale: 0.5, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={SPRING.snappy}
            className="pointer-events-none fixed inset-x-0 top-[28%] z-[48] flex justify-center px-4"
          >
            <div className="gframe px-6 py-4 text-center">
              <p className="font-pixel text-[11px] uppercase tracking-[0.22em] text-ember">★ New Stage ★</p>
              <p className="font-pixel text-2xl text-ink sm:text-3xl">{celebrate}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Achievement toasts ===== */}
      <div className="pointer-events-none fixed left-1/2 top-3 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col gap-2 lg:left-auto lg:right-3 lg:translate-x-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const a = ACHIEVEMENTS.find((x) => x.id === t.achId)!;
            return (
              <motion.div key={t.key} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={SPRING.snappy} className="gframe pointer-events-auto flex items-center gap-3 p-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange text-lg text-white">★</span>
                <div className="min-w-0">
                  <p className="font-pixel text-[10px] uppercase tracking-wide text-orange">Achievement!</p>
                  <p className="truncate font-pixel text-[13px] text-ink">{a.name}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
    </MotionConfig>
  );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function ShopItem({ emoji, catIcon, name, desc, effect, cost, owned, afford, onBuy }: { emoji: string; catIcon: string; name: string; desc: string; effect: string; cost: string; owned: number; afford: boolean; onBuy: () => void }) {
  return (
    <button disabled={!afford} onClick={onBuy} title={desc} className="grow-item flex w-full items-center gap-2.5 px-2.5 py-2 text-left">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cream text-lg ring-2 ring-line">
        {emoji}
        <span className="absolute -bottom-1.5 -right-1.5 grid h-4 w-4 place-items-center rounded-full bg-paper text-[9px] leading-none ring-1 ring-line">{catIcon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-pixel text-[14px] text-ink">{name}</span>
          {owned > 0 && <span className="shrink-0 rounded-md bg-wood px-1.5 font-pixel text-[11px] text-cream">×{owned}</span>}
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] text-muted">{effect}</span>
          <span className={`shrink-0 font-pixel text-[12px] ${afford ? "text-wood" : "text-ember"}`}>{cost}</span>
        </span>
      </span>
    </button>
  );
}

function LockedHint({ text }: { text: string }) {
  return <div className="grid h-full place-items-center px-3 py-8 text-center text-[12px] italic text-muted">{text}</div>;
}

function MiniStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="gframe-soft px-2.5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-0.5 truncate font-pixel text-base ${accent ? "text-ember" : "text-ink"}`}>{value}</p>
    </div>
  );
}

/** Bar fill animated with scaleX (compositor-only) instead of width. */
function Bar({ progress, hero = false }: { progress: number; hero?: boolean }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream ring-2 ring-line">
      <motion.div
        className={`h-full w-full rounded-full ${hero ? "bg-gradient-to-r from-amber to-orange" : "bg-wood/40"}`}
        style={{ transformOrigin: "left center" }}
        initial={false}
        animate={{ scaleX: Math.max(0.0001, Math.min(1, progress)) }}
        transition={SPRING.bar}
      />
    </div>
  );
}

function BenchmarkTable({ stageIdx, benchBoost }: { stageIdx: number; benchBoost: number }) {
  const [col, setCol] = useState(0);
  const leRaw = STAGES[stageIdx].bench[col];
  const leNum = typeof leRaw === "number" ? leRaw + benchBoost : 1000;
  const leDisplay = typeof leRaw === "number" ? (leRaw + benchBoost).toFixed(1) : leRaw;
  const denom = Math.max(100, leNum, ...COMPETITORS.map((c) => c.scores[col]));
  const rows = [
    { name: "Le Chaton Fat", display: leDisplay, num: leNum, hero: true },
    ...COMPETITORS.map((c) => ({ name: c.name, display: c.scores[col].toFixed(1), num: c.scores[col], hero: false })),
  ].sort((a, b) => b.num - a.num);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {BENCH_COLS.map((c, i) => (
          <button key={c} data-active={i === col} onClick={() => setCol(i)} className="gtab px-2 py-0.5 font-pixel text-[11px]">{c}</button>
        ))}
      </div>
      <div className="mt-2.5 space-y-2">
        {rows.map((r) => {
          const progress = Math.max(0.04, Math.min(1, r.num / denom));
          return (
            <div key={r.name}>
              <div className="mb-0.5 flex items-center justify-between text-[12px]">
                <span className={`flex items-center gap-1.5 font-pixel ${r.hero ? "text-ink" : "text-muted"}`}>{r.hero && <span className="text-orange">●</span>}{r.name}</span>
                <span className={`font-pixel ${r.hero ? "text-ember" : "text-muted"}`}>{r.display}</span>
              </div>
              <Bar progress={progress} hero={r.hero} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Scattered prop slots flanking the cat (avoid centre + the side panels on desktop). */
const PROP_SLOTS = [
  { l: 31, t: 60 }, { l: 25, t: 73 }, { l: 37, t: 68 }, { l: 22, t: 86 }, { l: 33, t: 82 }, { l: 39, t: 55 },
  { l: 69, t: 60 }, { l: 75, t: 73 }, { l: 63, t: 68 }, { l: 78, t: 86 }, { l: 67, t: 82 }, { l: 61, t: 55 },
];

function SceneProps({ owned }: { owned: Record<string, number> }) {
  const items = UPGRADES.filter((u) => (owned[u.id] || 0) > 0)
    .sort((a, b) => a.baseCost - b.baseCost)
    .slice(0, PROP_SLOTS.length);
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <AnimatePresence>
        {items.map((u, i) => {
          const s = PROP_SLOTS[i];
          const count = owned[u.id] || 0;
          return (
            <motion.div
              key={u.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.96, y: [0, -6, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                scale: SPRING.snappy,
                opacity: { duration: 0.25 },
                y: { repeat: Infinity, duration: 2.4 + (i % 5) * 0.35, ease: "easeInOut", delay: i * 0.13 },
              }}
              style={{ left: `${s.l}%`, top: `${s.t}%`, transformOrigin: "center" }}
              className="absolute"
            >
              <div className="relative">
                <span className="block leading-none drop-shadow-[0_2px_2px_rgba(40,20,8,0.45)]" style={{ fontSize: 30 }}>{u.emoji}</span>
                {count > 1 && (
                  <span className="absolute -bottom-1.5 -right-2 rounded-full bg-wood px-1 font-pixel text-[9px] leading-tight text-cream ring-1 ring-cream/40">×{count}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

