"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface GameState {
  score: number;
  timeElapsed: number;
  blocksPlaced: number;
  towerHeight: number;
  gameActive: boolean;
  gameStarted: boolean;
  lastCombo: number;
  comboMultiplier: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  text?: string;
  size?: number;
}

export default function TowerOfAlmostStability() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const wallsRef = useRef<Matter.Body[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeElapsed: 0,
    blocksPlaced: 0,
    towerHeight: 0,
    gameActive: false,
    gameStarted: false,
    lastCombo: 0,
    comboMultiplier: 1,
  });

  const gravityDirectionRef = useRef(0);
  const gravityTimerRef = useRef(0);
  const windForceRef = useRef({ x: 0, y: 0 });
  const windTimerRef = useRef(0);
  const gameStartTimeRef = useRef(0);
  const lastBlockTimeRef = useRef(0);
  const gravityShakeRef = useRef(0);
  const blockColorRef = useRef(0);
  const lastScoreTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const Engine = Matter.Engine;
    const World = Matter.World;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;

    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;
    world.gravity.scale = 0.001;

    engineRef.current = engine;
    worldRef.current = world;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create walls
    const wallThickness = 50;
    const walls = [
      Bodies.rectangle(
        width / 2,
        -wallThickness / 2,
        width + 100,
        wallThickness,
        {
          isStatic: true,
          label: "wall",
        },
      ),
      Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width + 100,
        wallThickness,
        {
          isStatic: true,
          label: "wall",
        },
      ),
      Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height + 100,
        {
          isStatic: true,
          label: "wall",
        },
      ),
      Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height + 100,
        {
          isStatic: true,
          label: "wall",
        },
      ),
    ];

    walls.forEach((wall) => World.add(world, wall));
    wallsRef.current = walls;

    // Mouse move handler for preview
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // Block placement handler
    const handleCanvasClick = (e: MouseEvent) => {
      if (!gameState.gameStarted) {
        // Start game
        setGameState((prev) => ({
          ...prev,
          gameStarted: true,
          gameActive: true,
        }));
        gameStartTimeRef.current = Date.now();
        return;
      }

      if (!gameState.gameActive) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const blockSize = 35;
      const block = Bodies.rectangle(x, y, blockSize, blockSize, {
        friction: 0.6,
        restitution: 0.4,
        label: "block",
        density: 0.04,
      });

      World.add(world, block);
      bodiesRef.current.push(block);

      // Add particle effect
      for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 1,
        });
      }

      setGameState((prev) => ({
        ...prev,
        blocksPlaced: prev.blocksPlaced + 1,
      }));

      lastBlockTimeRef.current = Date.now();
    };

    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    // Main game loop
    const gameLoop = setInterval(() => {
      if (!gameState.gameStarted) return;

      Engine.update(engine);

      // Update gravity every 10 seconds
      gravityTimerRef.current += 1000 / 60;
      if (gravityTimerRef.current > 10000) {
        gravityTimerRef.current = 0;
        const newDirection = Math.floor(Math.random() * 4);
        gravityDirectionRef.current = newDirection;
        gravityShakeRef.current = 15;

        // Apply gravity rotation
        const gravityStrength = 1 + gameState.timeElapsed / 120;
        switch (newDirection) {
          case 0:
            world.gravity.x = 0;
            world.gravity.y = gravityStrength;
            break;
          case 1:
            world.gravity.x = -gravityStrength;
            world.gravity.y = 0;
            break;
          case 2:
            world.gravity.x = gravityStrength;
            world.gravity.y = 0;
            break;
          case 3:
            world.gravity.x = 0;
            world.gravity.y = -gravityStrength;
            break;
        }

        // Add gravity change particles
        for (let i = 0; i < 20; i++) {
          particlesRef.current.push({
            x: width / 2 + (Math.random() - 0.5) * 200,
            y: height / 2 + (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1,
            text: "GRAVITY!",
            size: 24,
          });
        }
      }

      // Apply wind forces
      windTimerRef.current += 1000 / 60;
      const windInterval = 3000 + Math.random() * 4000;
      if (windTimerRef.current > windInterval) {
        windTimerRef.current = 0;
        const windStrength = 0.0005 + (gameState.timeElapsed / 60000) * 0.0008;
        windForceRef.current = {
          x: (Math.random() - 0.5) * windStrength * 2,
          y: (Math.random() - 0.5) * windStrength * 0.5,
        };
      }

      // Apply wind to blocks
      bodiesRef.current.forEach((body) => {
        Body.applyForce(body, body.position, windForceRef.current);
      });

      // Remove blocks that fell off screen
      bodiesRef.current = bodiesRef.current.filter((body) => {
        if (
          body.position.y > height + 200 ||
          body.position.x < -100 ||
          body.position.x > width + 100
        ) {
          World.remove(world, body);
          return false;
        }
        return true;
      });

      // Calculate tower height
      let maxHeight = 0;
      bodiesRef.current.forEach((body) => {
        const bodyHeight = height - body.position.y;
        if (bodyHeight > maxHeight) maxHeight = bodyHeight;
      });

      // Update time and score
      const timeElapsed = Math.floor(
        (Date.now() - gameStartTimeRef.current) / 1000,
      );
      const baseScore =
        timeElapsed * 15 +
        gameState.blocksPlaced * 8 +
        Math.floor(maxHeight / 15);
      const score = Math.floor(baseScore * gameState.comboMultiplier);

      // Check game over
      const blocksInWorld = bodiesRef.current.length;
      if (
        blocksInWorld < gameState.blocksPlaced * 0.2 &&
        gameState.blocksPlaced > 8
      ) {
        setGameState((prev) => ({ ...prev, gameActive: false }));
      }

      setGameState((prev) => ({
        ...prev,
        timeElapsed,
        score,
        towerHeight: Math.max(0, maxHeight),
      }));

      // Update particles
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          life: p.life - 0.02,
        }))
        .filter((p) => p.life > 0);

      // RENDER
      ctx.fillStyle = "#0a0e27";
      ctx.fillRect(0, 0, width, height);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#1a1f4d");
      gradient.addColorStop(0.5, "#0f1535");
      gradient.addColorStop(1, "#050812");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Apply screen shake for gravity changes
      ctx.save();
      if (gravityShakeRef.current > 0) {
        const shake = gravityShakeRef.current;
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake,
        );
        gravityShakeRef.current -= 1;
      }

      // Draw blocks with better visuals
      bodiesRef.current.forEach((body, index) => {
        const vertices = body.vertices;
        const hue = (index * 45 + blockColorRef.current) % 360;
        ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;
        ctx.shadowColor = `hsl(${hue}, 85%, 25%)`;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // Draw border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw block preview at cursor
      if (gameState.gameStarted && gameState.gameActive) {
        const previewSize = 35;
        ctx.fillStyle = "rgba(100, 200, 255, 0.3)";
        ctx.fillRect(
          mouseRef.current.x - previewSize / 2,
          mouseRef.current.y - previewSize / 2,
          previewSize,
          previewSize,
        );
        ctx.strokeStyle = "rgba(100, 200, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          mouseRef.current.x - previewSize / 2,
          mouseRef.current.y - previewSize / 2,
          previewSize,
          previewSize,
        );
      }

      // Draw particles
      particlesRef.current.forEach((p) => {
        if (p.text) {
          ctx.fillStyle = `rgba(255, 255, 100, ${p.life})`;
          ctx.font = `bold ${p.size}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.fillStyle = `rgba(100, 200, 255, ${p.life * 0.8})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();

      // Draw UI Panel
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(15, 15, 320, 200);
      ctx.strokeStyle = "rgba(100, 200, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 15, 320, 200);

      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${gameState.score}`, 30, 50);

      ctx.fillStyle = "#ffaa00";
      ctx.font = "bold 20px Arial";
      ctx.fillText(`TIME: ${gameState.timeElapsed}s`, 30, 80);
      ctx.fillText(`BLOCKS: ${gameState.blocksPlaced}`, 30, 110);
      ctx.fillText(`HEIGHT: ${Math.floor(gameState.towerHeight)}px`, 30, 140);

      // Draw gravity indicator with animation
      const gravityLabels = ["↓ DOWN", "← LEFT", "→ RIGHT", "↑ UP"];
      ctx.fillStyle = "#ff6b9d";
      ctx.font = "bold 18px Arial";
      ctx.fillText(
        `GRAVITY: ${gravityLabels[gravityDirectionRef.current]}`,
        30,
        170,
      );

      // Draw wind indicator
      const windStrength =
        Math.abs(windForceRef.current.x) + Math.abs(windForceRef.current.y);
      ctx.fillStyle = windStrength > 0.0008 ? "#ff4444" : "#44ff44";
      ctx.font = "bold 16px Arial";
      ctx.fillText(
        `WIND: ${windStrength > 0.0008 ? "ACTIVE" : "calm"}`,
        30,
        195,
      );

      // Draw start screen
      if (!gameState.gameStarted) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 72px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TOWER OF ALMOST", width / 2, height / 2 - 100);
        ctx.fillText("STABILITY", width / 2, height / 2 - 20);

        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 32px Arial";
        ctx.fillText("Click to Start", width / 2, height / 2 + 80);

        ctx.fillStyle = "#aaaaaa";
        ctx.font = "20px Arial";
        ctx.fillText(
          "Build towers as gravity shifts every 10 seconds",
          width / 2,
          height / 2 + 140,
        );
        ctx.fillText(
          "Survive as long as possible",
          width / 2,
          height / 2 + 170,
        );
      }

      // Draw game over screen
      if (!gameState.gameActive && gameState.gameStarted) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TOWER COLLAPSED!", width / 2, height / 2 - 80);

        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 48px Arial";
        ctx.fillText(
          `FINAL SCORE: ${gameState.score}`,
          width / 2,
          height / 2 + 40,
        );

        ctx.fillStyle = "#00ff88";
        ctx.font = "bold 36px Arial";
        ctx.fillText(
          `Survived: ${gameState.timeElapsed}s`,
          width / 2,
          height / 2 + 100,
        );
        ctx.fillText(
          `Blocks Placed: ${gameState.blocksPlaced}`,
          width / 2,
          height / 2 + 150,
        );

        ctx.fillStyle = "#aaaaaa";
        ctx.font = "24px Arial";
        ctx.fillText("Refresh page to play again", width / 2, height / 2 + 220);
      }

      // Draw instructions
      if (gameState.gameStarted && gameState.gameActive) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "16px Arial";
        ctx.textAlign = "right";
        ctx.fillText("Click to place blocks", width - 30, height - 30);
      }

      blockColorRef.current += 0.5;
    }, 1000 / 60);

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(gameLoop);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    gameState.gameStarted,
    gameState.gameActive,
    gameState.blocksPlaced,
    gameState.timeElapsed,
    gameState.comboMultiplier,
  ]);

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col overflow-hidden">
      <canvas
        ref={canvasRef}
        className="flex-1 bg-gradient-to-b from-blue-950 to-black cursor-crosshair"
      />
    </div>
  );
}
