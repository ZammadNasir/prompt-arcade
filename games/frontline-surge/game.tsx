"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// --- MAP & SPAWN CONFIGURATION ---
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
  { x: 1.5, z: 1.5 },
  { x: 14.5, z: 1.5 },
  { x: 1.5, z: 14.5 },
  { x: 14.5, z: 14.5 },
  { x: 8.5, z: 1.5 },
  { x: 8.5, z: 14.5 },
];

interface Enemy {
  id: number;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  flashTicks: number;
  isDead: boolean;
}

export default function FrontlineSurge3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React HUD State
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

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const flashLightRef = useRef<THREE.PointLight | null>(null);
  const weaponGroupRef = useRef<THREE.Group | null>(null);

  // High frequency input vectors
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const enemiesRef = useRef<Enemy[]>([]);
  const nextEnemyId = useRef(0);
  const lastShotTime = useRef(0);
  const isShootingRef = useRef(false);
  const muzzleFlashTicksRef = useRef(0);

  // Pointer lock state listeners
  useEffect(() => {
    const handleLockChange = () => {
      setPointerLocked(document.pointerLockElement === canvasRef.current);
    };
    document.addEventListener("pointerlockchange", handleLockChange);
    return () =>
      document.removeEventListener("pointerlockchange", handleLockChange);
  }, []);

  const lockPointer = () => {
    canvasRef.current?.requestPointerLock();
  };

  // Build Procedural Humanoid Robot Mesh
  const createHumanoidMesh = (color: number) => {
    const group = new THREE.Group();

    // Materials
    const armorMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.7,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
    });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Torso Chassis
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.3),
      armorMat,
    );
    torso.position.y = 0.85;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.26, 0.24),
      armorMat,
    );
    head.position.y = 1.35;
    group.add(head);

    // Tactical Visor Eye Line
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.05, 0.06),
      visorMat,
    );
    visor.position.set(0, 1.36, 0.11);
    group.add(visor);

    // Left Arm Configuration
    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35),
      frameMat,
    );
    leftUpperArm.position.set(-0.35, 0.85, 0);
    leftUpperArm.rotation.z = Math.PI / 12;
    group.add(leftUpperArm);

    const leftShoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.15),
      armorMat,
    );
    leftShoulder.position.set(-0.32, 1.0, 0);
    group.add(leftShoulder);

    // Right Arm Configuration (Forward Threat Pose)
    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35),
      frameMat,
    );
    rightUpperArm.position.set(0.35, 0.85, 0.1);
    rightUpperArm.rotation.x = -Math.PI / 3;
    group.add(rightUpperArm);

    const rightShoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.15),
      armorMat,
    );
    rightShoulder.position.set(0.32, 1.0, 0);
    group.add(rightShoulder);

    // Lower Leg Plating (As single robust stabilization block)
    const legs = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.5, 0.25),
      frameMat,
    );
    legs.position.y = 0.25;
    group.add(legs);

    // Apply global shadows cast capacities
    group.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    return group;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x10141c);
    scene.fog = new THREE.FogExp2(0x10141c, 0.02);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.rotation.order = "YXZ";
    camera.position.set(2, 1.7, 2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Modern Three.js color management
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Make scene brighter
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    rendererRef.current = renderer;

    // =========================
    // LIGHTING
    // =========================

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 1.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(10, 20, 10);

    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;

    scene.add(dirLight);

    // =========================
    // FLASHLIGHT
    // =========================

    const flashlight = new THREE.SpotLight(
      0xffffff,
      8,
      15,
      Math.PI / 5,
      0.4,
      1,
    );

    flashlight.castShadow = true;
    scene.add(flashlight);

    const flashlightTarget = new THREE.Object3D();
    scene.add(flashlightTarget);

    flashlight.target = flashlightTarget;

    // Muzzle flash light
    const flashLight = new THREE.PointLight(0xffaa44, 0, 8);
    scene.add(flashLight);
    flashLightRef.current = flashLight;

    // =========================
    // MATERIALS
    // =========================

    const wallGeo = new THREE.BoxGeometry(1, 3, 1);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x555a66,
      roughness: 0.55,
      metalness: 0.15,
    });

    const floorGeo = new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f48,
      roughness: 0.8,
      metalness: 0,
    });

    // =========================
    // FLOOR
    // =========================

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(MAP_WIDTH / 2, 0, MAP_HEIGHT / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // =========================
    // CEILING
    // =========================

    const ceiling = new THREE.Mesh(
      floorGeo,
      new THREE.MeshStandardMaterial({
        color: 0x40454f,
        roughness: 0.8,
      }),
    );

    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(MAP_WIDTH / 2, 3, MAP_HEIGHT / 2);

    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // =========================
    // WALLS
    // =========================

    for (let z = 0; z < MAP_HEIGHT; z++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (MAP[z][x] === 1) {
          const wallMesh = new THREE.Mesh(wallGeo, wallMat);

          wallMesh.position.set(x + 0.5, 1.5, z + 0.5);

          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;

          scene.add(wallMesh);
        }
      }
    }

    // =========================
    // WEAPON MODEL
    // =========================

    const weaponGroup = new THREE.Group();

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x6f7788,
      roughness: 0.3,
      metalness: 0.9,
    });

    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 16);

    const barrel = new THREE.Mesh(barrelGeo, ironMat);

    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.18, -0.22, -0.45);

    weaponGroup.add(barrel);

    const receiver = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.3),
      ironMat,
    );

    receiver.position.set(0.18, -0.2, -0.25);

    weaponGroup.add(receiver);

    scene.add(weaponGroup);

    weaponGroupRef.current = weaponGroup;

    // =========================
    // RESIZE
    // =========================

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current)
        return;

      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(w, h);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);

      renderer.dispose();
    };
  }, []);

  // Sync Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "PLAYING") return;
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;
      // Avoid calling reloadWeapon before its declaration (some builds choke)
      if (key === "r") {
        if (ammo !== maxAmmo && !isReloading) {
          setIsReloading(true);
          setTimeout(() => {
            setAmmo(maxAmmo);
            setIsReloading(false);
          }, 1200);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (
        gameState !== "PLAYING" ||
        document.pointerLockElement !== canvasRef.current ||
        !cameraRef.current
      )
        return;

      const sensitivity = 0.0022;
      // Handle Left/Right (Yaw)
      cameraRef.current.rotation.y -= e.movementX * sensitivity;
      // Handle Up/Down (Pitch) -> Directly fixes your limitation
      cameraRef.current.rotation.x -= e.movementY * sensitivity;

      // Lock boundaries to prevent looking behind overhead
      cameraRef.current.rotation.x = Math.max(
        -Math.PI / 2.3,
        Math.min(Math.PI / 2.3, cameraRef.current.rotation.x),
      );
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameState !== "PLAYING") return;
      if (document.pointerLockElement !== canvasRef.current) {
        lockPointer();
        return;
      }
      if (e.button === 0) isShootingRef.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isShootingRef.current = false;
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
  }, [gameState, ammo, isReloading]);

  const startGame = () => {
    setHealth(100);
    setAmmo(30);
    setWave(1);
    setScore(0);
    setIsReloading(false);

    if (cameraRef.current && sceneRef.current) {
      cameraRef.current.position.set(8.5, 1.2, 8.5);
      cameraRef.current.rotation.set(0, -Math.PI / 2, 0);

      // Clear existing models
      enemiesRef.current.forEach((e) => sceneRef.current?.remove(e.mesh));
      enemiesRef.current = [];
      generateWave(1);
    }

    setGameState("PLAYING");
    setTimeout(() => lockPointer(), 50);
  };

  const generateWave = (waveNum: number) => {
    if (!sceneRef.current) return;

    const spawnCount = 3 + waveNum * 2;
    const enemyHealth = 40 + waveNum * 10;
    const moveSpeed = 0.02 + Math.min(waveNum * 0.004, 0.03);

    const activeEnemies: Enemy[] = [];
    for (let i = 0; i < spawnCount; i++) {
      const point =
        SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
      const scatterX = (Math.random() - 0.5) * 0.5;
      const scatterZ = (Math.random() - 0.5) * 0.5;

      // Instantiate structural mesh group
      const botMesh = createHumanoidMesh(0x5c6970);
      botMesh.position.set(point.x + scatterX, 0, point.z + scatterZ);
      sceneRef.current.add(botMesh);

      activeEnemies.push({
        id: nextEnemyId.current++,
        mesh: botMesh,
        health: enemyHealth,
        maxHealth: enemyHealth,
        speed: moveSpeed,
        flashTicks: 0,
        isDead: false,
      });
    }

    enemiesRef.current = activeEnemies;
    setEnemiesRemaining(activeEnemies.length);
  };

  const startIntermission = (nextWave: number) => {
    setGameState("INTERMISSION");
    setIntermissionCount(3);
    setHealth((prev) => Math.min(100, prev + 30));
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

  // Simulation Loop Frame Handling
  useEffect(() => {
    let frameId: number;

    const processFrame = () => {
      if (gameState === "PLAYING" && cameraRef.current && sceneRef.current) {
        updatePlayerVelocity();
        updateHostileAI();
        updateTacticalFiring();
      }

      // Render updated frame
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Lock gun placement directly in alignment with the viewport camera transformation matrix
        if (weaponGroupRef.current) {
          const weapon = weaponGroupRef.current;
          weapon.position.copy(cameraRef.current.position);
          weapon.rotation.copy(cameraRef.current.rotation);

          // Apply kinetic idle sway matrix calculation
          const t = performance.now() * 0.004;
          const moving =
            keysRef.current["w"] ||
            keysRef.current["s"] ||
            keysRef.current["a"] ||
            keysRef.current["d"];
          if (moving) {
            weapon.translateX(Math.sin(t * 2) * 0.015);
            weapon.translateY(Math.abs(Math.cos(t * 2)) * 0.01);
          } else {
            weapon.translateY(Math.sin(t) * 0.003);
          }

          if (isReloading) {
            weapon.translateY(-0.15); // Drop firearm during reload cycle
            weapon.rotation.z +=
              Math.sin(((performance.now() % 1200) / 1200) * Math.PI) * 0.2;
          }
        }

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      frameId = requestAnimationFrame(processFrame);
    };

    const updatePlayerVelocity = () => {
      const camera = cameraRef.current!;
      const speed = keysRef.current["shift"] ? 0.07 : 0.045;

      const fwdVector = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion,
      );
      fwdVector.y = 0;
      fwdVector.normalize();

      const sideVector = new THREE.Vector3(1, 0, 0).applyQuaternion(
        camera.quaternion,
      );
      sideVector.y = 0;
      sideVector.normalize();

      let moveX = 0;
      let moveZ = 0;

      if (keysRef.current["w"]) {
        moveX += fwdVector.x * speed;
        moveZ += fwdVector.z * speed;
      }
      if (keysRef.current["s"]) {
        moveX -= fwdVector.x * speed;
        moveZ -= fwdVector.z * speed;
      }
      if (keysRef.current["a"]) {
        moveX -= sideVector.x * speed;
        moveZ -= sideVector.z * speed;
      }
      if (keysRef.current["d"]) {
        moveX += sideVector.x * speed;
        moveZ += sideVector.z * speed;
      }

      // Map Grid Edge Collision Checking
      const buffer = 0.25;
      const targetX = camera.position.x + moveX;
      const targetZ = camera.position.z + moveZ;

      const boundX = moveX > 0 ? buffer : -buffer;
      if (
        MAP[Math.floor(camera.position.z)][Math.floor(targetX + boundX)] === 0
      ) {
        camera.position.x = targetX;
      }
      const boundZ = moveZ > 0 ? buffer : -buffer;
      if (
        MAP[Math.floor(targetZ + boundZ)][Math.floor(camera.position.x)] === 0
      ) {
        camera.position.z = targetZ;
      }
    };

    const updateHostileAI = () => {
      const camera = cameraRef.current!;
      const activeBots = enemiesRef.current.filter((e) => !e.isDead);

      activeBots.forEach((bot) => {
        if (bot.flashTicks > 0) {
          bot.flashTicks--;
          if (bot.flashTicks === 0) {
            // Restore default gray armor tint
            bot.mesh.traverse((n) => {
              if (n instanceof THREE.Mesh && n.material.color)
                n.material.color.setHex(0x5c6970);
            });
          }
        }

        const dx = camera.position.x - bot.mesh.position.x;
        const dz = camera.position.z - bot.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        // Turn tracking loop toward player positioning
        bot.mesh.lookAt(
          camera.position.x,
          bot.mesh.position.y,
          camera.position.z,
        );

        if (dist > 0.45) {
          const stepX = (dx / dist) * bot.speed;
          const stepZ = (dz / dist) * bot.speed;

          if (
            MAP[Math.floor(bot.mesh.position.z)][
            Math.floor(bot.mesh.position.x + stepX)
            ] === 0
          )
            bot.mesh.position.x += stepX;
          if (
            MAP[Math.floor(bot.mesh.position.z + stepZ)][
            Math.floor(bot.mesh.position.x)
            ] === 0
          )
            bot.mesh.position.z += stepZ;
        } else {
          // Continuous proximity payload strike
          setHealth((prev) => {
            const current = prev - 0.4;
            if (current <= 0) {
              setGameState("GAMEOVER");
              try {
                document.exitPointerLock();
              } catch { }
              return 0;
            }
            return current;
          });
        }
      });
    };

    const updateTacticalFiring = () => {
      if (muzzleFlashTicksRef.current > 0) {
        muzzleFlashTicksRef.current--;
        if (muzzleFlashTicksRef.current === 0 && flashLightRef.current) {
          flashLightRef.current.intensity = 0;
        }
      }

      if (!isShootingRef.current || isReloading || ammo <= 0) return;

      const now = performance.now();
      if (now - lastShotTime.current < 110) return; // Fire rate threshold
      lastShotTime.current = now;

      setAmmo((prev) => {
        const next = prev - 1;
        if (next === 0) setTimeout(() => reloadWeapon(), 150);
        return next;
      });

      // Illuminate environment with muzzle point-light flash
      if (flashLightRef.current && cameraRef.current) {
        flashLightRef.current.position.copy(cameraRef.current.position);
        flashLightRef.current.intensity = 15;
        muzzleFlashTicksRef.current = 2;
      }

      // Three.js Raycaster replaces inaccurate screen center math
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current!);

      const targets = enemiesRef.current.filter((e) => !e.isDead);
      let closestHitBot: Enemy | null = null;
      let minDistance = Infinity;

      targets.forEach((bot) => {
        // Collect intersections within the child meshes inside the enemy Group object
        const intersects = raycaster.intersectObjects(bot.mesh.children);
        if (intersects.length > 0 && intersects[0].distance < minDistance) {
          minDistance = intersects[0].distance;
          closestHitBot = bot;
        }
      });

      if (closestHitBot) {
        const bot = closestHitBot as Enemy;
        bot.health -= 20;
        bot.flashTicks = 3;

        // Flash target silhouette red
        bot.mesh.traverse((n) => {
          if (n instanceof THREE.Mesh && n.material.color)
            n.material.color.setHex(0xff3333);
        });

        if (bot.health <= 0) {
          bot.isDead = true;
          sceneRef.current?.remove(bot.mesh);
          setScore((prev) => prev + 150);

          const totalLeft = enemiesRef.current.filter((e) => !e.isDead).length;
          setEnemiesRemaining(totalLeft);

          if (totalLeft === 0) {
            startIntermission(wave + 1);
          }
        }
      }
    };

    frameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, wave, ammo, isReloading]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-slate-950 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />

      {/* --- HUD OVERLAYS --- */}
      {gameState === "PLAYING" && (
        <>
          {/* Tactical Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            <div className="w-5 h-[2px] bg-cyan-400/70 absolute" />
            <div className="h-5 w-[2px] bg-cyan-400/70 absolute" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
          </div>

          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur px-5 py-3 rounded-md min-w-[220px]">
              <div className="flex justify-between items-center mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>VITAL SIGNS</span>
                <span
                  className={
                    health < 30
                      ? "text-red-500 animate-pulse font-black"
                      : "text-cyan-400"
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
              <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-0.5">
                TACTICAL AREA
              </div>
              <div className="text-2xl font-black text-white">WAVE {wave}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                SYNTHS LEFT:{" "}
                <span className="text-amber-400">{enemiesRemaining}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/50 backdrop-blur px-5 py-3 rounded-md min-w-[140px] text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                SCORE
              </div>
              <div className="text-xl font-mono font-black text-amber-400">
                {score.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 bg-slate-900/80 border border-slate-700/50 backdrop-blur px-6 py-4 rounded-md text-white min-w-[180px] text-right pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">
              ENERGY CARTRIDGE
            </div>
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span
                className={`text-4xl font-black ${ammo === 0 ? "text-red-500 animate-pulse" : "text-white"}`}
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
                CYCLE CHARGE...
              </div>
            ) : ammo === 0 ? (
              <div className="text-[11px] font-black tracking-wider text-red-500 uppercase animate-pulse mt-1">
                PRESS [R] TO RELOAD
              </div>
            ) : null}
          </div>

          {!pointerLocked && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold px-4 py-1.5 text-xs tracking-wider uppercase rounded shadow-lg animate-bounce">
              Click Canvas Area to Re-Lock Camera Aiming
            </div>
          )}
        </>
      )}

      {/* --- MENUS --- */}
      {gameState === "START" && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white px-4 z-50">
          <div className="max-w-md w-full text-center border border-slate-800 bg-slate-900/50 p-8 rounded-xl backdrop-blur-md shadow-2xl">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              FRONTLINE SURGE 3D
            </h1>
            <p className="text-slate-400 text-sm tracking-wide mb-8">
              Hardware-Accelerated WebGL Tactical Simulation Architecture
            </p>

            <button
              onClick={startGame}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-wider uppercase py-4 px-6 rounded-lg transition text-sm shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              INITIALIZE INTERFACE VECTOR
            </button>
          </div>
        </div>
      )}

      {gameState === "INTERMISSION" && (
        <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none z-50">
          <div className="text-center animate-pulse">
            <h2 className="text-cyan-400 text-sm font-black tracking-widest uppercase mb-1">
              CLEARED SECTION
            </h2>
            <h1 className="text-5xl font-black tracking-tight mb-2">
              NEXT SURGE RE-ENGAGING
            </h1>
            <p className="text-slate-300 text-xs tracking-wider uppercase">
              System calibration updates starting in{" "}
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
            <h1 className="text-3xl font-black tracking-tight text-red-500 uppercase mb-1">
              CONNECTION TERMINATED
            </h1>
            <p className="text-slate-400 text-xs tracking-wide mb-6">
              Biometric core vitals collapsed.
            </p>

            <button
              onClick={startGame}
              className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black tracking-wider uppercase py-3 px-5 rounded-lg text-xs transition cursor-pointer"
            >
              REBOOT SYSTEM CORES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
