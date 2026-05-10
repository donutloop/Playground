# enemy_manager.gd — Wave system & enemy lifecycle
extends Node2D

const TILE := 16
const GRID_W := 40
const GRID_H := 40

var wave: int = 0
var wave_timer: float = 0.0
var wave_delay: float = 3.0  # seconds between waves
var enemies: Array[Node] = []
var between_waves: bool = true

signal wave_started(wave_num: int)
signal wave_cleared(wave_num: int)

func _ready() -> void:
	# Defer to next frame so HUD @onready vars are initialized
	call_deferred("_start_next_wave")

func _process(delta: float) -> void:
	# Clean dead enemies
	enemies = enemies.filter(func(e: Node) -> bool: return is_instance_valid(e) and e.is_inside_tree())

	# Wave cleared?
	if not between_waves and enemies.size() == 0:
		between_waves = true
		wave_cleared.emit(wave)
		wave_timer = 0.0

	# Timer for next wave
	if between_waves:
		wave_timer += delta
		if wave_timer >= wave_delay:
			_start_next_wave()

func _start_next_wave() -> void:
	wave += 1
	between_waves = false
	wave_started.emit(wave)

	# Notify HUD
	var hud := get_node_or_null("../HUD")
	if hud and hud.wave_label:
		hud.show_wave_announce(wave)
		hud.wave_label.text = "WAVE: %d" % wave

	_spawn_wave(wave)

func _spawn_wave(w: int) -> void:
	# Tier 1: Glitch Drones — wave 1+
	var drone_count := mini(w + 1, 6)
	for i in range(drone_count):
		_spawn_enemy("res://scripts/enemies/glitch_drone.gd")

	# Tier 2: Virus Swarm — wave 2+
	if w >= 2:
		_spawn_enemy("res://scripts/enemies/virus_swarm.gd")

	# Tier 2: Net Reaper — wave 3+
	if w >= 3:
		var reaper_count := mini(w - 2, 3)
		for i in range(reaper_count):
			_spawn_enemy("res://scripts/enemies/net_reaper.gd")

	# Tier 3: Compiler Worm — wave 4+
	if w >= 4:
		_spawn_enemy("res://scripts/enemies/compiler_worm.gd")

	# Tier 3: Phantom Protocol — wave 5+
	if w >= 5:
		_spawn_enemy("res://scripts/enemies/phantom_protocol.gd")

	# Boss: wave 10
	if w == 10:
		_spawn_enemy("res://scripts/enemies/blackwall_sentinel.gd")

func _spawn_enemy(script_path: String) -> void:
	var script := load(script_path) as GDScript
	if not script:
		return
	var enemy := Node2D.new()
	enemy.set_script(script)
	add_child(enemy)
	enemies.append(enemy)

func get_enemy_positions() -> Array[Vector2i]:
	var positions: Array[Vector2i] = []
	for e in enemies:
		if e.has_method("get_grid_positions"):
			positions.append_array(e.get_grid_positions())
	return positions

func _get_random_edge_cell() -> Vector2i:
	var side := randi_range(0, 3)
	match side:
		0: return Vector2i(randi_range(0, GRID_W - 1), 0)
		1: return Vector2i(randi_range(0, GRID_W - 1), GRID_H - 1)
		2: return Vector2i(0, randi_range(0, GRID_H - 1))
		_: return Vector2i(GRID_W - 1, randi_range(0, GRID_H - 1))
