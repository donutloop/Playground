# spawner.gd — ICE shard spawner
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40
const MAX_SHARDS := 3

var shards: Array[Vector2i] = []
var shard_timer: float = 0.0
var shard_anim: float = 0.0

func _ready() -> void:
	_spawn_shard()

func _process(delta: float) -> void:
	shard_anim += delta
	# Maintain at least 1 shard on the grid
	if shards.size() < 1:
		_spawn_shard()
	# Periodically spawn up to MAX
	shard_timer += delta
	if shard_timer > 5.0 and shards.size() < MAX_SHARDS:
		shard_timer = 0.0
		_spawn_shard()
	queue_redraw()

func _spawn_shard() -> void:
	var snake := get_node_or_null("../Snake")
	var occupied: Array[Vector2i] = []
	if snake:
		occupied = snake.get_occupied_cells()
	occupied.append_array(shards)

	for _attempt in range(200):
		var pos := Vector2i(randi_range(1, GRID_W - 2), randi_range(1, GRID_H - 2))
		if pos not in occupied:
			shards.append(pos)
			return

func try_eat(head_pos: Vector2i) -> bool:
	var idx := shards.find(head_pos)
	if idx >= 0:
		shards.remove_at(idx)
		return true
	return false

func get_shard_positions() -> Array[Vector2i]:
	return shards

# ── drawing ──────────────────────────────────────────────────────────
func _draw() -> void:
	for shard in shards:
		var center := Vector2(shard) * TILE + Vector2(TILE, TILE) * 0.5
		var pulse := 1.0 + 0.2 * sin(shard_anim * 3.0 + float(shard.x + shard.y))
		var s := 5.0 * pulse

		# Outer glow
		var glow_pts := PackedVector2Array([
			center + Vector2(0, -s * 1.6),
			center + Vector2(s * 1.6, 0),
			center + Vector2(0, s * 1.6),
			center + Vector2(-s * 1.6, 0),
		])
		draw_colored_polygon(glow_pts, Color(0.4, 0.85, 1.0, 0.12))

		# Core diamond
		var pts := PackedVector2Array([
			center + Vector2(0, -s),
			center + Vector2(s, 0),
			center + Vector2(0, s),
			center + Vector2(-s, 0),
		])
		draw_colored_polygon(pts, Color(0.6, 0.95, 1.0, 0.9))
