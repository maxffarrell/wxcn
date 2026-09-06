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
	import { onMount } from 'svelte';
	let { mode = 'clear', paused = false }: { mode?: WeatherShaderMode; paused?: boolean } = $props();
	let canvas: HTMLCanvasElement;
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
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec3(12.1,3.7,8.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;
 vec2 p=(gl_FragCoord.xy-.5*resolution)/resolution.y;
 float night=step(14.5,mode);
 float storm=step(7.5,mode)*(1.-step(8.5,mode));
 float wet=step(7.5,mode)*(1.-step(11.5,mode))+step(16.5,mode);
 wet*=mix(.65,1.0,1.-step(.1,abs(mode-10.)));
 wet*=mix(1.,.4,step(10.5,mode));
 float snow=step(11.5,mode)*(1.-step(14.5,mode));
 snow*=mix(.5,1.,1.-step(.1,abs(mode-13.)));
 wet+=.3*(1.-step(.1,abs(mode-14.)));
 float dusk=1.-step(1.5,mode);
 float fog=step(4.5,mode)*(1.-step(5.5,mode));
 float cloudy=step(6.5,mode)*(1.-step(14.5,mode));
 float cover=mix(.56,.32,cloudy);
 cover=mix(cover,.63,1.-step(.1,abs(mode-2.)));
 cover=mix(cover,.36,fog);
 cover=mix(cover,.68,1.-step(.1,abs(mode-15.)));
 vec3 sunDir=normalize(vec3(.8,mix(.42,.18,dusk),-1.));
 vec3 ray=normalize(vec3(p.x, p.y*.6+.46, -1.));
 float sun=clamp(dot(ray,sunDir),0.,1.);
 vec3 sky=mix(vec3(.69,.79,.83),vec3(.20,.43,.64),smoothstep(0.,1.,uv.y));
 sky=mix(sky,mix(vec3(.91,.63,.44),vec3(.33,.42,.57),uv.y),dusk);
 sky=mix(sky,mix(vec3(.43,.48,.51),vec3(.23,.30,.35),uv.y),cloudy*.75);
 sky=mix(sky,mix(vec3(.10,.15,.23),vec3(.025,.045,.09),uv.y),night);
 sky+=vec3(1.,.87,.63)*pow(sun,24.)*.12*(1.-night)*(1.-cloudy);
 sky+=vec3(1.,.94,.8)*pow(sun,700.)*.8*(1.-night)*(1.-cloudy);
 // Integrate a moving 3D cloud layer, lit from the upper right.
 vec4 cloud=vec4(0.);
 for(int i=0;i<14;i++){
  float depth=1.2+float(i)*.16;
  vec3 q=ray*depth*3.0+vec3(time*.012,0.,time*.005);
  float shape=fbm(q*1.05);
  float density=max(0.,shape-cover)*3.4;
  density*=smoothstep(.05,.25,ray.y);
  float light=clamp((shape-fbm(q*1.05+sunDir*.35))*2.5+.65,.2,1.);
  vec3 tone=mix(vec3(.48,.54,.59),vec3(.97,.96,.91),light);
  tone=mix(tone,vec3(.19,.25,.33)*(.6+light*.5),night);
  tone=mix(tone,tone*.55,storm);
  float a=clamp(density*.28,0.,1.);
  cloud.rgb+=(1.-cloud.a)*tone*a;
  cloud.a+=(1.-cloud.a)*a;
 }
 vec3 color=sky*(1.-cloud.a)+cloud.rgb;
 // Fine precipitation at three depths, without flashing or glass overlays.
 for(int j=0;j<3;j++){
  float layer=float(j)+1.;
  vec2 rain=p*vec2(72.,8.)*layer;
  rain.x+=rain.y*.16; rain.y+=time*(5.+layer);
  vec2 cell=floor(rain);vec2 f=fract(rain);
  float drop=step(.82,hash(vec3(cell.x,0.,layer)))*(1.-smoothstep(.0,.055,abs(f.x-.5)))*smoothstep(.1,.85,f.y);
  color+=vec3(.6,.69,.76)*drop*wet*.12;
  vec2 flakes=p*(18.+layer*10.)+vec2(sin(time*.15+layer),time*(.16+layer*.1));
  vec2 fid=floor(flakes);vec2 ff=fract(flakes)-.5;
  float flake=(1.-smoothstep(.025,.085,length(ff)))*step(.72,hash(vec3(fid,layer)));
  color+=vec3(.85,.88,.9)*flake*snow*.3;
 }
 float stars=pow(hash(vec3(floor(uv*resolution/2.),1.)),180.);
 color+=stars*.35*night*(1.-cloud.a);
 vec2 moon=(uv-vec2(.8,.76))*vec2(resolution.x/resolution.y,1.);
 color+=vec3(.78,.83,.91)*(1.-smoothstep(.025,.03,length(moon)))*night*(1.-cloud.a);
 color=mix(color,vec3(.69,.73,.74),fog*.55);
 color+=(hash(vec3(gl_FragCoord.xy,0.))-.5)/255.;
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
			scene = gl.getUniformLocation(program, 'mode');
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

<div class="sky" class:night={mode.includes('night')} aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.sky {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: linear-gradient(160deg, #608da9, #c3d0d3);
	}
	.sky.night {
		background: linear-gradient(160deg, #101c32, #405269);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
