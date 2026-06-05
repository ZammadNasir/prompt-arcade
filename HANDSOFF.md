# HANDSOFF.md — Prompt Arcade

This document defines the core intent, architecture boundaries, and non-negotiable design principles of Prompt Arcade.

It exists to prevent scope creep, architectural decay, and loss of the project’s identity as it scales with contributors and AI-generated content.

---

# 1. Project Identity

Prompt Arcade is:

> A static-first open-source arcade of AI-generated browser games.

It is not:

- A SaaS platform
- A game engine
- A multiplayer gaming service
- A backend-heavy application
- A marketplace
- A social network

Its purpose is to explore **AI-generated playable experiences inside the browser**.

Games may be imperfect, broken, experimental, or surprisingly good.

---

# 2. Core Philosophy

Prompt Arcade prioritizes:

- Playability over perfection
- Simplicity over architecture
- Speed over abstraction
- Fun over correctness
- Experimentation over standardization (within controlled boundaries)

If a decision conflicts with these principles, this document takes priority.

---

# 3. Game Design Philosophy

Every game in Prompt Arcade should:

- Run entirely in the browser
- Be self-contained
- Be playable immediately
- Have a clear gameplay loop
- Be understandable within seconds

Games may be:

- AI-generated
- Simplified clones of existing genres
- Broken or chaotic prototypes
- Fully polished experiences

But they must always be playable.

---

# 4. Hard Constraints (DO NOT BREAK)

## 4.1 No Backend

- No databases
- No authentication
- No server-side game logic
- No multiplayer infrastructure

Everything must run client-side.

---

## 4.2 No Central Game Registry

- Games must be auto-discovered from filesystem
- No manual registration of games
- No central JSON registry for games

Adding a folder = adding a game.

---

## 4.3 No Per-Game Routing

- Do NOT create routes manually per game
- Use dynamic routing only:

```txt
/app/game/[slug]
```

---

## 4.4 Self-Contained Games Only

Each game must live inside:

```txt
games/my-game/
```

And include:

- game.tsx
- meta.ts
- thumbnail.png

Optional:

- assets/
- README.md

No cross-game dependencies.

---

## 4.5 No External Tracking

- No analytics inside games
- No telemetry
- No external tracking scripts

---

## 4.6 No External Game Engines Beyond Approved List

Allowed:

- Phaser (preferred)
- Matter.js
- Three.js

Do not introduce additional engines without strong justification.

---

# 5. UI Principles

## 5.1 Game Page Must Be Game First

On `/game/[slug]`:

- Game must be the primary element
- Must take full or near-full viewport height
- Must load immediately
- Must not be visually obstructed

---

## 5.2 No Dashboard Layout on Game Page

Forbidden:

- Sidebars
- Split layouts
- Metadata above game
- Navbar on game page

Allowed:

- Minimal back button
- Scroll-based details below game

---

## 5.3 Immersive Game Mode Exists

Games may support:

- Fullscreen mode
- “Play Mode” (UI hidden)
- Keyboard toggle (F key fullscreen)

---

# 6. Asset Rules

All assets must be:

- Stored inside each game folder
- Never placed in global `/public` for game-specific content
- Self-contained per game

Example:

```txt
games/my-game/assets/
```

---

# 7. Metadata Rules

Each game must export:

- slug
- name
- description
- genre
- generatedWith
- status
- thumbnail
- prompts
- knownIssues

Metadata must reflect reality, including imperfections.

---

# 8. Design Consistency Rules

## Thumbnails

- Must be 16:9
- Must resemble real game cover art
- Must be readable at small sizes
- No text or branding

## UI Style

- Game store inspired (Steam / itch.io / Xbox Game Pass)
- Clean, minimal, modern
- No excessive neon AI aesthetics
- No purple “AI SaaS” styling

---

# 9. Contribution Rules

Contributors must:

- Add a self-contained game folder
- Include metadata
- Include thumbnail
- Follow approved libraries

Contributors must NOT:

- Modify core routing
- Add global architecture changes per game
- Introduce new game engines without approval

---

# 10. AI Generation Rules

When AI is used to generate games:

- Prefer simplicity over complexity
- Reduce scope if needed
- Preserve gameplay loop
- Avoid overengineering
- Ensure immediate playability

---

# 11. Non-Negotiable UX Rule

> The user should always feel like they opened a game, not a website.

If the UI interferes with gameplay, it is incorrect.

---

# 12. Future Scalability Constraint

The architecture must always support:

- 100+ games
- 1000+ games
- Zero manual registry updates
- Zero route edits per game
- Fully filesystem-driven discovery

---

# 13. What This Project Is NOT Allowed To Become

Prompt Arcade must NOT evolve into:

- A game hosting platform with accounts
- A multiplayer ecosystem
- A complex backend system
- A social network for games
- A heavy game engine framework

If a change pushes it toward any of these directions, it should be rejected.

---

# 14. Final Principle

> Keep Prompt Arcade lightweight, chaotic, and creatively open — but structurally simple.

The system should always feel like:

> “Drop a folder → get a playable game”
