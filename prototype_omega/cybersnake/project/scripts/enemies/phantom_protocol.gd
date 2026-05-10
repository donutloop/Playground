# phantom_protocol.gd — Tier 3 enemy: teleport + predict
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var grid_pos := Vector2i.ZERO
var hp: int = 3
var speed_steps: float = 7.0
var move_timer: float = 0.0
var is_dead: bool = false

# Invisibility
var visible_phase: bool = true
var phase_timer: float = 0.0
var invis_duration: float = 2.0
var visible_duration: float = 1.5
var alpha: float = 1.0

# Decoys
var decoys: Array[Dictionary] = []  # {pos: Vector2i, ttl: float}

func _ready() -> void:
	grid_pos = _random_edge()
	phase_timer = visible_duration

func _process(delta: float) -> void:
	if is_dead:
		return

	# Phase cycling
	phase_timer -= delta
	if phase_timer <= 0.0:
		if visible_phase:
			# Go invisible
			visible_phase = false
			phase_timer = randf_range(1.0, 3.0)
			# Spawn decoys
			_spawn_decoys()
		else:
			# Reappear — teleport to predicted snake position
			visible_phase = true
			phase_timer = visible_duration
			_teleport_to_prediction()

	# Fade alpha
	if visible_phase:
		alpha = lerpf(alpha, 1.0, delta * 8.0)
	else:
		alpha = lerpf(alpha, 0.0, delta * 6.0)

	# Move toward snake when visible
	if visible_phase:
		move_timer += delta
		var interval := 1.0 / speed_steps
		if move_timer >= interval:
			move_timer = 0.0
			_step_toward_snake()

	# Update decoys
	for i in range(decoys.size() - 1, -1, -1):
		decoys[i]["ttl"] -= delta
		if decoys[i]["ttl"] <= 0.0:
			decoys.remove_at(i)

	_check_snake_collision()
	queue_redraw()

func _step_toward_snake() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or snake.body.size() == 0:
		return
	var target := snake.body[0]
	var diff := target - grid_pos
	# Move in the axis with greater distance
	if abs(diff.x) >= abs(diff.y):
		grid_pos.x += signi(diff.x)
	else:
		grid_pos.y += signi(diff.y)
	grid_pos.x = clampi(grid_pos.x, 0, GRID_W - 1)
	grid_pos.y = clampi(grid_pos.y, 0, GRID_H - 1)

func _teleport_to_prediction() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or snake.body.size() == 0:
		return
	# Predict: current head + direction * 4
	var predicted := snake.body[0] + snake.direction * 4
	predicted.x = clampi(predicted.x, 1, GRID_W - 2)
	predicted.y = clampi(predicted.y, 1, GRID_H - 2)
	grid_pos = predicted

func _spawn_decoys() -> void:
	for i in range(randi_range(1, 3)):
		var dpos := Vector2i(randi_range(2, GRID_W - 3), randi_range(2, GRID_H - 3))
		decoys.append({"pos": dpos, "ttl": randf_range(1.5, 3.0)})

func _check_snake_collision() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive or snake.body.size() == 0:
		return
	if snake.is_invulnerable():
		return
	if snake.body[0] == grid_pos:
		snake._die()

func take_damage(amount: int = 1) -> void:
	hp -= amount
	if hp <= 0:
		_die()

func _die() -> void:
	is_dead = true
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += 300
		snake.score_changed.emit(snake.score)
	queue_free()

func get_grid_positions() -> Array[Vector2i]:
	return [grid_pos]

func _random_edge() -> Vector2i:
	var side := randi_range(0, 3)
	match side:
		0: return Vector2i(randi_range(0, GRID_W - 1), 0)
		1: return Vector2i(randi_range(0, GRID_W - 1), GRID_H - 1)
		2: return Vector2i(0, randi_range(0, GRID_H - 1))
		_: return Vector2i(GRID_W - 1, randi_range(0, GRID_H - 1))

# ── drawing ──────────────────────────────────────────────────────────
func _draw() -> void:
	# Draw decoys (faded, no collision)
	for d in decoys:
		var dpos: Vector2i = d["pos"]
		var dc := Vector2(dpos) * TILE + Vector2(TILE, TILE) * 0.5
		var da := clampf(d["ttl"] / 3.0, 0.05, 0.3)
		draw_circle(dc, TILE * 0.35, Color(0.5, 0.2, 1.0, da))

	# Draw main body
	var center := Vector2(grid_pos) * TILE + Vector2(TILE, TILE) * 0.5
	var s := TILE * 0.4
	var color := Color(0.6, 0.15, 1.0, alpha * 0.9)

	# Diamond shape
	var pts := PackedVector2Array([
		center + Vector2(0, -s),
		center + Vector2(s, 0),
		center + Vector2(0, s),
		center + Vector2(-s, 0),
	])
	draw_colored_polygon(pts, color)

	# Glow
	if alpha > 0.3:
		var glow := PackedVector2Array([
			center + Vector2(0, -s * 1.5),
			center + Vector2(s * 1.5, 0),
			center + Vector2(0, s * 1.5),
			center + Vector2(-s * 1.5, 0),
		])
		draw_colored_polygon(glow, Color(0.6, 0.15, 1.0, 0.1 * alpha))
