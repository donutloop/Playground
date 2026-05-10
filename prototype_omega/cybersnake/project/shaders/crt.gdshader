shader_type canvas_item;
render_mode unshaded;

uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_nearest;
uniform float scanline_strength : hint_range(0.0, 1.0) = 0.25;
uniform float scanline_freq : hint_range(100.0, 800.0) = 320.0;
uniform float chromatic_offset : hint_range(0.0, 4.0) = 1.2;
uniform float vignette_strength : hint_range(0.0, 1.0) = 0.35;
uniform float curvature : hint_range(0.0, 15.0) = 3.5;
uniform float flicker_strength : hint_range(0.0, 0.1) = 0.015;

vec2 curve(vec2 uv) {
	uv = uv * 2.0 - 1.0;
	vec2 off = abs(uv.yx) / curvature;
	uv += uv * off * off;
	return uv * 0.5 + 0.5;
}

void fragment() {
	vec2 uv = curve(SCREEN_UV);

	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
		COLOR = vec4(0.0, 0.0, 0.0, 1.0);
	} else {
		// chromatic aberration
		float r = texture(screen_texture, vec2(uv.x + chromatic_offset * SCREEN_PIXEL_SIZE.x, uv.y)).r;
		float g = texture(screen_texture, uv).g;
		float b = texture(screen_texture, vec2(uv.x - chromatic_offset * SCREEN_PIXEL_SIZE.x, uv.y)).b;
		vec3 color = vec3(r, g, b);

		// scanlines
		float sl = sin(uv.y * scanline_freq * PI) * 0.5 + 0.5;
		color *= 1.0 - scanline_strength * (1.0 - sl);

		// vignette
		float vig = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
		color *= clamp(pow(16.0 * vig, vignette_strength), 0.0, 1.0);

		// flicker
		color *= 1.0 + flicker_strength * sin(TIME * 17.0);

		COLOR = vec4(color, 1.0);
	}
}
