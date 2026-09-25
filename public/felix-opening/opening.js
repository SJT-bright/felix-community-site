import { CONFIG } from './config.js';
const esc = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeLink = value => {try{const url=new URL(value,location.href);return ['http:','https:'].includes(url.protocol)?esc(value):'#';}catch{return '#';}};
class FelixOpening extends HTMLElement {
  connectedCallback(){
    if(this.cleanup)return;
    const shadow=this.shadowRoot||this.attachShadow({mode:'open'});
    const links=Object.fromEntries(Object.entries(CONFIG.links).map(([key,value])=>[key,safeLink(this.dataset[key]||value)]));
    const brand=esc(CONFIG.name),chineseName=esc(CONFIG.chineseName);
    shadow.innerHTML=`<link rel="stylesheet" href="${new URL('./opening.css',import.meta.url)}">
    <style>:host([data-integrated]){background:transparent}:host([data-integrated]) .stage{background:transparent}:host([data-integrated]) .veil{background:linear-gradient(90deg,#03071138,transparent 60%)}:host([data-integrated]) .handoff,:host([data-integrated]) .masthead{display:none}</style>
    <section class="journey" aria-label="${brand} 作品集开场"><div class="stage">
      <div class="fallback" aria-hidden="true"></div><canvas class="scene" aria-hidden="true"></canvas><div class="veil" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div>
      <header class="masthead"><a class="brand" href="${links.home}" aria-label="${brand} 个人介绍"><span class="brand-name">${brand}<i>⁎</i></span><span class="brand-sub">${chineseName}<br>INDEPENDENT CREATOR</span></a><nav class="nav" aria-label="作品集导航"><a href="${links.projects}">项目作品</a><a href="${links.archive}">星空影像馆</a><a class="contact" href="${links.contact}">联系</a><a class="skip" href="${links.home}">进入作品集 <span aria-hidden="true">↗</span></a></nav></header>
      <div class="coordinates" aria-hidden="true">A THOUGHT IN ORBIT<br>F / 001 — INFINITE</div>
      <div class="copy first"><p class="eyebrow">AIGC & CREATIVE DEVELOPMENT</p><h1>${CONFIG.title.map(t=>`<span>${esc(t)}</span>`).join('')}</h1><p class="english" lang="en">Make imagination tangible.</p><p class="description">${esc(CONFIG.intro)}</p><p class="signature">${chineseName} · ${brand.toUpperCase()} <span> / </span>${esc(CONFIG.role)}</p></div>
      <div class="copy second" aria-hidden="true"><p class="eyebrow">BEYOND THE IMAGINATION</p><h2>${CONFIG.secondTitle.map(t=>`<span>${esc(t)}</span>`).join('')}</h2><p class="english" lang="en">Ideas, brought to life.</p><p class="description">${esc(CONFIG.secondIntro)}</p></div>
      <div class="orbit-note" aria-hidden="true">IMAGINATION HAS GRAVITY.<br>EVERY IDEA FINDS ITS ORBIT.</div>
      <div class="bottom"><button class="explore" type="button"><span class="arrow" aria-hidden="true">↓</span><span><strong>向下，继续探索</strong><small>SCROLL TO EXPLORE</small></span></button><button class="hold" type="button" aria-pressed="false" aria-label="按住让时间慢下来，松开恢复"><span class="hold-mark" aria-hidden="true"><i></i><i></i></span><span><strong>按住，慢下来</strong><small>HOLD TO SLOW DOWN</small></span><span class="rate" aria-hidden="true">1.00×</span></button><div class="edition"><b>${brand.toUpperCase()} / PORTFOLIO</b><br>IMAGES. CODE. POSSIBILITIES.</div></div><div class="track" aria-hidden="true"><i></i></div><p class="fallback-message" hidden>当前显示静态星门，可继续浏览作品。</p>
    </div></section>
    <section class="handoff" aria-labelledby="opening-next-title"><div class="handoff-heading"><div><p class="eyebrow">THE NEXT CHAPTER</p><h2 id="opening-next-title" tabindex="-1">想象之外，<em>作品之中。</em></h2></div><p>影像、代码，以及持续发生的新尝试。<br>从这里，认识我的创作与实践。</p></div><div class="destinations"><a class="destination" href="${links.home}"><span class="number">01 / THE CREATOR</span><h3>认识 ${brand}</h3><p>个人介绍 · 经历与实践</p><span class="link-arrow" aria-hidden="true">↗</span></a><a class="destination" href="${links.projects}"><span class="number">02 / SELECTED PROJECTS</span><h3>浏览项目</h3><p>个人开发项目 · 审美参考选集</p><span class="link-arrow" aria-hidden="true">↗</span></a><a class="destination" href="${links.archive}"><span class="number">03 / STARRY ARCHIVE</span><h3>进入星空影像馆</h3><p>在 360° 星穹中，遇见影像</p><span class="link-arrow" aria-hidden="true">↗</span></a></div><footer class="foot"><a href="${links.contact}">${chineseName} · ${brand} / 一起创造点什么 ↗</a><button class="return" type="button">回到星门 ↑</button><span>AN INDEPENDENT MIND.</span></footer></section>`;
    const journey=shadow.querySelector('.journey'),stage=shadow.querySelector('.stage'),hold=shadow.querySelector('.hold'),rate=shadow.querySelector('.rate');
    const first=shadow.querySelector('.first'),second=shadow.querySelector('.second'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let disposed=false,scene=null,scrollFrame=0,holding=false,touch=null,timer=0;
    let canvas=shadow.querySelector('canvas'),usingFallback=false,visible=true;
    const controller=new AbortController(),opts={signal:controller.signal};
    const clamp=v=>Math.max(0,Math.min(1,v));
    const setHold=value=>{value=!!value&&!reduced.matches&&!!scene&&this.dataset.scene==='ready';holding=value;hold.setAttribute('aria-pressed',String(value));hold.querySelector('strong').textContent=value?'此刻，慢一点。':'按住，慢下来';rate.textContent=value?`${CONFIG.slowSpeed.toFixed(2)}×`:'1.00×';scene?.setHolding(value);};
    const release=()=>{clearTimeout(timer);touch=null;setHold(false);};
    const update=()=>{scrollFrame=0;const rect=journey.getBoundingClientRect();const p=reduced.matches?0:clamp(-rect.top/Math.max(1,rect.height-innerHeight));const firstOpacity=1-clamp((p-.10)/.29),secondOpacity=clamp((p-.43)/.23);journey.style.setProperty('--p',p);journey.style.setProperty('--out',firstOpacity);journey.style.setProperty('--in',secondOpacity);journey.style.setProperty('--drift',`${p*60}px`);first.setAttribute('aria-hidden',String(firstOpacity<.1));second.setAttribute('aria-hidden',String(secondOpacity<.1));scene?.setProgress(p);this.dataset.progress=p.toFixed(3);if(rect.bottom<=0||rect.top>=innerHeight)release();};
    const queue=()=>{if(touch)release();if(!scrollFrame)scrollFrame=requestAnimationFrame(update);};
    const ready=engine=>{stage.dataset.ready='true';this.dataset.scene='ready';this.dataset.renderer=engine;hold.disabled=false;stage.querySelector('.fallback-message').hidden=true;scene?.setActive(visible);update();};
    const failure=error=>{
      if(disposed||usingFallback)return;
      usingFallback=true;this.dataset.scene='loading';
      this.dataset.sceneError=String(error?.stack||error);
      console.warn('[Felix scene] Switching to animated Canvas particles:',error);
      // Defer until createScene has returned, including synchronous WebGL initialization failures.
      queueMicrotask(()=>{
        if(disposed)return;
        release();scene?.dispose();scene=null;
        const replacement=document.createElement('canvas');replacement.className='scene';replacement.setAttribute('aria-hidden','true');
        canvas.replaceWith(replacement);canvas=replacement;
        try{scene=createCanvasParticles(canvas,CONFIG,()=>ready('canvas2d'));scene.setActive(visible);update();}
        catch(fallbackError){
          console.error('[Felix scene] Canvas unavailable:',fallbackError);
          stage.dataset.ready='false';hold.disabled=true;this.dataset.scene='fallback';
          const message=stage.querySelector('.fallback-message');message.textContent='动画暂时无法显示，请刷新页面重试。';message.hidden=false;
        }
      });
    };
    import('./scene.js').then(({createScene})=>{
      if(disposed)return;
      scene=createScene(canvas,CONFIG,failure,()=>{if(!disposed&&!usingFallback)ready('webgl');});
      scene?.setActive(visible);update();
    }).catch(failure);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;scene?.setActive(visible);if(!visible)release();},{rootMargin:'100px'});observer.observe(stage);
    window.addEventListener('scroll',queue,{passive:true,...opts});window.addEventListener('resize',queue,opts);
    stage.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button!==0||reduced.matches)return;const interactive=event.target.closest('a,button');if(interactive&&interactive!==hold&&!hold.contains(interactive))return;if(event.pointerType==='touch'){touch={id:event.pointerId,x:event.clientX,y:event.clientY};timer=setTimeout(()=>setHold(true),160);}else setHold(true);},{passive:true,...opts});
    stage.addEventListener('pointermove',event=>{const rect=stage.getBoundingClientRect();scene?.setPointer((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);if(touch&&Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>9)release();},{passive:true,...opts});
    stage.addEventListener('pointerleave',release,opts);window.addEventListener('pointerup',release,opts);window.addEventListener('pointercancel',release,opts);window.addEventListener('blur',release,opts);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();},opts);
    hold.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)setHold(true);}},opts);hold.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();release();}},opts);hold.addEventListener('blur',release,opts);
    stage.addEventListener('contextmenu',event=>{if(!event.target.closest('a'))event.preventDefault();},opts);
    const nextPage=()=>{if(this.hasAttribute('data-integrated')){document.querySelector(this.dataset.home||'#top')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});}else{shadow.querySelector('.handoff').scrollIntoView({behavior:reduced.matches?'instant':'smooth'});shadow.querySelector('#opening-next-title').focus({preventScroll:true});}};
    shadow.querySelector('.explore').addEventListener('click',()=>{if(reduced.matches){nextPage();return;}const rect=journey.getBoundingClientRect();if(-rect.top/Math.max(1,rect.height-innerHeight)<.65){window.scrollTo({top:scrollY+rect.top+(rect.height-innerHeight)*.78,behavior:'smooth'});}else{nextPage();}},opts);
    shadow.querySelector('.return').addEventListener('click',()=>{this.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});shadow.querySelector('.brand').focus({preventScroll:true});},opts);
    const motionChange=()=>{release();update();};reduced.addEventListener('change',motionChange);update();
    this.cleanup=()=>{disposed=true;controller.abort();clearTimeout(timer);cancelAnimationFrame(scrollFrame);observer.disconnect();reduced.removeEventListener('change',motionChange);scene?.dispose();};
  }
  disconnectedCallback(){this.cleanup?.();this.cleanup=null;}
}
if(!customElements.get('felix-opening'))customElements.define('felix-opening',FelixOpening);

// Kept in the component module: even a failed Three.js download leaves a moving scene.
function createCanvasParticles(canvas,config,onReady){
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)throw new Error('Canvas 2D unavailable');
  let w=1,h=1,dpr=1,frame=0,last=0,time=0,speed=1,progress=0,target=0,holding=false,active=true,disposed=false;
  let pointerX=0,pointerY=0,heat=0,rendered=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let seed=7367;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const white=Array.from({length:700},(_,i)=>[(i+random()*.45)/700,random(),random(),random()]);
  const goldRing=Array.from({length:1600},(_,i)=>[(i+random()*.45)/1600,random(),random(),random()]);
  const haze=Array.from({length:800},(_,i)=>[(i+random()*.45)/800,random(),random(),random()]);
  const disk=Array.from({length:1400},()=>[random(),random(),random(),random()]);
  const infall=Array.from({length:450},()=>[random(),random(),random(),random()]);
  const ribbon=Array.from({length:2300},()=>[random(),random(),random(),random()]);
  const wing=Array.from({length:720},(_,i)=>{const perSide=360,index=i%perSide,lane=index%4,step=Math.floor(index/4);return [(step+random()*.4)/90,(lane+random()*.12)/4,random(),i<perSide ? .25 : .75];});
  const front=Array.from({length:1700},()=>[random(),random(),random(),random()]);
  const dark=Array.from({length:125},()=>[random(),random(),random(),random()]);
  const stars=Array.from({length:170},()=>[random(),random(),random()]);
  const rgb=hex=>hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16));
  const start=rgb(config.colors.start),end=rgb(config.colors.end);
  function draw(now){
    frame=0;if(disposed||!active||document.hidden)return;
    const dt=Math.min(.05,last?(now-last)/1000:1/60);last=now;
    speed+=((holding?config.slowSpeed:1)-speed)*(1-Math.exp(-dt*(holding?9:4.5)));
    progress+=(target-progress)*(1-Math.exp(-dt*5));time+=reduced.matches?0:dt*speed;heat*=Math.exp(-dt*1.2);
    const mobile=w<541,cx=w*(mobile?.5:.70),cy=h*(mobile?.68:.51);
    const radius=Math.min(w*(mobile?.25:.17),h*(mobile?.16:.29))*(1+progress*.22);
    const tint=Math.max(0,Math.min(1,(progress-.18)/.67));
    const color=start.map((v,i)=>Math.round(v+(end[i]-v)*tint)).join(',');
    const warm=start.map((v,i)=>Math.round([255,244,215][i]*.71+(v+(end[i]-v)*tint)*.29)).join(',');
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const halo=ctx.createRadialGradient(cx,cy,radius*.3,cx,cy,radius*2.2);
    halo.addColorStop(0,`rgba(${color},.08)`);halo.addColorStop(1,`rgba(${color},0)`);
    ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
    for(const [x,y,b] of stars){ctx.fillStyle=`rgba(${color},${.12+b*.3})`;ctx.fillRect(x*w,y*h,.6+b,.6+b);}
    const project=(x,y,z)=>{const k=1;return [cx+(x*.925+y*.38)*radius/3,cy+(y*.925-x*.38)*radius/3,k];};
    const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
    const corona=ctx.createRadialGradient(cx,cy,radius*.66,cx,cy,radius*1.16);
    corona.addColorStop(0,`rgba(${warm},0)`);corona.addColorStop(.25,`rgba(${warm},.04)`);
    corona.addColorStop(.44,`rgba(${warm},.16)`);corona.addColorStop(.7,`rgba(${warm},.055)`);
    corona.addColorStop(1,`rgba(${warm},0)`);
    ctx.globalCompositeOperation='lighter';ctx.fillStyle=corona;ctx.fillRect(0,0,w,h);
    const drawGlowFlow=near=>{
      const extent=near?8.4:11;
      const flowY=x=>{
        const wing=smooth(near?3.2:3.5,near?8.4:10,Math.abs(x));
        return near?-.13+.020*x*x+Math.sin(x*.46-time*.20)*.065+Math.sign(x)*.33*wing*wing
          :-.15+.014*x*x+Math.sin(x*.42-time*.16)*.085+Math.sign(x)*.42*wing*wing;
      };
      const left=project(-extent,flowY(-extent)),right=project(extent,flowY(extent));
      const light=ctx.createLinearGradient(left[0],left[1],right[0],right[1]);
      const strength=near?.15:.12;
      light.addColorStop(0,`rgba(${warm},0)`);light.addColorStop(.2,`rgba(${warm},${strength})`);
      light.addColorStop(.5,`rgba(${warm},${strength*1.25})`);light.addColorStop(.8,`rgba(${warm},${strength})`);
      light.addColorStop(1,`rgba(${warm},0)`);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=light;ctx.lineWidth=radius*(near?.09:.13);
      ctx.lineCap='round';ctx.shadowColor=`rgba(${warm},.48)`;ctx.shadowBlur=radius*.13;
      ctx.beginPath();for(let i=0;i<=48;i++){
        const x=-extent+extent*2*i/48,[sx,sy]=project(x,flowY(x));
        if(i)ctx.lineTo(sx,sy);else ctx.moveTo(sx,sy);
      }ctx.stroke();ctx.restore();
    };
    drawGlowFlow(false);
    const points=[];
    for(const [a,b,c,d] of white){
      const angle=a*Math.PI*2+time*.135,r=2.24+b*.055;
      points.push({pos:project(Math.cos(angle)*r,Math.sin(angle)*r,0),depth:0,white:true,size:1.5+c*1.3,alpha:.34+d*.55});
    }
    for(const [a,b,c,d] of goldRing){
      const angle=a*Math.PI*2+time*.10,lens=Math.pow(Math.abs(Math.sin(angle)),.78);
      const r=2.31+Math.pow(b,1.35)*(.48+.08*lens)+Math.sin(angle*7-time*.27)*.018;
      points.push({pos:project(Math.cos(angle)*r,Math.sin(angle)*r,0),depth:0,size:1.8+c*1.5,alpha:(.24+.78*lens)*(.51+d*.49)*(1-b*.27)});
    }
    for(const [a,b,c,d] of haze){
      const angle=a*Math.PI*2+time*.10,lens=Math.pow(Math.abs(Math.sin(angle)),.65);
      const r=2.25+Math.pow(b,1.18)*(.80+.12*lens);
      points.push({pos:project(Math.cos(angle)*r,Math.sin(angle)*r,0),depth:0,size:3+c*2.4,alpha:(.038+.14*lens)*(.55+.45*d)*(1-b*.38),haze:true});
    }
    for(const [a,b,c,d] of disk){
      const lane=Math.floor(c*12),r=2.93+Math.pow(b,1.24)*4.67;
      const angle=lane*Math.PI*2/12+(7.6-r)*.37+time*(.18+1.2/Math.pow(r,1.4))+(a-.5)*.04;
      points.push({pos:project(Math.cos(angle)*r,Math.sin(angle)*r*.20+(d-.5)*.09,0),depth:0,size:1+c*1.2,alpha:(.31+d*.43)*(1-b*.5)});
    }
    for(const [a,b,c,d] of infall){
      for(let j=3;j>=0;j--){
        const life=((a+time*(.18+d*.05)-j*.027)%1+1)%1,r=7.1-4.42*Math.pow(life,1.75);
        const angle=Math.floor(b*5)*Math.PI*2/5+life*(1.15+life*.75)+(c-.5)*.13;
        points.push({pos:project(Math.cos(angle)*r,Math.sin(angle)*r*.25,0),depth:0,size:1.1+c*.8,alpha:Math.sin(life*Math.PI)*(.35+d*.55)*(.45+life*1.3)*Math.exp(-j*.53)});
      }
    }
    for(const [a,b,c,d] of dark){
      const lane=Math.floor(c*12),r=3.28+b*2.7,angle=lane*Math.PI*2/12+(7.6-r)*.37+time*(.18+1.2/Math.pow(r,1.4))+(a-.5)*.08;
      points.push({pos:project(Math.cos(angle)*r,Math.sin(angle)*r*.20,0),depth:0,size:1.4+c*1.3,alpha:.12+d*.22,dark:true});
    }
    for(const [a,b,c,d] of ribbon){
      const x=(a-.5)*22,reach=Math.abs(x),wing=smooth(3.5,10,reach),lane=Math.floor(c*7)-3;
      const offset=lane*(.065+.15*wing*wing)+(b-.5)*(.12+.28*wing);
      const curve=.014*x*x+Math.sin(x*.42-time*.16)*.085+Math.sign(x)*.42*wing*wing;
      const fade=1-Math.min(1,Math.max(0,(reach-8.5)/2.5));
      points.push({pos:project(x,-.15+curve+offset,0),depth:0,size:1.7+d*1.4,alpha:(.26+d*.43)*fade*(1-.08*Math.abs(lane))});
    }
    for(const [a,b,c,d] of wing){
      const life=((a-time*.045)%1+1)%1,x=(2.8+life*8)*(d>.5?1:-1),reach=Math.abs(x);
      const sweep=smooth(3.5,10,reach),lane=Math.floor(b*4)-1.5;
      const curve=.014*x*x+Math.sin(x*.42-time*.16)*.085+Math.sign(x)*.42*sweep*sweep;
      const offset=lane*(.08+.18*sweep*sweep)+(c-.5)*.055;
      const alpha=(.45+c*.30)*smooth(2.8,3.8,reach)*(1-smooth(9.1,10.8,reach));
      points.push({pos:project(x,-.15+curve+offset,0),depth:0,size:1.7+c*1.2,alpha});
    }
    for(const [a,b,c,d] of front){
      const life=((a-time*(.095+d*.018))%1+1)%1,x=(life-.5)*16.8;
      const wing=smooth(3.2,8.4,Math.abs(x));
      const breadth=.24+c*.61+.16*Math.min(1,Math.max(0,(Math.abs(x)-2.5)/5.9));
      const spread=(b-.5)*breadth+(Math.floor(c*7)-3)*.09*wing*wing;
      const y=-.13+.020*x*x+Math.sign(x)*.33*wing*wing+spread+Math.sin(x*.46-time*.20)*.065;
      const fade=1-Math.min(1,Math.max(0,(Math.abs(x)-6.7)/1.7));
      points.push({pos:project(x,y,0),depth:1,size:1.8+d*1.5,alpha:(.58+d*.50)*fade*(1-c*.56)});
    }
    const particle=p=>{
      let [x,y,k]=p.pos,alpha=p.alpha;
      if(mobile)alpha*=Math.max(0,Math.min(1,(y-h*.48)/(h*.08)))*Math.max(0,Math.min(1,(h*.89-y)/(h*.06)));
      else alpha*=Math.max(0,Math.min(1,(x-w*.15)/(w*.20)));
      if(alpha<.01)return;
      const dx=x-pointerX,dy=y-pointerY,focus=Math.exp(-(dx*dx+dy*dy)/5000)*heat;
      x+=dx*focus*.12;y+=dy*focus*.12;
      if(p.haze){ctx.fillStyle=`rgba(${warm},${alpha})`;ctx.beginPath();ctx.arc(x,y,Math.min(8,p.size*1.5),0,Math.PI*2);ctx.fill();return;}
      if(!p.white&&!p.dark){ctx.fillStyle=`rgba(${warm},${Math.min(.22,alpha*.18)})`;ctx.beginPath();ctx.arc(x,y,Math.min(5,p.size*1.6),0,Math.PI*2);ctx.fill();}
      ctx.fillStyle=p.dark?`rgba(3,2,0,${alpha})`:`rgba(${p.white?'255,255,255':warm},${Math.min(1,alpha+focus*.25)})`;
      if(p.previous){ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(.5,p.size*.6);ctx.beginPath();ctx.moveTo(p.previous[0],p.previous[1]);ctx.lineTo(x,y);ctx.stroke();}
      const size=Math.min(3,p.size*k);ctx.beginPath();ctx.arc(x,y,size*.6,0,Math.PI*2);ctx.fill();
    };
    ctx.globalCompositeOperation='lighter';for(const p of points)if(!p.dark&&p.depth===0)particle(p);
    ctx.globalCompositeOperation='source-over';for(const p of points)if(p.dark&&p.depth===0)particle(p);
    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,radius*.70,0,Math.PI*2);ctx.fill();
    drawGlowFlow(true);
    ctx.globalCompositeOperation='lighter';for(const p of points)if(!p.dark&&p.depth===1)particle(p);
    ctx.globalCompositeOperation='source-over';for(const p of points)if(p.dark&&p.depth===1)particle(p);
    Object.assign(canvas.dataset,{engine:'canvas2d',sceneTime:time.toFixed(3),timeScale:speed.toFixed(3),progress:progress.toFixed(3),phase:progress>.7?'amber':'gold',particles:String(white.length+goldRing.length+haze.length+disk.length+infall.length+ribbon.length+wing.length+front.length+dark.length),particleLayers:'white-inner,photon-corona,orbital-tracks,infall,rear-ribbon,angled-wings,front-stream,dark-flecks'});
    if(!rendered){rendered=true;onReady();}
    if(!frame&&(!reduced.matches||Math.abs(progress-target)>.001))frame=requestAnimationFrame(draw);
  }
  function wake(){if(!frame&&!disposed&&active&&!document.hidden)frame=requestAnimationFrame(draw);}
  function resize(){const rect=canvas.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);dpr=Math.min(devicePixelRatio,1.5,Math.sqrt(1800000/(w*h)));canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);wake();}
  const visibility=()=>{last=0;holding=false;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();};
  const motion=()=>{holding=false;wake();};
  document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  return {setProgress(v){target=reduced.matches?0:v;wake();},setHolding(v){holding=!!v&&!reduced.matches;wake();},setPointer(x,y){if(reduced.matches)return;pointerX=(x+1)*w/2;pointerY=(1-y)*h/2;heat=1;wake();},setActive(v){active=v;if(!v){cancelAnimationFrame(frame);frame=0;last=0;holding=false;}else wake();},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);}};
}
