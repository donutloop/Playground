# virus_swarm.gd — Tier 2 enemy: boid flocking swarm
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var units: Array[Dictionary] = []  # {pos: Vector2, alive: bool}
var center_pos := Vector2.ZERO
var center_speed: float = 2.0  # steps/sec toward snake
var move_timer: float = 0.0
var is_dead: bool = false

# Scatter state
var scattering: bool = false
var scatter_timer: float = 0.0

func _ready() -> void:
	var count := randi_range(4, 8)
	var spawn := Vector2(_random_edge()) * TILE
	center_pos = spawn
	for i in range(count):
		var offset := Vector2(randf_range(-30, 30), randf_range(-30, 30))
		units.append({"pos": spawn + offset, "alive": true})

func _process(delta: float) -> void:
	if is_dead:
		return

	# Count alive units
	var alive_count := 0
	for u in units:
		if u["alive"]:
			alive_count += 1
	if alive_count == 0:
		_all_dead()
		return

	# Scatter logic
	if scattering:
		scatter_timer -= delta
		if scatter_timer <= 0.0:
			scattering = false

	# Move center toward snake head
	var snake := get_node_or_null("../../Snake")
	if snake and snake.body.size() > 0 and not scattering:
		var target := Vector2(snake.body[0]) * TILE + Vector2(TILE, TILE) * 0.5
		var dir := (target - center_pos).normalized()
		center_pos += dir * center_speed * TILE * delta

	# Boid movement
	move_timer += delta
	if move_timer >= 0.05:  # 20 updates/sec for smooth flocking
		move_timer = 0.0
		_update_boids(delta * 20.0)

	_check_snake_collision()
	queue_redraw()

func _update_boids(dt: float) -> void:
	for i in range(units.size()):
		if not units[i]["alive"]:
			continue

		var pos: Vector2 = units[i]["pos"]
		var sep := Vector2.ZERO
		var ali := Vector2.ZERO
		var coh := Vector2.ZERO
		var neighbors := 0

		for j in range(units.size()):
			if i == j or not units[j]["alive"]:
				continue
			var other: Vector2 = units[j]["pos"]
			var diff := pos - other
			var dist := diff.length()
			if dist < 60.0 and dist > 0.01:
				sep += diff.normalized() / dist * 20.0
				coh += other
				neighbors += 1

		if neighbors > 0:
			coh = coh / float(neighbors)
			coh = (coh - pos) * 0.02
			ali = ali * 0.1  # minimal alignment without velocity tracking

		# Cohesion toward center
		var to_center := (center_pos - pos) * 0.03

		var velocity := sep + coh + ali + to_center

		if scattering:
			# Scatter: move away from center
			var scatter_dir := (pos - center_pos).normalized()
			velocity = scatter_dir * 3.0

		# Clamp speed
		if velocity.length() > 3.0:
			velocity = velocity.normalized() * 3.0

		var new_pos := pos + velocity * dt

		# Keep in bounds
		new_pos.x = clampf(new_pos.x, 0, (GRID_W - 1) * TILE)
		new_pos.y = clampf(new_pos.y, 0, (GRID_H - 1) * TILE)

		units[i]["pos"] = new_pos

func _check_snake_collision() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive or snake.body.size() == 0:
		return
	if snake.is_invulnerable():
		return
	var head_world := Vector2(snake.body[0]) * TILE + Vector2(TILE, TILE) * 0.5
	for u in units:
		if not u["alive"]:
			continue
		var dist := (u["pos"] as Vector2 - head_world).length()
		if dist < TILE * 0.7:
			snake._die()
			return

func hit_unit_at(world_pos: Vector2) -> bool:
	for u in units:
		if not u["alive"]:
			continue
		var dist := (u["pos"] as Vector2 - world_pos).length()
		if dist < TILE:
			u["alive"] = false
			# Check scatter threshold
			var alive_count := 0
			var total := 0
			for u2 in units:
				total += 1
				if u2["alive"]:
					alive_count += 1
			if alive_count > 0 and alive_count <= total / 2 and not scattering:
				scattering = true
				scatter_timer = 2.0
			return true
	return false

func take_damage(_amount: int = 1) -> void:
	# Damage one random alive unit
	var alive_indices: Array[int] = []
	for i in range(units.size()):
		if units[i]["alive"]:
			alive_indices.append(i)
	if alive_indices.size() > 0:
		var idx := alive_indices[randi_range(0, alive_indices.size() - 1)]
		units[idx]["alive"] = false
		# Check scatter
		var alive_count := alive_indices.size() - 1
		if alive_count > 0 and alive_count <= units.size() / 2 and not scattering:
			scattering = true
			scatter_timer = 2.0
		if alive_count == 0:
			_all_dead()

func _all_dead() -> void:
	is_dead = true
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += 200
		snake.score_changed.emit(snake.score)
	queue_free()

func get_grid_positions() -> Array[Vector2i]:
	var positions: Array[Vector2i] = []
	for u in units:
		if u["alive"]:
			var world_pos: Vector2 = u["pos"]
			positions.append(Vector2i(int(world_pos.x / TILE), int(world_pos.y / TILE)))
	return positions

func _random_edge() -> Vector2i:
	var side := randi_range(0, 3)
	match side:
		0: return Vector2i(randi_range(0, GRID_W - 1), 0)
		1: return Vector2i(randi_range(0, GRID_W - 1), GRID_H - 1)
		2: return Vector2i(0, randi_range(0, GRID_H - 1))
		_: return Vector2i(GRID_W - 1, randi_range(0, GRID_H - 1))

# ── drawing ──────────────────────────────────────────────────────────
func _draw() -> void:
	for u in units:
		if not u["alive"]:
			continue
		var pos: Vector2 = u["pos"]
		var s := 3.0
		# Core
		draw_circle(pos, s, Color(0.2, 1.0, 0.3, 0.85))
		# Glow
		draw_circle(pos, s * 2.0, Color(0.2, 1.0, 0.3, 0.12))
