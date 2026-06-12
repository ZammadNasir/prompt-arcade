"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FighterStats {
  name: string;
  health: number;
  speed: number;
  lightDamage: number;
  heavyDamage: number;
  specialDamage: number;
  color: string;
  accentColor: string;
  description: string;
  signature: string;
}

interface Fighter {
  stats: FighterStats;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  health: number;
  maxHealth: number;
  isBlocking: boolean;
  isJumping: boolean;
  isAttacking: boolean;
  attackType: "light" | "heavy" | "special" | null;
  attackFrame: number;
  hitStun: number;
  combo: number;
  isGrounded: boolean;
  animState: "idle" | "walk" | "jump" | "attack" | "block" | "hit" | "ko";
  energy: number;
  maxEnergy: number;
  specialReady: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  owner: "player" | "ai";
  damage: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface GameState {
  phase:
  | "title"
  | "select"
  | "roundStart"
  | "fighting"
  | "roundEnd"
  | "matchEnd"
  | "arcadeComplete";
  player: Fighter;
  ai: Fighter;
  timer: number;
  round: number;
  playerWins: number;
  aiWins: number;
  matchScore: string;
  screenShake: number;
  particles: Particle[];
  projectiles: Projectile[];
  announcements: string[];
  announcementTimer: number;
  arcadeProgress: number;
  difficulty: number;
  aiBehavior: "passive" | "aggressive" | "defensive";
  comboDisplay: { count: number; timer: number; x: number; y: number } | null;
}

// ============================================================================
// FIGHTER DATA
// ============================================================================

const FIGHTERS: FighterStats[] = [
  {
    name: "Cyber Monk",
    health: 100,
    speed: 1.2,
    lightDamage: 8,
    heavyDamage: 18,
    specialDamage: 30,
    color: "#00ffcc",
    accentColor: "#004d40",
    description: "Lightning-fast strikes from the digital monastery",
    signature: "Neural Surge - Channels energy into a devastating combo",
  },
  {
    name: "Iron Valkyrie",
    health: 130,
    speed: 0.8,
    lightDamage: 10,
    heavyDamage: 22,
    specialDamage: 35,
    color: "#e0e0e0",
    accentColor: "#9c27b0",
    description: "Heavy armor, devastating blows",
    signature: "Shield Bash - Unblockable charge attack",
  },
  {
    name: "Street Phantom",
    health: 90,
    speed: 1.4,
    lightDamage: 7,
    heavyDamage: 15,
    specialDamage: 28,
    color: "#ff5722",
    accentColor: "#1a1a1a",
    description: "Shadow techniques and evasive maneuvers",
    signature: "Shadow Step - Teleport behind opponent",
  },
  {
    name: "Titan Boxer",
    health: 140,
    speed: 0.7,
    lightDamage: 12,
    heavyDamage: 25,
    specialDamage: 40,
    color: "#ffeb3b",
    accentColor: "#bf360c",
    description: "Raw power, overwhelming force",
    signature: "Meteor Punch - Devastating uppercut",
  },
  {
    name: "Crimson Ninja",
    health: 95,
    speed: 1.3,
    lightDamage: 9,
    heavyDamage: 20,
    specialDamage: 32,
    color: "#f44336",
    accentColor: "#3d0000",
    description: "Deadly precision, crimson blade arts",
    signature: "Blood Moon Slash - Multi-hit aerial attack",
  },
  {
    name: "Thunder Beast",
    health: 120,
    speed: 1.0,
    lightDamage: 11,
    heavyDamage: 24,
    specialDamage: 38,
    color: "#7c4dff",
    accentColor: "#311b92",
    description: "Electrified fury from the storm lands",
    signature: "Thunder Roar - Area shockwave attack",
  },
];

const STAGE_NAMES = [
  "Neon District",
  "Steel Arena",
  "Cyber Temple",
  "Thunder Dome",
  "Blood Pit",
  "Final Challenge",
];

// ============================================================================
// GAME CONSTANTS
// ============================================================================

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const GROUND_Y = 400;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const ROUND_TIME = 60;
const KNOCKBACK_FORCE = 8;
const HIT_STUN_DURATION = 15;
const ATTACK_DURATION = 20;
const HEAVY_ATTACK_DURATION = 30;
const SPECIAL_ATTACK_DURATION = 45;
const ENERGY_GAIN_RATE = 0.5;
const SPECIAL_ENERGY_COST = 100;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createFighter = (stats: FighterStats, x: number, facingRight: boolean): Fighter => ({
  stats,
  x,
  y: GROUND_Y,
  vx: 0,
  vy: 0,
  facingRight,
  health: stats.health,
  maxHealth: stats.health,
  isBlocking: false,
  isJumping: false,
  isAttacking: false,
  attackType: null,
  attackFrame: 0,
  hitStun: 0,
  combo: 0,
  isGrounded: true,
  animState: "idle",
  energy: 0,
  maxEnergy: 100,
  specialReady: false,
});

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

const ArenaLegends: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const [gamePhase, setGamePhase] = useState<
    | "title"
    | "select"
    | "roundStart"
    | "fighting"
    | "roundEnd"
    | "matchEnd"
    | "arcadeComplete"
  >("title");

  // Ensure the canvas loop uses the latest phase immediately.
  const gamePhaseRef = useRef(gamePhase);
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  // Keep the canvas loop in sync with phase without relying on React's closure.
  const phaseForLoop = gamePhaseRef;
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [selectedAIIndex, setSelectedAIIndex] = useState(0);
  const [matchResult, setMatchResult] = useState<{ winner: string; score: string } | null>(
    null
  );

  // Initialize game state
  const initGameState = useCallback(
    (playerIndex: number, aiIndex: number, startingRound = 1) => {
      const playerStats = FIGHTERS[playerIndex];
      const aiStats = FIGHTERS[aiIndex];
      const difficulty = startingRound;

      const state: GameState = {
        phase: "roundStart",
        player: createFighter(playerStats, 150, true),
        ai: createFighter(aiStats, 750, false),
        timer: ROUND_TIME,
        round: startingRound,
        playerWins: 0,
        aiWins: 0,
        matchScore: "",
        screenShake: 0,
        particles: [],
        projectiles: [],
        announcements: [],
        announcementTimer: 0,
        arcadeProgress: startingRound - 1,
        difficulty,
        aiBehavior: "passive",
        comboDisplay: null,
      };

      gameStateRef.current = state;
      return state;
    },
    []
  );

  // Reset for new round
  const resetRound = useCallback((state: GameState) => {
    const playerStats = state.player.stats;
    const aiStats = state.ai.stats;

    state.player = createFighter(playerStats, 150, true);
    state.ai = createFighter(aiStats, 750, false);
    state.timer = ROUND_TIME;
    state.particles = [];
    state.projectiles = [];
    state.announcements = [];
    state.announcementTimer = 0;
    state.screenShake = 0;
    state.comboDisplay = null;

    // Update AI behavior based on health
    if (state.ai.health / state.ai.maxHealth < 0.3) {
      state.aiBehavior = "aggressive";
    }
  }, []);

  // Spawn particles
  const spawnParticles = useCallback(
    (x: number, y: number, count: number, color: string) => {
      const state = gameStateRef.current;
      if (!state) return;

      for (let i = 0; i < count; i++) {
        state.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10 - 3,
          life: 30 + Math.random() * 20,
          maxLife: 50,
          color,
          size: 3 + Math.random() * 4,
        });
      }
    },
    []
  );

  // Add announcement
  const addAnnouncement = useCallback((text: string, state: GameState) => {
    state.announcements.push(text);
    state.announcementTimer = 90;
  }, []);

  // AI Logic
  const updateAI = useCallback((state: GameState, dt: number) => {
    const ai = state.ai;
    const player = state.player;
    const distance = Math.abs(ai.x - player.x);

    if (ai.hitStun > 0 || ai.health <= 0) return;

    // Decision making
    const rand = Math.random();
    const aggressionMultiplier = state.difficulty * 0.3;

    // Check if player is attacking
    const playerAttacking = player.isAttacking && player.attackFrame < 5;

    // Block if player is attacking and close
    if (playerAttacking && distance < 100 && rand > 0.7) {
      ai.isBlocking = true;
      ai.vx = 0;
    } else if (distance > 150) {
      // Move towards player
      ai.isBlocking = false;
      ai.vx = ai.facingRight ? -MOVE_SPEED * 0.8 : MOVE_SPEED * 0.8;

      // Jump occasionally
      if (ai.isGrounded && rand > 0.95 + aggressionMultiplier) {
        ai.vy = JUMP_FORCE;
        ai.isJumping = true;
      }

      // Attack when close
      if (distance < 80 && ai.isGrounded && rand > 0.6) {
        if (ai.specialReady && rand > 0.8) {
          ai.isAttacking = true;
          ai.attackType = "special";
          ai.attackFrame = 0;
        } else if (rand > 0.5) {
          ai.isAttacking = true;
          ai.attackType = "heavy";
          ai.attackFrame = 0;
        } else {
          ai.isAttacking = true;
          ai.attackType = "light";
          ai.attackFrame = 0;
        }
      }
    } else if (distance < 80) {
      // In attack range
      ai.vx = 0;

      // More aggressive when low health
      if (state.aiBehavior === "aggressive" || rand > 0.4 + aggressionMultiplier) {
        if (ai.specialReady && rand > 0.6) {
          ai.isAttacking = true;
          ai.attackType = "special";
          ai.attackFrame = 0;
        } else if (rand > 0.5) {
          ai.isAttacking = true;
          ai.attackType = "heavy";
          ai.attackFrame = 0;
        } else {
          ai.isAttacking = true;
          ai.attackType = "light";
          ai.attackFrame = 0;
        }
      }
    }

    // Update facing direction
    ai.facingRight = ai.x > player.x;
  }, []);

  // Check hit collision
  const checkHit = useCallback(
    (attacker: Fighter, defender: Fighter, state: GameState): boolean => {
      const attackRange = 60;
      const hitFrame = attacker.attackFrame >= 5 && attacker.attackFrame <= 12;

      if (!hitFrame || !attacker.isAttacking) return false;

      const dx = defender.x - attacker.x;
      const inRange = Math.abs(dx) < attackRange;
      const correctDirection =
        (attacker.facingRight && dx > 0) || (!attacker.facingRight && dx < 0);

      if (inRange && correctDirection) {
        // Calculate damage
        let damage = 0;
        let knockback = KNOCKBACK_FORCE;

        switch (attacker.attackType) {
          case "light":
            damage = attacker.stats.lightDamage;
            break;
          case "heavy":
            damage = attacker.stats.heavyDamage;
            break;
          case "special":
            damage = attacker.stats.specialDamage;
            break;
        }

        // Block reduction
        if (defender.isBlocking) {
          damage *= 0.2;
          knockback *= 0.3;
          spawnParticles(defender.x, defender.y, 5, "#888888");
        } else {
          // Combo tracking
          attacker.combo++;
          state.comboDisplay = {
            count: attacker.combo,
            timer: 60,
            x: defender.x,
            y: defender.y - 50,
          };

          // Screen shake
          state.screenShake = attacker.attackType === "special" ? 15 : 8;

          // Hit particles
          spawnParticles(
            defender.x,
            defender.y,
            attacker.attackType === "special" ? 20 : 10,
            attacker.stats.color
          );
        }

        defender.health -= damage;
        defender.hitStun = HIT_STUN_DURATION;
        defender.vx = attacker.facingRight ? knockback : -knockback;
        defender.animState = "hit";

        // Reset attacker attack
        attacker.isAttacking = false;
        attacker.attackType = null;

        return true;
      }

      return false;
    },
    [spawnParticles]
  );

  // Special move effects
  const executeSpecialMove = useCallback(
    (attacker: Fighter, defender: Fighter, state: GameState) => {
      if (!attacker.specialReady) return;

      attacker.energy -= SPECIAL_ENERGY_COST;
      attacker.specialReady = false;

      const isPlayer = attacker === state.player;
      const fighterName = attacker.stats.name;

      // Unique special effects based on fighter
      switch (fighterName) {
        case "Cyber Monk":
          // Neural Surge - Quick multi-hit combo
          addAnnouncement("NEURAL SURGE!", state);
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              if (defender.health > 0) {
                defender.health -= 5;
                defender.hitStun = 5;
                spawnParticles(defender.x, defender.y, 5, attacker.stats.color);
              }
            }, i * 100);
          }
          break;

        case "Iron Valkyrie":
          // Shield Bash - Charge forward
          addAnnouncement("SHIELD BASH!", state);
          attacker.vx = attacker.facingRight ? 20 : -20;
          defender.health -= 15;
          defender.hitStun = 20;
          state.screenShake = 12;
          spawnParticles(defender.x, defender.y, 15, attacker.stats.color);
          break;

        case "Street Phantom":
          // Shadow Step - Teleport behind
          addAnnouncement("SHADOW STEP!", state);
          attacker.x = defender.x + (defender.facingRight ? 50 : -50);
          attacker.facingRight = !attacker.facingRight;
          defender.health -= 20;
          defender.hitStun = 15;
          spawnParticles(attacker.x, attacker.y, 20, "#000000");
          break;

        case "Titan Boxer":
          // Meteor Punch - Devastating uppercut
          addAnnouncement("METEOR PUNCH!", state);
          defender.vy = -15;
          defender.health -= 25;
          defender.hitStun = 30;
          state.screenShake = 20;
          for (let i = 0; i < 10; i++) {
            spawnParticles(defender.x, defender.y - i * 5, 3, "#ff6600");
          }
          break;

        case "Crimson Ninja":
          // Blood Moon Slash - Multi-hit aerial
          addAnnouncement("BLOOD MOON SLASH!", state);
          attacker.vy = -10;
          for (let i = 0; i < 4; i++) {
            setTimeout(() => {
              if (defender.health > 0 && Math.abs(defender.x - attacker.x) < 100) {
                defender.health -= 8;
                spawnParticles(defender.x, defender.y, 8, attacker.stats.color);
              }
            }, i * 80);
          }
          break;

        case "Thunder Beast":
          // Thunder Roar - Area shockwave
          addAnnouncement("THUNDER ROAR!", state);
          state.projectiles.push({
            x: attacker.x,
            y: attacker.y,
            vx: attacker.facingRight ? 12 : -12,
            owner: isPlayer ? "player" : "ai",
            damage: 20,
            active: true,
          });
          break;
      }
    },
    [addAnnouncement, spawnParticles]
  );

  // Update game logic
  const update = useCallback(
    (state: GameState, dt: number) => {
      if (state.phase !== "fighting") return;

      const keys = keysRef.current;

      // Player input
      const player = state.player;
      if (player.hitStun <= 0 && player.health > 0) {
        player.isBlocking = keys.has("s") || keys.has("S");
        player.vx = 0;

        if (!player.isBlocking && !player.isAttacking) {
          if (keys.has("a") || keys.has("A")) player.vx = -MOVE_SPEED * player.stats.speed;
          if (keys.has("d") || keys.has("D")) player.vx = MOVE_SPEED * player.stats.speed;

          // Jump
          if ((keys.has("w") || keys.has("W")) && player.isGrounded) {
            player.vy = JUMP_FORCE;
            player.isJumping = true;
            player.isGrounded = false;
          }

          // Attacks
          if (!player.isAttacking) {
            if (keys.has("j") || keys.has("J")) {
              player.isAttacking = true;
              player.attackType = "light";
              player.attackFrame = 0;
            } else if (keys.has("k") || keys.has("K")) {
              player.isAttacking = true;
              player.attackType = "heavy";
              player.attackFrame = 0;
            } else if (
              (keys.has("l") || keys.has("L")) &&
              player.specialReady
            ) {
              player.isAttacking = true;
              player.attackType = "special";
              player.attackFrame = 0;
            }
          }
        }

        // Energy gain
        player.energy = Math.min(
          player.maxEnergy,
          player.energy + ENERGY_GAIN_RATE
        );
        player.specialReady = player.energy >= SPECIAL_ENERGY_COST;
      }

      // AI update
      updateAI(state, dt);

      // Update fighters
      [player, state.ai].forEach((fighter) => {
        if (fighter.hitStun > 0) {
          fighter.hitStun--;
        }

        // Apply gravity
        if (!fighter.isGrounded) {
          fighter.vy += GRAVITY;
        }

        // Update position
        fighter.x += fighter.vx;
        fighter.y += fighter.vy;

        // Ground collision
        if (fighter.y >= GROUND_Y) {
          fighter.y = GROUND_Y;
          fighter.vy = 0;
          fighter.isGrounded = true;
          fighter.isJumping = false;
        }

        // Wall boundaries
        fighter.x = clamp(fighter.x, 50, CANVAS_WIDTH - 50);

        // Friction
        if (fighter.hitStun <= 0) {
          fighter.vx *= 0.85;
        }

        // Update attack
        if (fighter.isAttacking) {
          fighter.attackFrame++;
          const maxFrames =
            fighter.attackType === "heavy"
              ? HEAVY_ATTACK_DURATION
              : fighter.attackType === "special"
                ? SPECIAL_ATTACK_DURATION
                : ATTACK_DURATION;

          if (fighter.attackFrame >= maxFrames) {
            fighter.isAttacking = false;
            fighter.attackType = null;
            fighter.attackFrame = 0;
          }

          // Execute special move at peak of animation
          if (
            fighter.attackType === "special" &&
            fighter.attackFrame === 10 &&
            fighter.specialReady
          ) {
            const opponent =
              fighter === state.player ? state.ai : state.player;
            executeSpecialMove(fighter, opponent, state);
          }
        }

        // Update animation state
        if (fighter.health <= 0) {
          fighter.animState = "ko";
        } else if (fighter.hitStun > 0) {
          fighter.animState = "hit";
        } else if (fighter.isAttacking) {
          fighter.animState = "attack";
        } else if (fighter.isBlocking) {
          fighter.animState = "block";
        } else if (!fighter.isGrounded) {
          fighter.animState = "jump";
        } else if (Math.abs(fighter.vx) > 0.5) {
          fighter.animState = "walk";
        } else {
          fighter.animState = "idle";
        }
      });

      // Check hits
      checkHit(player, state.ai, state);
      checkHit(state.ai, player, state);

      // Update projectiles
      state.projectiles = state.projectiles.filter((proj) => {
        proj.x += proj.vx;

        // Check collision with opponent
        const target = proj.owner === "player" ? state.ai : player;
        if (
          Math.abs(proj.x - target.x) < 50 &&
          Math.abs(proj.y - target.y) < 60
        ) {
          target.health -= proj.damage;
          target.hitStun = 10;
          target.vx = proj.vx > 0 ? 5 : -5;
          spawnParticles(proj.x, proj.y, 10, "#ffff00");
          state.screenShake = 10;
          return false;
        }

        // Remove if out of bounds
        if (proj.x < 0 || proj.x > CANVAS_WIDTH) return false;
        return proj.active;
      });

      // Update particles
      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        return p.life > 0;
      });

      // Update screen shake
      if (state.screenShake > 0) state.screenShake *= 0.9;

      // Update combo display
      if (state.comboDisplay) {
        state.comboDisplay.timer--;
        state.comboDisplay.y -= 0.5;
        if (state.comboDisplay.timer <= 0) state.comboDisplay = null;
      }

      // Update announcement
      if (state.announcementTimer > 0) state.announcementTimer--;
      if (state.announcementTimer === 0 && state.announcements.length > 0) {
        state.announcements.shift();
        state.announcementTimer = state.announcements.length > 0 ? 90 : 0;
      }

      // Update timer
      state.timer -= dt / 1000;

      // Check win conditions
      if (player.health <= 0 || state.timer <= 0) {
        const aiWins =
          player.health <= 0 || player.health < state.ai.health;
        if (aiWins) {
          state.aiWins++;
        }
        state.playerWins = state.round - state.aiWins;

        if (state.playerWins >= 2) {
          state.phase = "matchEnd";
          setMatchResult({
            winner: "PLAYER",
            score: `${state.playerWins} - ${state.aiWins}`,
          });
          setGamePhase("matchEnd");
        } else if (state.aiWins >= 2) {
          state.phase = "matchEnd";
          setMatchResult({
            winner: "AI",
            score: `${state.playerWins} - ${state.aiWins}`,
          });
          setGamePhase("matchEnd");
        } else {
          state.phase = "roundEnd";
          addAnnouncement(
            aiWins ? `ROUND ${state.round} - AI WINS` : `ROUND ${state.round} - PLAYER WINS`,
            state
          );
          setTimeout(() => {
            state.round++;
            resetRound(state);
            state.phase = "roundStart";
            addAnnouncement(`ROUND ${state.round}`, state);
          }, 2000);
        }
      }

      if (state.ai.health <= 0 || state.timer <= 0) {
        if (state.ai.health <= 0 || state.ai.health < player.health) {
          state.playerWins++;
        }
        state.aiWins = state.round - state.playerWins;

        if (state.playerWins >= 2) {
          state.phase = "matchEnd";
          setMatchResult({
            winner: "PLAYER",
            score: `${state.playerWins} - ${state.aiWins}`,
          });
          setGamePhase("matchEnd");
        } else if (state.aiWins >= 2) {
          state.phase = "matchEnd";
          setMatchResult({
            winner: "AI",
            score: `${state.playerWins} - ${state.aiWins}`,
          });
          setGamePhase("matchEnd");
        } else {
          state.phase = "roundEnd";
          const aiWins = state.ai.health > player.health;
          addAnnouncement(
            aiWins ? `ROUND ${state.round} - AI WINS` : `ROUND ${state.round} - PLAYER WINS`,
            state
          );
          setTimeout(() => {
            state.round++;
            resetRound(state);
            state.phase = "roundStart";
            addAnnouncement(`ROUND ${state.round}`, state);
          }, 2000);
        }
      }
    },
    [updateAI, checkHit, executeSpecialMove, resetRound, addAnnouncement, spawnParticles]
  );

  // Render game
  const render = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply screen shake
    ctx.save();
    if (state.screenShake > 0.5) {
      ctx.translate(
        (Math.random() - 0.5) * state.screenShake,
        (Math.random() - 0.5) * state.screenShake
      );
    }

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#16213e");
    gradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw arena floor
    ctx.fillStyle = "#2d2d44";
    ctx.fillRect(0, GROUND_Y + 30, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    ctx.strokeStyle = "#4a4a6a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 30);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 30);
    ctx.stroke();

    // Draw arena decorations
    ctx.fillStyle = "#3d3d5c";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(100 + i * 180, GROUND_Y + 50, 80, 60);
    }

    // Draw back wall pattern
    ctx.strokeStyle = "#252540";
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 65, 50);
      ctx.lineTo(i * 65, GROUND_Y);
      ctx.stroke();
    }

    // Draw stage name
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px 'Courier New', monospace";
    ctx.textAlign = "center";
    const stageName = STAGE_NAMES[Math.min(state.arcadeProgress, STAGE_NAMES.length - 1)];
    ctx.fillText(stageName.toUpperCase(), CANVAS_WIDTH / 2, 30);

    // Draw fighters
    const drawFighter = (fighter: Fighter, isPlayer: boolean) => {
      const { x, y, facingRight, animState, stats, health, isAttacking, attackFrame } = fighter;
      const color = stats.color;
      const accent = stats.accentColor;

      ctx.save();
      ctx.translate(x, y);
      if (!facingRight) ctx.scale(-1, 1);

      // Body dimensions based on stats
      const bodyWidth = 40 + fighter.stats.health / 20;
      const bodyHeight = 60 + fighter.stats.speed * 10;

      // Animation offsets
      let bodyOffsetY = 0;
      let armAngle = 0;
      let legSpread = 0;

      switch (animState) {
        case "idle":
          bodyOffsetY = Math.sin(Date.now() / 200) * 2;
          break;
        case "walk":
          legSpread = Math.sin(Date.now() / 100) * 10;
          bodyOffsetY = Math.abs(Math.sin(Date.now() / 100)) * 3;
          break;
        case "jump":
          bodyOffsetY = -10;
          armAngle = -0.5;
          break;
        case "attack":
          const attackProgress = attackFrame / (attackFrame < 15 ? ATTACK_DURATION : HEAVY_ATTACK_DURATION);
          armAngle = Math.sin(attackProgress * Math.PI) * 1.5;
          bodyOffsetY = attackProgress < 0.3 ? -3 : 0;
          break;
        case "block":
          armAngle = -0.8;
          legSpread = 10;
          break;
        case "hit":
          bodyOffsetY = 5;
          ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 50) * 0.3;
          break;
        case "ko":
          ctx.rotate(Math.PI / 2);
          ctx.translate(0, -20);
          break;
      }

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(0, 30, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.fillStyle = accent;
      ctx.fillRect(-12 - legSpread / 2, 10 + bodyOffsetY, 10, 25);
      ctx.fillRect(2 + legSpread / 2, 10 + bodyOffsetY, 10, 25);

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(-bodyWidth / 2, -bodyHeight + bodyOffsetY, bodyWidth, bodyHeight - 20);

      // Body accent
      ctx.fillStyle = accent;
      ctx.fillRect(-bodyWidth / 2 + 5, -bodyHeight + 15 + bodyOffsetY, bodyWidth - 10, 10);

      // Head
      const headSize = 18 + fighter.stats.speed * 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -bodyHeight - 5 + bodyOffsetY, headSize, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(5, -bodyHeight - 8 + bodyOffsetY, 5, 0, Math.PI * 2);
      ctx.arc(12, -bodyHeight - 8 + bodyOffsetY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(6, -bodyHeight - 8 + bodyOffsetY, 2, 0, Math.PI * 2);
      ctx.arc(13, -bodyHeight - 8 + bodyOffsetY, 2, 0, Math.PI * 2);
      ctx.fill();

      // Arms
      ctx.save();
      ctx.translate(bodyWidth / 2 - 5, -bodyHeight + 20 + bodyOffsetY);
      ctx.rotate(armAngle);
      ctx.fillStyle = color;
      ctx.fillRect(0, -5, 25, 12);
      // Fist
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(25, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Back arm
      ctx.save();
      ctx.translate(-bodyWidth / 2 + 5, -bodyHeight + 20 + bodyOffsetY);
      ctx.rotate(-armAngle * 0.5);
      ctx.fillStyle = color;
      ctx.fillRect(-25, -5, 25, 12);
      ctx.restore();

      // Attack effect
      if (isAttacking) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 30) * 0.5;
        ctx.beginPath();
        ctx.arc(30, -bodyHeight + 20, 20 + attackFrame, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Health bar above fighter
      const barWidth = 70;
      const barHeight = 8;
      const barX = x - barWidth / 2;
      const barY = y - bodyHeight - 40;

      ctx.fillStyle = "#333";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const healthPercent = health / fighter.maxHealth;
      ctx.fillStyle = isPlayer ? "#00ff88" : "#ff4444";
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    };

    drawFighter(state.player, true);
    drawFighter(state.ai, false);

    // Draw projectiles
    state.projectiles.forEach((proj) => {
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffff88";
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Draw particles
    state.particles.forEach((p) => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw UI
    ctx.restore();

    // Health bars at top
    const drawHealthBar = (
      x: number,
      y: number,
      width: number,
      health: number,
      maxHealth: number,
      label: string,
      color: string,
      wins: number
    ) => {
      // Background
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(x, y, width + 10, 50);

      // Wins indicator
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i < wins ? "#ffd700" : "#333";
        ctx.beginPath();
        ctx.arc(x + width + 20 + i * 20, y + 25, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Health bar background
      ctx.fillStyle = "#333";
      ctx.fillRect(x + 5, y + 5, width, 20);

      // Health
      const healthPercent = Math.max(0, health / maxHealth);
      ctx.fillStyle = healthPercent > 0.3 ? color : "#ff0000";
      ctx.fillRect(x + 5, y + 5, width * healthPercent, 20);

      // Border
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, width, 20);

      // Energy bar
      ctx.fillStyle = "#333";
      ctx.fillRect(x + 5, y + 30, width, 8);
      const energyPercent = health / maxHealth;
      ctx.fillStyle = "#00aaff";
      ctx.fillRect(x + 5, y + 30, width * (1 - energyPercent), 8);

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px 'Arial', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, x + 5, y + 48);
    };

    drawHealthBar(20, 20, 300, state.player.health, state.player.maxHealth, "PLAYER", "#00ff88", state.playerWins);
    drawHealthBar(CANVAS_WIDTH - 330, 20, 300, state.ai.health, state.ai.maxHealth, state.ai.stats.name.toUpperCase(), "#ff4444", state.aiWins);

    // Timer
    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(Math.ceil(state.timer).toString(), CANVAS_WIDTH / 2, 50);

    // Round indicator
    ctx.font = "bold 16px 'Arial', sans-serif";
    ctx.fillText(`ROUND ${state.round}`, CANVAS_WIDTH / 2, 70);

    // Combo display
    if (state.comboDisplay && state.comboDisplay.count > 1) {
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 28px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${state.comboDisplay.count} HIT COMBO!`, state.comboDisplay.x, state.comboDisplay.y);
    }

    // Announcements
    if (state.announcements.length > 0) {
      const announcement = state.announcements[0];
      const alpha = Math.min(1, state.announcementTimer / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(announcement, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillText(announcement, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.globalAlpha = 1;
    }

    // VS indicator
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 20px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VS", CANVAS_WIDTH / 2, 40);
  }, []);

  // Title screen
  const renderTitle = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Animated background
    const time = Date.now() / 1000;
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(100, 50, 150, ${0.1 + Math.sin(time + i) * 0.05})`;
      ctx.beginPath();
      ctx.arc(
        CANVAS_WIDTH / 2 + Math.sin(time * 0.5 + i) * 200,
        CANVAS_HEIGHT / 2 + Math.cos(time * 0.3 + i * 0.5) * 150,
        50 + i * 10,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Title
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 56px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("IRON CLASH", CANVAS_WIDTH / 2, 150);

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 32px 'Arial', sans-serif";
    ctx.fillText("ARENA LEGENDS", CANVAS_WIDTH / 2, 200);

    // Fighter silhouettes
    ctx.fillStyle = "#333";
    [-150, 150].forEach((offset, i) => {
      const x = CANVAS_WIDTH / 2 + offset;
      const bounce = Math.sin(time * 2 + i * Math.PI) * 10;
      ctx.beginPath();
      ctx.ellipse(x, 350 + bounce, 30, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, 280 + bounce, 25, 0, Math.PI * 2);
      ctx.fill();
    });

    // Start prompt
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px 'Arial', sans-serif";
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillText("PRESS SPACE TO START", CANVAS_WIDTH / 2, 450);
    ctx.globalAlpha = 1;

    // Controls hint
    ctx.fillStyle = "#888";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.fillText("WASD: Move | J: Light | K: Heavy | L: Special | S: Block", CANVAS_WIDTH / 2, 480);
  }, []);

  // Character select screen
  const renderSelect = useCallback(
    (ctx: CanvasRenderingContext2D, playerIndex: number, aiIndex: number) => {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 36px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SELECT YOUR FIGHTER", CANVAS_WIDTH / 2, 50);

      // Draw fighter cards
      const cardWidth = 120;
      const cardHeight = 180;
      const startX = (CANVAS_WIDTH - (cardWidth + 20) * 6) / 2;

      FIGHTERS.forEach((fighter, i) => {
        const x = startX + i * (cardWidth + 20);
        const y = 100;
        const selected = i === playerIndex;

        // Card background
        ctx.fillStyle = selected ? fighter.color : "#2a2a3a";
        ctx.fillRect(x, y, cardWidth, cardHeight);

        // Border
        ctx.strokeStyle = selected ? "#ffd700" : "#555";
        ctx.lineWidth = selected ? 4 : 2;
        ctx.strokeRect(x, y, cardWidth, cardHeight);

        // Fighter preview
        ctx.fillStyle = selected ? fighter.accentColor : "#1a1a2a";
        ctx.beginPath();
        ctx.ellipse(x + cardWidth / 2, y + 90, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + cardWidth / 2, y + 45, 18, 0, Math.PI * 2);
        ctx.fill();

        // Name
        ctx.fillStyle = selected ? "#000" : "#fff";
        ctx.font = "bold 12px 'Arial', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(fighter.name.toUpperCase(), x + cardWidth / 2, y + 140);

        // Stats
        ctx.font = "10px 'Arial', sans-serif";
        ctx.fillText(`HP:${fighter.health} SPD:${fighter.speed.toFixed(1)}`, x + cardWidth / 2, y + 155);
        ctx.fillText(`ATK:${fighter.lightDamage}/${fighter.heavyDamage}`, x + cardWidth / 2, y + 168);
      });

      // Selected fighter info
      const selectedFighter = FIGHTERS[playerIndex];
      ctx.fillStyle = "#fff";
      ctx.font = "bold 24px 'Arial', sans-serif";
      ctx.fillText(selectedFighter.name.toUpperCase(), CANVAS_WIDTH / 2, 320);

      ctx.font = "14px 'Arial', sans-serif";
      ctx.fillText(selectedFighter.description, CANVAS_WIDTH / 2, 350);

      ctx.fillStyle = "#ffd700";
      ctx.fillText(`SIGNATURE: ${selectedFighter.signature}`, CANVAS_WIDTH / 2, 375);

      // Opponent
      ctx.fillStyle = "#ff4444";
      ctx.font = "16px 'Arial', sans-serif";
      ctx.fillText(`OPPONENT: ${FIGHTERS[aiIndex].name.toUpperCase()}`, CANVAS_WIDTH / 2, 410);

      // Controls
      ctx.fillStyle = "#888";
      ctx.font = "14px 'Arial', sans-serif";
      ctx.fillText("← → : Select | SPACE: Confirm | ESC: Back", CANVAS_WIDTH / 2, 480);
    },
    []
  );

  // Match end screen
  const renderMatchEnd = useCallback(
    (ctx: CanvasRenderingContext2D, result: { winner: string; score: string }) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const playerWon = result.winner === "PLAYER";

      ctx.fillStyle = playerWon ? "#00ff88" : "#ff4444";
      ctx.font = "bold 48px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(playerWon ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 180);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 32px 'Arial', sans-serif";
      ctx.fillText(`FINAL SCORE: ${result.score}`, CANVAS_WIDTH / 2, 240);

      ctx.font = "20px 'Arial', sans-serif";
      ctx.fillText("PRESS SPACE TO CONTINUE", CANVAS_WIDTH / 2, 350);
    },
    []
  );

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;


    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);

      const phase = phaseForLoop.current;
      const state = gameStateRef.current;

      if (phase === "title" && e.key === " ") {
        setGamePhase("select");
        return;
      }

      if (phase === "select") {
        if (e.key === "ArrowLeft") {
          setSelectedPlayerIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowRight") {
          setSelectedPlayerIndex((prev) => Math.min(FIGHTERS.length - 1, prev + 1));
        } else if (e.key === " ") {
          // Start match
          const newState = initGameState(selectedPlayerIndex, selectedAIIndex);
          addAnnouncement("FIGHT!", newState);
          // Start fighting immediately (state phase + render loop)
          gameStateRef.current!.phase = "fighting";
          setGamePhase("fighting");
        } else if (e.key === "Escape") {
          setGamePhase("title");
        }
        return;
      }

      if (phase === "matchEnd" && e.key === " ") {
        if (matchResult?.winner === "PLAYER") {
          // Continue arcade
          const nextOpponent = (selectedAIIndex + 1) % FIGHTERS.length;
          setSelectedAIIndex(nextOpponent);
          const newState = initGameState(selectedPlayerIndex, nextOpponent, state ? state.round : 1);
          addAnnouncement("NEXT CHALLENGER", newState);
          setMatchResult(null);
          setGamePhase("fighting");
        } else {
          setGamePhase("title");
          setMatchResult(null);
        }
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const gameLoop = (timestamp: number) => {
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const phase = phaseForLoop.current;

      if (phase === "fighting" && gameStateRef.current) {
        update(gameStateRef.current, dt);
        render(ctx, gameStateRef.current);
      } else if (phase === "title") {
        renderTitle(ctx);
      } else if (phase === "select") {
        renderSelect(ctx, selectedPlayerIndex, selectedAIIndex);
      } else if (phase === "matchEnd" && matchResult) {
        renderMatchEnd(ctx, matchResult);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    gamePhase,
    selectedPlayerIndex,
    selectedAIIndex,
    matchResult,
    initGameState,
    update,
    render,
    renderTitle,
    renderSelect,
    renderMatchEnd,
    addAnnouncement,
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0a0a1a",
        padding: "20px",
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: "4px solid #333",
          borderRadius: "8px",
          boxShadow: "0 0 40px rgba(255, 68, 68, 0.3)",
        }}
      />
      <div
        style={{
          marginTop: "20px",
          color: "#888",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "5px 0" }}>
          <strong style={{ color: "#fff" }}>Controls:</strong> WASD Move | J Light Attack | K Heavy Attack | L Special | S Block | Space Start
        </p>
        <p style={{ margin: "5px 0", color: "#666" }}>
          Defeat all 6 fighters in Arcade Mode to become the champion!
        </p>
      </div>
    </div>
  );
};

export default ArenaLegends;