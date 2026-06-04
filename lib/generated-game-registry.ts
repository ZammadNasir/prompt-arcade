import { meta as meta0 } from "../games/bird-launcher/meta";
import Game0 from "../games/bird-launcher/game";
import { meta as meta1 } from "../games/block-builder/meta";
import Game1 from "../games/block-builder/game";
import { meta as meta2 } from "../games/call-of-wars/meta";
import Game2 from "../games/call-of-wars/game";
import { meta as meta3 } from "../games/pixel-quest/meta";
import Game3 from "../games/pixel-quest/game";
import { meta as meta4 } from "../games/space-racer/meta";
import Game4 from "../games/space-racer/game";
import { meta as meta5 } from "../games/zombie-escape/meta";
import Game5 from "../games/zombie-escape/game";
import type { GameRegistryEntry } from "./game-types";

export const gameRegistry: GameRegistryEntry[] = [
  { meta: meta0, Game: Game0 },
  { meta: meta1, Game: Game1 },
  { meta: meta2, Game: Game2 },
  { meta: meta3, Game: Game3 },
  { meta: meta4, Game: Game4 },
  { meta: meta5, Game: Game5 },
];
