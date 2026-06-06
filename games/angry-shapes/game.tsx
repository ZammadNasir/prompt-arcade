// game.tsx (increased range + visual shape at cannon)
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Matter from "matter-js";

type ShapeType = "circle" | "triangle" | "square";

interface GameState {
  level: number;
  score: number;
  shotsRemaining: number;
  enemiesRemaining: number;
  gameStatus: "aiming" | "firing" | "levelWin" | "gameOver";
  currentShape: ShapeType;
  shapeUsage: { circle: number; triangle: number; square: number };
  shapeDamageFactors: { circle: number; triangle: number; square: number };
}

// Helper: equilateral triangle vertices (centered)
const createTriangleVertices = (size: number = 28) => {
  const half = size / 2;
  const height = size * 0.866;
  return [
    { x: 0, y: -height / 2 },
    { x: -half, y: height / 2 },
    { x: half, y: height / 2 },
  ];
};

export default function AngryShapesGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const animationId = useRef<number | null>(null);
  const worldBounds = useRef({ width: 1200, height: 700 });
  const cannonPos = useRef({ x: 100, y: 0 });
  const activeProjectile = useRef<Matter.Body | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    shotsRemaining: 8,
    enemiesRemaining: 0,
    gameStatus: "aiming",
    currentShape: "circle",
    shapeUsage: { circle: 0, triangle: 0, square: 0 },
    shapeDamageFactors: { circle: 1.0, triangle: 1.0, square: 1.0 },
  });

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragCurrent, setDragCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // ------------------------------------------------------------
  // World setup & helpers
  // ------------------------------------------------------------
  const initWorld = useCallback((width: number, height: number) => {
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, true);
      Matter.Engine.clear(engineRef.current);
    }
    const engine = Matter.Engine.create();
    engine.gravity.y = 0.2;
    engine.gravity.x = 0;
    engine.positionIterations = 12;
    engine.velocityIterations = 8;
    engineRef.current = engine;

    // Static walls
    const ground = Matter.Bodies.rectangle(width / 2, height - 30, width, 60, {
      isStatic: true,
      restitution: 0.5,
      friction: 0.4,
      label: "ground",
    });
    const leftWall = Matter.Bodies.rectangle(-40, height / 2, 80, height, {
      isStatic: true,
      restitution: 0.6,
      label: "wall",
    });
    const rightWall = Matter.Bodies.rectangle(
      width + 40,
      height / 2,
      80,
      height,
      {
        isStatic: true,
        restitution: 0.6,
        label: "wall",
      },
    );
    const ceiling = Matter.Bodies.rectangle(width / 2, -40, width, 80, {
      isStatic: true,
      restitution: 0.5,
      label: "wall",
    });
    Matter.World.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    cannonPos.current = { x: 140, y: height - 130 };
    const cannonBase = Matter.Bodies.circle(
      cannonPos.current.x,
      cannonPos.current.y,
      22,
      {
        isStatic: true,
        restitution: 0.3,
        label: "cannon",
        render: { fillStyle: "#3a6ea5" },
      },
    );
    Matter.World.add(engine.world, cannonBase);

    return engine;
  }, []);

  const spawnEnemies = useCallback(
    (engine: Matter.Engine, level: number, width: number, height: number) => {
      const count = Math.min(5 + Math.floor(level / 2), 14);
      // Move enemies closer: startX = width - 120 (was 180)
      const startX = width - 120;
      const startY = height - 110;
      const enemies: Matter.Body[] = [];
      const rows = Math.min(2 + Math.floor(level / 4), 4);
      const perRow = Math.ceil(count / rows);

      for (let r = 0; r < rows; r++) {
        const y = startY - r * 42;
        const thisRow = r === rows - 1 ? count - r * perRow : perRow;
        for (let i = 0; i < thisRow; i++) {
          const x = startX + i * 48 - (thisRow - 1) * 24;
          const enemy = Matter.Bodies.rectangle(x, y, 40, 40, {
            restitution: 0.3,
            friction: 0.5,
            mass: 1.2,
            label: "enemy",
            render: {
              fillStyle: "#c44536",
              strokeStyle: "#8b2c1f",
              lineWidth: 2,
            },
            plugin: { health: 1, enemyType: "basic" },
          });
          enemies.push(enemy);
        }
      }
      Matter.World.add(engine.world, enemies);
      return enemies.length;
    },
    [],
  );

  const clearDynamic = useCallback((engine: Matter.Engine) => {
    const toRemove = engine.world.bodies.filter(
      (b) => b.label === "enemy" || b.label === "projectile",
    );
    Matter.World.remove(engine.world, toRemove);
    activeProjectile.current = null;
  }, []);

  const loadLevel = useCallback(
    (engine: Matter.Engine, level: number, width: number, height: number) => {
      clearDynamic(engine);
      const enemyCount = spawnEnemies(engine, level, width, height);
      setGameState((prev) => ({
        ...prev,
        enemiesRemaining: enemyCount,
        shotsRemaining: 8 + Math.floor(level / 2),
        gameStatus: "aiming",
      }));
    },
    [clearDynamic, spawnEnemies],
  );

  const applyAdaptation = useCallback(
    (
      usage: { circle: number; triangle: number; square: number },
      factors: any,
    ) => {
      const entries = Object.entries(usage);
      const most = entries.reduce((a, b) =>
        a[1] > b[1] ? a : b,
      )[0] as ShapeType;
      const total = usage.circle + usage.triangle + usage.square;
      if (total === 0) return factors;
      const newFactors = { ...factors };
      if (most === "circle")
        newFactors.circle = Math.max(0.4, newFactors.circle * 0.75);
      if (most === "triangle")
        newFactors.triangle = Math.max(0.4, newFactors.triangle * 0.75);
      if (most === "square")
        newFactors.square = Math.max(0.4, newFactors.square * 0.75);
      return newFactors;
    },
    [],
  );

  const handleLevelWin = useCallback(() => {
    if (stateRef.current.gameStatus !== "firing") return;
    const curr = stateRef.current;
    const newFactors = applyAdaptation(
      curr.shapeUsage,
      curr.shapeDamageFactors,
    );
    const nextLevel = curr.level + 1;
    const engine = engineRef.current;
    if (!engine || !worldBounds.current) return;

    clearDynamic(engine);
    setGameState((prev) => ({
      ...prev,
      level: nextLevel,
      shapeDamageFactors: newFactors,
      shapeUsage: { circle: 0, triangle: 0, square: 0 },
      gameStatus: "levelWin",
    }));

    setTimeout(() => {
      if (engineRef.current && worldBounds.current) {
        loadLevel(
          engineRef.current,
          nextLevel,
          worldBounds.current.width,
          worldBounds.current.height,
        );
        setGameState((prev) => ({ ...prev, gameStatus: "aiming" }));
      }
    }, 800);
  }, [applyAdaptation, clearDynamic, loadLevel]);

  const handleGameOver = useCallback(() => {
    setGameState((prev) => ({ ...prev, gameStatus: "gameOver" }));
    if (activeProjectile.current && engineRef.current) {
      Matter.World.remove(engineRef.current.world, activeProjectile.current);
      activeProjectile.current = null;
    }
  }, []);

  // Fire projectile with higher force
  const fireProjectile = useCallback(
    (
      shape: ShapeType,
      velocity: { x: number; y: number },
      engine: Matter.Engine,
    ) => {
      if (activeProjectile.current) return false;
      if (stateRef.current.gameStatus !== "aiming") return false;
      if (stateRef.current.shotsRemaining <= 0) {
        handleGameOver();
        return false;
      }

      const pos = cannonPos.current;
      let body: Matter.Body;
      const size = 28;

      if (shape === "circle") {
        body = Matter.Bodies.circle(pos.x, pos.y, size / 2, {
          restitution: 0.85,
          friction: 0.08,
          density: 0.003,
          label: "projectile",
          render: {
            fillStyle: "#4299c1",
            strokeStyle: "#2c6e9e",
            lineWidth: 2,
          },
        });
      } else if (shape === "square") {
        body = Matter.Bodies.rectangle(pos.x, pos.y, size, size, {
          restitution: 0.35,
          friction: 0.3,
          density: 0.006,
          label: "projectile",
          render: {
            fillStyle: "#ecc94b",
            strokeStyle: "#b7791f",
            lineWidth: 2,
          },
        });
      } else {
        const verts = createTriangleVertices(size);
        body = Matter.Bodies.fromVertices(pos.x, pos.y, [verts], {
          restitution: 0.55,
          friction: 0.15,
          density: 0.004,
          label: "projectile",
          render: {
            fillStyle: "#e53e3e",
            strokeStyle: "#9b2c2c",
            lineWidth: 2,
          },
        });
      }

      const damageVal = stateRef.current.shapeDamageFactors[shape];
      body.plugin = {
        shapeType: shape,
        damage: damageVal,
        pierceRemaining: shape === "triangle" ? 2 : 0,
      };

      Matter.World.add(engine.world, body);
      Matter.Body.setVelocity(body, velocity);
      Matter.Body.setAngularVelocity(body, shape === "triangle" ? 0.1 : 0.03);
      activeProjectile.current = body;

      setGameState((prev) => ({
        ...prev,
        shotsRemaining: prev.shotsRemaining - 1,
        shapeUsage: { ...prev.shapeUsage, [shape]: prev.shapeUsage[shape] + 1 },
        gameStatus: "firing",
      }));
      return true;
    },
    [handleGameOver],
  );

  // Collision handling (unchanged)
  const setupCollisions = useCallback(
    (engine: Matter.Engine) => {
      Matter.Events.on(engine, "collisionStart", (event) => {
        for (let pair of event.pairs) {
          const a = pair.bodyA;
          const b = pair.bodyB;
          let proj: Matter.Body | null = null;
          let enemy: Matter.Body | null = null;
          if (a.label === "projectile" && b.label === "enemy") {
            proj = a;
            enemy = b;
          } else if (b.label === "projectile" && a.label === "enemy") {
            proj = b;
            enemy = a;
          }
          if (proj && enemy && proj.plugin) {
            const damage = proj.plugin.damage || 1;
            const health = enemy.plugin?.health || 1;
            const newHealth = health - damage;

            if (newHealth <= 0) {
              Matter.World.remove(engine.world, enemy);
              setGameState((prev) => {
                const remaining = prev.enemiesRemaining - 1;
                const newScore = prev.score + 10 + Math.floor(damage * 5);
                if (remaining === 0 && prev.gameStatus === "firing") {
                  setTimeout(() => handleLevelWin(), 100);
                }
                return {
                  ...prev,
                  enemiesRemaining: remaining,
                  score: newScore,
                };
              });
            } else {
              enemy.plugin = { ...enemy.plugin, health: newHealth };
            }

            const shape = proj.plugin.shapeType;
            if (shape === "triangle") {
              const pierce = proj.plugin.pierceRemaining || 0;
              if (pierce <= 1) {
                Matter.World.remove(engine.world, proj);
                activeProjectile.current = null;
              } else {
                proj.plugin.pierceRemaining = pierce - 1;
                proj.plugin.damage = Math.max(
                  0.3,
                  (proj.plugin.damage || 1) * 0.8,
                );
              }
            } else {
              Matter.World.remove(engine.world, proj);
              activeProjectile.current = null;
            }
            break;
          }
        }
      });
    },
    [handleLevelWin],
  );

  const resetGame = useCallback(() => {
    if (!engineRef.current || !worldBounds.current) return;
    clearDynamic(engineRef.current);
    const enemyCount = spawnEnemies(
      engineRef.current,
      1,
      worldBounds.current.width,
      worldBounds.current.height,
    );
    setGameState({
      level: 1,
      score: 0,
      shotsRemaining: 8,
      enemiesRemaining: enemyCount,
      gameStatus: "aiming",
      currentShape: "circle",
      shapeUsage: { circle: 0, triangle: 0, square: 0 },
      shapeDamageFactors: { circle: 1.0, triangle: 1.0, square: 1.0 },
    });
    activeProjectile.current = null;
  }, [clearDynamic, spawnEnemies]);

  // ------------------------------------------------------------
  // Physics & render loop (added drawing of current shape at cannon)
  // ------------------------------------------------------------
  const updatePhysicsAndDraw = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    Matter.Engine.update(engine, 16.6);

    const ctx = canvas.getContext("2d") as any;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a2a32";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bodies = engine.world.bodies;
    for (let body of bodies) {
      if (body.label === "ground") {
        ctx.fillStyle = "#4a6741";
        ctx.fillRect(
          body.bounds.min.x,
          body.bounds.min.y,
          body.bounds.max.x - body.bounds.min.x,
          body.bounds.max.y - body.bounds.min.y,
        );
        continue;
      }
      if (body.label === "wall") {
        ctx.fillStyle = "#2d3e3b";
        ctx.fillRect(
          body.bounds.min.x,
          body.bounds.min.y,
          body.bounds.max.x - body.bounds.min.x,
          body.bounds.max.y - body.bounds.min.y,
        );
        continue;
      }
      if (body.label === "cannon") {
        // Draw cannon base (grey circle)
        ctx.fillStyle = "#5a7d9a";
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2c4e6e";
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw current shape on top of cannon
        const shape = stateRef.current.currentShape;
        const cx = body.position.x;
        const cy = body.position.y;
        const size = 24;
        if (shape === "circle") {
          ctx.fillStyle = "#4299c1";
          ctx.beginPath();
          ctx.arc(cx, cy, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#2c6e9e";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (shape === "square") {
          ctx.fillStyle = "#ecc94b";
          ctx.fillRect(cx - 12, cy - 12, 24, 24);
          ctx.strokeStyle = "#b7791f";
          ctx.strokeRect(cx - 12, cy - 12, 24, 24);
        } else if (shape === "triangle") {
          ctx.fillStyle = "#e53e3e";
          const triHeight = 20;
          const halfBase = 12;
          ctx.beginPath();
          ctx.moveTo(cx, cy - triHeight / 2);
          ctx.lineTo(cx - halfBase, cy + triHeight / 2);
          ctx.lineTo(cx + halfBase, cy + triHeight / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#9b2c2c";
          ctx.stroke();
        }
        continue;
      }
      if (body.label === "enemy") {
        const health = body.plugin?.health || 1;
        ctx.fillStyle = health < 1 ? "#b05c4a" : "#c44536";
        if (body.vertices) {
          ctx.beginPath();
          const verts = body.vertices;
          ctx.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++)
            ctx.lineTo(verts[i].x, verts[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#6b2c1f";
          ctx.stroke();
        } else {
          ctx.fillRect(
            body.bounds.min.x,
            body.bounds.min.y,
            body.bounds.max.x - body.bounds.min.x,
            body.bounds.max.y - body.bounds.min.y,
          );
        }
        ctx.fillStyle = "#ffe0b5";
        ctx.font = "bold 12px monospace";
        ctx.fillText(
          `${Math.ceil(health)}`,
          body.position.x - 8,
          body.position.y - 12,
        );
        continue;
      }
      if (body.label === "projectile") {
        ctx.fillStyle = body.render.fillStyle;
        ctx.strokeStyle = body.render.strokeStyle;
        ctx.lineWidth = 2;
        if (body.circleRadius) {
          ctx.beginPath();
          ctx.arc(
            body.position.x,
            body.position.y,
            body.circleRadius,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();
        } else if (body.vertices) {
          ctx.beginPath();
          const verts = body.vertices;
          ctx.moveTo(verts[0].x, verts[0].y);
          for (let i = 1; i < verts.length; i++)
            ctx.lineTo(verts[i].x, verts[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(
            body.bounds.min.x,
            body.bounds.min.y,
            body.bounds.max.x - body.bounds.min.x,
            body.bounds.max.y - body.bounds.min.y,
          );
        }
      }
    }

    // Draw aiming line (max drag 500)
    if (dragStart && dragCurrent && stateRef.current.gameStatus === "aiming") {
      const start = cannonPos.current;
      const end = dragCurrent;
      let dx = end.x - start.x;
      let dy = end.y - start.y;
      const maxDragDist = 800;
      const dist = Math.min(Math.hypot(dx, dy), maxDragDist);
      const angle = Math.atan2(dy, dx);
      const limitedX = start.x + Math.cos(angle) * dist;
      const limitedY = start.y + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(limitedX, limitedY);
      ctx.strokeStyle = "#f5f5dc";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      const power = dist / maxDragDist;
      ctx.fillStyle = `rgba(255, 200, 100, ${0.3 + power * 0.5})`;
      ctx.beginPath();
      ctx.arc(limitedX, limitedY, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    animationId.current = requestAnimationFrame(updatePhysicsAndDraw);
  }, [dragStart, dragCurrent]);

  // Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      worldBounds.current = { width, height };
      const engine = initWorld(width, height);
      setupCollisions(engine);
      loadLevel(engine, 1, width, height);
      engineRef.current = engine;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationId.current) cancelAnimationFrame(animationId.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, [initWorld, setupCollisions, loadLevel]);

  useEffect(() => {
    if (engineRef.current) {
      updatePhysicsAndDraw();
    }
    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [updatePhysicsAndDraw]);

  // Input handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (stateRef.current.gameStatus !== "aiming") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart || stateRef.current.gameStatus !== "aiming") {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !engineRef.current) return;
    const start = cannonPos.current;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    let dx = start.x - endX;
    let dy = start.y - endY;
    const maxDragDist = 500;
    const dist = Math.min(Math.hypot(dx, dy), maxDragDist);
    if (dist > 15) {
      const angle = Math.atan2(dy, dx);
      const power = dist / maxDragDist;
      const force = 50 * power + 20;
      const velX = Math.cos(angle) * force;
      const velY = Math.sin(angle) * force;
      fireProjectile(
        stateRef.current.currentShape,
        { x: velX, y: velY },
        engineRef.current,
      );
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  const selectShape = (shape: ShapeType) => {
    if (stateRef.current.gameStatus === "aiming") {
      setGameState((prev) => ({ ...prev, currentShape: shape }));
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") selectShape("circle");
      if (e.key === "2") selectShape("triangle");
      if (e.key === "3") selectShape("square");
      if (e.key === "r") resetGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resetGame]);

  useEffect(() => {
    const interval = setInterval(() => {
      const p = activeProjectile.current;
      if (p && stateRef.current.gameStatus === "firing") {
        const speed = Math.hypot(p.velocity.x, p.velocity.y);
        if (speed < 0.5 && p.angularSpeed < 0.05) {
          if (engineRef.current)
            Matter.World.remove(engineRef.current.world, p);
          activeProjectile.current = null;
          setGameState((prev) => {
            if (prev.enemiesRemaining === 0) return prev;
            return { ...prev, gameStatus: "aiming" };
          });
        }
      } else if (
        !p &&
        stateRef.current.gameStatus === "firing" &&
        stateRef.current.enemiesRemaining > 0
      ) {
        setGameState((prev) => ({ ...prev, gameStatus: "aiming" }));
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Render UI (unchanged but included for completeness)
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#1a2a32",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(0,0,0,0.7)",
          padding: "8px 16px",
          borderRadius: 12,
          color: "white",
          fontFamily: "monospace",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div>Score: {gameState.score}</div>
        <div>Level: {gameState.level}</div>
        <div>Shots: {gameState.shotsRemaining}</div>
        <div>Enemies: {gameState.enemiesRemaining}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          🔵 {Math.round(gameState.shapeDamageFactors.circle * 100)}%
          &nbsp;|&nbsp; 🔺{" "}
          {Math.round(gameState.shapeDamageFactors.triangle * 100)}%
          &nbsp;|&nbsp; 🟨{" "}
          {Math.round(gameState.shapeDamageFactors.square * 100)}%
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)",
          padding: "10px 20px",
          borderRadius: 40,
          display: "flex",
          gap: 20,
          pointerEvents: "auto",
          zIndex: 20,
        }}
      >
        <button
          onClick={() => selectShape("circle")}
          style={{
            background:
              gameState.currentShape === "circle" ? "#4299c1" : "#2c5282",
            border: "none",
            borderRadius: 40,
            padding: "8px 24px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          🔵 Circle
        </button>
        <button
          onClick={() => selectShape("triangle")}
          style={{
            background:
              gameState.currentShape === "triangle" ? "#e53e3e" : "#9b2c2c",
            border: "none",
            borderRadius: 40,
            padding: "8px 24px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          🔺 Triangle
        </button>
        <button
          onClick={() => selectShape("square")}
          style={{
            background:
              gameState.currentShape === "square" ? "#ecc94b" : "#b7791f",
            border: "none",
            borderRadius: 40,
            padding: "8px 24px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          🟨 Square
        </button>
        <button
          onClick={resetGame}
          style={{
            background: "#555",
            border: "none",
            borderRadius: 40,
            padding: "8px 20px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
      {gameState.gameStatus === "levelWin" && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "#000c",
            padding: "20px 40px",
            borderRadius: 24,
            textAlign: "center",
            color: "gold",
            fontFamily: "sans-serif",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          <h2>Level Cleared!</h2>
          <p>Enemies adapted...</p>
        </div>
      )}
      {gameState.gameStatus === "gameOver" && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "#000c",
            padding: "20px 40px",
            borderRadius: 24,
            textAlign: "center",
            color: "white",
            pointerEvents: "auto",
            zIndex: 30,
          }}
        >
          <h2>Game Over</h2>
          <p>Final Score: {gameState.score}</p>
          <button
            onClick={resetGame}
            style={{
              marginTop: 12,
              padding: "8px 20px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Play Again
          </button>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 16,
          color: "#aaa",
          fontSize: 12,
          fontFamily: "monospace",
          background: "rgba(0,0,0,0.5)",
          padding: "4px 8px",
          borderRadius: 8,
        }}
      >
        Drag from cannon | 1🔵 2🔺 3🟨 | R reset
      </div>
    </div>
  );
}
