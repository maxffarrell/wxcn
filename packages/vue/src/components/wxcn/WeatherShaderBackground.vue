<script lang="ts">
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
<script setup lang="ts">
import type { SkyState } from '@wxcn/core/sky.js';
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
const canvasRef = ref<HTMLCanvasElement>();
function onMount(setup: () => void | (() => void)) {
	let cleanup: void | (() => void);
	onMounted(() => {
		canvas = canvasRef.value!;
		cleanup = setup();
	});
	onBeforeUnmount(() => {
		cleanup?.();
	});
}
const {
	mode = 'clear',
	paused = false,
	dithered = false,
	sky = null
} = defineProps<{
	mode?: WeatherShaderMode;
	paused?: boolean;
	dithered?: boolean;
	sky?: SkyState | null;
}>();
let canvas: HTMLCanvasElement;
const active = ref(true);
const rain = computed(() => /rain|drizzle|thunderstorm|wintry/.test(mode));
const snow = computed(() => /snow|wintry/.test(mode));
const particles = Array.from({ length: 36 }, (_, i) => ({
	left: (i * 61.803) % 100,
	delay: -(i * 0.173) % 3,
	duration: 0.65 + (i % 7) * 0.09
}));
onMount(() => {
	const observer = new IntersectionObserver(([entry]) => (active.value = entry.isIntersecting));
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
watch(
	() => [mode, paused, dithered, sky],
	() => redraw()
);

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
// A fixed Bayer lattice avoids temporal noise while the sky moves underneath.
float bayer2(vec2 p){p=mod(floor(p),2.);return mod(2.*p.x+3.*p.y,4.);}
float bayer4(vec2 p){return (4.*bayer2(p)+bayer2(floor(p/2.))+.5)/16.;}
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec3(12.1,3.7,8.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;
 vec2 p=(gl_FragCoord.xy-.5*resolution)/resolution.y;
 float night=mix(step(14.5,mode),1.-smoothstep(-8.,1.,sunPosition.z),astronomical);
 float storm=step(7.5,mode)*(1.-step(8.5,mode));
 float wet=step(7.5,mode)*(1.-step(11.5,mode))+step(16.5,mode);
 wet*=mix(.65,1.0,1.-step(.1,abs(mode-10.)));
 wet*=mix(1.,.4,step(10.5,mode));
 float snow=step(11.5,mode)*(1.-step(14.5,mode));
 snow*=mix(.5,1.,1.-step(.1,abs(mode-13.)));
 wet+=.3*(1.-step(.1,abs(mode-14.)));
 float dusk=mix(1.-step(1.5,mode),smoothstep(-8.,-1.,sunPosition.z)*(1.-smoothstep(2.,12.,sunPosition.z)),astronomical);
 float fog=step(4.5,mode)*(1.-step(5.5,mode));
 float cloudy=step(6.5,mode)*(1.-step(14.5,mode));
 float cover=mix(.56,.32,cloudy);
 cover=mix(cover,.63,1.-step(.1,abs(mode-2.)));
 cover=mix(cover,.36,fog);
 cover=mix(cover,.68,1.-step(.1,abs(mode-15.)));
 vec2 sunPoint=mix(vec2(.8,.76),sunPosition.xy,astronomical);
 vec3 sunDir=normalize(vec3((sunPoint.x-.5)*resolution.x/resolution.y,(sunPoint.y-.5)*.6+.46,-1.));
 vec3 ray=normalize(vec3(p.x, p.y*.6+.46, -1.));
 vec2 sunDelta=uv-sunPoint;
 sunDelta.x=mod(sunDelta.x+.5,1.)-.5;
 sunDelta.x*=resolution.x/resolution.y;
 float sunDistance=length(sunDelta);
 float sunVisible=mix(1.-night,sunPosition.w,astronomical);
 vec3 sky=mix(vec3(.69,.79,.83),vec3(.20,.43,.64),smoothstep(0.,1.,uv.y));
 sky=mix(sky,mix(vec3(.91,.63,.44),vec3(.33,.42,.57),uv.y),dusk);
 sky=mix(sky,mix(vec3(.43,.48,.51),vec3(.23,.30,.35),uv.y),cloudy*.75);
 sky=mix(sky,mix(vec3(.10,.15,.23),vec3(.025,.045,.09),uv.y),night);
 sky+=mix(vec3(1.,.87,.63),vec3(1.,.48,.18),dusk)*exp(-sunDistance*12.)*.24*sunVisible*(1.-cloudy);
 sky=mix(sky,mix(vec3(1.,.97,.82),vec3(1.,.67,.34),dusk),(1.-smoothstep(.013,.016,sunDistance))*sunVisible);
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
 // Integrate a moving 3D cloud layer, lit from the upper right.
 vec4 cloud=vec4(0.);
 for(int i=0;i<14;i++){
  float depth=1.2+float(i)*.16;
  vec3 q=ray*depth*3.0+vec3(time*.012,0.,time*.005);
  float shape=fbm(q*1.05);
  float density=max(0.,shape-cover)*3.4;
  float clearSky=(1.-step(.1,abs(mode-2.)))+(1.-step(.1,abs(mode-15.)));
  density*=mix(1.,.10,clearSky);
  density*=smoothstep(.05,.25,ray.y);
  float light=clamp((shape-fbm(q*1.05+sunDir*.35))*2.5+.65,.2,1.);
  vec3 tone=mix(vec3(.48,.54,.59),vec3(.97,.96,.91),light);
  tone=mix(tone,vec3(.19,.25,.33)*(.6+light*.5),night);
  tone=mix(tone,tone*vec3(1.,.78,.65),dusk*.45);
  tone=mix(tone,tone*.55,storm);
  float a=clamp(density*.28,0.,1.);
  cloud.rgb+=(1.-cloud.a)*tone*a;
  cloud.a+=(1.-cloud.a)*a;
 }
 vec3 color=sky*(1.-cloud.a)+cloud.rgb;
 color=mix(color,mix(vec3(.69,.73,.74),vec3(.10,.14,.20),night),fog*.55);
 color+=(hash(vec3(gl_FragCoord.xy,0.))-.5)/255.;
 if(dithered>.5){
  vec2 cell=floor(gl_FragCoord.xy/(2.*pixelRatio));
  // Quantize luminance, not individual RGB channels, into two ink tones.
  float luminance=dot(clamp(color,0.,1.),vec3(.2126,.7152,.0722));
  color=vec3(mix(.18,1.,step(bayer4(cell),luminance)));
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
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	let visible = true,
		frame = 0,
		last = 0,
		elapsed = 0,
		lost = false;
	function draw(now = performance.now()) {
		frame = 0;
		if (lost || !visible || document.hidden) {
			last = 0;
			return;
		}
		if (last && !reduced.matches && !paused) elapsed += Math.min(now - last, 100) / 1000;
		last = now;
		const ratio = Math.min(devicePixelRatio || 1, 1.25);
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
		if (!reduced.matches && !paused) frame = requestAnimationFrame(tick);
	}
	function tick(now: number) {
		if (now - last < 1000 / 24) {
			frame = requestAnimationFrame(tick);
			return;
		}
		draw(now);
	}
	function refresh() {
		cancelAnimationFrame(frame);
		last = 0;
		draw();
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
<template>
	<div
		class="sky"
		:class="{
			night: sky ? sky.period === 'night' : mode.includes('night'),
			still: paused || !active
		}"
		:data-background-style="dithered ? 'dithered' : 'realistic'"
		:data-sky-period="sky?.period"
		:data-sun-altitude="sky?.sun.altitude"
		:data-moon-altitude="sky?.moon.altitude"
		:data-moon-phase="sky?.moon.phaseName"
		aria-hidden="true"
	>
		<canvas ref="canvasRef" />
		<div v-if="rain" class="precipitation rain" data-precipitation="rain">
			<i
				v-for="(p, i) in particles"
				:key="i"
				:style="`left:${p.left}%;animation-delay:${p.delay}s;animation-duration:${p.duration}s;opacity:${0.25 + (i % 4) * 0.12};height:${9 + (i % 12)}px`"
			/>
		</div>
		<div v-if="snow" class="precipitation snow" data-precipitation="snow">
			<i
				v-for="(p, i) in particles.slice(0, 24)"
				:key="i"
				:style="`left:${p.left}%;animation-delay:${p.delay * 3}s;animation-duration:${4 + p.duration * 2}s;width:${2 + (i % 3)}px;height:${2 + (i % 3)}px;opacity:${0.45 + (i % 4) * 0.12}`"
			/>
		</div>
	</div>
</template>
<style scoped>
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
	width: 1px;
	background: linear-gradient(transparent, rgba(230, 240, 255, 0.9));
	transform: rotate(12deg);
}
.snow i {
	border-radius: 50%;
	background: #f7fbff;
	filter: blur(0.3px);
	animation-name: snowfall;
}
.still i {
	animation-play-state: paused;
}
@keyframes fall {
	from {
		transform: translate(0, -20px) rotate(12deg);
	}
	to {
		transform: translate(-45px, calc(100cqh + 40px)) rotate(12deg);
	}
}
@keyframes snowfall {
	0% {
		transform: translate(0, -20px);
	}
	50% {
		transform: translate(15px, 50cqh);
	}
	100% {
		transform: translate(-8px, calc(100cqh + 40px));
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
	color: color-mix(in srgb, var(--weather-base-color, var(--muted-foreground, #737373)) 25%, white);
}
.sky[data-background-style='dithered'] .rain i {
	background: linear-gradient(transparent, currentColor);
}
.sky[data-background-style='dithered'] .snow i {
	background: currentColor;
}
canvas {
	display: block;
	width: 100%;
	height: 100%;
}
</style>
