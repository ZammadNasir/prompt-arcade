import thumbnail from "./thumbnail.png";
import type { GameMeta } from "@/lib/game-types";

export const meta = {
  slug: "pixel-quest",
  name: "Pixel Quest",
  description: "A pocket puzzle quest about grabbing gems before the map closes.",
  genre: "Puzzle",
  generatedWith: "Codex",
  status: "Playable",
  thumbnail,
  prompts: [
    "Create a pixel quest game",
    "Add collectible gems",
    "Add a limited move count",
  ],
  knownIssues: [
    "Levels do not progress.",
    "The hero has no walking animation.",
  ],
} satisfies GameMeta;
