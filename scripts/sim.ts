/* Economy simulator — estimates when a sensible player reaches each stage.
 * Run: npx tsx scripts/sim.ts
 *
 * Models: clicks taper from ~5/s early to ~1/s late; each tick the player greedily
 * buys the affordable income/click upgrade with the best payback (within a horizon),
 * mirroring the in-game cost scaling. Stage gating is on PEAK params (as in the app).
 */
import { UPGRADES, STAGES, BASE_CLICK } from "../app/lib/game";

const costOf = (base: number, n: number) => base * Math.pow(1.25, n);

function run() {
  const owned: Record<string, number> = {};
  const get = (id: string) => owned[id] || 0;

  const income = () => {
    let click = 0, gen = 0, mult = 0;
    for (const u of UPGRADES) {
      const c = get(u.id);
      if (!c) continue;
      if (u.kind === "click") click += u.amount * c;
      else if (u.kind === "gen") gen += u.amount * c;
      else if (u.kind === "mult") mult += u.amount * c;
    }
    const gm = 1 + mult;
    return { clickPower: (BASE_CLICK + click) * gm, pps: gen * gm, gm };
  };

  let params = 0;
  let peak = 0;
  let t = 0;
  const dt = 0.25;
  const HORIZON = 220; // buy upgrades that pay back within this many seconds
  const stageAt: number[] = [0];
  let nextStage = 1;

  const cpsAt = (sec: number) => (sec < 120 ? 5 : sec < 360 ? 3 : sec < 900 ? 1.5 : 0.5);

  while (t < 4200 && nextStage < STAGES.length) {
    const cps = cpsAt(t);
    const { clickPower, pps } = income();
    params += (pps + clickPower * cps) * dt;
    if (params > peak) peak = params;

    // greedy reinvestment
    let bought = true;
    while (bought) {
      bought = false;
      const inc = income();
      let best: (typeof UPGRADES)[number] | null = null;
      let bestPb = Infinity;
      for (const u of UPGRADES) {
        if (u.kind === "bench") continue;
        const c = costOf(u.baseCost, get(u.id));
        if (c > params) continue;
        let dI = 0;
        if (u.kind === "gen") dI = u.amount * inc.gm;
        else if (u.kind === "click") dI = u.amount * inc.gm * cps;
        else if (u.kind === "mult") dI = (inc.pps + inc.clickPower * cps) * u.amount;
        if (dI <= 0) continue;
        const pb = c / dI;
        if (pb < bestPb) { bestPb = pb; best = u; }
      }
      if (best && bestPb < HORIZON) {
        params -= costOf(best.baseCost, get(best.id));
        owned[best.id] = get(best.id) + 1;
        bought = true;
      }
    }

    while (nextStage < STAGES.length && peak >= STAGES[nextStage].threshold) {
      stageAt[nextStage] = t;
      nextStage++;
    }
    t += dt;
  }

  const fmt = (s: number | undefined) =>
    s == null ? "NOT REACHED" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const targets = ["0:00", "0:30", "1:30", "4:00", "8:00", "12:00", "18:00", "30:00"];
  console.log("stage                         reached    target");
  STAGES.forEach((st, i) => {
    console.log(`${(i + 1 + " " + st.name).padEnd(30)}${fmt(stageAt[i]).padEnd(11)}${targets[i] ?? ""}`);
  });
  const fin = income();
  console.log(`\nfinal income ~ ${Math.round(fin.pps).toLocaleString()}/s passive, click ${Math.round(fin.clickPower).toLocaleString()}, mult ×${fin.gm.toFixed(1)}`);
}

run();
