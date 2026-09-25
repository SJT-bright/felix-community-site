import * as THREE from './vendor/three.module.js';

// 独立程序化场景：不读取图片，不使用外部 CDN，不改变原站 DOM。
export function createScene(canvas, config, onFailure, onReady = () => {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:true, powerPreference:'high-performance'}); }
  catch(error) { onFailure(error); return null; }
  const small = matchMedia('(max-width: 600px), (pointer: coarse)').matches;
  const baseDpr=Math.min(devicePixelRatio, small ? 1.2 : 1.6);
  renderer.setPixelRatio(baseDpr);
  renderer.setClearColor(0x050a13, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 100);
  camera.position.set(0,0,13);
  let seed=7367; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296;};
  const resources = []; const keep=x=>(resources.push(x),x);
  const start = new THREE.Color(config.colors.start), end = new THREE.Color(config.colors.end);
  const uniforms = {uTime:{value:0},uProgress:{value:0},uColor:{value:start.clone()},uDpr:{value:renderer.getPixelRatio()},uSpeed:{value:1},uMobile:{value:small?1:0},uSafeTop:{value:0},uPointer:{value:new THREE.Vector2()},uHeat:{value:0}};
  const portal = new THREE.Group(); scene.add(portal);
  // Each population has its own radius and material: white photons, golden disk,
  // sparse dark gaps, inward spirals, and a close foreground stream.
  const pointFragment = `varying float vAlpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float light=exp(-d*d*4.8);gl_FragColor=vec4(vColor,light*vAlpha);}`;
  const glowFragment = `varying float vAlpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float halo=exp(-d*d*3.2);float core=exp(-d*d*24.);vec3 color=mix(vColor,vec3(1.,.98,.88),core*.58);gl_FragColor=vec4(color,vAlpha*(halo*.23+core*.82));}`;
  const hazeFragment = `varying float vAlpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vColor,exp(-d*d*2.7)*vAlpha);}`;
  const layers=[
    {kind:'white',count:small?360:620},
    {kind:'whiteGlow',count:small?500:800},
    {kind:'goldRing',count:small?2500:5000},
    {kind:'halo',count:small?1500:3100},
    {kind:'disk',count:small?2600:4700},
    {kind:'infall',count:small?1200:3000},
    {kind:'ribbon',count:small?3800:8000},
    {kind:'wing',count:small?1600:3400},
    {kind:'front',count:small?4000:8200},
    {kind:'dark',count:small?180:300},
  ];
  function particleLayer({kind,count}){
    const geometry=keep(new THREE.BufferGeometry());
    const seeds=new Float32Array(count*4);
    if(kind==='infall'){
      const trail=new Float32Array(count),samples=small?4:5;
      for(let i=0;i<count/samples;i++){
        const values=[random(),random(),random(),random()];
        for(let j=0;j<samples;j++){
          const index=i*samples+j;
          seeds.set(values,index*4);trail[index]=j;
        }
      }
      geometry.setAttribute('aTrail',new THREE.BufferAttribute(trail,1));
    }else if(kind==='wing'){
      // Four evenly sampled filaments on each side stay connected as they move.
      const perSide=count/2,perLane=perSide/4;
      for(let i=0;i<count;i++){
        const side=Math.floor(i/perSide),index=i%perSide;
        const lane=index%4,step=Math.floor(index/4);
        seeds.set([(step+random()*.4)/perLane,(lane+random()*.12)/4,random(),side?.75:.25],i*4);
      }
    }else if(kind==='white'||kind==='goldRing'||kind==='halo'){
      // Even angular coverage avoids empty sectors without drawing a solid line.
      for(let i=0;i<count;i++)seeds.set([(i+random()*.45)/count,random(),random(),random()],i*4);
    }else for(let i=0;i<count;i++)seeds.set([random(),random(),random(),random()],i*4);
    geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));
    geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,4));
    const white=kind==='white'||kind==='whiteGlow';
    const dark=kind==='dark';
    const material=keep(new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
      blending:dark?THREE.NormalBlending:THREE.AdditiveBlending,
      vertexShader:`attribute vec4 aSeed;${kind==='infall'?'attribute float aTrail;':''}uniform float uTime,uDpr,uProgress,uHeat,uMobile;uniform vec3 uColor;uniform vec2 uPointer;varying float vAlpha;varying vec3 vColor;
      void main(){float t=uTime;float a=aSeed.x*6.283185;float r;vec3 p;
      ${kind==='white'||kind==='whiteGlow'?`
        // The photon ring always stays white and inside the separate gold ring.
        a+=t*${kind==='white'?'.135':'.12'};
        r=2.24+${kind==='white'?'.055':'.16'}*aSeed.y;
        p=vec3(cos(a)*r,sin(a)*r,.08);
        vAlpha=${kind==='white'?'(.34+aSeed.z*.55)':'(.04+aSeed.z*.065)'}*(.82+.18*sin(a*4.-t));
      `:kind==='goldRing'?`
        a+=t*.10;
        float lens=pow(abs(sin(a)),.78);
        r=2.31+pow(aSeed.y,1.22)*(1.00+.18*lens)+sin(a*7.-t*.27)*.035;
        p=vec3(cos(a)*r,sin(a)*r,0.);
        vAlpha=(.27+.65*lens)*(.49+aSeed.z*.51)*(1.-aSeed.y*.40);
      `:kind==='halo'?`
        a+=t*.10;
        float lens=pow(abs(sin(a)),.65);
        r=2.25+pow(aSeed.y,1.08)*(1.78+.28*lens);
        p=vec3(cos(a)*r,sin(a)*r,-.025);
        vAlpha=(.042+.16*lens)*(.55+.45*aSeed.z)*(1.-aSeed.y*.60);
      `:kind==='disk'?`
        // Twelve narrow curved tracks read as orbital flow, rather than sand.
        float lane=floor(aSeed.z*12.);
        r=2.78+pow(aSeed.y,1.24)*4.82;
        a=lane*6.283185/12.+(7.6-r)*.37+t*(.18+1.2/pow(r,1.4))+(aSeed.x-.5)*.04;
        p=vec3(cos(a)*r,sin(a)*r*.20+(aSeed.w-.5)*.09,sin(a)*.42);
        p.xy=mat2(.925,.38,-.38,.925)*p.xy;
        vAlpha=(.28+aSeed.w*.41)*(1.-aSeed.y*.5)*(.55+.45*smoothstep(-.42,.42,p.z));
      `:kind==='infall'?`
        // Accelerating radius and increasing angular velocity suggest gravity.
        float life=fract(aSeed.x+t*(.18+aSeed.w*.05)-aTrail*.027);
        r=7.1-4.42*pow(life,1.75);
        a=floor(aSeed.y*5.)*6.283185/5.+life*(1.15+life*.75)+(aSeed.z-.5)*.13;
        p=vec3(cos(a)*r,sin(a)*r*.25,(aSeed.w-.5)*.52);
        p.xy=mat2(.925,.38,-.38,.925)*p.xy;
        vAlpha=smoothstep(0.,.10,life)*(1.-smoothstep(.86,1.,life))*(.58+aSeed.w*.52)*(.45+life*1.3)*exp(-aTrail*.53);
      `:kind==='ribbon'?`
        // The rear flow fans into curved, angled filaments at both ends.
        float x=(aSeed.x-.5)*22.;
        float reach=abs(x);
        float wing=smoothstep(3.5,10.,reach);
        float lane=floor(aSeed.z*7.)-3.;
        float offset=lane*(.075+.22*wing*wing)+(aSeed.y-.5)*(.18+.42*wing);
        float curve=.014*x*x+sin(x*.42-t*.16)*.085+sign(x)*.42*wing*wing;
        p=vec3(x,-.15+curve+offset,-.24+(aSeed.z-.5)*.30);
        p.xy=mat2(.925,.38,-.38,.925)*p.xy;
        vAlpha=(.26+aSeed.w*.43)*(1.-smoothstep(8.5,11.,reach))*(1.-.08*abs(lane));
      `:kind==='wing'?`
        float life=fract(aSeed.x-t*.045);
        float x=(2.8+life*8.)*(aSeed.w>.5?1.:-1.);
        float reach=abs(x),wing=smoothstep(3.5,10.,reach);
        float lane=floor(aSeed.y*4.)-1.5;
        float curve=.014*x*x+sin(x*.42-t*.16)*.085+sign(x)*.42*wing*wing;
        float offset=lane*(.11+.29*wing*wing)+(aSeed.z-.5)*.075;
        p=vec3(x,-.15+curve+offset,-.12+(aSeed.z-.5)*.10);
        p.xy=mat2(.925,.38,-.38,.925)*p.xy;
        vAlpha=(.45+aSeed.z*.30)*smoothstep(2.8,3.8,reach)*(1.-smoothstep(9.1,10.8,reach));
      `:kind==='front'?`
        // A thick, layered near-camera stream crosses the dark center.
        float life=fract(aSeed.x-t*(.095+aSeed.w*.018));
        float x=(life-.5)*16.8;
        float wing=smoothstep(3.2,8.4,abs(x));
        float breadth=mix(.31,1.03,aSeed.z)+.23*smoothstep(2.5,8.4,abs(x));
        float spread=(aSeed.y-.5)*breadth+(floor(aSeed.z*7.)-3.)*.09*wing*wing;
        float arch=.020*x*x+sign(x)*.33*wing*wing;
        p=vec3(x,-.13+arch+spread+sin(x*.46-t*.20)*.065,1.24+(aSeed.z-.5)*.34);
        p.xy=mat2(.925,.38,-.38,.925)*p.xy;
        vAlpha=(.58+aSeed.w*.50)*(1.-smoothstep(6.7,8.4,abs(x)))*mix(1.,.44,aSeed.z);
      `:`
        // Dark flecks interrupt the bright middle tracks, never the white ring.
        float lane=floor(aSeed.z*12.);
        r=3.28+aSeed.y*2.7;
        a=lane*6.283185/12.+(7.6-r)*.37+t*(.18+1.2/pow(r,1.4))+(aSeed.x-.5)*.08;
        p=vec3(cos(a)*r,sin(a)*r*.20,.64);
        p.xy=mat2(.925,.38,-.38,.925)*p.xy;
        vAlpha=.12+aSeed.w*.22;
      `}
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      vec2 screen=gl_Position.xy/gl_Position.w;vec2 delta=screen-uPointer;
      float focus=exp(-dot(delta,delta)*22.)*uHeat;
      gl_Position.xy+=normalize(delta+vec2(.001))*focus*.018*gl_Position.w;
      gl_PointSize=clamp((${kind==='white'?'2.4+aSeed.z*2.0':kind==='whiteGlow'?'5.+aSeed.z*3.':kind==='halo'?'8.+aSeed.z*5.':kind==='goldRing'?'4.5+aSeed.z*2.2':kind==='front'?'3.2+aSeed.w*2.6':kind==='ribbon'?'3.3+aSeed.w*2.4':kind==='wing'?'3.2+aSeed.z*1.7':dark?'2.2+aSeed.z*1.8':'2.4+aSeed.z*1.7'})*uDpr*13./max(1.,-mv.z),.8,${kind==='whiteGlow'?'8.':white?'4.7':dark?'4.':kind==='halo'?'14.':kind==='front'||kind==='ribbon'?'6.8':kind==='wing'?'5.5':kind==='goldRing'?'7.5':'4.8'});
      vAlpha*=mix(smoothstep(-.70,-.28,screen.x),1.,uMobile);
      vColor=${white?'vec3(1.)':dark?'vec3(.005,.003,.001)':'mix(vec3(1.,.95,.80),uColor,.29)'};
      }`,fragmentShader:white||dark?pointFragment:kind==='halo'?hazeFragment:glowFragment}));
    const points=new THREE.Points(geometry,material);points.frustumCulled=false;
    points.renderOrder=dark?3:kind==='front'?2:1;
    portal.add(points);
  }
  layers.forEach(particleLayer);
  // Diffuse light sits beneath the points, so dense particle paths read as one flow.
  const glowGeometry=keep(new THREE.PlaneGeometry(23,15));
  function addFlowGlow(fragmentShader,z,renderOrder){
    const material=keep(new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader}));
    const mesh=new THREE.Mesh(glowGeometry,material);mesh.position.z=z;mesh.renderOrder=renderOrder;portal.add(mesh);
  }
  addFlowGlow(`varying vec2 vP;uniform float uTime;uniform vec3 uColor;
    void main(){
      float r=length(vP),vertical=pow(abs(vP.y)/max(r,.01),.7);
      float ripple=sin(atan(vP.y,vP.x)*7.-uTime*.24)*.025;
      float corona=exp(-pow((r-2.49-ripple)/.42,2.))*(.26+.74*vertical);
      float aura=exp(-pow((r-2.95)/.95,2.))*(.25+.75*vertical);
      float s=dot(vP,vec2(.925,.38)),n=dot(vP,vec2(-.38,.925));
      float wing=smoothstep(3.5,10.,abs(s));
      float path=-.15+.014*s*s+sin(s*.42-uTime*.16)*.085+sign(s)*.42*wing*wing;
      float width=.20+.035*abs(s);
      float streak=exp(-pow((n-path)/width,2.))*(1.-smoothstep(7.3,11.,abs(s)));
      float shoulder=exp(-pow((n-path)/(.52+.055*abs(s)),2.))*(1.-smoothstep(7.6,11.,abs(s)));
      float squeeze=exp(-pow((abs(s)-3.85)/1.65,2.))*exp(-pow((n-path)/(.78+.11*abs(s)),2.));
      float texture=.92+.08*sin(vP.x*7.+uTime*.31)*sin(vP.y*11.-uTime*.23);
      float light=(corona*.34+aura*.13+streak*.18+shoulder*.065+squeeze*.10)*texture;
      gl_FragColor=vec4(mix(uColor,vec3(1.,.96,.82),.75),light);
    }`,0.,.5);
  // Broad, turbulent accretion haze gives the ring volume without flattening its particles.
  addFlowGlow(`varying vec2 vP;uniform float uTime;uniform vec3 uColor;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
    void main(){
      float r=length(vP),a=atan(vP.y,vP.x),side=pow(abs(cos(a)),3.);
      float swirl=a*1.9-r*.94-uTime*.055;
      float texture=noise(vec2(swirl*3.,r*5.))* .55+noise(vec2(swirl*7.,r*11.))* .30+noise(vP*19.)*.15;
      float ring=smoothstep(2.10,2.38,r)*(1.-smoothstep(3.55,4.45,r));
      float compressed=exp(-pow((r-(3.25+side*.37))/.94,2.))*side;
      float fissure=.63+.37*sin(swirl*5.+texture*8.);
      float density=(ring*.20+compressed*.095)*pow(texture,1.8)*fissure;
      vec3 blue=vec3(.28,.43,.69);vec3 color=mix(blue,mix(uColor,vec3(1.,.92,.75),.45),smoothstep(2.45,3.15,r));
      gl_FragColor=vec4(color,density);
    }`,-.20,.4);
  addFlowGlow(`varying vec2 vP;uniform float uTime;uniform vec3 uColor;
    void main(){
      float s=dot(vP,vec2(.925,.38)),n=dot(vP,vec2(-.38,.925));
      float wing=smoothstep(3.2,8.4,abs(s));
      float path=-.13+.020*s*s+sin(s*.46-uTime*.20)*.065+sign(s)*.33*wing*wing;
      float core=exp(-pow((n-path)/(.10+.012*abs(s)),2.));
      float bloom=exp(-pow((n-path)/(.28+.025*abs(s)),2.));
      float fade=1.-smoothstep(6.7,8.4,abs(s));
      gl_FragColor=vec4(mix(uColor,vec3(1.,.97,.86),.78),(core*.17+bloom*.055)*fade);
    }`,1.12,1.5);
  // Distant tracks vanish behind the event horizon; the front streams have z > 1.
  const core=new THREE.Mesh(keep(new THREE.CircleGeometry(2.04,128)),keep(new THREE.MeshBasicMaterial({color:0x000000,depthWrite:true})));
  core.position.z=.55;portal.add(core);
  const starsGeometry=keep(new THREE.BufferGeometry()); const stars=new Float32Array((small?600:1700)*3); const sizes=new Float32Array(stars.length/3);
  for(let i=0;i<sizes.length;i++){stars.set([(random()-.5)*45,(random()-.5)*30,-8-random()*25],i*3);sizes[i]=random();}
  starsGeometry.setAttribute('position',new THREE.BufferAttribute(stars,3));starsGeometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  const starsMat=keep(new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aSize;uniform float uTime,uDpr;varying float vAlpha;varying vec3 vColor;void main(){vec3 p=position;p.x+=sin(uTime*.015+p.z)*.07;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(.8+aSize*1.9)*uDpr;vAlpha=.18+aSize*.38;vColor=mix(vec3(.36,.29,.19),vec3(.83,.72,.54),aSize);}`,
    fragmentShader:pointFragment}));scene.add(new THREE.Points(starsGeometry,starsMat));
  // 远景雾云：低亮度程序噪声，在镜头背后铺开空间层次。
  const nebulaMat=keep(new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float uTime,uProgress;uniform vec3 uColor;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}void main(){vec2 p=vUv;float n=noise(p*7.+uTime*.003)*.55+noise(p*17.)*.26+noise(p*41.)*.13;float band=exp(-pow((p.y-.48+(p.x-.5)*.24)*4.5,2.));float fade=smoothstep(0.,.2,p.x)*smoothstep(1.,.8,p.x)*smoothstep(0.,.15,p.y)*smoothstep(1.,.85,p.y);gl_FragColor=vec4(uColor*.56,pow(n,2.)*band*fade*.22);}`}));
  const nebula=new THREE.Mesh(keep(new THREE.PlaneGeometry(38,23)),nebulaMat);nebula.position.set(4,0,-12);scene.add(nebula);
  let width=1,height=1,mobile=false,frame=0,previous=0,time=0,speed=1,progress=0,targetProgress=0,holding=false,active=true,disposed=false;
  const pointer=new THREE.Vector2(),smoothed=new THREE.Vector2();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);mobile=width<541;uniforms.uMobile.value=mobile?1:0;uniforms.uSafeTop.value=height<700?-.13:0;renderer.setPixelRatio(Math.min(baseDpr,Math.sqrt((small?850000:4200000)/(width*height))));uniforms.uDpr.value=renderer.getPixelRatio();canvas.dataset.renderDpr=renderer.getPixelRatio().toFixed(2);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();wake();}
  let rendered=false,failed=false;
  function fail(error){if(failed||disposed)return;failed=true;active=false;cancelAnimationFrame(frame);frame=0;onFailure(error);}
  renderer.debug.onShaderError=()=>fail(new Error('WebGL shader compilation failed'));
  function render(now){frame=0;if(disposed||!active||document.hidden)return;const dt=Math.min(.05,previous?(now-previous)/1000:1/60);previous=now;
    speed+=( (holding?config.slowSpeed:1)-speed)*(1-Math.exp(-dt*(holding?9:4.5)));
    progress+=(targetProgress-progress)*(1-Math.exp(-dt*5));time+=reduced.matches?0:dt*speed;
    smoothed.lerp(pointer,1-Math.exp(-dt*3));uniforms.uTime.value=time;uniforms.uSpeed.value=speed;uniforms.uProgress.value=progress;uniforms.uColor.value.copy(start).lerp(end,THREE.MathUtils.smoothstep(progress,.18,.85));uniforms.uHeat.value*=Math.exp(-dt*1.2);
    const halfHeight=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*13;
    portal.position.set(mobile?0:halfHeight*camera.aspect*.39,mobile?-halfHeight*(height<700?.37:.26):.12,progress*1.3);
    const scale=mobile?Math.min(width/height*1.02,height<700?.44:.58):Math.min(.92,width/height*.55);portal.scale.setScalar(scale*(1+progress*.10));
    camera.position.x=smoothed.x*.24;camera.position.y=smoothed.y*.15;camera.lookAt(0,0,0);
    canvas.dataset.timeScale=speed.toFixed(3);canvas.dataset.progress=progress.toFixed(3);canvas.dataset.phase=progress>.7?'amber':'gold';canvas.dataset.particles=String(layers.reduce((sum,layer)=>sum+layer.count,0));canvas.dataset.particleLayers='white-inner,thick-gold-ring,nebula-haze,compressed-side-streams,orbital-tracks,infall,rear-ribbon,angled-wings,front-stream,dark-flecks';canvas.dataset.sceneTime=time.toFixed(3);
    try{renderer.render(scene,camera);if(failed)return;if(!rendered){rendered=true;onReady();}}
    catch(error){fail(error);return;}
    if(!frame&&(!reduced.matches || Math.abs(progress-targetProgress)>.001))frame=requestAnimationFrame(render);
  }
  function wake(){if(!frame&&!disposed&&active&&!document.hidden)frame=requestAnimationFrame(render);}
  const onVisibility=()=>{previous=0;holding=false;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();};
  const onReduced=()=>{holding=false;pointer.set(0,0);smoothed.set(0,0);wake();};
  const onLost=e=>{e.preventDefault();fail(new Error('WebGL context lost'));};
  canvas.addEventListener('webglcontextlost',onLost);document.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',onReduced);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  return {setProgress(value){targetProgress=reduced.matches?0:value;wake();},setHolding(value){holding=!!value&&!reduced.matches;wake();},setPointer(x,y){if(reduced.matches)return;pointer.set(x,y);uniforms.uPointer.value.set(x,y);uniforms.uHeat.value=1;wake();},setActive(value){active=value;if(!value){cancelAnimationFrame(frame);frame=0;previous=0;holding=false;}else wake();},dispose(){disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();canvas.removeEventListener('webglcontextlost',onLost);document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onReduced);resources.forEach(x=>x.dispose());renderer.dispose();}};
}
