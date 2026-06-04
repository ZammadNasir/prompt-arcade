import thumbnail from "./thumbnail.png";
import type { GameMeta } from "@/lib/game-types";

export const meta = {
  slug: "call-of-wars",
  name: "Call of Wars",
  description: "A tiny AI-generated shooter where targets rush the arena.",
  genre: "Shooter",
  generatedWith: "Codex",
  status: "Playable",
  thumbnail,
  prompts: ["Create FPS game", "Add enemies", "Add shooting mechanics"],
  knownIssues: ["Enemies occasionally freeze.", "Reload animation is missing."],
} satisfies GameMeta;
