# hud.gd — Heads-up display controller
extends CanvasLayer

@onready var score_label: Label = $ScoreLabel
@onready var wave_label: Label = $WaveLabel
@onready var length_label: Label = $LengthLabel
@onready var death_screen: ColorRect = $DeathScreen
@onready var death_label: Label = $DeathScreen/DeathLabel
@onready var restart_label: Label = $DeathScreen/RestartLabel
@onready var wave_announce: Label = $WaveAnnounce

var announce_timer: float = 0.0

func _ready() -> void:
	death_screen.visible = false
	wave_announce.visible = false
	var snake := get_node_or_null("../Snake")
	if snake:
		snake.score_changed.connect(_on_score_changed)
		snake.died.connect(_on_snake_died)
		snake.ate_shard.connect(_on_ate_shard)
	update_hud(0, 1, 3)

func _process(delta: float) -> void:
	# Wave announce fade-out
	if wave_announce.visible:
		announce_timer -= delta
		if announce_timer <= 0.0:
			wave_announce.visible = false
		else:
			wave_announce.modulate.a = clampf(announce_timer / 0.5, 0.0, 1.0)

	# Restart on death
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
