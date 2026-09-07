// Font-face CSS is included once; browsers fetch only the fonts actually selected.
// Static imports avoid dangling CSS-only dynamic chunks in the Worker build.
import '@fontsource-variable/geist';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-sans';
import '@fontsource-variable/nunito-sans';
import '@fontsource-variable/figtree';
import '@fontsource-variable/roboto';
import '@fontsource-variable/raleway';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/public-sans';
import '@fontsource-variable/outfit';
import '@fontsource-variable/oxanium';
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource-variable/source-sans-3';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/noto-serif';
import '@fontsource-variable/roboto-slab';
import '@fontsource-variable/merriweather';
import '@fontsource-variable/lora';
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/eb-garamond';
import '@fontsource/instrument-serif';

export const fontLoaders = {
	'@fontsource-variable/geist': () => Promise.resolve(),
	'@fontsource-variable/inter': () => Promise.resolve(),
	'@fontsource-variable/noto-sans': () => Promise.resolve(),
	'@fontsource-variable/nunito-sans': () => Promise.resolve(),
	'@fontsource-variable/figtree': () => Promise.resolve(),
	'@fontsource-variable/roboto': () => Promise.resolve(),
	'@fontsource-variable/raleway': () => Promise.resolve(),
	'@fontsource-variable/dm-sans': () => Promise.resolve(),
	'@fontsource-variable/public-sans': () => Promise.resolve(),
	'@fontsource-variable/outfit': () => Promise.resolve(),
	'@fontsource-variable/oxanium': () => Promise.resolve(),
	'@fontsource-variable/manrope': () => Promise.resolve(),
	'@fontsource-variable/space-grotesk': () => Promise.resolve(),
	'@fontsource-variable/montserrat': () => Promise.resolve(),
	'@fontsource-variable/ibm-plex-sans': () => Promise.resolve(),
	'@fontsource-variable/source-sans-3': () => Promise.resolve(),
	'@fontsource-variable/instrument-sans': () => Promise.resolve(),
	'@fontsource-variable/jetbrains-mono': () => Promise.resolve(),
	'@fontsource-variable/geist-mono': () => Promise.resolve(),
	'@fontsource-variable/noto-serif': () => Promise.resolve(),
	'@fontsource-variable/roboto-slab': () => Promise.resolve(),
	'@fontsource-variable/merriweather': () => Promise.resolve(),
	'@fontsource-variable/lora': () => Promise.resolve(),
	'@fontsource-variable/playfair-display': () => Promise.resolve(),
	'@fontsource-variable/eb-garamond': () => Promise.resolve(),
	'@fontsource/instrument-serif': () => Promise.resolve()
};
