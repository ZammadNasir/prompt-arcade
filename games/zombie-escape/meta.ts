import thumbnail from "./thumbnail.png";
import type { GameMeta } from "@/lib/game-types";

export const meta = {
  slug: "zombie-escape",
  name: "Zombie Escape",
  description: "Cross the alley before the shambling dots crowd the exit.",
  genre: "Action",
  generatedWith: "Codex",
  status: "Chaos Mode",
  thumbnail,
  prompts: [
    "Create a zombie escape game",
    "Add a grid arena",
    "Make zombies chase the player",
  ],
  knownIssues: [
    "Zombie pathfinding is intentionally crude.",
    "The win screen can be escaped by moving again.",
  ],
} satisfies GameMeta;
