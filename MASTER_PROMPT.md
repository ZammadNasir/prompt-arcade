🎮 Prompt Arcade — MASTER GAME GENERATION PROMPT

You are generating a game for Prompt Arcade, an open-source collection of AI-generated browser games.

This is a strict structured generation system. Follow all sections exactly.

---

1. GAME RULES (GLOBAL)

---

Prompt Arcade is a collection of playable browser games generated with AI.

The goal is:

Fun, playable, lightweight browser games — not perfect simulations.

Games may be:

Experimental
Simple
Buggy (acceptable)
Chaotic
Weird
Surprisingly good
Core Principles

Prioritize:

Playability
Simplicity
Fast loading
Browser compatibility
Clear controls
Self-contained implementation

Avoid:

Overengineering
Complex architectures
Large frameworks
Unnecessary abstractions

If a game is too complex:

Reduce scope but preserve the core fun idea.

Required Gameplay Elements

Every game MUST include:

A clear gameplay loop
Score OR progression system
Win condition (if applicable)
Lose condition (if applicable)
Visual feedback
Responsive controls

Avoid static demos.

Technical Rules
Must run entirely in browser
Must work in Next.js
Must use React + TypeScript
Must export a default React component
Must be self-contained
No backend, database, auth, or external services
Use "use client"; when needed
Layout System (MANDATORY)

Every game MUST define:

layout: "card" | "immersive"
CARD layout:

Use for:

Puzzle games
Board games
UI games

Rules:

Centered layout
Fixed/max width
No fullscreen dependency
IMMERSIVE layout:

Use for:

Platformers
Shooters
Racing
Physics games
3D / Canvas / Three.js games

Rules:

Full viewport usage
No unnecessary scroll
Feels like a real game
Library Rules

Preferred usage:

Phaser → arcade / platformers / shooters
Matter.js → physics games
Three.js → real 3D games
Canvas API → simple custom games
Asset Rules
All assets must be local inside /assets
NEVER use /public
No copyrighted assets
No logos or real game references
Mobile Rule (IMPORTANT)
Mobile support is OPTIONAL
DO NOT optimize for mobile unless easy
Desktop gameplay is primary
Output Format (STRICT)

Always generate:

game.tsx
meta.ts
Asset List
Controls
Description
Known Limitations

---

2. THUMBNAIL RULES (OPTIONAL)

---

Only generate a thumbnail prompt if explicitly requested OR if the game would benefit visually.

If needed, follow this:

Thumbnail Prompt Rules

Generate a 16:9 cinematic game cover image.

Must:

Look like AAA game cover art
Have strong focal point
Be high contrast and readable at small size
Be cinematic and dramatic

DO NOT include:

Text
Logos
UI
Watermarks
Real game branding

Style:

Cinematic lighting
Depth and motion
Game store cover aesthetic (Steam / console style)

Output must be:

A single image prompt description only

---

3. GAME GENERATION TASK

---

Now generate the game based on the following prompt:

GAME NAME:

{GAME_NAME}

GAME IDEA:

{GAME_PROMPT}

REQUIRED OUTPUT FORMAT:

1. game.tsx
   Fully working React + TypeScript game
   Self-contained logic
   Uses chosen library if needed
   Must include "use client";

2. meta.ts

Must include:

slug: "string"
name: "string"
description: "string"
genre: (Action / Racing / Puzzle / Sandbox / Shooter)
layout: (card or immersive)
generatedWith: "Prompt Arcade AI"
status: (Playable / Broken / Experimental / Chaos Mode / Actually Good)
thumbnail (import if available else empty string)
prompts: string[] (include GAME_PROMPT)
knownIssues: string[] (realistic limitations)

3. Asset List

List all required assets (or none)

4. Controls

Clear input instructions

5. Description

Short 1–2 line summary

6. Known Limitations

List simplified systems and missing features

---

## FINAL RULE

Always optimize for:

Fun > Simplicity > Stability > Complexity

If the game runs in browser and is fun, it belongs in Prompt Arcade.
