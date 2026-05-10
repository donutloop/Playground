shader_type canvas_item;
render_mode unshaded;

uniform vec4 bg_color : source_color = vec4(0.01, 0.01, 0.03, 1.0);
uniform vec4 line_color : source_color = vec4(0.0, 0.7, 1.0, 0.07);
uniform float grid_size : hint_range(4.0, 64.0) = 16.0;
uniform float line_width : hint_range(0.5, 3.0) = 1.0;
uniform float scroll_speed : hint_range(0.0, 20.0) = 4.0;
uniform float pulse_speed : hint_range(0.0, 5.0) = 1.5;
uniform float pulse_amount : hint_range(0.0, 1.0) = 0.3;

void fragment() {
	vec2 pixel = UV * vec2(640.0, 640.0);
	pixel.y += TIME * scroll_speed;

	vec2 grid = abs(mod(pixel + 0.5, grid_size) - 0.5 * grid_size);
	float d = min(grid.x, grid.y);
	float line = 1.0 - smoothstep(0.0, line_width, d);

	float pulse = 1.0 + pulse_amount * sin(TIME * pulse_speed);
	vec4 glow = line_color * line * pulse;

	COLOR = bg_color + glow;
}
