"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

export default function MountainDrift() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const { Engine, World, Bodies, Body, Constraint, Events } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.2 },
    });

    const world = engine.world;

    let cameraX = 0;
    let running = true;

    const keys = { left: false, right: false };

    // ✅ stronger damping fixes drift
    const chassis = Bodies.rectangle(300, 300, 100, 35, {
      friction: 0.9,
      frictionAir: 0.03,
      density: 0.002,
    });

    const wheelA = Bodies.circle(270, 335, 26, {
      friction: 1.2,
      frictionAir: 0.02,
      density: 0.002,
    });

    const wheelB = Bodies.circle(330, 335, 26, {
      friction: 1.2,
      frictionAir: 0.02,
      density: 0.002,
    });

    const suspensionA = Constraint.create({
      bodyA: chassis,
      bodyB: wheelA,
      pointA: { x: -35, y: 10 },
      stiffness: 0.55,
      damping: 0.2,
      length: 28,
    });

    const suspensionB = Constraint.create({
      bodyA: chassis,
      bodyB: wheelB,
      pointA: { x: 35, y: 10 },
      stiffness: 0.55,
      damping: 0.2,
      length: 28,
    });

    World.add(world, [chassis, wheelA, wheelB, suspensionA, suspensionB]);

    // ---------------- TERRAIN ----------------
    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];

    let x = -500;
    let y = height * 0.7;
    const groundBodies: Matter.Body[] = [];

    for (let i = 0; i < 250; i++) {
      const x2 = x + 120;
      const y2 = y + (Math.random() * 2 - 1) * 60;

      const clampedY = Math.max(height * 0.35, Math.min(height * 0.85, y2));

      // ✅ PHYSICS ground (THIS FIXES FALLING)
      const ground = Bodies.rectangle(
        (x + x2) / 2,
        (y + clampedY) / 2,
        120,
        40,
        {
          isStatic: true,
          friction: 1,
          render: { visible: false },
        },
      );

      groundBodies.push(ground);
      World.add(world, ground);

      segments.push({ x1: x, y1: y, x2, y2: clampedY });

      x = x2;
      y = clampedY;
    }

    // ---------------- GAME STATE ----------------
    let fuel = 100;
    let distance = 0;
    let coinCount = 0;
    let score = 0;

    const HIGH = "md_high";
    let high = Number(localStorage.getItem(HIGH) || 0);

    const coins = Array.from({ length: 80 }).map((_, i) => ({
      x: 400 + i * 140,
      y: height * 0.5 - Math.random() * 200,
      collected: false,
    }));

    // ---------------- INPUT ----------------
    window.addEventListener("keydown", (e) => {
      if (e.key === "a" || e.key === "ArrowLeft") keys.left = true;
      if (e.key === "d" || e.key === "ArrowRight") keys.right = true;
      if (e.key.toLowerCase() === "r") window.location.reload();
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === "a" || e.key === "ArrowLeft") keys.left = false;
      if (e.key === "d" || e.key === "ArrowRight") keys.right = false;
    });

    const endGame = () => {
      if (gameOver) return;
      setGameOver(true);
      if (score > high) localStorage.setItem(HIGH, String(score));
    };

    // ---------------- UPDATE LOOP ----------------
    Events.on(engine, "beforeUpdate", () => {
      if (gameOver) return;

      const force = 0.0035;
      const wheelTorque = 0.18;

      if (keys.right) {
        Body.setAngularVelocity(
          wheelA,
          Math.min(wheelA.angularVelocity + wheelTorque, 1.8)
        );

        Body.setAngularVelocity(
          wheelB,
          Math.min(wheelB.angularVelocity + wheelTorque, 1.8)
        );

        fuel -= 0.02;
      }

      if (keys.left) {
        Body.setAngularVelocity(
          wheelA,
          Math.max(wheelA.angularVelocity - wheelTorque, -1.8)
        );

        Body.setAngularVelocity(
          wheelB,
          Math.max(wheelB.angularVelocity - wheelTorque, -1.8)
        );

        fuel -= 0.015;
      }

      distance = Math.max(distance, Math.floor(chassis.position.x / 10));
      score = distance + coinCount * 50;

      if (fuel <= 0) endGame();

      // flip detection
      const headY = chassis.position.y - 20;
      if (Math.abs(chassis.angle) > 1.8 && headY > height - 10) {
        endGame();
      }

      // coin collision
      coins.forEach((c) => {
        if (c.collected) return;
        const d = Math.hypot(
          c.x - chassis.position.x,
          c.y - chassis.position.y,
        );
        if (d < 45) {
          c.collected = true;
          coinCount++;
        }
      });
    });

    // ---------------- RENDER ----------------
    const draw = () => {
      if (!running) return;

      Engine.update(engine, 16.6);

      cameraX += (chassis.position.x - width * 0.3 - cameraX) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#74c0fc");
      sky.addColorStop(1, "#d0ebff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // ---------------- TERRAIN (FIXED) ----------------
      ctx.save();
      ctx.translate(-cameraX, 0);

      segments.forEach((s) => {
        const thickness = 60;

        ctx.fillStyle = "#2f9e44";

        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.lineTo(s.x2, s.y2 + thickness);
        ctx.lineTo(s.x1, s.y1 + thickness);
        ctx.closePath();
        ctx.fill();
      });

      // coins
      coins.forEach((c) => {
        if (c.collected) return;
        ctx.fillStyle = "#ffd43b";
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // ---------------- VEHICLE (FIXED VISIBILITY) ----------------
      const drawBody = (b: Matter.Body, color: string) => {
        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        ctx.rotate(b.angle);

        ctx.fillStyle = color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;

        if (b.circleRadius) {
          ctx.beginPath();
          ctx.arc(0, 0, b.circleRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          const v = b.vertices;
          ctx.beginPath();
          ctx.moveTo(v[0].x - b.position.x, v[0].y - b.position.y);
          for (let i = 1; i < v.length; i++) {
            ctx.lineTo(v[i].x - b.position.x, v[i].y - b.position.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      };

      drawBody(chassis, "#495057");
      drawBody(wheelA, "#212529");
      drawBody(wheelB, "#212529");

      ctx.restore();

      // ---------------- HUD ----------------
      ctx.fillStyle = "#000";
      ctx.font = "16px sans-serif";

      ctx.fillText(`Distance: ${distance}`, 20, 30);
      ctx.fillText(`Coins: ${coinCount}`, 20, 55);
      ctx.fillText(`Score: ${score}`, 20, 80);
      ctx.fillText(`Fuel: ${Math.floor(fuel)}%`, 20, 105);

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "40px sans-serif";
        ctx.fillText("GAME OVER", width / 2, height / 2);
      }

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", resize);

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  }, [gameOver]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
