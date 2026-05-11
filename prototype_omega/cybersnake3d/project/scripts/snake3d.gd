# snake3d.gd — 3D Snake controller on XZ grid plane
extends Node3D
const LevelSettings = preload("res://scripts/level_settings.gd")


var body: Array[Vector2i] = []
var direction := Vector2i(1, 0)
var next_direction := Vector2i(1, 0)
var move_timer: float = 0.0
var move_interval: float = 0.125  # 8 steps/sec
var is_alive: bool = true
var score: int = 0

var xp: int = 0
var level: int = 1
const XP_PER_LEVEL: int = 50
const EVO_THRESHOLDS: Array[int] = [0, 200, 500, 1000, 2000]
var evolution_stage: int = 1

const EVO_STATS: Array[Dictionary] = [
	{},  # padding so index matches stage
	{"hp": 3, "speed": 6.0},
	{"hp": 5, "speed": 7.0},
	{"hp": 8, "speed": 8.0},
	{"hp": 12, "speed": 9.0},
	{"hp": 20, "speed": 10.0},
]

var max_hp: int = 3
var hp: int = 3

var overcharge_timer: float = 8.0
var overcharge_active: bool = false
var prev_directions: Array[Vector2i] = [Vector2i(1,0), Vector2i(1,0)]

var invuln_timer: float = 2.0
var just_attacked: bool = false

var segments: Array[MeshInstance3D] = []

# Materials
var head_mat: StandardMaterial3D
var body_mat: StandardMaterial3D

signal died
signal ate_shard
signal score_changed(new_score: int)
signal evolved(stage: int)
signal xp_changed(current_xp: int, current_level: int, current_evo: int)

func _ready() -> void:
	# Create materials
	head_mat = StandardMaterial3D.new()
	head_mat.emission_enabled = true
	head_mat.emission_energy_multiplier = 3.0

	body_mat = StandardMaterial3D.new()
	body_mat.emission_enabled = true
	body_mat.emission_energy_multiplier = 1.5

	_apply_evo_colors()
	
	var stats: Dictionary = EVO_STATS[evolution_stage]
	max_hp = stats["hp"]
	hp = max_hp
	move_interval = 1.0 / stats["speed"]

	var cx: int = LevelSettings.grid_w / 2
	var cy: int = LevelSettings.grid_h / 2
	body = [
		Vector2i(cx, cy),
		Vector2i(cx - 1, cy),
		Vector2i(cx - 2, cy),
	]
	_rebuild_meshes()

func _process(delta: float) -> void:
	if not is_alive:
		return

	if evolution_stage >= 5:
		overcharge_timer -= delta
		if overcharge_timer <= 0.0:
			overcharge_timer = 8.0
			invuln_timer = 2.0
			overcharge_active = true

	if invuln_timer > 0.0:
		invuln_timer -= delta
		# Flash head during invuln
		if head_mat:
			var flash := sin(invuln_timer * 20.0) * 0.5 + 0.5
			head_mat.emission_energy_multiplier = 3.0 + flash * 5.0
	else:
		overcharge_active = false

	just_attacked = false
	_handle_input()
	move_timer += delta
	if move_timer >= move_interval:
		move_timer = 0.0
		_step()

func _handle_input() -> void:
	var new_dir := direction
	if Input.is_action_pressed("ui_up"):
		new_dir = Vector2i(0, -1)
	elif Input.is_action_pressed("ui_down"):
		new_dir = Vector2i(0, 1)
	elif Input.is_action_pressed("ui_left"):
		new_dir = Vector2i(-1, 0)
	elif Input.is_action_pressed("ui_right"):
		new_dir = Vector2i(1, 0)
		
	if new_dir != direction:
		if new_dir + direction == Vector2i.ZERO:
			# Reversing
			if evolution_stage >= 3:
				next_direction = new_dir
		else:
			next_direction = new_dir

func _step() -> void:
	var is_reversing: bool = false
	if next_direction + direction == Vector2i.ZERO:
		is_reversing = true

	prev_directions.push_front(direction)
	if prev_directions.size() > 3:
		prev_directions.pop_back()

	direction = next_direction
	var new_head := body[0] + direction

	# Wall collision
	if new_head.x < 0 or new_head.x >= LevelSettings.grid_w or new_head.y < 0 or new_head.y >= LevelSettings.grid_h:
		_die()
		return

	# Self collision
	for i in range(body.size() - 1):
		if body[i] == new_head:
			_die()
			return

	body.push_front(new_head)

	if is_reversing and evolution_stage >= 3:
		# Tail whip: attack space behind the head (which was the old direction we reversed from)
		_check_enemy_damage(body[1] - direction, true)

	# ICE shard
	var spawner := get_node_or_null("../ICEShardSpawner")
	if spawner and spawner.try_eat(new_head):
		ate_shard.emit()
		score += 100
		score_changed.emit(score)
		add_xp(10)
		invuln_timer = 0.3
	else:
		body.pop_back()

	_check_enemy_damage(new_head, false)
	_rebuild_meshes()

func add_xp(amount: int) -> void:
	xp += amount
	var new_level: int = 1 + xp / XP_PER_LEVEL
	if new_level != level:
		level = new_level
	_check_evolution()
	xp_changed.emit(xp, level, evolution_stage)

func _check_evolution() -> void:
	var new_evo: int = 0
	for threshold in EVO_THRESHOLDS:
		if xp >= threshold:
			new_evo += 1
	if new_evo > evolution_stage:
		evolution_stage = new_evo
		_on_evolve()

func _on_evolve() -> void:
	var stats: Dictionary = EVO_STATS[evolution_stage]
	max_hp = stats["hp"]
	hp = max_hp  # full heal on evolution
	move_interval = 1.0 / stats["speed"]
	_apply_evo_colors()
	evolved.emit(evolution_stage)

func _apply_evo_colors() -> void:
	var h_color: Color
	var b_color: Color
	match evolution_stage:
		1: # Cyan
			h_color = Color(0.0, 1.0, 0.85, 1.0)
			b_color = Color(0.0, 0.6, 0.4, 1.0)
		2: # Teal
			h_color = Color(0.0, 0.8, 0.8, 1.0)
			b_color = Color(0.0, 0.4, 0.5, 1.0)
		3: # Blue
			h_color = Color(0.2, 0.4, 1.0, 1.0)
			b_color = Color(0.1, 0.2, 0.6, 1.0)
		4: # Orange-Red
			h_color = Color(1.0, 0.3, 0.0, 1.0)
			b_color = Color(0.6, 0.1, 0.0, 1.0)
		_: # Amber/Gold (5+)
			h_color = Color(1.0, 0.8, 0.0, 1.0)
			b_color = Color(0.6, 0.4, 0.0, 1.0)
			
	if head_mat:
		head_mat.albedo_color = h_color
		head_mat.emission = h_color
	if body_mat:
		body_mat.albedo_color = b_color
		body_mat.emission = b_color

func _check_enemy_damage(head_pos: Vector2i, is_tail_whip: bool) -> void:
	var manager := get_node_or_null("../EnemyManager")
	if not manager:
		return
	for enemy in manager.get_children():
		if not is_instance_valid(enemy):
			continue
		if not enemy.has_method("take_damage") or not enemy.has_method("get_grid_positions"):
			continue
		for cell in enemy.get_grid_positions():
			if cell == head_pos:
				enemy.take_damage(1)
				if not is_tail_whip:
					just_attacked = true
					invuln_timer = 0.2
				return

func is_invulnerable() -> bool:
	return invuln_timer > 0.0 or just_attacked

func _die() -> void:
	if invuln_timer > 0.0 and not overcharge_active:
		return
	if overcharge_active:
		return # handled in enemy scripts now, snake doesn't die during overcharge

	hp -= 1
	if hp <= 0:
		is_alive = false
		died.emit()
	else:
		invuln_timer = 2.0

func get_occupied_cells() -> Array[Vector2i]:
	return body

func grid_to_world(gp: Vector2i) -> Vector3:
	return Vector3(float(gp.x) - LevelSettings.grid_w * 0.5 + 0.5, 0.5, float(gp.y) - LevelSettings.grid_h * 0.5 + 0.5)

func get_head_world_pos() -> Vector3:
	if body.size() > 0:
		return grid_to_world(body[0])
	return Vector3.ZERO

# ── mesh management ──────────────────────────────────────────────────
func _rebuild_meshes() -> void:
	# Remove excess segments
	while segments.size() > body.size():
		var seg: MeshInstance3D = segments.pop_back()
		seg.queue_free()

	# Add missing segments
	while segments.size() < body.size():
		var mesh_inst := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(0.8, 0.8, 0.8)
		mesh_inst.mesh = box
		add_child(mesh_inst)
		segments.append(mesh_inst)

	# Position and style segments — snap to grid (no lerp)
	for i in range(body.size()):
		var seg := segments[i]
		seg.position = grid_to_world(body[i])

		if i == 0:
			seg.mesh.size = Vector3(0.9, 0.9, 0.9)
			seg.material_override = head_mat
		else:
			var t := float(i) / float(body.size())
			var s := lerpf(0.8, 0.5, t)
			seg.mesh.size = Vector3(s, s, s)
			seg.material_override = body_mat

