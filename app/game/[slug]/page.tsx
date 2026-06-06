import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GamePageShell } from "@/components/game-page-shell";
import { getGameBySlug, listGameSlugs } from "@/lib/games";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await listGameSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return {
      title: "Game Not Found | Prompt Arcade",
    };
  }

  return {
    title: `${game.meta.name} | Prompt Arcade`,
    description: game.meta.description,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const Game = game.Game;
  const gameInfo = {
    slug: game.meta.slug,
    name: game.meta.name,
    description: game.meta.description,
    genre: game.meta.genre,
    generatedWith: game.meta.generatedWith,
    status: game.meta.status,
    layout: game.meta.layout,
    controls: game.meta.controls,
    prompts: game.meta.prompts,
    knownIssues: game.meta.knownIssues,
  };

  return (
    <GamePageShell game={gameInfo}>
      <Game />
    </GamePageShell>
  );
}
