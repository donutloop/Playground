# AGENTS.md

This file governs how AI agents interact with the `godot-go` and `godot` repositories. All agents — regardless of the model or orchestration framework — **must read and follow this file before performing any task** related to Godot Go bindings or the Godot engine.

---

## 1. Project Context & Purpose

The purpose of this project is to develop and maintain robust, idiomatic Go bindings for the Godot Engine via the **GDExtension API**. 
- **[godot-go](https://github.com/godot-go/godot-go)**: Go bindings for Godot 4.5+ using GDExtension. Integrates into Godot through `cgo`.
- **[Godot Engine](https://github.com/godotengine/godot)**: The open-source cross-platform game engine (specifically targeting v4.5+).

Agents must remember that this project heavily relies on **CGO**, type-unsafe pointer conversions, and bridging Go's garbage collection with Godot's memory management model. The API is considered **experimental** and memory leaks are a known focus area.

---

## 2. Requirements & Environment

Agents must assume the following environment and dependencies when writing or modifying code:
- **Godot Version**: 4.5+ (Testing requires a Godot 4.5+ binary)
- **Go Version**: 1.25.x
- **Build Tools**: `gcc` (for cgo), `clang-format` (for C headers), `goimports`
- **Make Commands**: `make installdeps`, `make update_godot_headers_from_binary`, `make generate`, `make build`, `make test`.

---

## 3. Coding Standards

### Go & CGO
- **Type-Unsafe Conversions**: Use `unsafe.Pointer` carefully. Agents must be aware of Go's rules for passing pointers between Go and C. Reference [Go 101: Type-Unsafe Pointers](https://go101.org/article/unsafe.html).
- **Memory Management**: Godot objects are managed by Godot. `RefCounted` objects handle their own lifecycles, but base `Object` instances must be explicitly freed to prevent memory leaks. Agents must properly handle `Variant` types.
- **CGO Data Types**: Be mindful of C type mappings in Go (`C.int`, `C.float`, etc.) and Godot's specific primitive sizes (`real_t` vs float, `int64_t` vs int).
- **Go Idioms**: Expose Go-idiomatic APIs (e.g., returning multiple values instead of modifying pointers, using standard Go error handling) where it makes sense, but ensure exact binary compatibility with Godot's C extension API.

### Godot GDExtension
- **Class Registration**: When exposing Go structs as Godot classes, all methods, properties, and signals must be explicitly registered during the initialization phase using the Go-equivalent of `ClassDB::bind_method`.
- **Initialization**: A GDExtension entry point must be defined, providing initialization and de-initialization callbacks (e.g., `initialize_level`, `deinitialize_level`).
- **GDExtension Config**: A `.gdextension` file must be maintained to tell Godot how to load the compiled `.so`, `.dll`, or `.dylib` libraries per platform.

### High-End 3D Graphics Standards (RTX 3090 / Modern GPUs)
- **Renderer**: Always configure the Godot project to use the **Forward+** renderer to leverage Vulkan's advanced features.
- **Global Illumination**: Enable **SDFGI** (Signed Distance Field Global Illumination) and **SSIL** (Screen Space Indirect Lighting) for real-time dynamic lighting.
- **Reflections and Anti-Aliasing**: Enable **SSR** (Screen Space Reflections) and **TAA** (Temporal Anti-Aliasing) to ensure smooth geometry and highly accurate specular reflections.
- **Volumetrics**: Utilize Volumetric Fog and high-quality shadow maps (soft shadows) for atmospheric depth, maximizing GPU utilization.
- **Performance**: Disable V-Sync during development to measure raw frame times, and rely on standard profiling tools to identify bottlenecks.

---

## 4. Development Workflow

Agents should follow this workflow for generating and testing code:

1. **Header Updates**: If the Godot API changes, extract the latest `gdextension_interface.h` and `extension_api.json` from the binary:
   ```bash
   GODOT=/path/to/godot/bin make update_godot_headers_from_binary
   ```
2. **Code Generation**: Wrap the extracted headers and API definitions:
   ```bash
   make generate
   ```
3. **Building**: Compile the Go code into a shared library:
   ```bash
   make build
   ```
4. **Testing**: Run the tests. For the first time, generate cached files:
   ```bash
   GODOT=/path/to/godot/bin make ci_gen_test_project_files
   ```
   Then run iterative tests:
   ```bash
   GODOT=/path/to/godot/bin make test
   ```

---

## 5. What Agents Must NOT Do

- **Invent APIs**: Do not hallucinate GDExtension API functions. Always use the code generated via `make generate` which wraps `extension_api.json`.
- **Ignore Memory Models**: Do not ignore Godot's object lifecycle. Go's GC will not automatically clean up memory allocated on the Godot/C++ side.
- **Violate CGO Rules**: Do not pass Go pointers containing Go pointers to C.
- **Hardcode Godot Paths**: Do not hardcode Godot binary paths in scripts; always use the `GODOT=` environment variable as specified in the Makefile.

---

## 6. Official Documentation References

When stuck, agents must prioritize reading these primary sources:
- **Godot GDExtension Docs**: [https://docs.godotengine.org/en/stable/tutorials/scripting/gdextension/index.html](https://docs.godotengine.org/en/stable/tutorials/scripting/gdextension/index.html)
- **Godot-Go Overview**: `docs/overview.md` inside the `godot-go` repository.
- **Godot-Go Demo Projects**: Check [godot-go-demo-projects](https://github.com/godot-go/godot-go-demo-projects) for practical examples mixing `godot-go` and GDScript.

---

## 7. Building a New GDExtension Project from Scratch

When creating a new godot-go project from zero, agents **must** follow this exact sequence. Do not skip steps or improvise directory structures.

### 7.1 Directory Structure

Every project must follow this layout:

```
<project_name>/
├── main.go                    # GDExtension entry point (//export symbol)
├── <game_logic>.go            # Custom Godot class implementations
├── go.mod / go.sum            # Go module files
└── project/                   # Godot project root
    ├── project.godot          # Engine settings
    ├── <name>.gdextension     # Library loading config
    ├── <name>.gdextension.uid # Auto-generated UID (Godot creates this)
    ├── main.tscn              # Main scene
    └── lib/
        └── lib<name>.so       # Compiled Go shared library (build output)
```

### 7.2 Step-by-Step Procedure

**Step 1 — Initialize the Go module:**
```bash
mkdir -p <project_name> && cd <project_name>
go mod init <project_name>
go get github.com/godot-go/godot-go@v0.3.21
```

**Step 2 — Create `main.go` with the GDExtension entry point:**

- Package must be `main` with an empty `func main() {}`.
- Must include `import "C"` to trigger c-shared build mode.
- The `//export <SymbolName>` comment is mandatory — it produces the C symbol that Godot loads.
- The exported function must accept exactly three `unsafe.Pointer` arguments and return `bool`.
- Register all custom classes inside the `RegisterSceneInitializer` callback.

```go
package main

import "C"
import (
    "unsafe"
    "github.com/godot-go/godot-go/pkg/core"
    "github.com/godot-go/godot-go/pkg/ffi"
    "github.com/godot-go/godot-go/pkg/log"
)

//export <EntrySymbol>
func <EntrySymbol>(p_get_proc_address unsafe.Pointer, p_library unsafe.Pointer, r_initialization unsafe.Pointer) bool {
    log.Debug("<EntrySymbol> called")
    initObj := core.NewInitObject(
        (ffi.GDExtensionInterfaceGetProcAddress)(p_get_proc_address),
        (ffi.GDExtensionClassLibraryPtr)(p_library),
        (*ffi.GDExtensionInitialization)(unsafe.Pointer(r_initialization)),
    )
    initObj.RegisterSceneInitializer(func() {
        // Register all Godot classes here
    })
    initObj.RegisterSceneTerminator(func() {})
    return initObj.Init()
}

func main() {}
```

**Step 3 — Implement custom Godot classes:**

- Embed the appropriate `*Impl` type (e.g., `Node3DImpl`, `Node2DImpl`) from `gdclassimpl`.
- Implement `GetClassName()` and `GetParentClassName()` — they must return exact Godot class names.
- Register the class with `ClassDBRegisterClass[*T]()` in the scene initializer.
- Bind virtual methods with `ClassDBBindMethodVirtual()`.
- The Go method name convention is `V_<MethodName>` mapping to Godot's `_<method_name>`.

**Step 4 — Create the Godot project directory:**
```bash
mkdir -p project/lib
```

**Step 5 — Create `project/<name>.gdextension`:**

```ini
[configuration]
entry_symbol="<EntrySymbol>"
compatibility_minimum="4.1"

[libraries]
linux.debug.x86_64="res://lib/lib<name>.so"
linux.release.x86_64="res://lib/lib<name>.so"
```

> **Critical:** `entry_symbol` must exactly match the `//export` function name in `main.go`.

**Step 6 — Create `project/project.godot`:**

For high-end rendering (RTX 3090 / modern GPUs), include at minimum:

```ini
config_version=5

[application]
config/name="<Project Name>"
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
```

**Step 7 — Build the shared library:**
```bash
CGO_ENABLED=1 go build -buildmode=c-shared -o project/lib/lib<name>.so .
```

**Step 8 — Create the main scene and run:**

Create `project/main.tscn` either manually or via the Godot editor. The scene must contain a node whose `type` matches the class name returned by `GetClassName()`.

```bash
# Open editor
$GODOT --editor --path project/

# Or run directly
$GODOT --path project/
```

### 7.3 Common Mistakes Agents Must Avoid

| Mistake | Consequence | Fix |
|---|---|---|
| `entry_symbol` ≠ `//export` name | `undefined symbol` at runtime | Names must be identical |
| Missing `import "C"` | Go build won't produce a C-shared library | Always include the import |
| Missing `func main() {}` | Build fails with `main` not found | Always include empty main |
| Wrong output path for `.so` | Godot can't find the library | Path must match `.gdextension` `[libraries]` |
| Forgetting to call `RegisterClass*` in initializer | Custom node types don't appear in Godot | Register everything in `RegisterSceneInitializer` |
| Passing Go pointers containing Go pointers to C | Violates cgo rules; crashes or memory corruption | Follow cgo pointer-passing rules strictly |

---

*Last updated from docs.godotengine.org/en/stable and godot-go/main README.*
