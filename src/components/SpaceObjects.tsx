import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh, Group } from 'three'

/* ─────────────────────────────────────────────
   GLSL 공통: Simplex Noise + fBm
───────────────────────────────────────────── */
const NOISE_GLSL = /* glsl */ `
vec3 mod289v3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289v2(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute3(vec3 x){return mod289v3(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865,0.366025403,-0.577350269,0.024390243);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod289v2(i);
  vec3 p=permute3(permute3(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m; m=m*m;
  vec3 x2=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x2)-0.5;
  vec3 ox=floor(x2+0.5);
  vec3 a0=x2-ox;
  m*=1.79284291-0.85373472*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){v+=a*snoise(p);p*=2.1;a*=0.5;}
  return v;
}
`

const COMMON_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main(){
    vUv=uv;
    vNormal=normalize(normalMatrix*normal);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  }
`

/* ─────────────────────────────────────────────
   태양 셰이더
───────────────────────────────────────────── */
const SUN_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  ${NOISE_GLSL}
  void main(){
    float gran  = fbm(vUv*55.0+vec2(uTime*0.04,0.0));
    float gran2 = fbm(vUv*22.0-vec2(0.0,uTime*0.025));
    float cell  = gran*0.6+gran2*0.4;
    float limb  = pow(max(dot(vNormal,vec3(0.0,0.0,1.0)),0.0),0.55);
    vec3 hot  = vec3(1.0,0.98,0.82);
    vec3 mid  = vec3(1.0,0.70,0.10);
    vec3 cool = vec3(0.85,0.20,0.00);
    vec3 col  = mix(hot,mid,clamp(cell*0.8+0.1,0.0,1.0));
    col = mix(col,cool,(1.0-limb)*0.65);
    float spot = snoise(vUv*18.0+vec2(uTime*0.008,0.0));
    if(spot>0.72) col*=0.55;
    col *= (1.1+0.06*sin(uTime*1.3));
    gl_FragColor=vec4(col,1.0);
  }
`

function Sun() {
  const uniforms = useMemo(() => ({ uTime: { value: 0.0 } }), [])
  useFrame(({ clock }) => { uniforms.uTime.value = clock.getElapsedTime() })

  return (
    <group position={[18, 6, -22]}>
      {[2.5, 2.1, 1.75].map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshBasicMaterial
            color={(['#ff2200','#ff7700','#ffcc00'] as const)[i]}
            transparent opacity={[0.04, 0.07, 0.10][i]}
            depthWrite={false}
          />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[1.4, 64, 64]} />
        <shaderMaterial
          vertexShader={COMMON_VERT}
          fragmentShader={SUN_FRAG}
          uniforms={uniforms}
        />
      </mesh>
      <pointLight intensity={2.0} color="#ffe880" distance={80} decay={1.2} />
    </group>
  )
}

/* ─────────────────────────────────────────────
   목성 셰이더 — 소용돌이 밴드 + 대적점
───────────────────────────────────────────── */
const JUP_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  ${NOISE_GLSL}
  vec3 jupColor(float t){
    t=fract(t);
    if(t<0.08) return vec3(0.95,0.88,0.76);
    if(t<0.18) return vec3(0.72,0.42,0.22);
    if(t<0.28) return vec3(0.88,0.72,0.50);
    if(t<0.36) return vec3(0.55,0.28,0.12);
    if(t<0.46) return vec3(0.90,0.78,0.58);
    if(t<0.54) return vec3(0.78,0.55,0.30);
    if(t<0.64) return vec3(0.93,0.82,0.65);
    if(t<0.74) return vec3(0.65,0.38,0.18);
    if(t<0.84) return vec3(0.86,0.70,0.48);
    return vec3(0.75,0.50,0.28);
  }
  void main(){
    float t1=fbm(vec2(vUv.x*2.5+uTime*0.015, vUv.y*10.0));
    float t2=fbm(vec2(vUv.x*6.0-uTime*0.01,  vUv.y*18.0));
    float band=vUv.y+t1*0.10+t2*0.04;
    vec3 col=jupColor(band*7.0);
    col*=(0.85+0.2*sin(vUv.y*3.14159));
    // 대적점
    vec2 grsC=vec2(mod(0.25+uTime*0.003,1.0),0.35);
    float dist=length((vUv-grsC)*vec2(5.0,8.0));
    if(dist<1.0){
      float vortex=fbm(vec2(vUv.x*25.0+uTime*0.12, vUv.y*25.0-uTime*0.08));
      vec3 grsCol=mix(vec3(0.70,0.22,0.08),vec3(0.90,0.50,0.25),vortex*0.5+0.5);
      col=mix(col,grsCol,smoothstep(1.0,0.4,dist));
    }
    gl_FragColor=vec4(col,1.0);
  }
`

function Jupiter() {
  const uniforms = useMemo(() => ({ uTime: { value: 0.0 } }), [])
  useFrame(({ clock }) => { uniforms.uTime.value = clock.getElapsedTime() })

  return (
    <mesh position={[-16, 4, -18]}>
      <sphereGeometry args={[0.9, 64, 64]} />
      <shaderMaterial
        vertexShader={COMMON_VERT}
        fragmentShader={JUP_FRAG}
        uniforms={uniforms}
      />
    </mesh>
  )
}

/* ─────────────────────────────────────────────
   토성 — 셰이더 본체 + 카시니 간극 고리
───────────────────────────────────────────── */
const SAT_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  ${NOISE_GLSL}
  void main(){
    float n=fbm(vec2(vUv.x*3.0+uTime*0.005, vUv.y*9.0))*0.06;
    float band=fract((vUv.y+n)*5.0);
    vec3 col;
    if(band<0.30)      col=vec3(0.92,0.84,0.68);
    else if(band<0.55) col=vec3(0.80,0.72,0.54);
    else if(band<0.75) col=vec3(0.88,0.80,0.62);
    else               col=vec3(0.76,0.68,0.50);
    gl_FragColor=vec4(col,1.0);
  }
`

function makeSaturnRingTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024; c.height = 1
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 1024, 0)
  // C ring (dim)
  g.addColorStop(0.00, 'rgba(180,160,120,0.0)')
  g.addColorStop(0.08, 'rgba(190,170,130,0.35)')
  g.addColorStop(0.20, 'rgba(200,180,140,0.45)')
  // B ring (brightest)
  g.addColorStop(0.22, 'rgba(220,200,160,0.92)')
  g.addColorStop(0.30, 'rgba(245,225,185,1.00)')
  g.addColorStop(0.42, 'rgba(235,215,175,0.95)')
  // Cassini Division
  g.addColorStop(0.435,'rgba(15,10,5,0.08)')
  g.addColorStop(0.46, 'rgba(5,3,2,0.03)')
  g.addColorStop(0.485,'rgba(15,10,5,0.08)')
  // A ring
  g.addColorStop(0.50, 'rgba(215,195,155,0.85)')
  g.addColorStop(0.65, 'rgba(210,190,150,0.80)')
  g.addColorStop(0.76, 'rgba(200,180,140,0.65)')
  // outer fade
  g.addColorStop(0.87, 'rgba(195,175,135,0.28)')
  g.addColorStop(1.00, 'rgba(190,170,130,0.00)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1024, 1)
  return new THREE.CanvasTexture(c)
}

function Saturn() {
  const uniforms = useMemo(() => ({ uTime: { value: 0.0 } }), [])
  const ringTex  = useMemo(makeSaturnRingTex, [])
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
    if (groupRef.current) groupRef.current.rotation.y += 0.0006
  })

  return (
    <group ref={groupRef} position={[12, -7, -16]} rotation={[0.3, 0.5, 0.2]}>
      <mesh>
        <sphereGeometry args={[0.6, 64, 64]} />
        <shaderMaterial
          vertexShader={COMMON_VERT}
          fragmentShader={SAT_FRAG}
          uniforms={uniforms}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 1.55, 128]} />
        <meshBasicMaterial
          map={ringTex}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ─────────────────────────────────────────────
   지구 — NASA 텍스처 + 구름 + 대기 글로우
───────────────────────────────────────────── */
function Earth() {
  const [earthTex, cloudTex] = useTexture([
    '/textures/earth.jpg',
    '/textures/earth_clouds.png',
  ])
  const earthRef = useRef<Mesh>(null)
  const cloudRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.08
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.11
  })

  return (
    <group position={[-10, -6, -10]}>
      <mesh>
        <sphereGeometry args={[0.50, 24, 24]} />
        <meshBasicMaterial color="#3366ff" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      <mesh ref={earthRef}>
        <sphereGeometry args={[0.45, 64, 64]} />
        <meshStandardMaterial map={earthTex} roughness={0.7} metalness={0} />
      </mesh>
      <mesh ref={cloudRef}>
        <sphereGeometry args={[0.457, 64, 64]} />
        <meshStandardMaterial map={cloudTex} transparent opacity={0.55} depthWrite={false} roughness={1} />
      </mesh>
    </group>
  )
}

/* ─────────────────────────────────────────────
   export
───────────────────────────────────────────── */
export function SpaceObjects() {
  return (
    <>
      <Sun />
      <Jupiter />
      <Saturn />
      <Earth />
    </>
  )
}
