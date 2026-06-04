import thumbnail from "./thumbnail.png";
import type { GameMeta } from "@/lib/game-types";

export const meta = {
  slug: "space-racer",
  name: "Space Racer",
  description: "Dodge comet traffic in a three-lane star sprint.",
  genre: "Racing",
  generatedWith: "Codex",
  status: "Experimental",
  thumbnail,
  prompts: [
    "Create a space racing game",
    "Add lane switching",
    "Add obstacles and score",
  ],
  knownIssues: [
    "Collision boxes are generous.",
    "The ship cannot accelerate.",
  ],
} satisfies GameMeta;
