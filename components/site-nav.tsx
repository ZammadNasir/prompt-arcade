import Image from "next/image";
import Link from "next/link";
import Logo from "../public/assets/logo.jpg";
import Github from "../public/assets/github.svg";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-4 transition">
          <Image
            src={Logo}
            alt="Prompt Arcade"
            priority
            className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
          />

          <div className="leading-tight">
            <span className="block text-2xl font-extrabold tracking-tight text-white">
              Prompt Arcade
            </span>

            <p className="text-sm text-slate-400">
              Play AI-generated browser games
            </p>
          </div>
        </Link>

        <a
          href="https://github.com/ZammadNasir/prompt-arcade"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition-all hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200"
        >
          <Image
            src={Github}
            alt="GitHub Repository"
            priority
            style={{
              filter: "invert(1) brightness(1.3)",
              color: "transparent",
            }}
            className="h-4 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          Contribute a Game
        </a>
      </div>
    </header>
  );
}
