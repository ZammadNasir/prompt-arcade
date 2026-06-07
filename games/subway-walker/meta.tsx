import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "subway-walker",
  name: "Subway Walker",
  description:
    "Dodge incoming trains and obstacles in this fast-paced endless runner inspired by Subway Surfers. Swipe or use arrow keys to switch lanes, jump, and roll under obstacles as you race through the subway!",
  genre: "Action",
  thumbnail,
  layout: "immersive",
  generatedWith: "Claude Sonnet 4.6",
  status: "Experimental",
  prompts: [
    "Generate subway runner clone Subway walker  following the instruction below. Add sound effeect with 'browser' api or anyway you want Make the game closer to the original subway surfer Focus on graphics Add other micro effects also Ask me any questions if you anything",
  ],
  knownIssues: [],
};
