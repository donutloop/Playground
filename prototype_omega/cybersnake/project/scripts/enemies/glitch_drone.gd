# glitch_drone.gd — Tier 1 enemy: random walk with glitch stutters
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var grid_pos := Vector2i.ZERO
var direction := Vector2i(1, 0)
var hp: int = 1
var speed_steps: float = 3.0  # steps/sec
var move_timer: float = 0.0
var ticks_until_turn: int = 4
var tick_count: int = 0

# Glitch stutter
var glitch_timer: float = 0.0
var glitch_cooldown: float = 0.0
var is_glitching: bool = false
var glitch_flash: float = 0.0

var is_dead: bool = false

const DIRECTIONS := [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1)]

func _ready() -> void:
	# Spawn at random edge
	grid_pos = _random_edge()
	ticks_until_turn = randi_range(3, 6)
	glitch_cooldown = randf_range(2.0, 5.0)

func _process(delta: float) -> void:
	if is_dead:
		return

	# Glitch timer
	glitch_cooldown -= delta
	if glitch_cooldown <= 0.0 and not is_glitching:
		is_glitching = true
		glitch_timer = randf_range(0.15, 0.35)
		glitch_flash = 1.0

	if is_glitching:
		glitch_timer -= delta
		glitch_flash = maxf(glitch_flash - delta * 4.0, 0.0)
		if glitch_timer <= 0.0:
			is_glitching = false
			glitch_cooldown = randf_range(2.0, 5.0)
		queue_redraw()
		return  # frozen during glitch

	move_timer += delta
	var interval := 1.0 / speed_steps
	if move_timer >= interval:
		move_timer = 0.0
		_step()
		queue_redraw()

	# Check collision with snake
	_check_snake_collision()

func _step() -> void:
	tick_count += 1
	if tick_count >= ticks_until_turn:
		tick_count = 0
		ticks_until_turn = randi_range(3, 6)
		direction = DIRECTIONS[randi_range(0, 3)]

	var next := grid_pos + direction
	# Bounce off walls
	if next.x < 0 or next.x >= GRID_W or next.y < 0 or next.y >= GRID_H:
		direction = -direction
		next = grid_pos + direction

	grid_pos = next

func _check_snake_collision() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive:
		return
	if snake.is_invulnerable():
		return
	if snake.body.size() > 0 and snake.body[0] == grid_pos:
		snake._die()

func take_damage(amount: int = 1) -> void:
	hp -= amount
	if hp <= 0:
		_die()

func _die() -> void:
	is_dead = true
	# Add score
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += 50
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
	var center := Vector2(grid_pos) * TILE + Vector2(TILE, TILE) * 0.5
	var s := TILE * 0.4

	# Glitch flash
	var base_color := Color(1.0, 0.3, 0.1, 0.9)
	if is_glitching:
		var flash := sin(glitch_flash * 20.0) * 0.5 + 0.5
		base_color = Color(1.0, 1.0, 1.0, flash)
		# Offset for glitch effect
		center.x += randf_range(-2.0, 2.0)
		center.y += randf_range(-2.0, 2.0)

	# Body
	var rect := Rect2(center - Vector2(s, s), Vector2(s * 2, s * 2))
	draw_rect(rect, base_color)

	# Glow
	draw_rect(rect.grow(2.0), Color(1.0, 0.3, 0.1, 0.15))
