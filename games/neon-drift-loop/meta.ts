import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "neon-drift-loop",

  name: "Neon Drift Loop",

  description:
    "A high-speed neon tunnel runner where the corridor shifts, speeds up, and tests your reflexes in an endless sci-fi drift loop.",

  genre: "Racing",

  layout: "immersive",

  generatedWith: "MiniMax-M3",

  status: "Actually Good",

  thumbnail,

  prompts: [
    "Neon Drift Loop — endless neon tunnel survival driving game.",

    "Core: speed constantly increases, tunnel subtly reshapes, hypnotic/chaotic but playable.",

    "Player moves forward automatically; strafes left/right (and slight up/down).",

    "Tunnel is infinite and procedurally generated; obstacles/gaps in walls.",

    "No formal win — survival-based score; lose on wall collision.",

    "Layout: immersive. Stack: Three.js. Visuals: neon sci-fi (purple/blue/pink/cyan), dark bg, fake bloom glow, breathing tunnel.",

    "Mechanics: auto-forward, lane/free movement (slightly slippery), procedural tunnel with subtle wall shifts, occasional narrow passages, approximate collision zones.",

    "Difficulty: speed ramps continuously, walls shift faster, narrow gaps appear more often.",

    "Scoring: time + speed based; near-miss bonus when grazing walls without hitting.",

    "Single self-contained game.tsx. Use 'use client'.",
  ],

  knownIssues: [
    "Tunnel geometry is simplified — torus rings on a straight axis, not a true curved tube.",

    "No real lighting or post-processing engine; the 'glow' is faked with additive blending + emissive materials.",

    "Collision detection is approximate (radial distance from tunnel center per ring).",

    "No audio-reactive system; no music or SFX are shipped with this build.",

    "No mobile/touch controls — desktop keyboard only.",

    "No multiplayer, accounts, leaderboards, or persistence beyond the in-session best score.",
  ],
};

export default meta;
