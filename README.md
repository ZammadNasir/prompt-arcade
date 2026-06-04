# Prompt Arcade

Prompt Arcade is a static-first open-source arcade for AI-generated browser games. The site is intentionally lightweight: games live in the filesystem, routes are generated automatically, and contributors do not need to touch application logic.

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The `predev` and `prebuild` scripts scan `/games` and regenerate the static game registry.

## Add a Game

Create a new folder:

```text
games/my-game/
  game.tsx
  meta.ts
  thumbnail.png
```

`meta.ts` should export a typed `meta` object:

```ts
import thumbnail from "./thumbnail.png";
import type { GameMeta } from "@/lib/game-types";

export const meta = {
  slug: "my-game",
  name: "My Game",
  description: "A browser game generated from prompts.",
  genre: "Action",
  generatedWith: "Codex",
  status: "Playable",
  thumbnail,
  prompts: ["Create a browser game"],
  knownIssues: ["Still rough around the edges."],
} satisfies GameMeta;
```

`game.tsx` should default-export the React component that renders the game. Use `"use client"` when the game needs browser state, timers, events, or canvas APIs.

## Architecture

- `app/page.tsx` renders the arcade homepage.
- `app/game/[slug]/page.tsx` renders static detail pages for each game.
- `games/*` contains contributor-owned game folders.
- `lib/games.ts` exposes typed helpers for listing and resolving games.
- `scripts/generate-game-registry.mjs` generates static imports for Next.js builds.

## Build

```bash
npm run build
```

The project uses `output: "export"` in `next.config.ts`, so production builds generate static files in `out/`.
