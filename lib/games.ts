import { gameGenres, gameStatuses, type GameCardData } from "./game-types";
import { gameRegistry } from "./generated-game-registry";

export { gameGenres, gameStatuses };
export type { GameCardData, GameGenre, GameMeta, GameStatus } from "./game-types";

function getThumbnailSrc(thumbnail: { src?: string } | string) {
  return typeof thumbnail === "string" ? thumbnail : thumbnail.src ?? "";
}

export function listGames() {
  return [...gameRegistry].sort((a, b) => a.meta.name.localeCompare(b.meta.name));
}

export function listGameCards(): GameCardData[] {
  return listGames().map(({ meta }) => ({
    ...meta,
    thumbnailSrc: getThumbnailSrc(meta.thumbnail),
  }));
}

export function getGameBySlug(slug: string) {
  return gameRegistry.find((entry) => entry.meta.slug === slug);
}

export function listGameSlugs() {
  return gameRegistry.map((entry) => entry.meta.slug);
}
