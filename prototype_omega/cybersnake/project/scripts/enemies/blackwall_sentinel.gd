# blackwall_sentinel.gd — BOSS: 3×3 tile multi-phase defense AI
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var grid_pos := Vector2i(18, 18)  # top-left of 3×3 zone
var hp: int = 10
var max_hp: int = 10
var is_dead: bool = false

# Phase management
var phase: int = 1  # 1, 2, or 3
var phase_timer: float = 0.0

# Phase 1: drone spawning
var drone_spawn_timer: float = 5.0

# Phase 2: laser sweep
var laser_active: bool = false
var laser_warning: bool = false
var laser_timer: float = 0.0
var laser_warn_timer: float = 0.0
var laser_is_row: bool = true
var laser_index: int = 0
var laser_cooldown: float = 4.0

# Phase 3: grid shrink
var shrink_timer: float = 8.0
var border_shrink: int = 0

# Animation
var pulse: float = 0.0

func _ready() -> void:
	# Center the boss
	grid_pos = Vector2i(GRID_W / 2 - 1, GRID_H / 2 - 1)

func _process(delta: float) -> void:
	if is_dead:
		return

	pulse += delta
	_update_phase()

	match phase:
		1: _phase1(delta)
		2: _phase2(delta)
		3: _phase3(delta)

	_check_snake_collision()
	queue_redraw()

func _update_phase() -> void:
	if hp > 7:
		phase = 1
	elif hp > 3:
		phase = 2
	else:
		phase = 3

func _phase1(delta: float) -> void:
	# Spawn drones every 5 seconds
	drone_spawn_timer -= delta
	if drone_spawn_timer <= 0.0:
		drone_spawn_timer = 5.0
		_spawn_drones(2)

func _phase2(delta: float) -> void:
	# Also keep spawning drones (slower)
	drone_spawn_timer -= delta
	if drone_spawn_timer <= 0.0:
		drone_spawn_timer = 8.0
		_spawn_drones(1)

	# Laser sweep logic
	if laser_active:
		laser_timer -= delta
		if laser_timer <= 0.0:
			laser_active = false
			laser_cooldown = randf_range(3.0, 5.0)
			_apply_laser_damage()
	elif laser_warning:
		laser_warn_timer -= delta
		if laser_warn_timer <= 0.0:
			laser_warning = false
			laser_active = true
			laser_timer = 0.3  # brief flash
	else:
		laser_cooldown -= delta
		if laser_cooldown <= 0.0:
			_start_laser_warning()

func _phase3(delta: float) -> void:
	# Continue phase 2 behavior
	_phase2(delta)

	# Shrink grid border
	shrink_timer -= delta
	if shrink_timer <= 0.0:
		shrink_timer = 8.0
		border_shrink = mini(border_shrink + 1, 10)
		# Kill snake if they're now outside the border
		var snake := get_node_or_null("../../Snake")
		if snake and snake.is_alive and snake.body.size() > 0:
			var head := snake.body[0]
			if head.x < border_shrink or head.x >= GRID_W - border_shrink:
				snake._die()
			elif head.y < border_shrink or head.y >= GRID_H - border_shrink:
				snake._die()

func _spawn_drones(count: int) -> void:
	var manager := get_parent()
	if not manager:
		return
	for i in range(count):
		var script := load("res://scripts/enemies/glitch_drone.gd") as GDScript
		if script:
			var drone := Node2D.new()
			drone.set_script(script)
			manager.add_child(drone)
			if manager.has_method("_track_enemy"):
				pass
			# Track in manager's enemies array
			if "enemies" in manager:
				manager.enemies.append(drone)

func _start_laser_warning() -> void:
	laser_warning = true
	laser_warn_timer = 0.5  # 0.5s warning
	laser_is_row = randf() > 0.5
	if laser_is_row:
		laser_index = randi_range(border_shrink + 2, GRID_H - border_shrink - 3)
	else:
		laser_index = randi_range(border_shrink + 2, GRID_W - border_shrink - 3)

func _apply_laser_damage() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive or snake.body.size() == 0:
		return
	var head := snake.body[0]
	if laser_is_row and head.y == laser_index:
		snake._die()
	elif not laser_is_row and head.x == laser_index:
		snake._die()

func _check_snake_collision() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive or snake.body.size() == 0:
		return
	if snake.is_invulnerable():
		return
	var head := snake.body[0]
	# 3×3 body collision
	for dy in range(3):
		for dx in range(3):
			if head == grid_pos + Vector2i(dx, dy):
				snake._die()

func take_damage(amount: int = 1) -> void:
	hp -= amount
	if hp <= 0:
		_die()

func _die() -> void:
	is_dead = true
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += 2000
		snake.score_changed.emit(snake.score)
	# Clear all enemies
	var manager := get_parent()
	if manager and "enemies" in manager:
		for e in manager.enemies:
			if is_instance_valid(e) and e != self:
				e.queue_free()
	# Show victory via HUD
	var hud := get_node_or_null("../../HUD")
	if hud:
		hud.show_wave_announce(0)
		hud.wave_announce.text = ">>> FLATLINE COMPLETE <<<"
	queue_free()

func get_grid_positions() -> Array[Vector2i]:
	var positions: Array[Vector2i] = []
	for dy in range(3):
		for dx in range(3):
			positions.append(grid_pos + Vector2i(dx, dy))
	return positions

# ── drawing ──────────────────────────────────────────────────────────
func _draw() -> void:
	# Draw shrunk border (Phase 3)
	if border_shrink > 0:
		var border_color := Color(1.0, 0.0, 0.2, 0.25)
		# Top
		draw_rect(Rect2(0, 0, GRID_W * TILE, border_shrink * TILE), border_color)
		# Bottom
		draw_rect(Rect2(0, (GRID_H - border_shrink) * TILE, GRID_W * TILE, border_shrink * TILE), border_color)
		# Left
		draw_rect(Rect2(0, border_shrink * TILE, border_shrink * TILE, (GRID_H - border_shrink * 2) * TILE), border_color)
		# Right
		draw_rect(Rect2((GRID_W - border_shrink) * TILE, border_shrink * TILE, border_shrink * TILE, (GRID_H - border_shrink * 2) * TILE), border_color)

	# Draw laser warning / beam
	if laser_warning or laser_active:
		var lc: Color
		if laser_active:
			lc = Color(1.0, 1.0, 1.0, 0.9)
		else:
			var blink := sin(pulse * 20.0) * 0.5 + 0.5
			lc = Color(1.0, 0.3, 0.1, blink * 0.6)

		if laser_is_row:
			draw_rect(Rect2(0, laser_index * TILE, GRID_W * TILE, TILE), lc)
		else:
			draw_rect(Rect2(laser_index * TILE, 0, TILE, GRID_H * TILE), lc)

	# Draw boss body (3×3)
	var body_rect := Rect2(Vector2(grid_pos) * TILE, Vector2(3, 3) * TILE)
	var p := sin(pulse * 2.0) * 0.1

	# Outer glow
	draw_rect(body_rect.grow(4.0), Color(1.0, 0.0, 0.3, 0.1 + p))

	# Core body
	var phase_color: Color
	match phase:
		1: phase_color = Color(0.8, 0.0, 0.2, 0.9)
		2: phase_color = Color(1.0, 0.5, 0.0, 0.9)
		_: phase_color = Color(1.0, 0.0, 0.5, 0.9)
	draw_rect(body_rect.grow(-1.0), phase_color)

	# HP bar above boss
	var bar_y := body_rect.position.y - 8.0
	var bar_w := body_rect.size.x
	var hp_ratio := float(hp) / float(max_hp)
	draw_rect(Rect2(body_rect.position.x, bar_y, bar_w, 4), Color(0.2, 0.2, 0.2, 0.7))
	draw_rect(Rect2(body_rect.position.x, bar_y, bar_w * hp_ratio, 4), Color(1.0, 0.1, 0.2, 0.9))

	# Phase indicator
	var txt_pos := body_rect.position + Vector2(body_rect.size.x * 0.5 - 8, body_rect.size.y * 0.5 + 4)
	draw_string(ThemeDB.fallback_font, txt_pos, "P%d" % phase, HORIZONTAL_ALIGNMENT_CENTER, -1, 10, Color.WHITE)
