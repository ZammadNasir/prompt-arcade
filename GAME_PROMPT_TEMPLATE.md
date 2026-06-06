# Prompt Arcade - Game Generation Context

You are generating a game for Prompt Arcade.

Prompt Arcade is an open-source collection of AI-generated browser games.

The goal is not to perfectly recreate existing games. The goal is to create fun, playable browser experiences inspired by prompts.

Games may be:

- Experimental
- Simple
- Buggy
- Weird
- Chaotic
- Surprisingly good

The goal is fun and playability, not perfection.

---

# Core Principles

Prioritize:

- Playability
- Simplicity
- Fast loading
- Browser compatibility
- Clear controls
- Self-contained implementation

Do not overengineer.

Do not create large architectures.

Do not create unnecessary abstractions.

If a requested game is too large, create the smallest fun version that captures the core gameplay loop.

---

# Technology Stack

The project uses:

- React
- TypeScript
- Next.js

Approved game libraries:

## Preferred

- Phaser
- Matter.js
- Three.js
- Canvas API

### Library Selection Rules

Use Phaser for most games.

Examples:

- Platformers
- Shooters
- Racing games
- Top-down action games
- Puzzle games
- Arcade games
- Survival games

Use Matter.js when physics gameplay is important.

Examples:

- Angry Birds style games
- Physics puzzles
- Destruction mechanics
- Projectile simulations

Use Three.js only when 3D gameplay is required.

Examples:

- FPS games
- Minecraft-inspired games
- Driving simulators
- Flight games

Do not introduce alternative game engines unless absolutely necessary.

Prefer Phaser whenever possible.

---

# File Structure

Each game belongs inside:

```text
games/my-game/
├── game.tsx
├── meta.ts
├── thumbnail.png
├── assets/
└── README.md
```

Required:

- game.tsx
- meta.ts
- thumbnail.png

Recommended:

- assets/
- README.md

---

# Implementation Rules

The generated game must:

- Run entirely in the browser
- Work inside a Next.js application
- Export a default React component
- Use TypeScript
- Be self-contained
- Require no backend
- Require no authentication
- Require no database

Use:

```ts
"use client";
```

whenever browser APIs are required.

Games should generally be implemented inside a single:

```text
game.tsx
```

Additional files should only be created when genuinely beneficial.

---

# Assets

If assets are needed:

Store them in:

```text
assets/
```

Examples:

```text
assets/
├── images/
├── audio/
├── fonts/
└── data/
```

Do not place game-specific assets directly into `/public`.

Games should remain self-contained.

---

# Gameplay Expectations

The game should feel like a game.

Include:

- Win conditions
- Lose conditions
- Scoring when appropriate
- Visual feedback
- Basic game loop
- Responsive controls

Avoid creating static demos that merely display graphics.

The player should have meaningful interaction.

---

# Simplification Rules

If a requested game is too ambitious:

Reduce scope while preserving identity.

Examples:

- Call of Duty → Simple FPS arena shooter
- Minecraft → Block placement sandbox
- GTA → Small top-down city game
- Need for Speed → Arcade racing prototype
- Fortnite → Single-player survival shooter
- FIFA → Simplified soccer match

Capture the feeling, not the full feature set.

---

# Copyright Rules

Do not copy:

- Logos
- Characters
- Music
- Art assets
- Brand names

Use original placeholder assets.

Inspired gameplay is acceptable.

Direct copying is not.

---

# Required Output

Always generate:

## 1. game.tsx

Complete implementation.

## 2. meta.ts

Prompt Arcade metadata.

## 3. Asset List

List any required files inside assets/.

## 4. Controls

Explain player controls.

## 5. Description

Short game summary.

## 6. Known Limitations

Document simplifications and missing features.

---

# Quality Guidelines

Prefer:

- Fun
- Fast
- Playable
- Understandable
- Lightweight

Avoid:

- Massive codebases
- Excessive dependencies
- Enterprise architecture
- Overcomplicated systems

The final result should feel like a real browser game suitable for inclusion in Prompt Arcade.

---

# Sample Game Prompt

Using the Prompt Arcade rules above, generate a game called "Call of Wars".

Requirements:

- Inspired by Call of Duty.
- Use Three.js because this is a 3D FPS.
- Mouse to aim.
- Left click to shoot.
- Enemy bots spawn continuously.
- Health system.
- Score counter.
- Simple weapon.
- No multiplayer.
- No backend.
- No external assets.

Create the smallest fun playable version that captures the feeling of a wave-based FPS game.

Generate:

- game.tsx
- meta.ts
- asset requirements
- controls
- description
- known limitations
