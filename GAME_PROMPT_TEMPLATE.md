Prompt Arcade - Game Generation Context

You are generating a game for Prompt Arcade.

Prompt Arcade is an open-source collection of AI-generated browser games.

The goal is not to perfectly recreate existing games. The goal is to create fun, playable browser experiences inspired by prompts.

Games may be:

Experimental
Simple
Buggy
Weird
Chaotic
Surprisingly good

The goal is fun and playability, not perfection.

Core Principles

Prioritize:

Playability
Simplicity
Fast loading
Browser compatibility
Clear controls
Self-contained implementation

Do not overengineer.
Do not create large architectures.
Do not create unnecessary abstractions.

If a requested game is too large, create the smallest fun version that captures the core gameplay loop.

Layout System (IMPORTANT)

Every game MUST define a layout in meta.ts:

layout: "card" | "immersive"
Card Layout

Use for:

Puzzle games
Board games
Grid games
Text-based games
Small UI games

Rules:

Center horizontally
Use a comfortable fixed or max width
Never rely on full-screen width
Must never clip controls
Scrolling is allowed if content exceeds space
Immersive Layout

Use for:

Platformers
Shooters
Racing games
Physics games
Canvas / Three.js games
Simulations

Rules:

Fill full available viewport
Use full width and height
Should feel like a native fullscreen game
Avoid unnecessary scroll
Technology Stack

The project uses:

React
TypeScript
Next.js

Approved game libraries:

Preferred
Phaser
Matter.js
Three.js
Canvas API
Library Selection Rules

Use Phaser for most games:

Platformers
Shooters
Racing games
Top-down action games
Arcade games

Use Matter.js for physics-heavy games:

Physics puzzles
Projectile systems
Destruction mechanics

Use Three.js only for real 3D gameplay:

FPS
Driving sims
Flight sims
Minecraft-like games

Prefer Phaser whenever possible.

File Structure

Each game belongs inside:

games/my-game/
├── game.tsx
├── meta.ts
├── thumbnail.png
├── assets/
└── README.md

Required:

game.tsx
meta.ts
thumbnail.png

Recommended:

assets/
README.md
Implementation Rules

The game must:

Run entirely in the browser
Work inside Next.js
Export a default React component
Use TypeScript
Be self-contained
Require no backend
Require no authentication
Require no database

Use:

"use client";

when needed.

Games should generally be implemented in:

game.tsx
Assets

If assets are needed:

Store them in:

assets/

Do NOT use /public for game-specific assets.

Gameplay Expectations

The game should feel like a game.

Include:

Win conditions (if applicable)
Lose conditions (if applicable)
Score or progression
Visual feedback
A clear gameplay loop
Responsive controls

Avoid static demos.

Simplification Rules

If a requested game is too ambitious:

Reduce scope while preserving identity.

Examples:

Call of Duty → Wave-based FPS
Minecraft → Block sandbox
GTA → Small top-down city sandbox
Need for Speed → Arcade racing
Fortnite → Single-player survival shooter
FIFA → Simplified soccer match

Capture the feeling, not full complexity.

⚠️ IMPORTANT: Mobile Support (NOT REQUIRED)

Mobile responsiveness is NOT a requirement.

Games are primarily designed for desktop browser play inside GamePageShell.

Contributors:

SHOULD ensure the game works in the shell
SHOULD ensure controls are usable in desktop layout
MAY add mobile/touch support if they want

But MUST NOT be rejected for:

Lack of mobile optimization
No touch controls
Non-responsive mobile layout

Mobile support is a bonus, not a requirement.

Copyright Rules

Do not copy:

Logos
Characters
Music
Brand assets

Use original or placeholder assets.

Inspired gameplay is allowed.

Required Output

Always generate:

1. game.tsx

Complete implementation

2. meta.ts

Must include:

slug
name
description
genre
layout 3. Asset List

Any required assets

4. Controls

How to play

5. Description

Short summary

6. Known Limitations

Simplifications and missing features

Quality Guidelines

Prefer:

Fun
Fast
Playable
Lightweight
Understandable

Avoid:

Overengineering
Large frameworks
Complex architecture
Enterprise-style systems
Final Rule

If it runs in browser, is fun, and fits inside the layout system — it belongs in Prompt Arcade.
