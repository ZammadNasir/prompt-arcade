import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "sunset-rush",
  name: "Sunset Rush",
  description:
    "An open-world arcade racing experience featuring free-roam exploration, checkpoint races, drifting, and high-speed driving inspired by festival racing games.",
  genre: "Action",
  layout: "immersive" as const,
  status: "Actually Good",
  generatedWith: "Kimi 2.6",
  thumbnail,
  controls: [
    "Click / Tap to place blocks",
    "Mouse position shows where block will drop",
    "Refresh page to restart",
  ],
  knownIssues: [
    "Open world is simplified",
    "Physics are arcade-style",
    "Traffic AI uses basic pathfinding",
    "No multiplayer support",
    "Limited vehicle customization",
  ],
  prompts: [
    "Create a browser-playable open-world arcade racing game inspired by the feeling of Forza Horizon. Core gameplay should focus on: large explorable world, high-speed arcade driving, drift mechanics, AI traffic vehicles, multiple race events, checkpoint races, off-road and road driving, speed zones and stunt challenges, open-world free roam, reward/progression system.",
  ],
};
