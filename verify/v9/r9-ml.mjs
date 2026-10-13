import http from 'node:http';
import puppeteer from 'puppeteer-core';
const OUT='/workspace/open-mind-extension/verify/v9/composer';
const html = `<html><head><title>示例文章：如何设计 AI 原生界面</title></head><body><article><h1>如何设计 AI 原生界面</h1><p id="p">${'这是一段示例正文，用来测试 Open Mind 的总结功能。'.repeat(40)}</p></article></body></html>`;
const srv = http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html; charset=utf-8'});r.end(html)}); await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const br = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:true, pipe:true, enableExtensions:true, args:['--no-sandbox'], defaultViewport:{width:1280,height:800} });
await br.installExtension('/tmp/swtest/ext');
const swt = await br.waitForTarget(t=>t.type()==='service_worker'); const sw = await swt.worker(); const id=new URL(swt.url()).host;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const pageUrl=`http://127.0.0.1:${srv.address().port}/`;
const page = await br.newPage(); await page.goto(pageUrl); await sleep(500);
await sw.evaluate(async()=>{ await chrome.storage.local.clear(); await chrome.storage.local.set({settings:{baseUrl:'https://api.openai.com/v1',apiKey:'',model:'m',mock:true}}); });
const toggle=()=>sw.evaluate(async()=>{ const [t]=await chrome.tabs.query({active:true}); await chrome.tabs.sendMessage(t.id,{type:'toggle'}); });
await toggle(); await sleep(2000);
const S='document.querySelector("open-mind-overlay").shadowRoot'; const ev=(c)=>page.evaluate(new Function(c));
const txt=(sel)=>ev(`return ${S}.querySelector('${sel}')?.innerText.replace(/\\s+/g,' ') ?? null`);
const typeIn=async(t)=>{ await ev(`${S}.querySelector('textarea').focus()`); await page.keyboard.type(t); };
await ev(`[...${S}.querySelectorAll('button')].find(b=>b.innerText.trim()==='对话').click()`); await sleep(400);
await ev(`[...${S}.querySelectorAll('button')].find(b=>b.innerText.trim()==='对话').click()`); await sleep(400);
const h=()=>ev(`const t=${S}.querySelector('textarea'); return t.offsetHeight+'/'+getComputedStyle(t).overflowY`);
await typeIn('a'); console.log('1 line', await h());
for(let i=0;i<3;i++){ await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift'); await page.keyboard.type('x'); }
console.log('4 lines', await h());
for(let i=0;i<5;i++){ await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift'); await page.keyboard.type('y'); }
console.log('9 lines', await h());
await page.screenshot({path:`${OUT}/multiline.png`});
await page.keyboard.press('Enter'); await sleep(300);
console.log('after enter value:', JSON.stringify(await ev(`return ${S}.querySelector('textarea').value`)), 'h', await h());
await sleep(3000); console.log('reply:', (await ev(`return ${S}.querySelector(".fixed").innerText`)).slice(-80).replace(/\s+/g,' '));
// cache: reload & reopen — should be instant (no skeleton)
await page.reload(); await sleep(400); await toggle(); await sleep(300);
console.log('cached overview present:', await ev(`return ${S}.querySelector(".fixed").innerText.includes('模拟总结')`));
// resize persistence
const w=await sw.evaluate(async()=>{await chrome.storage.local.set({panelWidth:9999}); return 1;});
await page.reload(); await sleep(400); await toggle(); await sleep(800);
console.log('clamped width:', await ev(`return Math.round(${S}.querySelector('.fixed').getBoundingClientRect().width)`));
await br.close(); srv.close();
