# snake.gd — Core snake controller
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var body: Array[Vector2i] = []
var direction := Vector2i(1, 0)
var next_direction := Vector2i(1, 0)
var move_timer: float = 0.0
var move_interval: float = 0.125  # 8 steps/sec
var is_alive: bool = true
var score: int = 0

# Brief invulnerability after spawn or eating
var invuln_timer: float = 2.0  # 2 seconds of spawn protection
var just_attacked: bool = false  # true on the frame we hit an enemy

signal died
signal ate_shard
signal score_changed(new_score: int)

func _ready() -> void:
	var cx := GRID_W / 2
	var cy := GRID_H / 2
	body = [
		Vector2i(cx, cy),
		Vector2i(cx - 1, cy),
		Vector2i(cx - 2, cy),
	]
	queue_redraw()

func _process(delta: float) -> void:
	if not is_alive:
		return

	if invuln_timer > 0.0:
		invuln_timer -= delta

	just_attacked = false
	_handle_input()
	move_timer += delta
	if move_timer >= move_interval:
		move_timer = 0.0
		_step()
	queue_redraw()

func _handle_input() -> void:
	var new_dir := direction
	# Support both tap and hold for responsive controls
	if Input.is_action_pressed("ui_up"):
		new_dir = Vector2i(0, -1)
	elif Input.is_action_pressed("ui_down"):
		new_dir = Vector2i(0, 1)
	elif Input.is_action_pressed("ui_left"):
		new_dir = Vector2i(-1, 0)
	elif Input.is_action_pressed("ui_right"):
		new_dir = Vector2i(1, 0)
	# Prevent 180-degree reversal
	if new_dir + direction != Vector2i.ZERO:
		next_direction = new_dir

func _step() -> void:
	direction = next_direction
	var new_head := body[0] + direction

	# Wall collision
	if new_head.x < 0 or new_head.x >= GRID_W or new_head.y < 0 or new_head.y >= GRID_H:
		_die()
		return

	# Self collision (skip tail which is about to move)
	for i in range(body.size() - 1):
		if body[i] == new_head:
			_die()
			return

	body.push_front(new_head)

	# Check for ICE shard
	var spawner := get_node_or_null("../ICEShardSpawner")
	if spawner and spawner.try_eat(new_head):
		ate_shard.emit()
		score += 100
		score_changed.emit(score)
		invuln_timer = 0.3  # brief invuln after eating
	else:
		body.pop_back()

	# Snake attacks enemies it moves into (snake is the aggressor)
	_check_enemy_damage(new_head)

func _check_enemy_damage(head_pos: Vector2i) -> void:
	var manager := get_node_or_null("../EnemyManager")
	if not manager:
		return
	for enemy in manager.get_children():
		if not is_instance_valid(enemy):
			continue
		if not enemy.has_method("take_damage"):
			continue
		if not enemy.has_method("get_grid_positions"):
			continue
		var enemy_cells: Array = enemy.get_grid_positions()
		for cell in enemy_cells:
			if cell == head_pos:
				enemy.take_damage(1)
				just_attacked = true
				invuln_timer = 0.2  # brief invuln after attacking
				return

func is_invulnerable() -> bool:
	return invuln_timer > 0.0 or just_attacked

func _die() -> void:
	if invuln_timer > 0.0:
		return  # protected
	is_alive = false
	died.emit()

func get_occupied_cells() -> Array[Vector2i]:
	return body

# ── drawing ──────────────────────────────────────────────────────────
func _draw() -> void:
	for i in range(body.size()):
		var cell := body[i]
		var rect := Rect2(Vector2(cell) * TILE, Vector2(TILE, TILE))
		var inset := rect.grow(-1.0)

		if i == 0:
			# Head — bright cyan with glow (flash white when invulnerable)
			var head_color := Color(0.0, 1.0, 0.85, 1.0)
			if invuln_timer > 0.0:
				var flash := sin(invuln_timer * 20.0) * 0.5 + 0.5
				head_color = head_color.lerp(Color.WHITE, flash * 0.5)
			draw_rect(inset.grow(2.0), Color(head_color.r, head_color.g, head_color.b, 0.15))
			draw_rect(inset, head_color)
		else:
			# Body — gradient fade toward tail
			var t := float(i) / float(body.size())
			var alpha := lerpf(0.95, 0.35, t)
			var g := lerpf(0.9, 0.5, t)
			draw_rect(inset, Color(0.0, g, 0.6, alpha))
