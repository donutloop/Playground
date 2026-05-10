package main

import "C"
import (
	"unsafe"

	"github.com/godot-go/godot-go/pkg/core"
	"github.com/godot-go/godot-go/pkg/ffi"
	"github.com/godot-go/godot-go/pkg/log"
)

//export GodotGoSnake3DInit
func GodotGoSnake3DInit(p_get_proc_address unsafe.Pointer, p_library unsafe.Pointer, r_initialization unsafe.Pointer) bool {
	log.Debug("GodotGoSnake3DInit called")
	initObj := core.NewInitObject(
		(ffi.GDExtensionInterfaceGetProcAddress)(p_get_proc_address),
		(ffi.GDExtensionClassLibraryPtr)(p_library),
		(*ffi.GDExtensionInitialization)(unsafe.Pointer(r_initialization)),
	)

	initObj.RegisterSceneInitializer(func() {
		RegisterClassSnakeGame()
	})

	initObj.RegisterSceneTerminator(func() {
	})

	return initObj.Init()
}

func main() {}
