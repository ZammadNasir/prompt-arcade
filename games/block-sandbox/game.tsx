"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export default function BlockSandboxGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedBlock, setSelectedBlockState] = useState(1);
  const selectedBlockRef = useRef(1);
  const [isLocked, setIsLocked] = useState(false);

  const blocks = useRef(
    new Map<string, { type: number; x: number; y: number; z: number }>(),
  );
  const blockMeshes = useRef<THREE.InstancedMesh[]>([]);
  const controls = useRef<PointerLockControls | null>(null);
  const velocity = useRef(new THREE.Vector3());
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  const canJump = useRef(false);
  const clock = useRef(new THREE.Clock());
  const raycaster = useRef(new THREE.Raycaster());
  const highlightBox = useRef<THREE.LineSegments | null>(null);

  const blockNames = [
    "Grass",
    "Dirt",
    "Stone",
    "Wood",
    "Brick",
    "Sand",
    "Leaves",
  ];
  const blockColors = [
    0x567d46, 0x5d4037, 0x757575, 0x3e2723, 0x8d6e63, 0xe6c96c, 0x3a5f0b,
  ];

  const setSelectedBlock = (val: number) => {
    selectedBlockRef.current = val;
    setSelectedBlockState(val);
  };

  const generateTerrain = () => {
    const newBlocks = new Map<
      string,
      { type: number; x: number; y: number; z: number }
    >();
    const size = 40; // Larger world

    for (let x = -size; x <= size; x++) {
      for (let z = -size; z <= size; z++) {
        // Simple heightmap
        const height = Math.floor(
          Math.sin(x * 0.1) * 2 + Math.cos(z * 0.1) * 2,
        );

        // Fill down to bedrock
        for (let y = -3; y <= height; y++) {
          let blockType = 3; // Stone
          if (y === height)
            blockType = 1; // Grass
          else if (y > height - 3) blockType = 2; // Dirt

          newBlocks.set(`${x},${y},${z}`, { type: blockType, x, y, z });
        }

        // Add trees
        if (Math.random() < 0.015 && Math.abs(x) < 35 && Math.abs(z) < 35) {
          const treeY = height + 1;
          // Trunk
          for (let ty = 0; ty < 4; ty++) {
            newBlocks.set(`${x},${treeY + ty},${z}`, {
              type: 4,
              x,
              y: treeY + ty,
              z,
            });
          }
          // Leaves
          for (let lx = -2; lx <= 2; lx++) {
            for (let lz = -2; lz <= 2; lz++) {
              for (let ly = 3; ly <= 5; ly++) {
                if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly - 4) < 4) {
                  const key = `${x + lx},${treeY + ly},${z + lz}`;
                  if (!newBlocks.has(key)) {
                    newBlocks.set(key, {
                      type: 7,
                      x: x + lx,
                      y: treeY + ly,
                      z: z + lz,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    return newBlocks;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const ctrl = new PointerLockControls(camera, document.body);
    controls.current = ctrl;

    ctrl.addEventListener("lock", () => setIsLocked(true));
    ctrl.addEventListener("unlock", () => setIsLocked(false));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Block meshes
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = blockColors.map(
      (color) => new THREE.MeshLambertMaterial({ color }),
    );

    const meshes: THREE.InstancedMesh[] = [];
    materials.forEach((mat, i) => {
      const mesh = new THREE.InstancedMesh(geometry, mat, 20000);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(mesh);
      meshes.push(mesh);
    });
    blockMeshes.current = meshes;

    // Highlight box for targeting
    const highlightGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const highlightEdges = new THREE.EdgesGeometry(highlightGeo);
    const highlightMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
    });
    const highlight = new THREE.LineSegments(highlightEdges, highlightMat);
    highlight.visible = false;
    scene.add(highlight);
    highlightBox.current = highlight;

    // Generate world
    blocks.current = generateTerrain();

    const updateMeshes = () => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      blocks.current.forEach((b) => {
        if (b.type >= 1 && b.type <= 7) counts[b.type - 1]++;
      });

      blockMeshes.current.forEach((mesh, i) => {
        mesh.count = counts[i];
      });

      const indices = [0, 0, 0, 0, 0, 0, 0];
      const dummy = new THREE.Object3D();

      blocks.current.forEach((b) => {
        if (b.type < 1 || b.type > 7) return;
        const typeIdx = b.type - 1;
        dummy.position.set(b.x, b.y, b.z);
        dummy.updateMatrix();
        blockMeshes.current[typeIdx].setMatrixAt(
          indices[typeIdx],
          dummy.matrix,
        );
        indices[typeIdx]++;
      });

      blockMeshes.current.forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true;
      });
    };

    updateMeshes();

    const playerHeight = 1.7;
    const playerRadius = 0.3;

    // Input handling
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveState.current.forward = true;
          break;
        case "KeyS":
          moveState.current.backward = true;
          break;
        case "KeyA":
          moveState.current.left = true;
          break;
        case "KeyD":
          moveState.current.right = true;
          break;
        case "Space":
          if (canJump.current) moveState.current.jump = true;
          break;
        case "Digit1":
          setSelectedBlock(1);
          break;
        case "Digit2":
          setSelectedBlock(2);
          break;
        case "Digit3":
          setSelectedBlock(3);
          break;
        case "Digit4":
          setSelectedBlock(4);
          break;
        case "Digit5":
          setSelectedBlock(5);
          break;
        case "Digit6":
          setSelectedBlock(6);
          break;
        case "Digit7":
          setSelectedBlock(7);
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          moveState.current.forward = false;
          break;
        case "KeyS":
          moveState.current.backward = false;
          break;
        case "KeyA":
          moveState.current.left = false;
          break;
        case "KeyD":
          moveState.current.right = false;
          break;
        case "Space":
          moveState.current.jump = false;
          break;
      }
    };

    // Block interaction
    const onMouseDown = (event: MouseEvent) => {
      if (!ctrl.isLocked) {
        ctrl.lock();
        return;
      }

      if (event.button !== 0 && event.button !== 2) return;
      event.preventDefault();

      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.current.intersectObjects(meshes);

      if (intersects.length > 0 && intersects[0].distance < 8) {
        const hit = intersects[0];
        const instanceId = hit.instanceId;
        const mesh = hit.object as THREE.InstancedMesh;

        if (instanceId === undefined) return;

        const matrix = new THREE.Matrix4();
        mesh.getMatrixAt(instanceId, matrix);
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(matrix);

        const bx = Math.round(position.x);
        const by = Math.round(position.y);
        const bz = Math.round(position.z);

        if (event.button === 0) {
          // Break block
          const key = `${bx},${by},${bz}`;
          if (blocks.current.has(key)) {
            blocks.current.delete(key);
            updateMeshes();
          }
        } else if (event.button === 2) {
          // Place block
          const normal = hit.face!.normal.clone();
          // Transform normal to world space (instances aren't rotated, so it's fine, but let's be safe)
          // Actually for unrotated boxes, face normal is already axis-aligned world normal.

          const newX = bx + Math.round(normal.x);
          const newY = by + Math.round(normal.y);
          const newZ = bz + Math.round(normal.z);

          // Check if player is in the way
          const px = camera.position.x;
          const py = camera.position.y;
          const pz = camera.position.z;

          const playerMinX = px - playerRadius;
          const playerMaxX = px + playerRadius;
          const playerMinY = py - playerHeight;
          const playerMaxY = py;
          const playerMinZ = pz - playerRadius;
          const playerMaxZ = pz + playerRadius;

          const blockMinX = newX - 0.5;
          const blockMaxX = newX + 0.5;
          const blockMinY = newY - 0.5;
          const blockMaxY = newY + 0.5;
          const blockMinZ = newZ - 0.5;
          const blockMaxZ = newZ + 0.5;

          const isOverlapping = !(
            playerMaxX < blockMinX ||
            playerMinX > blockMaxX ||
            playerMaxY < blockMinY ||
            playerMinY > blockMaxY ||
            playerMaxZ < blockMinZ ||
            playerMinZ > blockMaxZ
          );

          if (!isOverlapping) {
            const key = `${newX},${newY},${newZ}`;
            if (!blocks.current.has(key)) {
              blocks.current.set(key, {
                type: selectedBlockRef.current,
                x: newX,
                y: newY,
                z: newZ,
              });
              updateMeshes();
            }
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // Collision detection
    const checkCollision = (x: number, y: number, z: number): boolean => {
      // Check blocks around the player's feet and body
      for (let dy = 0; dy < 2; dy++) {
        const checkY = Math.floor(y - playerHeight + dy * 0.9);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const checkX = Math.floor(x + dx * playerRadius);
            const checkZ = Math.floor(z + dz * playerRadius);
            if (blocks.current.has(`${checkX},${checkY},${checkZ}`)) {
              // More precise check
              const bx = checkX;
              const by = checkY;
              const bz = checkZ;

              if (
                x + playerRadius > bx - 0.5 &&
                x - playerRadius < bx + 0.5 &&
                y - playerHeight < by + 0.5 &&
                y > by - 0.5 &&
                z + playerRadius > bz - 0.5 &&
                z - playerRadius < bz + 0.5
              ) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = Math.min(clock.current.getDelta(), 0.1);

      if (ctrl.isLocked) {
        // Gravity
        velocity.current.y -= 30.0 * delta;

        // Movement
        const speed = 8.0;
        if (moveState.current.forward) ctrl.moveForward(speed * delta);
        if (moveState.current.backward) ctrl.moveForward(-speed * delta);
        if (moveState.current.right) ctrl.moveRight(speed * delta);
        if (moveState.current.left) ctrl.moveRight(-speed * delta);

        // Apply X/Z collision
        if (
          checkCollision(
            camera.position.x,
            camera.position.y,
            camera.position.z,
          )
        ) {
          // Revert movement (simple collision response)
          if (moveState.current.forward) ctrl.moveForward(-speed * delta);
          if (moveState.current.backward) ctrl.moveForward(speed * delta);
          if (moveState.current.right) ctrl.moveRight(-speed * delta);
          if (moveState.current.left) ctrl.moveRight(speed * delta);
        }

        // Apply Y movement
        camera.position.y += velocity.current.y * delta;

        // Ground collision
        if (
          checkCollision(
            camera.position.x,
            camera.position.y,
            camera.position.z,
          )
        ) {
          if (velocity.current.y < 0) {
            // Find ground level
            const groundY =
              Math.floor(camera.position.y - playerHeight) + 1 + playerHeight;
            camera.position.y = groundY;
            velocity.current.y = 0;
            canJump.current = true;
          } else {
            // Hit head
            velocity.current.y = 0;
          }
        }

        // Jump
        if (moveState.current.jump && canJump.current) {
          velocity.current.y = 10.0;
          canJump.current = false;
          moveState.current.jump = false;
        }

        // Respawn if fallen
        if (camera.position.y < -20) {
          camera.position.set(0, 15, 0);
          velocity.current.set(0, 0, 0);
        }
      }

      // Update highlight
      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.current.intersectObjects(meshes);

      if (highlightBox.current) {
        if (intersects.length > 0 && intersects[0].distance < 8) {
          const hit = intersects[0];
          const matrix = new THREE.Matrix4();
          (hit.object as THREE.InstancedMesh).getMatrixAt(
            hit.instanceId!,
            matrix,
          );
          const position = new THREE.Vector3();
          position.setFromMatrixPosition(matrix);
          highlightBox.current.position.copy(position);
          highlightBox.current.visible = true;
        } else {
          highlightBox.current.visible = false;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (controls.current?.isLocked) controls.current.unlock();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("contextmenu", (e) => e.preventDefault());
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      meshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/90 rounded-sm flex items-center justify-center">
          <div className="w-1 h-1 bg-white/90 rounded-full" />
        </div>
      </div>

      <div className="absolute top-4 left-4 text-white font-mono text-sm bg-black/70 p-4 rounded-lg pointer-events-none backdrop-blur-md border border-white/20 shadow-xl">
        <h2 className="text-xl font-bold mb-3 text-yellow-400 drop-shadow-lg">
          ⛏️ Block Sandbox
        </h2>
        <div className="space-y-1 text-xs">
          <p>
            <span className="text-yellow-300 font-bold">WASD</span> - Move
          </p>
          <p>
            <span className="text-yellow-300 font-bold">SPACE</span> - Jump
          </p>
          <p>
            <span className="text-yellow-300 font-bold">MOUSE</span> - Look
          </p>
          <p>
            <span className="text-yellow-300 font-bold">L-CLICK</span> - Break
            Block
          </p>
          <p>
            <span className="text-yellow-300 font-bold">R-CLICK</span> - Place
            Block
          </p>
          <p>
            <span className="text-yellow-300 font-bold">1-7</span> - Select
            Block
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-white/30">
          <p className="text-xs">
            Selected:{" "}
            <span className="font-bold text-yellow-300 text-sm">
              {blockNames[selectedBlock - 1]}
            </span>
          </p>
        </div>
        {!isLocked && (
          <p className="mt-2 text-yellow-400 text-xs animate-pulse">
            Click to start
          </p>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-1 bg-black/60 p-2 rounded-lg backdrop-blur-md border border-white/20">
          {blockNames.map((name, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                selectedBlock === index + 1
                  ? "border-yellow-400 scale-110 bg-white/20"
                  : "border-white/40 hover:border-white/60"
              }`}
              style={{
                backgroundColor:
                  selectedBlock === index + 1
                    ? "rgba(234, 179, 8, 0.3)"
                    : "rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="w-8 h-8 rounded shadow-md"
                style={{
                  backgroundColor: `#${blockColors[index].toString(16).padStart(6, "0")}`,
                }}
              />
            </div>
          ))}
        </div>
        <p className="text-center text-white text-xs mt-2 font-mono bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
          {blockNames[selectedBlock - 1]} (Key {selectedBlock})
        </p>
      </div>
    </div>
  );
}
