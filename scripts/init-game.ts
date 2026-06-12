import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const GAMES_DIR = path.join(PROJECT_ROOT, "games");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function validateGameName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Game name is required and cannot be empty." };
  }

  if (name !== name.toLowerCase()) {
    return {
      valid: false,
      error: "Game name must be lowercase letters and hyphens only.",
    };
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    return {
      valid: false,
      error:
        "Game name may only contain lowercase letters, numbers, and single hyphens.",
    };
  }

  if (name.startsWith("-") || name.endsWith("-")) {
    return {
      valid: false,
      error: "Game name cannot start or end with a hyphen.",
    };
  }

  if (name.includes("--")) {
    return {
      valid: false,
      error: "Game name cannot contain consecutive hyphens.",
    };
  }

  return { valid: true };
}

async function findThumbnailSource(): Promise<string | null> {
  const candidates = [
    path.join(PUBLIC_DIR, "assets", "thumbnail.png"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  const gameDirs = await fs.readdir(GAMES_DIR, { withFileTypes: true });
  for (const dir of gameDirs) {
    if (dir.isDirectory()) {
      const thumb = path.join(GAMES_DIR, dir.name, "thumbnail.png");
      try {
        await fs.access(thumb);
        return thumb;
      } catch {
        continue;
      }
    }
  }

  return null;
}

async function scaffoldGame(gameName: string): Promise<void> {
  const validation = validateGameName(gameName);
  if (!validation.valid) {
    console.error(`Error: ${validation.error}`);
    process.exit(1);
  }

  const gameDir = path.join(GAMES_DIR, gameName);
  const pascalCaseName = toPascalCase(gameName);
  const displayName = toDisplayName(gameName);

  try {
    await fs.access(gameDir);
    console.error(
      `Error: Game directory "${gameDir}" already exists. Aborting.`,
    );
    process.exit(1);
  } catch {
    console.log(`Creating new game: ${displayName}`);
  }

  const thumbnailSource = await findThumbnailSource();
  if (!thumbnailSource) {
    console.error(
      'Error: No thumbnail source found. Expected "public/assets/thumbnail.png" or a thumbnail in an existing game directory.',
    );
    process.exit(1);
  }

  try {
    await fs.mkdir(gameDir, { recursive: true });
    await fs.mkdir(path.join(gameDir, "assets"), { recursive: true });

    const gameTsx = `export default function ${pascalCaseName}() {\n  return <div />;\n}\n`;
    await fs.writeFile(path.join(gameDir, "game.tsx"), gameTsx);

    const metaTs = `import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "${gameName}",
  name: "${displayName}",
  description: "This is ${displayName} description.",
  genre: "Action",
  layout: "immersive",
  thumbnail,
  generatedWith: "YOUR-AI-TOOL",
  status: "Playable",
  prompts: [],
  knownIssues: [],
};
`;
    await fs.writeFile(path.join(gameDir, "meta.ts"), metaTs);

    await fs.copyFile(thumbnailSource, path.join(gameDir, "thumbnail.png"));

    const readmeMd = `# ${displayName}\n`;
    await fs.writeFile(path.join(gameDir, "README.md"), readmeMd);

    console.log(`Success! Game scaffolded at: ${gameDir}`);
    console.log(`  - games/${gameName}/game.tsx`);
    console.log(`  - games/${gameName}/meta.ts`);
    console.log(`  - games/${gameName}/thumbnail.png`);
    console.log(`  - games/${gameName}/assets/`);
    console.log(`  - games/${gameName}/README.md`);
  } catch (error) {
    console.error(`Error scaffolding game: ${error}`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run init <game-name>');
  console.error("Example: npm run init subway-runner");
  process.exit(1);
}

if (args.length > 1) {
  console.error(
    'Error: Game name must be a single kebab-case argument.',
  );
  process.exit(1);
}

const gameName = args[0]!.trim();
scaffoldGame(gameName);
