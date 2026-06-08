"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Audio Engine ──────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function getAudio() {
  if (!audioCtx)
    audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  return audioCtx;
}

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  volume = 0.3,
  delay = 0,
) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + delay + duration,
    );
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {}
}

function playJump() {
  playTone(300, "sine", 0.1, 0.2);
  playTone(500, "sine", 0.1, 0.15, 0.05);
  playTone(700, "sine", 0.08, 0.1, 0.1);
}
function playRoll() {
  playTone(200, "sawtooth", 0.15, 0.15);
  playTone(150, "sawtooth", 0.1, 0.1, 0.1);
}
function playCoin() {
  playTone(880, "sine", 0.08, 0.25);
  playTone(1320, "sine", 0.08, 0.2, 0.08);
}
function playHit() {
  try {
    const ctx = getAudio();
    const bufSize = ctx.sampleRate * 0.3;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    src.buffer = buf;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    src.start();
  } catch {}
}
function playLaneChange() {
  playTone(440, "triangle", 0.07, 0.1);
}
function playPowerup() {
  [523, 659, 784, 1047].forEach((f, i) =>
    playTone(f, "sine", 0.12, 0.2, i * 0.07),
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Lane = 0 | 1 | 2;
type PlayerState = "running" | "jumping" | "rolling" | "dead";
type ObstacleType = "train" | "barrier" | "lowBeam" | "billboard";

interface Obstacle {
  id: number;
  lane: Lane;
  type: ObstacleType;
  z: number;
  width: number;
  height: number;
}

interface Coin {
  id: number;
  lane: Lane;
  z: number;
  collected: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface TrailDot {
  x: number;
  y: number;
  life: number;
  color: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const CANVAS_W = 480;
const CANVAS_H = 640;
const LANES = [-1, 0, 1]; // relative lane positions
const LANE_WIDTH = 90;
const HORIZON_Y = 240;
const GROUND_Y = 500;
const VANISH_X = CANVAS_W / 2;
const PLAYER_BASE_Z = 0.18; // player's Z in perspective (0=near, 1=far)
const OBSTACLE_SPAWN_Z = 0.95;
const DESPAWN_Z = 0.05;
const BASE_SPEED = 0.008;
const MAX_SPEED = 0.022;
const SPEED_INCREMENT = 0.0000012;
const COIN_ROW_INTERVAL = 120;
const OBSTACLE_MIN_INTERVAL = 60;
const OBSTACLE_MAX_INTERVAL = 120;

// ─── Perspective helpers ────────────────────────────────────────────────────────
function perspective(z: number) {
  // z: 0=close to camera, 1=at horizon
  const t = 1 - Math.pow(z, 0.7);
  return {
    scale: t,
    y: HORIZON_Y + (GROUND_Y - HORIZON_Y) * t,
    laneOffset: (l: number) => VANISH_X + l * LANE_WIDTH * t,
  };
}

// ─── Drawing helpers ───────────────────────────────────────────────────────────
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Main Game ─────────────────────────────────────────────────────────────────
export default function SubwayWalker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    lane: 1 as Lane,
    targetLane: 1 as Lane,
    laneT: 1,
    playerState: "running" as PlayerState,
    jumpT: 0,
    rollT: 0,
    jumpY: 0,
    rollScaleY: 1,
    speed: BASE_SPEED,
    score: 0,
    coins: 0,
    distance: 0,
    frame: 0,
    nextObstacle: 80,
    nextCoin: 30,
    obstacles: [] as Obstacle[],
    coinList: [] as Coin[],
    particles: [] as Particle[],
    trail: [] as TrailDot[],
    bobT: 0,
    running: false,
    gameOver: false,
    invincible: 0,
    stunned: 0,
    coinMagnet: 0,
    powerupActive: "",
    powerupTimer: 0,
    obstacleId: 0,
    coinId: 0,
    particleId: 0,
    scorePopups: [] as { x: number; y: number; text: string; life: number }[],
    bgOffset: 0,
    groundTileOffset: 0,
  });

  const [uiState, setUiState] = useState({
    score: 0,
    coins: 0,
    gameOver: false,
    started: false,
    speed: BASE_SPEED,
    powerup: "",
    highScore: 0,
  });

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ─── Input handling ──────────────────────────────────────────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleAction = useCallback((action: string) => {
    const s = stateRef.current;
    if (!s.running || s.gameOver) return;

    if (action === "left" && s.targetLane > 0) {
      s.targetLane = (s.targetLane - 1) as Lane;
      s.laneT = 0;
      playLaneChange();
    } else if (action === "right" && s.targetLane < 2) {
      s.targetLane = (s.targetLane + 1) as Lane;
      s.laneT = 0;
      playLaneChange();
    } else if (action === "jump" && s.playerState === "running") {
      s.playerState = "jumping";
      s.jumpT = 0;
      playJump();
    } else if (action === "roll" && s.playerState === "running") {
      s.playerState = "rolling";
      s.rollT = 0;
      playRoll();
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Space",
          "a",
          "d",
          "w",
          "s",
        ].includes(e.key)
      )
        e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "a") handleAction("left");
      if (e.key === "ArrowRight" || e.key === "d") handleAction("right");
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ")
        handleAction("jump");
      if (e.key === "ArrowDown" || e.key === "s") handleAction("roll");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAction]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < -30) handleAction("left");
      else if (dx > 30) handleAction("right");
    } else {
      if (dy < -30) handleAction("jump");
      else if (dy > 30) handleAction("roll");
    }
  };

  // ─── Game start / restart ─────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.lane = 1;
    s.targetLane = 1;
    s.laneT = 1;
    s.playerState = "running";
    s.jumpT = 0;
    s.rollT = 0;
    s.jumpY = 0;
    s.rollScaleY = 1;
    s.speed = BASE_SPEED;
    s.score = 0;
    s.coins = 0;
    s.distance = 0;
    s.frame = 0;
    s.nextObstacle = 80;
    s.nextCoin = 30;
    s.obstacles = [];
    s.coinList = [];
    s.particles = [];
    s.trail = [];
    s.running = true;
    s.gameOver = false;
    s.invincible = 0;
    s.stunned = 0;
    s.coinMagnet = 0;
    s.powerupActive = "";
    s.powerupTimer = 0;
    s.scorePopups = [];
    s.bgOffset = 0;
    s.groundTileOffset = 0;
    setUiState((u) => ({
      ...u,
      score: 0,
      coins: 0,
      gameOver: false,
      started: true,
      speed: BASE_SPEED,
      powerup: "",
    }));
    lastTimeRef.current = performance.now();
  }, []);

  // ─── Spawn helpers ────────────────────────────────────────────────────────────
  function spawnObstacle(s: typeof stateRef.current) {
    const id = ++s.obstacleId;
    const lane = Math.floor(Math.random() * 3) as Lane;
    const types: ObstacleType[] = ["train", "barrier", "lowBeam", "billboard"];
    const weights = [0.4, 0.25, 0.2, 0.15];
    let r = Math.random();
    let type = types[0];
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        type = types[i];
        break;
      }
    }
    const dims: Record<ObstacleType, [number, number]> = {
      train: [70, 140],
      barrier: [60, 50],
      lowBeam: [60, 25],
      billboard: [65, 90],
    };
    s.obstacles.push({
      id,
      lane,
      type,
      z: OBSTACLE_SPAWN_Z,
      width: dims[type][0],
      height: dims[type][1],
    });
    s.nextObstacle =
      OBSTACLE_MIN_INTERVAL +
      Math.floor(
        Math.random() * (OBSTACLE_MAX_INTERVAL - OBSTACLE_MIN_INTERVAL),
      );
  }

  function spawnCoinRow(s: typeof stateRef.current) {
    const lane = Math.floor(Math.random() * 3) as Lane;
    for (let i = 0; i < 5; i++) {
      s.coinList.push({
        id: ++s.coinId,
        lane,
        z: OBSTACLE_SPAWN_Z - i * 0.06,
        collected: false,
      });
    }
    s.nextCoin = COIN_ROW_INTERVAL + Math.floor(Math.random() * 60);
  }

  function spawnParticles(
    s: typeof stateRef.current,
    x: number,
    y: number,
    color: string,
    count = 8,
  ) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 3;
      s.particles.push({
        id: ++s.particleId,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  // ─── Main loop ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let stopped = false;

    function loop(now: number) {
      if (stopped) return;
      const dt = Math.min((now - lastTimeRef.current) / (1000 / 60), 3);
      lastTimeRef.current = now;
      const s = stateRef.current;

      if (s.running && !s.gameOver) {
        update(s, dt);
      }
      render(ctx, s);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function update(s: typeof stateRef.current, dt: number) {
    s.frame++;
    s.distance += s.speed * dt * 100;
    s.bgOffset = (s.bgOffset + s.speed * dt * 60) % 400;
    s.groundTileOffset = (s.groundTileOffset + s.speed * dt * 300) % 80;

    // Speed up
    s.speed = Math.min(MAX_SPEED, s.speed + SPEED_INCREMENT * dt);

    // Powerup timer
    if (s.powerupTimer > 0) {
      s.powerupTimer -= dt;
      if (s.powerupTimer <= 0) {
        s.powerupActive = "";
        setUiState((u) => ({ ...u, powerup: "" }));
      }
    }
    if (s.invincible > 0) s.invincible -= dt;
    if (s.stunned > 0) s.stunned -= dt;

    // Lane transition
    if (s.laneT < 1) {
      s.laneT = Math.min(1, s.laneT + 0.18 * dt);
      s.lane = s.targetLane;
    }

    // Jump
    if (s.playerState === "jumping") {
      s.jumpT += 0.045 * dt;
      s.jumpY = Math.sin(s.jumpT * Math.PI) * 90;
      if (s.jumpT >= 1) {
        s.playerState = "running";
        s.jumpT = 0;
        s.jumpY = 0;
      }
    }
    // Roll
    if (s.playerState === "rolling") {
      s.rollT += 0.04 * dt;
      s.rollScaleY = 0.45 + Math.abs(Math.sin(s.rollT * Math.PI)) * 0.55;
      if (s.rollT >= 1) {
        s.playerState = "running";
        s.rollT = 0;
        s.rollScaleY = 1;
      }
    }

    // Bob
    s.bobT += 0.12 * dt;

    // Spawn obstacles
    s.nextObstacle -= dt;
    if (s.nextObstacle <= 0) spawnObstacle(s);

    // Spawn coins
    s.nextCoin -= dt;
    if (s.nextCoin <= 0) spawnCoinRow(s);

    // Move obstacles
    const speedScale = s.speed / BASE_SPEED;
    s.obstacles = s.obstacles.filter((o) => {
      o.z -= s.speed * dt * 2.2;
      return o.z > DESPAWN_Z;
    });

    // Move coins
    s.coinList = s.coinList.filter((c) => {
      if (c.collected) return true;
      c.z -= s.speed * dt * 2.2;
      // Magnet effect
      if (s.coinMagnet > 0 && Math.abs(c.z - PLAYER_BASE_Z) < 0.3) {
        c.lane = s.targetLane;
      }
      return c.z > DESPAWN_Z - 0.02;
    });

    // Collision
    if (s.invincible <= 0) {
      for (const o of s.obstacles) {
        if (Math.abs(o.z - PLAYER_BASE_Z) < 0.06 && o.lane === s.targetLane) {
          // Check if player can avoid
          const isLow = o.type === "lowBeam";
          const isTall = o.type === "train" || o.type === "billboard";
          const jumped = s.playerState === "jumping" && s.jumpY > 30;
          const rolled = s.playerState === "rolling";

          if (isLow && rolled) continue; // rolled under
          if (!isLow && jumped && o.type === "barrier") continue; // jumped over barrier
          if (isTall && jumped) continue; // jumped won't help against trains

          // HIT!
          s.gameOver = true;
          s.playerState = "dead";
          playHit();
          const p = perspective(PLAYER_BASE_Z);
          const px = p.laneOffset(LANES[s.targetLane]);
          spawnParticles(s, px, p.y - 40, "#ff4444", 20);
          setUiState((u) => ({
            ...u,
            gameOver: true,
            score: Math.floor(s.score),
            coins: s.coins,
            highScore: Math.max(u.highScore, Math.floor(s.score)),
          }));
          return;
        }
      }
    }

    // Coin collection
    for (const c of s.coinList) {
      if (c.collected) continue;
      if (Math.abs(c.z - PLAYER_BASE_Z) < 0.06 && c.lane === s.targetLane) {
        c.collected = true;
        s.coins++;
        s.score += 10;
        playCoin();
        const p = perspective(PLAYER_BASE_Z);
        const px = p.laneOffset(LANES[c.lane]);
        spawnParticles(s, px, p.y - 30, "#FFD700", 5);
        s.scorePopups.push({ x: px, y: p.y - 60, text: "+10", life: 1 });
      }
    }

    // Score from distance
    s.score += s.speed * dt * 8;

    // Particles
    s.particles = s.particles.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.15 * dt;
      p.life -= 0.04 * dt;
      return p.life > 0;
    });

    // Trail
    if (s.frame % 3 === 0) {
      const p = perspective(PLAYER_BASE_Z);
      const laneX = p.laneOffset(LANES[s.targetLane]);
      const bobY = s.playerState === "running" ? Math.sin(s.bobT) * 3 : 0;
      const py = p.y - 30 * p.scale - s.jumpY - bobY;
      s.trail.push({
        x: laneX,
        y: py,
        life: 1,
        color: s.invincible > 0 ? "#00ffff" : "#ff8800",
      });
    }
    s.trail = s.trail.filter((t) => {
      t.life -= 0.08 * dt;
      return t.life > 0;
    });

    // Score popups
    s.scorePopups = s.scorePopups.filter((p) => {
      p.life -= 0.04 * dt;
      p.y -= 0.5 * dt;
      return p.life > 0;
    });

    setUiState((u) => ({
      ...u,
      score: Math.floor(s.score),
      coins: s.coins,
      speed: s.speed,
      powerup: s.powerupActive,
    }));
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  function render(ctx: CanvasRenderingContext2D, s: typeof stateRef.current) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    drawBackground(ctx, s);
    drawTracks(ctx, s);
    drawCoins(ctx, s);
    drawObstacles(ctx, s);
    drawPlayerTrail(ctx, s);
    drawPlayer(ctx, s);
    drawParticles(ctx, s);
    drawScorePopups(ctx, s);

    if (!s.running) {
      drawStartScreen(ctx);
    }
  }

  function drawBackground(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    skyGrad.addColorStop(0, "#0d0d2b");
    skyGrad.addColorStop(0.6, "#1a1a4e");
    skyGrad.addColorStop(1, "#2d2d6e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y);

    // Stars
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137 + s.bgOffset * 0.1) % CANVAS_W;
      const sy = (i * 57) % (HORIZON_Y - 20);
      const brightness = 0.4 + Math.sin(s.frame * 0.03 + i) * 0.3;
      ctx.globalAlpha = brightness;
      ctx.fillStyle = "#fff";
      ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Moon
    ctx.save();
    const moonX = CANVAS_W * 0.8,
      moonY = 50;
    const moonGlow = ctx.createRadialGradient(
      moonX,
      moonY,
      0,
      moonX,
      moonY,
      40,
    );
    moonGlow.addColorStop(0, "rgba(255,255,200,0.15)");
    moonGlow.addColorStop(1, "rgba(255,255,200,0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moonX - 40, moonY - 40, 80, 80);
    ctx.fillStyle = "#fffff0";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e0e0cc";
    ctx.beginPath();
    ctx.arc(moonX + 6, moonY - 4, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // City skyline
    ctx.save();
    ctx.fillStyle = "#111133";
    const buildings = [
      [20, 160, 60, 80],
      [90, 140, 45, 100],
      [145, 170, 70, 70],
      [230, 130, 50, 110],
      [295, 155, 65, 85],
      [375, 145, 55, 95],
      [440, 165, 60, 75],
    ];
    for (const [bx, by, bw, bh] of buildings) {
      // Shift buildings with bgOffset for parallax
      const shiftedX =
        ((((bx - s.bgOffset * 0.15) % (CANVAS_W + 100)) + CANVAS_W + 100) %
          (CANVAS_W + 100)) -
        100;
      ctx.fillRect(shiftedX, by, bw, bh);
      // Windows
      ctx.fillStyle = "rgba(255,220,100,0.5)";
      for (let wx = shiftedX + 8; wx < shiftedX + bw - 8; wx += 12) {
        for (let wy = by + 10; wy < by + bh - 10; wy += 14) {
          if (Math.random() > 0.4) ctx.fillRect(wx, wy, 6, 8);
        }
      }
      ctx.fillStyle = "#111133";
    }
    ctx.restore();

    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_H);
    groundGrad.addColorStop(0, "#1a1a2e");
    groundGrad.addColorStop(0.3, "#16213e");
    groundGrad.addColorStop(1, "#0f0f1e");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HORIZON_Y, CANVAS_W, CANVAS_H - HORIZON_Y);
  }

  function drawTracks(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    // Draw 3 lane track with perspective
    const nearY = GROUND_Y + 60;
    const farY = HORIZON_Y + 5;

    // Platform / ground tiles
    for (let i = -1; i < 20; i++) {
      const tileZ = 1 - i / 20;
      const p = perspective(tileZ);
      const tileY = p.y;
      const tileH = Math.max(1, perspective(tileZ - 0.05).y - tileY);
      if (tileY < HORIZON_Y || tileY > CANVAS_H) continue;

      const brightness = 20 + tileZ * 30;
      ctx.fillStyle =
        i % 2 === 0
          ? `rgb(${brightness},${brightness},${brightness + 10})`
          : `rgb(${brightness - 5},${brightness - 5},${brightness + 5})`;
      // Full width tile
      const leftEdge = p.laneOffset(-1.8);
      const rightEdge = p.laneOffset(1.8);
      ctx.fillRect(leftEdge, tileY - tileH, rightEdge - leftEdge, tileH + 1);
    }

    // Rails (3 lanes = 4 rails)
    for (let rail = -1.5; rail <= 1.5; rail += 1) {
      ctx.save();
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(VANISH_X + rail * 10, farY);
      ctx.lineTo(VANISH_X + rail * LANE_WIDTH * 1.8, nearY);
      ctx.stroke();

      // Rail gleam
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(VANISH_X + rail * 10 + 0.5, farY);
      ctx.lineTo(VANISH_X + rail * LANE_WIDTH * 1.8 + 0.5, nearY);
      ctx.stroke();
      ctx.restore();
    }

    // Rail ties (horizontal, perspective-spaced)
    const tieOffset = s.groundTileOffset;
    for (let z = 0.1; z < 0.95; z += 0.06) {
      const adjustedZ = ((z + tieOffset / 1000) % 0.9) + 0.05;
      const p = perspective(adjustedZ);
      if (p.y < HORIZON_Y + 10 || p.y > nearY + 20) continue;
      const leftX = p.laneOffset(-1.5);
      const rightX = p.laneOffset(1.5);
      const tieH = Math.max(1, 3 * p.scale);
      ctx.fillStyle = `rgba(80,60,40,${0.5 + adjustedZ * 0.4})`;
      ctx.fillRect(leftX, p.y - tieH / 2, rightX - leftX, tieH);
    }

    // Lane dividers (dashed)
    for (const lane of [-0.5, 0.5]) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,100,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.moveTo(VANISH_X + lane * 5, farY);
      ctx.lineTo(VANISH_X + lane * LANE_WIDTH * 1.8, nearY);
      ctx.stroke();
      ctx.restore();
    }

    // Side walls / tunnel effect
    ctx.save();
    // Left wall
    const wallGrad = ctx.createLinearGradient(0, 0, 80, 0);
    wallGrad.addColorStop(0, "#0a0a1a");
    wallGrad.addColorStop(1, "transparent");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, HORIZON_Y, 80, CANVAS_H - HORIZON_Y);
    // Right wall
    const wallGrad2 = ctx.createLinearGradient(CANVAS_W, 0, CANVAS_W - 80, 0);
    wallGrad2.addColorStop(0, "#0a0a1a");
    wallGrad2.addColorStop(1, "transparent");
    ctx.fillStyle = wallGrad2;
    ctx.fillRect(CANVAS_W - 80, HORIZON_Y, 80, CANVAS_H - HORIZON_Y);
    ctx.restore();

    // Overhead supports / tunnel arches
    for (let z = 0.25; z < 0.95; z += 0.2) {
      const adjustedZ = ((z + tieOffset / 500) % 0.9) + 0.05;
      const p = perspective(adjustedZ);
      if (p.y < HORIZON_Y) continue;
      const archX = p.laneOffset(-1.8);
      const archW = p.laneOffset(1.8) - archX;
      ctx.save();
      ctx.strokeStyle = `rgba(100,100,150,${0.2 + adjustedZ * 0.3})`;
      ctx.lineWidth = 3 * p.scale;
      ctx.beginPath();
      ctx.moveTo(archX, p.y);
      ctx.lineTo(archX, p.y - 80 * p.scale);
      ctx.lineTo(archX + archW, p.y - 80 * p.scale);
      ctx.lineTo(archX + archW, p.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawObstacles(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    const sorted = [...s.obstacles].sort((a, b) => b.z - a.z);
    for (const o of sorted) {
      if (o.z > OBSTACLE_SPAWN_Z - 0.01) continue;
      const p = perspective(o.z);
      const lx = p.laneOffset(LANES[o.lane]);
      const w = o.width * p.scale;
      const h = o.height * p.scale;
      const x = lx - w / 2;
      const y = p.y - h;

      ctx.save();
      if (o.type === "train") drawTrain(ctx, x, y, w, h, p.scale, o.z);
      else if (o.type === "barrier") drawBarrier(ctx, x, y, w, h, p.scale);
      else if (o.type === "lowBeam") drawLowBeam(ctx, x, p.y, w, h, p.scale);
      else if (o.type === "billboard") drawBillboard(ctx, x, y, w, h, p.scale);
      ctx.restore();
    }
  }

  function drawTrain(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number,
    z: number,
  ) {
    // Train body
    const colors = ["#e63946", "#457b9d", "#2a9d8f", "#e76f51", "#f4a261"];
    const colorIdx = Math.floor(z * 100) % colors.length;
    const trainColor = colors[colorIdx];

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x + 4, y + h - 6, w - 2, 8);

    // Main body
    const bodyGrad = ctx.createLinearGradient(x, y, x + w, y);
    bodyGrad.addColorStop(0, shadeColor(trainColor, -20));
    bodyGrad.addColorStop(0.3, trainColor);
    bodyGrad.addColorStop(1, shadeColor(trainColor, -30));
    ctx.fillStyle = bodyGrad;
    drawRoundRect(ctx, x, y, w, h * 0.9, 4 * scale);
    ctx.fill();

    // Stripe
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x + w * 0.05, y + h * 0.15, w * 0.9, h * 0.12);

    // Windows
    const winW = w * 0.25,
      winH = h * 0.18;
    for (let i = 0; i < 2; i++) {
      const wx = x + w * 0.08 + i * (winW + w * 0.1);
      const wy = y + h * 0.32;
      ctx.fillStyle = "rgba(100,200,255,0.7)";
      drawRoundRect(ctx, wx, wy, winW, winH, 2 * scale);
      ctx.fill();
      // Window reflection
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(wx + 2, wy + 2, winW * 0.3, winH * 0.4);
    }

    // Wheels
    for (let i = 0; i < 2; i++) {
      const wx = x + w * 0.18 + i * w * 0.55;
      const wy = y + h * 0.88;
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(wx, wy, 7 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#666";
      ctx.beginPath();
      ctx.arc(wx, wy, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#aaa";
      ctx.beginPath();
      ctx.arc(wx, wy, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Headlights (if facing camera)
    ctx.fillStyle = "rgba(255,240,150,0.9)";
    ctx.shadowColor = "rgba(255,240,0,0.8)";
    ctx.shadowBlur = 8 * scale;
    ctx.beginPath();
    ctx.arc(x + w * 0.15, y + h * 0.7, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.85, y + h * 0.7, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Warning strips
    ctx.fillStyle = "#f4d03f";
    ctx.fillRect(x, y + h * 0.9, w, h * 0.05);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#f4d03f" : "#e74c3c";
      ctx.fillRect(x + (i * w) / 5, y + h * 0.9, w / 5, h * 0.05);
    }
  }

  function drawBarrier(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number,
  ) {
    // Metal barrier with reflections
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "#f0c040");
    grad.addColorStop(0.2, "#e0a000");
    grad.addColorStop(0.5, "#ffcc00");
    grad.addColorStop(1, "#c08800");
    ctx.fillStyle = grad;
    drawRoundRect(ctx, x, y, w, h, 3 * scale);
    ctx.fill();

    // Chevron pattern
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2 * scale;
    const stripes = 4;
    for (let i = 0; i < stripes; i++) {
      const sx = x + (i / stripes) * w;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + w / stripes, y + h);
      ctx.stroke();
    }

    // Reflection
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.15, h * 0.6);

    // Base
    ctx.fillStyle = "#555";
    ctx.fillRect(x - 4, y + h - 6, w + 8, 8);

    // Red warning light on top
    ctx.fillStyle = `rgba(255,50,50,${0.5 + Math.sin(Date.now() * 0.005) * 0.4})`;
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 6 * scale;
    ctx.beginPath();
    ctx.arc(x + w / 2, y, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawLowBeam(
    ctx: CanvasRenderingContext2D,
    x: number,
    groundY: number,
    w: number,
    h: number,
    scale: number,
  ) {
    const y = groundY - h;
    // Pole left
    ctx.fillStyle = "#666";
    ctx.fillRect(x + 4, groundY - 60 * scale, 6 * scale, 60 * scale);
    // Pole right
    ctx.fillRect(
      x + w - 10 * scale,
      groundY - 60 * scale,
      6 * scale,
      60 * scale,
    );

    // Beam
    const beamGrad = ctx.createLinearGradient(x, y, x, y + h);
    beamGrad.addColorStop(0, "rgba(255,100,0,0.9)");
    beamGrad.addColorStop(0.5, "rgba(255,50,0,1)");
    beamGrad.addColorStop(1, "rgba(200,30,0,0.8)");
    ctx.fillStyle = beamGrad;
    ctx.fillRect(x, y, w, h);

    // Glow
    ctx.shadowColor = "rgba(255,80,0,0.8)";
    ctx.shadowBlur = 10 * scale;
    ctx.fillStyle = "rgba(255,120,0,0.6)";
    ctx.fillRect(x, y, w, h * 0.5);
    ctx.shadowBlur = 0;

    // Warning stripes on beam
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,200,0,0.8)" : "rgba(0,0,0,0.3)";
      ctx.fillRect(x + (i * w) / 4, y, w / 4, h);
    }
  }

  function drawBillboard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    scale: number,
  ) {
    // Post
    ctx.fillStyle = "#777";
    ctx.fillRect(x + w / 2 - 3, y + h * 0.6, 6, h * 0.4);

    // Board
    const boardGrad = ctx.createLinearGradient(x, y, x, y + h * 0.6);
    boardGrad.addColorStop(0, "#1a237e");
    boardGrad.addColorStop(1, "#283593");
    ctx.fillStyle = boardGrad;
    drawRoundRect(ctx, x, y, w, h * 0.6, 3 * scale);
    ctx.fill();

    // Colorful ad content
    ctx.fillStyle = "#e91e63";
    ctx.font = `bold ${Math.max(7, 10 * scale)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("STAY", x + w / 2, y + h * 0.2);
    ctx.fillStyle = "#fff176";
    ctx.fillText("ALIVE", x + w / 2, y + h * 0.35);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(x + 2, y + 2, w - 4, h * 0.12);

    // Border
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 1.5 * scale;
    drawRoundRect(ctx, x, y, w, h * 0.6, 3 * scale);
    ctx.stroke();
  }

  function shadeColor(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
  }

  function drawCoins(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    for (const c of s.coinList) {
      if (c.collected) continue;
      if (c.z > OBSTACLE_SPAWN_Z - 0.01) continue;
      const p = perspective(c.z);
      const lx = p.laneOffset(LANES[c.lane]);
      const r = 10 * p.scale;
      const cy =
        p.y - 25 * p.scale + Math.sin(s.frame * 0.1 + c.id) * 4 * p.scale;

      // Coin glow
      const glow = ctx.createRadialGradient(lx, cy, 0, lx, cy, r * 2);
      glow.addColorStop(0, "rgba(255,215,0,0.3)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, cy, r * 2, 0, Math.PI * 2);
      ctx.fill();

      // Coin body
      const coinGrad = ctx.createRadialGradient(
        lx - r * 0.3,
        cy - r * 0.3,
        0,
        lx,
        cy,
        r,
      );
      coinGrad.addColorStop(0, "#fff5aa");
      coinGrad.addColorStop(0.4, "#ffd700");
      coinGrad.addColorStop(1, "#b8860b");
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(lx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Coin rim
      ctx.strokeStyle = "#daa520";
      ctx.lineWidth = 1 * p.scale;
      ctx.beginPath();
      ctx.arc(lx, cy, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // $ symbol
      ctx.fillStyle = "#8B6914";
      ctx.font = `bold ${Math.max(6, 9 * p.scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", lx, cy);
      ctx.textBaseline = "alphabetic";
    }
  }

  function drawPlayerTrail(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    for (const t of s.trail) {
      ctx.globalAlpha = t.life * 0.4;
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 4 * t.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    const p = perspective(PLAYER_BASE_Z);
    const laneX = p.laneOffset(LANES[s.targetLane]);
    const bobY = s.playerState === "running" ? Math.sin(s.bobT * 2) * 3 : 0;
    const baseY = p.y - s.jumpY;
    const cx = laneX;
    const cy = baseY;

    ctx.save();
    ctx.translate(cx, cy);

    // Invincibility flash
    if (s.invincible > 0 && Math.floor(s.frame / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Scale for rolling
    ctx.scale(1, s.rollScaleY);

    // Shadow on ground
    ctx.globalAlpha *= 0.4;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    const shadowStretch = 1 + (1 - s.rollScaleY) * 0.5;
    ctx.ellipse(
      0,
      s.jumpY - bobY + 2,
      18 * shadowStretch,
      5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.globalAlpha =
      s.invincible > 0 && Math.floor(s.frame / 4) % 2 === 0 ? 0.4 : 1;

    // ─── Draw character ───────────────────────────────────────────────────────
    const runCycle = s.playerState === "running" ? Math.sin(s.bobT * 2) : 0;
    const legSwing = runCycle * 12;

    // Legs
    // Left leg
    ctx.fillStyle = "#1565c0";
    ctx.save();
    ctx.translate(-7, -bobY - 16);
    ctx.rotate((legSwing * Math.PI) / 180);
    ctx.fillRect(-4, 0, 8, 20);
    // Shoe
    ctx.fillStyle = "#111";
    ctx.fillRect(-5, 18, 11, 6);
    ctx.restore();

    // Right leg
    ctx.fillStyle = "#1565c0";
    ctx.save();
    ctx.translate(7, -bobY - 16);
    ctx.rotate((-legSwing * Math.PI) / 180);
    ctx.fillRect(-4, 0, 8, 20);
    ctx.fillStyle = "#111";
    ctx.fillRect(-5, 18, 11, 6);
    ctx.restore();

    // Body (jacket)
    const bodyGrad = ctx.createLinearGradient(-14, -bobY - 48, 14, -bobY - 48);
    bodyGrad.addColorStop(0, "#e53935");
    bodyGrad.addColorStop(1, "#c62828");
    ctx.fillStyle = bodyGrad;
    drawRoundRect(ctx, -14, -bobY - 48, 28, 32, 4);
    ctx.fill();

    // Jacket stripe
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(-2, -bobY - 48, 4, 32);

    // Arms
    const armAngle = (runCycle * 20 * Math.PI) / 180;
    ctx.fillStyle = "#e53935";
    // Left arm
    ctx.save();
    ctx.translate(-14, -bobY - 40);
    ctx.rotate(-armAngle - 0.3);
    ctx.fillRect(-5, 0, 8, 18);
    // Hand
    ctx.fillStyle = "#ffcc80";
    ctx.beginPath();
    ctx.arc(0, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right arm
    ctx.fillStyle = "#e53935";
    ctx.save();
    ctx.translate(14, -bobY - 40);
    ctx.rotate(armAngle + 0.3);
    ctx.fillRect(-3, 0, 8, 18);
    ctx.fillStyle = "#ffcc80";
    ctx.beginPath();
    ctx.arc(5, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Neck
    ctx.fillStyle = "#ffcc80";
    ctx.fillRect(-5, -bobY - 52, 10, 8);

    // Head
    const headGrad = ctx.createRadialGradient(
      -4,
      -bobY - 62,
      2,
      0,
      -bobY - 60,
      14,
    );
    headGrad.addColorStop(0, "#ffe0a0");
    headGrad.addColorStop(1, "#ffb870");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -bobY - 62, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair (cap)
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.ellipse(0, -bobY - 73, 13, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.fillRect(-13, -bobY - 73, 26, 5);
    // Cap brim
    ctx.fillStyle = "#222";
    ctx.fillRect(-16, -bobY - 70, 32, 4);
    // Cap logo
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.arc(0, -bobY - 74, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-4, -bobY - 62, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -bobY - 62, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3.5, -bobY - 62.5, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4.5, -bobY - 62.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Smile / expression
    if (s.playerState !== "dead") {
      ctx.strokeStyle = "#a0522d";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -bobY - 58, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#a0522d";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -bobY - 54, 4, Math.PI + 0.2, -0.2);
      ctx.stroke();
      // X eyes
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -bobY - 64);
      ctx.lineTo(-2, -bobY - 60);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2, -bobY - 64);
      ctx.lineTo(-6, -bobY - 60);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, -bobY - 64);
      ctx.lineTo(6, -bobY - 60);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -bobY - 64);
      ctx.lineTo(2, -bobY - 60);
      ctx.stroke();
    }

    // Backpack
    ctx.fillStyle = "#1a237e";
    drawRoundRect(ctx, 11, -bobY - 46, 10, 22, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(12, -bobY - 44, 8, 10);

    // Spray can in hand (detail)
    ctx.fillStyle = "#ffd600";
    ctx.save();
    ctx.translate(20, -bobY - 22);
    ctx.rotate(armAngle);
    ctx.fillRect(-3, -8, 6, 16);
    ctx.fillStyle = "#333";
    ctx.fillRect(-2, -9, 4, 3);
    ctx.restore();

    ctx.restore();
  }

  function drawParticles(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    for (const p of s.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawScorePopups(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    for (const pop of s.scorePopups) {
      ctx.globalAlpha = pop.life;
      ctx.fillStyle = "#FFD700";
      ctx.font = `bold ${14 + (1 - pop.life) * 8}px sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 3;
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  function drawStartScreen(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.textAlign = "center";

    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px sans-serif";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 4;
    ctx.strokeText("SUBWAY", CANVAS_W / 2, CANVAS_H / 2 - 60);
    ctx.fillText("SUBWAY", CANVAS_W / 2, CANVAS_H / 2 - 60);
    ctx.fillStyle = "#FF6B35";
    ctx.strokeText("WALKER", CANVAS_W / 2, CANVAS_H / 2 - 10);
    ctx.fillText("WALKER", CANVAS_W / 2, CANVAS_H / 2 - 10);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#ddd";
    ctx.fillText(
      "← → Switch Lanes  |  ↑ Jump  |  ↓ Roll",
      CANVAS_W / 2,
      CANVAS_H / 2 + 40,
    );

    ctx.textAlign = "left";
  }

  const canvasScale = Math.min(
    typeof window !== "undefined" ? window.innerWidth / CANVAS_W : 1,
    typeof window !== "undefined" ? window.innerHeight / CANVAS_H : 1,
    1.2,
  );

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{ background: "#0a0a1a", minHeight: "100vh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Canvas */}
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: "block",
            borderRadius: 12,
            boxShadow:
              "0 0 60px rgba(0,0,255,0.3), 0 0 120px rgba(0,0,100,0.2)",
          }}
        />

        {/* HUD */}
        {uiState.started && !uiState.gameOver && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 0,
              right: 0,
              pointerEvents: "none",
            }}
          >
            {/* Score */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.6)",
                borderRadius: 20,
                padding: "4px 18px",
                color: "#FFD700",
                fontWeight: "bold",
                fontSize: 22,
                fontFamily: "monospace",
                letterSpacing: 2,
                textShadow: "0 0 10px rgba(255,215,0,0.5)",
                border: "1px solid rgba(255,215,0,0.3)",
              }}
            >
              {uiState.score.toLocaleString()}
            </div>

            {/* Coins */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 16,
                background: "rgba(0,0,0,0.6)",
                borderRadius: 16,
                padding: "4px 12px",
                color: "#FFD700",
                fontSize: 16,
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid rgba(255,215,0,0.3)",
              }}
            >
              <span style={{ fontSize: 18 }}>🪙</span>
              {uiState.coins}
            </div>

            {/* Speed indicator */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 16,
                background: "rgba(0,0,0,0.5)",
                borderRadius: 12,
                padding: "4px 10px",
                fontSize: 11,
                color: "#aaa",
              }}
            >
              <div style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                {Math.floor(
                  (((uiState.speed / BASE_SPEED - 1) * 100) /
                    ((MAX_SPEED / BASE_SPEED - 1) * 100)) *
                    100,
                )}
                %
              </div>
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  marginTop: 2,
                }}
              >
                <div
                  style={{
                    width: `${Math.floor(((uiState.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)) * 100)}%`,
                    height: "100%",
                    background: "#ff6b35",
                    borderRadius: 2,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>

            {uiState.powerup && (
              <div
                style={{
                  position: "absolute",
                  top: 50,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(255,100,0,0.8)",
                  borderRadius: 12,
                  padding: "4px 12px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                ⚡ {uiState.powerup.toUpperCase()}
              </div>
            )}
          </div>
        )}

        {/* Game Over overlay */}
        {uiState.gameOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.75)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontFamily: "sans-serif", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: "bold",
                  color: "#ff4444",
                  textShadow: "0 0 20px rgba(255,0,0,0.5)",
                  marginBottom: 8,
                }}
              >
                BUSTED!
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 16,
                  padding: "20px 40px",
                  marginBottom: 20,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    color: "#FFD700",
                    fontSize: 36,
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                >
                  {uiState.score.toLocaleString()}
                </div>
                <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
                  SCORE
                </div>
                <div style={{ color: "#aaa", fontSize: 16, marginTop: 12 }}>
                  🪙 {uiState.coins} coins
                </div>
                {uiState.highScore > 0 && (
                  <div style={{ color: "#888", fontSize: 13, marginTop: 8 }}>
                    Best: {uiState.highScore.toLocaleString()}
                  </div>
                )}
              </div>
              <button
                onClick={startGame}
                style={{
                  background: "linear-gradient(135deg, #ff6b35, #f7c59f)",
                  border: "none",
                  borderRadius: 30,
                  padding: "14px 40px",
                  color: "#1a0a00",
                  fontSize: 20,
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: 2,
                  boxShadow: "0 4px 20px rgba(255,100,0,0.4)",
                  transition: "transform 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                RETRY
              </button>
              <div style={{ color: "#555", fontSize: 12, marginTop: 16 }}>
                ← → Arrow Keys | ↑ Jump | ↓ Roll
              </div>
            </div>
          </div>
        )}

        {/* Start screen */}
        {!uiState.started && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "0 0 80px",
            }}
          >
            <button
              onClick={startGame}
              style={{
                background: "linear-gradient(135deg, #FFD700, #ff8c00)",
                border: "none",
                borderRadius: 30,
                padding: "16px 52px",
                color: "#1a0a00",
                fontSize: 22,
                fontWeight: "bold",
                cursor: "pointer",
                letterSpacing: 3,
                boxShadow: "0 4px 30px rgba(255,200,0,0.5)",
              }}
            >
              TAP TO PLAY
            </button>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        ← → Lane | ↑ Jump over barriers | ↓ Roll under beams
      </div>
    </div>
  );
}
