<script lang="ts">
	import { onMount } from 'svelte';

	export type WeatherShaderMode =
		| 'sunrise'
		| 'sunset'
		| 'clear'
		| 'partly-cloudy'
		| 'haze'
		| 'fog'
		| 'wind'
		| 'cloudy'
		| 'thunderstorm'
		| 'rain'
		| 'heavy-rain'
		| 'drizzle'
		| 'snow'
		| 'heavy-snow'
		| 'wintry-mix'
		| 'clear-night'
		| 'partly-cloudy-night'
		| 'drizzle-night';

	let {
		mode = 'clear'
	}: {
		mode?: WeatherShaderMode;
	} = $props();

	let canvas: HTMLCanvasElement;

	const shaderModeValues: Record<WeatherShaderMode, number> = {
		sunrise: 0,
		sunset: 1,
		clear: 2,
		'partly-cloudy': 3,
		haze: 4,
		fog: 5,
		wind: 6,
		cloudy: 7,
		thunderstorm: 8,
		rain: 9,
		'heavy-rain': 10,
		drizzle: 11,
		snow: 12,
		'heavy-snow': 13,
		'wintry-mix': 14,
		'clear-night': 15,
		'partly-cloudy-night': 16,
		'drizzle-night': 17
	};

	const modeValue = $derived(shaderModeValues[mode]);

	onMount(() => {
		const gl = canvas.getContext('webgl', {
			alpha: true,
			antialias: false,
			depth: false,
			premultipliedAlpha: true
		});

		if (!gl) return;
		const glContext = gl;

		const vertexSource = `
attribute vec2 a_position;
void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
}`;

		const fragmentSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mode;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
		u.y
	);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.52;
	for (int i = 0; i < 5; i++) {
		v += a * noise(p);
		p *= 2.04;
		a *= 0.48;
	}
	return v;
}

float rainLayer(vec2 uv, float speed, float scale, float width) {
	vec2 p = uv * vec2(scale, scale * 1.65);
	p.y += u_time * speed;
	p.x += p.y * 0.16;
	vec2 id = floor(p);
	vec2 f = fract(p);
	float rnd = hash(id);
	float drop = smoothstep(width, 0.0, abs(f.x - rnd));
	drop *= smoothstep(0.88, 0.18, f.y);
	drop *= smoothstep(0.0, 0.22, f.y);
	return drop;
}

float windLayer(vec2 uv) {
	vec2 p = uv * vec2(6.0, 18.0);
	p.x += u_time * 1.7;
	float line = smoothstep(0.06, 0.0, abs(fract(p.y + sin(p.x) * 0.18) - 0.5));
	return line * smoothstep(0.2, 0.95, noise(vec2(floor(p.x), floor(p.y))));
}

float snowLayer(vec2 uv, float scale, float speed) {
	vec2 p = uv * scale;
	p.x += sin(u_time * 0.35 + p.y * 0.8) * 0.35;
	p.y += u_time * speed;
	vec2 id = floor(p);
	vec2 f = fract(p) - 0.5;
	float rnd = hash(id);
	float radius = mix(0.055, 0.16, rnd);
	return smoothstep(radius, 0.0, length(f));
}

vec3 grade(vec2 uv) {
	vec3 night = vec3(0.018, 0.027, 0.055);
	vec3 horizon = vec3(0.08, 0.13, 0.19);
	vec3 blue = vec3(0.04, 0.2, 0.42);
	float radial = smoothstep(0.92, 0.1, distance(uv, vec2(0.68, 0.24)));
	return mix(night, horizon, uv.y * 0.72) + blue * radial * 0.42;
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;
	vec2 p = uv;
	p.x *= u_resolution.x / u_resolution.y;
	vec3 col = grade(uv);
	float mist = fbm(p * 2.0 + vec2(u_time * 0.025, -u_time * 0.015));
	float lowCloud = fbm(p * 3.6 + vec2(-u_time * 0.045, u_time * 0.02));
	float cloud = smoothstep(0.38, 0.82, mist * 0.72 + lowCloud * 0.54 - uv.y * 0.28);

	if (u_mode < 3.5) {
		float isSunrise = 1.0 - step(0.5, u_mode);
		float isSunset = step(0.5, u_mode) * (1.0 - step(1.5, u_mode));
		float isPartly = step(2.5, u_mode);
		vec2 sunPos = mix(vec2(0.22, 0.74), vec2(0.76, 0.24), step(1.5, u_mode));
		sunPos = mix(sunPos, vec2(0.72, 0.28), isPartly);
		float sun = smoothstep(0.28, 0.0, distance(uv, sunPos));
		float haze = fbm(p * 3.0 + u_time * 0.025);
		col += vec3(0.14, 0.34, 0.62) * haze * 0.16;
		col += mix(vec3(0.38, 0.57, 0.85), vec3(0.92, 0.46, 0.22), isSunrise + isSunset) * sun * 0.44;
		col = mix(col, vec3(0.18, 0.22, 0.28), cloud * 0.42 * isPartly);
	} else if (u_mode < 5.5) {
		float fogAmount = mix(0.42, 0.72, step(4.5, u_mode));
		float veil = smoothstep(0.22, 0.9, mist + lowCloud * 0.8);
		col = mix(col, vec3(0.45, 0.50, 0.55), veil * fogAmount);
		col += vec3(0.20, 0.24, 0.28) * (1.0 - uv.y) * fogAmount;
	} else if (u_mode < 6.5) {
		col = mix(col, vec3(0.10, 0.15, 0.19), cloud * 0.35);
		col += vec3(0.42, 0.58, 0.72) * windLayer(uv) * 0.42;
	} else if (u_mode < 7.5) {
		col = mix(col, vec3(0.18, 0.22, 0.28), cloud * 0.82);
		col += vec3(0.55, 0.63, 0.72) * smoothstep(0.5, 0.95, cloud) * 0.2;
	} else if (u_mode < 8.5) {
		col = mix(col, vec3(0.015, 0.018, 0.032), 0.52);
		col = mix(col, vec3(0.09, 0.105, 0.14), cloud * 0.52);
		float rain = rainLayer(uv, 5.2, 30.0, 0.045) + rainLayer(uv + 0.19, 7.4, 44.0, 0.036) * 0.55;
		float flashSeed = smoothstep(0.985, 1.0, sin(u_time * 2.7 + noise(vec2(floor(u_time * 1.8), 0.0)) * 8.0));
		float bolt = smoothstep(0.018, 0.0, abs(uv.x - (0.62 + sin(uv.y * 24.0 + u_time) * 0.035))) * smoothstep(0.92, 0.25, uv.y);
		col += vec3(0.5, 0.66, 0.84) * rain * 0.58;
		col += vec3(0.75, 0.86, 1.0) * flashSeed * (0.28 + bolt * 0.9);
	} else if (u_mode < 11.5) {
		float heavy = step(9.5, u_mode) * (1.0 - step(10.5, u_mode));
		float drizzle = step(10.5, u_mode);
		float intensity = mix(0.65, 1.15, heavy) * mix(1.0, 0.38, drizzle);
		col = mix(col, vec3(0.02, 0.035, 0.055), 0.3 + heavy * 0.16);
		col = mix(col, vec3(0.11, 0.14, 0.18), cloud * 0.48);
		float rain = rainLayer(uv, mix(2.0, 4.7, heavy), mix(18.0, 42.0, heavy), mix(0.022, 0.05, heavy));
		rain += rainLayer(uv + 0.37, 3.2, 34.0, 0.025) * 0.44 * (1.0 - drizzle);
		col += vec3(0.48, 0.62, 0.78) * rain * intensity;
	} else if (u_mode < 14.5) {
		float heavySnow = step(12.5, u_mode) * (1.0 - step(13.5, u_mode));
		float wintry = step(13.5, u_mode);
		col = mix(col, vec3(0.22, 0.27, 0.34), cloud * 0.44);
		float snow = snowLayer(uv, mix(16.0, 28.0, heavySnow), mix(0.62, 0.95, heavySnow));
		snow += snowLayer(uv + 0.31, 24.0, 0.38) * 0.7;
		float sleet = rainLayer(uv, 3.4, 28.0, 0.032) * wintry;
		col += vec3(0.86, 0.92, 1.0) * snow * mix(0.78, 1.15, heavySnow);
		col += vec3(0.54, 0.72, 0.92) * sleet * 0.62;
		col += vec3(0.20, 0.32, 0.48) * 0.16;
	} else {
		float partlyNight = step(15.5, u_mode) * (1.0 - step(16.5, u_mode));
		float drizzleNight = step(16.5, u_mode);
		float moon = smoothstep(0.16, 0.0, distance(uv, vec2(0.76, 0.28)));
		col = mix(col, vec3(0.012, 0.018, 0.035), 0.42);
		col += vec3(0.36, 0.48, 0.72) * moon * 0.55;
		col = mix(col, vec3(0.12, 0.14, 0.19), cloud * 0.55 * partlyNight);
		float rain = rainLayer(uv, 2.2, 20.0, 0.02) * drizzleNight;
		col += vec3(0.45, 0.58, 0.78) * rain * 0.42;
	}

	float vignette = smoothstep(0.9, 0.18, distance(uv, vec2(0.5, 0.52)));
	col *= mix(0.58, 1.08, vignette);
	gl_FragColor = vec4(col, 0.92);
}`;

		function compileShader(type: number, source: string) {
			const shader = glContext.createShader(type);
			if (!shader) return null;
			glContext.shaderSource(shader, source);
			glContext.compileShader(shader);
			if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
				glContext.deleteShader(shader);
				return null;
			}
			return shader;
		}

		const vertexShader = compileShader(glContext.VERTEX_SHADER, vertexSource);
		const fragmentShader = compileShader(glContext.FRAGMENT_SHADER, fragmentSource);
		if (!vertexShader || !fragmentShader) return;

		const program = glContext.createProgram();
		if (!program) return;
		glContext.attachShader(program, vertexShader);
		glContext.attachShader(program, fragmentShader);
		glContext.linkProgram(program);
		if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) return;

		const positionBuffer = glContext.createBuffer();
		glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
		glContext.bufferData(
			glContext.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			glContext.STATIC_DRAW
		);

		const positionLocation = glContext.getAttribLocation(program, 'a_position');
		const resolutionLocation = glContext.getUniformLocation(program, 'u_resolution');
		const timeLocation = glContext.getUniformLocation(program, 'u_time');
		const modeLocation = glContext.getUniformLocation(program, 'u_mode');
		const start = performance.now();
		let frame = 0;

		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
			const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				glContext.viewport(0, 0, width, height);
			}
		}

		function render() {
			resize();
			glContext.useProgram(program);
			glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
			glContext.enableVertexAttribArray(positionLocation);
			glContext.vertexAttribPointer(positionLocation, 2, glContext.FLOAT, false, 0, 0);
			glContext.uniform2f(resolutionLocation, canvas.width, canvas.height);
			glContext.uniform1f(timeLocation, (performance.now() - start) / 1000);
			glContext.uniform1f(modeLocation, modeValue);
			glContext.drawArrays(glContext.TRIANGLES, 0, 6);
			frame = requestAnimationFrame(render);
		}

		frame = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(frame);
			glContext.deleteBuffer(positionBuffer);
			glContext.deleteProgram(program);
			glContext.deleteShader(vertexShader);
			glContext.deleteShader(fragmentShader);
		};
	});
</script>

<canvas bind:this={canvas} class="absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
