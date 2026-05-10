# Prototype Omega — Godot-Go GDExtension Projects

Experimental game projects built with **Go** and the **Godot Engine 4.5+** via [godot-go](https://github.com/godot-go/godot-go) GDExtension bindings.

> **Status**: Experimental — expect rough edges, memory-management quirks, and API churn.

---

## Prerequisites

| Dependency        | Version   | Notes                                                             |
| ----------------- | --------- | ----------------------------------------------------------------- |
| **Godot Engine**  | 4.5+      | Download from [godotengine.org](https://godotengine.org/download) |
| **Go**            | 1.25.x    | [go.dev/dl](https://go.dev/dl/)                                   |
| **GCC**           | any       | Required by `cgo`                                                 |
| **clang-format**  | any       | Only needed when regenerating godot-go headers                    |
| **goimports**     | latest    | `go install golang.org/x/tools/cmd/goimports@latest`              |

Make sure the `godot` binary is accessible. All commands reference it via the `GODOT` environment variable:

```bash
export GODOT=/path/to/godot   # e.g. ./godot_binary or /usr/local/bin/godot
```

---

## Repository Layout

```
prototype_omega/
├── AGENTS.md                      # AI-agent rules & conventions
├── README.md                      # ← you are here
├── godot_binary                   # Local Godot editor binary (gitignored / LFS)
│
├── snake3d/                       # 3D Snake game project
│   ├── main.go                    # GDExtension entry point (exported C symbol)
│   ├── snake.go                   # SnakeGame class registered with ClassDB
│   ├── go.mod / go.sum            # Go module definition
│   └── project/                   # Godot project root
│       ├── project.godot          # Engine project settings (Forward+, TAA, SDFGI …)
│       ├── main.tscn              # Main scene (environment, camera, floor, SnakeGame node)
│       ├── snake3d.gdextension    # Tells Godot how to load the Go shared library
│       └── lib/
│           └── libsnake3d.so      # Compiled Go shared library (build output)
│
└── godot-go-demo-projects/        # Reference demos from godot-go upstream
```

---

## Building a Project from Scratch

Follow these steps to create a new godot-go GDExtension project from zero. The guide uses `snake3d` as a concrete example.

### Step 1 — Create the Go module

```bash
mkdir -p snake3d && cd snake3d
go mod init snake3d
go get github.com/godot-go/godot-go@v0.3.21   # or latest
```

### Step 2 — Write the GDExtension entry point (`main.go`)

Every GDExtension plugin needs a single exported C entry point. The function name must match `entry_symbol` in the `.gdextension` file.

```go
package main

import "C"
import (
    "unsafe"

    "github.com/godot-go/godot-go/pkg/core"
    "github.com/godot-go/godot-go/pkg/ffi"
    "github.com/godot-go/godot-go/pkg/log"
)

//export GodotGoSnake3DInit
func GodotGoSnake3DInit(
    p_get_proc_address unsafe.Pointer,
    p_library unsafe.Pointer,
    r_initialization unsafe.Pointer,
) bool {
    log.Debug("GodotGoSnake3DInit called")
    initObj := core.NewInitObject(
        (ffi.GDExtensionInterfaceGetProcAddress)(p_get_proc_address),
        (ffi.GDExtensionClassLibraryPtr)(p_library),
        (*ffi.GDExtensionInitialization)(unsafe.Pointer(r_initialization)),
    )

    initObj.RegisterSceneInitializer(func() {
        // Register all custom Godot classes here
        RegisterClassSnakeGame()
    })

    initObj.RegisterSceneTerminator(func() {
        // Cleanup if needed
    })

    return initObj.Init()
}

func main() {}
```

> **Key details:**
> - The package must be `main` with an empty `func main() {}`.
> - The `//export` comment is required by cgo to produce the C symbol.
> - `import "C"` must be present (even if unused directly) to trigger the C-shared build.

### Step 3 — Implement your game class (`snake.go`)

Register Go structs as Godot classes via `ClassDBRegisterClass`. Bind virtual methods like `_ready` and `_process` so Godot calls into your Go code.

```go
package main

import (
    . "github.com/godot-go/godot-go/pkg/builtin"
    . "github.com/godot-go/godot-go/pkg/core"
    . "github.com/godot-go/godot-go/pkg/ffi"
    . "github.com/godot-go/godot-go/pkg/gdclassimpl"
    "github.com/godot-go/godot-go/pkg/log"
)

type SnakeGame struct {
    Node3DImpl
    // your fields …
}

func (c *SnakeGame) GetClassName() string      { return "SnakeGame" }
func (c *SnakeGame) GetParentClassName() string { return "Node3D" }

func RegisterClassSnakeGame() {
    ClassDBRegisterClass[*SnakeGame](
        func(owner *GodotObject) GDClass {
            inst := &SnakeGame{}
            inst.Owner = owner
            return inst
        },
        []GDExtensionPropertyInfo{},
        nil,
        func(t *SnakeGame) {
            ClassDBBindMethodVirtual(t, "V_Ready", "_ready", nil, nil)
            ClassDBBindMethodVirtual(t, "V_Process", "_process", []string{"delta"}, nil)
        },
    )
}

func (c *SnakeGame) V_Ready() {
    log.Debug("SnakeGame Ready!")
}

func (c *SnakeGame) V_Process(delta float64) {
    // game logic per frame
}
```

### Step 4 — Build the shared library

Compile the Go code into a C-shared library and place it where the Godot project expects it:

```bash
CGO_ENABLED=1 go build -buildmode=c-shared -o project/lib/libsnake3d.so .
```

> **Note:** The output path must match the path in `snake3d.gdextension` → `[libraries]`.

### Step 5 — Create the Godot project

```bash
mkdir -p project/lib
```

#### `project/project.godot`

```ini
config_version=5

[application]
config/name="Snake 3D High End"
run/main_scene="res://main.tscn"
config/features=PackedStringArray("4.6", "Forward Plus")

[display]
window/size/viewport_width=1920
window/size/viewport_height=1080
window/vsync/vsync_mode=0

[rendering]
anti_aliasing/quality/msaa_3d=2
anti_aliasing/quality/use_taa=true
lights_and_shadows/directional_shadow/size=8192
lights_and_shadows/directional_shadow/soft_shadow_filter_quality=5
global_illumination/sdfgi/probe_ray_count=2
global_illumination/sdfgi/frames_to_converge=1
environment/defaults/default_clear_color=Color(0, 0, 0, 1)
```

#### `project/snake3d.gdextension`

```ini
[configuration]
entry_symbol="GodotGoSnake3DInit"
compatibility_minimum="4.1"

[libraries]
linux.debug.x86_64="res://lib/libsnake3d.so"
linux.release.x86_64="res://lib/libsnake3d.so"
```

> **Important:** `entry_symbol` must exactly match the `//export` function name in `main.go`.

#### `project/main.tscn`

Create a minimal scene in the Godot editor (or by hand). The scene must contain a node whose type matches your registered class name (e.g., `SnakeGame`).

### Step 6 — Run in the Godot editor

```bash
$GODOT --editor --path project/
```

Or run the game directly:

```bash
$GODOT --path project/
```

---

## Quick Build & Run Cheatsheet

```bash
# 1. Build the Go shared library
cd snake3d
CGO_ENABLED=1 go build -buildmode=c-shared -o project/lib/libsnake3d.so .

# 2. Open in Godot editor
$GODOT --editor --path project/

# 3. Or run the game directly
$GODOT --path project/
```

---

## Troubleshooting

| Problem                                   | Solution                                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `undefined symbol: GodotGoSnake3DInit`    | `entry_symbol` in `.gdextension` doesn't match the `//export` name in Go. They must be identical.                                 |
| `libsnake3d.so` not found                 | Verify the path in `.gdextension` `[libraries]` points to the actual `.so` relative to `res://`.                                  |
| Editor crashes on load                    | Rebuild the `.so` — stale libraries or ABI mismatches cause immediate crashes.                                                    |
| `cgo: C compiler not found`              | Install GCC: `sudo apt install build-essential` (Ubuntu/Debian).                                                                  |
| Git push rejected (file too large)        | Add `*.so` and the Godot binary to `.gitignore`. Use Git LFS for large binaries if they must be tracked.                          |
| Go pointer passed to C                    | Review cgo rules — never pass a Go pointer that itself contains a Go pointer to C code.                                           |

---

## Contributing

See [AGENTS.md](./AGENTS.md) for coding standards, memory-management rules, and the development workflow that all contributors (human and AI) must follow.

---

## License

This project is experimental / personal use. See individual dependencies for their licenses:
- [Godot Engine — MIT](https://github.com/godotengine/godot/blob/master/LICENSE.txt)
- [godot-go — MIT](https://github.com/godot-go/godot-go/blob/main/LICENSE)
