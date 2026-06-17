import { chromium } from "playwright";
const KEY = "le-chaton-fat-save-v3";
const SAVE = JSON.stringify({
  v: 3,
  parameters: 3.5e13, peak: 3.5e13,
  owned: {
    churu:50,"feather-wand":30,"laser-pointer":20,"cardboard-box":40,"cat-tower":30,"sunny-window":35,"bird-feeder":30,"heated-bed":20,"water-fountain":30,"auto-feeder":25,"cat-tree":20,
    "croissant-bakery":40,"baguette-factory":35,"sidewalk-cafe":20,"paris-apartment":30,"tgv":25,"michelin":25,"nuclear":25,"louvre":20,"entire-paris":20,
    "gpu":40,"gpu-rack":35,"synthetic-data":20,"datacenter":30,"liquid-cooling":25,"benchmark-team":10,"sparse-moe":20,"eval-harness":25,"rl":20,"ttc":15,"thinking-mode":20,"inference-cluster":18,"training-cluster":15,"research-lab":12,"frontier-lab":10,
    "warm-laptop":20,"browser-tabs":18,"docker":15,"orange-energy":12,"kubernetes":12,"fancy-bed":10,"vim":10,"tmux":12
  },
  achievements: ["orange","very-orange","extremely-orange","cat-on-keyboard","touch-grass","peak-french","catastrophic","fits-poorly","local-first","distributed","frontier-floof"],
  timePlayed: 2000,
});
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-size=1480,940"] });
const ctx = await browser.newContext({ viewport: null });
await ctx.addInitScript(([k, v]) => window.localStorage.setItem(k, v), [KEY, SAVE]);
const page = await ctx.newPage();
await page.goto("http://localhost:3000", { waitUntil: "load" });
console.log("browser open at final stage");
await new Promise(() => {}); // keep the window open
