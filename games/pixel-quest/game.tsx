"use client";

import { useState } from "react";

const gems = [
  { x: 2, y: 1 },
  { x: 4, y: 3 },
  { x: 1, y: 4 },
];

export default function PixelQuestGame() {
  const [hero, setHero] = useState({ x: 0, y: 0 });
  const [collected, setCollected] = useState<string[]>([]);
  const [moves, setMoves] = useState(18);

  function move(dx: number, dy: number) {
    if (moves <= 0 || collected.length === gems.length) {
      return;
    }

    const next = {
      x: Math.max(0, Math.min(5, hero.x + dx)),
      y: Math.max(0, Math.min(5, hero.y + dy)),
    };
    setHero(next);
    setMoves((value) => value - 1);

    const gemKey = `${next.x}-${next.y}`;
    if (gems.some((gem) => `${gem.x}-${gem.y}` === gemKey)) {
      setCollected((current) =>
        current.includes(gemKey) ? current : [...current, gemKey],
      );
    }
  }

  function reset() {
    setHero({ x: 0, y: 0 });
    setCollected([]);
    setMoves(18);
  }

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-50">
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <span>
          Gems {collected.length}/{gems.length} - Moves {moves}
        </span>
        <button type="button" onClick={reset} className="text-amber-300">
          Reset
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1 rounded-md bg-slate-950 p-2">
        {Array.from({ length: 36 }, (_, index) => {
          const x = index % 6;
          const y = Math.floor(index / 6);
          const key = `${x}-${y}`;
          const hasGem = gems.some((gem) => `${gem.x}-${gem.y}` === key);

          return (
            <div
              key={key}
              className="grid aspect-square place-items-center rounded-sm bg-slate-800 text-lg font-black"
            >
              {hero.x === x && hero.y === y
                ? "H"
                : hasGem && !collected.includes(key)
                  ? "*"
                  : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <button type="button" onClick={() => move(0, -1)} className="rounded-md bg-slate-800 py-2 font-bold">
          Up
        </button>
        <button type="button" onClick={() => move(-1, 0)} className="rounded-md bg-slate-800 py-2 font-bold">
          Left
        </button>
        <button type="button" onClick={() => move(0, 1)} className="rounded-md bg-slate-800 py-2 font-bold">
          Down
        </button>
        <button type="button" onClick={() => move(1, 0)} className="rounded-md bg-slate-800 py-2 font-bold">
          Right
        </button>
      </div>
    </div>
  );
}
