import * as THREE from 'three';

// A closed world-space sky, not a screen-space wallpaper. The archive camera
// rotates both these stars and the photographic dome with exactly one matrix.
export function createStarfieldDome({ compact = false } = {}) {
  const sky = new THREE.Group();
  sky.name = 'starry-archive-universe';
  const nebula = new THREE.Mesh(new THREE.SphereGeometry(220, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 direction;
      void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float;
      varying vec3 direction;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.17,.31,.53));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float cloud(vec3 p){return .38*noise(p)+.25*noise(p*2.03)+.17*noise(p*4.07)
        +.11*noise(p*8.13)+.06*noise(p*16.3)+.03*noise(p*32.7);}
      void main(){vec3 d=normalize(direction);
        float n=cloud(d*12.+7.);
        float latitude=dot(d,normalize(vec3(.52,.78,.35)));
        float band=exp(-pow((latitude+(n-.5)*.23)/.18,2.));
        float dust=smoothstep(.32,.65,cloud(d*48.-5.));
        float core=pow(max(0.,dot(d,normalize(vec3(.3,.2,-1.)))),5.);
        vec3 ink=vec3(.009,.019,.044);
        float filaments=pow(cloud(d*105.+11.),2.);
        float lane=smoothstep(.42,.58,cloud(d*24.-9.));
        // Spatially distinct gas regions, not a rainbow painted over every star.
        float violet=smoothstep(-.6,.65,d.x*.7+d.z*.6);
        float rose=pow(max(0.,dot(d,normalize(vec3(-.65,.5,-.55)))),5.);
        vec3 gas=mix(vec3(.12,.32,.52),vec3(.43,.19,.57),violet);
        gas=mix(gas,vec3(.67,.22,.35),rose*.8);
        gas=mix(gas,vec3(.82,.63,.39),core*.46);
        gas=mix(gas,vec3(.66,.72,.86),smoothstep(.53,.7,n)*.55);
        vec3 color=ink+gas*band*(.18+1.65*dust+filaments)*(.7+.5*core);
        color*=1.-band*lane*.48;
        gl_FragColor=vec4(color,1.);}`,
  }));
  nebula.name = 'closed-galaxy-shell';
  nebula.renderOrder = -2;
  sky.add(nebula);
  let seed = 20260912;
  const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const count = compact ? 10000 : 24000;
  const positions = [], sizes = [], colors = [];
  const normal=new THREE.Vector3(.52,.78,.35).normalize();
  const tangent=new THREE.Vector3().crossVectors(normal,new THREE.Vector3(0,1,0)).normalize();
  const bitangent=new THREE.Vector3().crossVectors(normal,tangent);
  for (let i=0;i<count;i++) {
    const y=random()*2-1, angle=random()*Math.PI*2, r=Math.sqrt(1-y*y);
    const direction=new THREE.Vector3(r*Math.cos(angle),y,r*Math.sin(angle));
    // Half the stars fill every direction; the rest resolve the Milky Way
    // into individual pinpoints rather than a blurred luminous stripe.
    if(i%2===0){
      const latitude=(random()+random()+random()-1.5)*.17;
      direction.copy(tangent).multiplyScalar(Math.cos(angle))
        .addScaledVector(bitangent,Math.sin(angle)).addScaledVector(normal,latitude).normalize();
    }
    positions.push(direction.x*175,direction.y*175,direction.z*175);
    sizes.push(i%137===0 ? 9+random()*5 : 1.1+random()*1.3);
    const warmth=random(), brightness=.65+random()*.35;
    const tint=warmth<.2 ? [1,.64,.35] : warmth<.45 ? [.52,.76,1] : [1,.94,.84];
    colors.push(...tint.map(c=>c*brightness));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('starSize',new THREE.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const stars = new THREE.Points(geometry,new THREE.ShaderMaterial({
    transparent:true, depthWrite:false, vertexColors:true,
    uniforms:{pixelRatio:{value:Math.min(window.devicePixelRatio||1,2)}},
    vertexShader:`attribute float starSize;uniform float pixelRatio;varying vec3 tint;varying float size;
      void main(){tint=color;size=starSize;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=starSize*pixelRatio;}`,
    fragmentShader:`varying vec3 tint;varying float size;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);
      if(r>1.)discard;
      float light=1.-smoothstep(.25,1.,r);
      if(size>5.){float core=exp(-r*r*110.);float halo=exp(-r*r*9.)*.26;
        float rays=(exp(-abs(p.x)*65.)+exp(-abs(p.y)*65.))*pow(1.-r,3.)*.45;
        light=core+halo+rays;}
      gl_FragColor=vec4(mix(tint,vec3(1.),light*.3),min(1.,light));}`,
  }));
  stars.name = 'fixed-world-stars';
  stars.renderOrder = -1;
  sky.add(stars);
  sky.add(createPlanets(compact));
  return sky;
}

// Stylized celestial scenery, all beyond the photographic dome (radius 42).
// Real sphere normals provide lit hemispheres, terminators and atmospheric rims.
function createPlanets(compact) {
  const planets=new THREE.Group();
  planets.name='world-space-planets';
  const specs=[
    {name:'amber-ringed-giant',pos:[-53,32,-90],radius:10,type:0,a:[.32,.16,.08],b:[.87,.67,.39],air:[.95,.61,.25],ring:true},
    {name:'azure-ocean',pos:[44,-30,-105],radius:6.5,type:1,a:[.015,.09,.26],b:[.12,.49,.46],air:[.18,.6,1]},
    {name:'rust-rock',pos:[98,16,-5],radius:4.7,type:2,a:[.19,.04,.025],b:[.76,.3,.12],air:[.72,.2,.08]},
    {name:'violet-giant',pos:[55,-28,92],radius:9,type:0,a:[.18,.08,.3],b:[.57,.42,.73],air:[.55,.32,.9]},
    {name:'distant-moon',pos:[-35,48,105],radius:2.8,type:2,a:[.17,.19,.23],b:[.55,.6,.65],air:[.3,.4,.6]},
    {name:'teal-ice-giant',pos:[-115,-18,12],radius:7.5,type:0,a:[.025,.18,.22],b:[.25,.72,.68],air:[.25,.8,.8]},
    {name:'polar-ice',pos:[15,110,15],radius:5,type:2,a:[.15,.3,.43],b:[.7,.86,.91],air:[.4,.7,1]},
    {name:'small-copper',pos:[-15,-110,-20],radius:3.5,type:2,a:[.25,.1,.045],b:[.63,.42,.2],air:[.75,.4,.1]},
  ];
  const vertexShader=`varying vec3 localP;varying vec3 worldP;varying vec3 worldN;
    void main(){localP=position;vec4 w=modelMatrix*vec4(position,1.);worldP=w.xyz;
      worldN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
  const noise=`float hash(vec3 p){p=fract(p*.3183099+vec3(.17,.31,.53));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){return .5*noise(p)+.27*noise(p*2.04)+.15*noise(p*4.1)+.08*noise(p*8.2);}`;
  const sphere=new THREE.SphereGeometry(1,compact?40:64,compact?28:48);
  for(const [index,spec] of specs.entries()) {
    const system=new THREE.Group();system.name=spec.name;system.position.set(...spec.pos);
    system.userData.radius=spec.radius;
    const light=system.position.clone().negate().normalize().add(new THREE.Vector3(-.8,.7,.15)).normalize();
    const material=new THREE.ShaderMaterial({
      uniforms:{baseA:{value:new THREE.Vector3(...spec.a)},baseB:{value:new THREE.Vector3(...spec.b)},
        atmosphere:{value:new THREE.Vector3(...spec.air)},kind:{value:spec.type},seed:{value:index*7.13},lightDir:{value:light}},
      vertexShader,
      fragmentShader:`precision highp float;
        varying vec3 localP;varying vec3 worldP;varying vec3 worldN;
        uniform vec3 baseA,baseB,atmosphere,lightDir;uniform float kind,seed;
        ${noise}
        void main(){vec3 p=normalize(localP),n=normalize(worldN),v=normalize(cameraPosition-worldP);
          float terrain=fbm(p*7.+seed);float grain=fbm(p*62.+seed);
          vec3 surface;
          if(kind<.5){float warp=fbm(p*9.+seed);
            float bands=.5+.5*sin(p.y*26.+warp*6.+sin(p.x*6.)*.7);
            float threads=.5+.5*sin(p.y*110.+warp*12.);
            surface=mix(baseA,baseB,.26+.48*bands+.12*threads+.14*terrain);}
          else if(kind<1.5){float land=smoothstep(.48,.55,terrain);
            surface=mix(baseA,baseB,land);float clouds=smoothstep(.54,.68,fbm(p*15.+vec3(seed,3,1)));
            surface=mix(surface,vec3(.83,.9,.95),clouds*.8);}
          else{surface=mix(baseA,baseB,smoothstep(.25,.72,terrain));
            surface*=.66+.5*grain;surface*=1.-.35*smoothstep(.6,.7,noise(p*42.));}
          float lit=max(0.,dot(n,lightDir));
          float rim=pow(1.-max(0.,dot(n,v)),3.7);
          vec3 color=surface*(.035+.965*pow(lit,.65));
          color+=atmosphere*rim*.45*smoothstep(-.25,.4,dot(n,lightDir));
          gl_FragColor=vec4(color,1.);}`,
    });
    const body=new THREE.Mesh(sphere,material);body.name='planet-surface';
    body.scale.setScalar(spec.radius);body.rotation.set(.18,0,-.25+index*.11);system.add(body);
    const air=new THREE.Mesh(sphere,new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,
      uniforms:{tint:{value:new THREE.Vector3(...spec.air)}},vertexShader,
      fragmentShader:`varying vec3 worldP;varying vec3 worldN;uniform vec3 tint;
        void main(){float edge=1.-abs(dot(normalize(worldN),normalize(cameraPosition-worldP)));
          gl_FragColor=vec4(tint,pow(max(0.,edge),6.)*.23);}`,
    }));
    air.name='atmosphere';air.scale.setScalar(spec.radius*1.045);system.add(air);
    if(spec.ring){
      const ring=new THREE.Mesh(new THREE.RingGeometry(spec.radius*1.3,spec.radius*2.05,128),new THREE.ShaderMaterial({
        side:THREE.DoubleSide,transparent:true,depthWrite:false,
        uniforms:{radius:{value:spec.radius}},
        vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec3 p;uniform float radius;
          void main(){float r=length(p.xy)/radius;
            float detail=1.-smoothstep(.5,2.4,fwidth(r)*120.);
            float stripe=.5+(.32*sin(r*120.)+.12*sin(r*337.))*detail;
            float gap=1.-smoothstep(.025,.045,abs(r-1.73));
            float alpha=(.45+.22*stripe)*(1.-gap*.88);
            vec3 c=mix(vec3(.47,.34,.21),vec3(.81,.65,.43),stripe);
            gl_FragColor=vec4(c,alpha);}`,
      }));
      ring.name='dust-rings';ring.rotation.set(1.03,.2,-.35);system.add(ring);
    }
    planets.add(system);
  }
  return planets;
}
