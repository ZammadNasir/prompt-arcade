"use client";

import { useState } from "react";

type Point = {
  x: number;
  y: number;
};

const startPlayer = { x: 0, y: 3 };
const startZombies = [
  { x: 5, y: 1 },
  { x: 6, y: 5 },
  { x: 4, y: 3 },
];

export default function ZombieEscapeGame() {
  const [player, setPlayer] = useState<Point>(startPlayer);
  const [zombies, setZombies] = useState<Point[]>(startZombies);
  const escaped = player.x === 7;
  const caught = zombies.some((zombie) => zombie.x === player.x && zombie.y === player.y);

  function move(dx: number, dy: number) {
    if (caught || escaped) {
      return;
    }

    const nextPlayer = {
      x: Math.max(0, Math.min(7, player.x + dx)),
      y: Math.max(0, Math.min(5, player.y + dy)),
    };
    setPlayer(nextPlayer);
    setZombies((current) =>
      current.map((zombie) => ({
        x: zombie.x + Math.sign(nextPlayer.x - zombie.x),
        y: zombie.y + Math.sign(nextPlayer.y - zombie.y),
      })),
    );
  }

  function reset() {
    setPlayer(startPlayer);
    setZombies(startZombies);
  }

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-50">
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <span>{caught ? "Caught" : escaped ? "Escaped" : "Reach the right edge"}</span>
        <button type="button" onClick={reset} className="text-amber-300">
          Reset
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1 rounded-md bg-slate-950 p-2">
        {Array.from({ length: 48 }, (_, index) => {
          const x = index % 8;
          const y = Math.floor(index / 8);
          const isPlayer = player.x === x && player.y === y;
          const isZombie = zombies.some((zombie) => zombie.x === x && zombie.y === y);
          const isExit = x === 7;

          return (
            <div
              key={index}
              className={`grid aspect-square place-items-center rounded-sm text-lg font-black ${
                isExit ? "bg-emerald-900" : "bg-slate-800"
              }`}
            >
              {isPlayer ? "P" : isZombie ? "Z" : ""}
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <span />
        <button type="button" onClick={() => move(0, -1)} className="rounded-md bg-slate-800 py-2 font-bold">
          Up
        </button>
        <span />
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
