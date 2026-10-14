import http from 'node:http';
import puppeteer from 'puppeteer-core';
const OUT=new URL('./v3', import.meta.url).pathname;
const html = `<html><head><title>示例文章：如何设计 AI 原生界面</title></head><body><article><h1>如何设计 AI 原生界面</h1><p>${'这是一段示例正文，用来测试 Representer 的总结功能。'.repeat(40)}</p></article></body></html>`;
const srv = http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/html; charset=utf-8'});r.end(html)}); await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const br = await puppeteer.launch({ executablePath:'/usr/bin/google-chrome', headless:true, pipe:true, enableExtensions:true, args:['--no-sandbox'], defaultViewport:{width:1280,height:800} });
await br.installExtension('/tmp/swtest/ext');
const swt = await br.waitForTarget(t=>t.type()==='service_worker'); const sw = await swt.worker(); const id = new URL(swt.url()).host;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const page = await br.newPage(); await page.goto(`http://127.0.0.1:${srv.address().port}/`); await sleep(400);
await sw.evaluate(async()=>{ await chrome.storage.local.clear(); await chrome.storage.local.set({settings:{baseUrl:'https://api.openai.com/v1',apiKey:'',model:'gpt-4o-mini',mock:false}}); const [t]=await chrome.tabs.query({active:true}); await chrome.tabs.sendMessage(t.id,{type:'toggle'}); });
await sleep(2000);
const S='document.querySelector("representer-overlay").shadowRoot'; const ev=(c)=>page.evaluate(new Function(c));
console.log('order:', await ev(`const p=${S}.querySelector('.fixed'); const seg=[...p.querySelectorAll('button')].find(b=>b.innerText.includes('对话')).getBoundingClientRect().top; const sub=p.querySelector('button[title^="忽略缓存"]').getBoundingClientRect().top; return {subHeaderTop:Math.round(sub), segTop:Math.round(seg), panelTop:Math.round(p.getBoundingClientRect().top)}`));
await page.screenshot({path:`${OUT}/overview.png`});
await ev(`[...${S}.querySelectorAll('button')].find(b=>b.innerText.includes('对话')).click()`); await sleep(400);
await ev(`${S}.querySelector('textarea').focus()`);
const ta = () => ev(`const t=${S}.querySelector('textarea'); return {h:t.getBoundingClientRect().height, oy:t.style.overflowY, sh:t.scrollHeight, val:t.value.split('\\n').length}`);
console.log('1 line', JSON.stringify(await ta()));
await page.keyboard.type('先问一个问题'); for (const l of ['第二行','第三行']) { await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift'); await page.keyboard.type(l); }
console.log('3 lines', JSON.stringify(await ta()));
await page.keyboard.press('Enter'); await sleep(3500);
console.log('after send', JSON.stringify(await ta()), 'msgs:', await ev(`return ${S}.querySelector('.fixed').innerText.includes('第三行')`));
await ev(`${S}.querySelector('textarea').focus()`);
await page.keyboard.type('这是一个多行输入'); for (let i=2;i<=4;i++){ await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift'); await page.keyboard.type('第'+i+'行内容'); }
console.log('4 lines', JSON.stringify(await ta()));
await page.screenshot({path:`${OUT}/chat-multiline.png`});
for (let i=5;i<=9;i++){ await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift'); await page.keyboard.type('第'+i+'行'); }
console.log('9 lines', JSON.stringify(await ta()));
await page.screenshot({path:`${OUT}/chat-overflow.png`});
const op = await br.newPage(); await op.setViewport({width:900,height:700}); await op.goto(`chrome-extension://${id}/options.html`); await sleep(600);
await op.screenshot({path:`${OUT}/options-no-key.png`});
await op.evaluate(async()=>{ await chrome.storage.local.set({settings:{baseUrl:'https://api.openai.com/v1',apiKey:'sk-test',model:'gpt-4o-mini',mock:false}}); }); await op.reload(); await sleep(600);
await op.screenshot({path:`${OUT}/options-with-key.png`});
await br.close(); srv.close();
