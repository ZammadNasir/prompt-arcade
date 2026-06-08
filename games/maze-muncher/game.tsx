"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  color: string;
  dir: Position;
  scared: boolean;
  eaten: boolean;
  speed: number;
}

const TILE_SIZE = 20;
const COLS = 19;
const ROWS = 22;
const GAME_WIDTH = COLS * TILE_SIZE;
const GAME_HEIGHT = ROWS * TILE_SIZE;

const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 3, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 3, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
];

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<
    "start" | "playing" | "paused" | "gameover" | "levelup"
  >("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);

  const playerRef = useRef<Position>({ x: 9, y: 15 });
  const playerDirRef = useRef<Position>({ x: 0, y: 0 });
  const nextDirRef = useRef<Position>({ x: 0, y: 0 });
  const mouthAngleRef = useRef(0);
  const mouthDirRef = useRef(1);

  const ghostsRef = useRef<Ghost[]>([
    {
      x: 9,
      y: 8,
      color: "#ff0000",
      dir: { x: -1, y: 0 },
      scared: false,
      eaten: false,
      speed: 1.3,
    },
    {
      x: 8,
      y: 9,
      color: "#ffb8ff",
      dir: { x: 0, y: -1 },
      scared: false,
      eaten: false,
      speed: 1.2,
    },
    {
      x: 9,
      y: 9,
      color: "#00ffff",
      dir: { x: 1, y: 0 },
      scared: false,
      eaten: false,
      speed: 1.25,
    },
    {
      x: 10,
      y: 9,
      color: "#ffb851",
      dir: { x: 0, y: 1 },
      scared: false,
      eaten: false,
      speed: 1.15,
    },
  ]);

  const pelletsRef = useRef<{ x: number; y: number; power: boolean }[]>([]);
  const scaredTimerRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const initPellets = useCallback(() => {
    const pellets: { x: number; y: number; power: boolean }[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAZE[y][x] === 2) pellets.push({ x, y, power: false });
        else if (MAZE[y][x] === 3) pellets.push({ x, y, power: true });
      }
    }
    pelletsRef.current = pellets;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("mazeMuncherHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const saveHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("mazeMuncherHighScore", newScore.toString());
    }
  };

  const resetLevel = useCallback(() => {
    playerRef.current = { x: 9, y: 15 };
    playerDirRef.current = { x: 0, y: 0 };
    nextDirRef.current = { x: 0, y: 0 };

    ghostsRef.current = [
      {
        x: 9,
        y: 8,
        color: "#ff0000",
        dir: { x: -1, y: 0 },
        scared: false,
        eaten: false,
        speed: 1.3 + (level - 1) * 0.1,
      },
      {
        x: 8,
        y: 9,
        color: "#ffb8ff",
        dir: { x: 0, y: -1 },
        scared: false,
        eaten: false,
        speed: 1.2 + (level - 1) * 0.1,
      },
      {
        x: 9,
        y: 9,
        color: "#00ffff",
        dir: { x: 1, y: 0 },
        scared: false,
        eaten: false,
        speed: 1.25 + (level - 1) * 0.1,
      },
      {
        x: 10,
        y: 9,
        color: "#ffb851",
        dir: { x: 0, y: 1 },
        scared: false,
        eaten: false,
        speed: 1.15 + (level - 1) * 0.1,
      },
    ];

    initPellets();
    scaredTimerRef.current = 0;
  }, [level, initPellets]);

  const startNewGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    resetLevel();
    setGameState("playing");
  };

  const checkWin = () => pelletsRef.current.length === 0;

  const movePlayer = () => {
    const player = playerRef.current;
    const dir = nextDirRef.current;

    // Try turning
    if (dir.x !== 0 || dir.y !== 0) {
      const testX = Math.floor(player.x + dir.x);
      const testY = Math.floor(player.y + dir.y);
      if (
        testX >= 0 &&
        testX < COLS &&
        testY >= 0 &&
        testY < ROWS &&
        MAZE[testY][testX] !== 1
      ) {
        playerDirRef.current = dir;
        nextDirRef.current = { x: 0, y: 0 };
      }
    }

    const currentDir = playerDirRef.current;
    if (currentDir.x === 0 && currentDir.y === 0) return;

    const speed = 0.28;
    let nextX = player.x + currentDir.x * speed;
    let nextY = player.y + currentDir.y * speed;

    const checkX = Math.floor(nextX + currentDir.x * 0.1);
    const checkY = Math.floor(nextY + currentDir.y * 0.1);

    if (
      checkX < 0 ||
      checkX >= COLS ||
      checkY < 0 ||
      checkY >= ROWS ||
      MAZE[checkY][checkX] === 1
    ) {
      player.x = Math.round(player.x);
      player.y = Math.round(player.y);
      return;
    }

    // Tunnel
    if (nextX < 0) nextX = COLS - 0.1;
    if (nextX >= COLS) nextX = 0.1;

    player.x = nextX;
    player.y = nextY;
  };

  const collectPellets = () => {
    const player = playerRef.current;
    for (let i = pelletsRef.current.length - 1; i >= 0; i--) {
      const p = pelletsRef.current[i];
      if (Math.abs(p.x - player.x) < 0.8 && Math.abs(p.y - player.y) < 0.8) {
        const points = p.power ? 50 : 10;
        setScore((prev) => {
          const ns = prev + points;
          saveHighScore(ns);
          return ns;
        });

        if (p.power) {
          scaredTimerRef.current = Date.now() + 8000;
          ghostsRef.current.forEach((g) => {
            if (!g.eaten) g.scared = true;
          });
        }
        pelletsRef.current.splice(i, 1);
      }
    }
  };

  const moveGhost = (ghost: Ghost) => {
    const step = ghost.speed * 0.072;
    const target = ghost.scared
      ? { x: Math.random() * COLS, y: Math.random() * ROWS }
      : ghost.eaten
        ? { x: 9, y: 8 }
        : { x: playerRef.current.x, y: playerRef.current.y };

    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    let bestDir = ghost.dir;
    let bestScore = Infinity;

    dirs.forEach((d) => {
      if (d.x === -ghost.dir.x && d.y === -ghost.dir.y) return; // no immediate reverse
      const nx = Math.floor(ghost.x + d.x * 0.7);
      const ny = Math.floor(ghost.y + d.y * 0.7);
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || MAZE[ny][nx] === 1)
        return;

      const dist = Math.pow(nx - target.x, 2) + Math.pow(ny - target.y, 2);
      if (dist < bestScore) {
        bestScore = dist;
        bestDir = d;
      }
    });

    ghost.dir = bestDir;
    ghost.x += bestDir.x * step;
    ghost.y += bestDir.y * step;

    // Gentle snap
    if (Math.random() < 0.2) {
      ghost.x = Math.round(ghost.x * 4) / 4;
      ghost.y = Math.round(ghost.y * 4) / 4;
    }
  };

  const checkCollisions = () => {
    const p = playerRef.current;
    for (const ghost of ghostsRef.current) {
      if (ghost.eaten) continue;
      const dx = p.x - ghost.x;
      const dy = p.y - ghost.y;
      if (dx * dx + dy * dy < 0.7) {
        if (ghost.scared) {
          ghost.eaten = true;
          setScore((prev) => {
            const ns = prev + 200;
            saveHighScore(ns);
            return ns;
          });
        } else {
          setLives((l) => {
            const nl = l - 1;
            if (nl <= 0) setGameState("gameover");
            else resetLevel();
            return nl;
          });
          return true;
        }
      }
    }
    return false;
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#000011";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Maze
    ctx.fillStyle = "#223388";
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAZE[y][x] === 1) {
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Pellets
    ctx.fillStyle = "#ffee44";
    pelletsRef.current.forEach((p) => {
      const px = p.x * TILE_SIZE + TILE_SIZE / 2;
      const py = p.y * TILE_SIZE + TILE_SIZE / 2;
      ctx.beginPath();
      ctx.arc(px, py, p.power ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player
    const player = playerRef.current;
    const px = player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = player.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(px, py);
    let rot = 0;
    if (playerDirRef.current.x === 1) rot = 0;
    else if (playerDirRef.current.x === -1) rot = Math.PI;
    else if (playerDirRef.current.y === -1) rot = -Math.PI / 2;
    else if (playerDirRef.current.y === 1) rot = Math.PI / 2;
    ctx.rotate(rot);

    ctx.fillStyle = "#ffeb3b";
    const mouth = mouthAngleRef.current;
    ctx.beginPath();
    ctx.arc(0, 0, TILE_SIZE * 0.45, mouth, Math.PI * 2 - mouth);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();

    // Ghosts
    ghostsRef.current.forEach((ghost) => {
      const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
      const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;
      let color = ghost.color;
      if (ghost.eaten) color = "#8888ff";
      else if (ghost.scared) color = "#5555ff";

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(gx, gy, TILE_SIZE * 0.42, Math.PI, 0);
      ctx.lineTo(gx + TILE_SIZE * 0.42, gy + TILE_SIZE * 0.3);
      ctx.lineTo(gx + TILE_SIZE * 0.2, gy + TILE_SIZE * 0.38);
      ctx.lineTo(gx, gy + TILE_SIZE * 0.3);
      ctx.lineTo(gx - TILE_SIZE * 0.2, gy + TILE_SIZE * 0.38);
      ctx.lineTo(gx - TILE_SIZE * 0.42, gy + TILE_SIZE * 0.3);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(gx - 7, gy - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx + 7, gy - 6, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      const ox = ghost.dir.x * 2.5;
      ctx.beginPath();
      ctx.arc(gx - 7 + ox, gy - 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gx + 7 + ox, gy - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    movePlayer();
    collectPellets();
    if (checkCollisions()) return;

    if (Date.now() > scaredTimerRef.current) {
      ghostsRef.current.forEach((g) => (g.scared = false));
    }

    ghostsRef.current.forEach((g) => moveGhost(g));

    // Mouth animation
    mouthAngleRef.current += 0.22 * mouthDirRef.current;
    if (mouthAngleRef.current > 0.75) mouthDirRef.current = -1;
    if (mouthAngleRef.current < 0.08) mouthDirRef.current = 1;

    draw(ctx);

    if (checkWin()) {
      setLevel((l) => l + 1);
      setGameState("levelup");
      setTimeout(() => {
        resetLevel();
        setGameState("playing");
      }, 1400);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, draw, resetLevel]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      let dir: Position | null = null;
      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          dir = { x: 0, y: -1 };
          break;
        case "arrowdown":
        case "s":
          dir = { x: 0, y: 1 };
          break;
        case "arrowleft":
        case "a":
          dir = { x: -1, y: 0 };
          break;
        case "arrowright":
        case "d":
          dir = { x: 1, y: 0 };
          break;
        case "p":
          setGameState((s) =>
            s === "playing" ? "paused" : s === "paused" ? "playing" : s,
          );
          return;
        case "r":
          if (gameState === "gameover" || gameState === "start") startNewGame();
          return;
      }
      if (dir) nextDirRef.current = dir;
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing") {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    initPellets();
  }, [initPellets]);

  // UI rendering (same as before)
  const renderUI = () => {
    /* ... same as previous version ... */
    // (kept identical for brevity)
    if (gameState === "start") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center text-white">
            <div className="text-6xl font-bold mb-6 text-yellow-400 tracking-widest">
              MAZE MUNCHER
            </div>
            <div className="text-xl mb-8">Classic Arcade Action</div>
            <button
              onClick={startNewGame}
              className="px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-2xl rounded-lg transition-all active:scale-95"
            >
              START GAME
            </button>
            <div className="mt-10 text-sm opacity-70">
              ARROW KEYS or WASD • P to pause
            </div>
          </div>
        </div>
      );
    }
    // ... (gameover, levelup, paused screens same as before)
    if (gameState === "gameover") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center text-white">
            <div className="text-6xl font-bold mb-4 text-red-500">
              GAME OVER
            </div>
            <div className="text-3xl mb-8">Final Score: {score}</div>
            <button
              onClick={startNewGame}
              className="px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold text-xl rounded"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      );
    }
    if (gameState === "levelup") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 pointer-events-none">
          <div className="text-5xl font-bold text-white animate-pulse">
            LEVEL {level} COMPLETE!
          </div>
        </div>
      );
    }
    if (gameState === "paused") {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="text-center text-white">
            <div className="text-5xl font-bold mb-6">PAUSED</div>
            <div className="text-xl">Press P to resume</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center overflow-hidden">
      <div className="relative">
        <div className="flex justify-between text-white mb-3 px-2 text-lg font-mono">
          <div>
            SCORE:{" "}
            <span className="text-yellow-400">
              {score.toString().padStart(6, "0")}
            </span>
          </div>
          <div>
            LEVEL: <span className="text-cyan-400">{level}</span>
          </div>
          <div>
            HIGH:{" "}
            <span className="text-yellow-400">
              {highScore.toString().padStart(6, "0")}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: lives }).map((_, i) => (
              <span key={i} className="text-yellow-400">
                ●
              </span>
            ))}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="border-4 border-cyan-400 shadow-2xl rounded"
          style={{ imageRendering: "pixelated" }}
        />

        {renderUI()}

        <div className="text-center text-zinc-500 text-sm mt-4 font-mono">
          ARROWS / WASD MOVE • EAT ALL DOTS • POWER PELLETS MAKE GHOSTS
          VULNERABLE
        </div>
      </div>
    </div>
  );
};

export default Game;
