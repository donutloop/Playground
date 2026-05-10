package main

import (
	. "github.com/godot-go/godot-go/pkg/builtin"
	. "github.com/godot-go/godot-go/pkg/core"
	. "github.com/godot-go/godot-go/pkg/ffi"
	. "github.com/godot-go/godot-go/pkg/gdclassimpl"
	"github.com/godot-go/godot-go/pkg/log"
)

var (
	uiRight StringName
	uiLeft  StringName
	uiUp    StringName
	uiDown  StringName
)

func RegisterClassSnakeGame() {
	uiRight = NewStringNameWithLatin1Chars("ui_right")
	uiLeft = NewStringNameWithLatin1Chars("ui_left")
	uiUp = NewStringNameWithLatin1Chars("ui_up")
	uiDown = NewStringNameWithLatin1Chars("ui_down")

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

type SnakeGame struct {
	Node3DImpl
	timer     float64
	input     Input
	direction Vector3
}

func (c *SnakeGame) GetClassName() string {
	return "SnakeGame"
}

func (c *SnakeGame) GetParentClassName() string {
	return "Node3D"
}

func (c *SnakeGame) V_Ready() {
	log.Debug("SnakeGame Ready!")
	c.input = GetInputSingleton()
	if c.input == nil {
		log.Panic("Unable to get input singleton")
	}
	c.direction = NewVector3WithFloat32Float32Float32(1, 0, 0)
}

func (c *SnakeGame) V_Process(delta float64) {
	if c.input.IsActionPressed(uiUp, false) {
		c.direction = NewVector3WithFloat32Float32Float32(0, 0, -1)
	} else if c.input.IsActionPressed(uiDown, false) {
		c.direction = NewVector3WithFloat32Float32Float32(0, 0, 1)
	} else if c.input.IsActionPressed(uiLeft, false) {
		c.direction = NewVector3WithFloat32Float32Float32(-1, 0, 0)
	} else if c.input.IsActionPressed(uiRight, false) {
		c.direction = NewVector3WithFloat32Float32Float32(1, 0, 0)
	}

	c.timer += delta
	if c.timer > 0.15 {
		c.timer = 0.0
		pos := c.GetPosition()
		newPos := NewVector3WithFloat32Float32Float32(
			pos.MemberGetx() + c.direction.MemberGetx(),
			pos.MemberGety(),
			pos.MemberGetz() + c.direction.MemberGetz(),
		)
		c.SetPosition(newPos)
	}
}
