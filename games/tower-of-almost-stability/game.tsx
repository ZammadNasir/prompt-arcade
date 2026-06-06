"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface GameState {
  score: number;
  timeElapsed: number;
  blocksPlaced: number;
  towerHeight: number;
  gameActive: boolean;
}

export default function TowerOfAlmostStability() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const wallsRef = useRef<Matter.Body[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeElapsed: 0,
    blocksPlaced: 0,
    towerHeight: 0,
    gameActive: true,
  });

  const [gravityDirection, setGravityDirection] = useState(0); // 0=down, 1=left, 2=right, 3=up
  const gravityTimerRef = useRef(0);
  const windForceRef = useRef({ x: 0, y: 0 });
  const windTimerRef = useRef(0);
  const gameStartTimeRef = useRef(Date.now());
  const lastBlockTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize Matter.js
    const Engine = Matter.Engine;
    const World = Matter.World;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Events = Matter.Events;

    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;

    engineRef.current = engine;
    worldRef.current = world;

    // Set canvas size
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Create renderer
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create walls (boundaries)
    const wallThickness = 40;
    const walls = [
      Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
        isStatic: true,
        label: "wall",
      }),
      Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width,
        wallThickness,
        { isStatic: true, label: "wall" },
      ),
      Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, {
        isStatic: true,
        label: "wall",
      }),
      Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        { isStatic: true, label: "wall" },
      ),
    ];

    walls.forEach((wall) => World.add(world, wall));
    wallsRef.current = walls;

    // Block placement handler
    const handleCanvasClick = (e: MouseEvent) => {
      if (!gameState.gameActive) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create block
      const blockSize = 30;
      const block = Bodies.rectangle(x, y, blockSize, blockSize, {
        friction: 0.5,
        restitution: 0.3,
        label: "block",
      });

      World.add(world, block);
      bodiesRef.current.push(block);

      // Update game state
      setGameState((prev) => ({
        ...prev,
        blocksPlaced: prev.blocksPlaced + 1,
      }));

      lastBlockTimeRef.current = Date.now();
    };

    canvas.addEventListener("click", handleCanvasClick);

    // Game loop
    const gameLoop = setInterval(() => {
      Engine.update(engine);

      // Update gravity direction every 10 seconds
      gravityTimerRef.current += 1000 / 60; // ~60 FPS
      if (gravityTimerRef.current > 10000) {
        gravityTimerRef.current = 0;
        const newDirection = Math.floor(Math.random() * 4);
        setGravityDirection(newDirection);

        // Apply gravity rotation
        switch (newDirection) {
          case 0: // Down
            world.gravity.x = 0;
            world.gravity.y = 1;
            break;
          case 1: // Left
            world.gravity.x = -1;
            world.gravity.y = 0;
            break;
          case 2: // Right
            world.gravity.x = 1;
            world.gravity.y = 0;
            break;
          case 3: // Up
            world.gravity.x = 0;
            world.gravity.y = -1;
            break;
        }
      }

      // Apply wind forces periodically
      windTimerRef.current += 1000 / 60;
      if (windTimerRef.current > 3000 + Math.random() * 4000) {
        windTimerRef.current = 0;
        const windStrength = 0.001 + (gameState.timeElapsed / 60000) * 0.0005; // Increases over time
        windForceRef.current = {
          x: (Math.random() - 0.5) * windStrength,
          y: (Math.random() - 0.5) * windStrength * 0.3,
        };
      }

      // Apply wind force to blocks
      bodiesRef.current.forEach((body) => {
        Body.applyForce(body, body.position, windForceRef.current);
      });

      // Check for game over (too many blocks fallen)
      const blocksInWorld = bodiesRef.current.filter(
        (body) => body.position.y < height + 100,
      );
      if (
        blocksInWorld.length < bodiesRef.current.length * 0.3 &&
        gameState.blocksPlaced > 5
      ) {
        setGameState((prev) => ({ ...prev, gameActive: false }));
      }

      // Calculate tower height
      let maxHeight = 0;
      bodiesRef.current.forEach((body) => {
        const bodyHeight = height - body.position.y;
        if (bodyHeight > maxHeight) maxHeight = bodyHeight;
      });

      // Update game state
      const timeElapsed = Math.floor(
        (Date.now() - gameStartTimeRef.current) / 1000,
      );
      const score =
        timeElapsed * 10 +
        gameState.blocksPlaced * 5 +
        Math.floor(maxHeight / 10);

      setGameState((prev) => ({
        ...prev,
        timeElapsed,
        score,
        towerHeight: Math.max(0, maxHeight),
      }));

      // Render
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#16213e");
      gradient.addColorStop(1, "#0f3460");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw blocks
      bodiesRef.current.forEach((body, index) => {
        const vertices = body.vertices;
        ctx.fillStyle = `hsl(${(index * 30) % 360}, 70%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // Draw border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw walls
      ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
      walls.forEach((wall) => {
        const vertices = wall.vertices;
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();
      });

      // Draw UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(10, 10, 300, 150);

      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 24px Arial";
      ctx.fillText(`Score: ${gameState.score}`, 20, 40);
      ctx.fillText(`Time: ${gameState.timeElapsed}s`, 20, 70);
      ctx.fillText(`Blocks: ${gameState.blocksPlaced}`, 20, 100);
      ctx.fillText(`Height: ${Math.floor(gameState.towerHeight)}px`, 20, 130);

      // Draw gravity indicator
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "16px Arial";
      const gravityLabels = ["↓ Down", "← Left", "→ Right", "↑ Up"];
      ctx.fillText(`Gravity: ${gravityLabels[gravityDirection]}`, 20, 160);

      // Draw game over message
      if (!gameState.gameActive) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#ff0000";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TOWER COLLAPSED!", width / 2, height / 2 - 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px Arial";
        ctx.fillText(
          `Final Score: ${gameState.score}`,
          width / 2,
          height / 2 + 20,
        );
        ctx.fillText(
          `Survived: ${gameState.timeElapsed}s`,
          width / 2,
          height / 2 + 60,
        );
        ctx.textAlign = "left";
      }

      // Draw instructions
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "14px Arial";
      ctx.fillText("Click to place blocks", width - 200, height - 20);
    }, 1000 / 60); // 60 FPS

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(gameLoop);
      canvas.removeEventListener("click", handleCanvasClick);
      window.removeEventListener("resize", handleResize);
    };
  }, [gameState.gameActive, gameState.blocksPlaced, gameState.timeElapsed]);

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      <canvas
        ref={canvasRef}
        className="flex-1 bg-gradient-to-b from-blue-900 to-blue-950 cursor-crosshair"
      />
      {!gameState.gameActive && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handleReset}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
