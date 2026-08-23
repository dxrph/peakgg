import {writeFile} from 'node:fs/promises';

const endpoint='http://127.0.0.1:9222';
const app='http://localhost:3000/';
const viewports=[[1920,1080],[1440,1000],[1280,900],[1024,768],[768,900],[430,932],[390,844]];

async function connect(url){
  const target=await fetch(`${endpoint}/json/new?${encodeURIComponent(url)}`,{method:'PUT'}).then(r=>r.json());
  const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();const events=new Map();
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const request=pending.get(message.id);if(request){pending.delete(message.id);if(message.error){request.reject(message.error)}else{request.resolve(message.result)}}}else{const queue=events.get(message.method);if(queue?.length)queue.shift()(message.params)}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});socket.send(JSON.stringify({id:requestId,method,params}))});
  const once=method=>new Promise(resolve=>{const queue=events.get(method)||[];queue.push(resolve);events.set(method,queue)});
  return {socket,send,once,targetId:target.id};
}

async function evaluate(client,expression){const result=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});return result.result.value}

const report=[];
for(const [width,height] of viewports){
  const client=await connect('about:blank');
  await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Log.enable');
  await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  const loaded=client.once('Page.loadEventFired');await client.send('Page.navigate',{url:app});await loaded;
  await new Promise(resolve=>setTimeout(resolve,1400));
  await evaluate(client,`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.65){scrollTo(0,y);await new Promise(r=>setTimeout(r,180))}scrollTo(0,0);await new Promise(r=>setTimeout(r,900))})()`);
  const audit=await evaluate(client,`(()=>({
    title:document.title,
    viewport:[innerWidth,innerHeight],
    document:[document.documentElement.clientWidth,document.documentElement.scrollWidth,document.documentElement.scrollHeight],
    sections:[...document.querySelectorAll('main section, footer')].map((el,index)=>({index,tag:el.tagName,className:el.className,id:el.id,top:Math.round(el.getBoundingClientRect().top+scrollY),height:Math.round(el.getBoundingClientRect().height)})),
    headings:[...document.querySelectorAll('h1,h2,h3')].map(el=>({tag:el.tagName,text:el.innerText.replace(/\\n/g,' / '),rect:[Math.round(el.getBoundingClientRect().x),Math.round(el.getBoundingClientRect().width),Math.round(el.getBoundingClientRect().height)],overflow:el.scrollWidth>el.clientWidth})),
    images:[...document.images].map(img=>({alt:img.alt,src:img.currentSrc.split('/').pop(),natural:[img.naturalWidth,img.naturalHeight],rendered:[Math.round(img.getBoundingClientRect().width),Math.round(img.getBoundingClientRect().height)],complete:img.complete})),
    links:[...document.querySelectorAll('a')].map(a=>({text:a.innerText.trim().replace(/\\n/g,' '),href:a.getAttribute('href')})),
    smallTargets:[...document.querySelectorAll('a,button')].filter(el=>el.getClientRects().length).map(el=>({text:el.innerText.trim().replace(/\\n/g,' '),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)})).filter(x=>x.w<24||x.h<24),
    overflowers:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.right>document.documentElement.clientWidth+1||r.left<-1}).map(el=>({tag:el.tagName,className:el.className,right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left)})).slice(0,20)
  }))()`);
  const metrics=await client.send('Page.getLayoutMetrics');const size=metrics.cssContentSize;
  const screenshot=await client.send('Page.captureScreenshot',{format:'jpeg',quality:78,fromSurface:true,captureBeyondViewport:true,clip:{x:0,y:0,width:Math.min(size.width,width),height:size.height,scale:1}});
  await writeFile(`audit-${width}.jpg`,Buffer.from(screenshot.data,'base64'));
  const roles=await evaluate(client,`(async()=>{const out=[];for(const button of document.querySelectorAll('.dossier-tabs button')){button.click();await new Promise(r=>setTimeout(r,480));out.push({selected:button.getAttribute('aria-selected'),role:document.querySelector('.dossier-tag b')?.textContent,image:document.querySelector('.agent-main')?.getAttribute('src')})}return out})()`);
  const menu=width<600?await evaluate(client,`(async()=>{const button=document.querySelector('.menu-button');button.click();await new Promise(r=>setTimeout(r,80));const opened={expanded:button.getAttribute('aria-expanded'),bodyLocked:document.body.classList.contains('menu-open'),hidden:document.querySelector('.mobile-nav').getAttribute('aria-hidden'),focus:document.activeElement?.textContent?.trim()};button.click();await new Promise(r=>setTimeout(r,80));return {opened,closed:button.getAttribute('aria-expanded')}})()`):null;
  report.push({width,height,audit,roles,menu});
  await fetch(`${endpoint}/json/close/${client.targetId}`);client.socket.close();
}
await writeFile('audit-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report.map(x=>({viewport:[x.width,x.height],document:x.audit.document,sections:x.audit.sections.length,headings:x.audit.headings,smallTargets:x.audit.smallTargets,roles:x.roles,menu:x.menu})),null,2));
