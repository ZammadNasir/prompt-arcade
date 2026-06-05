<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data.

Before modifying application code:

- Read the relevant guide in `node_modules/next/dist/docs/`
- Follow current Next.js conventions
- Respect deprecation warnings
- Do not assume APIs from older Next.js versions

<!-- END:nextjs-agent-rules -->

# Prompt Arcade Agent Rules

Prompt Arcade is an open-source collection of AI-generated browser games.

The goal is to create fun, playable browser games that can be added to the arcade with minimal effort.

Games do NOT need to be perfect.

Games may be:

- Experimental
- Simple
- Buggy
- Weird
- Chaotic
- Surprisingly good

Prioritize playable experiences over complex architecture.

---

# Core Philosophy

When generating games:

- Prefer simplicity over completeness
- Prefer playability over realism
- Prefer browser compatibility over advanced features
- Prefer a working prototype over an unfinished ambitious design

If a requested game is too large to recreate, generate the smallest enjoyable version that captures its core gameplay loop.

---

# Required Game Structure

Every game must live in its own folder:

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

# Game Implementation Rules

Whenever possible:

- Implement the game in a single `game.tsx` file
- Use React + TypeScript
- Export a default component
- Use `"use client"` when browser APIs are needed

Avoid unnecessary abstractions.

Do not create large internal architectures.

Do not split small games into many files.

Small and understandable code is preferred.

---

# Preferred Game Technologies

Tier 1 (Recommended)

- React
- Canvas API
- Phaser
- Matter.js

Tier 2 (Allowed)

- Three.js

Avoid

- Unity WebGL
- Unreal exports
- Babylon.js
- Large game engines

---

# Approved Game Libraries

2D Games

- Phaser

Physics

- Matter.js

3D Games

- Three.js

Preferred Order

1. Phaser
2. Phaser + Matter.js
3. Three.js (only when 3D is actually needed)

Avoid adding additional game engines unless there is a strong reason.

---

# Assets

All game-specific assets must remain inside the game's own folder.

Example:

```text
games/my-game/
└── assets/
    ├── player.png
    ├── enemy.png
    ├── background.jpg
    └── music.mp3
```

Do NOT place game-specific assets directly into:

```text
public/
```

unless absolutely necessary.

Games should remain self-contained.

---

# Metadata Requirements

Every game must export metadata from `meta.ts`.

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

Follow the existing GameMeta type.

---

# Routing Rules

Do NOT modify application routing.

Do NOT manually register games.

Do NOT edit route files to add a game.

Prompt Arcade automatically discovers games from the `/games` directory.

Adding a folder should be sufficient.

---

# Dependency Rules

Prefer:

- React
- TypeScript
- Browser APIs
- Lightweight utilities

Avoid:

- Heavy game engines
- Large frameworks
- Unnecessary dependencies

If a feature can be implemented with browser APIs, do that instead of adding a package.

---

# Performance

Games should:

- Load quickly
- Work on desktop browsers
- Avoid excessive memory usage
- Avoid unnecessary network requests

Keep games lightweight.

---

# Copyright Rules

Never copy:

- Game assets
- Logos
- Music
- Art
- Characters

Inspired-by gameplay is acceptable.

Direct copying is not.

Generate original placeholder assets when needed.

---

# README Guidelines

A game README may contain:

- Controls
- Prompt history
- Generation notes
- Known issues
- Credits

README files are optional but encouraged.

---

# When Generating Games

Always provide:

1. Playable game implementation
2. Metadata
3. Asset requirements
4. Controls
5. Known limitations

If forced to choose between complexity and fun:

Choose fun.

If forced to choose between realism and performance:

Choose performance.

If forced to choose between architecture and simplicity:

Choose simplicity.
