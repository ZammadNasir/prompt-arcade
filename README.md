# Prompt Arcade

Prompt Arcade is a static-first open-source arcade for AI-generated browser games.

The project serves as a collection of playable browser games created with AI. Games do not need to be perfect—they can be polished, experimental, broken, chaotic, or surprisingly good.

The goal is to explore what happens when developers and AI collaborate to create playable experiences from prompts.

## Features

- Static-first architecture
- Automatic game discovery
- Zero configuration routing
- Open-source contributions
- Self-contained game structure
- AI-friendly contributor workflow
- Support for 2D and 3D browser games

---

## Tech Stack

### Core

- Next.js
- React
- TypeScript
- Tailwind CSS

### Approved Game Libraries

#### Preferred

- Phaser
- Matter.js
- Three.js
- Canvas API

### Recommended Usage

Use **Phaser** for most games:

- Platformers
- Shooters
- Racing games
- Arcade games
- Puzzle games
- Survival games

Use **Matter.js** when physics gameplay is important:

- Physics puzzles
- Projectile mechanics
- Destruction systems

Use **Three.js** when 3D gameplay is required:

- FPS games
- Sandbox games
- Driving games
- Flight games

Contributors should prefer Phaser whenever possible.

---

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The application scans the `/games` directory during static rendering.

Adding a new game folder automatically makes it available throughout the site.

No routing changes are required.

---

## Add a Game

Create a new folder:

```text
games/my-game/
├── game.tsx
├── meta.ts
├── thumbnail.png
├── assets/
└── README.md
```

### Required Files

```text
game.tsx
meta.ts
thumbnail.png
```

### Recommended Files

```text
assets/
README.md
```

---

## Folder Structure

### `game.tsx`

The React component that renders the game.

Use:

```ts
"use client";
```

when the game uses:

- Browser APIs
- Canvas rendering
- Phaser
- Matter.js
- Three.js
- Keyboard input
- Mouse input
- Timers
- Local state

Whenever possible, games should remain self-contained and easy to understand.

### `meta.ts`

Exports the game's metadata.

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

### Metadata Fields

Required fields:

- slug
- name
- description
- genre
- generatedWith
- status
- thumbnail
- prompts
- knownIssues

Example technologies:

```text
Phaser
Matter.js
Three.js
Canvas API
```

### `thumbnail.png`

The image displayed on the homepage and game detail page.

---

### `assets/`

Contains all game-specific assets.

Examples:

```text
assets/
├── player.png
├── enemy.png
├── background.jpg
├── shoot.wav
├── music.mp3
└── sprite-sheet.png
```

For larger games:

```text
assets/
├── images/
├── audio/
├── fonts/
└── data/
```

Keep game resources inside the game's own folder whenever possible.

Avoid placing game-specific assets directly into `/public`.

Games should remain portable and self-contained.

---

### `README.md`

Optional documentation for the game.

Useful information:

- Controls
- Prompt history
- Generation notes
- Credits
- Known issues
- Development notes

Example:

```md
# My Game

Generated With: Codex

## Controls

- WASD to move
- Space to jump

## Prompts

- Create a platformer
- Add enemies
- Add collectibles

## Known Issues

- Enemies occasionally get stuck.
```

---

## Architecture

```text
app/
├── page.tsx
└── game/
    └── [slug]/
        └── page.tsx

games/
├── game-a/
├── game-b/
└── game-c/

lib/
└── games.ts
```

### Key Components

- `app/page.tsx` renders the homepage.
- `app/game/[slug]/page.tsx` renders game pages.
- `games/*` contains contributor-owned games.
- `lib/games.ts` discovers and loads games.

Prompt Arcade automatically discovers games from the filesystem.

Do not manually register games.

Do not modify routes to add games.

---

## Contributor Guidelines

Every contribution should include:

- Playable game
- Metadata
- Thumbnail (Thumbnail prompt provided in **GAME_THUMBNAIL_PROMPT_TEMPLATE.md**)

Recommended:

- Assets folder
- README documentation

---

## Status Badges

Supported statuses:

- Playable
- Experimental
- Broken
- Chaos Mode
- Actually Good

These statuses help communicate the state of a game to players.

---

## Copyright Rules

Please avoid:

- Copyrighted game assets
- Real game logos
- Proprietary music
- Trademarked branding
- Obfuscated code
- External trackers
- Malicious scripts

Gameplay inspiration is acceptable.

Direct asset copying is not.

---

## Build

```bash
npm run build
```

The project uses:

```ts
output: "export";
```

in `next.config.ts`.

Production builds are generated inside:

```text
out/
```

and can be deployed to any static hosting provider.

Examples:

- Vercel
- Cloudflare Pages
- Netlify
- GitHub Pages

---

## Philosophy

Prompt Arcade is not trying to compete with professional game studios.

It is a playground for AI-generated games.

Some games will be polished.

Some will be broken.

Some will be unexpectedly fun.

The objective is simple:

**Generate games. Ship them. Play them.**
