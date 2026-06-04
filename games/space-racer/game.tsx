"use client";

import { useEffect, useState } from "react";

const lanes = ["left-[18%]", "left-1/2", "left-[82%]"];

export default function SpaceRacerGame() {
  const [lane, setLane] = useState(1);
  const [obstacleLane, setObstacleLane] = useState(0);
  const [obstacleY, setObstacleY] = useState(0);
  const [score, setScore] = useState(0);
  const [crashed, setCrashed] = useState(false);

  useEffect(() => {
    if (crashed) {
      return;
    }

    const timer = window.setInterval(() => {
      setObstacleY((value) => {
        const next = value + 8;
        if (next > 94) {
          setObstacleLane(Math.floor(Math.random() * 3));
          setScore((current) => current + 1);
          return 0;
        }
        if (next > 72 && obstacleLane === lane) {
          setCrashed(true);
        }
        return next;
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [crashed, lane, obstacleLane]);

  function reset() {
    setLane(1);
    setObstacleLane(Math.floor(Math.random() * 3));
    setObstacleY(0);
    setScore(0);
    setCrashed(false);
  }

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-50">
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <span>Distance {score}</span>
        <button type="button" onClick={reset} className="text-amber-300">
          Restart
        </button>
      </div>
      <div className="relative aspect-[9/12] overflow-hidden rounded-md bg-slate-950">
        <div className="absolute inset-y-0 left-1/3 border-l border-dashed border-slate-700" />
        <div className="absolute inset-y-0 left-2/3 border-l border-dashed border-slate-700" />
        <div
          className={`absolute h-12 w-12 -translate-x-1/2 rounded-full bg-red-500 ${lanes[obstacleLane]}`}
          style={{ top: `${obstacleY}%` }}
        />
        <div
          className={`absolute bottom-5 h-12 w-12 -translate-x-1/2 rounded-t-full bg-amber-400 ${lanes[lane]}`}
        />
        {crashed ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/80 text-center">
            <div>
              <p className="text-2xl font-black text-red-300">Crashed</p>
              <p className="mt-2 text-sm text-slate-300">Press restart.</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setLane((value) => Math.max(0, value - 1))}
          className="rounded-md bg-slate-800 py-3 font-bold"
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => setLane((value) => Math.min(2, value + 1))}
          className="rounded-md bg-slate-800 py-3 font-bold"
        >
          Right
        </button>
      </div>
    </div>
  );
}
