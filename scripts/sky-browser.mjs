import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const base = process.env.WXCN_SITE_URL ?? 'http://127.0.0.1:8799';
const page = await browser.newPage({ reducedMotion: 'reduce' });
await page.route('**/api/**', route => route.fulfill({status:503,json:{message:'Fixture'}}));
try {
 for (const framework of ['react', 'vue']) {
  await page.goto(`${base}/${framework}?item=weather`);
  await page.waitForLoadState('networkidle');
  console.log(framework);
  for (const [label, period] of [['Solar noon','midday'],['Solar midnight','night']]) {
   await page.getByRole('button',{name:'Sky time',exact:true}).click();
   await page.getByRole('menuitemradio',{name:label,exact:true}).click();
   const sky = page.locator(`[data-${framework}-forecast="weather"] [data-background-style="realistic"]`).first();
   await expect(sky).toHaveAttribute('data-sky-period',period);
   await sky.scrollIntoViewIfNeeded();
   await expect.poll(() => sky.locator('canvas').evaluate(canvas => !!canvas.getContext('webgl')?.getParameter(canvas.getContext('webgl').CURRENT_PROGRAM))).toBe(true);
   const altitude=Number(await sky.getAttribute('data-sun-altitude'));
   assert.ok(period==='midday'?altitude>0:altitude<0);
   const rendered=await sky.locator('canvas').evaluate(canvas=>{
    const gl=canvas.getContext('webgl');
    if(!gl) return {context:false};
    const pixels=new Uint8Array(4);gl.readPixels(canvas.width>>1,canvas.height>>1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    return {context:true,error:gl.getError(),linked:!!gl.getParameter(gl.CURRENT_PROGRAM) && gl.getProgramParameter(gl.getParameter(gl.CURRENT_PROGRAM), gl.LINK_STATUS),width:canvas.width,height:canvas.height};
   });
   assert.ok(rendered.context && rendered.width>0 && rendered.height>0);
   assert.equal(rendered.error,0);
   assert.equal(rendered.linked,true, framework + " " + period);
  }
 }
 console.log('Both native astronomical shaders update noon/night and render without WebGL errors.');
} finally {await browser.close();}
