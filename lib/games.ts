import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  gameGenres,
  gameLayouts,
  gameStatuses,
  type GameCardData,
  type GameMeta,
  type GameRegistryEntry,
} from "./game-types";

export { gameGenres, gameLayouts, gameStatuses };
export type { GameCardData, GameGenre, GameLayout, GameMeta, GameStatus } from "./game-types";

const gamesDirectory = join(process.cwd(), "games");

function getThumbnailSrc(thumbnail: { src?: string } | string) {
  return typeof thumbnail === "string" ? thumbnail : thumbnail.src ?? "";
}

async function listGameFolders() {
  try {
    const entries = await readdir(gamesDirectory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function importGame(folder: string): Promise<GameRegistryEntry | null> {
  try {
    const [{ meta }, gameModule] = await Promise.all([
      import(`../games/${folder}/meta`),
      import(`../games/${folder}/game`),
    ]);

    return {
      meta: meta as GameMeta,
      Game: gameModule.default,
    };
  } catch {
    return null;
  }
}

export async function listGames() {
  const folders = await listGameFolders();
  const games = await Promise.all(folders.map((folder) => importGame(folder)));

  return games
    .filter((game): game is GameRegistryEntry => game !== null)
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

export async function listGameCards(): Promise<GameCardData[]> {
  const games = await listGames();

  return games.map(({ meta }) => ({
    ...meta,
    thumbnailSrc: getThumbnailSrc(meta.thumbnail),
  }));
}

export async function getGameBySlug(slug: string) {
  const folders = await listGameFolders();

  if (!folders.includes(slug)) {
    return undefined;
  }

  const game = await importGame(slug);
  return game?.meta.slug === slug ? game : undefined;
}

export async function listGameSlugs() {
  const games = await listGames();
  return games.map((entry) => entry.meta.slug);
}
