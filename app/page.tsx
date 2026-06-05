import { GameFilters } from "@/components/game-filters";
import { SiteNav } from "@/components/site-nav";
import { listGameCards } from "@/lib/games";

export default async function Home() {
  const games = await listGameCards();

  return (
    <>
      <SiteNav />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-8 lg:px-8">
        <section className="grid gap-5 border-b border-slate-700 pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-300">
              Open-source AI game shelf
            </p>
            <h1 className="text-4xl font-black tracking-normal text-slate-50 sm:text-5xl">
              Prompt Arcade
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              A fast, static-first arcade and museum for browser games generated
              from AI prompts. Some are polished, some are strange, all are
              playable artifacts.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-4">
            <span className="block text-3xl font-black text-amber-300">
              {games.length}
            </span>
            <span className="text-sm font-semibold text-slate-300">
              Games on the floor
            </span>
          </div>
        </section>

        <GameFilters games={games} />

        <section
          id="contribute"
          className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-6"
        >
          <div className="grid gap-5 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-50">
                Contribute a Game
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Add your AI-generated game without touching routes or app logic.
              </p>
            </div>
            <ol className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Generate a browser game with AI.",
                "Add it to the games folder.",
                "Add metadata.",
                "Open a pull request.",
              ].map((step, index) => (
                <li
                  key={step}
                  className="rounded-md border border-slate-700 bg-slate-900 p-4"
                >
                  <span className="mb-3 block text-xs font-black text-amber-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </>
  );
}
