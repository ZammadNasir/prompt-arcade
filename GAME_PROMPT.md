Generate this game according to guidelines above

“Frontline Surge” (Wave-Based FPS Shooter)

You are generating a browser game for Prompt Arcade.

Create a fast, lightweight, wave-based first-person shooter inspired by the feel of modern military shooters like Call of Duty, but do NOT reference, copy, or recreate any real franchise content.

The goal is to capture:

Fast-paced shooting
Wave survival tension
Simple “combat arena” loop
Satisfying weapon feedback
Core Concept

The player is a soldier dropped into a small combat zone and must survive increasingly difficult waves of enemy AI.

Enemies spawn from multiple points and rush the player.

The game ends when:

Player health reaches 0 (lose)
Player survives all waves (win, optional endless mode after)
Layout
layout: "immersive"

Use full-screen canvas gameplay with no scroll.

Technology

Use:

Phaser (preferred)
TypeScript
React (Next.js)

Generate jus Single-file gameplay inside game.tsx.

Gameplay Requirements
Player
First-person or pseudo-FPS (Phaser raycasting or top-down with FPS feel allowed)
Health bar
Simple movement (WASD)
Mouse aiming
Shooting with left click
Weapons
One primary weapon (rifle)
Optional secondary (pistol or shotgun)
Simple reload mechanic (optional but lightweight)
Enemies
Basic AI soldiers
Path toward player
Increase speed/health each wave
Simple hit reaction (flash/red tint)
Waves
Wave counter UI
Each wave increases:
Enemy count
Enemy speed OR health
Game Loop
Player spawns in arena
Wave starts
Enemies spawn in groups
Player survives wave
Upgrade break (optional: small heal or ammo refill)
Next wave begins
UI

Minimal HUD:

Health bar
Ammo count
Wave number
Small crosshair
Visual Style
Low-poly or simple 2D sprites
No realistic military branding
No real-world flags, logos, or factions
Use generic “soldier” silhouettes
Controls
WASD → Move
Mouse → Aim
Left Click → Shoot
R → Reload (optional)
Shift → Sprint (optional lightweight boost)
Required Output Files

1. game.tsx

Full working implementation in Phaser or Canvas.

2. meta.ts

Must include:

slug: frontline-surge
name: Frontline Surge
description: wave-based FPS survival shooter inspired by arcade military combat
genre: shooter
layout: immersive 3. Assets

Use placeholders only:

Simple shapes or procedural graphics
No external copyrighted assets
Known Limitations
Not a full FPS engine (no 3D weapons or advanced physics)
Simplified enemy AI (straight-line or basic pathing)
No multiplayer
No advanced animations
No realistic weapon simulation
Design Goal

The game should feel:

Fast
Chaotic in later waves
Easy to understand instantly
Fun in short sessions
Smooth in browser
Final Rule

Do not overengineer. Prioritize a playable, satisfying arcade shooter over realism.
