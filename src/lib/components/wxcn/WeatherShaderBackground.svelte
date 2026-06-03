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
		let teardownWebgl = () => {};
		let started = false;

		function startWebgl() {
			if (started) return;
			started = true;

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

float ridgedFbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int i = 0; i < 5; i++) {
		float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
		v += n * n * a;
		p = mat2(1.62, 1.18, -1.18, 1.62) * p;
		a *= 0.48;
	}
	return v;
}

float grain(vec2 uv) {
	return hash(uv * u_resolution.xy + fract(u_time * 24.0));
}

float blueNoise(vec2 uv) {
	vec2 pixel = floor(uv * u_resolution.xy);
	float n = hash(pixel + vec2(hash(pixel * 0.37), hash(pixel * 1.91)));
	return n - 0.5;
}

float aspectDistance(vec2 uv, vec2 origin) {
	vec2 d = uv - origin;
	d.x *= u_resolution.x / u_resolution.y;
	return length(d);
}

float cloudField(vec2 p, float drift, float density) {
	vec2 warp = vec2(
		fbm(p * 0.9 + vec2(u_time * 0.018 + drift, -0.14)),
		fbm(p * 0.75 + vec2(-0.31, u_time * 0.014 - drift))
	);
	float base = fbm(p + warp * 1.9 + vec2(drift, u_time * 0.018));
	float detail = fbm(p * 3.4 + warp * 0.7 + vec2(-u_time * 0.035, u_time * 0.012));
	return smoothstep(density, 1.0, base * 0.72 + detail * 0.32);
}

float cloudVolume(vec2 p, float drift, float density, float softness) {
	vec2 wind = vec2(u_time * (0.012 + drift * 0.004), -u_time * 0.004);
	float base = fbm(p * 0.78 + wind);
	float billow = ridgedFbm(p * 1.55 + vec2(base * 0.9 + drift, u_time * 0.008));
	float pores = fbm(p * 6.4 + vec2(-u_time * 0.026, u_time * 0.011));
	float body = base * 0.58 + billow * 0.48 - pores * 0.11;
	return smoothstep(density - softness, density + softness, body);
}

float atmosphericDepth(vec2 uv) {
	return smoothstep(0.92, 0.12, uv.y);
}

float starField(vec2 uv) {
	vec2 grid = uv * vec2(190.0, 110.0);
	vec2 id = floor(grid);
	vec2 f = fract(grid) - 0.5;
	float rnd = hash(id);
	float star = smoothstep(0.028, 0.0, length(f)) * smoothstep(0.992, 1.0, rnd);
	float twinkle = 0.58 + 0.42 * sin(u_time * (1.4 + rnd * 2.8) + rnd * 24.0);
	return star * twinkle * smoothstep(0.18, 0.78, uv.y);
}

float lightShaft(vec2 uv, vec2 origin, float angle, float spread) {
	vec2 d = uv - origin;
	float a = atan(d.y, d.x);
	float beam = smoothstep(spread, 0.0, abs(sin(a - angle)));
	float falloff = smoothstep(0.94, 0.08, length(d));
	float texture = 0.72 + 0.28 * fbm(uv * 7.0 + vec2(u_time * 0.018, -u_time * 0.01));
	return beam * falloff * texture;
}

float sunGlare(vec2 uv, vec2 origin) {
	vec2 d = uv - origin;
	float radial = smoothstep(0.96, 0.0, length(d));
	float rays = pow(abs(cos(atan(d.y, d.x) * 8.0 + fbm(uv * 4.0) * 2.8)), 26.0);
	float haze = fbm(uv * 2.1 + vec2(u_time * 0.012, -u_time * 0.005));
	return radial * (0.42 + rays * 0.055 + haze * 0.28);
}

float lensScatter(vec2 uv, vec2 origin, float amount) {
	vec2 d = uv - origin;
	float radial = smoothstep(0.82, 0.0, length(d));
	float dust = smoothstep(0.42, 0.95, fbm(uv * 38.0 + vec2(0.07, -0.21)));
	float streak = pow(abs(dot(normalize(d + 0.0001), normalize(vec2(1.0, -0.32)))), 38.0);
	return (radial * dust * 0.45 + streak * radial * 0.18) * amount;
}

float cloudRim(float field, float light) {
	return smoothstep(0.48, 0.7, field) * (1.0 - smoothstep(0.7, 0.98, field)) * light;
}

float particulate(vec2 uv, float speed, float density) {
	vec2 p = uv * vec2(95.0, 54.0);
	p.x += u_time * speed;
	p.y += sin(p.x * 0.13 + u_time * 0.18) * 0.28;
	vec2 id = floor(p);
	vec2 f = fract(p) - 0.5;
	float rnd = hash(id);
	float mote = smoothstep(0.055, 0.0, length(f)) * smoothstep(1.0 - density, 1.0, rnd);
	return mote * smoothstep(0.02, 0.64, uv.y) * smoothstep(1.02, 0.18, uv.y);
}

float rainStreak(vec2 uv, float speed, float scale, float density, float width, float length, float slant) {
	vec2 p = uv * vec2(scale, scale * 1.72);
	p.y += u_time * speed;
	p.x += p.y * slant;
	vec2 id = floor(p);
	vec2 f = fract(p);
	float rnd = hash(id);
	float active = smoothstep(1.0 - density, 1.0, rnd);
	float x = fract(rnd * 7.37);
	float y = fract(rnd * 13.91);
	float core = smoothstep(width, 0.0, abs(f.x - x));
	float trail = smoothstep(length, 0.0, abs(f.y - y));
	float taper = smoothstep(0.0, 0.18, f.y) * smoothstep(1.0, 0.78, f.y);
	return core * trail * taper * active;
}

float rainSlash(vec2 uv, float speed, float scale, float density, float width, float length, float slant, float jitter) {
	vec2 p = uv;
	p.y += u_time * speed;
	p.x += p.y * slant;
	p.x += fbm(vec2(uv.y * 5.8 + u_time * 0.34, uv.x * 2.4)) * 0.035;
	vec2 grid = p * vec2(scale, scale * 1.38);
	vec2 id = floor(grid);
	vec2 f = fract(grid) - 0.5;
	float rnd = hash(id);
	float active = smoothstep(1.0 - density, 1.0, rnd);
	float angle = (rnd - 0.5) * jitter;
	float c = cos(angle);
	float s = sin(angle);
	f = mat2(c, -s, s, c) * f;
	f.x += (hash(id + 13.7) - 0.5) * 0.36;
	f.y += (hash(id + 4.1) - 0.5) * 0.28;
	float core = smoothstep(width, 0.0, abs(f.x));
	float trail = smoothstep(length, 0.0, abs(f.y));
	float broken = smoothstep(0.18, 0.96, fbm(id * 0.17 + vec2(rnd * 7.0, floor(u_time * 0.55))));
	float fade = smoothstep(0.02, 0.72, uv.y) * smoothstep(1.04, 0.18, uv.y);
	float depth = mix(0.58, 1.0, smoothstep(0.0, 0.72, uv.y));
	float opticalBlur = 0.72 + 0.28 * smoothstep(0.4, 0.0, abs(f.x));
	return core * trail * active * broken * fade * depth * opticalBlur;
}

float rainShearMask(vec2 uv, float amount) {
	float broad =
		fbm(vec2(uv.x * 1.7 - u_time * 0.11, uv.y * 3.6 + u_time * 0.28)) * 0.48 +
		fbm(vec2(uv.x * 5.4 + 1.3, uv.y * 8.5 - u_time * 0.23)) * 0.2 +
		fbm(vec2(uv.x * 11.0 - u_time * 0.17, uv.y * 18.0 + 0.6)) * 0.08;
	float lanes = smoothstep(0.24, 0.86, broad);
	float diagonal =
		smoothstep(0.46, 0.96, fbm(vec2((uv.x + uv.y * 0.34) * 4.2 - u_time * 0.34, uv.y * 6.8)));
	float turbulence = 0.72 + 0.28 * fbm(vec2(uv.x * 3.2 + u_time * 0.13, uv.y * 9.0 - u_time * 0.19));
	return mix(1.0 - amount * 0.22, 1.0 + amount * 0.28, lanes * 0.54 + diagonal * 0.22) * turbulence;
}

float rainDepthVeil(vec2 uv, float amount) {
	float vertical =
		smoothstep(0.3, 0.94, fbm(vec2(uv.x * 4.8 - u_time * 0.18, uv.y * 14.0 + u_time * 0.4)));
	float broad =
		smoothstep(0.22, 0.9, fbm(vec2(uv.x * 1.4 + u_time * 0.04, uv.y * 4.2 - u_time * 0.12)));
	float ground = smoothstep(0.36, 0.02, uv.y);
	return (vertical * 0.26 + broad * 0.42 + ground * 0.22) * amount;
}

float rainSheet(vec2 uv, float amount) {
	vec2 sloped = vec2(uv.x + uv.y * 0.18, uv.y);
	float broad =
		fbm(vec2(sloped.x * 1.2 - u_time * 0.08, sloped.y * 3.0 + u_time * 0.24)) * 0.55 +
		fbm(vec2(sloped.x * 3.6 + 1.7, sloped.y * 8.0 - u_time * 0.32)) * 0.24;
	float fibers =
		smoothstep(
			0.38,
			0.9,
			fbm(vec2(sloped.x * 12.0 - u_time * 0.2, sloped.y * 30.0 + broad * 2.4))
		);
	float streakless =
		smoothstep(0.32, 0.92, fbm(vec2(sloped.x * 7.0 + 0.8, sloped.y * 18.0 - u_time * 0.16)));
	float screen = smoothstep(0.06, 0.72, uv.y) * smoothstep(1.06, 0.12, uv.y);
	float uneven = 0.74 + 0.26 * fbm(vec2(uv.x * 5.0 + u_time * 0.07, uv.y * 4.2));
	return (broad * 0.58 + fibers * 0.28 + streakless * 0.12) * screen * uneven * amount;
}

float rainImpactSpray(vec2 uv, float amount) {
	float ground = smoothstep(0.32, 0.02, uv.y);
	vec2 p = vec2(uv.x * 70.0 + u_time * 0.42, uv.y * 18.0 - u_time * 0.18);
	vec2 id = floor(p);
	vec2 f = fract(p) - 0.5;
	float rnd = hash(id);
	float splash = smoothstep(0.22, 0.0, length(f * vec2(0.9, 2.4))) * smoothstep(0.86, 1.0, rnd);
	float mist = smoothstep(0.36, 0.9, fbm(vec2(uv.x * 9.0 - u_time * 0.2, uv.y * 34.0 + u_time * 0.32)));
	return (splash * 0.3 + mist * 0.42) * ground * amount;
}

float rainMist(vec2 uv, float amount) {
	float veil = fbm(vec2(uv.x * 2.2 + u_time * 0.05, uv.y * 5.4 - u_time * 0.22));
	float low = smoothstep(0.15, 1.0, 1.0 - uv.y);
	return smoothstep(0.32, 0.95, veil) * low * amount;
}

float rainCurtain(vec2 uv, float speed, float scale, float slant, float strength) {
	vec2 p = uv;
	p.y += u_time * speed;
	p.x += p.y * slant;
	float column = floor(p.x * scale);
	float rnd = hash(vec2(column, floor(p.y * 10.0)));
	float x = fract(p.x * scale + rnd * 0.22);
	float line = smoothstep(0.055, 0.0, abs(x - 0.5));
	float dash = smoothstep(0.92, 0.28, fract(p.y * 13.0 + rnd * 4.0));
	float depth = smoothstep(0.18, 1.0, rnd);
	return line * dash * depth * strength;
}

float glassRunoff(vec2 uv, float amount) {
	vec2 p = vec2(uv.x * 18.0, uv.y * 1.2 + u_time * 0.18);
	float id = floor(p.x);
	float rnd = hash(vec2(id, floor(u_time * 0.08)));
	float x = fract(p.x);
	float line = smoothstep(0.028, 0.0, abs(x - rnd));
	float waviness = 0.55 + 0.45 * sin(uv.y * 24.0 + rnd * 12.0);
	return line * waviness * smoothstep(0.15, 0.95, uv.y) * amount;
}

float lightningPath(vec2 uv, float seed, float root, float fork) {
	float y = clamp(uv.y, 0.0, 1.0);
	float segment = floor(y * 18.0);
	float local = fract(y * 18.0);
	float stepped =
		(hash(vec2(segment, seed)) - 0.5) * 0.035 +
		(hash(vec2(segment * 0.47 + 13.0, seed + 4.0)) - 0.5) * 0.018;
	float fine = fbm(vec2(y * 28.0 + seed * 3.0, seed + floor(u_time * 8.0))) * 0.028 - 0.014;
	float taper = smoothstep(0.95, 0.38, y) * smoothstep(0.08, 0.42, y);
	float x = root + stepped + fine + fork * (y - 0.56) * 0.42;
	float width = mix(0.004, 0.0012, y);
	float core = smoothstep(width, 0.0, abs(uv.x - x));
	float glow = smoothstep(width * 13.0, 0.0, abs(uv.x - x)) * 0.22;
	float broken = smoothstep(0.08, 0.36, local) * smoothstep(0.96, 0.72, local);
	return (core + glow) * taper * broken;
}

float lightningField(vec2 uv, float seed) {
	float mainBolt = lightningPath(uv, seed, 0.62 + (hash(vec2(seed, 2.0)) - 0.5) * 0.18, 0.0);
	float branchA = lightningPath(
		uv + vec2(-0.055, -0.02),
		seed + 7.0,
		0.60 + (hash(vec2(seed, 3.0)) - 0.5) * 0.1,
		0.42
	);
	float branchB = lightningPath(
		uv + vec2(0.05, 0.03),
		seed + 13.0,
		0.64 + (hash(vec2(seed, 5.0)) - 0.5) * 0.12,
		-0.36
	);
	float branchMaskA = smoothstep(0.4, 0.58, uv.y) * smoothstep(0.88, 0.62, uv.y);
	float branchMaskB = smoothstep(0.54, 0.66, uv.y) * smoothstep(0.9, 0.72, uv.y);
	return mainBolt + branchA * branchMaskA * 0.62 + branchB * branchMaskB * 0.44;
}

float windLayer(vec2 uv) {
	vec2 p = uv * vec2(6.0, 18.0);
	p.x += u_time * 1.7;
	float line = smoothstep(0.06, 0.0, abs(fract(p.y + sin(p.x) * 0.18) - 0.5));
	return line * smoothstep(0.2, 0.95, noise(vec2(floor(p.x), floor(p.y))));
}

float windScud(vec2 uv) {
	vec2 p = uv * vec2(3.2, 9.5);
	p.x += u_time * 0.42;
	p.y += sin(p.x * 1.8 + u_time * 0.7) * 0.12;
	float base = fbm(p + vec2(fbm(p * 1.7), 0.0));
	float tears = smoothstep(0.56, 0.92, base) * smoothstep(0.02, 0.88, uv.y);
	return tears * (0.66 + 0.34 * smoothstep(0.36, 0.95, fbm(p * vec2(2.4, 0.62))));
}

float fogBank(vec2 uv, float speed, float scale) {
	vec2 p = vec2(uv.x * scale + u_time * speed, uv.y * 8.0 - u_time * speed * 0.4);
	float bank = fbm(p + vec2(fbm(p * 0.72), 0.0));
	float horizontal = smoothstep(0.72, 0.05, uv.y);
	float striation = smoothstep(0.5, 0.94, fbm(vec2(uv.x * 9.0 + u_time * speed, uv.y * 38.0)));
	return bank * horizontal + striation * 0.28 * horizontal;
}

float skyTexture(vec2 uv, float amount) {
	float broad = fbm(vec2(uv.x * 1.8 + 0.2, uv.y * 2.8 - u_time * 0.004));
	float high = fbm(vec2(uv.x * 8.0 - u_time * 0.008, uv.y * 13.0 + broad * 0.7));
	float sensor = blueNoise(uv) * 0.5 + grain(uv) * 0.5;
	return (broad * 0.5 + high * 0.18 + sensor * 0.04 - 0.28) * amount;
}

float atmosphericStreaks(vec2 uv, float amount) {
	vec2 p = vec2(uv.x * 2.2 + u_time * 0.004, uv.y * 34.0);
	p.y += fbm(vec2(uv.x * 2.8, uv.y * 5.0)) * 2.8;
	float longVeil = smoothstep(0.58, 0.94, fbm(p));
	float fineVeil = smoothstep(0.62, 0.98, fbm(vec2(uv.x * 12.0 - u_time * 0.006, uv.y * 46.0 + longVeil)));
	float altitude = smoothstep(0.18, 0.88, uv.y) * smoothstep(1.02, 0.36, uv.y);
	return (longVeil * 0.58 + fineVeil * 0.18) * altitude * amount;
}

float airMassVariation(vec2 uv, float amount) {
	float broad =
		fbm(vec2(uv.x * 1.15 - u_time * 0.002, uv.y * 1.8 + 2.0)) * 0.62 +
		fbm(vec2(uv.x * 3.0 + 1.7, uv.y * 4.4 - u_time * 0.004)) * 0.22;
	float horizonLift = smoothstep(0.52, 0.0, uv.y);
	float zenithRoll = smoothstep(0.42, 1.0, uv.y);
	return (broad - 0.38 + horizonLift * 0.18 - zenithRoll * 0.08) * amount;
}

float cirrusVeil(vec2 uv, float drift, float strength) {
	vec2 p = vec2(uv.x * 3.6 + drift + u_time * 0.012, uv.y * 18.0 - u_time * 0.005);
	p.y += fbm(vec2(uv.x * 1.7 + drift, uv.y * 3.2)) * 1.15;
	float fibers = smoothstep(0.52, 0.96, fbm(p));
	float streaks = smoothstep(0.58, 0.98, fbm(vec2(uv.x * 14.0 + drift, uv.y * 24.0 + fibers)));
	return (fibers * 0.72 + streaks * 0.18) * smoothstep(0.22, 0.98, uv.y) * strength;
}

float fairCloudBank(vec2 uv, float seed) {
	float line =
		0.46 +
		(fbm(vec2(uv.x * 1.6 + seed - u_time * 0.006, 1.6)) - 0.5) * 0.17 +
		(fbm(vec2(uv.x * 5.8 + seed, 3.9)) - 0.5) * 0.05;
	float body = smoothstep(0.22, 0.025, abs(uv.y - line));
	float cells = ridgedFbm(vec2(uv.x * 3.6 + seed - u_time * 0.01, uv.y * 7.2 + line));
	float breakup = smoothstep(0.32, 0.78, cells);
	float gaps = smoothstep(0.3, 0.84, fbm(vec2(uv.x * 7.0 + seed * 1.7, uv.y * 4.4)));
	float underside = smoothstep(line + 0.03, line - 0.15, uv.y);
	return body * breakup * mix(0.28, 1.0, gaps) * smoothstep(0.13, 0.42, uv.y) * smoothstep(0.86, 0.36, uv.y) * (0.72 + underside * 0.18);
}

float hazeOrb(vec2 uv, vec2 origin, float radius) {
	float d = aspectDistance(uv, origin);
	float disk = smoothstep(radius, radius * 0.38, d);
	float bloom = smoothstep(radius * 4.2, 0.0, d);
	float veil = fbm(vec2(uv.x * 5.2 + u_time * 0.01, uv.y * 6.6 - u_time * 0.008));
	return disk * 0.32 + bloom * (0.18 + veil * 0.11);
}

float cloudPuff(vec2 uv, vec2 center, vec2 radius, float seed) {
	vec2 d = (uv - center) / radius;
	float shape = smoothstep(1.0, 0.18, length(d));
	float lobes =
		smoothstep(0.78, 0.18, distance(d, vec2(-0.48, -0.02))) * 0.58 +
		smoothstep(0.9, 0.16, distance(d, vec2(0.02, 0.08))) * 0.82 +
		smoothstep(0.76, 0.18, distance(d, vec2(0.52, -0.04))) * 0.52;
	float breakup = fbm(vec2(uv.x * 10.0 + seed - u_time * 0.012, uv.y * 14.0 + seed * 0.7));
	float fibers = fbm(vec2(uv.x * 22.0 + seed, uv.y * 9.0 - u_time * 0.018));
	float raggedEdge = smoothstep(0.48, 0.9, breakup + lobes * 0.28 + fibers * 0.12);
	float underside = smoothstep(0.24, -0.62, d.y);
	return clamp(shape * raggedEdge * (0.34 + lobes * 0.52) * (0.88 + underside * 0.18), 0.0, 1.0);
}

float moonSurface(vec2 uv, vec2 origin) {
	vec2 d = uv - origin;
	d.x *= u_resolution.x / u_resolution.y;
	float radius = 0.033;
	float dist = length(d);
	float disk = smoothstep(radius, radius - 0.001, dist);
	vec2 m = d / radius * 0.5 + 0.5;
	float craters =
		smoothstep(0.07, 0.0, distance(m, vec2(0.34, 0.58))) * 0.085 +
		smoothstep(0.055, 0.0, distance(m, vec2(0.66, 0.42))) * 0.07 +
		smoothstep(0.042, 0.0, distance(m, vec2(0.56, 0.68))) * 0.055 +
		smoothstep(0.035, 0.0, distance(m, vec2(0.72, 0.62))) * 0.045;
	float maria = fbm(m * 3.2) * 0.2 + fbm(m * 13.0) * 0.055;
	float limb = smoothstep(radius, radius * 0.74, dist);
	float phase = smoothstep(-0.48, 0.5, m.x);
	float terminator = smoothstep(-0.12, 0.08, m.x - 0.5);
	return disk * (0.62 + maria - craters) * limb * (0.74 + phase * 0.2 + terminator * 0.08);
}

float horizonSilhouette(vec2 uv, float base, float roughness) {
	float ridge =
		base +
		fbm(vec2(uv.x * 3.2 + u_time * 0.006, 1.7)) * roughness +
		fbm(vec2(uv.x * 12.0 - u_time * 0.004, 4.1)) * roughness * 0.35;
	return smoothstep(ridge + 0.018, ridge - 0.018, uv.y);
}

float distantTerrain(vec2 uv, float base, float roughness, float softness) {
	float ridge =
		base +
		fbm(vec2(uv.x * 2.4 - u_time * 0.002, 5.7)) * roughness +
		fbm(vec2(uv.x * 9.5 + 1.4, 2.9)) * roughness * 0.35;
	float body = smoothstep(ridge + softness, ridge - softness, uv.y);
	float atmosphericCut = smoothstep(0.02, 0.28, uv.y);
	return body * atmosphericCut;
}

float distantShore(vec2 uv, float amount) {
	float ground = smoothstep(0.34, 0.0, uv.y);
	float hazeLine =
		smoothstep(0.035, 0.0, abs(uv.y - 0.18)) *
		(0.58 + 0.42 * fbm(vec2(uv.x * 7.2 - u_time * 0.004, 2.8)));
	float waterBands =
		smoothstep(0.018, 0.0, abs(fract(uv.y * 86.0 + fbm(vec2(uv.x * 9.0, uv.y * 18.0))) - 0.5)) *
		smoothstep(0.02, 0.34, uv.y) *
		(0.5 + 0.5 * fbm(vec2(uv.x * 18.0 + u_time * 0.012, uv.y * 42.0)));
	float bank =
		smoothstep(0.16, 0.0, uv.y) *
		smoothstep(0.42, 0.9, fbm(vec2(uv.x * 4.6 - u_time * 0.006, uv.y * 14.0 + 0.7)));
	return (hazeLine * 0.46 + waterBands * 0.34 + bank * 0.2) * ground * amount;
}

float distantTreeLine(vec2 uv, float amount) {
	float ridge =
		0.16 +
		fbm(vec2(uv.x * 5.5 + 0.4, 2.1)) * 0.035 +
		fbm(vec2(uv.x * 21.0 - u_time * 0.003, 5.8)) * 0.012;
	float body = smoothstep(ridge + 0.018, ridge - 0.012, uv.y);
	float crowns = 0.62 + 0.38 * ridgedFbm(vec2(uv.x * 34.0, uv.y * 18.0 + 1.8));
	float air = smoothstep(0.02, 0.28, uv.y);
	return body * crowns * air * amount;
}

float waterGlint(vec2 uv, vec2 origin, float amount) {
	float ground = smoothstep(0.31, 0.0, uv.y);
	float aim = smoothstep(0.78, 0.0, abs(uv.x - origin.x));
	float bands = smoothstep(0.028, 0.0, abs(fract(uv.y * 72.0 + fbm(vec2(uv.x * 8.0, uv.y * 12.0))) - 0.5));
	float breakup = smoothstep(0.38, 0.9, fbm(vec2(uv.x * 18.0 + u_time * 0.016, uv.y * 34.0)));
	return ground * aim * bands * breakup * amount;
}

float mountainFace(vec2 uv, float base, float scale, float amount) {
	float ridge =
		base +
		fbm(vec2(uv.x * 2.6 - u_time * 0.001, 6.1)) * 0.052 +
		fbm(vec2(uv.x * 8.8 + 1.8, 3.4)) * 0.024;
	float body = smoothstep(ridge + 0.018, ridge - 0.018, uv.y);
	float facets =
		ridgedFbm(vec2(uv.x * scale + 0.4, uv.y * scale * 1.9)) * 0.5 +
		fbm(vec2(uv.x * scale * 2.3 - 1.2, uv.y * scale * 3.4)) * 0.22;
	float gullies =
		smoothstep(0.54, 0.95, ridgedFbm(vec2(uv.x * scale * 3.2, uv.y * scale * 5.8 + 2.7)));
	float air = smoothstep(0.035, 0.36, uv.y);
	return body * (0.46 + facets * 0.34 + gullies * 0.2) * air * amount;
}

float mountainSnowLine(vec2 uv, float base, float amount) {
	float ridge =
		base +
		fbm(vec2(uv.x * 2.6 - u_time * 0.001, 6.1)) * 0.052 +
		fbm(vec2(uv.x * 8.8 + 1.8, 3.4)) * 0.024;
	float band = smoothstep(ridge + 0.01, ridge - 0.055, uv.y) * smoothstep(ridge - 0.15, ridge - 0.045, uv.y);
	float broken = smoothstep(0.38, 0.88, fbm(vec2(uv.x * 18.0 + 1.0, uv.y * 28.0)));
	return band * broken * amount;
}

float lakeSurfaceDetail(vec2 uv, vec2 lightPos, float amount) {
	float ground = smoothstep(0.32, 0.0, uv.y);
	float bands =
		smoothstep(0.02, 0.0, abs(fract(uv.y * 124.0 + fbm(vec2(uv.x * 18.0, uv.y * 28.0))) - 0.5)) *
		(0.42 + 0.58 * fbm(vec2(uv.x * 22.0 + u_time * 0.01, uv.y * 48.0)));
	float reflectedPath =
		smoothstep(0.42, 0.0, abs(uv.x - lightPos.x)) *
		smoothstep(0.0, 0.28, uv.y) *
		smoothstep(0.36, 0.02, uv.y);
	float brokenHighlight =
		smoothstep(0.6, 0.98, fbm(vec2(uv.x * 34.0, uv.y * 92.0 + u_time * 0.05))) *
		reflectedPath;
	return ground * (bands * 0.34 + brokenHighlight * 0.5) * amount;
}

float groundSheen(vec2 uv, float amount) {
	float ground = smoothstep(0.31, 0.0, uv.y);
	float bands = smoothstep(0.62, 0.98, fbm(vec2(uv.x * 12.0, uv.y * 54.0 + u_time * 0.05)));
	float streaks = smoothstep(0.04, 0.0, abs(fract(uv.x * 18.0 + fbm(uv * 4.0)) - 0.5));
	float breakup = 0.45 + 0.55 * fbm(vec2(uv.x * 5.5 - u_time * 0.02, uv.y * 18.0));
	return ground * (bands * 0.5 + streaks * 0.18) * breakup * amount;
}

float shorelineTexture(vec2 uv, float amount) {
	float lower = smoothstep(0.29, 0.0, uv.y);
	float bands =
		smoothstep(0.03, 0.0, abs(fract(uv.y * 112.0 + fbm(vec2(uv.x * 12.0, uv.y * 24.0))) - 0.5)) *
		(0.48 + 0.52 * fbm(vec2(uv.x * 24.0 - u_time * 0.006, uv.y * 54.0)));
	float reedBase =
		smoothstep(0.2, 0.0, uv.y) *
		smoothstep(0.58, 0.96, ridgedFbm(vec2(uv.x * 38.0 + 0.4, uv.y * 8.0)));
	float reedTips =
		smoothstep(0.12, 0.0, abs(uv.y - (0.12 + fbm(vec2(uv.x * 26.0, 7.2)) * 0.055))) *
		smoothstep(0.62, 0.98, ridgedFbm(vec2(uv.x * 68.0, uv.y * 24.0 + 1.4)));
	float pebbles =
		smoothstep(0.94, 1.0, hash(floor(uv * vec2(240.0, 96.0)))) *
		smoothstep(0.02, 0.22, uv.y) *
		smoothstep(0.38, 0.0, uv.y);
	return lower * (bands * 0.34 + reedBase * 0.28 + reedTips * 0.24 + pebbles * 0.18) * amount;
}

float nearShoreSilhouette(vec2 uv, float amount) {
	float lower = smoothstep(0.24, 0.0, uv.y);
	float ridge =
		0.118 +
		fbm(vec2(uv.x * 3.8 - u_time * 0.003, 4.2)) * 0.035 +
		fbm(vec2(uv.x * 15.0 + 2.1, 8.4)) * 0.014;
	float land = smoothstep(ridge + 0.016, ridge - 0.018, uv.y);
	float brush =
		smoothstep(0.58, 0.96, ridgedFbm(vec2(uv.x * 46.0 + 0.8, uv.y * 16.0))) *
		smoothstep(0.02, 0.18, uv.y) *
		smoothstep(0.25, 0.04, uv.y);
	float reflected =
		smoothstep(0.026, 0.0, abs(fract(uv.y * 92.0 + fbm(vec2(uv.x * 11.0, uv.y * 22.0))) - 0.5)) *
		smoothstep(0.02, 0.28, uv.y);
	return lower * (land * 0.5 + brush * 0.34 + reflected * 0.22) * amount;
}

float daylightShoreDetail(vec2 uv, float amount) {
	float lower = smoothstep(0.34, 0.0, uv.y);
	float wetBank =
		smoothstep(0.026, 0.0, abs(uv.y - (0.105 + fbm(vec2(uv.x * 4.4 - u_time * 0.003, 5.6)) * 0.04))) *
		(0.5 + 0.5 * fbm(vec2(uv.x * 18.0, uv.y * 28.0 + 1.3)));
	float reedClumps =
		smoothstep(0.62, 0.98, ridgedFbm(vec2(uv.x * 48.0 + 0.7, uv.y * 16.0))) *
		smoothstep(0.025, 0.22, uv.y) *
		smoothstep(0.29, 0.055, uv.y);
	float shortGrass =
		smoothstep(0.034, 0.0, abs(fract(uv.x * 86.0 + fbm(vec2(uv.y * 10.0, uv.x * 5.0))) - 0.5)) *
		smoothstep(0.02, 0.18, uv.y) *
		smoothstep(0.25, 0.04, uv.y);
	float waterLap =
		smoothstep(0.017, 0.0, abs(fract(uv.y * 132.0 + fbm(vec2(uv.x * 18.0, uv.y * 24.0))) - 0.5)) *
		smoothstep(0.035, 0.31, uv.y) *
		(0.45 + 0.55 * fbm(vec2(uv.x * 24.0 + u_time * 0.012, uv.y * 52.0)));
	float stoneFlecks =
		smoothstep(0.972, 1.0, hash(floor(uv * vec2(260.0, 90.0)))) *
		smoothstep(0.015, 0.22, uv.y) *
		smoothstep(0.32, 0.0, uv.y);
	return lower * (wetBank * 0.34 + reedClumps * 0.26 + shortGrass * 0.16 + waterLap * 0.32 + stoneFlecks * 0.12) * amount;
}

float fogTreeBands(vec2 uv, float amount) {
	float lower = smoothstep(0.42, 0.0, uv.y);
	float farLine =
		0.245 +
		fbm(vec2(uv.x * 3.0 - u_time * 0.001, 7.1)) * 0.035 +
		fbm(vec2(uv.x * 13.0 + 1.4, 4.2)) * 0.012;
	float nearLine =
		0.118 +
		fbm(vec2(uv.x * 4.8 + 0.8, 2.7)) * 0.028 +
		fbm(vec2(uv.x * 19.0 - u_time * 0.002, 5.1)) * 0.012;
	float farTrees = smoothstep(farLine + 0.018, farLine - 0.02, uv.y);
	float nearTrees = smoothstep(nearLine + 0.016, nearLine - 0.018, uv.y);
	float crowns =
		smoothstep(0.54, 0.98, ridgedFbm(vec2(uv.x * 38.0 + 2.0, uv.y * 18.0))) *
		smoothstep(0.05, 0.32, uv.y);
	float trunks =
		smoothstep(0.03, 0.0, abs(fract(uv.x * 58.0 + fbm(vec2(uv.y * 8.0, uv.x * 4.0))) - 0.5)) *
		smoothstep(0.02, 0.2, uv.y) *
		smoothstep(0.26, 0.045, uv.y);
	float fogCut = smoothstep(0.02, 0.34, uv.y) * smoothstep(0.56, 0.1, uv.y);
	return lower * (farTrees * 0.3 + nearTrees * (0.34 + crowns * 0.24) + trunks * 0.14) * fogCut * amount;
}

float fogWetMeadow(vec2 uv, float amount) {
	float lower = smoothstep(0.36, 0.0, uv.y);
	float soddenBands =
		smoothstep(0.022, 0.0, abs(fract(uv.y * 108.0 + fbm(vec2(uv.x * 10.0, uv.y * 24.0))) - 0.5)) *
		smoothstep(0.02, 0.32, uv.y);
	float flattenedGrass =
		smoothstep(0.032, 0.0, abs(fract(uv.x * 76.0 + fbm(vec2(uv.y * 11.0, uv.x * 4.5))) - 0.5)) *
		smoothstep(0.02, 0.22, uv.y) *
		smoothstep(0.3, 0.04, uv.y);
	float puddledSheen =
		smoothstep(0.56, 0.98, fbm(vec2(uv.x * 18.0 - u_time * 0.01, uv.y * 56.0))) *
		smoothstep(0.04, 0.3, uv.y) *
		smoothstep(0.34, 0.02, uv.y);
	float softRuts =
		smoothstep(0.04, 0.0, abs(fract(uv.x * 12.0 + fbm(vec2(uv.y * 18.0, uv.x * 4.0))) - 0.5)) *
		smoothstep(0.02, 0.18, uv.y);
	return lower * (soddenBands * 0.34 + flattenedGrass * 0.22 + puddledSheen * 0.32 + softRuts * 0.12) * amount;
}

float windBentForeground(vec2 uv, float amount) {
	float lower = smoothstep(0.36, 0.0, uv.y);
	float lean = fbm(vec2(uv.x * 2.6 - u_time * 0.34, uv.y * 9.0 + 1.2));
	vec2 bent = uv + vec2(lean * 0.055 + u_time * 0.045, uv.y * 0.03);
	float grassBlades =
		smoothstep(0.028, 0.0, abs(fract(bent.x * 96.0 + fbm(vec2(bent.y * 12.0, bent.x * 4.0))) - 0.5)) *
		smoothstep(0.025, 0.24, uv.y) *
		smoothstep(0.34, 0.045, uv.y);
	float flattenedRows =
		smoothstep(0.026, 0.0, abs(fract((uv.y + lean * 0.025) * 96.0) - 0.5)) *
		smoothstep(0.02, 0.31, uv.y);
	float flyingChaff =
		smoothstep(0.965, 1.0, hash(floor(vec2(uv.x * 170.0 - u_time * 38.0, uv.y * 84.0 + lean * 12.0)))) *
		smoothstep(0.04, 0.46, uv.y) *
		smoothstep(0.74, 0.12, uv.y);
	float gritSheets =
		smoothstep(0.46, 0.94, fbm(vec2(uv.x * 10.0 - u_time * 0.82, uv.y * 26.0 + lean))) *
		smoothstep(0.02, 0.3, uv.y) *
		smoothstep(0.42, 0.05, uv.y);
	return lower * (grassBlades * 0.28 + flattenedRows * 0.32 + flyingChaff * 0.22 + gritSheets * 0.3) * amount;
}

float overcastDeckTexture(vec2 uv, float amount) {
	float upper = smoothstep(0.18, 0.96, uv.y);
	float warped =
		fbm(vec2(uv.x * 2.2 + u_time * 0.006, uv.y * 2.8 - 0.8)) * 0.45 +
		fbm(vec2(uv.x * 5.6 - u_time * 0.012, uv.y * 6.6 + 1.4)) * 0.32;
	float cells =
		smoothstep(0.44, 0.94, ridgedFbm(vec2(uv.x * 8.2 + warped, uv.y * 5.8 - warped * 0.5))) *
		smoothstep(0.12, 0.9, uv.y);
	float saggingBase =
		smoothstep(0.026, 0.0, abs(uv.y - (0.48 + fbm(vec2(uv.x * 3.2 - u_time * 0.005, 2.6)) * 0.1))) *
		(0.58 + 0.42 * fbm(vec2(uv.x * 14.0, uv.y * 10.0)));
	float shelf =
		smoothstep(0.55, 0.94, fbm(vec2(uv.x * 4.4 - u_time * 0.014, uv.y * 13.0 + warped))) *
		smoothstep(0.26, 0.82, uv.y);
	return upper * (cells * 0.48 + saggingBase * 0.34 + shelf * 0.28) * amount;
}

float overcastLowField(vec2 uv, float amount) {
	float lower = smoothstep(0.38, 0.0, uv.y);
	float soakedRows =
		smoothstep(0.02, 0.0, abs(fract(uv.y * 118.0 + fbm(vec2(uv.x * 14.0, uv.y * 24.0))) - 0.5)) *
		smoothstep(0.02, 0.34, uv.y);
	float mattedGrass =
		smoothstep(0.03, 0.0, abs(fract(uv.x * 92.0 + fbm(vec2(uv.y * 11.0, uv.x * 5.0))) - 0.5)) *
		smoothstep(0.018, 0.24, uv.y) *
		smoothstep(0.33, 0.04, uv.y);
	float puddleBreaks =
		smoothstep(0.52, 0.96, fbm(vec2(uv.x * 20.0 - u_time * 0.012, uv.y * 58.0))) *
		smoothstep(0.03, 0.31, uv.y) *
		smoothstep(0.36, 0.02, uv.y);
	float lowShrub =
		smoothstep(0.58, 0.96, ridgedFbm(vec2(uv.x * 42.0 + 1.3, uv.y * 18.0))) *
		smoothstep(0.02, 0.2, uv.y) *
		smoothstep(0.27, 0.04, uv.y);
	return lower * (soakedRows * 0.32 + mattedGrass * 0.22 + puddleBreaks * 0.36 + lowShrub * 0.18) * amount;
}

float foregroundTreeMass(vec2 uv, float amount) {
	float lower = smoothstep(0.31, 0.0, uv.y);
	float canopyLine =
		0.205 +
		fbm(vec2(uv.x * 3.4 - u_time * 0.002, 5.6)) * 0.045 +
		fbm(vec2(uv.x * 18.0 + 1.8, 9.2)) * 0.018;
	float body = smoothstep(canopyLine + 0.024, canopyLine - 0.02, uv.y);
	float crowns =
		smoothstep(0.44, 0.98, ridgedFbm(vec2(uv.x * 32.0 + 1.1, uv.y * 20.0))) *
		smoothstep(0.03, 0.28, uv.y) *
		smoothstep(0.34, 0.05, uv.y);
	float trunks =
		smoothstep(0.035, 0.0, abs(fract(uv.x * 44.0 + fbm(vec2(uv.y * 9.0, uv.x * 4.0))) - 0.5)) *
		smoothstep(0.0, 0.2, uv.y) *
		smoothstep(0.27, 0.05, uv.y);
	return lower * (body * 0.48 + crowns * 0.42 + trunks * 0.14) * amount;
}

float groundFogBands(vec2 uv, float amount) {
	float nearGround = smoothstep(0.38, 0.0, uv.y);
	float horizontal =
		smoothstep(
			0.48,
			0.96,
			fbm(vec2(uv.x * 4.6 + u_time * 0.022, uv.y * 34.0 - u_time * 0.028))
		);
	float ribbon =
		smoothstep(0.035, 0.0, abs(uv.y - (0.14 + fbm(vec2(uv.x * 2.8, 4.2)) * 0.045))) *
		(0.58 + 0.42 * fbm(vec2(uv.x * 12.0 - u_time * 0.018, uv.y * 18.0)));
	float softPatches =
		smoothstep(0.34, 0.88, fbm(vec2(uv.x * 7.5 - u_time * 0.034, uv.y * 9.0 + 1.6))) *
		smoothstep(0.04, 0.3, uv.y) *
		smoothstep(0.42, 0.1, uv.y);
	return nearGround * (horizontal * 0.34 + ribbon * 0.42 + softPatches * 0.24) * amount;
}

float wetForegroundTexture(vec2 uv, float amount) {
	float lower = smoothstep(0.34, 0.0, uv.y);
	float runoff =
		smoothstep(0.035, 0.0, abs(fract(uv.x * 34.0 + fbm(vec2(uv.y * 18.0, uv.x * 6.0))) - 0.5)) *
		smoothstep(0.02, 0.34, uv.y);
	float ripples =
		smoothstep(0.018, 0.0, abs(fract(uv.y * 94.0 + u_time * 0.18 + fbm(uv * 18.0)) - 0.5)) *
		smoothstep(0.02, 0.3, uv.y);
	float brokenReflection =
		smoothstep(0.58, 0.96, fbm(vec2(uv.x * 18.0 + u_time * 0.018, uv.y * 62.0))) *
		smoothstep(0.36, 0.0, uv.y);
	return lower * (runoff * 0.28 + ripples * 0.36 + brokenReflection * 0.42) * amount;
}

float snowForegroundTexture(vec2 uv, float amount) {
	float lower = smoothstep(0.34, 0.0, uv.y);
	float driftLine =
		smoothstep(0.032, 0.0, abs(uv.y - (0.12 + fbm(vec2(uv.x * 4.2 - u_time * 0.02, 2.6)) * 0.04))) *
		(0.58 + 0.42 * fbm(vec2(uv.x * 18.0, uv.y * 18.0)));
	float windScour =
		smoothstep(0.54, 0.96, fbm(vec2(uv.x * 24.0 - u_time * 0.22, uv.y * 68.0 + 1.1))) *
		smoothstep(0.02, 0.28, uv.y);
	float buriedBrush =
		smoothstep(0.18, 0.0, uv.y) *
		smoothstep(0.62, 0.98, ridgedFbm(vec2(uv.x * 42.0, uv.y * 14.0 + 3.0)));
	return lower * (driftLine * 0.38 + windScour * 0.34 + buriedBrush * 0.16) * amount;
}

float snowpackRelief(vec2 uv, float amount) {
	float ground = smoothstep(0.36, 0.0, uv.y);
	float slopeLine =
		smoothstep(
			0.03,
			0.0,
			abs(uv.y - (0.09 + fbm(vec2(uv.x * 3.2 - u_time * 0.012, 6.4)) * 0.052))
		);
	float windCarve =
		smoothstep(0.5, 0.96, fbm(vec2(uv.x * 18.0 - u_time * 0.16, uv.y * 72.0 + 2.7))) *
		smoothstep(0.02, 0.32, uv.y);
	float crustSparkle =
		smoothstep(0.985, 1.0, hash(floor(uv * vec2(220.0, 95.0)))) *
		smoothstep(0.02, 0.24, uv.y) *
		smoothstep(0.36, 0.02, uv.y);
	float buriedGrass =
		smoothstep(0.18, 0.0, uv.y) *
		smoothstep(0.56, 0.98, ridgedFbm(vec2(uv.x * 54.0 + 1.2, uv.y * 18.0)));
	return ground * (slopeLine * 0.36 + windCarve * 0.34 + crustSparkle * 0.18 + buriedGrass * 0.16) * amount;
}

float snowBuriedTreeline(vec2 uv, float amount) {
	float ridge =
		0.18 +
		fbm(vec2(uv.x * 4.2 + 0.8, 2.7)) * 0.04 +
		fbm(vec2(uv.x * 18.0 - u_time * 0.002, 6.5)) * 0.015;
	float body = smoothstep(ridge + 0.018, ridge - 0.018, uv.y);
	float crowns =
		smoothstep(0.5, 0.98, ridgedFbm(vec2(uv.x * 36.0, uv.y * 22.0 + 3.1))) *
		smoothstep(0.04, 0.3, uv.y);
	float snowCap =
		smoothstep(0.018, 0.0, abs(uv.y - ridge)) *
		(0.5 + 0.5 * fbm(vec2(uv.x * 20.0, uv.y * 18.0)));
	float air = smoothstep(0.03, 0.34, uv.y);
	return (body * 0.48 + crowns * 0.34 - snowCap * 0.18) * air * amount;
}

float distantLights(vec2 uv) {
	float h = smoothstep(0.065, 0.012, abs(uv.y - 0.155));
	vec2 grid = vec2(uv.x * 54.0, uv.y * 2.7);
	vec2 id = floor(grid);
	float rnd = hash(id);
	float active = smoothstep(0.88, 1.0, rnd);
	vec2 f = fract(grid) - vec2(0.5, 0.54);
	float bulb = smoothstep(0.16, 0.0, length(f * vec2(0.92, 3.8)));
	float halo = smoothstep(0.4, 0.0, length(f * vec2(0.42, 2.9))) * 0.18;
	return (bulb + halo) * active * h;
}

float moonlitShore(vec2 uv, vec2 moonPos, float amount) {
	float lower = smoothstep(0.34, 0.0, uv.y);
	float reeds =
		smoothstep(0.18, 0.0, uv.y) *
		smoothstep(0.56, 0.98, ridgedFbm(vec2(uv.x * 52.0 + 2.4, uv.y * 18.0)));
	float bankLine =
		smoothstep(0.024, 0.0, abs(uv.y - (0.13 + fbm(vec2(uv.x * 4.0, 6.2)) * 0.045))) *
		(0.5 + 0.5 * fbm(vec2(uv.x * 18.0, uv.y * 24.0 + 0.8)));
	float moonPath =
		smoothstep(0.36, 0.0, abs(uv.x - moonPos.x)) *
		smoothstep(0.02, 0.3, uv.y) *
		smoothstep(0.36, 0.02, uv.y);
	float brokenWater =
		smoothstep(0.024, 0.0, abs(fract(uv.y * 118.0 + fbm(vec2(uv.x * 18.0, uv.y * 36.0))) - 0.5)) *
		smoothstep(0.42, 0.94, fbm(vec2(uv.x * 30.0 + u_time * 0.014, uv.y * 86.0))) *
		moonPath;
	return lower * (reeds * 0.28 + bankLine * 0.3 + brokenWater * 0.52) * amount;
}

float nightForegroundSilhouette(vec2 uv, float amount) {
	float lower = smoothstep(0.31, 0.0, uv.y);
	float line =
		0.17 +
		fbm(vec2(uv.x * 3.2 + 1.7, 3.6)) * 0.04 +
		fbm(vec2(uv.x * 19.0, 8.4)) * 0.018;
	float bank = smoothstep(line + 0.02, line - 0.018, uv.y);
	float scrub =
		smoothstep(0.54, 0.98, ridgedFbm(vec2(uv.x * 44.0, uv.y * 16.0 + 2.0))) *
		smoothstep(0.02, 0.24, uv.y) *
		smoothstep(0.3, 0.05, uv.y);
	float trunks =
		smoothstep(0.026, 0.0, abs(fract(uv.x * 38.0 + fbm(vec2(uv.y * 12.0, uv.x * 4.0))) - 0.5)) *
		smoothstep(0.01, 0.22, uv.y) *
		smoothstep(0.28, 0.04, uv.y);
	return lower * (bank * 0.5 + scrub * 0.38 + trunks * 0.16) * amount;
}

float lowAtmosphere(vec2 uv, float amount) {
	float fog = fbm(vec2(uv.x * 3.8 + u_time * 0.015, uv.y * 12.0 - u_time * 0.018));
	float nearGround = smoothstep(0.36, 0.02, uv.y);
	return smoothstep(0.36, 0.9, fog) * nearGround * amount;
}

float lensHaze(vec2 uv, float amount) {
	float veil =
		fbm(vec2(uv.x * 2.4 + u_time * 0.006, uv.y * 3.2 - u_time * 0.004)) * 0.58 +
		fbm(vec2(uv.x * 11.0 - u_time * 0.018, uv.y * 8.0 + 0.3)) * 0.18;
	float edgeLift = smoothstep(0.0, 0.84, distance(uv, vec2(0.5, 0.5)));
	return smoothstep(0.36, 0.94, veil + edgeLift * 0.2) * amount;
}

float wetLensDrop(vec2 uv, vec2 center, float radius, float strength) {
	vec2 d = uv - center;
	d.x *= u_resolution.x / u_resolution.y;
	float dist = length(d);
	float rim = (1.0 - smoothstep(radius * 0.72, radius, dist)) * smoothstep(radius * 0.2, radius * 0.72, dist);
	float internal = smoothstep(radius * 0.88, 0.0, dist) * (0.28 + 0.72 * fbm((uv - center) * 64.0));
	float highlight = smoothstep(radius * 0.12, 0.0, distance(d, vec2(-radius * 0.2, radius * 0.24)));
	float edgeFade = smoothstep(0.02, 0.34, uv.x) * smoothstep(0.02, 0.34, 1.0 - uv.x);
	return (rim * 0.24 + internal * 0.08 + highlight * 0.38) * strength * (1.0 - edgeFade * 0.72);
}

float wetLens(vec2 uv, float amount) {
	float d1 = wetLensDrop(uv, vec2(0.08, 0.82), 0.018, 0.16);
	float d2 = wetLensDrop(uv, vec2(0.93, 0.66), 0.014, 0.12);
	float d3 = wetLensDrop(uv, vec2(0.74, 0.12), 0.011, 0.1);
	float smear =
		smoothstep(0.76, 0.98, fbm(vec2(uv.x * 46.0, uv.y * 3.2 + u_time * 0.05))) *
		smoothstep(0.1, 0.96, uv.y);
	return (d1 + d2 + d3 + smear * 0.045) * amount;
}

float lensDirt(vec2 uv, float amount) {
	vec2 p = uv * u_resolution.xy / min(u_resolution.x, u_resolution.y);
	float blotch =
		smoothstep(0.6, 0.98, fbm(p * 18.0 + vec2(0.4, -0.7))) *
		smoothstep(0.2, 0.98, fbm(p * 47.0 + vec2(1.2, 3.1)));
	float dust =
		smoothstep(0.975, 1.0, hash(floor(uv * u_resolution.xy * 0.44))) *
		smoothstep(0.14, 0.86, uv.y);
	float edge = smoothstep(0.42, 0.94, distance(uv, vec2(0.5)));
	return (blotch * 0.55 + dust * 0.85 + edge * 0.2) * amount;
}

float anamorphicGlare(vec2 uv, vec2 origin, float strength) {
	vec2 d = uv - origin;
	float streak = exp(-abs(d.y) * 18.0) * smoothstep(0.88, 0.0, abs(d.x));
	float broken = 0.68 + 0.32 * fbm(vec2(uv.x * 34.0 + u_time * 0.01, uv.y * 6.0));
	float core = smoothstep(0.08, 0.0, length(d * vec2(1.0, 2.2)));
	return (streak * broken * 0.38 + core) * strength;
}

float aerialPerspective(vec2 uv, float amount) {
	float horizon = smoothstep(0.7, 0.0, abs(uv.y - 0.22));
	float lateral = 0.72 + 0.28 * fbm(vec2(uv.x * 2.8 + u_time * 0.004, uv.y * 9.0));
	return horizon * lateral * amount;
}

float puddleReflection(vec2 uv, float amount) {
	float ground = smoothstep(0.34, 0.02, uv.y);
	float puddles = smoothstep(0.64, 0.94, fbm(vec2(uv.x * 13.0, uv.y * 46.0 + u_time * 0.02)));
	float ripple = smoothstep(0.018, 0.0, abs(fract(uv.y * 58.0 + fbm(uv * 13.0) + u_time * 0.22) - 0.5));
	float sheen = smoothstep(0.92, 0.18, uv.y) * smoothstep(0.22, 0.92, uv.x) * smoothstep(0.22, 0.92, 1.0 - uv.x);
	return ground * (puddles * 0.46 + ripple * 0.16 + sheen * 0.08) * amount;
}

float bokeh(vec2 uv, vec2 center, float radius, float blades, float strength) {
	vec2 d = uv - center;
	d.x *= u_resolution.x / u_resolution.y;
	float a = atan(d.y, d.x);
	float shape = 0.88 + 0.12 * cos(a * blades);
	float dist = length(d);
	float outer = radius * shape;
	float inner = radius * 0.34;
	float mid = radius * 0.72;
	float disk = 1.0 - smoothstep(inner, outer, dist);
	float rim = smoothstep(inner, mid, dist) * (1.0 - smoothstep(mid, outer, dist));
	return (disk * 0.24 + rim * 0.76) * strength;
}

vec3 chromaticAberration(vec3 color, vec2 uv, float amount) {
	float edge = smoothstep(0.22, 0.95, distance(uv, vec2(0.5)));
	float split = edge * amount;
	return color + vec3(split * 0.018, 0.0, -split * 0.016);
}

float snowLayer(vec2 uv, float scale, float speed, float size, float softness, float depth) {
	vec2 p = uv * scale;
	p.x += u_time * (0.62 + depth * 1.05);
	p.x += sin(u_time * (1.5 + depth * 1.1) + p.y * 0.65) * (0.28 + depth * 0.74);
	p.y += u_time * speed;
	vec2 id = floor(p);
	vec2 f = fract(p);
	float value = 0.0;
	for (int xo = -1; xo <= 1; xo++) {
		for (int yo = -1; yo <= 1; yo++) {
			vec2 offset = vec2(float(xo), float(yo));
			vec2 cell = id + offset;
			float rnd = hash(cell);
			float active = smoothstep(0.18, 1.0, rnd);
			vec2 center = offset + vec2(fract(rnd * 9.71), fract(rnd * 4.83));
			vec2 d = f - center;
			d.x *= 1.0 + depth * 0.38;
			float dist = length(d);
			float flake = smoothstep(size + softness, size, dist);
			float halo = smoothstep(size * 3.4, size * 0.9, dist) * 0.075;
			value += (flake + halo) * active;
		}
	}
	return min(value, 1.08);
}

float snowStreak(vec2 uv, float speed, float scale, float strength) {
	vec2 p = uv * vec2(scale, scale * 1.9);
	p.y += u_time * speed;
	p.x += p.y * 0.16 + sin(u_time * 1.7 + p.y * 0.42) * 0.14;
	vec2 id = floor(p);
	vec2 f = fract(p);
	float rnd = hash(id);
	float active = smoothstep(0.72, 1.0, rnd);
	float line = smoothstep(0.045, 0.0, abs(f.x - fract(rnd * 7.1)));
	float trail = smoothstep(0.42, 0.0, abs(f.y - fract(rnd * 13.7)));
	return line * trail * active * strength;
}

vec3 filmic(vec3 color) {
	color = max(color, vec3(0.0));
	color = color * (1.0 + color * 0.42) / (1.0 + color);
	return pow(color, vec3(0.92));
}

vec3 photographicGrade(vec3 color, vec2 uv, float wetness, float night) {
	float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
	float shadow = smoothstep(0.34, 0.02, luma);
	float highlight = smoothstep(0.58, 1.0, luma);
	color = mix(vec3(luma), color, 0.94 - shadow * 0.08 + highlight * 0.05);
	color *= 0.98 + highlight * 0.08;
	color += vec3(0.012, 0.018, 0.026) * shadow;
	color = mix(color, color * vec3(0.9, 0.96, 1.08), night * 0.28);
	color = mix(color, vec3(0.78, 0.84, 0.88), lensHaze(uv, 0.035 + wetness * 0.075 + night * 0.035));
	color += vec3(0.78, 0.88, 1.0) * wetLens(uv, wetness) * 0.045;
	color *= 1.0 - lensDirt(uv, 0.032 + wetness * 0.025);
	color = chromaticAberration(color, uv, 0.6 + wetness * 0.5 + night * 0.28);
	return color;
}

vec3 grade(vec2 uv) {
	vec3 zenith = vec3(0.045, 0.12, 0.23);
	vec3 horizon = vec3(0.22, 0.30, 0.38);
	vec3 low = vec3(0.06, 0.085, 0.12);
	float radial = smoothstep(0.95, 0.12, distance(uv, vec2(0.66, 0.22)));
	return mix(low, mix(horizon, zenith, uv.y), 0.76) + vec3(0.05, 0.13, 0.22) * radial;
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution.xy;
	vec2 p = uv;
	p.x *= u_resolution.x / u_resolution.y;
	vec3 col = grade(uv);
	float depth = atmosphericDepth(uv);
	float mist = fbm(p * 1.8 + vec2(u_time * 0.018, -u_time * 0.012));
	float cloud = cloudField(p * 1.38 + vec2(0.0, -uv.y * 0.3), 0.0, 0.38 + uv.y * 0.16);
	float lowCloud = cloudField(p * 2.4 + vec2(0.8, 0.2), 1.7, 0.42);
	float highVolume = cloudVolume(p * vec2(1.05, 0.86) + vec2(-0.1, uv.y * 0.18), 0.4, 0.5, 0.13);
	float lowVolume = cloudVolume(p * vec2(1.75, 1.05) + vec2(0.9, 0.24), 1.3, 0.44, 0.11);
	float horizonHaze = smoothstep(0.92, 0.05, 1.0 - uv.y) * smoothstep(0.08, 0.9, mist);
	float horizon = horizonSilhouette(uv, 0.145, 0.055);

	if (u_mode < 3.5) {
		float isSunrise = 1.0 - step(0.5, u_mode);
		float isSunset = step(0.5, u_mode) * (1.0 - step(1.5, u_mode));
		float isPartly = step(2.5, u_mode);
		float warmTime = clamp(isSunrise + isSunset, 0.0, 1.0);
		float isClear = 1.0 - clamp(warmTime + isPartly, 0.0, 1.0);
		vec2 sunPos = mix(vec2(0.22, 0.74), vec2(0.76, 0.24), isSunset);
		sunPos = mix(sunPos, vec2(0.78, 0.68), isClear);
		sunPos = mix(sunPos, vec2(0.72, 0.62), isPartly);
		float d = aspectDistance(uv, sunPos);
		float sun = smoothstep(mix(0.065, 0.19, warmTime), 0.0, d);
		float bloom = smoothstep(mix(0.26, 0.72, warmTime), 0.0, d);
		float corona = smoothstep(mix(0.18, 0.42, warmTime), 0.0, d) * (0.9 + 0.1 * fbm(p * 18.0));
		float glare = sunGlare(uv, sunPos) * (0.28 + warmTime * 0.72);
		float shafts = lightShaft(uv, sunPos, mix(-0.72, 2.42, isSunset), 0.24) * warmTime * (1.0 - isPartly * 0.7);
		float cirrus = smoothstep(0.62, 0.95, fbm(p * vec2(4.8, 13.0) + vec2(u_time * 0.035, 0.0))) * smoothstep(0.28, 0.95, uv.y);
		vec3 warm = mix(vec3(0.66, 0.78, 0.95), vec3(1.0, 0.52, 0.24), warmTime);
		vec3 skyTop = mix(vec3(0.12, 0.36, 0.69), vec3(0.1, 0.18, 0.34), warmTime);
		vec3 skyLow = mix(vec3(0.58, 0.78, 0.95), vec3(0.98, 0.48, 0.25), warmTime);
		col = mix(skyLow, skyTop, smoothstep(0.0, 1.0, uv.y));
		col += vec3(0.02, 0.04, 0.065) * skyTexture(uv, 0.36) * (1.0 - warmTime * 0.35);
		float airMass = airMassVariation(uv, 0.18 + isClear * 0.14);
		col += vec3(0.08, 0.13, 0.18) * airMass * (1.0 - warmTime * 0.28);
		col = mix(col, vec3(0.66, 0.78, 0.86), smoothstep(0.26, 0.0, uv.y) * isClear * 0.08);
		float skyVeil = atmosphericStreaks(uv, 0.3 + isClear * 0.28 + warmTime * 0.12);
		col = mix(col, vec3(0.78, 0.87, 0.94), skyVeil * (0.1 + isClear * 0.06));
		col += vec3(0.36, 0.50, 0.66) * skyVeil * 0.045 * (1.0 - warmTime * 0.35);
		col += vec3(0.48, 0.62, 0.82) * cirrusVeil(uv, 0.1, 0.05 + isClear * 0.08);
		col = mix(col, vec3(0.72, 0.84, 0.94), smoothstep(0.04, 0.42, 1.0 - uv.y) * isClear * 0.06);
		col += warm * bloom * mix(0.12, 0.32, warmTime) + vec3(1.0, 0.92, 0.74) * sun * mix(0.38, 0.62, warmTime) + warm * corona * mix(0.08, 0.2, warmTime);
		col += vec3(1.0, 0.82, 0.56) * glare * mix(0.08, 0.14, warmTime);
		col += warm * lensScatter(uv, sunPos, mix(0.045, 0.16, warmTime));
		col += warm * anamorphicGlare(uv, sunPos, (0.035 + 0.12 * warmTime) * (1.0 - isPartly * 0.35));
		col += vec3(0.95, 0.82, 0.58) * shafts * 0.07;
		col = mix(col, vec3(0.78, 0.84, 0.92), cirrus * (0.05 + isPartly * 0.06));
		float cloudLine = 0.46 + (fbm(vec2(uv.x * 1.8 - u_time * 0.01, 1.8)) - 0.5) * 0.14;
		float deckLine =
			0.39 +
			(fbm(vec2(uv.x * 2.4 - u_time * 0.008, 3.1)) - 0.5) * 0.08;
		float segmentedDeck =
			smoothstep(0.2, 0.018, abs(uv.y - deckLine)) *
			smoothstep(0.2, 0.84, ridgedFbm(vec2(uv.x * 4.8 - u_time * 0.014, uv.y * 8.4 + 0.8))) *
			mix(0.45, 1.0, smoothstep(0.28, 0.86, fbm(vec2(uv.x * 8.6 + 1.9, uv.y * 5.2)))) *
			smoothstep(0.12, 0.38, uv.y) *
			smoothstep(0.76, 0.28, uv.y);
		float cumulus =
			cloudPuff(uv, vec2(0.28, 0.36), vec2(0.2, 0.075), 1.4) * 0.38 +
			cloudPuff(uv, vec2(0.57, 0.42), vec2(0.23, 0.09), 4.8) * 0.58 +
			cloudPuff(uv, vec2(0.84, 0.37), vec2(0.18, 0.07), 8.6) * 0.32;
		cumulus *= smoothstep(0.16, 0.38, uv.y) * smoothstep(0.68, 0.26, uv.y);
		float sunBreakClouds =
			cloudPuff(uv, vec2(0.34, 0.56), vec2(0.24, 0.08), 11.2) * 0.38 +
			cloudPuff(uv, vec2(0.62, 0.6), vec2(0.28, 0.095), 17.4) * 0.52 +
			cloudPuff(uv, vec2(0.91, 0.53), vec2(0.22, 0.075), 21.6) * 0.28;
		sunBreakClouds *= smoothstep(0.36, 0.62, uv.y) * smoothstep(0.86, 0.5, uv.y);
		float brightCloudBand =
			smoothstep(
				0.44,
				0.86,
				ridgedFbm(vec2(uv.x * 3.2 - u_time * 0.01, uv.y * 6.6 + 2.3)) +
				fbm(vec2(uv.x * 8.5 + 1.7, uv.y * 11.0 - u_time * 0.012)) * 0.22
			) *
			smoothstep(0.36, 0.56, uv.y) *
			smoothstep(0.84, 0.58, uv.y);
		float fairBody = clamp(
			fairCloudBank(uv, 0.0) * 0.12 +
			fairCloudBank(uv + vec2(0.24, 0.04), 4.1) * 0.08 +
			segmentedDeck * 0.58 +
			cumulus * 0.82 +
			sunBreakClouds * 0.9 +
			brightCloudBand * 0.78 +
			cirrusVeil(uv + vec2(0.0, -0.1), 1.8, 0.16) * smoothstep(0.24, 0.86, uv.y),
			0.0,
			1.0
		);
		float fairShadow = smoothstep(0.24, 0.78, fairBody) * smoothstep(cloudLine + 0.03, cloudLine - 0.18, uv.y);
		float fairLight = smoothstep(0.2, 0.9, uv.x) * smoothstep(cloudLine - 0.18, cloudLine + 0.22, uv.y);
		vec3 cloudShade = mix(vec3(0.42, 0.48, 0.55), vec3(0.88, 0.91, 0.94), fairLight);
		col = mix(col, cloudShade, fairBody * 0.68 * isPartly);
		col = mix(col, vec3(0.34, 0.41, 0.48), fairShadow * 0.3 * isPartly);
		col += vec3(1.0, 0.88, 0.66) * fairBody * bloom * 0.11 * isPartly;
		col += vec3(0.88, 0.92, 0.96) * cloudRim(fairBody, 0.78) * 0.14 * isPartly;
		float farTerrain = distantTerrain(uv, 0.165, 0.04, 0.025);
		float nearTerrain = distantTerrain(uv, 0.09, 0.032, 0.018);
		float treeLine = distantTreeLine(uv, 0.7 + warmTime * 0.15);
		float shore = distantShore(uv, 0.5 + isClear * 0.34 + warmTime * 0.2);
		float daylightPlace = isClear + isPartly * 0.78;
		float shoreDetail = daylightShoreDetail(uv, 0.38 + isClear * 0.34 + isPartly * 0.22);
		float clearReeds = nearShoreSilhouette(uv + vec2(0.0, -0.015), 0.22 + isClear * 0.18 + isPartly * 0.1);
		float lakeTexture = lakeSurfaceDetail(uv, sunPos, 0.12 + isClear * 0.22 + isPartly * 0.1);
		float reflectedSkyBands =
			smoothstep(0.02, 0.0, abs(fract(uv.y * 104.0 + fbm(vec2(uv.x * 9.0, uv.y * 20.0))) - 0.5)) *
			smoothstep(0.02, 0.34, uv.y) *
			smoothstep(0.38, 0.0, uv.y) *
			(0.45 + 0.55 * fbm(vec2(uv.x * 21.0 + u_time * 0.012, uv.y * 58.0)));
		vec3 farColor = mix(vec3(0.12, 0.19, 0.21), vec3(0.30, 0.18, 0.10), warmTime);
		vec3 nearColor = mix(vec3(0.055, 0.09, 0.10), vec3(0.18, 0.11, 0.07), warmTime);
		float farMountain = mountainFace(uv, 0.235, 11.0, 0.34 + isClear * 0.18 + warmTime * 0.12);
		float nearMountain = mountainFace(uv, 0.135, 16.0, 0.28 + isClear * 0.16 + warmTime * 0.08);
		float snowCap = mountainSnowLine(uv, 0.235, 0.22 * (1.0 - warmTime * 0.45) + isClear * 0.08);
		col = mix(col, farColor, farTerrain * (0.28 + warmTime * 0.28 + isClear * 0.08));
		col = mix(col, nearColor, nearTerrain * (0.38 + warmTime * 0.32 + isClear * 0.08));
		col = mix(col, mix(vec3(0.18, 0.26, 0.27), vec3(0.42, 0.23, 0.12), warmTime), farMountain);
		col = mix(col, mix(vec3(0.07, 0.12, 0.12), vec3(0.22, 0.13, 0.08), warmTime), nearMountain);
		col += mix(vec3(0.74, 0.82, 0.86), vec3(0.96, 0.70, 0.48), warmTime) * snowCap * 0.18;
		col = mix(col, mix(vec3(0.045, 0.07, 0.075), vec3(0.14, 0.09, 0.055), warmTime), treeLine * (0.28 + warmTime * 0.24));
		col = mix(col, mix(vec3(0.06, 0.10, 0.12), vec3(0.22, 0.13, 0.08), warmTime), horizon * (0.24 + warmTime * 0.24));
		col += warm * groundSheen(uv, 0.07 + 0.12 * warmTime + isClear * 0.03);
		col += mix(vec3(0.36, 0.50, 0.62), warm, warmTime) * shore * (0.12 + warmTime * 0.12);
		col += warm * waterGlint(uv, sunPos, 0.04 + 0.12 * warmTime + isClear * 0.07);
		col += mix(vec3(0.30, 0.42, 0.50), warm, warmTime) * lakeSurfaceDetail(uv, sunPos, 0.1 + isClear * 0.13 + warmTime * 0.09);
		col += vec3(0.34, 0.48, 0.58) * lakeTexture * daylightPlace;
		col += vec3(0.54, 0.66, 0.74) * reflectedSkyBands * (0.08 + isClear * 0.12 + isPartly * 0.08);
		col += warm * puddleReflection(uv, 0.03 + 0.07 * warmTime + isClear * 0.025);
		col += mix(vec3(0.06, 0.10, 0.09), vec3(0.32, 0.18, 0.09), warmTime) * shorelineTexture(uv, 0.24 + isClear * 0.18 + isPartly * 0.08);
		col += vec3(0.11, 0.18, 0.16) * shoreDetail * (0.42 + daylightPlace * 0.2);
		col = mix(col, vec3(0.035, 0.065, 0.055), clearReeds * (0.24 + daylightPlace * 0.18));
		float warmShore = nearShoreSilhouette(uv, 0.18 + warmTime * 0.24) * warmTime;
		col = mix(col, vec3(0.075, 0.065, 0.055), warmShore);
		col += vec3(0.72, 0.34, 0.15) * lakeSurfaceDetail(uv, sunPos, 0.06 + warmTime * 0.12) * warmTime;
		col += vec3(0.16, 0.12, 0.10) * nearShoreSilhouette(uv + vec2(0.0, -0.035), 0.1) * warmTime;
		col += mix(vec3(0.13, 0.19, 0.20), warm, warmTime) * groundSheen(uv, 0.035 + isClear * 0.045);
		col = mix(col, vec3(0.72, 0.80, 0.84), horizonHaze * (0.14 + isClear * 0.05));
		col = mix(col, vec3(0.66, 0.80, 0.92), aerialPerspective(uv, 0.1 + isClear * 0.045));
	} else if (u_mode < 5.5) {
		float isFog = step(4.5, u_mode);
		float fogAmount = mix(0.42, 0.72, step(4.5, u_mode));
		float veil = smoothstep(0.18, 0.82, mist * 0.64 + lowCloud * 0.86 + depth * 0.25);
		float bands = smoothstep(0.34, 0.92, fbm(vec2(uv.x * 5.6 + u_time * 0.025, uv.y * 22.0 - u_time * 0.035)));
		float smoke = smoothstep(0.24, 0.84, fbm(vec2(uv.x * 3.4 - u_time * 0.022, uv.y * 6.6 + u_time * 0.014)));
		float backRidge = horizonSilhouette(uv, 0.21, 0.04);
		float nearRidge = horizonSilhouette(uv, 0.09, 0.03);
		float bank = fogBank(uv, 0.028, 4.2);
		float foreground = fogBank(uv + vec2(0.15, -0.08), 0.052, 7.6);
		float valley = smoothstep(0.86, 0.08, uv.y) * smoothstep(0.1, 0.74, fbm(vec2(uv.x * 2.1 - u_time * 0.01, uv.y * 5.4)));
		float upperBreak = smoothstep(0.56, 0.94, fbm(vec2(uv.x * 3.8 + 1.4, uv.y * 9.0 - u_time * 0.01))) * smoothstep(0.58, 1.0, uv.y);
		float motes = particulate(uv, 0.18, 0.16);
		float fogGround = groundFogBands(uv, 0.58 + isFog * 0.3);
		float foregroundMass = foregroundTreeMass(uv, 0.42 + (1.0 - isFog) * 0.22);
		float fogTrees = fogTreeBands(uv, 0.44 + isFog * 0.34);
		float wetMeadow = fogWetMeadow(uv, 0.36 + isFog * 0.3);
		float lowSilhouette = nearShoreSilhouette(uv + vec2(0.0, -0.012), 0.22 + isFog * 0.18);
		vec2 hazeSunPos = vec2(0.62, 0.66);
		float diffusedSun = hazeOrb(uv, hazeSunPos, 0.07) * (1.0 - isFog);
		float layeredDust =
			smoothstep(0.38, 0.92, fbm(vec2(uv.x * 7.2 - u_time * 0.05, uv.y * 11.0 + 0.2))) *
			smoothstep(0.05, 0.92, uv.y) *
			smoothstep(1.0, 0.16, uv.y);
		vec3 fogColor = mix(vec3(0.42, 0.47, 0.50), vec3(0.62, 0.66, 0.68), fogAmount);
		vec3 hazeColor = vec3(0.62, 0.58, 0.49);
		col = mix(col, mix(hazeColor, fogColor, isFog), (veil * 0.54 + bank * 0.26 + valley * 0.28) * fogAmount);
		col = mix(col, vec3(0.76, 0.79, 0.78), (bands + foreground * 0.72) * fogAmount * 0.16 * isFog);
		col = mix(col, vec3(0.23, 0.28, 0.32), upperBreak * isFog * 0.22);
		col = mix(col, vec3(0.52, 0.49, 0.41), smoke * (1.0 - isFog) * 0.28);
		col = mix(col, vec3(0.72, 0.66, 0.52), layeredDust * (1.0 - isFog) * 0.14);
		col += vec3(1.0, 0.78, 0.48) * diffusedSun * 0.32;
		col += vec3(0.94, 0.74, 0.42) * lensScatter(uv, hazeSunPos, 0.12) * (1.0 - isFog);
		col = mix(col, vec3(0.26, 0.28, 0.27), backRidge * (0.12 + 0.2 * (1.0 - isFog)));
		col = mix(col, vec3(0.20, 0.23, 0.24), nearRidge * (0.2 + 0.16 * (1.0 - isFog)));
		col = mix(col, vec3(0.14, 0.16, 0.16), distantTreeLine(uv, 0.46) * (0.2 + 0.24 * (1.0 - isFog)));
		col = mix(col, mix(vec3(0.18, 0.18, 0.15), vec3(0.12, 0.15, 0.15), isFog), fogTrees * (0.2 + isFog * 0.16));
		col = mix(col, vec3(0.20, 0.23, 0.24), horizon * (0.12 + 0.18 * (1.0 - isFog)));
		col += mix(vec3(0.28, 0.30, 0.28), vec3(0.62, 0.66, 0.66), isFog) * distantShore(uv, 0.32) * 0.1;
		col = mix(col, mix(vec3(0.30, 0.28, 0.22), vec3(0.42, 0.46, 0.46), isFog), mountainFace(uv, 0.18, 9.0, 0.08 + 0.08 * (1.0 - isFog)));
		col += mix(vec3(0.30, 0.32, 0.28), vec3(0.54, 0.58, 0.58), isFog) * lakeSurfaceDetail(uv, hazeSunPos, 0.05 + 0.05 * isFog);
		col += mix(vec3(0.22, 0.21, 0.16), vec3(0.44, 0.48, 0.48), isFog) * wetMeadow * (0.16 + isFog * 0.12);
		col = mix(col, mix(vec3(0.13, 0.13, 0.1), vec3(0.12, 0.14, 0.14), isFog), lowSilhouette * (0.16 + isFog * 0.14));
		col = mix(col, mix(vec3(0.18, 0.19, 0.17), vec3(0.13, 0.16, 0.16), isFog), foregroundMass * (0.24 + 0.12 * (1.0 - isFog)));
		col = mix(col, mix(vec3(0.58, 0.56, 0.48), vec3(0.70, 0.74, 0.73), isFog), fogGround * (0.22 + isFog * 0.12));
		col = mix(col, fogColor, foreground * fogAmount * (0.28 + isFog * 0.12));
		col += mix(vec3(0.44, 0.36, 0.25), vec3(0.17, 0.20, 0.23), isFog) * depth * fogAmount * 0.28;
		col += vec3(0.9, 0.78, 0.52) * motes * (1.0 - isFog) * 0.42;
		col += vec3(0.76, 0.82, 0.84) * cirrusVeil(uv, 2.1, 0.05) * isFog;
		col = mix(col, vec3(0.64, 0.68, 0.68), aerialPerspective(uv, 0.32 + fogAmount * 0.18));
		col = mix(col, mix(vec3(0.17, 0.17, 0.14), vec3(0.22, 0.25, 0.24), isFog), foregroundTreeMass(uv, 0.5 + (1.0 - isFog) * 0.18) * (0.18 + 0.12 * (1.0 - isFog)));
		col = mix(col, mix(vec3(0.55, 0.53, 0.45), vec3(0.68, 0.71, 0.70), isFog), groundFogBands(uv, 0.42 + isFog * 0.22) * 0.18);
		col = mix(col, mix(vec3(0.16, 0.15, 0.11), vec3(0.18, 0.21, 0.21), isFog), fogTrees * (0.1 + isFog * 0.1));
		col += mix(vec3(0.28, 0.26, 0.18), vec3(0.48, 0.52, 0.52), isFog) * wetMeadow * (0.08 + isFog * 0.08);
		col += mix(vec3(0.26, 0.25, 0.18), vec3(0.56, 0.60, 0.60), isFog) * fogWetMeadow(uv + vec2(0.0, -0.025), 0.22 + isFog * 0.18) * 0.14;
		col = mix(col, fogColor, groundFogBands(uv + vec2(0.08, -0.015), 0.28 + isFog * 0.18) * (0.08 + isFog * 0.06));
	} else if (u_mode < 6.5) {
		float scud = windScud(uv);
		float dust = particulate(uv, 0.72, 0.13);
		float shear = windLayer(uv + vec2(0.08, 0.0));
		float movingGroundFog = groundFogBands(uv + vec2(u_time * 0.025, 0.0), 0.22);
		float windForeground = foregroundTreeMass(uv + vec2(sin(u_time * 0.28) * 0.004, 0.0), 0.62);
		float windGrass = windBentForeground(uv, 0.52);
		float lowDustSheet =
			smoothstep(0.42, 0.96, fbm(vec2(uv.x * 7.6 - u_time * 0.9, uv.y * 22.0 + scud * 0.6))) *
			smoothstep(0.02, 0.38, uv.y) *
			smoothstep(0.48, 0.08, uv.y);
		float bendingTreeEdge =
			foregroundTreeMass(uv + vec2(0.012 * sin(u_time * 0.55 + uv.y * 12.0), -0.02), 0.48);
		float gustVeil =
			smoothstep(0.48, 0.94, fbm(vec2(uv.x * 5.2 - u_time * 0.72, uv.y * 17.0 + scud * 0.4))) *
			smoothstep(0.08, 0.86, uv.y);
		float pressureBands =
			smoothstep(0.34, 0.9, fbm(vec2(uv.x * 2.8 - u_time * 0.38, uv.y * 12.0 + scud))) *
			smoothstep(0.06, 0.9, uv.y);
		col = mix(col, vec3(0.12, 0.17, 0.20), lowVolume * 0.28 + scud * 0.3);
		col += vec3(0.50, 0.63, 0.72) * shear * 0.006;
		col += vec3(0.70, 0.76, 0.78) * scud * 0.3;
		col += vec3(0.64, 0.68, 0.62) * gustVeil * 0.2;
		col += vec3(0.62, 0.68, 0.70) * pressureBands * 0.08;
		col += vec3(0.74, 0.66, 0.52) * dust * 0.32;
		col += vec3(0.58, 0.62, 0.54) * lowDustSheet * 0.22;
		col = mix(col, vec3(0.055, 0.075, 0.082), distantTreeLine(uv, 0.72) * 0.34);
		col = mix(col, vec3(0.07, 0.10, 0.12), horizon * 0.48);
		col = mix(col, vec3(0.08, 0.12, 0.13), mountainFace(uv, 0.155, 13.0, 0.18));
		col = mix(col, vec3(0.035, 0.052, 0.052), windForeground * 0.42);
		col = mix(col, vec3(0.38, 0.45, 0.46), movingGroundFog * 0.2);
		col += vec3(0.34, 0.42, 0.46) * groundSheen(uv, 0.08);
		col += vec3(0.42, 0.48, 0.48) * distantShore(uv, 0.52) * 0.12;
		col += vec3(0.30, 0.36, 0.36) * lakeSurfaceDetail(uv, vec2(0.48, 0.36), 0.07);
		col += vec3(0.22, 0.28, 0.24) * windGrass * 0.28;
		col = mix(col, vec3(0.025, 0.04, 0.038), bendingTreeEdge * 0.18);
		col = mix(col, vec3(0.35, 0.42, 0.46), horizonHaze * 0.18);
		col = mix(col, vec3(0.42, 0.48, 0.50), aerialPerspective(uv, 0.14));
		col = mix(col, vec3(0.025, 0.038, 0.04), foregroundTreeMass(uv, 0.72) * 0.24);
		col += vec3(0.46, 0.53, 0.54) * groundFogBands(uv + vec2(u_time * 0.03, 0.0), 0.24) * 0.1;
		col += vec3(0.48, 0.54, 0.50) * windBentForeground(uv + vec2(0.0, -0.018), 0.34) * 0.12;
	} else if (u_mode < 7.5) {
		float broad =
			fbm(vec2(uv.x * 1.55 + u_time * 0.01, uv.y * 2.1 - 0.15));
		float mid =
			fbm(vec2(uv.x * 3.8 - u_time * 0.018 + broad * 0.42, uv.y * 5.0 + broad * 0.28));
		float fine =
			fbm(vec2(uv.x * 10.5 + mid * 0.8, uv.y * 8.6 - u_time * 0.012));
		float deck = smoothstep(0.18, 0.78, broad * 0.66 + mid * 0.3 + fine * 0.1 + uv.y * 0.12);
		float underside = smoothstep(0.82, 0.12, uv.y) * smoothstep(0.26, 0.84, broad * 0.7 + mid * 0.24);
		float breakLight =
			smoothstep(0.74, 0.96, fbm(vec2(uv.x * 2.6 - 0.35, uv.y * 1.8 + 0.6))) *
			smoothstep(0.22, 0.86, uv.y) *
			(1.0 - underside * 0.64);
		float striation =
			smoothstep(0.54, 0.94, fbm(vec2(uv.x * 7.4 + u_time * 0.012, uv.y * 18.0))) *
			smoothstep(0.16, 0.94, uv.y);
		float cloudEdge = cloudRim(deck, 0.72);
		float deckTexture = overcastDeckTexture(uv, 0.58);
		float lowField = overcastLowField(uv, 0.48);
		float cloudBreaks =
			smoothstep(0.62, 0.98, ridgedFbm(vec2(uv.x * 13.0 + mid * 1.2, uv.y * 9.4 + broad))) *
			smoothstep(0.22, 0.9, uv.y);
		float lowTreeLine = distantTreeLine(uv + vec2(0.0, -0.015), 0.62);
		float scudShadow =
			windScud(uv + vec2(-0.06, 0.12)) *
			smoothstep(0.18, 0.82, uv.y) *
			smoothstep(0.9, 0.24, uv.y);
		float cloudForeground = foregroundTreeMass(uv, 0.58);
		float lowMist = groundFogBands(uv, 0.26);
		col = mix(col, vec3(0.16, 0.20, 0.24), deck * 0.82 + striation * 0.14);
		col = mix(col, vec3(0.075, 0.10, 0.125), deckTexture * 0.34 + scudShadow * 0.24);
		col += vec3(0.42, 0.50, 0.56) * smoothstep(0.45, 0.96, deck) * 0.18;
		col += vec3(0.38, 0.45, 0.49) * deckTexture * 0.16;
		col += vec3(0.18, 0.23, 0.25) * cloudBreaks * 0.18;
		col = mix(col, vec3(0.075, 0.10, 0.125), underside * 0.46);
		col = mix(col, vec3(0.42, 0.49, 0.54), breakLight * 0.14);
		col += vec3(0.52, 0.58, 0.62) * cloudEdge * 0.12;
		col = mix(col, vec3(0.045, 0.065, 0.078), horizon * 0.58);
		col = mix(col, vec3(0.08, 0.11, 0.13), mountainFace(uv, 0.17, 12.0, 0.22));
		col = mix(col, vec3(0.028, 0.043, 0.048), lowTreeLine * 0.34);
		col = mix(col, vec3(0.028, 0.04, 0.047), cloudForeground * 0.44);
		col = mix(col, vec3(0.30, 0.35, 0.37), lowMist * 0.2);
		col += vec3(0.30, 0.36, 0.40) * groundSheen(uv, 0.16);
		col += vec3(0.16, 0.20, 0.20) * shorelineTexture(uv, 0.34);
		col += vec3(0.30, 0.36, 0.38) * lakeSurfaceDetail(uv, vec2(0.52, 0.42), 0.13);
		col += vec3(0.28, 0.34, 0.33) * lowField * 0.34;
		col = mix(col, vec3(0.018, 0.03, 0.032), lowField * 0.12);
		col = mix(col, vec3(0.33, 0.39, 0.43), aerialPerspective(uv, 0.15));
		col = mix(col, vec3(0.018, 0.028, 0.034), foregroundTreeMass(uv, 0.76) * 0.28);
		col += vec3(0.34, 0.39, 0.42) * groundFogBands(uv, 0.3) * 0.1;
	} else if (u_mode < 8.5) {
		col = mix(col, vec3(0.006, 0.010, 0.022), 0.64);
		col = mix(col, vec3(0.045, 0.055, 0.075), cloud * 0.72);
		float farRain = rainStreak(uv, 4.4, 34.0, 0.72, 0.018, 0.42, 0.22);
		float midRain = rainSlash(uv + vec2(0.13, 0.07), 5.8, 42.0, 0.42, 0.032, 0.48, 0.19, 0.82);
		float nearRain = rainSlash(uv + vec2(0.31, 0.18), 8.2, 20.0, 0.36, 0.05, 0.66, 0.17, 0.72);
		float shearMask = rainShearMask(uv, 0.5);
		float sheetRain = rainSheet(uv, 0.92);
		float impactSpray = rainImpactSpray(uv, 0.42);
		float rain = (farRain * 0.1 + midRain * 0.76 + nearRain * 0.64) * shearMask;
		float wetGlass = glassRunoff(uv, 0.11);
		float atmosphere = rainMist(uv, 0.58);
		float depthVeil = rainDepthVeil(uv, 0.48);
		float shelf =
			smoothstep(0.42, 0.9, ridgedFbm(vec2(uv.x * 3.4 + 1.6, uv.y * 7.4 - u_time * 0.012))) *
			smoothstep(0.26, 0.64, uv.y) *
			smoothstep(0.86, 0.5, uv.y);
		float baseGlow =
			smoothstep(0.4, 0.0, abs(uv.y - 0.27)) *
			smoothstep(0.12, 0.92, fbm(vec2(uv.x * 2.7 + 0.9, uv.y * 5.0)));
		float flashWindow = floor(u_time * 1.65);
		float flashRnd = hash(vec2(flashWindow, 8.0));
		float flashPulse = pow(max(0.0, sin(u_time * 18.0 + flashRnd * 9.0)), 34.0);
		float broadPulse =
			pow(max(0.0, sin(u_time * 3.8 + flashRnd * 14.0)), 8.0) * 0.72 +
			pow(max(0.0, sin(u_time * 7.1 + flashRnd * 5.0)), 20.0) * 0.28;
		float flashSeed = smoothstep(0.58, 1.0, flashRnd) * flashPulse;
		float sheetSeed = smoothstep(0.18, 1.0, flashRnd) * broadPulse;
		float bolt = lightningField(uv, flashWindow + flashRnd * 17.0) * flashSeed;
		float sheet = smoothstep(0.24, 0.92, cloud + lowVolume * 0.6) * max(flashSeed, sheetSeed * 0.55);
		float intracloud =
			smoothstep(0.38, 0.94, ridgedFbm(vec2(uv.x * 5.2 + flashRnd * 3.0, uv.y * 8.6 - u_time * 0.02))) *
			smoothstep(0.34, 1.0, uv.y) *
			smoothstep(1.02, 0.46, uv.y) *
			sheetSeed;
		float skyFlash =
			smoothstep(0.95, 0.22, distance(uv, vec2(0.58, 0.72))) *
			(0.18 + sheetSeed);
		float horizonFlash =
			smoothstep(0.74, 0.08, uv.y) *
			smoothstep(0.04, 0.34, uv.y) *
			sheetSeed;
		float groundFlash = wetForegroundTexture(uv, 0.5) * sheetSeed + puddleReflection(uv, 0.42) * sheetSeed;
		col = mix(col, vec3(0.12, 0.16, 0.21), atmosphere * 0.4 + depthVeil * 0.4 + sheetRain * 0.24);
		col = mix(col, vec3(0.02, 0.028, 0.038), shelf * 0.32);
		col += vec3(0.18, 0.26, 0.38) * baseGlow * 0.16;
		col += vec3(0.46, 0.56, 0.68) * sheetRain * 0.62;
		col += vec3(0.52, 0.64, 0.78) * rain * 0.72;
		col += vec3(0.58, 0.68, 0.78) * impactSpray * 0.22;
		col += vec3(0.74, 0.88, 1.0) * wetGlass * 0.16;
		col += vec3(0.56, 0.70, 0.94) * sheet * 0.52;
		col += vec3(0.44, 0.58, 0.84) * intracloud * 0.38;
		col += vec3(0.34, 0.44, 0.64) * skyFlash * 0.28;
		col += vec3(0.38, 0.52, 0.72) * horizonFlash * 0.44;
		col += vec3(0.92, 0.96, 1.0) * bolt * 0.72;
		col += vec3(0.58, 0.70, 0.86) * groundSheen(uv, 0.12);
		col += vec3(0.42, 0.54, 0.68) * puddleReflection(uv, 0.16);
		col += vec3(0.34, 0.46, 0.58) * wetForegroundTexture(uv, 0.3);
		col += vec3(0.18, 0.26, 0.34) * lakeSurfaceDetail(uv, vec2(0.55, 0.34), 0.16);
		col += vec3(0.54, 0.68, 0.9) * groundFlash * 0.36;
		col += vec3(0.32, 0.44, 0.58) * rainMist(uv, 0.22);
		col = mix(col, vec3(0.12, 0.16, 0.2), lowAtmosphere(uv, 0.22));
	} else if (u_mode < 11.5) {
		float heavy = step(9.5, u_mode) * (1.0 - step(10.5, u_mode));
		float drizzle = step(10.5, u_mode);
		float intensity = mix(1.05, 1.35, heavy) * mix(1.0, 0.52, drizzle);
		col = mix(col, vec3(0.012, 0.021, 0.035), 0.38 + heavy * 0.25 - drizzle * 0.18);
		col = mix(col, vec3(0.075, 0.092, 0.12), cloud * (0.56 + heavy * 0.18 - drizzle * 0.2));
		float farRain = rainStreak(uv, mix(2.7, 5.2, heavy), mix(38.0, 58.0, heavy), mix(0.72, 0.78, heavy), mix(0.017, 0.018, heavy), mix(0.34, 0.5, heavy), 0.2);
		float midRain = rainSlash(uv + vec2(0.23, 0.11), mix(4.0, 7.2, heavy), mix(34.0, 42.0, heavy), mix(0.44, 0.54, heavy), mix(0.03, 0.036, heavy), mix(0.44, 0.6, heavy), 0.18, mix(0.72, 0.96, heavy));
		float nearRain = rainSlash(uv + vec2(0.41, 0.29), mix(5.3, 9.2, heavy), mix(16.0, 20.0, heavy), mix(0.3, 0.4, heavy), mix(0.05, 0.062, heavy), mix(0.62, 0.82, heavy), 0.16, mix(0.62, 0.82, heavy));
		float drizzleNoise = smoothstep(0.42, 0.94, fbm(uv * 22.0 + vec2(u_time * 0.34, -u_time * 0.64)));
		float curtain = rainCurtain(uv, mix(2.8, 5.8, heavy), mix(56.0, 72.0, heavy), 0.24, mix(0.08, 0.1, heavy));
		float shearMask = rainShearMask(uv, mix(0.36, 0.58, heavy));
		float sheetRain = rainSheet(uv, mix(0.98, 1.28, heavy));
		float impactSpray = rainImpactSpray(uv, mix(0.42, 0.86, heavy));
		float rain = (curtain * 0.5 + farRain * 0.16 + midRain * 1.0 + nearRain * mix(0.82, 0.74, heavy)) * shearMask;
		float fineDrizzle =
			drizzleNoise * rainStreak(uv + vec2(0.17, 0.03), 3.4, 96.0, 0.52, 0.006, 0.16, 0.12) +
			rainCurtain(uv + vec2(0.11, 0.0), 2.4, 150.0, 0.18, 0.18) +
			rainMist(uv, 0.3);
		rain = mix(fineDrizzle, rain, 1.0 - drizzle);
		float spray = rainMist(uv, mix(0.52, 0.9, heavy));
		float runoff = glassRunoff(uv, mix(0.045, 0.12, heavy));
		float depthVeil = rainDepthVeil(uv, mix(0.42, 0.62, heavy));
		col = mix(
			col,
			vec3(0.13, 0.16, 0.19),
			spray * mix(0.26, 0.48, 1.0 - drizzle) + depthVeil * 0.34 + sheetRain * 0.16
		);
		col += vec3(0.42, 0.52, 0.62) * sheetRain * intensity * mix(0.5, 0.56, heavy);
		col += vec3(0.54, 0.66, 0.80) * rain * intensity * (1.05 + drizzle * 0.18);
		col += vec3(0.62, 0.72, 0.82) * impactSpray * mix(0.18, 0.34, heavy);
		col += vec3(0.72, 0.84, 0.96) * runoff * mix(0.02, 0.12, heavy);
		col += vec3(0.44, 0.55, 0.66) * groundSheen(uv, mix(0.1, 0.18, heavy));
		col += vec3(0.38, 0.50, 0.62) * puddleReflection(uv, mix(0.08, 0.16, heavy));
		col += vec3(0.34, 0.44, 0.54) * wetForegroundTexture(uv, mix(0.42, 0.42, heavy));
		col = mix(col, vec3(0.11, 0.14, 0.17), rainMist(uv, mix(0.14, 0.24, heavy)));
		col = mix(col, vec3(0.12, 0.15, 0.18), lowAtmosphere(uv, mix(0.18, 0.28, heavy)));
	} else if (u_mode < 14.5) {
		float heavySnow = step(12.5, u_mode) * (1.0 - step(13.5, u_mode));
		float wintry = step(13.5, u_mode);
		col = mix(col, vec3(0.16, 0.20, 0.27), cloud * 0.54 + lowVolume * 0.32);
		col = mix(col, vec3(0.24, 0.30, 0.38), rainMist(uv, 0.32 + heavySnow * 0.26));
		float backSnow = snowLayer(uv + vec2(0.12, 0.05), mix(34.0, 48.0, heavySnow), mix(3.8, 5.4, heavySnow), 0.013, 0.026, 0.2);
		float midSnow = snowLayer(uv + vec2(0.31, 0.2), mix(24.0, 36.0, heavySnow), mix(5.2, 7.4, heavySnow), 0.022, 0.034, 0.48);
		float nearSnow = snowLayer(uv + vec2(0.56, 0.33), mix(13.0, 20.0, heavySnow), mix(7.0, 10.2, heavySnow), 0.034, 0.052, 0.82);
		float gustSnow = snowStreak(uv, mix(5.2, 8.0, heavySnow), mix(24.0, 34.0, heavySnow), mix(0.22, 0.5, heavySnow));
		float snow = backSnow * 0.42 + midSnow * 0.62 + nearSnow * mix(0.32, 0.52, heavySnow);
		float sleet = rainStreak(uv, 3.4, 28.0, 0.5, 0.024, 0.36, 0.14) * wintry;
		float whiteout =
			smoothstep(0.28, 0.9, fbm(vec2(uv.x * 2.7 - u_time * 0.14, uv.y * 6.4 + u_time * 0.2))) *
			smoothstep(0.04, 0.94, uv.y);
		float groundBlow =
			smoothstep(0.3, 0.02, uv.y) *
			smoothstep(0.34, 0.9, fbm(vec2(uv.x * 7.0 - u_time * 0.46, uv.y * 24.0 + u_time * 0.12)));
		float snowVeil =
			smoothstep(0.22, 0.92, fbm(vec2(uv.x * 4.0 - u_time * 0.18, uv.y * 10.0 + u_time * 0.16))) *
			smoothstep(0.06, 0.98, uv.y);
		float snowpack = snowpackRelief(uv, 0.42 + heavySnow * 0.24 + wintry * 0.12);
		float buriedLine = snowBuriedTreeline(uv, 0.5 + heavySnow * 0.18 + wintry * 0.08);
		float lowSnowMist = groundFogBands(uv + vec2(-u_time * 0.018, -0.03), 0.2 + heavySnow * 0.22);
		col = mix(col, vec3(0.48, 0.56, 0.64), snowVeil * (0.1 + heavySnow * 0.24 + wintry * 0.08));
		col += vec3(0.88, 0.94, 1.0) * snow * mix(0.48, 0.66, heavySnow);
		col += vec3(0.82, 0.90, 1.0) * gustSnow * mix(0.72, 0.96, heavySnow);
		col += vec3(0.54, 0.72, 0.92) * sleet * 0.68;
		col = mix(col, vec3(0.66, 0.72, 0.78), whiteout * (0.14 + heavySnow * 0.22));
		col = mix(col, vec3(0.72, 0.78, 0.84), horizon * (0.2 + heavySnow * 0.24));
		col = mix(col, vec3(0.18, 0.22, 0.25), distantTreeLine(uv, 0.58) * (0.16 + heavySnow * 0.12));
		col = mix(col, vec3(0.18, 0.22, 0.24), buriedLine * (0.18 + heavySnow * 0.1));
		col += vec3(0.62, 0.70, 0.8) * distantShore(uv, 0.32 + heavySnow * 0.18) * 0.18;
		col += vec3(0.72, 0.80, 0.9) * groundSheen(uv, 0.12 + heavySnow * 0.08);
		col += vec3(0.78, 0.86, 0.94) * groundBlow * (0.12 + heavySnow * 0.22);
		col += vec3(0.82, 0.88, 0.94) * snowForegroundTexture(uv, 0.32 + heavySnow * 0.22);
		col += vec3(0.78, 0.84, 0.88) * snowpack * (0.22 + heavySnow * 0.08);
		col = mix(col, vec3(0.64, 0.70, 0.74), lowSnowMist * (0.12 + heavySnow * 0.12));
		col = mix(col, vec3(0.34, 0.40, 0.44), distantTerrain(uv, 0.11, 0.036, 0.022) * (0.08 + heavySnow * 0.06));
		col = mix(col, vec3(0.58, 0.64, 0.70), lowAtmosphere(uv, 0.28 + heavySnow * 0.2));
		col = mix(col, vec3(0.74, 0.80, 0.86), aerialPerspective(uv, 0.22 + heavySnow * 0.24));
		col = mix(col, vec3(0.42, 0.48, 0.52), snowBuriedTreeline(uv + vec2(0.0, -0.035), 0.42) * (0.08 + heavySnow * 0.06));
		col += vec3(0.84, 0.90, 0.94) * snowpackRelief(uv + vec2(0.0, -0.018), 0.24 + heavySnow * 0.14) * 0.12;
		col += vec3(0.16, 0.28, 0.42) * 0.18;
	} else {
		float partlyNight = step(15.5, u_mode) * (1.0 - step(16.5, u_mode));
		float drizzleNight = step(16.5, u_mode);
		vec2 moonPos = vec2(0.78, 0.77);
		float moon = moonSurface(uv, moonPos);
		float moonBloom = smoothstep(0.18, 0.0, aspectDistance(uv, moonPos));
		float nightCloudLine =
			0.68 +
			(fbm(vec2(uv.x * 1.7 - u_time * 0.008, 2.2)) - 0.5) * 0.18 +
			(fbm(vec2(uv.x * 5.5 + 1.1, 4.4)) - 0.5) * 0.05;
		float nightCloud =
			smoothstep(0.32, 0.035, abs(uv.y - nightCloudLine)) *
			smoothstep(0.28, 0.68, uv.y) *
			smoothstep(0.96, 0.54, uv.y);
		float nightCloudTexture =
			smoothstep(0.38, 0.9, fbm(vec2(uv.x * 5.4 - u_time * 0.012, uv.y * 7.8 + nightCloud)));
		float nightCloudBody = clamp(nightCloud * (0.58 + nightCloudTexture * 0.34), 0.0, 1.0);
		float shoreLight = moonlitShore(uv, moonPos, 0.42 + drizzleNight * 0.26);
		float nightForeground = nightForegroundSilhouette(uv, 0.72 + partlyNight * 0.16);
		float groundMist = groundFogBands(uv + vec2(0.0, -0.02), 0.18 + drizzleNight * 0.18);
		col = mix(col, vec3(0.010, 0.015, 0.032), 0.5);
		col += vec3(0.62, 0.72, 0.96) * skyTexture(uv, 0.18);
		col += vec3(0.72, 0.82, 1.0) * starField(uv) * (0.72 - partlyNight * 0.48 - drizzleNight * 0.64);
		col += vec3(0.88, 0.92, 1.0) * moon * 0.62 + vec3(0.10, 0.15, 0.28) * moonBloom * 0.08;
		col += vec3(0.50, 0.62, 0.86) * anamorphicGlare(uv, moonPos, 0.01);
		col = mix(col, vec3(0.10, 0.12, 0.16), nightCloudBody * 0.58 * partlyNight);
		col += vec3(0.34, 0.42, 0.58) * cloudRim(nightCloudBody, moonBloom) * partlyNight * 0.16;
		col = mix(col, vec3(0.006, 0.009, 0.012), distantTreeLine(uv, 0.86) * 0.32);
		col = mix(col, vec3(0.006, 0.008, 0.014), horizon * 0.58);
		col = mix(col, vec3(0.010, 0.015, 0.018), mountainFace(uv, 0.18, 10.0, 0.2 + partlyNight * 0.08));
		col += vec3(0.18, 0.23, 0.32) * mountainSnowLine(uv, 0.18, 0.08) * (1.0 - drizzleNight * 0.5);
		col += vec3(1.0, 0.70, 0.38) * distantLights(uv) * (0.18 + drizzleNight * 0.08);
		col += vec3(0.9, 0.62, 0.38) * lowAtmosphere(uv, 0.12) * (1.0 - drizzleNight * 0.2);
		col = mix(col, vec3(0.06, 0.08, 0.11), aerialPerspective(uv, 0.13 + drizzleNight * 0.05));
		col = mix(col, vec3(0.005, 0.008, 0.01), nightForeground * 0.4);
		col = mix(col, vec3(0.08, 0.11, 0.13), groundMist * 0.14);
		col += vec3(0.12, 0.18, 0.28) * groundSheen(uv, 0.08 + drizzleNight * 0.06);
		col += vec3(0.28, 0.36, 0.48) * distantShore(uv, 0.42 + drizzleNight * 0.18) * 0.16;
		col += vec3(0.24, 0.34, 0.50) * lakeSurfaceDetail(uv, moonPos, 0.08 + drizzleNight * 0.08);
		col += vec3(0.30, 0.42, 0.62) * shoreLight * (0.34 + drizzleNight * 0.2);
		col += vec3(0.34, 0.46, 0.68) * puddleReflection(uv, 0.08 + drizzleNight * 0.2);
		col += vec3(0.05, 0.07, 0.08) * shorelineTexture(uv, 0.28 + drizzleNight * 0.08);
		col += vec3(0.20, 0.28, 0.38) * wetForegroundTexture(uv, 0.06 + drizzleNight * 0.24);
		col = mix(col, vec3(0.004, 0.006, 0.008), nightForegroundSilhouette(uv + vec2(0.0, -0.035), 0.58) * 0.22);
		col += vec3(1.0, 0.72, 0.46) * bokeh(uv, vec2(0.2, 0.17), 0.018, 7.0, 0.028 * (1.0 - partlyNight));
		col += vec3(0.72, 0.84, 1.0) * bokeh(uv, vec2(0.83, 0.2), 0.014, 6.0, 0.024);
		float nightRainSheet = rainSheet(uv + vec2(0.05, 0.0), 0.82) * drizzleNight;
		float nightSpray = rainImpactSpray(uv, 0.42) * drizzleNight;
		float rain =
			(
				rainStreak(uv + vec2(0.14, 0.03), 3.0, 82.0, 0.56, 0.007, 0.16, 0.1) * 0.88 +
				rainSlash(uv + vec2(0.34, 0.17), 5.2, 34.0, 0.34, 0.03, 0.48, 0.12, 0.68) * 0.42
			) *
			drizzleNight;
		float glass = glassRunoff(uv, 0.18) * drizzleNight;
		float wetVeil = rainMist(uv, 0.36) * drizzleNight + rainDepthVeil(uv, 0.32) * drizzleNight;
		col = mix(col, vec3(0.055, 0.075, 0.11), wetVeil * 0.72 + nightRainSheet * 0.22);
		col += vec3(0.32, 0.42, 0.56) * nightRainSheet * 0.54;
		col += vec3(0.45, 0.58, 0.78) * rain * 0.72;
		col += vec3(0.48, 0.58, 0.66) * nightSpray * 0.24;
		col += vec3(0.62, 0.74, 0.92) * glass * 0.14;
		col += vec3(0.28, 0.42, 0.62) * puddleReflection(uv, 0.22) * drizzleNight;
	}

	float wetness =
		(step(7.5, u_mode) * (1.0 - step(11.5, u_mode))) * 0.75 +
		step(16.5, u_mode) * 0.38;
	float nightAmount = step(14.5, u_mode) + step(7.5, u_mode) * (1.0 - step(8.5, u_mode)) * 0.35;
	col = mix(col, vec3(0.66, 0.70, 0.72), horizonHaze * 0.08);
	col += blueNoise(uv) * 0.014 + (grain(uv) - 0.5) * 0.014;
	col = filmic(col);
	col = photographicGrade(col, uv, wetness, clamp(nightAmount, 0.0, 1.0));
	float vignette = smoothstep(0.96, 0.16, distance(uv, vec2(0.5, 0.52)));
	col *= mix(0.62, 1.08, vignette);
	gl_FragColor = vec4(col, 1.0);
}`;

			function compileShader(type: number, source: string) {
				const shader = glContext.createShader(type);
				if (!shader) return null;
				glContext.shaderSource(shader, source);
				glContext.compileShader(shader);
				if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
					console.warn(
						'wxcn weather shader failed to compile',
						glContext.getShaderInfoLog(shader)
					);
					glContext.deleteShader(shader);
					return null;
				}
				return shader;
			}

			const vertexShader = compileShader(glContext.VERTEX_SHADER, vertexSource);
			const fragmentShader = compileShader(
				glContext.FRAGMENT_SHADER,
				fragmentSource
			);
			if (!vertexShader || !fragmentShader) return;

			const program = glContext.createProgram();
			if (!program) return;
			glContext.attachShader(program, vertexShader);
			glContext.attachShader(program, fragmentShader);
			glContext.linkProgram(program);
			if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
				console.warn(
					'wxcn weather shader failed to link',
					glContext.getProgramInfoLog(program)
				);
				return;
			}

			const positionBuffer = glContext.createBuffer();
			glContext.bindBuffer(glContext.ARRAY_BUFFER, positionBuffer);
			glContext.bufferData(
				glContext.ARRAY_BUFFER,
				new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
				glContext.STATIC_DRAW
			);

			const positionLocation = glContext.getAttribLocation(
				program,
				'a_position'
			);
			const resolutionLocation = glContext.getUniformLocation(
				program,
				'u_resolution'
			);
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
				glContext.vertexAttribPointer(
					positionLocation,
					2,
					glContext.FLOAT,
					false,
					0,
					0
				);
				glContext.uniform2f(resolutionLocation, canvas.width, canvas.height);
				glContext.uniform1f(timeLocation, (performance.now() - start) / 1000);
				glContext.uniform1f(modeLocation, modeValue);
				glContext.drawArrays(glContext.TRIANGLES, 0, 6);
				frame = requestAnimationFrame(render);
			}

			frame = requestAnimationFrame(render);

			teardownWebgl = () => {
				cancelAnimationFrame(frame);
				glContext.deleteBuffer(positionBuffer);
				glContext.deleteProgram(program);
				glContext.deleteShader(vertexShader);
				glContext.deleteShader(fragmentShader);
			};
		}

		if (!('IntersectionObserver' in window)) {
			startWebgl();
			return () => teardownWebgl();
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					startWebgl();
					observer.disconnect();
				}
			},
			{ rootMargin: '280px 0px' }
		);

		observer.observe(canvas);

		return () => {
			observer.disconnect();
			teardownWebgl();
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="absolute inset-0 h-full w-full"
	aria-hidden="true"
></canvas>
