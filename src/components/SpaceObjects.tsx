import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh, Group } from 'three'

/* ─────────────────────────────────────────────
   GLSL 공통: Simplex Noise + fBm
───────────────────────────────────────────── */
const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;
  vec3 h=abs(x)-.5;
  vec3 ox=floor(x+.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  for(int i=0;i<6;i++){v+=a*snoise(p);p*=2.1;a*=.5;}
  return v;
}
`

/* ─────────────────────────────────────────────
   태양 — 대류 셀 + 림 다크닝 + 애니메이션
───────────────────────────────────────────── */
const SUN_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main(){
    vNormal=normalize(normalMatrix*normal);
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  }
`
const SUN_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec2 vUv;
  ${NOISE_GLSL}
  void main(){
    vec2 uv=vUv;
    // 대류 셀 (granulation)
    float gran = fbm(uv*55.+vec2(uTime*.04,0.));
    float gran2= fbm(uv*22.-vec2(0.,uTime*.025));
    float cell = gran*.6+gran2*.4;
    // 림 다크닝
    float limb=dot(vNormal,vec3(0.,0.,1.));
    limb=pow(max(limb,0.),.55);
    // 색상 매핑
    vec3 hot =vec3(1.,.98,.82);        // 중심 흰-노랑
    vec3 mid =vec3(1.,.70,.10);        // 표면 주황
    vec3 cool=vec3(.85,.20,.00);       // 가장자리 적색
    vec3 col=mix(hot,mid,clamp(cell*.8+.1,0.,1.));
    col=mix(col,cool,(1.-limb)*.65);
    // 흑점
    float spot=snoise(uv*18.+vec2(uTime*.008,0.));
    if(spot>.72) col*=.55;
    // 밝기
    col*=(1.1+.06*sin(uTime*1.3));
    gl_FragColor=vec4(col,1.);
  }
`

function Sun() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: SUN_VERT,
    fragmentShader: SUN_FRAG,
    uniforms: { uTime: { value: 0 } },
  }), [])

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <group position={[18, 6, -22]}>
      {/* 코로나 글로우 레이어 3겹 */}
      {[2.5, 2.1, 1.75].map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[r, 24, 24]} />
          <meshBasicMaterial
            color={i === 0 ? '#ff4400' : i === 1 ? '#ff8800' : '#ffcc00'}
            transparent opacity={[0.04, 0.07, 0.10][i]}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* 태양 본체 */}
      <mesh material={material} ref={matRef as any}>
        <sphereGeometry args={[1.4, 64, 64]} />
      </mesh>
      <pointLight intensity={2.0} color="#ffe880" distance={80} decay={1.2} />
    </group>
  )
}

/* ─────────────────────────────────────────────
   목성 — 소용돌이 밴드 + 대적점 셰이더
───────────────────────────────────────────── */
const JUP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  }
`
const JUP_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  ${NOISE_GLSL}
  vec3 jupColor(float t){
    t=fract(t);
    if(t<.08) return vec3(.95,.88,.76);
    if(t<.18) return vec3(.72,.42,.22);
    if(t<.28) return vec3(.88,.72,.50);
    if(t<.36) return vec3(.55,.28,.12);
    if(t<.46) return vec3(.90,.78,.58);
    if(t<.54) return vec3(.78,.55,.30);
    if(t<.64) return vec3(.93,.82,.65);
    if(t<.74) return vec3(.65,.38,.18);
    if(t<.84) return vec3(.86,.70,.48);
    return vec3(.75,.50,.28);
  }
  void main(){
    vec2 uv=vUv;
    // 밴드 사행 (turbulence)
    float t1=fbm(vec2(uv.x*2.5+uTime*.015, uv.y*10.));
    float t2=fbm(vec2(uv.x*6. -uTime*.01,  uv.y*18.));
    float band=uv.y + t1*.10 + t2*.04;
    vec3 col=jupColor(band*7.);
    // 위도별 밝기 변화
    col*=(.85+.2*sin(uv.y*3.14159));
    // 대적점 (GRS) — 남반구 약 35%
    vec2 grsCenter=vec2(mod(.25+uTime*.003,1.),.35);
    vec2 d=(uv-grsCenter)*vec2(5.,8.);
    float dist=length(d);
    if(dist<1.){
      // 소용돌이 색
      float vortex=fbm(vec2(uv.x*25.+uTime*.12,uv.y*25.-uTime*.08));
      vec3 grsCol=mix(vec3(.70,.22,.08),vec3(.90,.50,.25),vortex*.5+.5);
      col=mix(col,grsCol,smoothstep(1.,.4,dist));
    }
    gl_FragColor=vec4(col,1.);
  }
`

function Jupiter() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: JUP_VERT,
    fragmentShader: JUP_FRAG,
    uniforms: { uTime: { value: 0 } },
  }), [])
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })
  return (
    <mesh material={material} ref={matRef as any} position={[-16, 4, -18]}>
      <sphereGeometry args={[0.9, 64, 64]} />
    </mesh>
  )
}

/* ─────────────────────────────────────────────
   토성 — 카시니 간극 포함 고리
───────────────────────────────────────────── */
const SAT_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  ${NOISE_GLSL}
  void main(){
    vec2 uv=vUv;
    float n=fbm(vec2(uv.x*3.+uTime*.005,uv.y*9.))*.06;
    float band=uv.y+n;
    float t=fract(band*5.);
    vec3 col;
    if(t<.3)       col=vec3(.92,.84,.68);
    else if(t<.55) col=vec3(.80,.72,.54);
    else if(t<.75) col=vec3(.88,.80,.62);
    else           col=vec3(.76,.68,.50);
    gl_FragColor=vec4(col,1.);
  }
`

function makeSaturnRingTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024; c.height = 1
  const ctx = c.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 1024, 0)
  // C ring (dim inner)
  grad.addColorStop(0.00, 'rgba(180,160,120,0.0)')
  grad.addColorStop(0.08, 'rgba(190,170,130,0.35)')
  grad.addColorStop(0.20, 'rgba(200,180,140,0.45)')
  // B ring (brightest)
  grad.addColorStop(0.22, 'rgba(220,200,160,0.90)')
  grad.addColorStop(0.30, 'rgba(240,220,180,1.00)')
  grad.addColorStop(0.42, 'rgba(235,215,175,0.95)')
  // Cassini division (gap)
  grad.addColorStop(0.44, 'rgba(10,10,10,0.10)')
  grad.addColorStop(0.48, 'rgba(5,5,5,0.05)')
  grad.addColorStop(0.50, 'rgba(10,10,10,0.10)')
  // A ring
  grad.addColorStop(0.52, 'rgba(215,195,155,0.85)')
  grad.addColorStop(0.65, 'rgba(210,190,150,0.80)')
  grad.addColorStop(0.75, 'rgba(200,180,140,0.65)')
  // Outer fade
  grad.addColorStop(0.85, 'rgba(195,175,135,0.30)')
  grad.addColorStop(1.00, 'rgba(190,170,130,0.00)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 1)
  return new THREE.CanvasTexture(c)
}

function Saturn() {
  const satMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: JUP_VERT,
    fragmentShader: SAT_FRAG,
    uniforms: { uTime: { value: 0 } },
  }), [])
  const ringTex = useMemo(makeSaturnRingTexture, [])
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    if (groupRef.current) groupRef.current.rotation.y += 0.0006
  })

  return (
    <group ref={groupRef} position={[12, -7, -16]} rotation={[0.3, 0.5, 0.2]}>
      <mesh material={satMat} ref={matRef as any}>
        <sphereGeometry args={[0.6, 64, 64]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 1.55, 128]} />
        <meshBasicMaterial map={ringTex} side={THREE.DoubleSide} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ─────────────────────────────────────────────
   지구 — 실제 텍스처 + 구름층 + 대기 글로우
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
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.11 // 구름이 살짝 더 빠름
  })

  return (
    <group position={[-10, -6, -10]}>
      {/* 대기 글로우 */}
      <mesh>
        <sphereGeometry args={[0.50, 32, 32]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {/* 지구 본체 */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[0.45, 64, 64]} />
        <meshStandardMaterial map={earthTex} roughness={0.7} metalness={0} />
      </mesh>
      {/* 구름층 */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[0.455, 64, 64]} />
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
