import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "tower-of-almost-stability",
  name: "Tower of Almost Stability",
  description:
    "Build a tower in a world where gravity refuses to stay still. Survive shifting forces, chaotic wind, and collapsing physics as long as possible.",
  genre: "Action",
  layout: "immersive" as const,
  status: "Broken",
  generatedWith: "Manus 1.6 Lite",
  thumbnail,
  controls: [
    "Click / Tap to place blocks",
    "Mouse position shows where block will drop",
    "Refresh page to restart",
  ],
  knownIssues: [
    "Physics simulation is simplified (Matter.js constraints only)",
    "No real structural engineering accuracy",
    "Gravity changes are artificial game rules, not realistic physics",
    "Wind effects are approximated forces",
    "Large towers may behave unpredictably due to engine limits",
    "Performance may degrade with many blocks (100+)",
  ],
  prompts: [
    "Create a physics-based building survival game where the player constructs a tower under constantly unstable physics. The core twist: the laws of gravity are unstable and keep changing while you build.",

    "Player places blocks one by one to build a tower. Once placed, blocks are affected by physics. The environment constantly changes: gravity direction flips or rotates every ~10 seconds, random wind forces push the structure sideways, and the tower naturally becomes unstable over time.",

    "Win condition (optional): Survive for a target time (e.g., 2–5 minutes). Lose condition: Tower collapses beyond a stability threshold or all blocks fall apart.",

    "Block Placement: Player clicks or taps to drop a block. Blocks stack under physics simulation. Each block has simple rectangular physics body. Gravity Instability: Every ~10 seconds, gravity direction changes randomly (down, left, right, slight diagonal shifts). Wind System: Occasionally apply horizontal force to all blocks. Strength varies randomly. Can push tower into collapse or interesting shapes. Stability Pressure: As time increases, gravity shifts become more frequent, wind becomes stronger, physics becomes more chaotic.",
  ],
};
