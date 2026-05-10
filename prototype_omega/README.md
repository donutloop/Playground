# Prototype Omega — Godot Game Projects

Experimental game projects built with **Godot Engine 4.5+**.

> **Status**: Experimental — expect rough edges and rapid iteration.

---

## Prerequisites

| Dependency       | Version | Notes                                                             |
| ---------------- | ------- | ----------------------------------------------------------------- |
| **Godot Engine** | 4.5+    | Download from [godotengine.org](https://godotengine.org/download) |

Make sure the `godot` binary is accessible. All commands reference it via the `GODOT` environment variable:

```bash
export GODOT=/path/to/godot   # e.g. /usr/local/bin/godot
```

---

## Repository Layout

```
prototype_omega/
├── AGENTS.md                      # AI-agent rules & conventions
├── README.md                      # ← you are here
├── .gitignore                     # Ignores .so, .h, .godot/, godot_binary
│
└── cybersnake/                    # 2D Cyberpunk Snake game (GDScript)
    ├── README.md                  # Game design, enemy guide, controls
    └── project/                   # Godot project root
        ├── project.godot          # Engine settings (640×640, 2D)
        ├── main.tscn              # Scene tree (grid, snake, enemies, HUD, CRT)
        ├── scripts/               # GDScript game logic
        │   ├── snake.gd           # Core snake controller
        │   ├── spawner.gd         # ICE shard spawner
        │   ├── hud.gd             # HUD / death screen
        │   ├── enemy_manager.gd   # Wave system
        │   └── enemies/           # 5 enemy types + boss
        └── shaders/               # Neon grid + CRT post-process
```

---

## Projects

### CyberSnake

A neon-noir 2D snake game with tiered enemies, a multi-phase boss, boid-flocking swarms, and CRT post-processing.

```bash
# Run the game
$GODOT --path cybersnake/project/

# Open in editor
$GODOT --editor --path cybersnake/project/
```

See [cybersnake/README.md](./cybersnake/README.md) for gameplay details, enemy guide, and controls.

---

## Contributing

See [AGENTS.md](./AGENTS.md) for coding standards, scene tree conventions, and patterns that all contributors (human and AI) must follow.

---

## License

This project is experimental / personal use. See individual dependencies for their licenses:
- [Godot Engine — MIT](https://github.com/godotengine/godot/blob/master/LICENSE.txt)
