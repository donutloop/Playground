# CyberSnake — Neon Noir Snake Game

A cyberpunk-themed 2D snake game built in **Godot 4.6 / GDScript** with tiered enemies, a multi-phase boss, CRT post-processing, and boid-flocking swarms.

> **Theme**: Neon grid / noir — dark backgrounds, cyan snake, pulsing ICE shards, CRT scanlines, and glitch effects.

---

## Quick Start

```bash
# Set the Godot binary path
export GODOT=/path/to/godot

# Run the game
$GODOT --path project/

# Or open in the editor
$GODOT --editor --path project/
```

### Prerequisites

| Dependency       | Version | Notes                                                             |
| ---------------- | ------- | ----------------------------------------------------------------- |
| **Godot Engine** | 4.5+    | Download from [godotengine.org](https://godotengine.org/download) |

No compilation, no build step — pure GDScript. Just open and run.

---

## Controls

| Key          | Action                |
| ------------ | --------------------- |
| ↑ ↓ ← →     | Steer the snake       |
| Enter        | Restart (on death)    |

---

## Game Design

### Grid

- **40 × 40** tiles, **16 × 16 px** each → 640 × 640 viewport
- Snake moves at **8 steps/sec** (configurable via `move_interval`)
- ICE shards (food) spawn as pulsing diamond crystals

### Combat

- **Snake head → enemy**: deals 1 damage to the enemy
- **Enemy → snake head**: kills the snake (FLATLINE)
- **Spawn invulnerability**: 2 seconds at game start + 0.2s after each attack/eat
- The snake's head flashes white during invulnerable frames

### Wave System

Waves auto-advance. Enemies spawn at grid edges. Clearing all enemies triggers the next wave after a 3-second delay.

| Wave | Enemies Spawned                                             |
| ---- | ----------------------------------------------------------- |
| 1    | Glitch Drones (×2)                                         |
| 2    | + Virus Swarm                                               |
| 3    | + Net Reapers                                                |
| 4    | + Compiler Worm                                              |
| 5+   | + Phantom Protocol                                           |
| 10   | **BOSS: Blackwall Sentinel**                                 |

---

## Enemy Guide

### Tier 1 — Glitch Drone
| Stat | Value |
|------|-------|
| Speed | 3 steps/s |
| HP | 1 |
| Behavior | Random walk, picks new direction every 3–6 ticks |
| Special | **Glitch stutter** — freezes 1–2 ticks, flashes white |
| Score | +50 |

### Tier 2 — Net Reaper
| Stat | Value |
|------|-------|
| Speed | 5 steps/s |
| HP | 2 |
| Behavior | A* pathfinding toward snake head (recalculates every 0.5s) |
| Special | **Frenzy** at half HP (speed ×2 for 2s), leaves **firewall trail** (blocks snake for 3s) |
| Score | +150 |

### Tier 2 — Virus Swarm
| Stat | Value |
|------|-------|
| Units | 4–8 boids |
| HP | 1 per unit |
| Behavior | Boid flocking (separation + cohesion), center drifts toward snake at 2 steps/s |
| Special | Killing 50% triggers **scatter** (2s), then regroup |
| Score | +200 (all dead) |

### Tier 3 — Phantom Protocol
| Stat | Value |
|------|-------|
| Speed | 7 steps/s |
| HP | 3 |
| Behavior | Alternates between invisible and visible phases |
| Special | Teleports to **predicted snake position** (head + direction × 4), spawns **echo decoys** (no hitbox) |
| Score | +300 |

### Tier 3 — Compiler Worm
| Stat | Value |
|------|-------|
| Length | 5–8 segments |
| HP | 1 per segment |
| Behavior | Snake-like body, A* pathfinds toward ICE shards (competes with player for food) |
| Special | Grows on eating shards, speeds up. Destroying head kills entire worm (+250 bonus) |
| Score | +30/segment, +250 head kill |

### BOSS — Blackwall Sentinel
| Stat | Value |
|------|-------|
| Size | 3×3 tiles |
| HP | 10 |
| Phases | 3 |

| Phase | HP Range | Behavior |
|-------|----------|----------|
| 1 | 10–8 | Spawns 2 Glitch Drones every 5s |
| 2 | 7–4 | Row/column **laser sweep** (0.5s warning, instant kill) |
| 3 | 3–1 | **Shrinks grid border** inward 1 tile every 8s |

---

## Visual Effects

| Effect | Implementation |
|--------|----------------|
| **Neon grid** | `grid_bg.gdshader` — scrolling cyan lines with pulsing glow |
| **CRT overlay** | `crt.gdshader` — scanlines, chromatic aberration, vignette, curvature, flicker |
| **Snake glow** | `_draw()` layered rects: outer glow + gradient body |
| **ICE shards** | Pulsing diamond shapes with glow halo |
| **Enemy rendering** | Each enemy draws via `_draw()` — squares, triangles, diamonds, circles |
| **Invuln flash** | Head lerps to white during invulnerable frames |
| **Death screen** | Dark overlay with "FLATLINE" in red |

---

## Project Structure

```
cybersnake/
└── project/                              # Godot project root
    ├── project.godot                     # Engine config (640×640, GL Compat)
    ├── main.tscn                         # Scene tree
    │
    ├── scripts/
    │   ├── snake.gd                      # Core snake controller
    │   ├── spawner.gd                    # ICE shard spawner
    │   ├── hud.gd                        # HUD / death screen / wave announce
    │   ├── enemy_manager.gd              # Wave system + enemy lifecycle
    │   └── enemies/
    │       ├── glitch_drone.gd           # Tier 1 — random walk
    │       ├── net_reaper.gd             # Tier 2 — A* hunter
    │       ├── virus_swarm.gd            # Tier 2 — boid flock
    │       ├── phantom_protocol.gd       # Tier 3 — teleport predictor
    │       ├── compiler_worm.gd          # Tier 3 — food competitor
    │       └── blackwall_sentinel.gd     # Boss — multi-phase
    │
    └── shaders/
        ├── grid_bg.gdshader              # Neon grid background
        └── crt.gdshader                  # CRT post-process overlay
```

### Scene Tree (`main.tscn`)

```
Main [Node2D]
├─ GridBG [ColorRect]          — grid_bg shader
├─ Snake [Node2D]              — snake.gd
├─ ICEShardSpawner [Node2D]    — spawner.gd
├─ EnemyManager [Node2D]       — enemy_manager.gd
│   └─ (dynamic enemy children)
├─ HUD [CanvasLayer L5]        — hud.gd
│   ├─ ScoreLabel [Label]
│   ├─ WaveLabel [Label]
│   ├─ LengthLabel [Label]
│   ├─ WaveAnnounce [Label]
│   └─ DeathScreen [ColorRect]
│       ├─ DeathLabel [Label]
│       └─ RestartLabel [Label]
└─ CRTOverlay [CanvasLayer L10]
    └─ CRTRect [ColorRect]     — crt shader
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Black screen, no grid | Shader error — check Godot version is 4.5+ |
| Snake doesn't move | Click the game window to give it focus |
| Enemies kill instantly | You have 2s spawn invulnerability — head flashes white. Use that time to orient. |
| Can't kill enemies | Steer your snake's **head** into them. Body overlap doesn't count. |
| "FLATLINE" immediately | Enemy spawned near center — restart with Enter, use invuln window to dodge |

---

## License

- Game code: personal/experimental
- [Godot Engine — MIT](https://github.com/godotengine/godot/blob/master/LICENSE.txt)
