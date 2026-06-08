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

  const thumbnailSrc = typeof game.meta.thumbnail === "string"
    ? game.meta.thumbnail
    : game.meta.thumbnail.src ?? "";

  const absoluteImageUrl = thumbnailSrc
    ? (thumbnailSrc.startsWith("http") ? thumbnailSrc : `https://promptarcade.vercel.app${thumbnailSrc}`)
    : undefined;

  return {
    title: `${game.meta.name} | Prompt Arcade`,
    description: game.meta.description,
    keywords: [
      game.meta.name,
      game.meta.genre,
      "AI generated game",
      game.meta.generatedWith,
      "browser game",
      "free online game",
      "play free",
      "prompt game",
    ],
    openGraph: {
      title: `${game.meta.name} - Play Free on Prompt Arcade`,
      description: game.meta.description,
      type: "video.other",
      url: `https://promptarcade.vercel.app/game/${slug}`,
      siteName: "Prompt Arcade",
      images: absoluteImageUrl
        ? [
            {
              url: absoluteImageUrl,
              alt: `${game.meta.name} gameplay thumbnail`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.meta.name} | Prompt Arcade`,
      description: game.meta.description,
      images: absoluteImageUrl ? [absoluteImageUrl] : undefined,
    },
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

  const thumbnailSrc = typeof game.meta.thumbnail === "string"
    ? game.meta.thumbnail
    : game.meta.thumbnail.src ?? "";

  const absoluteImageUrl = thumbnailSrc
    ? (thumbnailSrc.startsWith("http") ? thumbnailSrc : `https://promptarcade.vercel.app${thumbnailSrc}`)
    : undefined;

  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": game.meta.name,
    "description": game.meta.description,
    "genre": game.meta.genre,
    "image": absoluteImageUrl,
    "url": `https://promptarcade.vercel.app/game/${slug}`,
    "playMode": "SinglePlayer",
    "applicationCategory": "Game",
    "operatingSystem": "Windows, macOS, Linux, Android, iOS",
    "author": {
      "@type": "Organization",
      "name": "Prompt Arcade",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <GamePageShell game={gameInfo}>
        <Game />
      </GamePageShell>
    </>
  );
}
