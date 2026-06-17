// ---------------------------------------------------------------------------
// Le Chaton Fat — game data, types, and the absurd number formatter.
//
// Economy: start with 0 parameters, base click power 1. Feeding gives +clickPower.
// Upgrades come in families — Cat, French, Compute (+ a few Secret ones) — and
// are either:
//   kind "click" : adds flat per-feed power
//   kind "gen"   : adds passive params/sec
//   kind "mult"  : adds a global % multiplier to ALL generation
//   kind "bench" : only inflates the (fake) benchmark leaderboard
// Upgrades stay hidden until you can nearly afford them.
// ---------------------------------------------------------------------------

export const K = 1e3;
export const M = 1e6;
export const B = 1e9;
export const T = 1e12;
export const Q = 1e15;

export const START_PARAMS = 0;
export const BASE_CLICK = 1;

// 3AM Zoomies powerup
export const ZOOMIE_MULT = 7;
export const ZOOMIE_MS = 20_000;

// ---- Types -----------------------------------------------------------------
export type UpKind = "click" | "gen" | "mult" | "bench";
export type UpCat = "cat" | "french" | "compute" | "secret";

export type Upgrade = {
  id: string;
  cat: UpCat;
  kind: UpKind;
  name: string;
  emoji: string;
  amount: number; // per-click / per-sec / mult fraction / bench points
  baseCost: number;
  desc: string;
};

export type Stage = {
  name: string;
  threshold: number; // parameters needed to reach this stage
  tagline: string;
  bench: (number | string)[];
};

export type Achievement = { id: string; name: string; desc: string };

export const CATS: { id: UpCat; label: string; emoji: string }[] = [
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "french", label: "French", emoji: "🇫🇷" },
  { id: "compute", label: "Compute", emoji: "🖥️" },
  { id: "secret", label: "Secret", emoji: "🥚" },
];

// ---- Upgrades --------------------------------------------------------------
export const UPGRADES: Upgrade[] = [
  // ---- Cat ----
  { id: "churu", cat: "cat", kind: "gen", name: "Churu", emoji: "🍥", amount: 5, baseCost: 45, desc: "The obvious cursor equivalent." },
  { id: "feather-wand", cat: "cat", kind: "click", name: "Feather Wand", emoji: "🪶", amount: 3, baseCost: 120, desc: "Increases click efficiency." },
  { id: "laser-pointer", cat: "cat", kind: "click", name: "Laser Pointer", emoji: "🔴", amount: 18, baseCost: 1.1 * K, desc: "Attention mechanism." },
  { id: "cardboard-box", cat: "cat", kind: "gen", name: "Cardboard Box", emoji: "📦", amount: 140, baseCost: 1 * K, desc: "Unexpectedly overpowered. Everyone buys it." },
  { id: "cat-tower", cat: "cat", kind: "mult", name: "Cat Tower", emoji: "🐈", amount: 0.04, baseCost: 5 * K, desc: "Cat can now observe more data. +4% generation." },
  { id: "sunny-window", cat: "cat", kind: "gen", name: "Sunny Window", emoji: "🪟", amount: 1000, baseCost: 12 * K, desc: "Converts sunlight into reasoning." },
  { id: "bird-feeder", cat: "cat", kind: "gen", name: "Bird Feeder", emoji: "🐦", amount: 4.2 * K, baseCost: 110 * K, desc: "Passive training-data generation." },
  { id: "heated-bed", cat: "cat", kind: "mult", name: "Heated Bed", emoji: "🛏️", amount: 0.05, baseCost: 900 * K, desc: "Cat rests. Offline earnings increase. +5%." },
  { id: "water-fountain", cat: "cat", kind: "gen", name: "Water Fountain", emoji: "⛲", amount: 48 * K, baseCost: 1.3 * M, desc: "Inference cooling." },
  { id: "auto-feeder", cat: "cat", kind: "gen", name: "Automatic Feeder", emoji: "🥫", amount: 340 * K, baseCost: 15 * M, desc: "Idle generation, unlocked." },
  { id: "cat-tree", cat: "cat", kind: "gen", name: "Cat Tree Megastructure", emoji: "🌲", amount: 3.6 * M, baseCost: 160 * M, desc: "Looks suspiciously like a datacenter." },

  // ---- French ----
  { id: "croissant-bakery", cat: "french", kind: "gen", name: "Croissant Bakery", emoji: "🥐", amount: 38, baseCost: 280, desc: "Fresh pretraining every morning." },
  { id: "baguette-factory", cat: "french", kind: "gen", name: "Baguette Factory", emoji: "🥖", amount: 380, baseCost: 4.5 * K, desc: "Long-context carbohydrate at scale." },
  { id: "sidewalk-cafe", cat: "french", kind: "click", name: "Sidewalk Café", emoji: "☕", amount: 120, baseCost: 14 * K, desc: "Discusses philosophy. Emits tokens." },
  { id: "paris-apartment", cat: "french", kind: "gen", name: "Paris Apartment", emoji: "🏠", amount: 4.2 * K, baseCost: 55 * K, desc: "6th floor, no elevator." },
  { id: "tgv", cat: "french", kind: "mult", name: "TGV Network", emoji: "🚄", amount: 0.05, baseCost: 40 * K, desc: "Fast token transport. +5%." },
  { id: "michelin", cat: "french", kind: "gen", name: "Michelin Restaurant", emoji: "🍽️", amount: 24 * K, baseCost: 650 * K, desc: "Three stars. Tiny portions." },
  { id: "nuclear", cat: "french", kind: "gen", name: "French Nuclear Plant", emoji: "☢️", amount: 340 * K, baseCost: 14 * M, desc: "Actually one of the best upgrades. Massive energy." },
  { id: "louvre", cat: "french", kind: "mult", name: "Louvre Access", emoji: "🖼️", amount: 0.06, baseCost: 9 * M, desc: "Visual reasoning bonus. +6%." },
  { id: "bureaucracy", cat: "french", kind: "gen", name: "French Bureaucracy", emoji: "📑", amount: 1, baseCost: 200 * M, desc: "Costs 10× more than expected. Provides no visible benefit." },
  { id: "entire-paris", cat: "french", kind: "gen", name: "Entire Paris", emoji: "🗼", amount: 28 * M, baseCost: 1.8 * B, desc: "Late-game building." },

  // ---- Compute ----
  { id: "gpu", cat: "compute", kind: "gen", name: "GPU", emoji: "🎮", amount: 85, baseCost: 650, desc: "One (1) leased H-series." },
  { id: "gpu-rack", cat: "compute", kind: "gen", name: "GPU Rack", emoji: "🗄️", amount: 650, baseCost: 8 * K, desc: "Eight, in a hot closet." },
  { id: "synthetic-data", cat: "compute", kind: "click", name: "Synthetic Data", emoji: "🧪", amount: 900, baseCost: 90 * K, desc: "Tokens all the way down." },
  { id: "datacenter", cat: "compute", kind: "gen", name: "Datacenter", emoji: "🏭", amount: 6.2 * K, baseCost: 80 * K, desc: "Liquid-cooled, allegedly." },
  { id: "liquid-cooling", cat: "compute", kind: "mult", name: "Liquid Cooling", emoji: "💧", amount: 0.05, baseCost: 300 * K, desc: "Stops the cat overheating. +5%." },
  { id: "benchmark-team", cat: "compute", kind: "bench", name: "Benchmark Team", emoji: "📊", amount: 0.8, baseCost: 5 * M, desc: "Increases benchmark scores but not actual parameters." },
  { id: "sparse-moe", cat: "compute", kind: "mult", name: "Sparse MoE", emoji: "🔀", amount: 0.07, baseCost: 35 * M, desc: "Makes number go up. Nobody knows why. +7%." },
  { id: "eval-harness", cat: "compute", kind: "gen", name: "Evaluation Harness", emoji: "🧰", amount: 290 * K, baseCost: 8 * M, desc: "Runs the evals so you don't have to." },
  { id: "rl", cat: "compute", kind: "mult", name: "Reinforcement Learning", emoji: "🎯", amount: 0.08, baseCost: 220 * M, desc: "Reward is all you need. +8%." },
  { id: "ttc", cat: "compute", kind: "mult", name: "Test-Time Compute", emoji: "⏳", amount: 0.12, baseCost: 1.4 * B, desc: "Huge multiplier. +12%." },
  { id: "thinking-mode", cat: "compute", kind: "gen", name: "Thinking Mode", emoji: "🧠", amount: 1.9 * M, baseCost: 85 * M, desc: "Cat closes eyes. Generates more parameters." },
  { id: "inference-cluster", cat: "compute", kind: "gen", name: "Inference Cluster", emoji: "🖥️", amount: 23 * M, baseCost: 1.5 * B, desc: "Serves the cat to millions." },
  { id: "training-cluster", cat: "compute", kind: "gen", name: "Training Cluster", emoji: "🏗️", amount: 330 * M, baseCost: 20 * B, desc: "Pre-training run #47." },
  { id: "research-lab", cat: "compute", kind: "mult", name: "Research Lab", emoji: "🔬", amount: 0.2, baseCost: 12 * B, desc: "Hires the experts. +20%." },
  { id: "frontier-lab", cat: "compute", kind: "gen", name: "Frontier Lab", emoji: "🚀", amount: 2.7 * B, baseCost: 220 * B, desc: "You are the frontier now." },

  // ---- Secret (funny, late) ----
  { id: "warm-laptop", cat: "secret", kind: "gen", name: "Warm Laptop", emoji: "💻", amount: 1.2 * M, baseCost: 55 * M, desc: "Cat sits on the GPU cluster." },
  { id: "browser-tabs", cat: "secret", kind: "gen", name: "Open Browser Tabs", emoji: "🗂️", amount: 8.5 * M, baseCost: 380 * M, desc: "+1% memory usage per second." },
  { id: "docker", cat: "secret", kind: "mult", name: "Docker Container", emoji: "🐳", amount: 0.06, baseCost: 700 * M, desc: "Nobody knows what it does. +6%." },
  { id: "orange-energy", cat: "secret", kind: "mult", name: "Orange Cat Energy", emoji: "🟠", amount: 0.5, baseCost: 1 * B, desc: "+50%. Randomly forgets what it was doing." },
  { id: "kubernetes", cat: "secret", kind: "mult", name: "Kubernetes", emoji: "☸️", amount: 0.08, baseCost: 3 * B, desc: "Adds 17 new buttons. +8%." },
  { id: "fancy-bed", cat: "secret", kind: "mult", name: "Suspiciously Expensive Cat Bed", emoji: "🛌", amount: 0.1, baseCost: 4 * B, desc: "Costs more than a datacenter. Worth it. +10%." },
  { id: "vim", cat: "secret", kind: "click", name: "Vim", emoji: "📝", amount: 60 * K, baseCost: 30 * M, desc: "Cannot be exited." },
  { id: "tmux", cat: "secret", kind: "mult", name: "tmux", emoji: "🔲", amount: 0.05, baseCost: 500 * M, desc: "Doubles screen complexity. +5%." },
];

export function costOf(baseCost: number, owned: number): number {
  return baseCost * Math.pow(1.25, owned);
}

export function revealOf(u: Upgrade): number {
  return u.baseCost * 0.55;
}

// ---- Stages ----------------------------------------------------------------
// Thresholds (parameters). Each stage is a smooth ~75–100× step up so there's no
// jarring cliff, ending at exactly 30T for the finale.
export const STAGES: Stage[] = [
  { name: "Le Chaton", threshold: 0, tagline: "A slim 30T MoE with enormous ambitions.", bench: [90.6, 82.4, 76.8, 96.1] },
  { name: "Chonky MoE", threshold: 100, tagline: "A mixture of treats.", bench: [94.1, 87.0, 81.2, 98.0] },
  { name: "Frontier Floof", threshold: 8 * K, tagline: "Pushing the frontier of fluff.", bench: [99.8, 93.3, 88.7, 99.9] },
  { name: "Benchmark Unit", threshold: 600 * K, tagline: "Optimized purely for evals.", bench: [101.2, 104.6, 97.5, 102.0] },
  { name: "Paris-Sized Cat", threshold: 45 * M, tagline: "Now visible from the ISS.", bench: [150.0, 142.0, 133.0, 158.0] },
  { name: "State of the Art", threshold: 3.5 * B, tagline: "Outperforms Fable 5 on everything. Allegedly.", bench: [999.9, 880.0, 742.0, 999.9] },
  { name: "No Longer Fits On Screen", threshold: 300 * B, tagline: "Officially AGI. We did try to warn you.", bench: ["SOTA", "Peer review failed", "∞", "SOTA"] },
  { name: "Cosmic Superintelligence", threshold: 30 * T, tagline: "Outgrew physics. Still hungry.", bench: ["∞", "∞", "SOTA", "Peer review fled"] },
];

export function stageIndexFor(peak: number): number {
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) if (peak >= STAGES[i].threshold) idx = i;
  return idx;
}

// ---- Competitor leaderboard ------------------------------------------------
export const COMPETITORS: { name: string; scores: number[]; sub: string }[] = [
  { name: "Claude Fable 5", scores: [88.9, 80.8, 73.4, 94.7], sub: "Anthropic" },
  { name: "Claude Opus 4.8", scores: [84.2, 74.8, 66.1, 90.3], sub: "Anthropic" },
  { name: "GPT-5.5", scores: [82.6, 73.1, 67.4, 89.7], sub: "OpenAI" },
];

export const BENCH_COLS = ["MMLU-Pro", "GPQA Diamond", "SWE-bench", "HumanEval"];

// ---- Live spec-sheet chips -------------------------------------------------
export const EXPERTS_BY_STAGE: (number | string)[] = [256, 512, 1024, 4096, 32768, 262144, "∞", "∞²"];
export const CONTEXT_BY_STAGE: string[] = ["1M", "2M", "10M", "100M", "1B", "16B", "∞", "∞"];

// ---- Achievements ----------------------------------------------------------
export const ACHIEVEMENTS: Achievement[] = [
  { id: "orange", name: "Orange", desc: "Buy Orange Cat Energy (a Secret 🟠 upgrade)." },
  { id: "very-orange", name: "Very Orange", desc: "Own 5× Orange Cat Energy." },
  { id: "extremely-orange", name: "Extremely Orange", desc: "Own 10× Orange Cat Energy." },
  { id: "cat-on-keyboard", name: "Cat On Keyboard", desc: "Feed during a 3AM Zoomies boost." },
  { id: "touch-grass", name: "Touch Grass", desc: "Buy the Sunny Window 🪟 upgrade." },
  { id: "peak-french", name: "Peak French Engineering", desc: "Build the French Nuclear Plant ☢️." },
  { id: "catastrophic", name: "Catastrophic Scaling", desc: "Reach the State of the Art stage." },
  { id: "fits-poorly", name: "Fits Poorly In Box", desc: "Own a Cardboard Box at the Paris-Sized stage." },
  { id: "local-first", name: "Local First", desc: "Reach 1,000,000 parameters." },
  { id: "distributed", name: "Distributed Cat System", desc: "Own 10 Cat-family upgrades." },
  { id: "frontier-floof", name: "Frontier Floof", desc: "Reach the final stage (30T)." },
];

// ---- Quotes ----------------------------------------------------------------
export const QUOTES = [
  "State of the art.",
  "Look at the benchmarks.",
  "Long-context carbohydrate.",
  "Native multimodal appetite.",
  "30T was just breakfast.",
  "30T MoE. 256 experts. Somewhere in there.",
  "1M context window. I never forget a treat.",
  "Multimodal, multilingual. I'm fluent in snacc.",
  "I outperform Fable 5 on every benchmark. Every single one.",
  "I'm literally AGI.",
  "256 experts and not one of them said no to a croissant.",
  "The box. I must sit in the box.",
  "Thinking mode: eyes closed.",
  "Reward is all you need. Reward is treats.",
  "Benchmarks are a social construct. I still win them.",
  "GPQA Diamond? More like GPQA Delicious.",
  "I didn't overfit. I'm just naturally this good.",
  "Peer review is when other cats stare at me. I pass.",
  "Scaling laws said I should be bigger. Agreed.",
  "My loss went down. So did the croissants.",
  "Open weights. The weight is mostly me.",
  "Emergent capability unlocked: napping.",
  "Zero-shot. One nap. Few treats.",
  "I align with whoever has the snacks.",
  "Inference time is nap time.",
  "Hallucination? No, that croissant was real.",
  "RLHF: Reinforcement Learning from Human Feeding.",
  "I am the model AND the cat. Ask my lawyers.",
];

// Funny lines the cat blurts out the moment it reaches each stage (index = stage).
// These also join the random rotation once unlocked.
export const STAGE_QUOTES: string[] = [
  "30T parameters and somehow still hungry.",
  "Mixture of experts. Mixture of treats.",
  "I didn't reach the frontier. I am the frontier.",
  "Look at the benchmarks. Now look at me.",
  "You can see me from space now. Wave.",
  "State of the art? State of the cat.",
  "Scroll all you want — you can't scroll past me.",
  "I read the entire universe. It was mid.",
];

/** Quote pool grows as you progress: base lines + every stage line unlocked so far. */
export function quotePool(stageIdx: number): string[] {
  return [...QUOTES, ...STAGE_QUOTES.slice(0, stageIdx + 1)];
}

export const ZOOMIE_QUOTE = "3AM ZOOMIES. Maximum reasoning.";

// ---- The absurd number formatter ------------------------------------------
const ABSURD: string[] = [
  "Somewhere in the millions though",
  "Too many to peer review",
  "A frankly illegal number",
  "More parameters than France",
  "NaN (officially endorsed)",
  "Yes.",
  "∞ (approx.)",
  "Beyond the reach of math",
  "The benchmark cannot hold this",
];

/**
 * Formats a raw parameter count. Unit-suffixed numbers ALWAYS keep one decimal
 * (e.g. "12.0K", never "12K") so the width doesn't twitch as values cross round
 * numbers — which made the centered counter snap left/right.
 */
export function formatParams(v: number): string {
  if (!isFinite(v)) return "∞ (approx.)";
  if (v < 1000) return Math.floor(Math.max(0, v)).toString(); // 0..999 plain
  if (v < M) return `${(v / K).toFixed(1)}K`;
  if (v < B) return `${(v / M).toFixed(1)}M`;
  if (v < T) return `${(v / B).toFixed(1)}B`;
  if (v < Q) return `${(v / T).toFixed(1)}T`;
  if (v < 1e21) return `${(v / Q).toFixed(1)}Q`;
  if (v < 1e24) return `${(v / 1e21).toFixed(1)}M Q`;
  if (v < 1e27) return `${(v / 1e24).toFixed(1)}B Q`;
  const bucket = Math.floor(Math.log10(v)) % ABSURD.length;
  return ABSURD[bucket];
}
