# 🐱 Le Chaton Fat

> Frontier feline intelligence. Somewhere in the millions though.

A polished, meme-native idle/clicker game where you feed a cute French tabby
treats to inflate its "parameters." As Le Chaton grows it gets visually bigger,
unlocks more absurd treats and upgrades, climbs a fake AI benchmark leaderboard,
and keeps turning down Anthropic offers.

Built to look like a serious AI model launch page that slowly devolves into nonsense.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Framer Motion** for animations
- **localStorage** for persistence — no login, no backend

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## What's in the box

- **Click-to-feed loop** — feed the cat, watch it bounce, spawn crumb particles
  and a flying treat, fill the stage progress bar, and occasionally hear a quote.
- **10 treats** that unlock as parameters grow (Croissant -> OpenAI Researcher).
- **6 compute upgrades** with passive params/sec and 1.25x price scaling.
- **7 cat stages** — the cat scales up and eventually overflows the screen.
- **Absurd number formatting** — `30T` -> `999Q` -> `5M Q` -> "Somewhere in the millions though."
- **Anthropic offer events** every 30-90s. Turn it down for a 2x boost, or accept
  and become Claude Fable 6 (then undo it).
- **Fake benchmark leaderboard** where Le Chaton's scores inflate past 100 into
  `SOTA` / `Peer review failed` while the real models get tiny bars.
- **8 achievements** with slide-in toasts.
- **Share card** with a "Copy Text" button for screenshots.
- Mobile-first, with a sticky feed button on small screens.

All game logic lives in `app/page.tsx`; data/tuning in `app/lib/game.ts`; the
beret-wearing CSS cat in `app/components/Cat.tsx`.

---

*Le Chaton Fat is not a real frontier model. The benchmarks are not real. The
offer was, allegedly, somewhere in the millions though.*
