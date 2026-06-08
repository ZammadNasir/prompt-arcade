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

type GameProps = {
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

function MetaSection({ game }: { game: Omit<GameMeta, "thumbnail"> }) {
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-5 px-5 py-10 lg:px-8">
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
          {(game.controls ?? ["Use the controls shown inside the game."])?.map(
            (control) => (
              <li key={control}>{control}</li>
            ),
          )}
        </ul>
      </InfoPanel>

      <InfoPanel title="Prompt History">
        <ol className="space-y-3">
          {game.prompts?.map((prompt, index) => (
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
          {game.knownIssues?.map((issue) => (
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
  );
}

// Card layout: for puzzle games, board games, grid games, text games.
// Content is centered with a max width. Vertical scrolling is allowed.
// No fullscreen or immersive mode — controls are always visible.
function CardLayout({ game, children }: GameProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 p-3 sm:p-4">
        <Link
          href="/"
          className="rounded-md border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-100 backdrop-blur transition hover:border-amber-400 hover:text-amber-200 active:scale-95"
        >
          ← Back to Arcade
        </Link>

        <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
          {game.genre}
        </span>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-8">{children}</div>

      <MetaSection game={game} />
    </main>
  );
}

// Immersive layout: for platformers, shooters, racing games, physics games, canvas games.
// Occupies the full available viewport. Supports fullscreen mode via the F key.
// A play overlay is shown initially so the user opts in before input is captured.
function ImmersiveLayout({ game, children }: GameProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void revealControls;

  const exitImmersion = useCallback(async () => {
    setImmersive(false);
    setControlsVisible(true);
    setShowPlayOverlay(false);

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  const enterImmersion = useCallback(async () => {
    setImmersive(true);
    setControlsVisible(true);
    setShowPlayOverlay(false);

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

      // Avoid calling revealControls() directly during effects.
      // User-driven events are fine; this is already an event handler.
      if (isImmersive) {
        setControlsVisible(true);
        clearHideTimer();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImmersive, clearHideTimer, toggleImmersion]);

  useEffect(() => {
    document.body.style.overflow = isImmersive ? "hidden" : "";

    // No react state updates inside this effect body.
    // Only external side-effect (DOM style) + cleanup.
    return () => {
      document.body.style.overflow = "";
      clearHideTimer();
    };
  }, [clearHideTimer, isImmersive]);

  function handleActivity() {
    if (isImmersive) {
      // Event-driven; avoid revealControls() to satisfy react-hooks rule.
      setControlsVisible(true);
      clearHideTimer();
    }
  }

  return (
    <main
      className={cn(
        "min-h-screen bg-slate-950 text-slate-50",
        isImmersive && "overflow-hidden",
      )}
      onMouseMove={handleActivity}
      onKeyDown={handleActivity}
    >
      <section
        ref={stageRef}
        className={cn(
          "relative isolate flex flex-col w-full bg-slate-950",
          isImmersive ? "fixed inset-0 z-50" : "min-h-screen",
        )}
        aria-label={`${game.name} gameplay`}
      >
        {/* Play Overlay */}
        {showPlayOverlay && !isImmersive && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950/95 backdrop-blur-sm"
            onClick={() => {
              void enterImmersion();
            }}
          >
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="mb-2 text-5xl font-black tracking-tight text-slate-50">
                {game.name}
              </h2>

              <p className="mb-8 max-w-md text-lg text-slate-300">
                {game.description}
              </p>

              <div className="mb-8 flex justify-center gap-2">
                <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-4 py-1 text-sm font-semibold text-amber-300">
                  {game.genre}
                </span>

                <StatusBadge status={game.status} />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void enterImmersion();
                }}
                className="mb-6 rounded-lg border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 px-12 py-4 text-xl font-black uppercase tracking-wider text-slate-950 shadow-2xl shadow-amber-500/40 transition-all hover:scale-105 hover:shadow-amber-500/60 active:scale-95"
              >
                ▶ Play Now
              </button>

              <p className="mt-8 text-sm text-slate-400">
                Or press <span className="font-bold text-amber-300">F</span> for
                fullscreen
              </p>
            </div>
          </div>
        )}

        {/* Top Controls */}
        {!fullscreenActive && (
          <div
            className={cn(
              "z-50 flex items-center justify-between gap-3 p-3 sm:p-4 transition-all duration-300",
              isImmersive
                ? "absolute left-0 right-0 top-0 bg-gradient-to-b from-slate-950/90 to-transparent backdrop-blur-sm"
                : "border-b border-slate-800/60",
              isImmersive &&
              !controlsVisible &&
              "pointer-events-none opacity-0",
            )}
          >
            <Link
              href="/"
              className="rounded-md border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-100 backdrop-blur transition hover:border-amber-400 hover:text-amber-200 active:scale-95"
            >
              ← Back to Arcade
            </Link>

            <button
              type="button"
              onClick={() => void toggleImmersion()}
              className="rounded-md border border-amber-400/70 bg-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-lg shadow-slate-950/30 transition hover:bg-amber-300 active:scale-95"
            >
              {isImmersive ? "Exit" : "▶ Play"}
            </button>
          </div>
        )}

        {/* Game Stage: fills remaining flex space, no scroll in immersive mode */}
        <div
          className={cn(
            "relative flex-1 min-h-0 w-full",
            isImmersive ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          {children}
        </div>

        {/* Bottom Hint */}
        {!fullscreenActive && (
          <div
            className={cn(
              "pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-md bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-300 backdrop-blur transition-opacity duration-300",
              isImmersive && !controlsVisible && "opacity-0",
            )}
          >
            {isImmersive
              ? "Press F to exit fullscreen"
              : "Press F for fullscreen"}
          </div>
        )}
      </section>

      <div className={cn(isImmersive && "hidden")}>
        <MetaSection game={game} />
      </div>
    </main>
  );
}

export function GamePageShell({ game, children }: GameProps) {
  const layout = game.layout ?? "card";

  if (layout === "immersive") {
    return <ImmersiveLayout game={game}>{children}</ImmersiveLayout>;
  }

  return <CardLayout game={game}>{children}</CardLayout>;
}
