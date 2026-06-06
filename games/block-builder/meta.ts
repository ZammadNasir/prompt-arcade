import thumbnail from "./thumbnail.png";
import type { GameMeta } from "@/lib/game-types";

export const meta = {
  slug: "block-builder",
  name: "Block Builder",
  description: "A sandbox toy for stacking colored blocks into unstable towers.",
  genre: "Sandbox",
  generatedWith: "Codex",
  status: "Actually Good",
  thumbnail,
  layout: "card",
  controls: [
    "Pick a color swatch.",
    "Click cells to place blocks.",
    "Right-click cells to remove blocks.",
  ],
  prompts: [
    "Create a block building game",
    "Add multiple block colors",
    "Make the board easy to reset",
  ],
  knownIssues: [
    "Blocks ignore gravity.",
    "There is no save system.",
  ],
} satisfies GameMeta;
