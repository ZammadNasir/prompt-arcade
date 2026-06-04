"use client";

import { useEffect, useState } from "react";

export default function BirdLauncherGame() {
  const [power, setPower] = useState(45);
  const [position, setPosition] = useState(0);
  const [flying, setFlying] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!flying) {
      return;
    }

    const timer = window.setInterval(() => {
      setPosition((value) => {
        const next = value + power / 12;
        if (next >= 100) {
          setFlying(false);
          setScore((current) => current + (power > 55 ? 3 : 1));
          return 0;
        }
        return next;
      });
    }, 80);

    return () => window.clearInterval(timer);
  }, [flying, power]);

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-50">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
        <span>Targets toppled {score}</span>
        <label className="flex items-center gap-3">
          Power
          <input
            type="range"
            min="20"
            max="80"
            value={power}
            onChange={(event) => setPower(Number(event.target.value))}
            className="accent-amber-500"
          />
        </label>
      </div>
      <div className="relative aspect-[16/7] overflow-hidden rounded-md bg-sky-950">
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-emerald-900" />
        <div
          className="absolute bottom-14 h-11 w-11 -translate-x-1/2 rounded-full bg-amber-400 text-center text-2xl leading-10 text-slate-950"
          style={{ left: `${8 + position * 0.78}%` }}
        >
          B
        </div>
        <div className="absolute bottom-12 right-12 grid grid-cols-2 gap-1">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-8 w-8 rounded-sm bg-red-500" />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlying(true)}
        disabled={flying}
        className="mt-4 w-full rounded-md bg-amber-500 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Launch
      </button>
    </div>
  );
}
