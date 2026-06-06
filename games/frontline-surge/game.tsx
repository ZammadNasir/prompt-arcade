"use client";

import React, { useEffect, useRef, useState } from "react";

// --- GAME CONFIG & CONSTANTS ---
const MAP_WIDTH = 16;
const MAP_HEIGHT = 16;
const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const SPAWN_POINTS = [
  { x: 1.5, y: 1.5 },
  { x: 14.5, y: 1.5 },
  { x: 1.5, y: 14.5 },
  { x: 14.5, y: 14.5 },
  { x: 8.5, y: 1.5 },
  { x: 8.5, y: 14.5 },
];

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  flashTicks: number;
  isDead: boolean;
}

export default function FrontlineSurge() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game States
  const [gameState, setGameState] = useState<
    "START" | "PLAYING" | "INTERMISSION" | "GAMEOVER"
  >("START");
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo] = useState(30);
  const [isReloading, setIsReloading] = useState(false);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(0);
  const [intermissionCount, setIntermissionCount] = useState(3);
  const [pointerLocked, setPointerLocked] = useState(false);

  // High-frequency engine variables
  const playerRef = useRef({
    x: 8.5,
    y: 8.5,
    dirX: 0,
    dirY: -1,
    planeX: 0.66,
    planeY: 0,
    angle: -Math.PI / 2,
    speedBoost: 1,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const enemiesRef = useRef<Enemy[]>([]);
  const nextEnemyId = useRef(0);
  const lastShotTime = useRef(0);
  const isShootingRef = useRef(false);
  const muzzleFlashRef = useRef(0);

  // Monitor canvas pointer lock state alterations
  useEffect(() => {
    const handleLockChange = () => {
      if (document.pointerLockElement === canvasRef.current) {
        setPointerLocked(true);
      } else {
        setPointerLocked(false);
      }
    };
    document.addEventListener("pointerlockchange", handleLockChange);
    return () =>
      document.removeEventListener("pointerlockchange", handleLockChange);
  }, []);

  const lockPointer = () => {
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const startGame = () => {
    setHealth(100);
    setAmmo(30);
    setWave(1);
    setScore(0);
    setIsReloading(false);
    playerRef.current = {
      x: 8.5,
      y: 8.5,
      dirX: 0,
      dirY: -1,
      planeX: 0.66,
      planeY: 0,
      angle: -Math.PI / 2,
      speedBoost: 1,
    };
    enemiesRef.current = [];

    generateWave(1);
    setGameState("PLAYING");

    // Request pointer lock inside the synchronous call stack layer of user interaction
    setTimeout(() => {
      lockPointer();
    }, 50);
  };

  const generateWave = (waveNum: number) => {
    const enemyCount = 3 + waveNum * 2;
    const baseHealth = 40 + waveNum * 10;
    const baseSpeed = 0.02 + Math.min(waveNum * 0.005, 0.025);

    const newEnemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const spawn =
        SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
      const scatterX = (Math.random() - 0.5) * 0.4;
      const scatterY = (Math.random() - 0.5) * 0.4;

      newEnemies.push({
        id: nextEnemyId.current++,
        x: spawn.x + scatterX,
        y: spawn.y + scatterY,
        health: baseHealth,
        maxHealth: baseHealth,
        speed: baseSpeed,
        flashTicks: 0,
        isDead: false,
      });
    }
    enemiesRef.current = newEnemies;
    setEnemiesRemaining(newEnemies.length);
  };

  const startIntermission = (nextWave: number) => {
    setGameState("INTERMISSION");
    setIntermissionCount(3);
    setHealth((prev) => Math.min(100, prev + 35));
    setAmmo(maxAmmo);

    const timer = setInterval(() => {
      setIntermissionCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setWave(nextWave);
          generateWave(nextWave);
          setGameState("PLAYING");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const reloadWeapon = () => {
    if (ammo === maxAmmo || isReloading) return;
    setIsReloading(true);
    setTimeout(() => {
      setAmmo(maxAmmo);
      setIsReloading(false);
    }, 1200);
  };

  // Bind Global Keyboard and Mouse Listeners Safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "PLAYING") return;
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      if (key === "r") {
        reloadWeapon();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (
        gameState !== "PLAYING" ||
        document.pointerLockElement !== canvasRef.current
      )
        return;

      const player = playerRef.current;
      const sensitivity = 0.0025;
      player.angle += e.movementX * sensitivity;

      player.dirX = Math.cos(player.angle);
      player.dirY = Math.sin(player.angle);
      player.planeX = -Math.sin(player.angle) * 0.66;
      player.planeY = Math.cos(player.angle) * 0.66;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameState !== "PLAYING") return; // Ignore locks during menu views

      if (document.pointerLockElement !== canvasRef.current) {
        lockPointer();
        return;
      }
      if (e.button === 0) {
        isShootingRef.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isShootingRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [ammo, isReloading, gameState]);

  // Main Simulation Loop
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (gameState === "PLAYING") {
        updatePlayerMovement();
        updateEnemies();
        handleWeaponFiring();
      }
      renderFrame();
      animationFrameId = requestAnimationFrame(tick);
    };

    const updatePlayerMovement = () => {
      const player = playerRef.current;
      let moveSpeed = keysRef.current["shift"] ? 0.08 : 0.05;
      let moveX = 0;
      let moveY = 0;

      if (keysRef.current["w"] || keysRef.current["arrowup"]) {
        moveX += player.dirX * moveSpeed;
        moveY += player.dirY * moveSpeed;
      }
      if (keysRef.current["s"] || keysRef.current["arrowdown"]) {
        moveX -= player.dirX * moveSpeed;
        moveY -= player.dirY * moveSpeed;
      }
      if (keysRef.current["a"]) {
        moveX += player.dirY * moveSpeed;
        moveY -= player.dirX * moveSpeed;
      }
      if (keysRef.current["d"]) {
        moveX -= player.dirY * moveSpeed;
        moveY += player.dirX * moveSpeed;
      }

      const buffer = 0.2;
      const checkX = player.x + moveX + (moveX > 0 ? buffer : -buffer);
      if (MAP[Math.floor(player.y)][Math.floor(checkX)] === 0) {
        player.x += moveX;
      }
      const checkY = player.y + moveY + (moveY > 0 ? buffer : -buffer);
      if (MAP[Math.floor(checkY)][Math.floor(player.x)] === 0) {
        player.y += moveY;
      }
    };

    const updateEnemies = () => {
      const player = playerRef.current;
      const aliveEnemies = enemiesRef.current.filter((e) => !e.isDead);

      aliveEnemies.forEach((enemy) => {
        if (enemy.flashTicks > 0) enemy.flashTicks--;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.25) {
          const stepX = (dx / dist) * enemy.speed;
          const stepY = (dy / dist) * enemy.speed;

          if (MAP[Math.floor(enemy.y)][Math.floor(enemy.x + stepX)] === 0)
            enemy.x += stepX;
          if (MAP[Math.floor(enemy.y + stepY)][Math.floor(enemy.x)] === 0)
            enemy.y += stepY;
        } else {
          setHealth((prev) => {
            const nextHealth = prev - 0.5;
            if (nextHealth <= 0) {
              setGameState("GAMEOVER");
              try {
                document.exitPointerLock();
              } catch (e) {}
              return 0;
            }
            return nextHealth;
          });
        }
      });
    };

    const handleWeaponFiring = () => {
      if (muzzleFlashRef.current > 0) muzzleFlashRef.current--;
      if (!isShootingRef.current || isReloading || ammo <= 0) return;

      const now = performance.now();
      if (now - lastShotTime.current < 120) return;
      lastShotTime.current = now;

      setAmmo((prev) => {
        const next = prev - 1;
        if (next === 0) setTimeout(() => reloadWeapon(), 100);
        return next;
      });

      muzzleFlashRef.current = 3;

      const player = playerRef.current;
      let closestEnemy: Enemy | null = null;
      let closestDistance = Infinity;

      enemiesRef.current.forEach((enemy) => {
        if (enemy.isDead) return;

        const vecX = enemy.x - player.x;
        const vecY = enemy.y - player.y;

        const invDet =
          1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        const transformX = invDet * (player.dirY * vecX - player.dirX * vecY);
        const transformY =
          invDet * (-player.planeY * vecX + player.planeX * vecY);

        if (transformY > 0) {
          const enemyScreenX = Math.floor(
            (canvasRef.current!.width / 2) * (1 + transformX / transformY),
          );
          const screenTolerance = Math.max(30, 160 / transformY);

          if (
            Math.abs(enemyScreenX - canvasRef.current!.width / 2) <
            screenTolerance
          ) {
            if (transformY < closestDistance) {
              if (clearLineOfSight(player.x, player.y, enemy.x, enemy.y)) {
                closestDistance = transformY;
                closestEnemy = enemy;
              }
            }
          }
        }
      });

      if (closestEnemy) {
        const enemy = closestEnemy as Enemy;
        enemy.health -= 25;
        enemy.flashTicks = 4;
        if (enemy.health <= 0) {
          enemy.isDead = true;
          setScore((prev) => prev + 100);

          const activeCount = enemiesRef.current.filter(
            (e) => !e.isDead,
          ).length;
          setEnemiesRemaining(activeCount);

          if (activeCount === 0) {
            startIntermission(wave + 1);
          }
        }
      }
    };

    const clearLineOfSight = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) => {
      const distance = Math.hypot(x2 - x1, y2 - y1);
      if (distance === 0) return true;
      const steps = Math.ceil(distance * 3);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        if (MAP[Math.floor(cy)][Math.floor(cx)] === 1) return false;
      }
      return true;
    };

    const renderFrame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;
      const player = playerRef.current;

      // Draw Ceiling & Floor
      ctx.fillStyle = "#11141a";
      ctx.fillRect(0, 0, w, h / 2);
      ctx.fillStyle = "#1e222b";
      ctx.fillRect(0, h / 2, w, h / 2);

      const zBuffer: number[] = new Array(w).fill(Infinity);

      // Raycast Walls
      for (let x = 0; x < w; x++) {
        const cameraX = (2 * x) / w - 1;
        const rayDirX = player.dirX + player.planeX * cameraX;
        const rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);

        let sideDistX = 0;
        let sideDistY = 0;

        const deltaDistX = Math.abs(1 / (rayDirX || 1e-20));
        const deltaDistY = Math.abs(1 / (rayDirY || 1e-20));
        let perpWallDist = 0;

        let stepX = 0;
        let stepY = 0;
        let hit = 0;
        let side = 0;

        if (rayDirX < 0) {
          stepX = -1;
          sideDistX = (player.x - mapX) * deltaDistX;
        } else {
          stepX = 1;
          sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }

        if (rayDirY < 0) {
          stepY = -1;
          sideDistY = (player.y - mapY) * deltaDistY;
        } else {
          stepY = 1;
          sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }

        while (hit === 0) {
          if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
          } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
          }
          if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT)
            break;
          if (MAP[mapY][mapX] > 0) hit = 1;
        }

        if (side === 0)
          perpWallDist =
            (mapX - player.x + (1 - stepX) / 2) / (rayDirX || 1e-20);
        else
          perpWallDist =
            (mapY - player.y + (1 - stepY) / 2) / (rayDirY || 1e-20);

        if (perpWallDist <= 0) perpWallDist = 0.01;
        zBuffer[x] = perpWallDist;

        const lineHeight = Math.floor(h / perpWallDist);

        let drawStart = -lineHeight / 2 + h / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + h / 2;
        if (drawEnd >= h) drawEnd = h - 1;

        const baseBright = side === 1 ? 140 : 100;
        const depthFactor = Math.min(1, 4 / perpWallDist);
        const r = Math.floor(baseBright * 0.4 * depthFactor);
        const g = Math.floor(baseBright * 0.48 * depthFactor);
        const b = Math.floor(baseBright * 0.6 * depthFactor);

        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.moveTo(x, drawStart);
        ctx.lineTo(x, drawEnd);
        ctx.stroke();

        if (lineHeight > 20 && (mapX % 2 === 0 || mapY % 2 === 0)) {
          ctx.fillStyle = `rgba(0, 240, 255, ${0.08 * depthFactor})`;
          ctx.fillRect(x, drawStart, 1, Math.min(6, lineHeight * 0.05));
        }
      }

      // Draw Sprite Enemies
      const sortedEnemies = enemiesRef.current
        .filter((e) => !e.isDead)
        .map((e) => ({
          ...e,
          dist: Math.hypot(e.x - player.x, e.y - player.y),
        }))
        .sort((a, b) => b.dist - a.dist);

      sortedEnemies.forEach((enemy) => {
        const spriteX = enemy.x - player.x;
        const spriteY = enemy.y - player.y;

        const invDet =
          1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        const transformX =
          invDet * (player.dirY * spriteX - player.dirX * spriteY);
        const transformY =
          invDet * (-player.planeY * spriteX + player.planeX * spriteY);

        if (transformY <= 0.1) return;

        const spriteScreenX = Math.floor(
          (w / 2) * (1 + transformX / transformY),
        );
        const spriteHeight = Math.abs(Math.floor(h / transformY));
        let drawStartY = -spriteHeight / 2 + h / 2;
        if (drawStartY < 0) drawStartY = 0;
        let drawEndY = spriteHeight / 2 + h / 2;
        if (drawEndY >= h) drawEndY = h - 1;

        const spriteWidth = Math.abs(Math.floor(h / transformY));
        let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
        let drawEndX = Math.floor(spriteWidth / 2 + spriteScreenX);

        for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
          if (stripe >= 0 && stripe < w && transformY < zBuffer[stripe]) {
            const progressX = (stripe - drawStartX) / spriteWidth;
            ctx.fillStyle = enemy.flashTicks > 0 ? "#ff3333" : "#bd2a2a";

            if (progressX > 0.3 && progressX < 0.7) {
              ctx.fillRect(
                stripe,
                drawStartY + spriteHeight * 0.25,
                1,
                spriteHeight * 0.75,
              );
            }
            if (progressX > 0.4 && progressX < 0.6) {
              ctx.fillStyle = enemy.flashTicks > 0 ? "#ffffff" : "#e6a15c";
              ctx.fillRect(
                stripe,
                drawStartY + spriteHeight * 0.05,
                1,
                spriteHeight * 0.2,
              );
            }
            if (progressX > 0.45 && progressX < 0.55) {
              ctx.fillStyle = "#00f0ff";
              ctx.fillRect(
                stripe,
                drawStartY + spriteHeight * 0.1,
                1,
                Math.max(1, spriteHeight * 0.03),
              );
            }
          }
        }

        if (transformY < 8) {
          const barW = Math.max(20, 60 / transformY);
          const barH = 4;
          const bx = spriteScreenX - barW / 2;
          const by = drawStartY - 10;

          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(bx, by, barW, barH);
          ctx.fillStyle = "#ff3b30";
          ctx.fillRect(bx, by, barW * (enemy.health / enemy.maxHealth), barH);
        }
      });

      // Draw Gun Overlay
      const gunBaseX = w / 2;
      const gunBaseY = h;

      const time = performance.now() * 0.004;
      const isMoving =
        keysRef.current["w"] ||
        keysRef.current["s"] ||
        keysRef.current["a"] ||
        keysRef.current["d"];
      const swayX = isMoving ? Math.sin(time * 2) * 12 : Math.sin(time) * 3;
      const swayY = isMoving ? Math.abs(Math.cos(time * 2)) * 8 : 0;
      const recoilY = muzzleFlashRef.current > 0 ? 25 : 0;
      const reloadAngle = isReloading
        ? Math.sin(((performance.now() % 1200) / 1200) * Math.PI) * 0.6
        : 0;

      ctx.save();
      ctx.translate(gunBaseX + swayX, gunBaseY + swayY + recoilY);
      ctx.rotate(reloadAngle);

      ctx.fillStyle = "#2c313c";
      ctx.beginPath();
      ctx.moveTo(-25, 0);
      ctx.lineTo(-15, -110);
      ctx.lineTo(20, -110);
      ctx.lineTo(35, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#1e222b";
      ctx.fillRect(-6, -160, 12, 50);

      ctx.fillStyle = "#4b5366";
      ctx.fillRect(-10, -120, 20, 12);
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(-1, -115, 2, 2);

      if (muzzleFlashRef.current > 0) {
        ctx.fillStyle = "rgba(255, 185, 0, 0.9)";
        ctx.beginPath();
        ctx.arc(0, -165, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, -165, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, wave, ammo, isReloading]);

  // Adjust canvas scale dynamically
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />

      {/* --- HUD OVERLAYS --- */}
      {gameState === "PLAYING" && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            <div className="w-1 h-4 bg-cyan-400 opacity-80 absolute" />
            <div className="w-4 h-1 bg-cyan-400 opacity-80 absolute" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 absolute" />
          </div>

          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur px-5 py-3 rounded-md min-w-[220px]">
              <div className="flex justify-between items-center mb-1 text-xs tracking-wider text-slate-400 font-bold uppercase">
                <span>Operative Vitality</span>
                <span
                  className={
                    health < 30
                      ? "text-red-500 animate-pulse font-black"
                      : "text-emerald-400"
                  }
                >
                  {Math.round(health)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-70ms ${health < 30 ? "bg-red-500" : "bg-cyan-500"}`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur px-6 py-2.5 rounded-md text-center">
              <div className="text-xs tracking-widest text-cyan-400 font-bold uppercase mb-0.5">
                Assault Surge
              </div>
              <div className="text-2xl font-black tracking-tight text-white">
                WAVE {wave}
              </div>
              <div className="text-[10px] text-slate-400 tracking-wider uppercase mt-1">
                HOSTILES LEFT:{" "}
                <span className="text-amber-400 font-bold">
                  {enemiesRemaining}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur px-5 py-3 rounded-md min-w-[140px] text-right">
              <div className="text-xs tracking-wider text-slate-400 font-bold uppercase mb-0.5">
                Score Tracker
              </div>
              <div className="text-xl font-mono font-black text-amber-400">
                {score.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 bg-slate-900/80 border border-slate-700/50 backdrop-blur px-6 py-4 rounded-md text-white min-w-[180px] text-right pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">
              M4 CARBINE
            </div>
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span
                className={`text-4xl font-black ${ammo === 0 ? "text-red-500 animate-pulse" : ammo < 10 ? "text-amber-500" : "text-white"}`}
              >
                {ammo}
              </span>
              <span className="text-slate-500 text-lg">/</span>
              <span className="text-slate-400 text-sm font-bold">
                {maxAmmo}
              </span>
            </div>
            {isReloading ? (
              <div className="text-[11px] font-black tracking-wider text-amber-400 uppercase animate-pulse mt-1">
                CHANGING MAG...
              </div>
            ) : ammo === 0 ? (
              <div className="text-[11px] font-black tracking-wider text-red-500 uppercase animate-pulse mt-1">
                PRESS [R] TO RELOAD
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 font-medium uppercase mt-1">
                AUTO REGIME ACTIVE
              </div>
            )}
          </div>

          {!pointerLocked && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 font-bold px-4 py-1.5 text-xs tracking-wider uppercase rounded shadow-lg animate-bounce">
              Click Screen Area to Re-Engage Mouse Aiming
            </div>
          )}
        </>
      )}

      {/* --- MENU PANELS --- */}
      {gameState === "START" && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white px-4 z-50">
          <div className="max-w-md w-full text-center border border-slate-800 bg-slate-900/50 p-8 rounded-xl backdrop-blur-md shadow-2xl">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow">
              FRONTLINE SURGE
            </h1>
            <p className="text-slate-400 text-sm tracking-wide mb-8">
              Tactical High-Performance Vector Arcade Survival FPS
            </p>

            <button
              onClick={startGame}
              className="w-full bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-black tracking-wider uppercase py-4 px-6 rounded-lg transition text-sm shadow-lg shadow-cyan-500/20 mb-8 cursor-pointer"
            >
              DEPLOY TO ENGAGEMENT ZONE
            </button>

            <div className="text-left border-t border-slate-800 pt-6">
              <h3 className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-3">
                Operational Protocols
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono shadow">
                    WASD
                  </kbd>{" "}
                  Tactical Move
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono shadow">
                    MOUSE
                  </kbd>{" "}
                  Free Look Aim
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono shadow">
                    L-CLICK
                  </kbd>{" "}
                  Open Fire
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono shadow">
                    R
                  </kbd>{" "}
                  Magazine Reload
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono shadow">
                    SHIFT
                  </kbd>{" "}
                  Combat Sprint
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === "INTERMISSION" && (
        <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none z-50">
          <div className="text-center">
            <h2 className="text-cyan-400 text-sm font-black tracking-widest uppercase mb-1">
              SURGE CONTAINED
            </h2>
            <h1 className="text-5xl font-black tracking-tight mb-2">
              PREPARING NEXT WAVE
            </h1>
            <p className="text-slate-300 text-xs tracking-wider uppercase">
              Rations delivered. Starting deployment cycle in{" "}
              <span className="text-amber-400 font-bold">
                {intermissionCount}s
              </span>
            </p>
          </div>
        </div>
      )}

      {gameState === "GAMEOVER" && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-white px-4 z-50">
          <div className="max-w-sm w-full text-center border border-red-900/30 bg-slate-900/40 p-8 rounded-xl backdrop-blur shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              ☠
            </div>
            <h1 className="text-3xl font-black tracking-tight text-red-500 uppercase mb-1">
              OPERATIVE DOWN
            </h1>
            <p className="text-slate-400 text-xs tracking-wide mb-6">
              Your defensive position was overwhelmed.
            </p>

            <div className="bg-slate-950/60 rounded-md border border-slate-800 py-3 px-4 mb-6 flex justify-between items-center text-sm font-mono">
              <span className="text-slate-400 text-xs uppercase font-sans">
                Final Score:
              </span>
              <span className="text-amber-400 font-black text-base">
                {score.toLocaleString()}
              </span>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black tracking-wider uppercase py-3 px-5 rounded-lg text-xs transition cursor-pointer"
            >
              DEPLOY REDUX RE-ENGAGEMENT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
