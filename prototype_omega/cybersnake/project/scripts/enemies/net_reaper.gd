# net_reaper.gd — Tier 2 enemy: A* pathfinding hunter
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var grid_pos := Vector2i.ZERO
var hp: int = 2
var speed_steps: float = 5.0
var move_timer: float = 0.0
var path: Array[Vector2i] = []
var path_timer: float = 0.0
var is_dead: bool = false

# Frenzy mode
var frenzy: bool = false
var frenzy_timer: float = 0.0
var base_speed: float = 5.0

# Firewall trail
var firewall_tiles: Array[Dictionary] = []  # {pos: Vector2i, ttl: float}

var astar: AStar2D

func _ready() -> void:
	grid_pos = _random_edge()
	_build_astar()
	_recalc_path()

func _process(delta: float) -> void:
	if is_dead:
		return

	# Update firewalls TTL
	for i in range(firewall_tiles.size() - 1, -1, -1):
		firewall_tiles[i]["ttl"] -= delta
		if firewall_tiles[i]["ttl"] <= 0.0:
			firewall_tiles.remove_at(i)

	# Frenzy timer
	if frenzy:
		frenzy_timer -= delta
		if frenzy_timer <= 0.0:
			frenzy = false
			speed_steps = base_speed

	# Recalculate path periodically
	path_timer += delta
	if path_timer >= 0.5:
		path_timer = 0.0
		_recalc_path()

	# Move
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

func _recalc_path() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or snake.body.size() == 0:
		path = []
		return
	var target := snake.body[0]
	var from_id := grid_pos.y * GRID_W + grid_pos.x
	var to_id := target.y * GRID_W + target.x
	from_id = clampi(from_id, 0, GRID_W * GRID_H - 1)
	to_id = clampi(to_id, 0, GRID_W * GRID_H - 1)
	var raw := astar.get_point_path(from_id, to_id)
	path = []
	for p in raw:
		path.append(Vector2i(int(p.x), int(p.y)))
	# Remove current position
	if path.size() > 0:
		path.remove_at(0)

func _step() -> void:
	# Leave firewall at current position
	firewall_tiles.append({"pos": grid_pos, "ttl": 3.0})

	if path.size() > 0:
		grid_pos = path[0]
		path.remove_at(0)
	else:
		# Wander if no path
		var dirs := [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1)]
		var d := dirs[randi_range(0, 3)]
		var next := grid_pos + d
		if next.x >= 0 and next.x < GRID_W and next.y >= 0 and next.y < GRID_H:
			grid_pos = next

func _check_snake_collision() -> void:
	var snake := get_node_or_null("../../Snake")
	if not snake or not snake.is_alive:
		return
	if snake.is_invulnerable():
		return
	# Direct collision with snake head
	if snake.body.size() > 0 and snake.body[0] == grid_pos:
		snake._die()
	# Firewall collision with snake head
	for fw in firewall_tiles:
		if snake.body.size() > 0 and snake.body[0] == fw["pos"]:
			snake._die()

func take_damage(amount: int = 1) -> void:
	hp -= amount
	if hp == 1 and not frenzy:
		# Frenzy at half HP
		frenzy = true
		frenzy_timer = 2.0
		speed_steps = base_speed * 2.0
	if hp <= 0:
		_die()

func _die() -> void:
	is_dead = true
	var snake := get_node_or_null("../../Snake")
	if snake:
		snake.score += 150
		snake.score_changed.emit(snake.score)
	queue_free()

func get_grid_positions() -> Array[Vector2i]:
	var positions: Array[Vector2i] = [grid_pos]
	for fw in firewall_tiles:
		positions.append(fw["pos"] as Vector2i)
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
	# Draw firewall tiles
	for fw in firewall_tiles:
		var fw_pos: Vector2i = fw["pos"]
		var rect := Rect2(Vector2(fw_pos) * TILE, Vector2(TILE, TILE))
		var alpha := clampf(fw["ttl"] / 3.0, 0.1, 0.5)
		draw_rect(rect, Color(1.0, 0.2, 0.0, alpha))

	# Draw reaper body
	var center := Vector2(grid_pos) * TILE + Vector2(TILE, TILE) * 0.5
	var s := TILE * 0.45

	var color := Color(0.8, 0.1, 1.0, 0.95)
	if frenzy:
		color = Color(1.0, 0.0, 0.3, 1.0)

	# Triangle pointing in movement direction
	var pts := PackedVector2Array([
		center + Vector2(0, -s),
		center + Vector2(s, s * 0.7),
		center + Vector2(-s, s * 0.7),
	])
	draw_colored_polygon(pts, color)
	# Glow
	var glow_pts := PackedVector2Array([
		center + Vector2(0, -s * 1.4),
		center + Vector2(s * 1.4, s),
		center + Vector2(-s * 1.4, s),
	])
	draw_colored_polygon(glow_pts, Color(color.r, color.g, color.b, 0.12))
