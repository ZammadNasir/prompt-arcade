import type { ComponentType } from "react";
import type { StaticImageData } from "next/image";

export const gameGenres = [
  "Action",
  "Racing",
  "Puzzle",
  "Sandbox",
  "Shooter",
] as const;

export const gameStatuses = [
  "Playable",
  "Broken",
  "Experimental",
  "Chaos Mode",
  "Actually Good",
] as const;

export const gameLayouts = ["card", "immersive"] as const;

export type GameGenre = (typeof gameGenres)[number];
export type GameStatus = (typeof gameStatuses)[number];
export type GameLayout = (typeof gameLayouts)[number];
export type GameThumbnail = StaticImageData | string;

export type GameMeta = {
  slug: string;
  name: string;
  description: string;
  genre: GameGenre;
  generatedWith: string;
  status: GameStatus;
  thumbnail: GameThumbnail;
  layout?: GameLayout;
  controls?: string[];
  prompts?: string[];
  knownIssues?: string[];
};

export type GameRegistryEntry = {
  meta: GameMeta;
  Game: ComponentType;
};

export type GameCardData = Omit<GameMeta, "thumbnail"> & {
  thumbnailSrc: string;
};
