import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "mountain-drift",
  name: "Mountain Drift",
  description:
    "Physics-based hill climbing driving game with fuel, coins, and endless terrain.",
  genre: "Racing",
  layout: "immersive",
  generatedWith: "Chat GPT 5.5",
  status: "Broken",
  thumbnail,
  prompts: ["Create a Hill Climb Racing style physics driving game."],
  knownIssues: [
    "Simplified vehicle suspension",
    "Procedural terrain may occasionally generate steep sections",
    "Placeholder audio implementation",
  ],
};
