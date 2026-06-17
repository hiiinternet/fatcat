/**
 * normalize-sprite-sheet.ts
 *
 * Takes a messy 5x2 cat sprite sheet and normalizes it into a clean sheet where
 * every tile is exactly 512x512, each cat trimmed of empty space and centered in
 * its tile, transparency preserved, and the relative size differences between
 * frames kept intact (skinny cat stays smaller than the chonky one).
 *
 * The cats are NOT on a perfect grid and overflow naive equal cells, so instead
 * of dividing width/5 we detect each cat by its alpha: split into 2 row bands by
 * the transparent gap between rows, then 5 column segments within each band, then
 * tight-trim each cat.
 *
 *   Input:  public/sprites/cat-fatness-source.png
 *   Output: public/sprites/cat-fatness-normalized.png   (2560 x 1024)
 *
 * Run with:  npm run sprites
 */

import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "public/sprites/cat-fatness-source.png");
const OUTPUT = path.join(ROOT, "public/sprites/cat-fatness-normalized.png");

const COLS = 5;
const ROWS = 2;
const FRAME = 512;
const PAD = 22;
const ALPHA_MIN = 16; // pixels at or below this alpha count as "empty"
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

type Box = { x0: number; y0: number; x1: number; y1: number }; // inclusive

/** Split a boolean run into [start,end] segments, tolerating small gaps. */
function segments(present: boolean[], minGap: number, minLen: number): [number, number][] {
  const segs: [number, number][] = [];
  let start = -1;
  let lastOn = -1;
  let gap = 0;
  for (let i = 0; i < present.length; i++) {
    if (present[i]) {
      if (start < 0) start = i;
      lastOn = i;
      gap = 0;
    } else if (start >= 0) {
      gap++;
      if (gap > minGap) {
        segs.push([start, lastOn]);
        start = -1;
        gap = 0;
      }
    }
  }
  if (start >= 0) segs.push([start, lastOn]);
  return segs.filter(([a, b]) => b - a + 1 >= minLen);
}

/** Keep the n largest segments (by length), then re-sort by position. */
function topN(segs: [number, number][], n: number): [number, number][] {
  return [...segs]
    .sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
    .slice(0, n)
    .sort((a, b) => a[0] - b[0]);
}

async function main() {
  try {
    await fs.access(INPUT);
  } catch {
    console.error(`\n✗ Source sprite not found:\n    ${INPUT}\n\n  Save your 5x2 cat sheet there, then run:  npm run sprites\n`);
    process.exit(1);
  }

  const { data, info } = await sharp(await fs.readFile(INPUT))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const ch = info.channels; // 4
  const alphaAt = (x: number, y: number) => data[(y * W + x) * ch + (ch - 1)];

  // --- Flood-fill background removal -------------------------------------
  // Many exported sheets have the "transparency" baked in as an opaque light
  // checkerboard. Flood from the borders through light pixels (luminance > T),
  // stopping at each cat's darker outline, and zero out their alpha. The cats
  // are islands enclosed by their outline, so they're preserved.
  const T = 190;
  const lumAt = (p: number) => 0.299 * data[p * ch] + 0.587 * data[p * ch + 1] + 0.114 * data[p * ch + 2];
  const visited = new Uint8Array(W * H);
  const stack: number[] = [];
  const seed = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (visited[p] || lumAt(p) <= T) return;
    visited[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % W;
    const y = (p / W) | 0;
    seed(x + 1, y);
    seed(x - 1, y);
    seed(x, y + 1);
    seed(x, y - 1);
  }
  let cleared = 0;
  for (let p = 0; p < W * H; p++) if (visited[p]) { data[p * ch + (ch - 1)] = 0; cleared++; }
  console.log(`Flood-fill cleared ${cleared} background px (${Math.round((cleared / (W * H)) * 100)}%)`);
  const cleaned = await sharp(data, { raw: { width: W, height: H, channels: ch } }).png().toBuffer();

  // --- split into 2 row bands by horizontal transparent gaps -------------
  const rowPresent: boolean[] = new Array(H);
  for (let y = 0; y < H; y++) {
    let cnt = 0;
    for (let x = 0; x < W; x++) if (alphaAt(x, y) > ALPHA_MIN) cnt++;
    rowPresent[y] = cnt > 3;
  }
  let rowBands = topN(segments(rowPresent, Math.round(H * 0.02), Math.round(H * 0.08)), ROWS);
  if (rowBands.length !== ROWS) {
    const half = Math.floor(H / 2);
    rowBands = [[0, half - 1], [half, H - 1]];
  }

  // --- within each band, split into 5 column segments --------------------
  const boxes: Box[] = [];
  for (const [yTop, yBot] of rowBands) {
    const colPresent: boolean[] = new Array(W);
    for (let x = 0; x < W; x++) {
      let cnt = 0;
      for (let y = yTop; y <= yBot; y++) if (alphaAt(x, y) > ALPHA_MIN) cnt++;
      colPresent[x] = cnt > 2;
    }
    let cols = topN(segments(colPresent, Math.round(W * 0.012), Math.round(W * 0.03)), COLS);
    if (cols.length !== COLS) {
      const cw = Math.floor(W / COLS);
      cols = Array.from({ length: COLS }, (_, i) => [i * cw, (i + 1) * cw - 1] as [number, number]);
    }
    // tight-trim each cell to its real content
    for (const [xL, xR] of cols) {
      let x0 = xR, y0 = yBot, x1 = xL, y1 = yTop;
      for (let y = yTop; y <= yBot; y++) {
        for (let x = xL; x <= xR; x++) {
          if (alphaAt(x, y) > ALPHA_MIN) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 >= x0 && y1 >= y0) boxes.push({ x0, y0, x1, y1 });
    }
  }

  if (boxes.length !== COLS * ROWS) {
    console.warn(`⚠ detected ${boxes.length} cats (expected ${COLS * ROWS}); output may be off.`);
  }
  console.log(`Source ${W}x${H} → detected ${boxes.length} cats across ${rowBands.length} rows`);

  // --- one global scale so the biggest cat fits, preserving relative sizes
  const maxDim = Math.max(...boxes.map((b) => Math.max(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1)));
  const scale = (FRAME - PAD * 2) / maxDim;
  console.log(`Largest cat ${maxDim}px → global scale ${scale.toFixed(3)}`);

  const srcImg = sharp(cleaned).ensureAlpha();
  const composites: sharp.OverlayOptions[] = [];
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    const bw = b.x1 - b.x0 + 1;
    const bh = b.y1 - b.y0 + 1;
    const w = Math.max(1, Math.round(bw * scale));
    const h = Math.max(1, Math.round(bh * scale));
    const cat = await srcImg
      .clone()
      .extract({ left: b.x0, top: b.y0, width: bw, height: bh })
      .resize(w, h, { fit: "fill" })
      .png()
      .toBuffer();
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    composites.push({
      input: cat,
      left: col * FRAME + Math.round((FRAME - w) / 2),
      top: row * FRAME + Math.round((FRAME - h) / 2),
    });
  }

  await sharp({ create: { width: COLS * FRAME, height: ROWS * FRAME, channels: 4, background: TRANSPARENT } })
    .composite(composites)
    .png()
    .toFile(OUTPUT);

  console.log(`\n✓ Wrote ${path.relative(ROOT, OUTPUT)} (${COLS * FRAME}x${ROWS * FRAME}, ${boxes.length} frames)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
