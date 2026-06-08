import { GameMeta } from "@/lib/game-types";
import thumbnail from "./thumbnail.png";

export const meta: GameMeta = {
  slug: "angry-shapes",
  name: "Angry Shapes",
  description:
    "Launch geometric projectiles at enemy structures that adapt to your playstyle. The more you rely on one shape, the more the world resists it.",
  genre: "Puzzle",
  layout: "immersive",
  generatedWith: "DeepSeek",
  status: "Playable",
  thumbnail,
  prompts: [
    `Create a game called “Angry Shapes (But Weird)”. It is a physics-based projectile destruction game where the player launches geometric shapes at enemies. But there is a twist: The game adapts dynamically based on which shapes the player uses most. Core Gameplay Loop: Player launches shapes from a fixed cannon/slingshot. Shapes behave differently: Circles roll and bounce smoothly, Triangles pierce and slice through objects, Squares are heavy, bounce hard, cause impact damage. Enemies are placed in simple structures or formations. Player destroys all enemies using limited shots or physics skill. Adaptive Enemy System (CORE TWIST): The game tracks player behavior: If player uses circles too much -> enemies become spikier/harder to roll through; If player uses triangles too much -> enemies gain armor/deflect piercing; If player uses squares too much -> enemies become heavier/more stable. Enemies subtly adapt after each round or wave. Keep system SIMPLE — no AI complexity, just rule-based tweaks. Win/Lose Conditions: Win: Destroy all enemies in a level/wave; Lose: Run out of shots or fail to clear enemies. Optional star rating based on efficiency. Core Rules: Keep scope small and arcade-like, do NOT build full Angry Birds clone complexity. Focus on simple physics fun, shape behavior differences, lightweight adaptive system. Must run entirely in browser, self-contained in game.tsx. Layout: immersive (physics-based arcade shooter). Technology: Matter.js preferred. Visual: minimal geometric art style, clean shapes: Circle=blue, Triangle=red, Square=yellow; simple enemy blocks. Core Mechanics: projectile system with click-drag aim; shape physics differences; enemy structures; adaptive difficulty system after each level: track most-used shape, adjust next level enemy traits (damage resistance). Scoring system: points per enemy destroyed, bonus for fewer shots used.`,
  ],
  knownIssues: [
    "Physics approximations typical for Matter.js; adaptive system is rule-based parameter tweaking, not advanced AI; collision detection may occasionally allow multiple hits per frame; triangle piercing is simplified.",
  ],
};

export default meta;
