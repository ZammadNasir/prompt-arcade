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
  layout: "card",       // or "immersive" — see Section 6
  prompts: [],
  knownIssues: [],
} satisfies GameMeta;
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

## Optional Fields

- layout *(defaults to `"card"` if omitted)*
- controls

---

# 6. Layout System

Every game must fit one of two layouts. Choose the one that matches your game's nature.

---

## 6.1 Layout Types

```ts
type GameLayout = "card" | "immersive";
```

---

## 6.2 `card` — Puzzle, Board, Grid, Text Games

Use `card` when your game:

- Is a puzzle, board game, card game, word game, or grid game
- Has a fixed or small play area
- Relies on buttons, clicks, or keyboard input on a bounded UI
- Would look absurd stretched across a 1920px display

Behavior:

- Game content is centered horizontally
- Max width: `42rem` (672px)
- Vertical scrolling is allowed if content overflows
- Controls panel is always visible
- No fullscreen mode

Example meta:

```ts
export const meta = {
  slug: "my-puzzle",
  layout: "card",
  ...
} satisfies GameMeta;
```

Example game structure:

```tsx
export default function MyPuzzleGame() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-9 gap-1">
        {/* board cells */}
      </div>
      <div className="flex gap-2">
        {/* action buttons */}
      </div>
    </div>
  );
}
```

The shell centers your component inside a `max-w-2xl` container. You do not need to add centering yourself.

---

## 6.3 `immersive` — Platformers, Shooters, Racing, Canvas Games

Use `immersive` when your game:

- Is a platformer, shooter, racing game, physics simulation, or canvas-rendered game
- Benefits from using the full viewport
- Uses a canvas element or a viewport-filling render loop
- Feels cramped or wrong in a constrained box

Behavior:

- Game stage fills the full browser viewport when playing
- A "Play Now" overlay is shown before the game starts
- Fullscreen is available via the `F` key or the Play button
- Scrolling is disabled during play
- Controls auto-hide after 3 seconds of inactivity
- Metadata is shown below the stage when not playing

Example meta:

```ts
export const meta = {
  slug: "my-racer",
  layout: "immersive",
  ...
} satisfies GameMeta;
```

Example game structure — canvas game:

```tsx
export default function MyRacerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // size the canvas to its container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // start render loop...
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
```

Your component receives a container that fills the remaining viewport. Use `w-full h-full` on your root element to occupy it fully.

---

## 6.4 Responsive Sizing

### Card games

Do not set fixed pixel widths. Use relative or fluid sizing:

```tsx
// Good
<div className="grid grid-cols-9 gap-1 w-full">

// Bad
<div style={{ width: "540px" }}>
```

### Immersive games — canvas sizing

Avoid hardcoded canvas dimensions. Size the canvas to its container at runtime:

```tsx
useEffect(() => {
  const canvas = canvasRef.current!;
  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener("resize", resize);
  return () => window.removeEventListener("resize", resize);
}, []);
```

---

## 6.5 Fullscreen Expectations

Only `immersive` games support fullscreen. The shell handles everything — you do not need to call `requestFullscreen` yourself.

When your game enters fullscreen:

- The stage is `100vw × 100vh`
- The top bar overlays the game (semi-transparent, auto-hides)
- Scrolling is locked on `document.body`
- Pressing `F` or `Escape` exits fullscreen

Your game component does not need to know it is in fullscreen. Size to your container and the shell handles the rest.

---

# 7. Thumbnail Rules

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
