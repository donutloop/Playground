# compiler_worm.gd — Tier 3 enemy: snake-like trail, competes for food
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var body: Array[Vector2i] = []
var direction := Vector2i(1, 0)
var speed_steps: float = 4.0
var move_timer: float = 0.0
var is_dead: bool = false
var path_timer: float = 0.0

var astar: AStar2D

func _ready() -> void:
	var start := _random_edge()
	var length := randi_range(5, 8)
	body = [start]
	for i in range(1, length):
		body.append(start - Vector2i(i, 0))
	_build_astar()

func _process(delta: float) -> void:
	if is_dead:
		return

	path_timer += delta
	move_timer += delta
	var interval := 1.0 / speed_steps
	if move_timer >= interval:
		move_timer = 0.0
		_step()

	_check_snake_collision()
	queue_redraw()

func _build_astar() -> void:
	astar = AStar2D.new()
	for y in range(GRID_H):
		for x in range(GRID_W):
			var id := y * GRID_W + x
			astar.add_point(id, Vector2(x, y))
	for y in range(GRID_H):
		for x in range(GRID_W):
			var id := y * GRID_W + x
			if x < GRID_W - 1:
				astar.connect_points(id, id + 1)
			if y < GRID_H - 1:
				astar.connect_points(id, id + GRID_W)

func _step() -> void:
	if body.size() == 0:
		return

	var head := body[0]

	# Find nearest ICE shard
	var spawner := get_node_or_null("../../ICEShardSpawner")
	var target: Vector2i = head + direction  # default: continue forward

	if spawner and spawner.shards.size() > 0:
		# Find closest shard
		var best_dist := 99999.0
		var best_shard := spawner.shards[0]
		for s in spawner.shards:
			var dist := (Vector2(s) - Vector2(head)).length()
			if dist < best_dist:
				best_dist = dist
				best_shard = s

		# A* toward shard
		var from_id := clampi(head.y * GRID_W + head.x, 0, GRID_W * GRID_H - 1)
		var to_id := clampi(best_shard.y * GRID_W + best_shard.x, 0, GRID_W * GRID_H - 1)
		var raw := astar.get_point_path(from_id, to_id)
		if raw.size() > 1:
			target = Vector2i(int(raw[1].x), int(raw[1].y))

	# Clamp to bounds
	target.x = clampi(target.x, 0, GRID_W - 1)
	target.y = clampi(target.y, 0, GRID_H - 1)

	# Update direction
	direction = target - head

	# Move body
	body.push_front(target)

	# Check if we ate a shard
	if spawner and spawner.try_eat(target):
		# Grow: don't remove tail
		speed_steps = minf(speed_steps + 0.3, 8.0)
	else:
		body.pop_back()

func _check_snake_collision() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive or snake.body.size() == 0:
		return
	if snake.is_invulnerable():
		return
	var snake_head := snake.body[0]
	for cell in body:
		if cell == snake_head:
			snake._die()
			return

func take_damage(amount: int = 1) -> void:
	# Damage removes tail segments
	for i in range(amount):
		if body.size() > 1:
			body.pop_back()
		else:
			_die()
			return

func hit_segment(seg_pos: Vector2i) -> void:
	# Find and remove the segment
	var idx := body.find(seg_pos)
	if idx >= 0:
		if idx == 0:
			# Head killed — whole worm dies
			_die_full()
		else:
			# Remove this and all segments after it
			body.resize(idx)
			if body.size() == 0:
				_die()

func _die_full() -> void:
	is_dead = true
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += 250 + body.size() * 30
		snake.score_changed.emit(snake.score)
	queue_free()

func _die() -> void:
	is_dead = true
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += body.size() * 30
		snake.score_changed.emit(snake.score)
	queue_free()

func get_grid_positions() -> Array[Vector2i]:
	return body

func _random_edge() -> Vector2i:
	var side := randi_range(0, 3)
	match side:
		0: return Vector2i(randi_range(5, GRID_W - 6), 1)
		1: return Vector2i(randi_range(5, GRID_W - 6), GRID_H - 2)
		2: return Vector2i(1, randi_range(5, GRID_H - 6))
		_: return Vector2i(GRID_W - 2, randi_range(5, GRID_H - 6))

# ── drawing ──────────────────────────────────────────────────────────
func _draw() -> void:
	for i in range(body.size()):
		var cell := body[i]
		var rect := Rect2(Vector2(cell) * TILE, Vector2(TILE, TILE))
		var inset := rect.grow(-1.0)

		if i == 0:
			# Head — bright red
			draw_rect(inset, Color(1.0, 0.2, 0.15, 0.95))
			draw_rect(inset.grow(2.0), Color(1.0, 0.2, 0.15, 0.15))
		else:
			var t := float(i) / float(body.size())
			var alpha := lerpf(0.85, 0.3, t)
			draw_rect(inset, Color(0.9, 0.15, 0.1, alpha))
