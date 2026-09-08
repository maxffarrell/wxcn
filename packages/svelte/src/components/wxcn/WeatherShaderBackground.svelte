<script lang="ts" module>
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
</script>

<script lang="ts">
	import type { SkyState } from '@wxcn/core/sky.js';
	import { weatherCloudTextures } from './cloud-texture.js';
	import { weatherScenes } from './weather-scenes.js';
	import { onMount } from 'svelte';
	let {
		mode = 'clear',
		paused = false,
		dithered = false,
		sky = null
	}: {
		mode?: WeatherShaderMode;
		paused?: boolean;
		dithered?: boolean;
		sky?: SkyState | null;
	} = $props();
	let canvas: HTMLCanvasElement;
	let active = $state(true);
	const atmosphere = $derived(weatherScenes[mode]);
	const rain = $derived(atmosphere.rain > 0);
	const snow = $derived(atmosphere.snow > 0);
	// Deterministic depth layers avoid hydration jumps and synchronized snowfall.
	const particles = Array.from({ length: 48 }, (_, i) => {
		const depth = i % 3;
		return {
			left: ((i * 61.803) % 112) - 6,
			phase: (i * 0.61803398875) % 1,
			depth,
			speed: [1.6, 1, 0.6][depth] * (0.85 + ((i * 0.4142) % 1) * 0.3),
			opacity: [0.14, 0.27, 0.38][depth],
			blur: [0.15, 0.3, 1.1][depth],
			size: [0.8, 1.5, 3.2][depth],
			sway: 5 + ((i * 13.71) % 18)
		};
	});
	function particleStyle(p: (typeof particles)[number], frozen: boolean) {
		const duration =
			((frozen ? 6 : mode.includes('drizzle') ? 1.8 : 0.9) * p.speed) / Math.sqrt(atmosphere.wind);
		return `left:${p.left}%;animation-delay:${-p.phase * duration}s;animation-duration:${duration}s;opacity:${p.opacity * (frozen ? 1.4 : 1)};filter:blur(${p.blur}px);--size:${p.size}px;--sway:${p.sway}px;--drift:${-12 * atmosphere.wind}cqh;--angle:${(Math.atan(0.12 * atmosphere.wind) * 180) / Math.PI}deg;--length:${(mode.includes('drizzle') ? 5 : 15) / p.speed}px`;
	}
	onMount(() => {
		const observer = new IntersectionObserver(([entry]) => (active = entry.isIntersecting));
		observer.observe(canvas);
		return () => observer.disconnect();
	});
	let redraw = () => {};
	const modes: WeatherShaderMode[] = [
		'sunrise',
		'sunset',
		'clear',
		'partly-cloudy',
		'haze',
		'fog',
		'wind',
		'cloudy',
		'thunderstorm',
		'rain',
		'heavy-rain',
		'drizzle',
		'snow',
		'heavy-snow',
		'wintry-mix',
		'clear-night',
		'partly-cloudy-night',
		'drizzle-night'
	];
	$effect(() => {
		mode;
		paused;
		dithered;
		sky;
		redraw();
	});
	onMount(() => {
		const gl = canvas.getContext('webgl', {
			alpha: false,
			antialias: false,
			depth: false,
			powerPreference: 'low-power'
		});
		if (!gl) return;
		const shaders: WebGLShader[] = [];
		function compile(type: number, source: string) {
			const shader = gl!.createShader(type);
			if (!shader) return null;
			gl!.shaderSource(shader, source);
			gl!.compileShader(shader);
			if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
				gl!.deleteShader(shader);
				return null;
			}
			shaders.push(shader);
			return shader;
		}
		const vertex = compile(
			gl.VERTEX_SHADER,
			`attribute vec2 position; void main(){ gl_Position=vec4(position,0.,1.); }`
		);
		const fragment = compile(
			gl.FRAGMENT_SHADER,
			`
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float mode;
uniform float dithered;
uniform float pixelRatio;
uniform vec4 sunPosition;
uniform vec4 moonPosition;
uniform vec3 moonLight;
uniform float astronomical;
uniform sampler2D cloudPlate;
uniform vec4 atmosphere; // coverage, mist, wind, opaque plate
uniform float snowCover;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;

 float night=mix(step(14.5,mode),1.-smoothstep(-8.,1.,sunPosition.z),astronomical);
 float storm=step(7.5,mode)*(1.-step(8.5,mode));
 float dusk=mix(1.-step(1.5,mode),smoothstep(-8.,-1.,sunPosition.z)*(1.-smoothstep(2.,12.,sunPosition.z)),astronomical);
 float fog=atmosphere.y;
 float cloudy=atmosphere.w;
 vec2 previewSun=mix(vec2(.8,.76),vec2(mix(.25,.75,step(.5,mode)),.12),1.-step(1.5,mode));
 vec2 sunPoint=mix(previewSun,sunPosition.xy,astronomical);
 vec2 sunDelta=uv-sunPoint;
 sunDelta.x=mod(sunDelta.x+.5,1.)-.5;
 sunDelta.x*=resolution.x/resolution.y;
 float sunDistance=length(sunDelta);
 float sunVisible=mix(1.-night,sunPosition.w,astronomical);
 float height=pow(clamp(uv.y,0.,1.),.65);
 vec3 sky=mix(vec3(.64,.77,.85),vec3(.085,.29,.52),height);
 // Low-angle light stays near the horizon and the solar azimuth.
 float horizon=exp(-max(uv.y-.10,0.)*4.8);
 float solarLobe=exp(-abs(sunDelta.x)*2.8);
 float warmLight=dusk*horizon*(.24+.76*solarLobe);
 vec3 twilight=mix(vec3(.38,.46,.60),vec3(.88,.56,.32),horizon);
 twilight=mix(twilight,vec3(.97,.72,.44),horizon*solarLobe*.45);
 sky=mix(sky,twilight,dusk);
 sky+=vec3(.10,.025,.006)*warmLight;
 sky=mix(sky,mix(vec3(.43,.48,.51),vec3(.23,.30,.35),uv.y),cloudy*.75);
 sky=mix(sky,mix(vec3(.10,.15,.23),vec3(.025,.045,.09),uv.y),night);
 sky+=mix(vec3(1.,.87,.63),vec3(1.,.48,.18),dusk)*exp(-sunDistance*9.)*.19*sunVisible*(1.-cloudy);
 sky+=vec3(1.,.88,.64)*exp(-sunDistance*60.)*.18*sunVisible;
 float solarEdge=max(1./resolution.y,.0008);
 sky=mix(sky,mix(vec3(1.,.99,.93),vec3(1.,.80,.54),dusk),(1.-smoothstep(.008-solarEdge,.008+solarEdge,sunDistance))*sunVisible);
 float stars=pow(hash(vec3(floor(uv*resolution/2.),1.)),180.);
 sky+=stars*.35*night;
 vec2 moonDelta=uv-moonPosition.xy;
 moonDelta.x=mod(moonDelta.x+.5,1.)-.5;
 moonDelta.x*=resolution.x/resolution.y;
 vec2 moonDisc=moonDelta/.022;
 float moonRadius=length(moonDisc);
 if(moonRadius<1. && moonPosition.w>.5){
  vec3 normal=vec3(moonDisc,sqrt(max(0.,1.-dot(moonDisc,moonDisc))));
  float lit=smoothstep(-.015,.015,dot(normal,moonLight));
  float mask=(1.-smoothstep(.94,1.,moonRadius))*lit;
  sky=mix(sky,vec3(.82,.85,.89),mask*mix(.5,1.,night));
 }
 // Photographic cloud structure, slowly drifting without a visible loop seam.
 float aspect=resolution.x/resolution.y;
 vec2 photoUv=(uv-.5)*vec2(min(aspect/1.5,1.),min(1.5/aspect,1.))*.88+.5;
 photoUv+=vec2(sin(time*.012*atmosphere.z)*.035,sin(time*.008*atmosphere.z)*.012);
 vec3 photo=texture2D(cloudPlate,photoUv).rgb;
 float cloudMask=1.-smoothstep(.045,.24,photo.b-photo.r);
 float cloudOpacity=mix(cloudMask*atmosphere.x,1.,cloudy);
 vec3 fairTone=mix(vec3(.38,.45,.51),vec3(.98,.98,.96),smoothstep(.22,.95,photo.r));
 vec3 cloudTone=mix(fairTone,photo,cloudy);
 cloudTone=mix(cloudTone,cloudTone*vec3(.92,.96,1.)+.06,snowCover*.4);
 // Preserve cool cloud shadows; warm only the illuminated structure.
 float highlights=smoothstep(.28,.92,dot(photo,vec3(.2126,.7152,.0722)));
 vec3 coolCloud=cloudTone*vec3(.62,.68,.82);
 vec3 warmCloud=cloudTone*vec3(1.08,.76,.48);
 cloudTone=mix(cloudTone,mix(coolCloud,warmCloud,highlights*(.3+.7*solarLobe)),dusk*.85);
 // A restrained silver/gold edge where the sun backlights thin cloud.
 float rim=cloudMask*(1.-cloudMask)*4.;
 cloudTone+=vec3(1.,.80,.56)*rim*exp(-sunDistance*8.)*sunVisible*(1.-cloudy)*.16;
 cloudTone=mix(cloudTone,cloudTone*vec3(.12,.17,.24),night);
 cloudTone*=mix(1.,.85,storm);
 vec3 color=mix(sky,cloudTone,cloudOpacity);
 color=mix(color,mix(vec3(.69,.73,.74),vec3(.10,.14,.20),night),fog);
 color+=(hash(vec3(gl_FragCoord.xy,0.))-.5)/255.;
 if(dithered>.5){
  // Fine, fixed stochastic dithering preserves cloud shading without a checkerboard.
  vec2 cell=floor(gl_FragCoord.xy/pixelRatio);
  float grain=hash(vec3(cell,7.));
  float luminance=dot(clamp(color,0.,1.),vec3(.2126,.7152,.0722));
  float ink=floor(luminance*7.+grain)/7.;
  color=vec3(.28+ink*.64);
 }

 gl_FragColor=vec4(color,1.);
}`
		);
		if (!vertex || !fragment) {
			shaders.forEach((s) => gl.deleteShader(s));
			return;
		}
		const program = gl.createProgram();
		if (!program) {
			shaders.forEach((s) => gl.deleteShader(s));
			return;
		}
		gl.attachShader(program, vertex);
		gl.attachShader(program, fragment);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			gl.deleteProgram(program);
			shaders.forEach((s) => gl.deleteShader(s));
			return;
		}
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW
		);
		const position = gl.getAttribLocation(program, 'position');
		const size = gl.getUniformLocation(program, 'resolution'),
			clock = gl.getUniformLocation(program, 'time'),
			scene = gl.getUniformLocation(program, 'mode'),
			texture = gl.getUniformLocation(program, 'dithered'),
			pixelRatio = gl.getUniformLocation(program, 'pixelRatio'),
			sunPosition = gl.getUniformLocation(program, 'sunPosition'),
			moonPosition = gl.getUniformLocation(program, 'moonPosition'),
			moonLight = gl.getUniformLocation(program, 'moonLight'),
			astronomical = gl.getUniformLocation(program, 'astronomical');
		const plate = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, plate);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			1,
			1,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			new Uint8Array([35, 95, 150, 255])
		);
		const photograph = new Image();
		let disposed = false;
		let loadedPlate = '';
		function loadPlate() {
			const source = weatherCloudTextures[atmosphere.plate];
			if (source !== loadedPlate) {
				loadedPlate = source;
				photograph.src = source;
			}
		}
		photograph.onload = () => {
			if (disposed || lost) return;
			gl.bindTexture(gl.TEXTURE_2D, plate);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photograph);
			refresh();
		};
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		let visible = true,
			frame = 0,
			last = 0,
			elapsed = 0,
			lost = false;
		function draw(now = performance.now(), force = false) {
			frame = 0;
			if (lost || (!force && (!visible || document.hidden))) {
				last = 0;
				return;
			}
			if (last && !reduced.matches && !paused) elapsed += Math.min(now - last, 100) / 1000;
			last = now;
			const ratio = Math.min(devicePixelRatio || 1, 2);
			const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
			const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
			if (canvas.width !== width) canvas.width = width;
			if (canvas.height !== height) canvas.height = height;
			gl!.viewport(0, 0, canvas.width, canvas.height);
			gl!.useProgram(program);
			gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
			gl!.enableVertexAttribArray(position);
			gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
			gl!.uniform2f(size, canvas.width, canvas.height);
			gl!.uniform1f(clock, elapsed);
			gl!.uniform1f(scene, modes.indexOf(mode));
			gl!.uniform1f(texture, dithered ? 1 : 0);
			gl!.uniform1f(pixelRatio, ratio);
			gl!.activeTexture(gl!.TEXTURE0);
			gl!.bindTexture(gl!.TEXTURE_2D, plate);
			gl!.uniform1i(gl!.getUniformLocation(program, 'cloudPlate'), 0);
			gl!.uniform4f(
				gl!.getUniformLocation(program, 'atmosphere'),
				atmosphere.coverage,
				atmosphere.mist,
				atmosphere.wind,
				atmosphere.plate === 'fair' ? 0 : 1
			);
			gl!.uniform1f(gl!.getUniformLocation(program, 'snowCover'), snow ? 1 : 0);
			gl!.uniform1f(astronomical, sky ? 1 : 0);
			gl!.uniform4f(
				sunPosition,
				sky?.sun.x ?? 0.8,
				sky?.sun.y ?? 0.76,
				sky?.sun.altitude ?? 45,
				sky?.sun.visible ? 1 : 0
			);
			gl!.uniform4f(
				moonPosition,
				sky?.moon.x ?? 0,
				sky?.moon.y ?? 0,
				sky?.moon.altitude ?? -90,
				sky?.moon.visible ? 1 : 0
			);
			gl!.uniform3f(moonLight, ...(sky?.moon.light ?? ([0, 0, -1] as [number, number, number])));
			gl!.drawArrays(gl!.TRIANGLES, 0, 6);
			if (visible && !document.hidden && !reduced.matches && !paused)
				frame = requestAnimationFrame(tick);
		}
		function tick(now: number) {
			if (now - last < 1000 / 24) {
				frame = requestAnimationFrame(tick);
				return;
			}
			draw(now);
		}
		function refresh() {
			loadPlate();
			cancelAnimationFrame(frame);
			last = 0;
			// Prop changes still need a static frame when an offscreen card is paused.
			draw(performance.now(), true);
		}
		redraw = refresh;
		const observer = new IntersectionObserver((entries) => {
			visible = entries[0].isIntersecting;
			refresh();
		});
		observer.observe(canvas);
		const resize = new ResizeObserver(refresh);
		resize.observe(canvas);
		const lose = (event: Event) => {
			event.preventDefault();
			lost = true;
			canvas.style.visibility = 'hidden';
			cancelAnimationFrame(frame);
		};
		canvas.addEventListener('webglcontextlost', lose);
		reduced.addEventListener('change', refresh);
		document.addEventListener('visibilitychange', refresh);
		refresh();
		return () => {
			disposed = true;
			photograph.onload = null;
			gl.deleteTexture(plate);
			redraw = () => {};
			cancelAnimationFrame(frame);
			observer.disconnect();
			resize.disconnect();
			reduced.removeEventListener('change', refresh);
			document.removeEventListener('visibilitychange', refresh);
			canvas.removeEventListener('webglcontextlost', lose);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			shaders.forEach((s) => gl.deleteShader(s));
		};
	});
</script>

<div
	class="sky"
	data-background-style={dithered ? 'dithered' : 'realistic'}
	data-sky-period={sky?.period}
	data-sun-altitude={sky?.sun.altitude}
	data-moon-altitude={sky?.moon.altitude}
	data-moon-phase={sky?.moon.phaseName}
	class:night={sky ? sky.period === 'night' : mode.includes('night')}
	class:still={paused || !active}
	aria-hidden="true"
>
	<canvas bind:this={canvas}></canvas>
	{#if rain}<div class="precipitation rain" data-precipitation="rain">
			{#each particles.slice(0, atmosphere.rain) as p}<i
					data-depth={p.depth}
					style={particleStyle(p, false)}
				></i>{/each}
		</div>{/if}
	{#if snow}<div class="precipitation snow" data-precipitation="snow">
			{#each particles.slice(0, atmosphere.snow) as p}<i
					data-depth={p.depth}
					style={particleStyle(p, true)}
				></i>{/each}
		</div>{/if}
</div>

<style>
	.sky {
		container-type: size;
	}
	.precipitation {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.precipitation i {
		position: absolute;
		top: -20px;
		display: block;
		will-change: transform;
		animation: fall linear infinite;
	}
	.rain i {
		width: max(0.5px, calc(var(--size) * 0.4));
		height: var(--length);
		background: linear-gradient(
			transparent,
			rgba(226, 236, 244, 0.65) 35%,
			rgba(245, 248, 250, 0.9) 75%,
			transparent
		);
		transform: rotate(var(--angle));
	}
	.snow i {
		width: calc(var(--size) * 1.5);
		height: calc(var(--size) * 1.8);
		border-radius: 45% 55% 60% 40%;
		background: radial-gradient(ellipse at 40% 35%, #fff 10%, #d8e3ec 45%, transparent 75%);
		animation-name: snowfall;
	}
	.still i {
		animation-play-state: paused;
	}
	@keyframes fall {
		from {
			transform: translate(0, -20px) rotate(var(--angle));
		}
		to {
			transform: translate(var(--drift), calc(100cqh + 40px)) rotate(var(--angle));
		}
	}
	@keyframes snowfall {
		0% {
			transform: translate(0, -20px);
		}
		50% {
			transform: translate(calc(var(--drift) * 0.5 + var(--sway)), 50cqh) rotate(110deg);
		}
		100% {
			transform: translate(var(--drift), calc(100cqh + 40px)) rotate(240deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.precipitation i {
			animation-play-state: paused;
		}
	}

	.sky {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: linear-gradient(160deg, #608da9, #c3d0d3);
	}
	.sky.night {
		background: linear-gradient(160deg, #101c32, #405269);
	}
	.sky[data-sky-period='sunrise'] {
		background: linear-gradient(180deg, #475575, #bd8290 70%, #dda472);
	}
	.sky[data-sky-period='sunset'] {
		background: linear-gradient(180deg, #424760, #b4716b 70%, #d39866);
	}
	/* Multiply grayscale ink by the base swatch. CSS keeps palette changes live,
       including while the shader is paused for reduced motion. */
	.sky[data-background-style='dithered'] {
		isolation: isolate;
		background: var(--weather-base-color, var(--muted-foreground, #737373));
	}
	.sky[data-background-style='dithered'] canvas {
		mix-blend-mode: multiply;
	}
	.sky[data-background-style='dithered'] .precipitation {
		color: color-mix(
			in srgb,
			var(--weather-base-color, var(--muted-foreground, #737373)) 25%,
			white
		);
	}
	.sky[data-background-style='dithered'] .rain i {
		background: linear-gradient(transparent, currentColor 65%, transparent);
	}
	.sky[data-background-style='dithered'] .snow i {
		background: radial-gradient(ellipse, currentColor 25%, transparent 75%);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
