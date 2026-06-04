import thumbnail from "./thumbnail.png";
import type { GameMeta } from "@/lib/game-types";

export const meta = {
  slug: "bird-launcher",
  name: "Bird Launcher",
  description: "Launch a chunky bird toward a stack of targets with one button.",
  genre: "Shooter",
  generatedWith: "Codex",
  status: "Broken",
  thumbnail,
  prompts: [
    "Create a bird launching game",
    "Add a power meter",
    "Add targets to knock down",
  ],
  knownIssues: [
    "Bird physics are mostly vibes.",
    "Targets do not fall over individually.",
  ],
} satisfies GameMeta;
