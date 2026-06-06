"use client";

import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { StatusBadge } from "@/components/status-badge";
import type { GameMeta } from "@/lib/game-types";
import { cn } from "@/lib/utils";

type GamePageShellProps = {
  game: Omit<GameMeta, "thumbnail">;
  children: ReactNode;
};

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-lg border border-slate-700 bg-slate-900">
      <summary className="cursor-pointer select-none px-5 py-4 text-sm font-black uppercase tracking-wide text-slate-100 marker:text-amber-300">
        {title}
      </summary>
      <div className="border-t border-slate-700 px-5 py-4 text-sm leading-7 text-slate-300">
        {children}
      </div>
    </details>
  );
}

export function GamePageShell({ game, children }: GamePageShellProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const isImmersive = immersive || fullscreenActive;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearHideTimer();

    if (isImmersive) {
      hideTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [clearHideTimer, isImmersive]);

  const exitImmersion = useCallback(async () => {
    setImmersive(false);
    setControlsVisible(true);

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  const enterImmersion = useCallback(async () => {
    setImmersive(true);
    setControlsVisible(true);

    try {
      await stageRef.current?.requestFullscreen();
    } catch {
      setFullscreenActive(false);
    }
  }, []);

  const toggleImmersion = useCallback(async () => {
    if (isImmersive) {
      await exitImmersion();
      return;
    }

    await enterImmersion();
  }, [enterImmersion, exitImmersion, isImmersive]);

  useEffect(() => {
    function handleFullscreenChange() {
      const isFullscreen = document.fullscreenElement === stageRef.current;
      setFullscreenActive(isFullscreen);

      if (!isFullscreen) {
        setImmersive(false);
        setControlsVisible(true);
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleImmersion();
        return;
      }

      if (isImmersive) {
        revealControls();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImmersive, revealControls, toggleImmersion]);

  useEffect(() => {
    document.body.style.overflow = isImmersive ? "hidden" : "";
    revealControls();

    return () => {
      document.body.style.overflow = "";
      clearHideTimer();
    };
  }, [clearHideTimer, isImmersive, revealControls]);

  function handleActivity() {
    if (isImmersive) {
      revealControls();
    }
  }

  return (
    <main
      className={cn("min-h-screen bg-slate-950 text-slate-50", isImmersive && "overflow-hidden")}
      onMouseMove={handleActivity}
      onKeyDown={handleActivity}
    >
      <section
        ref={stageRef}
        className={cn(
          "relative isolate flex h-screen min-h-screen w-full overflow-hidden bg-slate-950",
          isImmersive && "fixed inset-0 z-50 h-screen w-screen",
        )}
        aria-label={`${game.name} gameplay`}
      >
        <div
          className={cn(
            "absolute left-3 right-3 top-3 z-20 flex items-center justify-between gap-3 transition-opacity duration-300 sm:left-5 sm:right-5 sm:top-5",
            isImmersive && !controlsVisible && "pointer-events-none opacity-0",
          )}
        >
          <Link
            href="/"
            className="rounded-md border border-slate-600 bg-slate-950/70 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-100 backdrop-blur transition hover:border-amber-400 hover:text-amber-200"
          >
            Back to Arcade
          </Link>
          <button
            type="button"
            onClick={() => void toggleImmersion()}
            className="rounded-md border border-amber-400/70 bg-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-slate-950/30 transition hover:bg-amber-300"
          >
            {isImmersive ? "Exit" : "Play"}
          </button>
        </div>

        <div className="game-stage-content flex h-full w-full items-stretch justify-stretch">
          {children}
        </div>

        <div
          className={cn(
            "pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-md bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-300 backdrop-blur transition-opacity duration-300",
            isImmersive && !controlsVisible && "opacity-0",
          )}
        >
          Press F for fullscreen
        </div>
      </section>

      <section
        className={cn(
          "mx-auto grid w-full max-w-5xl gap-5 px-5 py-10 lg:px-8",
          isImmersive && "hidden",
        )}
      >
        <div className="space-y-4">
          <StatusBadge status={game.status} />
          <h1 className="text-4xl font-black tracking-normal text-slate-50">
            {game.name}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            {game.description}
          </p>
        </div>

        <InfoPanel title="Controls">
          <ul className="space-y-2">
            {(game.controls ?? [
              "Use the controls shown inside the game.",
              "Press F to toggle fullscreen immersion mode.",
              "Press Escape to exit native fullscreen.",
            ]).map((control) => (
              <li key={control}>{control}</li>
            ))}
          </ul>
        </InfoPanel>

        <InfoPanel title="Prompt History">
          <ol className="space-y-3">
            {game.prompts.map((prompt, index) => (
              <li key={prompt}>
                <span className="mr-3 font-black text-amber-300">
                  {index + 1}.
                </span>
                {prompt}
              </li>
            ))}
          </ol>
        </InfoPanel>

        <InfoPanel title="Known Issues">
          <ul className="space-y-2">
            {game.knownIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </InfoPanel>

        <InfoPanel title="Metadata">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Genre", game.genre],
              ["Generated With", game.generatedWith],
              ["Status", game.status],
              ["Slug", game.slug],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 font-semibold text-slate-100">{value}</dd>
              </div>
            ))}
          </dl>
        </InfoPanel>
      </section>
    </main>
  );
}
