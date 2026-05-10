# hud.gd — HUD overlay (reused from 2D, works on CanvasLayer in 3D)
extends CanvasLayer

@onready var score_label: Label = $ScoreLabel
@onready var wave_label: Label = $WaveLabel
@onready var length_label: Label = $LengthLabel
@onready var death_screen: ColorRect = $DeathScreen
@onready var wave_announce: Label = $WaveAnnounce

var announce_timer: float = 0.0

func _ready() -> void:
	death_screen.visible = false
	wave_announce.visible = false
	call_deferred("_connect_signals")
	update_hud(0, 1, 3)

func _connect_signals() -> void:
	var snake := get_node_or_null("../Snake")
	if snake:
		if snake.has_signal("score_changed"):
			snake.score_changed.connect(_on_score_changed)
		if snake.has_signal("died"):
			snake.died.connect(_on_snake_died)
		if snake.has_signal("ate_shard"):
			snake.ate_shard.connect(_on_ate_shard)

func _process(delta: float) -> void:
	if wave_announce.visible:
		announce_timer -= delta
		if announce_timer <= 0.0:
			wave_announce.visible = false
		else:
			wave_announce.modulate.a = clampf(announce_timer / 0.5, 0.0, 1.0)

	if death_screen.visible and Input.is_action_just_pressed("ui_accept"):
		get_tree().reload_current_scene()

func update_hud(p_score: int, wave: int, length: int) -> void:
	score_label.text = "SCORE: %d" % p_score
	wave_label.text = "WAVE: %d" % wave
	length_label.text = "LEN: %d" % length

func show_wave_announce(wave: int) -> void:
	if not wave_announce:
		return
	wave_announce.text = ">>> WAVE %d <<<" % wave
	wave_announce.visible = true
	announce_timer = 2.0
	wave_announce.modulate.a = 1.0

func _on_score_changed(new_score: int) -> void:
	var snake := get_node_or_null("../Snake")
	var length: int = snake.body.size() if snake else 0
	update_hud(new_score, 1, length)

func _on_ate_shard() -> void:
	var snake := get_node_or_null("../Snake")
	var length: int = snake.body.size() if snake else 0
	var sc: int = snake.score if snake else 0
	update_hud(sc, 1, length)

func _on_snake_died() -> void:
	death_screen.visible = true
