import http from 'node:http';
import puppeteer from 'puppeteer-core';
const OUT=new URL('./v7', import.meta.url).pathname;
const EXT='/tmp/swtest/ext';
const html = `<html><head><title>示例文章：如何设计 AI 原生界面</title></head><body><article><h1>如何设计 AI 原生界面</h1><p>${'这是一段示例正文，用来测试 Acer 的总结功能。'.repeat(40)}</p><input id="inp" placeholder="page input"></article></body></html>`;
const srv = http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html; charset=utf-8'});r.end(html)}); await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const br = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:true, pipe:true, enableExtensions:true, args:['--no-sandbox'], defaultViewport:{width:1280,height:800} });
await br.installExtension(EXT);
const sw = await (await br.waitForTarget(t=>t.type()==='service_worker')).worker();
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
console.log(tag, 'commands:', JSON.stringify(await sw.evaluate(()=>chrome.commands.getAll())));
await sw.evaluate(async()=>{ await chrome.storage.local.clear(); await chrome.storage.local.set({settings:{baseUrl:'https://api.openai.com/v1',apiKey:'',model:'m',mock:true}}); });
const page = await br.newPage(); await page.goto(`http://127.0.0.1:${srv.address().port}/`); await sleep(600);
const S='document.querySelector("acer-overlay")?.shadowRoot';
const state = () => page.evaluate(new Function(`const p=${S}?.querySelector('.fixed'); if(!p) return 'hidden'; const r=p.getBoundingClientRect(); return 'shown x='+Math.round(r.left)+' op='+(+getComputedStyle(p).opacity).toFixed(2)`));
const viaCommand = () => sw.evaluate(async()=>{ const [t]=await chrome.tabs.query({active:true}); await chrome.tabs.sendMessage(t.id,{type:'toggle'}); });
const viaKey = async () => { await page.keyboard.down('Control'); await page.keyboard.press('KeyE'); await page.keyboard.up('Control'); };
const press = tag==='fallback' ? viaKey : viaCommand;
const results=[];
for (let i=1;i<=4;i++){ await press(); await sleep(700); results.push(`#${i}: ${await state()}`); }
console.log(tag, 'toggle x4:', results.join(' | '));
if (tag==='fallback') { // Ctrl+E default prevented on the page
  const prevented = await page.evaluate(()=>{ const e=new KeyboardEvent('keydown',{key:'e',ctrlKey:true,bubbles:true,cancelable:true}); window.dispatchEvent(e); return e.defaultPrevented; });
  await sleep(700); console.log('synthetic ctrl+e defaultPrevented:', prevented, await state()); }
if (tag==='command') {
  // mid-animation frames: open
  await press(); const t0=Date.now(); const frames=[];
  for (let i=0;i<5;i++){ const s=await state(); const ms=Date.now()-t0; await page.screenshot({path:`${OUT}/open-${i}-${ms}ms.jpg`, type:'jpeg', quality:70}); frames.push(`${ms}ms ${s}`); }
  console.log('open frames:', frames.join(' | ')); await sleep(800); console.log('settled:', await state());
  await press(); const t1=Date.now(); const f2=[];
  for (let i=0;i<5;i++){ const s=await state(); const ms=Date.now()-t1; await page.screenshot({path:`${OUT}/close-${i}-${ms}ms.jpg`, type:'jpeg', quality:70}); f2.push(`${ms}ms ${s}`); }
  console.log('close frames:', f2.join(' | ')); await sleep(800); console.log('after close:', await state());
  // minimized survives toggle
  await press(); await sleep(2200); await page.evaluate(new Function(`${S}.querySelector('[aria-label="最小化"]').click()`)); await sleep(300);
  const h1 = await page.evaluate(new Function(`return Math.round(${S}.querySelector('.fixed').getBoundingClientRect().height)`));
  await press(); await sleep(700); await press(); await sleep(700);
  const h2 = await page.evaluate(new Function(`return Math.round(${S}.querySelector('.fixed').getBoundingClientRect().height)`));
  console.log('minimized h before/after hide+show:', h1, h2);
  await page.screenshot({path:`${OUT}/minimized-after-toggle.png`});
  const op = await br.newPage(); await op.setViewport({width:900,height:760}); const id=new URL((await br.waitForTarget(t=>t.type()==='service_worker')).url()).host;
  await op.goto(`chrome-extension://${id}/options.html`); await sleep(500); await op.screenshot({path:`${OUT}/options-shortcut.png`});
  console.log('options text:', await op.evaluate(()=>[...document.querySelectorAll('p')].map(p=>p.innerText).filter(t=>t.includes('快捷键')||t.includes('默认')).join(' / ')));
}
await br.close(); srv.close();
