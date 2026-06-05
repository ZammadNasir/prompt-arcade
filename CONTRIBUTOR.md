# CONTRIBUTOR.md — Prompt Arcade

This guide is for anyone contributing a game to Prompt Arcade.

It is designed to make contribution as simple as possible:

> Generate a game → drop a folder → open a PR → done

No complex setup required.

---

# 1. What You Are Building

You are contributing a **browser game** to Prompt Arcade.

Games can be:

- Simple
- Experimental
- Broken but fun
- Fully polished
- AI-generated prototypes

The goal is not perfection.

The goal is **playability and fun**.

---

# 2. How to Add a Game (Minimal Steps)

Create a new folder inside:

```txt
games/my-game/
```

It must contain:

```txt
game.tsx
meta.ts
thumbnail.png
```

Recommended:

```txt
assets/
README.md
```

---

# 3. Game Implementation Rules

## 3.1 Single File Preference

Your game should ideally live inside:

```txt
game.tsx
```

Use `"use client"` when required.

---

## 3.2 Allowed Technologies

Use only:

### Preferred

- Phaser

### Allowed

- Matter.js
- Three.js

### Base

- React
- TypeScript

Do NOT introduce new game engines.

---

## 3.3 No Backend

Games must:

- Run entirely in the browser
- Use no server-side logic
- Use no database
- Use no authentication

---

## 3.4 Keep It Simple

If your game is too complex:

> Reduce scope while preserving core gameplay.

Example reductions:

- FPS → wave-based shooter
- Minecraft → block placer sandbox
- GTA → small top-down city sandbox
- Racing sim → arcade racing loop

---

# 4. Assets Rules

All assets must be inside your game folder:

```txt
games/my-game/assets/
```

Do NOT use global `/public` for game assets.

---

# 5. Metadata (meta.ts)

Each game must export:

```ts
export const meta = {
  slug: "my-game",
  name: "My Game",
  description: "Short description",
  genre: "Action",
  generatedWith: "Codex",
  status: "Playable",
  thumbnail,
  prompts: [],
  knownIssues: [],
};
```

---

## Required Fields

- slug
- name
- description
- genre
- generatedWith
- status
- thumbnail
- prompts
- knownIssues

---

# 6. Thumbnail Rules

Your thumbnail must: (Thumbnail prompt provided in **GAME_THUMBNAIL_PROMPT_TEMPLATE.md**)

- Be 16:9 aspect ratio
- Look like a real game cover
- Be visually clear at small size
- Have a strong focal point

Do NOT include:

- Text
- Logos
- Watermarks
- Real game branding

---

# 7. Game Page Behavior (Important)

Your game will be displayed in:

> Fullscreen-first arcade mode

So ensure:

- Game works in a large container
- Responsive resizing works
- No fixed canvas sizes
- No layout assumptions

---

# 8. Controls Requirement

Every game must clearly define:

- Movement controls
- Action controls
- Win/lose conditions (if applicable)

Controls should be intuitive.

---

# 9. Quality Expectations

Good contributions:

- Fun within 5 seconds
- Clear gameplay loop
- Responsive controls
- Minimal bugs
- Simple architecture

Bad contributions:

- Overengineered systems
- Multi-file frameworks for small games
- Heavy dependencies
- Non-playable demos

---

# 10. PR Checklist

Before submitting a pull request, ensure:

- [ ] Game runs locally
- [ ] game.tsx exists and works
- [ ] meta.ts is complete
- [ ] thumbnail.png is included
- [ ] assets are inside folder (if used)
- [ ] game is playable immediately
- [ ] no external backend or APIs

---

# 11. AI-Assisted Contribution (Recommended)

If using AI (Codex, ChatGPT, Claude, etc.):

Use this flow:

1. Generate game from prompt given in **GAME_PROMPT_TEMPLATE.md** (Recommended)
2. Ensure it fits Prompt Arcade rules
3. Place inside `/games/my-game`
4. Validate gameplay locally
5. Submit PR

---

# 12. Core Philosophy

> “If it’s fun and runs in the browser, it belongs here.”

Perfection is not required.

Completeness is not required.

Playability is required.

---

# 13. What NOT to Do

Do NOT:

- Modify core app routing
- Add global game registries
- Introduce new engines
- Add backend services
- Add analytics
- Copy real games or assets
- Break folder structure rules

---

# 14. Final Rule

> The easiest way to contribute is also the correct way.

If your game:

- Runs in browser
- Lives in its own folder
- Is playable
- Has metadata + thumbnail

Then it belongs in Prompt Arcade.
