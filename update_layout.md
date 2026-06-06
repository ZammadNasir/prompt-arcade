## Prompt Arcade - Game Page Layout + Immersion Mode Refactor

You are updating the `/game/[slug]` page in the Prompt Arcade project.

The goal is to transform the page into a **full immersive game-first experience**, similar to Steam “Play Mode” or itch.io fullscreen gameplay.

---

# 1. Core Goal

The game must feel like it is the entire page.

Everything else is secondary.

On load:

- The user should immediately see and play the game
- No distractions
- No navbar
- No side panels
- No layout splitting

---

# 2. Remove Navbar Completely

- Do NOT render global navbar on `/game/[slug]`
- Do NOT show navigation header
- Only allow a minimal “Back to Arcade” button (top-left)

This button should:

- Be small
- Be unobtrusive
- Optionally auto-hide in immersion mode

---

# 3. Fullscreen Game First Layout

The game must occupy:

- 100% width
- 90–100vh height minimum
- First visible element on page load

Layout:

```txt id="layout1"
[ Back ]

-----------------------------------
|                                 |
|         GAME AREA               |
|        (FULL SCREEN)            |
|                                 |
-----------------------------------
```

No metadata above the game.

No descriptions above the game.

No side layout.

---

# 4. Everything Below the Game (Scroll Section)

All metadata must be moved BELOW the game:

- Game title
- Description
- Controls
- Known issues
- Prompt history
- Technology used
- Status

These must NOT interfere with gameplay.

---

# 5. Collapsible Info System

Below the game, use accordion/collapsible UI:

- Controls
- Prompt History
- Known Issues
- Metadata

Default state:

- Collapsed

This keeps page clean and focused on gameplay.

---

# 6. Immersion Mode (NEW FEATURE)

Add a **Play / Exit Immersion Mode** system.

## Behavior:

When user clicks "Play":

- Enter fullscreen gameplay mode
- Hide all UI except game
- Hide scroll content
- Hide header/back button (optional fade)
- Game becomes true fullscreen experience

When user clicks "Exit":

- Restore full page layout
- Show metadata again

---

# 7. Fullscreen API Support

Implement native browser fullscreen support:

- Press `F` to toggle fullscreen mode
- Use Fullscreen API (`requestFullscreen`, `exitFullscreen`)
- Escape key should exit fullscreen

---

# 8. Auto-Hide UI System

During immersion mode:

- UI controls should auto-hide after 3 seconds of inactivity
- UI reappears on mouse movement or keypress

UI elements affected:

- Back button
- Play/Exit button
- Overlay controls

---

# 9. UX Rules

- Game must be playable immediately on load
- No scrolling required to start playing
- No UI blocking gameplay
- No persistent overlays unless in interaction mode
- Game container must always resize correctly

---

# 10. Layout Structure

Refactor `/app/game/[slug]/page.tsx` into:

```txt id="structure1"
Top Layer:
→ Minimal Back Button (optional auto-hide)

Main Layer:
→ Game Container (fullscreen / 100vh)

Immersion Layer:
→ Fullscreen mode (game only)

Bottom Layer (after scroll):
→ Game Info Section
   - Title
   - Description
   - Controls (accordion)
   - Prompt History (accordion)
   - Known Issues (accordion)
   - Metadata
```

---

# 11. Styling Rules (Tailwind)

Use:

- `h-screen`, `min-h-screen`
- `flex`, `flex-col`
- `overflow-hidden` in immersion mode
- `absolute` overlays for UI controls
- avoid sticky navbars
- avoid sidebars entirely

---

# 12. Game Compatibility Rules

Ensure compatibility with:

- Phaser games
- Matter.js games
- Three.js games
- Canvas-based games

Game container must:

- Resize dynamically
- Fill available space
- Not break aspect ratio unless intended by game engine

---

# 13. Final UX Outcome

The experience should feel like:

> "You opened a game. You are immediately inside it."

Then optionally:

- Press F → fullscreen arcade mode
- Press Esc → exit
- Scroll → see details

---

# 14. Non-Negotiable Rules

- Game always comes first
- No UI should interfere with gameplay
- No metadata above game
- No sidebar layouts
- No default dashboard styling

---

## Result

Prompt Arcade game pages should feel like a modern hybrid of:

- Steam “Play”
- itch.io fullscreen games
- Xbox cloud gaming UI
- Arcade cabinet experience
