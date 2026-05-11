# glitch_drone3d.gd — Tier 1: random walk with glitch stutter (3D)
extends Node3D
const LevelSettings = preload("res://scripts/level_settings.gd")


var grid_pos := Vector2i.ZERO
var hp: int = 1
var speed_steps: float = 3.0
var move_timer: float = 0.0
var ticks_until_turn: int = 4
var tick_count: int = 0
var is_glitching: bool = false
var glitch_timer: float = 0.0
var glitch_cooldown: float = 0.0
var is_dead: bool = false

var mesh_inst: MeshInstance3D
var light: OmniLight3D
var mat: StandardMaterial3D

const DIRECTIONS := [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1)]

func _ready() -> void:
	grid_pos = _random_edge()
	ticks_until_turn = randi_range(3, 6)
	glitch_cooldown = randf_range(2.0, 5.0)

	mat = StandardMaterial3D.new()
	mat.albedo_color = Color(1.0, 0.3, 0.1, 1.0)
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.3, 0.1, 1.0)
	mat.emission_energy_multiplier = 2.0

	mesh_inst = MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(0.7, 0.7, 0.7)
	mesh_inst.mesh = box
	mesh_inst.material_override = mat
	add_child(mesh_inst)

	light = OmniLight3D.new()
	light.light_color = Color(1.0, 0.3, 0.1)
	light.light_energy = 1.5
	light.omni_range = 2.5
	mesh_inst.add_child(light)

	_update_position()

func _process(delta: float) -> void:
	if is_dead:
		return

	glitch_cooldown -= delta
	if glitch_cooldown <= 0.0 and not is_glitching:
		is_glitching = true
		glitch_timer = randf_range(0.15, 0.35)

	if is_glitching:
		glitch_timer -= delta
		# Glitch visual — random offset + flash
		mesh_inst.position = _grid_to_world(grid_pos) + Vector3(randf_range(-0.15, 0.15), 0, randf_range(-0.15, 0.15))
		mat.emission_energy_multiplier = 6.0
		if glitch_timer <= 0.0:
			is_glitching = false
			glitch_cooldown = randf_range(2.0, 5.0)
			mat.emission_energy_multiplier = 2.0
		return

	move_timer += delta
	if move_timer >= 1.0 / speed_steps:
		move_timer = 0.0
		_step()
		_update_position()

	_check_snake_collision()

func _step() -> void:
	tick_count += 1
	if tick_count >= ticks_until_turn:
		tick_count = 0
		ticks_until_turn = randi_range(3, 6)
		var d: Vector2i = DIRECTIONS[randi_range(0, 3)]
		var next: Vector2i = grid_pos + d
		if next.x >= 0 and next.x < LevelSettings.grid_w and next.y >= 0 and next.y < LevelSettings.grid_h:
			grid_pos = next
		return

	# Try random direction
	var dirs: Array = DIRECTIONS.duplicate()
	dirs.shuffle()
	for i in range(dirs.size()):
		var d: Vector2i = dirs[i]
		var next: Vector2i = grid_pos + d
		if next.x >= 0 and next.x < LevelSettings.grid_w and next.y >= 0 and next.y < LevelSettings.grid_h:
			grid_pos = next
			return

func _check_snake_collision() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive:
		return
	if snake.is_invulnerable():
		if snake.overcharge_active and snake.body.size() > 0 and snake.body[0] == grid_pos:
			take_damage(1)
		return
	if snake.body.size() > 0 and snake.body[0] == grid_pos:
		snake._die()

func take_damage(amount: int = 1) -> void:
	hp -= amount
	if hp <= 0:
		_die()

func _die() -> void:
	is_dead = true
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += 50
		snake.score_changed.emit(snake.score)
		if snake.has_method("add_xp"):
			snake.add_xp(25)
	queue_free()

func get_grid_positions() -> Array[Vector2i]:
	return [grid_pos]

func _update_position() -> void:
	if mesh_inst:
		mesh_inst.position = _grid_to_world(grid_pos)

func _grid_to_world(gp: Vector2i) -> Vector3:
	return Vector3(float(gp.x) - LevelSettings.grid_w * 0.5 + 0.5, 0.5, float(gp.y) - LevelSettings.grid_h * 0.5 + 0.5)

func _random_edge() -> Vector2i:
	var side := randi_range(0, 3)
	match side:
		0: return Vector2i(randi_range(0, LevelSettings.grid_w - 1), 0)
		1: return Vector2i(randi_range(0, LevelSettings.grid_w - 1), LevelSettings.grid_h - 1)
		2: return Vector2i(0, randi_range(0, LevelSettings.grid_h - 1))
		_: return Vector2i(LevelSettings.grid_w - 1, randi_range(0, LevelSettings.grid_h - 1))
