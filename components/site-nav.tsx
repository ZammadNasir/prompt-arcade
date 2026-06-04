import Link from "next/link";

export function SiteNav() {
  return (
    <header className="border-b border-slate-700 bg-slate-900/75">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-amber-500 text-xl font-black text-slate-950">
            PA
          </span>
          <span>
            <span className="block text-xl font-black text-slate-50">
              Prompt Arcade
            </span>
            <span className="text-sm text-slate-400">
              Play AI-generated browser games.
            </span>
          </span>
        </Link>
        <a
          href="#contribute"
          className="text-sm font-semibold text-amber-300 transition hover:text-amber-100"
        >
          Contribute a Game
        </a>
      </div>
    </header>
  );
}
