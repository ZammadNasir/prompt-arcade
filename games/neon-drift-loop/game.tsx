"use client";

/**

 * Neon Drift Loop

 * Prompt Arcade — endless neon tunnel survival racer

 * Pure Three.js, single self-contained component, no external assets.

 */

import { useEffect, useRef, useState } from "react";

import * as THREE from "three";

// ---------------------------------------------------------------------------

// Tunables

// ---------------------------------------------------------------------------

const RING_COUNT = 140;

const RING_SPACING = 2.4;

const BASE_RADIUS = 9.5;

const TIGHTEN_PROB = 0.14; // chance per recycled ring to be a narrow squeeze

const PLAYER_Z = 0;

const START_SPEED = 22;

const MAX_SPEED = 95;

const ACCELERATION = 1.6; // u/s^2

const LATERAL_ACCEL = 70; // u/s^2

const LATERAL_DAMP = 6; // higher = snappier stop

const MAX_OFFSET = BASE_RADIUS - 1.2;

const NEAR_MISS_DIST = 1.6; // distance-from-wall that awards bonus

const NEAR_MISS_BONUS = 25;

// ---------------------------------------------------------------------------

// Component

// ---------------------------------------------------------------------------

export default function NeonDriftLoop() {
  const mountRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState(0);

  const [best, setBest] = useState(0);

  const [running, setRunning] = useState(true);

  const [showHint, setShowHint] = useState(true);

  const [nearMissCount, setNearMissCount] = useState(0);

  // Mutable game state — read in render, written in animation loop.

  const stateRef = useRef({
    speed: START_SPEED,

    time: 0,

    px: 0,

    py: 0,

    vx: 0,

    vy: 0,

    score: 0,

    running: true,
  });

  // ----- Three.js setup & animation loop ----------------------------------

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) return;

    let w = mount.clientWidth;

    let h = mount.clientHeight;

    // ----- Scene / camera / renderer --------------------------------------

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x02000a);

    scene.fog = new THREE.FogExp2(0x02000a, 0.018);

    const camera = new THREE.PerspectiveCamera(86, w / h, 0.1, 500);

    camera.position.set(0, 0, PLAYER_Z);

    camera.lookAt(0, 0, -10);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setSize(w, h);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mount.appendChild(renderer.domElement);

    // ----- Player (glowing diamond) ---------------------------------------

    const playerGroup = new THREE.Group();

    const shipGeom = new THREE.OctahedronGeometry(0.55, 0);

    const shipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const ship = new THREE.Mesh(shipGeom, shipMat);

    playerGroup.add(ship);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 12, 12),

      new THREE.MeshBasicMaterial({
        color: 0x66ffff,

        transparent: true,

        opacity: 0.85,

        blending: THREE.AdditiveBlending,

        depthWrite: false,
      }),
    );

    playerGroup.add(innerGlow);

    const outerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 12, 12),

      new THREE.MeshBasicMaterial({
        color: 0x00d0ff,

        transparent: true,

        opacity: 0.28,

        blending: THREE.AdditiveBlending,

        depthWrite: false,
      }),
    );

    playerGroup.add(outerGlow);

    scene.add(playerGroup);

    // ----- Engine trail (additive cone behind player) ---------------------

    const trailLen = 5;

    const trailGeom = new THREE.ConeGeometry(0.7, trailLen, 12, 1, true);

    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xff00aa,

      transparent: true,

      opacity: 0.55,

      blending: THREE.AdditiveBlending,

      depthWrite: false,

      side: THREE.DoubleSide,
    });

    const trail = new THREE.Mesh(trailGeom, trailMat);

    trail.rotation.x = -Math.PI / 2;

    trail.position.z = trailLen / 2 + 0.6;

    playerGroup.add(trail);

    // ----- Rings ---------------------------------------------------------

    type RingData = {
      mesh: THREE.Mesh;

      z: number;

      radius: number;

      baseHue: number;

      wobblePhase: number;

      wobbleAmp: number;

      color: THREE.Color;
    };

    const rings: RingData[] = [];

    const ringGeom = new THREE.TorusGeometry(1, 0.07, 8, 72);

    const computeRadius = (idx: number): number => {
      // smooth low-freq wobble + occasional narrow squeeze

      const a = Math.sin(idx * 0.31) * 1.6;

      const b = Math.sin(idx * 0.13 + 1.7) * 1.2;

      const c = Math.sin(idx * 0.07 + 0.4) * 0.8;

      let r = BASE_RADIUS + a + b + c;

      // streak of narrowing every ~22 rings

      if (idx % 23 < 4) r -= 2.4;

      return Math.max(3.2, r);
    };

    for (let i = 0; i < RING_COUNT; i++) {
      const hue = (i * 0.012) % 1;

      const color = new THREE.Color().setHSL(hue, 1, 0.6);

      const mat = new THREE.MeshBasicMaterial({
        color,

        transparent: true,

        opacity: 0.95,

        blending: THREE.AdditiveBlending,

        depthWrite: false,
      });

      const mesh = new THREE.Mesh(ringGeom, mat);

      mesh.position.z = -i * RING_SPACING;

      scene.add(mesh);

      rings.push({
        mesh,

        z: -i * RING_SPACING,

        radius: computeRadius(i),

        baseHue: hue,

        wobblePhase: i * 0.4,

        wobbleAmp: 0.18 + Math.random() * 0.18,

        color: color.clone(),
      });
    }

    // ----- Stream particles inside the tunnel -----------------------------

    const PARTICLE_COUNT = 320;

    const partGeom = new THREE.BufferGeometry();

    const partPos = new Float32Array(PARTICLE_COUNT * 3);

    const partCol = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = Math.pow(Math.random(), 0.55) * (BASE_RADIUS - 0.5);

      const ang = Math.random() * Math.PI * 2;

      partPos[i * 3 + 0] = Math.cos(ang) * r;

      partPos[i * 3 + 1] = Math.sin(ang) * r;

      partPos[i * 3 + 2] = -Math.random() * 220;

      // two color clusters: cyan & magenta

      const cyan = Math.random() < 0.5;

      partCol[i * 3 + 0] = cyan ? 0.3 : 1.0;

      partCol[i * 3 + 1] = cyan ? 0.95 : 0.25;

      partCol[i * 3 + 2] = cyan ? 1.0 : 0.85;
    }

    partGeom.setAttribute("position", new THREE.BufferAttribute(partPos, 3));

    partGeom.setAttribute("color", new THREE.BufferAttribute(partCol, 3));

    const partMat = new THREE.PointsMaterial({
      size: 0.18,

      vertexColors: true,

      transparent: true,

      opacity: 0.85,

      blending: THREE.AdditiveBlending,

      depthWrite: false,
    });

    const particles = new THREE.Points(partGeom, partMat);

    scene.add(particles);

    // ----- Distant "horizon" glow disk ------------------------------------

    const horizonGeom = new THREE.RingGeometry(0.5, 30, 64);

    const horizonMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },

      vertexShader: /* glsl */ `

        varying vec2 vUv;

        void main() {

          vUv = uv;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        }

      `,

      fragmentShader: /* glsl */ `

        varying vec2 vUv;

        uniform float uTime;

        void main() {

          float d = length(vUv - 0.5) * 2.0;

          float a = pow(1.0 - clamp(d, 0.0, 1.0), 2.0);

          vec3 c = mix(vec3(1.0, 0.0, 0.7), vec3(0.2, 0.4, 1.0), 0.5 + 0.5 * sin(uTime * 0.6));

          gl_FragColor = vec4(c, a * 0.7);

        }

      `,

      transparent: true,

      blending: THREE.AdditiveBlending,

      depthWrite: false,

      side: THREE.DoubleSide,
    });

    const horizon = new THREE.Mesh(horizonGeom, horizonMat);

    horizon.position.z = -260;

    scene.add(horizon);

    // ----- Input ---------------------------------------------------------

    const keys = { left: false, right: false, up: false, down: false };

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":

        case "a":

        case "A":
          keys.left = true;

          break;

        case "ArrowRight":

        case "d":

        case "D":
          keys.right = true;

          break;

        case "ArrowUp":

        case "w":

        case "W":
          keys.up = true;

          break;

        case "ArrowDown":

        case "s":

        case "S":
          keys.down = true;

          break;

        case " ":

        case "Enter":
          if (!stateRef.current.running) restart();

          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":

        case "a":

        case "A":
          keys.left = false;

          break;

        case "ArrowRight":

        case "d":

        case "D":
          keys.right = false;

          break;

        case "ArrowUp":

        case "w":

        case "W":
          keys.up = false;

          break;

        case "ArrowDown":

        case "s":

        case "S":
          keys.down = false;

          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    window.addEventListener("keyup", onKeyUp);

    // ----- Restart --------------------------------------------------------

    const restart = () => {
      const s = stateRef.current;

      s.speed = START_SPEED;

      s.time = 0;

      s.px = 0;

      s.py = 0;

      s.vx = 0;

      s.vy = 0;

      s.score = 0;

      s.running = true;

      for (let i = 0; i < rings.length; i++) {
        const r = rings[i];

        r.z = -i * RING_SPACING;

        r.radius = computeRadius(i);

        r.mesh.position.z = r.z;

        r.mesh.scale.set(r.radius, r.radius, 1);
      }

      setRunning(true);

      setScore(0);

      setShowHint(true);
    };

    // expose for overlay

    (mount as unknown as { __restart: () => void }).__restart = restart;

    // ----- Animate --------------------------------------------------------

    const clock = new THREE.Clock();

    let raf = 0;

    const partAttr = particles.geometry.attributes
      .position as THREE.BufferAttribute;

    const WHITE = new THREE.Color(0xffffff);

    const CRASH_RED = new THREE.Color(0xff2266);

    const animate = () => {
      raf = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.05);

      const t = clock.elapsedTime;

      const s = stateRef.current;

      // ---- speed ramp ----

      if (s.running) {
        s.speed = Math.min(MAX_SPEED, s.speed + ACCELERATION * dt);

        s.time += dt;

        // ---- lateral input -> velocity ----

        const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

        const ay = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);

        s.vx += ax * LATERAL_ACCEL * dt;

        s.vy += ay * LATERAL_ACCEL * dt;

        // damp toward zero when no input

        s.vx *= Math.max(0, 1 - LATERAL_DAMP * dt);

        s.vy *= Math.max(0, 1 - LATERAL_DAMP * dt);

        // cap lateral speed

        const cap = 28;

        s.vx = Math.max(-cap, Math.min(cap, s.vx));

        s.vy = Math.max(-cap, Math.min(cap, s.vy));

        // integrate

        s.px += s.vx * dt;

        s.py += s.vy * dt;

        // clamp inside the tunnel

        s.px = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, s.px));

        s.py = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, s.py));
      }

      // ---- move rings forward ----

      const dz = s.running ? s.speed * dt : 0;

      let crashed = false;

      let nearMissThisFrame = false;

      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];

        ring.z += dz;

        if (ring.z > RING_SPACING) {
          // recycle to back

          ring.z -= RING_COUNT * RING_SPACING;

          const newIdx = Math.round(-ring.z / RING_SPACING);

          ring.radius = computeRadius(newIdx);

          // random extra tightening

          if (Math.random() < TIGHTEN_PROB) {
            ring.radius = Math.max(3.4, ring.radius - 2.8);
          }
        }

        // "breathing" — radius pulses subtly

        const breath = Math.sin(t * 1.8 + ring.wobblePhase) * ring.wobbleAmp;

        const r = ring.radius + breath;

        ring.mesh.position.z = ring.z;

        ring.mesh.scale.set(r, r, 1);

        // slow ring spin for visual interest

        ring.mesh.rotation.z = t * 0.18 + ring.wobblePhase * 0.04;

        // hue cycle over time

        const hue = (ring.baseHue + t * 0.04) % 1;

        (ring.mesh.material as THREE.MeshBasicMaterial).color.setHSL(
          hue,
          1,
          0.6,
        );

        // collision check near the player's z plane

        if (s.running && ring.z > -1.6 && ring.z < 1.6) {
          const dist = Math.sqrt(s.px * s.px + s.py * s.py);

          if (dist > r) {
            crashed = true;
          } else if (dist > r - NEAR_MISS_DIST) {
            nearMissThisFrame = true;
          }
        }
      }

      // ---- scoring ----

      if (s.running) {
        s.score += s.speed * dt * 0.5;

        if (nearMissThisFrame) {
          s.score += NEAR_MISS_BONUS;

          setNearMissCount((n) => n + 1);
        }

        if (s.score > 50 && showHint) setShowHint(false);

        setScore(Math.floor(s.score));
      }

      // ---- player visual ----

      if (s.running) {
        playerGroup.position.x = s.px;

        playerGroup.position.y = s.py;

        // bank/roll based on velocity

        playerGroup.rotation.z = -s.vx * 0.04;

        playerGroup.rotation.x = s.vy * 0.04;

        // camera sway follows player softly

        const camX = s.px * 0.35;

        const camY = s.py * 0.35 + Math.sin(t * 0.7) * 0.15;

        camera.position.x += (camX - camera.position.x) * 0.12;

        camera.position.y += (camY - camera.position.y) * 0.12;

        camera.lookAt(s.px * 0.6, s.py * 0.6, -20);
      } else {
        // crash: pull camera back, dim scene

        camera.position.z += (8 - camera.position.z) * 0.05;

        camera.lookAt(s.px, s.py, -10);
      }

      // ---- particles ----

      const arr = partAttr.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        arr[i * 3 + 2] += dz * 1.2;

        if (arr[i * 3 + 2] > 6) {
          arr[i * 3 + 2] -= 220;

          const r = Math.pow(Math.random(), 0.55) * (BASE_RADIUS - 0.5);

          const ang = Math.random() * Math.PI * 2;

          arr[i * 3 + 0] = Math.cos(ang) * r;

          arr[i * 3 + 1] = Math.sin(ang) * r;
        }
      }

      partAttr.needsUpdate = true;

      // ---- horizon shader ----

      (horizon.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

      // ---- crash settle ----

      if (crashed && s.running) {
        s.running = false;

        setRunning(false);

        setBest((b) => Math.max(b, Math.floor(s.score)));

        // visually halt player spin

        shipMat.color.copy(CRASH_RED);
      }

      // ---- ship color restore on run ----

      if (s.running) {
        shipMat.color.lerp(WHITE, 0.1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // ----- Resize ---------------------------------------------------------

    const onResize = () => {
      w = mount.clientWidth;

      h = mount.clientHeight;

      camera.aspect = w / h;

      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    // ----- Cleanup --------------------------------------------------------

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener("keydown", onKeyDown);

      window.removeEventListener("keyup", onKeyUp);

      window.removeEventListener("resize", onResize);

      try {
        mount.removeChild(renderer.domElement);
      } catch {
        /* already removed */
      }

      renderer.dispose();

      scene.traverse((obj: any) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();

          const m = obj.material;

          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
    };
  }, []);

  const handleRestart = () => {
    const mount = mountRef.current as unknown as {
      __restart?: () => void;
    } | null;

    mount?.__restart?.();
  };

  // ----- UI overlay -------------------------------------------------------

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none font-mono">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Top HUD */}

      <div className="pointer-events-none absolute top-4 left-4 right-4 flex justify-between z-10">
        <div className="text-white">
          <div className="text-[10px] tracking-[0.3em] opacity-50">SCORE</div>

          <div
            className="text-4xl font-black tracking-[0.18em] leading-none mt-1"
            style={{ textShadow: "0 0 10px #0ff, 0 0 22px #08f" }}
          >
            {String(score).padStart(6, "0")}
          </div>

          <div className="text-[10px] tracking-[0.3em] opacity-50 mt-3">
            NEAR MISS
          </div>

          <div
            className="text-lg font-bold tracking-widest"
            style={{ textShadow: "0 0 6px #f0f" }}
          >
            ×{String(nearMissCount).padStart(3, "0")}
          </div>
        </div>

        <div className="text-white text-right">
          <div className="text-[10px] tracking-[0.3em] opacity-50">BEST</div>

          <div
            className="text-4xl font-black tracking-[0.18em] leading-none mt-1"
            style={{ textShadow: "0 0 10px #f0f, 0 0 22px #a0f" }}
          >
            {String(best).padStart(6, "0")}
          </div>
        </div>
      </div>

      {/* Start hint */}

      {running && showHint && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-widest text-center z-10">
          <div>← → / A D &nbsp; DRIFT</div>

          <div className="mt-1">↑ ↓ / W S &nbsp; CLIMB / DIVE</div>

          <div className="mt-3 opacity-60">DON'T TOUCH THE WALLS</div>
        </div>
      )}

      {/* Crash overlay */}

      {!running && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{
            backdropFilter: "blur(2px)",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          <div className="text-center">
            <div className="text-[10px] tracking-[0.5em] text-pink-300/80">
              SYSTEM
            </div>

            <div
              className="text-7xl font-black tracking-[0.2em] my-2 text-white"
              style={{ textShadow: "0 0 18px #f0a, 0 0 38px #f0a" }}
            >
              WIPEOUT
            </div>

            <div className="mt-4 text-white/80 tracking-widest">
              FINAL SCORE{" "}
              <span
                className="text-cyan-300 font-bold ml-2"
                style={{ textShadow: "0 0 8px #0ff" }}
              >
                {String(score).padStart(6, "0")}
              </span>
            </div>

            <div className="mt-1 text-white/60 tracking-widest text-sm">
              NEAR MISS ×{String(nearMissCount).padStart(3, "0")}
            </div>

            {score >= best && score > 0 && (
              <div
                className="mt-2 text-pink-300 tracking-widest text-sm"
                style={{ textShadow: "0 0 6px #f0a" }}
              >
                ★ NEW BEST
              </div>
            )}

            <button
              onClick={handleRestart}
              className="mt-8 px-6 py-2 border border-cyan-300/60 text-cyan-200 tracking-[0.3em] text-sm hover:bg-cyan-300/10 hover:border-cyan-200 transition-colors pointer-events-auto"
              style={{ textShadow: "0 0 6px #0ff" }}
            >
              ► REBOOT
            </button>

            <div className="mt-3 text-white/40 text-[10px] tracking-widest">
              OR PRESS SPACE
            </div>
          </div>
        </div>
      )}

      {/* Vignette */}

      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}
