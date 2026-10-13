import http from 'node:http';
import puppeteer from 'puppeteer-core';
const OUT=new URL('./v6', import.meta.url).pathname;
const html = `<html><head><title>示例文章：如何设计 AI 原生界面</title></head><body><article><h1>如何设计 AI 原生界面</h1><p>${'这是一段示例正文，用来测试 Acer 的总结功能。'.repeat(40)}</p></article></body></html>`;
const srv = http.createServer((req,res)=>{ if(req.url==='/v1/models'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({data:['gpt-4o','gpt-4o-mini','o3-mini'].map(id=>({id}))}));} res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html)}); await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${srv.address().port}`;
const br = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:true, pipe:true, enableExtensions:true, args:['--no-sandbox'], defaultViewport:{width:1280,height:800} });
await br.installExtension('/tmp/swtest/ext');
const swt = await br.waitForTarget(t=>t.type()==='service_worker'); const sw = await swt.worker(); const id=new URL(swt.url()).host;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const page = await br.newPage(); await page.goto(base+'/'); await sleep(400);
await sw.evaluate(async()=>{ await chrome.storage.local.clear(); await chrome.storage.local.set({settings:{baseUrl:'https://api.openai.com/v1',apiKey:'',model:'m',mock:true}}); const [t]=await chrome.tabs.query({active:true}); await chrome.tabs.sendMessage(t.id,{type:'toggle'}); });
await sleep(2000);
const S='document.querySelector("acer-overlay").shadowRoot';
const focusInfo = () => page.evaluate(new Function(`const a=${S}.activeElement; if(!a) return 'none'; const c=getComputedStyle(a); const p=a.tagName==='TEXTAREA'?getComputedStyle(a.parentElement):null; return (a.getAttribute('aria-label')||a.innerText||a.tagName).slice(0,12)+' outline='+c.outlineStyle+'/'+c.outlineWidth+' shadow='+(c.boxShadow==='none'?'none':'set')+' tap='+c.webkitTapHighlightColor+(p?' wrapperBorder='+p.borderColor:'')`));
const issues=[];
const check = (s) => { if (!/outline=none\/0px|outline=none/.test(s)) issues.push(s); };
// click each overlay control
for (const sel of ['[aria-label="重新总结"]','[aria-label="最小化"]']) { await page.evaluate(new Function(`${S}.querySelector('${sel}').focus()`)); const s=await focusInfo(); console.log('focus', s); check(s); }
await page.evaluate(new Function(`[...${S}.querySelectorAll('button')].find(b=>b.innerText.includes('对话')).click()`)); await sleep(300);
// tab through overlay
await page.evaluate(new Function(`[...${S}.querySelectorAll('button')].find(b=>b.innerText.includes('概览')).focus()`));
for (let i=0;i<6;i++){ const s=await focusInfo(); console.log('tab', i, s); check(s); if(i===2) await page.screenshot({path:`${OUT}/overlay-tab-focus-button.png`}); await page.keyboard.press('Tab'); await sleep(80); }
await page.evaluate(new Function(`${S}.querySelector('textarea').focus()`)); await page.keyboard.type('键盘聚焦到输入框'); await sleep(300);
const s2=await focusInfo(); console.log('composer', s2); check(s2);
await page.screenshot({path:`${OUT}/overlay-composer-focus.png`});
// click resize handle
const h = await page.evaluate(new Function(`const r=${S}.querySelector('[data-resize-handle]').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+200}`)); await page.mouse.click(h.x,h.y);
console.log('handle', await page.evaluate(new Function(`const c=getComputedStyle(${S}.querySelector('[data-resize-handle]')); return c.outlineStyle`)));
// click a tab with mouse
await page.evaluate(new Function(`const b=[...${S}.querySelectorAll('button')].find(b=>b.innerText.includes('概览')); const r=b.getBoundingClientRect(); window.__p={x:r.left+r.width/2,y:r.top+r.height/2}`)); const pt=await page.evaluate(()=>window.__p); await page.mouse.click(pt.x,pt.y); await sleep(300);
const s3=await focusInfo(); console.log('clicked tab', s3); check(s3); await page.screenshot({path:`${OUT}/overlay-clicked-tab.png`});
// options page
const op = await br.newPage(); await op.setViewport({width:900,height:760}); await op.goto(`chrome-extension://${id}/options.html`); await sleep(400);
const oinfo = () => op.evaluate(()=>{ const a=document.activeElement; const c=getComputedStyle(a); return (a.getAttribute('aria-label')||a.placeholder||a.innerText||a.type||a.tagName).slice(0,16)+' outline='+c.outlineStyle+' shadow='+(c.boxShadow==='none'?'none':'glow') + ' border='+c.borderColor; });
await op.focus('body'); await op.keyboard.press('Tab');
for (let i=0;i<9;i++){ const s=await oinfo(); console.log('opt tab', i, s); check(s); if(i===1) await op.screenshot({path:`${OUT}/options-input-focus.png`}); if(i===5) await op.screenshot({path:`${OUT}/options-tab-focus-button.png`}); await op.keyboard.press('Tab'); await sleep(80); }
console.log(issues.length? 'ISSUES:\n'+issues.join('\n') : 'no outlines found');
await br.close(); srv.close();
