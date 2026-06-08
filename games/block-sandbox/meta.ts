import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "block-sandbox",
  name: "Block Sandbox",
  description: "A tiny Minecraft-inspired creative voxel sandbox.",
  genre: "Sandbox",
  layout: "immersive",
  generatedWith: "QWEN3.7-PLUS",
  status: "Broken",
  thumbnail,
  prompts: [
    "Create a game called 'Block Sandbox'. This game should capture the feeling of Minecraft's creative mode while remaining extremely small and self-contained. The goal is: Place blocks. Remove blocks. Build simple structures. Explore a small voxel world. Do NOT attempt to recreate all Minecraft systems. Core Gameplay Loop: The player explores a small procedurally generated voxel world. The player can: Walk around, Look around, Place blocks, Remove blocks, Build structures. There are no enemies, no crafting, no inventory management, no survival system. The focus is pure sandbox creativity.",
  ],
  knownIssues: [
    "Small world size (32x32 area)",
    "No chunk streaming or infinite world generation",
    "No crafting or inventory management system",
    "No survival mechanics (hunger, health, enemies)",
    "No multiplayer support",
    "Simple AABB collision system (may clip through block corners)",
    "Limited to 5 block types (Grass, Dirt, Stone, Wood, Brick)",
  ],
};
