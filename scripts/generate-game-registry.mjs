import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const gamesDir = join(root, "games");
const outputFile = join(root, "lib", "generated-game-registry.ts");

const folders = existsSync(gamesDir)
  ? readdirSync(gamesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((folder) => {
        const folderPath = join(gamesDir, folder);
        return (
          existsSync(join(folderPath, "meta.ts")) &&
          existsSync(join(folderPath, "game.tsx"))
        );
      })
      .sort((a, b) => a.localeCompare(b))
  : [];

const imports = folders
  .map(
    (folder, index) =>
      `import { meta as meta${index} } from "../games/${folder}/meta";\n` +
      `import Game${index} from "../games/${folder}/game";`,
  )
  .join("\n");

const entries = folders
  .map((_, index) => `  { meta: meta${index}, Game: Game${index} },`)
  .join("\n");

const contents = `${imports ? `${imports}\n` : ""}import type { GameRegistryEntry } from "./game-types";

export const gameRegistry: GameRegistryEntry[] = [
${entries}
];
`;

writeFileSync(outputFile, contents);
console.log(`Generated ${folders.length} game registry entr${folders.length === 1 ? "y" : "ies"}.`);
