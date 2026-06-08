# Tower of Almost Stability

A physics-based tower survival game where gravity refuses to stay still.

## Overview

**Tower of Almost Stability** is a browser-based arcade game built for Prompt Arcade. In this game, you build a tower by placing blocks one at a time, but the world around you is constantly changing. Gravity rotates every 10 seconds, wind forces push your structure, and physics becomes increasingly chaotic. Your goal is to survive as long as possible.

The game is not about building the tallest tower—it's about endurance under chaos.

## Gameplay

### Core Loop

1. **Click to place blocks** anywhere on the canvas
2. **Blocks fall** under the current gravity direction
3. **Gravity shifts** every ~10 seconds to a new direction (down, left, right, up)
4. **Wind forces** randomly push blocks sideways
5. **Score increases** based on time survived, blocks placed, and tower height
6. **Game ends** when too many blocks fall out of bounds

### Mechanics

#### Block Placement

- Click anywhere on the screen to drop a block
- Blocks are 30×30 pixel squares
- Each block has physics properties: friction, restitution, and mass
- Blocks stack and interact with each other

#### Gravity Instability System

- Every ~10 seconds, gravity direction changes randomly
- Possible directions: Down (↓), Left (←), Right (→), Up (↑)
- Gravity changes are sudden and dramatic
- All blocks are affected by the new gravity direction

#### Wind System

- Random wind forces apply to all blocks periodically
- Wind strength increases over time (difficulty scaling)
- Wind can push towers into collapse or create interesting shapes
- Wind is applied every 3-7 seconds with random intervals

#### Stability Pressure

- As time increases, the game becomes harder
- Gravity shifts may become more frequent (optional enhancement)
- Wind strength increases progressively
- Physics becomes increasingly chaotic

### Scoring

- **Time Bonus**: 10 points per second survived
- **Block Bonus**: 5 points per block placed
- **Height Bonus**: 1 point per 10 pixels of tower height

**Final Score** = (Time × 10) + (Blocks × 5) + (Height / 10)

## Controls

| Input            | Action                          |
| ---------------- | ------------------------------- |
| **Left Click**   | Drop a block at cursor position |
| **Page Refresh** | Restart the game                |

## Visual Design

- **Minimal physics sandbox aesthetic**
- **Simple colored blocks** with rainbow hue rotation
- **Gradient background** (dark blue theme)
- **Real-time UI overlay** showing score, time, blocks placed, tower height, and current gravity direction
- **Game over screen** with final statistics

## Technical Details

### Technology Stack

- **Framework**: React + TypeScript + Next.js
- **Physics Engine**: Matter.js 0.20.0
- **Rendering**: Canvas 2D API
- **Styling**: Tailwind CSS

### File Structure

```
tower-of-almost-stability/
├── game.tsx              # Main game component with Matter.js implementation
├── meta.ts               # Game metadata and configuration
├── README.md             # This file
├── thumbnail.png         # Game thumbnail (optional)
└── assets/               # Additional assets directory
```

### Implementation Highlights

- **Self-contained**: All game logic in `game.tsx`
- **No external dependencies** beyond Matter.js
- **Responsive canvas** that fills the viewport
- **60 FPS game loop** with smooth physics updates
- **Event-driven block placement** with mouse click detection
- **Dynamic gravity system** with smooth transitions
- **Progressive difficulty** through wind force scaling

## Known Limitations

### Physics Simulation

- Simplified physics using Matter.js constraints only
- No real structural engineering accuracy
- Gravity changes are artificial game rules, not realistic physics
- Wind effects are approximated forces
- Large towers (100+ blocks) may behave unpredictably

### Performance

- Performance may degrade with very large numbers of blocks
- Canvas rendering is CPU-intensive for complex scenes
- No optimization for mobile devices (desktop-first design)

### Gameplay

- No sound effects (can be added as enhancement)
- No particle effects or advanced visual feedback
- Gravity changes are instant (no smooth transitions)
- Wind is applied uniformly to all blocks

## Gameplay Tips

1. **Build strategically**: Place blocks near the center to create a stable base
2. **Anticipate gravity changes**: When gravity shifts, your tower may collapse—be prepared
3. **Use wind to your advantage**: Sometimes wind can push blocks into better positions
4. **Survive longer**: The longer you survive, the higher your score
5. **Don't overextend**: Tall towers are more likely to collapse under gravity shifts

## Future Enhancements

Potential improvements for future versions:

- Sound effects and audio feedback
- Particle effects for gravity shifts and wind
- Difficulty levels (easy, normal, hard)
- Leaderboard system
- Touch controls for mobile
- Special block types (heavy, light, sticky)
- Power-ups (stabilize tower, freeze gravity, etc.)
- Multiplayer mode
- Smooth gravity transitions
- Visual screenshake on gravity changes

## Browser Compatibility

- **Chrome/Chromium**: ✓ Fully supported
- **Firefox**: ✓ Fully supported
- **Safari**: ✓ Fully supported
- **Edge**: ✓ Fully supported
- **Mobile browsers**: ⚠ Playable but not optimized

## License

Generated for Prompt Arcade. Use and modify freely for non-commercial purposes.

## Credits

- **Game Design**: Prompt Arcade specification
- **Implementation**: AI-generated code
- **Physics Engine**: Matter.js by Liam Brummitt
- **Framework**: React, Next.js, TypeScript

---

**Play the game, survive the chaos, and see how long you can keep your tower standing!**
