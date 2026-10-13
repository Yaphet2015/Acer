import http from 'node:http';
import puppeteer from 'puppeteer-core';
const OUT=new URL('./v8', import.meta.url).pathname;
const html = `<html><head><title>示例文章：如何设计 AI 原生界面</title></head><body><article><h1>如何设计 AI 原生界面</h1><p id="p">${'这是一段示例正文，用来测试 Acer 的总结功能。'.repeat(40)}</p></article></body></html>`;
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
const S='document.querySelector("acer-overlay").shadowRoot'; const ev=(c)=>page.evaluate(new Function(c));
const txt=(sel)=>ev(`return ${S}.querySelector('${sel}')?.innerText.replace(/\\s+/g,' ') ?? null`);
const typeIn=async(t)=>{ await ev(`${S}.querySelector('textarea').focus()`); await page.keyboard.type(t); };
await ev(`[...${S}.querySelectorAll('button')].find(b=>b.innerText.trim()==='对话').click()`); await sleep(400);
console.log('chips init:', await txt('[data-session-chips]'));
console.log('skills row:', await txt('[data-skills-row]'));
await typeIn('第一个问题：核心观点是什么？'); await page.keyboard.press('Enter'); await sleep(3500);
// slash hint
await typeIn('/'); await sleep(250); console.log('slash menu:', await txt('[data-slash-menu]'));
await page.screenshot({path:`${OUT}/slash-hint.png`});
await page.keyboard.type('si'); await sleep(150); console.log('slash filtered:', await txt('[data-slash-menu]'));
await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace');
// /side with message
await typeIn('/side 换个角度：用一句话概括'); await sleep(150); await page.keyboard.press('Enter'); await sleep(3500);
console.log('chips after side:', await txt('[data-session-chips]'));
const msgCount = () => ev(`return [...${S}.querySelectorAll('.pl-14')].map(e=>e.innerText.trim())`);
console.log('side user msgs:', JSON.stringify(await msgCount()));
await page.screenshot({path:`${OUT}/side-session.png`});
// switch to main, verify diverged
await ev(`[...${S}.querySelectorAll('[data-session-chips] button')].find(b=>b.innerText.startsWith('主线')).click()`); await sleep(300);
console.log('main user msgs:', JSON.stringify(await msgCount()));
// skill run: select page text, type input, click skill
const hb = await page.evaluate(()=>{ const r=document.querySelector('h1').getBoundingClientRect(); return {x1:r.left+2,x2:r.left+200,y:r.top+r.height/2}; }); await page.mouse.move(hb.x1,hb.y); await page.mouse.down(); await page.mouse.move(hb.x2,hb.y,{steps:5}); await page.mouse.up(); await sleep(150); console.log('mouse sel:', await page.evaluate(()=>getSelection().toString()));
await ev(`[...${S}.querySelectorAll('[data-session-chips] button')].find(b=>b.innerText.includes('支线 1')).click()`); await sleep(300);
console.log('dbg sel:', await page.evaluate(()=>getSelection().toString()), 'disabled:', await ev(`return ${S}.querySelector('textarea').disabled`), 'busy?', await ev(`return ${S}.querySelector('[aria-label="发送"]').disabled`)); const tb = await ev(`const r=${S}.querySelector('textarea').getBoundingClientRect(); return {x:r.left+20,y:r.top+8}`); await page.mouse.click(tb.x,tb.y); await page.keyboard.type('Design is how it works'); console.log('active:', await ev(`return ${S}.activeElement?.tagName`)); await sleep(100); console.log('composer before skill:', await ev(`return ${S}.querySelector('textarea').value`));
await ev(`[...${S}.querySelectorAll('[data-skills-row] button')].find(b=>b.innerText.includes('翻译成英文')).click()`); await sleep(3800);
console.log('after skill msgs:', JSON.stringify(await msgCount())); console.log('skill prompt:', await ev(`return [...${S}.querySelectorAll('.pl-14 div')].at(-1).title`));
console.log('skills row reordered:', await txt('[data-skills-row]'));
await ev(`[...${S}.querySelectorAll('[data-skills-row] button')].find(b=>b.innerText.includes('解释概念')).click()`); await sleep(3800);
console.log('selection-fallback prompt:', JSON.stringify(await ev(`return [...${S}.querySelectorAll('.pl-14 div')].at(-1).title`))); console.log('skills row reordered 2:', await txt('[data-skills-row]'));
const scroll = await ev(`const r=${S}.querySelector('[data-skills-row]'); return {sw:r.scrollWidth, cw:r.clientWidth, mask:getComputedStyle(r).webkitMaskImage.slice(0,60)}`);
console.log('row scroll:', JSON.stringify(scroll));
// wheel to horizontal
const rb = await ev(`const r=${S}.querySelector('[data-skills-row]').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}`);
await page.mouse.move(rb.x, rb.y); await page.mouse.wheel({deltaY:120}); await sleep(200);
console.log('after wheel scrollLeft:', await ev(`return ${S}.querySelector('[data-skills-row]').scrollLeft`), 'mask:', await ev(`return getComputedStyle(${S}.querySelector('[data-skills-row]')).webkitMaskImage.slice(0,70)`));
await page.screenshot({path:`${OUT}/skills-row.png`});
// persistence: reload page, reopen
await page.goto(pageUrl); await sleep(500); await toggle(); await sleep(900);
await ev(`[...${S}.querySelectorAll('button')].find(b=>b.innerText.trim()==='对话').click()`); await sleep(400);
console.log('chips after reload:', await txt('[data-session-chips]'));
// close side
await ev(`${S}.querySelector('[aria-label="关闭支线 1"]').click()`); await sleep(300);
console.log('chips after close:', await txt('[data-session-chips]'));
// options page CRUD
const op = await br.newPage(); await op.setViewport({width:900,height:1250}); await op.goto(`chrome-extension://${id}/options.html`); await sleep(500);
const list = () => op.$eval('[data-skill-list]', e=>[...e.querySelectorAll('li')].map(li=>li.querySelector('.font-medium')?.innerText.replace(/\s+/g,' ')).join(' | '));
console.log('opt list:', await list());
const clickText = (t, root='') => op.evaluate((t,root)=>{ const b=[...document.querySelectorAll((root?root+' ':'')+'button')].find(b=>b.innerText.trim()===t); b.click(); return !!b; }, t, root);
await clickText('＋ 新建'); await sleep(200);
await op.type('[aria-label="图标"]', '✍️'); await op.type('[aria-label="名称"]', '改写得更正式');
await op.click('[aria-label="提示词模板"]'); await op.keyboard.down('Control'); await op.keyboard.press('KeyA'); await op.keyboard.up('Control'); await op.keyboard.press('Backspace'); await op.type('[aria-label="提示词模板"]', '把下面的文字改写得更正式（页面：{{page_title}}）：\n{{input}}');
await sleep(200); await op.screenshot({path:`${OUT}/options-skill-editor.png`});
await clickText('添加'); await sleep(300); console.log('after add:', await list());
// edit
await op.evaluate(()=>{ const li=[...document.querySelectorAll('[data-skill-list] li')].find(l=>l.innerText.includes('改写得更正式')); [...li.querySelectorAll('button')].find(b=>b.innerText==='编辑').click(); }); await sleep(200);
await op.click('[aria-label="名称"]'); await op.keyboard.down('Control'); await op.keyboard.press('KeyA'); await op.keyboard.up('Control'); await op.type('[aria-label="名称"]', '正式改写'); await clickText('保存修改'); await sleep(300);
console.log('after edit:', await list());
// move up
await op.evaluate(()=>{ const li=[...document.querySelectorAll('[data-skill-list] li')].find(l=>l.innerText.includes('正式改写')); li.querySelector('[aria-label="上移"]').click(); }); await sleep(300);
console.log('after move up:', await list());
// delete with confirm
await op.evaluate(()=>{ const li=[...document.querySelectorAll('[data-skill-list] li')].find(l=>l.innerText.includes('出几道题')); [...li.querySelectorAll('button')].find(b=>b.innerText==='删除').click(); }); await sleep(200);
await op.screenshot({path:`${OUT}/options-skills-crud.png`});
await op.evaluate(()=>{ const li=[...document.querySelectorAll('[data-skill-list] li')].find(l=>l.innerText.includes('确定删除')); [...li.querySelectorAll('button')].find(b=>b.innerText==='删除').click(); }); await sleep(300);
console.log('after delete:', await list());
// validation
await clickText('＋ 新建'); await sleep(150); await clickText('添加'); await sleep(150);
console.log('validation:', await op.$eval('[data-skill-editor]', e=>e.innerText.includes('请填写名称')));
await clickText('取消');
// the overlay reflects the new skill
await sleep(300); console.log('overlay row has new skill:', await txt('[data-skills-row]'));
await br.close(); srv.close();
