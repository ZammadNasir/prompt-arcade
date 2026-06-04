"use client";

import { useEffect, useState } from "react";

type Target = {
  id: number;
  x: number;
  y: number;
};

export default function CallOfWarsGame() {
  const [ammo, setAmmo] = useState(6);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [targets, setTargets] = useState<Target[]>([
    { id: 1, x: 18, y: 35 },
    { id: 2, x: 62, y: 24 },
    { id: 3, x: 78, y: 58 },
  ]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTargets((current) =>
        current.map((target) => ({
          ...target,
          x: Math.max(6, Math.min(88, target.x + (Math.random() - 0.5) * 12)),
          y: Math.max(12, Math.min(74, target.y + (Math.random() - 0.5) * 10)),
        })),
      );
    }, 700);

    return () => window.clearInterval(timer);
  }, []);

  function shoot(id: number) {
    if (ammo <= 0) {
      return;
    }

    setAmmo((value) => value - 1);
    setScore((value) => value + 100);
    setTargets((current) => {
      const remaining = current.filter((target) => target.id !== id);

      if (remaining.length > 0) {
        return remaining;
      }

      setWave((value) => value + 1);
      setAmmo(6);
      return Array.from({ length: Math.min(6, wave + 3) }, (_, index) => ({
        id: Date.now() + index,
        x: 10 + Math.random() * 78,
        y: 16 + Math.random() * 62,
      }));
    });
  }

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-slate-700 bg-slate-900 text-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-4 py-3 text-sm font-bold">
        <span>Score {score}</span>
        <span>Wave {wave}</span>
        <button
          type="button"
          onClick={() => setAmmo(6)}
          className="rounded-md bg-amber-500 px-3 py-1 text-slate-950"
        >
          Reload {ammo}/6
        </button>
      </div>
      <div className="relative aspect-[16/9] bg-[radial-gradient(circle_at_center,#334155,#0f172a_62%)]">
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300" />
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            onClick={() => shoot(target.id)}
            className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-red-300 bg-red-500 font-black text-white transition hover:scale-110"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            aria-label="Shoot target"
          >
            X
          </button>
        ))}
      </div>
    </div>
  );
}
