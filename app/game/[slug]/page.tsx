import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { StatusBadge } from "@/components/status-badge";
import { getGameBySlug, listGameSlugs } from "@/lib/games";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return listGameSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);

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
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const Game = game.Game;
  const { meta } = game;

  return (
    <>
      <SiteNav />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 lg:px-8">
        <Link
          href="/"
          className="w-fit text-sm font-semibold text-amber-300 transition hover:text-amber-100"
        >
          Back to arcade
        </Link>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-start">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
            <Image
              src={meta.thumbnail}
              alt={`${meta.name} thumbnail`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <StatusBadge status={meta.status} />
              <h1 className="mt-4 text-4xl font-black tracking-normal text-slate-50">
                {meta.name}
              </h1>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                {meta.description}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Genre", meta.genre],
                ["Generated With", meta.generatedWith],
                ["Status", meta.status],
                ["Slug", meta.slug],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-4"
                >
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-slate-100">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 px-5 py-4">
            <h2 className="text-xl font-black text-slate-50">Play</h2>
          </div>
          <div className="bg-slate-950 p-4">
            <Game />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
            <h2 className="text-xl font-black text-slate-50">Known Issues</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {meta.knownIssues.map((issue) => (
                <li key={issue} className="rounded-md bg-slate-900 p-3">
                  {issue}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800 p-5">
            <h2 className="text-xl font-black text-slate-50">Prompt History</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {meta.prompts.map((prompt, index) => (
                <li key={prompt} className="rounded-md bg-slate-900 p-3">
                  <span className="mr-3 font-black text-amber-300">
                    {index + 1}.
                  </span>
                  {prompt}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </>
  );
}
