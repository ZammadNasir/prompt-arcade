"use client";

import React, { useRef, useEffect, useState } from "react";

// ==================== TYPES ====================
interface Vec2 {
  x: number;
  y: number;
}

interface Car {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  speed: number;
  color: string;
  nitro: number;
  driftScore: number;
  onRoad: boolean;
}

interface Traffic {
  pos: Vec2;
  angle: number;
  speed: number;
  maxSpeed: number;
  path: Vec2[];
  pathIndex: number;
  color: string;
}

interface Road {
  points: Vec2[];
  width: number;
  type: "asphalt" | "dirt";
}

interface WorldObject {
  pos: Vec2;
  type: "tree" | "rock" | "building" | "ramp";
  size: number;
  rotation?: number;
}

interface Checkpoint {
  pos: Vec2;
  radius: number;
}

interface Race {
  id: string;
  name: string;
  description: string;
  checkpoints: Checkpoint[];
  bestTime: number | null;
}

interface ActiveRace {
  raceId: string;
  startTime: number;
  currentCheckpoint: number;
  finished: boolean;
  finalTime: number;
}

interface SpeedZone {
  pos: Vec2;
  radius: number;
  name: string;
  bestSpeed: number;
  active: boolean;
}

interface GameEvent {
  pos: Vec2;
  type: "race" | "speedzone" | "stunt";
  id: string;
  name: string;
  radius: number;
}

interface SkidMark {
  pos: Vec2;
  angle: number;
  alpha: number;
  width: number;
}

interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// ==================== CONSTANTS ====================
const WORLD_SIZE = 4000;
const CAR_MAX_SPEED = 1900;
const CAR_ACCEL = 520;
const CAR_BRAKE = 720;
const CAR_REVERSE = 280;
const FRICTION = 0.965;
const OFFROAD_FRICTION = 0.925;
const TURN_SPEED = 2.9;
const DRIFT_FRICTION = 0.982;
const NITRO_BOOST = 1.65;
const NITRO_CONSUMPTION = 42;
const NITRO_REGEN = 9;
const NITRO_REGEN_DRIFT = 15;
const TRAFFIC_COUNT = 16;
const TREE_COUNT = 280;
const ROCK_COUNT = 45;
const BUILDING_COUNT = 28;

// ==================== UTILITIES ====================
const vec2 = (x: number, y: number): Vec2 => ({ x, y });
const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
const rng = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// ==================== WORLD GENERATION ====================
function generateRoads(): Road[] {
  const roads: Road[] = [];
  const c = WORLD_SIZE / 2;

  // Main highway loop (oval)
  const loop: Vec2[] = [];
  for (let i = 0; i <= 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    loop.push(vec2(c + Math.cos(t) * 1600, c + Math.sin(t) * 1200));
  }
  roads.push({ points: loop, width: 120, type: "asphalt" });

  // Horizontal cross
  roads.push({
    points: [vec2(c - 1700, c), vec2(c + 1700, c)],
    width: 100,
    type: "asphalt",
  });

  // Vertical cross
  roads.push({
    points: [vec2(c, c - 1300), vec2(c, c + 1300)],
    width: 100,
    type: "asphalt",
  });

  // Mountain dirt road
  const dirt: Vec2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    dirt.push(
      vec2(350 + t * 900, 350 + Math.sin(t * Math.PI * 3) * 500 + t * 700),
    );
  }
  roads.push({ points: dirt, width: 80, type: "dirt" });

  // Coastal road
  const coast: Vec2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    coast.push(vec2(2700 + t * 1100, 3300 + Math.cos(t * Math.PI * 4) * 250));
  }
  roads.push({ points: coast, width: 90, type: "asphalt" });

  return roads;
}

function generateObjects(roads: Road[]): WorldObject[] {
  const objects: WorldObject[] = [];

  // Trees
  for (let i = 0; i < TREE_COUNT; i++) {
    const x = rng(i * 2) * WORLD_SIZE;
    const y = rng(i * 2 + 1) * WORLD_SIZE;
    let nearRoad = false;
    for (const road of roads) {
      for (let j = 0; j < road.points.length - 1; j++) {
        const p1 = road.points[j];
        const p2 = road.points[j + 1];
        const l2 = dist(p1, p2) ** 2;
        if (l2 === 0) continue;
        const t = clamp(
          ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2,
          0,
          1,
        );
        const proj = vec2(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
        if (dist(vec2(x, y), proj) < road.width + 50) {
          nearRoad = true;
          break;
        }
      }
      if (nearRoad) break;
    }
    if (!nearRoad) {
      objects.push({
        pos: vec2(x, y),
        type: "tree",
        size: 22 + rng(i * 3) * 35,
      });
    }
  }

  // Rocks
  for (let i = 0; i < ROCK_COUNT; i++) {
    const x = rng(i * 5 + 100) * WORLD_SIZE;
    const y = rng(i * 5 + 101) * WORLD_SIZE;
    objects.push({
      pos: vec2(x, y),
      type: "rock",
      size: 16 + rng(i * 6) * 28,
      rotation: rng(i * 7) * Math.PI,
    });
  }

  // Buildings near roads
  for (let i = 0; i < BUILDING_COUNT; i++) {
    const x = rng(i * 8 + 200) * WORLD_SIZE;
    const y = rng(i * 8 + 201) * WORLD_SIZE;
    let nearRoad = false;
    for (const road of roads) {
      for (let j = 0; j < road.points.length - 1; j++) {
        const p1 = road.points[j];
        const p2 = road.points[j + 1];
        const l2 = dist(p1, p2) ** 2;
        if (l2 === 0) continue;
        const t = clamp(
          ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2,
          0,
          1,
        );
        const proj = vec2(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
        const d = dist(vec2(x, y), proj);
        if (d < road.width + 120 && d > road.width + 25) {
          nearRoad = true;
          break;
        }
      }
      if (nearRoad) break;
    }
    if (nearRoad) {
      objects.push({
        pos: vec2(x, y),
        type: "building",
        size: 45 + rng(i * 9) * 70,
        rotation: rng(i * 10) * Math.PI,
      });
    }
  }

  // Stunt ramp
  objects.push({
    pos: vec2(3200, 800),
    type: "ramp",
    size: 70,
    rotation: -Math.PI / 4,
  });

  return objects;
}

function generateTraffic(roads: Road[]): Traffic[] {
  const traffic: Traffic[] = [];
  const colors = [
    "#e74c3c",
    "#3498db",
    "#f1c40f",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#2ecc71",
    "#34495e",
  ];

  for (let i = 0; i < TRAFFIC_COUNT; i++) {
    const road = roads[Math.floor(rng(i) * roads.length)];
    if (road.points.length < 2) continue;
    const idx = Math.floor(rng(i + 1) * (road.points.length - 1));
    const p1 = road.points[idx];
    const p2 = road.points[idx + 1];
    const t = rng(i + 2);
    const pos = vec2(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const path = road.points.slice(idx).concat(road.points.slice(0, idx + 1));

    traffic.push({
      pos,
      angle,
      speed: 140 + rng(i + 3) * 220,
      maxSpeed: 180 + rng(i + 3) * 180,
      path,
      pathIndex: 0,
      color: colors[Math.floor(rng(i + 4) * colors.length)],
    });
  }

  return traffic;
}

function generateRaces(): Race[] {
  const c = WORLD_SIZE / 2;
  return [
    {
      id: "coastal",
      name: "Coastal Sprint",
      description: "Race along the southern coast",
      checkpoints: [
        { pos: vec2(c, c + 1000), radius: 90 },
        { pos: vec2(c + 800, c + 1250), radius: 90 },
        { pos: vec2(c + 1600, c + 1000), radius: 90 },
        { pos: vec2(c + 800, c + 750), radius: 90 },
      ],
      bestTime: null,
    },
    {
      id: "mountain",
      name: "Mountain Pass",
      description: "Off-road dirt challenge through the hills",
      checkpoints: [
        { pos: vec2(350, 350), radius: 80 },
        { pos: vec2(800, 650), radius: 80 },
        { pos: vec2(1250, 900), radius: 80 },
        { pos: vec2(600, 1050), radius: 80 },
      ],
      bestTime: null,
    },
    {
      id: "highway",
      name: "Sunset Boulevard",
      description: "High-speed loop around the festival",
      checkpoints: [
        { pos: vec2(c - 1300, c), radius: 110 },
        { pos: vec2(c, c - 1100), radius: 110 },
        { pos: vec2(c + 1300, c), radius: 110 },
        { pos: vec2(c, c + 1100), radius: 110 },
      ],
      bestTime: null,
    },
  ];
}

function generateSpeedZones(): SpeedZone[] {
  return [
    {
      pos: vec2(WORLD_SIZE / 2, WORLD_SIZE / 2),
      radius: 350,
      name: "Central Speed Zone",
      bestSpeed: 0,
      active: false,
    },
    {
      pos: vec2(3200, 3200),
      radius: 280,
      name: "Coast Run",
      bestSpeed: 0,
      active: false,
    },
  ];
}

function generateGameEvents(
  races: Race[],
  speedZones: SpeedZone[],
): GameEvent[] {
  const events: GameEvent[] = [];
  for (const race of races) {
    if (race.checkpoints.length > 0) {
      events.push({
        pos: race.checkpoints[0].pos,
        type: "race",
        id: race.id,
        name: race.name,
        radius: 110,
      });
    }
  }
  for (const zone of speedZones) {
    events.push({
      pos: zone.pos,
      type: "speedzone",
      id: zone.name,
      name: zone.name,
      radius: zone.radius,
    });
  }
  events.push({
    pos: vec2(3200, 800),
    type: "stunt",
    id: "ramp",
    name: "Stunt Ramp",
    radius: 90,
  });
  return events;
}

// ==================== GAME STATE ====================
interface GameState {
  player: Car;
  traffic: Traffic[];
  roads: Road[];
  objects: WorldObject[];
  races: Race[];
  activeRace: ActiveRace | null;
  speedZones: SpeedZone[];
  events: GameEvent[];
  skidMarks: SkidMark[];
  particles: Particle[];
  camera: Vec2;
  cameraZoom: number;
  keys: Set<string>;
  driftMode: boolean;
  usingNitro: boolean;
  score: number;
  fans: number;
  gameTime: number;
  state: "menu" | "playing" | "paused";
  message: string;
  messageTimer: number;
  screenShake: number;
  nearEvent: GameEvent | null;
}

function createInitialState(): GameState {
  const roads = generateRoads();
  const races = generateRaces();
  const speedZones = generateSpeedZones();
  const c = WORLD_SIZE / 2;

  return {
    player: {
      pos: vec2(c, c),
      vel: vec2(0, 0),
      angle: -Math.PI / 2,
      speed: 0,
      color: "#ff4757",
      nitro: 100,
      driftScore: 0,
      onRoad: true,
    },
    traffic: generateTraffic(roads),
    roads,
    objects: generateObjects(roads),
    races,
    activeRace: null,
    speedZones,
    events: generateGameEvents(races, speedZones),
    skidMarks: [],
    particles: [],
    camera: vec2(c, c),
    cameraZoom: 1,
    keys: new Set(),
    driftMode: false,
    usingNitro: false,
    score: 0,
    fans: 0,
    gameTime: 0,
    state: "menu",
    message: "",
    messageTimer: 0,
    screenShake: 0,
    nearEvent: null,
  };
}

// ==================== PHYSICS & UPDATE ====================
function updatePlayer(state: GameState, dt: number) {
  const p = state.player;
  const keys = state.keys;

  // Determine if on road
  let onRoad = false;
  for (const road of state.roads) {
    for (let i = 0; i < road.points.length - 1; i++) {
      const a = road.points[i];
      const b = road.points[i + 1];
      const l2 = dist(a, b) ** 2;
      if (l2 === 0) continue;
      const t = clamp(
        ((p.pos.x - a.x) * (b.x - a.x) + (p.pos.y - a.y) * (b.y - a.y)) / l2,
        0,
        1,
      );
      const proj = vec2(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y));
      if (dist(p.pos, proj) < road.width / 2) {
        onRoad = true;
        break;
      }
    }
    if (onRoad) break;
  }
  p.onRoad = onRoad;

  // Input
  let accel = 0;
  let turn = 0;
  let brake = false;

  if (keys.has("w") || keys.has("arrowup")) accel = 1;
  if (keys.has("s") || keys.has("arrowdown")) accel = -1;
  if (keys.has("a") || keys.has("arrowleft")) turn = -1;
  if (keys.has("d") || keys.has("arrowright")) turn = 1;
  if (keys.has(" ")) brake = true;
  state.usingNitro = keys.has("shift");

  // Direction vectors (before steering)
  const forward = vec2(Math.cos(p.angle), Math.sin(p.angle));
  const right = vec2(-Math.sin(p.angle), Math.cos(p.angle));

  // Current velocity components
  const speedForward = p.vel.x * forward.x + p.vel.y * forward.y;
  const speedRight = p.vel.x * right.x + p.vel.y * right.y;

  // Acceleration
  if (accel > 0) {
    const boost = state.usingNitro && p.nitro > 0 ? NITRO_BOOST : 1;
    p.vel.x += forward.x * CAR_ACCEL * boost * dt;
    p.vel.y += forward.y * CAR_ACCEL * boost * dt;
  } else if (accel < 0) {
    if (speedForward > 0) {
      p.vel.x -= forward.x * CAR_BRAKE * dt;
      p.vel.y -= forward.y * CAR_BRAKE * dt;
    } else {
      p.vel.x -= forward.x * CAR_REVERSE * dt;
      p.vel.y -= forward.y * CAR_REVERSE * dt;
    }
  }

  // Nitro consumption & effects
  if (state.usingNitro && p.nitro > 0 && accel > 0) {
    p.nitro = Math.max(0, p.nitro - NITRO_CONSUMPTION * dt);
    state.screenShake = 0.6;
    for (let i = 0; i < 2; i++) {
      state.particles.push({
        pos: vec2(p.pos.x - forward.x * 25, p.pos.y - forward.y * 25),
        vel: vec2(
          -forward.x * 120 + (Math.random() - 0.5) * 60,
          -forward.y * 120 + (Math.random() - 0.5) * 60,
        ),
        life: 0.35,
        maxLife: 0.35,
        color: `hsl(${20 + Math.random() * 40}, 100%, 60%)`,
        size: 4 + Math.random() * 5,
      });
    }
  }

  // Steering
  if (Math.abs(speedForward) > 10 || accel !== 0) {
    const speedFactor = clamp(Math.abs(speedForward) / CAR_MAX_SPEED, 0.1, 1);
    const turnAmount = turn * TURN_SPEED * (1.3 - speedFactor * 0.5) * dt;
    p.angle += turnAmount;
  }

  // Recalculate vectors after steering for grip/drift
  const forward2 = vec2(Math.cos(p.angle), Math.sin(p.angle));
  const right2 = vec2(-Math.sin(p.angle), Math.cos(p.angle));

  // Handbrake / Drift
  state.driftMode = brake && Math.abs(speedForward) > 80;
  if (state.driftMode) {
    p.vel.x *= DRIFT_FRICTION;
    p.vel.y *= DRIFT_FRICTION;

    const speedRight2 = p.vel.x * right2.x + p.vel.y * right2.y;
    if (Math.abs(speedRight2) > 40 && Math.random() > 0.4) {
      state.skidMarks.push({
        pos: vec2(p.pos.x - forward2.x * 12, p.pos.y - forward2.y * 12),
        angle: p.angle,
        alpha: 0.5,
        width: 7,
      });
    }

    const driftAmount =
      Math.abs(speedRight2) * Math.abs(speedForward) * dt * 0.001;
    p.driftScore += driftAmount;
    p.nitro = Math.min(100, p.nitro + driftAmount * NITRO_REGEN_DRIFT);
    state.score += driftAmount * 15;
  } else {
    const grip = onRoad ? 0.88 : 0.68;
    const newSpeedForward = p.vel.x * forward2.x + p.vel.y * forward2.y;
    const newSpeedRight = p.vel.x * right2.x + p.vel.y * right2.y;
    p.vel.x =
      forward2.x * newSpeedForward + right2.x * newSpeedRight * (1 - grip);
    p.vel.y =
      forward2.y * newSpeedForward + right2.y * newSpeedRight * (1 - grip);
    p.driftScore *= 0.92;
  }

  // Friction & speed limit
  const friction = onRoad ? FRICTION : OFFROAD_FRICTION;
  p.vel.x *= friction;
  p.vel.y *= friction;

  const currentSpeed = Math.hypot(p.vel.x, p.vel.y);
  const maxAllowed =
    CAR_MAX_SPEED * (state.usingNitro && p.nitro > 0 ? 1.35 : 1);
  if (currentSpeed > maxAllowed) {
    const scale = maxAllowed / currentSpeed;
    p.vel.x *= scale;
    p.vel.y *= scale;
  }

  // Position update
  p.pos.x += p.vel.x * dt;
  p.pos.y += p.vel.y * dt;

  // World bounds
  p.pos.x = clamp(p.pos.x, 60, WORLD_SIZE - 60);
  p.pos.y = clamp(p.pos.y, 60, WORLD_SIZE - 60);
  if (p.pos.x <= 60 || p.pos.x >= WORLD_SIZE - 60) p.vel.x *= -0.5;
  if (p.pos.y <= 60 || p.pos.y >= WORLD_SIZE - 60) p.vel.y *= -0.5;

  p.speed = currentSpeed;

  // Off-road dust
  if (!onRoad && currentSpeed > 180 && Math.random() > 0.6) {
    state.particles.push({
      pos: vec2(p.pos.x, p.pos.y),
      vel: vec2((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120),
      life: 0.5,
      maxLife: 0.5,
      color: "#8B7355",
      size: 3 + Math.random() * 4,
    });
  }

  // Passive nitro regen
  if (!state.usingNitro) {
    p.nitro = Math.min(100, p.nitro + NITRO_REGEN * dt);
  }
}

function updateTraffic(state: GameState, dt: number) {
  for (const t of state.traffic) {
    if (t.path.length < 2) continue;

    const target = t.path[t.pathIndex];
    const toTarget = vec2(target.x - t.pos.x, target.y - t.pos.y);
    const d = Math.hypot(toTarget.x, toTarget.y);

    if (d < 35) {
      t.pathIndex = (t.pathIndex + 1) % t.path.length;
      continue;
    }

    const targetAngle = Math.atan2(toTarget.y, toTarget.x);
    const diff = angleDiff(targetAngle, t.angle);
    t.angle += clamp(diff, -2.2 * dt, 2.2 * dt);

    t.pos.x += Math.cos(t.angle) * t.speed * dt;
    t.pos.y += Math.sin(t.angle) * t.speed * dt;

    // Push away from player
    const dPlayer = dist(t.pos, state.player.pos);
    if (dPlayer < 45) {
      const push = vec2(
        ((t.pos.x - state.player.pos.x) / dPlayer) * 250,
        ((t.pos.y - state.player.pos.y) / dPlayer) * 250,
      );
      t.pos.x += push.x * dt;
      t.pos.y += push.y * dt;
      t.speed *= 0.85;
    }
  }
}

function updateCollisions(state: GameState) {
  const p = state.player;

  for (const obj of state.objects) {
    const d = dist(p.pos, obj.pos);
    if (obj.type === "tree" || obj.type === "rock" || obj.type === "building") {
      const minDist = obj.size / 2 + 22;
      if (d < minDist && d > 0) {
        const push = vec2(
          ((p.pos.x - obj.pos.x) / d) * (minDist - d),
          ((p.pos.y - obj.pos.y) / d) * (minDist - d),
        );
        p.pos.x += push.x;
        p.pos.y += push.y;
        p.vel.x *= -0.35;
        p.vel.y *= -0.35;
        state.screenShake = 2.5;
      }
    } else if (obj.type === "ramp") {
      if (d < 65 && p.speed > 320) {
        p.vel.x *= 1.6;
        p.vel.y *= 1.6;
        state.score += 600;
        state.fans += 60;
        state.message = "STUNT JUMP! +600";
        state.messageTimer = 2.5;
        state.screenShake = 4;
        for (let i = 0; i < 12; i++) {
          state.particles.push({
            pos: vec2(p.pos.x, p.pos.y),
            vel: vec2((Math.random() - 0.5) * 350, (Math.random() - 0.5) * 350),
            life: 0.7,
            maxLife: 0.7,
            color: "#FFD700",
            size: 5 + Math.random() * 4,
          });
        }
      }
    }
  }

  for (const t of state.traffic) {
    const d = dist(p.pos, t.pos);
    if (d < 45 && d > 0) {
      const push = vec2(
        ((p.pos.x - t.pos.x) / d) * 25,
        ((p.pos.y - t.pos.y) / d) * 25,
      );
      p.pos.x += push.x;
      p.pos.y += push.y;
      p.vel.x *= 0.5;
      p.vel.y *= 0.5;
      state.screenShake = 1.5;
    }
  }
}

function updateRace(state: GameState, dt: number) {
  if (!state.activeRace) return;

  const race = state.races.find((r) => r.id === state.activeRace!.raceId);
  if (!race) return;

  const ar = state.activeRace;
  const cp = race.checkpoints[ar.currentCheckpoint];

  if (dist(state.player.pos, cp.pos) < cp.radius) {
    ar.currentCheckpoint++;
    state.fans += 30;
    state.message = `Checkpoint ${ar.currentCheckpoint}/${race.checkpoints.length}`;
    state.messageTimer = 1.8;

    if (ar.currentCheckpoint >= race.checkpoints.length) {
      ar.finished = true;
      ar.finalTime = state.gameTime - ar.startTime;
      if (race.bestTime === null || ar.finalTime < race.bestTime) {
        race.bestTime = ar.finalTime;
      }
      state.score += Math.max(1000, Math.floor(15000 / ar.finalTime));
      state.fans += 250;
      state.message = `RACE COMPLETE! ${ar.finalTime.toFixed(2)}s`;
      state.messageTimer = 3.5;
      state.activeRace = null;
    }
  }
}

function updateSpeedZones(state: GameState) {
  for (const zone of state.speedZones) {
    const d = dist(state.player.pos, zone.pos);
    const wasActive = zone.active;
    zone.active = d < zone.radius;

    if (zone.active && state.player.speed > zone.bestSpeed) {
      zone.bestSpeed = state.player.speed;
    }

    if (zone.active && !wasActive) {
      state.message = `Entered ${zone.name}`;
      state.messageTimer = 1.5;
    }
  }
}

function updateEvents(state: GameState) {
  state.nearEvent = null;
  for (const event of state.events) {
    const d = dist(state.player.pos, event.pos);
    if (d < event.radius + 50 && !state.activeRace) {
      state.nearEvent = event;
      if (state.keys.has("e") && event.type === "race") {
        const race = state.races.find((r) => r.id === event.id);
        if (race) {
          state.activeRace = {
            raceId: event.id,
            startTime: state.gameTime,
            currentCheckpoint: 0,
            finished: false,
            finalTime: 0,
          };
          state.message = `Started: ${event.name}`;
          state.messageTimer = 2.5;
          state.keys.delete("e");
        }
      }
    }
  }
}

function updateParticles(state: GameState, dt: number) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const part = state.particles[i];
    part.pos.x += part.vel.x * dt;
    part.pos.y += part.vel.y * dt;
    part.life -= dt;
    if (part.life <= 0) {
      state.particles.splice(i, 1);
    }
  }

  for (let i = state.skidMarks.length - 1; i >= 0; i--) {
    const skid = state.skidMarks[i];
    skid.alpha -= dt * 0.15;
    if (skid.alpha <= 0) {
      state.skidMarks.splice(i, 1);
    }
  }
}

function updateCamera(state: GameState, dt: number) {
  const targetZoom =
    0.75 + 0.45 * (1 - clamp(state.player.speed / CAR_MAX_SPEED, 0, 1));
  state.cameraZoom = lerp(state.cameraZoom, targetZoom, dt * 2.5);

  const lookAhead = vec2(
    state.player.pos.x + state.player.vel.x * 0.35,
    state.player.pos.y + state.player.vel.y * 0.35,
  );

  state.camera.x = lerp(state.camera.x, lookAhead.x, dt * 4.5);
  state.camera.y = lerp(state.camera.y, lookAhead.y, dt * 4.5);

  if (state.screenShake > 0) {
    state.screenShake -= dt * 6;
    if (state.screenShake < 0) state.screenShake = 0;
  }
}

function updateGame(state: GameState, dt: number) {
  if (state.state !== "playing") return;

  state.gameTime += dt;
  updatePlayer(state, dt);
  updateTraffic(state, dt);
  updateCollisions(state);
  updateRace(state, dt);
  updateSpeedZones(state);
  updateEvents(state);
  updateParticles(state, dt);
  updateCamera(state, dt);

  if (state.messageTimer > 0) {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) state.message = "";
  }
}

// ==================== RENDERING ====================
function drawRoads(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  visibleRect: { minX: number; minY: number; maxX: number; maxY: number },
) {
  for (const road of state.roads) {
    let visible = false;
    for (const p of road.points) {
      if (
        p.x >= visibleRect.minX &&
        p.x <= visibleRect.maxX &&
        p.y >= visibleRect.minY &&
        p.y <= visibleRect.maxY
      ) {
        visible = true;
        break;
      }
    }
    if (!visible) continue;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Road bed
    ctx.beginPath();
    ctx.moveTo(road.points[0].x, road.points[0].y);
    for (let i = 1; i < road.points.length; i++) {
      ctx.lineTo(road.points[i].x, road.points[i].y);
    }
    ctx.strokeStyle = road.type === "asphalt" ? "#2c3e50" : "#7d5a36";
    ctx.lineWidth = road.width;
    ctx.stroke();

    // Center line
    if (road.type === "asphalt") {
      ctx.beginPath();
      ctx.moveTo(road.points[0].x, road.points[0].y);
      for (let i = 1; i < road.points.length; i++) {
        ctx.lineTo(road.points[i].x, road.points[i].y);
      }
      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 3;
      ctx.setLineDash([50, 50]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawObjects(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  visibleRect: { minX: number; minY: number; maxX: number; maxY: number },
) {
  for (const obj of state.objects) {
    if (
      obj.pos.x < visibleRect.minX ||
      obj.pos.x > visibleRect.maxX ||
      obj.pos.y < visibleRect.minY ||
      obj.pos.y > visibleRect.maxY
    )
      continue;

    ctx.save();
    ctx.translate(obj.pos.x, obj.pos.y);
    if (obj.rotation) ctx.rotate(obj.rotation);

    if (obj.type === "tree") {
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(-3, -3, 6, 6);
      ctx.fillStyle = "#27ae60";
      ctx.beginPath();
      ctx.arc(0, 0, obj.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(-6, -6, obj.size / 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === "rock") {
      ctx.fillStyle = "#7f8c8d";
      ctx.beginPath();
      ctx.moveTo(-obj.size / 2, obj.size / 4);
      ctx.lineTo(-obj.size / 4, -obj.size / 2);
      ctx.lineTo(obj.size / 3, -obj.size / 3);
      ctx.lineTo(obj.size / 2, obj.size / 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#95a5a6";
      ctx.beginPath();
      ctx.moveTo(-obj.size / 3, 0);
      ctx.lineTo(0, -obj.size / 3);
      ctx.lineTo(obj.size / 4, -obj.size / 4);
      ctx.lineTo(obj.size / 3, obj.size / 4);
      ctx.closePath();
      ctx.fill();
    } else if (obj.type === "building") {
      ctx.fillStyle = "#95a5a6";
      ctx.fillRect(-obj.size / 2, -obj.size / 2, obj.size, obj.size);
      ctx.fillStyle = "#ecf0f1";
      ctx.fillRect(-obj.size / 3, -obj.size / 3, obj.size / 4, obj.size / 4);
      ctx.fillRect(obj.size / 6, -obj.size / 3, obj.size / 4, obj.size / 4);
      ctx.fillStyle = "#34495e";
      ctx.fillRect(-obj.size / 4, obj.size / 4, obj.size / 2, obj.size / 4);
    } else if (obj.type === "ramp") {
      ctx.fillStyle = "#e67e22";
      ctx.beginPath();
      ctx.moveTo(-35, 25);
      ctx.lineTo(35, 25);
      ctx.lineTo(0, -35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#d35400";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  car: Car | Traffic,
  isPlayer: boolean,
) {
  ctx.save();
  ctx.translate(car.pos.x, car.pos.y);
  ctx.rotate(car.angle);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 24, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = isPlayer ? car.color : car.color;
  ctx.beginPath();
  ctx.roundRect(-22, -11, 44, 22, 4);
  ctx.fill();

  // Roof / cabin
  ctx.fillStyle = isPlayer ? "#c0392b" : "#7f8c8d";
  ctx.beginPath();
  ctx.roundRect(-11, -9, 20, 18, 3);
  ctx.fill();

  // Windows
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(-6, -7, 12, 14);

  // Wheels
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(-18, -13, 10, 5);
  ctx.fillRect(-18, 8, 10, 5);
  ctx.fillRect(8, -13, 10, 5);
  ctx.fillRect(8, 8, 10, 5);

  // Headlights (player only)
  if (isPlayer) {
    ctx.fillStyle = "#f1c40f";
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(22, -7);
    ctx.lineTo(120, -35);
    ctx.lineTo(120, 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, 7);
    ctx.lineTo(120, 35);
    ctx.lineTo(120, -5);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Brake lights
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(-23, -8, 3, 5);
  ctx.fillRect(-23, 3, 3, 5);

  ctx.restore();
}

function drawSkidMarks(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const skid of state.skidMarks) {
    ctx.save();
    ctx.translate(skid.pos.x, skid.pos.y);
    ctx.rotate(skid.angle);
    ctx.globalAlpha = skid.alpha;
    ctx.fillStyle = "#1a252f";
    ctx.fillRect(-16, -13, 7, 4);
    ctx.fillRect(-16, 9, 7, 4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const part of state.particles) {
    ctx.globalAlpha = clamp(part.life / part.maxLife, 0, 1);
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(part.pos.x, part.pos.y, part.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTraffic(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  visibleRect: { minX: number; minY: number; maxX: number; maxY: number },
) {
  for (const t of state.traffic) {
    if (
      t.pos.x < visibleRect.minX ||
      t.pos.x > visibleRect.maxX ||
      t.pos.y < visibleRect.minY ||
      t.pos.y > visibleRect.maxY
    )
      continue;
    drawCar(ctx, t, false);
  }
}

function drawEventMarkers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  visibleRect: { minX: number; minY: number; maxX: number; maxY: number },
) {
  for (const event of state.events) {
    if (
      event.pos.x < visibleRect.minX ||
      event.pos.x > visibleRect.maxX ||
      event.pos.y < visibleRect.minY ||
      event.pos.y > visibleRect.maxY
    )
      continue;

    const bounce = Math.sin(state.gameTime * 3) * 6;

    ctx.save();
    ctx.translate(event.pos.x, event.pos.y - 35 - bounce);

    // Pole
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(-2, 0, 4, 35);

    // Circle
    ctx.fillStyle =
      event.type === "race"
        ? "#e74c3c"
        : event.type === "speedzone"
          ? "#3498db"
          : "#f1c40f";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Icon
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      event.type === "race" ? "R" : event.type === "speedzone" ? "S" : "!",
      0,
      0,
    );

    // Label
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(event.name, 0, -28);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

function drawCheckpoints(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.activeRace) return;
  const race = state.races.find((r) => r.id === state.activeRace!.raceId);
  if (!race) return;

  for (
    let i = state.activeRace.currentCheckpoint;
    i < race.checkpoints.length;
    i++
  ) {
    const cp = race.checkpoints[i];
    const isNext = i === state.activeRace.currentCheckpoint;

    ctx.save();
    ctx.translate(cp.pos.x, cp.pos.y);

    if (isNext) {
      const pulse = Math.sin(state.gameTime * 4) * 8;
      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, cp.radius + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(241, 196, 15, 0.15)";
      ctx.beginPath();
      ctx.arc(0, 0, cp.radius, 0, Math.PI * 2);
      ctx.fill();

      // Arrow pointing to next checkpoint if far away
      const d = dist(state.player.pos, cp.pos);
      if (d > 400) {
        const angle = Math.atan2(
          cp.pos.y - state.player.pos.y,
          cp.pos.x - state.player.pos.x,
        );
        ctx.restore();
        ctx.save();
        ctx.translate(
          state.player.pos.x + Math.cos(angle) * 80,
          state.player.pos.y + Math.sin(angle) * 80,
        );
        ctx.rotate(angle);
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        continue;
      }
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, cp.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
) {
  // Speedometer
  const speedKmh = Math.floor(state.player.speed * 0.22);
  const cx = width - 130;
  const cy = height - 130;
  const radius = 90;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const maxSpeedDisplay = 220;
  const speedAngle =
    -Math.PI * 0.75 + (speedKmh / maxSpeedDisplay) * Math.PI * 1.5;

  ctx.beginPath();
  ctx.arc(0, 0, radius - 12, -Math.PI * 0.75, speedAngle);
  ctx.strokeStyle =
    speedKmh > 160 ? "#e74c3c" : speedKmh > 100 ? "#f1c40f" : "#2ecc71";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(speedKmh.toString(), 0, 12);

  ctx.font = "13px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("KM/H", 0, 38);

  ctx.restore();

  // Nitro bar
  const barW = 220;
  const barH = 18;
  const barX = 25;
  const barY = height - 45;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(barX, barY, barW, barH);

  const nitroPct = state.player.nitro / 100;
  ctx.fillStyle =
    state.usingNitro && state.player.nitro > 0 ? "#e74c3c" : "#3498db";
  ctx.fillRect(barX, barY, barW * nitroPct, barH);

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("NITRO", barX, barY - 6);

  // Score / Fans
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${Math.floor(state.score)}`, 25, 35);
  ctx.fillText(`Fans: ${state.fans}`, 25, 62);

  // Race info
  if (state.activeRace) {
    const race = state.races.find((r) => r.id === state.activeRace!.raceId);
    if (race) {
      const time = state.gameTime - state.activeRace.startTime;
      const cp = state.activeRace.currentCheckpoint;
      const total = race.checkpoints.length;

      ctx.fillStyle = "#f1c40f";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(race.name, width / 2, 35);
      ctx.fillText(
        `Time: ${time.toFixed(2)}s  |  Checkpoint ${cp + 1}/${total}`,
        width / 2,
        62,
      );
    }
  }

  // Near event prompt
  if (state.nearEvent && !state.activeRace) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(width / 2 - 180, height - 90, 360, 40);
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 2;
    ctx.strokeRect(width / 2 - 180, height - 90, 360, 40);

    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Press E to start ${state.nearEvent.name}`,
      width / 2,
      height - 70,
    );
  }

  // Message
  if (state.message && state.messageTimer > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(state.messageTimer, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(width / 2 - 220, height / 2 - 45, 440, 90);
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 3;
    ctx.strokeRect(width / 2 - 220, height / 2 - 45, 440, 90);

    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.message, width / 2, height / 2);
    ctx.restore();
  }

  // Drift popup
  if (state.player.driftScore > 15) {
    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `DRIFT +${Math.floor(state.player.driftScore)}`,
      width / 2,
      height - 110,
    );
  }

  // Minimap
  const mapSize = 160;
  const mapX = width - mapSize - 25;
  const mapY = 25;
  const scale = mapSize / WORLD_SIZE;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.beginPath();
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, mapSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, mapSize / 2, 0, Math.PI * 2);
  ctx.clip();

  // Roads
  for (const road of state.roads) {
    ctx.beginPath();
    ctx.moveTo(
      mapX + road.points[0].x * scale,
      mapY + road.points[0].y * scale,
    );
    for (let i = 1; i < road.points.length; i++) {
      ctx.lineTo(
        mapX + road.points[i].x * scale,
        mapY + road.points[i].y * scale,
      );
    }
    ctx.strokeStyle =
      road.type === "asphalt"
        ? "rgba(255,255,255,0.25)"
        : "rgba(160,120,70,0.4)";
    ctx.lineWidth = road.width * scale;
    ctx.stroke();
  }

  // Events
  for (const event of state.events) {
    ctx.fillStyle =
      event.type === "race"
        ? "#e74c3c"
        : event.type === "speedzone"
          ? "#3498db"
          : "#f1c40f";
    ctx.fillRect(
      mapX + event.pos.x * scale - 2,
      mapY + event.pos.y * scale - 2,
      4,
      4,
    );
  }

  // Player
  ctx.fillStyle = "#2ecc71";
  ctx.beginPath();
  ctx.arc(
    mapX + state.player.pos.x * scale,
    mapY + state.player.pos.y * scale,
    4,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.strokeStyle = "#2ecc71";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(
    mapX + state.player.pos.x * scale,
    mapY + state.player.pos.y * scale,
  );
  ctx.lineTo(
    mapX + state.player.pos.x * scale + Math.cos(state.player.angle) * 10,
    mapY + state.player.pos.y * scale + Math.sin(state.player.angle) * 10,
  );
  ctx.stroke();

  ctx.restore();
}

// ==================== MAIN COMPONENT ====================
export default function SunsetRush() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const [showMenu, setShowMenu] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const state = stateRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      state.keys.add(key);

      if (key === "enter" && state.state === "menu") {
        state.state = "playing";
        setShowMenu(false);
      }

      if (key === "escape") {
        if (state.state === "playing") {
          state.state = "paused";
          setIsPaused(true);
        } else if (state.state === "paused") {
          state.state = "playing";
          setIsPaused(false);
        }
      }

      if (key === "r" && state.activeRace) {
        const race = state.races.find((r) => r.id === state.activeRace!.raceId);
        if (race) {
          state.activeRace = {
            raceId: race.id,
            startTime: state.gameTime,
            currentCheckpoint: 0,
            finished: false,
            finalTime: 0,
          };
          state.player.pos = vec2(
            race.checkpoints[0].pos.x,
            race.checkpoints[0].pos.y,
          );
          state.player.vel = vec2(0, 0);
          state.player.angle = -Math.PI / 2;
          state.message = "Race Restarted";
          state.messageTimer = 1.5;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      state.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastTime = performance.now();
    let animId: number;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;

      updateGame(state, dt);

      ctx.clearRect(0, 0, width, height);

      if (state.state === "menu") {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, width, height);
        animId = requestAnimationFrame(loop);
        return;
      }

      // Camera
      ctx.save();
      const shakeX = (Math.random() - 0.5) * state.screenShake * 12;
      const shakeY = (Math.random() - 0.5) * state.screenShake * 12;
      ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
      ctx.scale(state.cameraZoom, state.cameraZoom);
      ctx.translate(-state.camera.x, -state.camera.y);

      // Terrain
      ctx.fillStyle = "#2d5a27";
      ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      // Terrain variation
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      for (let x = 0; x < WORLD_SIZE; x += 250) {
        for (let y = 0; y < WORLD_SIZE; y += 250) {
          if ((Math.floor(x / 250) + Math.floor(y / 250)) % 2 === 0) {
            ctx.fillRect(x, y, 250, 250);
          }
        }
      }

      // World border
      ctx.strokeStyle = "#c0392b";
      ctx.lineWidth = 12;
      ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

      const visibleRect = {
        minX: state.camera.x - width / state.cameraZoom / 2 - 250,
        minY: state.camera.y - height / state.cameraZoom / 2 - 250,
        maxX: state.camera.x + width / state.cameraZoom / 2 + 250,
        maxY: state.camera.y + height / state.cameraZoom / 2 + 250,
      };

      drawRoads(ctx, state, visibleRect);
      drawSkidMarks(ctx, state);
      drawObjects(ctx, state, visibleRect);
      drawEventMarkers(ctx, state, visibleRect);
      drawCheckpoints(ctx, state);
      drawTraffic(ctx, state, visibleRect);
      drawCar(ctx, state.player, true);
      drawParticles(ctx, state);

      ctx.restore();

      // Sunset overlay
      const sunsetGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        100,
        width / 2,
        height / 2,
        Math.max(width, height),
      );
      sunsetGrad.addColorStop(0, "rgba(255, 140, 80, 0)");
      sunsetGrad.addColorStop(1, "rgba(180, 60, 30, 0.12)");
      ctx.fillStyle = sunsetGrad;
      ctx.fillRect(0, 0, width, height);

      // HUD
      drawHUD(ctx, state, width, height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10,10,25,0.92)",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1
            style={{
              color: "#f1c40f",
              fontSize: "72px",
              margin: "0 0 10px 0",
              letterSpacing: "2px",
            }}
          >
            SUNSET RUSH
          </h1>
          <p
            style={{
              fontSize: "26px",
              margin: "0 0 40px 0",
              opacity: 0.9,
              fontWeight: 300,
            }}
          >
            Open World Arcade Racing
          </p>
          <div
            style={{
              textAlign: "center",
              lineHeight: "2",
              opacity: 0.75,
              marginBottom: "40px",
              fontSize: "16px",
            }}
          >
            <p>
              WASD / Arrows to Drive &nbsp;•&nbsp; Space to Drift &nbsp;•&nbsp;
              Shift for Nitro
            </p>
            <p>
              E near markers to Race &nbsp;•&nbsp; R to Restart &nbsp;•&nbsp;
              Esc to Pause
            </p>
          </div>
          <button
            onClick={() => {
              stateRef.current.state = "playing";
              setShowMenu(false);
            }}
            style={{
              padding: "16px 48px",
              fontSize: "22px",
              fontWeight: "bold",
              background: "#e67e22",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(230,126,34,0.4)",
            }}
          >
            ENTER to Start
          </button>
        </div>
      )}
      {isPaused && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2
            style={{ fontSize: "48px", marginBottom: "20px", color: "#f1c40f" }}
          >
            PAUSED
          </h2>
          <p style={{ fontSize: "20px", opacity: 0.8 }}>Press ESC to Resume</p>
        </div>
      )}
    </div>
  );
}
