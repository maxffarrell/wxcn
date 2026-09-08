# Weather cloud texture

`weather-clouds.webp` is an AI-generated photographic sky plate, created with the built-in imagegen tool in generation mode. It is decorative imagery, not a photograph of the forecast location. The renderer adds the calculated Sun and Moon separately, adjusts lighting and cloud coverage, and slowly drifts the texture.

Generation prompt:

> Create a production photographic cloud texture plate for a weather-card renderer, wide landscape 3:2 composition, highest available resolution. This is a photorealistic sky photograph taken with a professional full frame camera, NOT an illustration, NOT a 3D rendering. Pure open natural midday blue sky with beautiful large soft white cumulus clouds, billowing sculptural cloud forms, realistic fine turbulent feathered edges, subtle pale grey volumetric shadows on the underside. Cloud coverage roughly 55 percent: big separated cumulus masses predominantly in lower half and along left and right edges, generous deep blue negative space upper middle, thin wisps high above. Cloud shapes must be visibly natural and richly detailed, never grainy noise or uniform blobs. The blue sky is smooth and clear, cooler at top, paler at bottom. Soft neutral diffuse illumination, no prominent directional bright spot. Entire image is sky only, NO sun, NO moon, NO stars, NO horizon line, NO land, NO buildings, NO birds, NO lens flare, NO text, NO framing. Edges should transition naturally for use as a slow drifting cloud background.

The 1536 × 1024 output was encoded using `cwebp -q 84`. `node tooling/registry/build.mjs` regenerates the inline TypeScript texture and registry payloads from this WebP. The embedded texture keeps installed components self-contained without external image requests.
