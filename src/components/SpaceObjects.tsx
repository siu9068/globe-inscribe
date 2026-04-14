import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh, Group } from 'three'

/* ─────────────────────────────────────────────
   GLSL 공통: 3D Simplex Noise + fBm
   3D 좌표 기반 → 구체 UV 이음새(seam) 없음
───────────────────────────────────────────── */
const NOISE_GLSL = /* glsl */ `
vec3 mod289v3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289v4(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute4(vec4 x){return mod289v4(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise3(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute4(permute4(permute4(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm3(vec3 p){
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){v+=a*snoise3(p);p*=2.1;a*=0.5;}
  return v;
}
`

/* ─────────────────────────────────────────────
   태양 코로나/플레어 셰이더
───────────────────────────────────────────── */
const CORONA_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main(){
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const CORONA_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  ${NOISE_GLSL}
  void main(){
    vec3 n = normalize(vPosition);
    float viewDot = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    float edge = 1.0 - viewDot;
    float t = uTime;

    // 베이스 코로나 — 가장자리 글로우
    float corona = pow(edge, 1.8);

    // 유기적 연기/불꽃 노이즈 (다층 난류)
    float smoke1 = fbm3(n * 2.5 + vec3(0.0, t * 0.07, t * 0.03));
    float smoke2 = fbm3(n * 1.8 - vec3(t * 0.04, 0.0, t * 0.05));
    float smoke3 = snoise3(n * 4.0 + vec3(t * 0.09, t * 0.06, 0.0));
    float turbulence = smoke1 * 0.5 + smoke2 * 0.3 + smoke3 * 0.2;

    // 불꽃 플룸 — 유기적으로 분출되는 연기
    float plume = 0.0;
    for(int i = 0; i < 5; i++){
      float fi = float(i);
      vec3 pDir = normalize(vec3(
        sin(fi * 1.256 + t * 0.02),
        cos(fi * 0.942 + t * 0.015),
        sin(fi * 2.094 + t * 0.018)
      ));
      float align = max(dot(n, pDir), 0.0);
      float pNoise = snoise3(n * 3.5 + pDir * t * 0.04);
      plume += pow(align, 6.0) * edge * (0.6 + pNoise * 0.4);
    }

    float intensity = corona * (0.35 + turbulence * 0.4) + plume * 0.5;

    // 불꽃 색상 — 붉은 연기/화염
    vec3 fireHot  = vec3(1.0, 0.70, 0.20);
    vec3 fireMid  = vec3(1.0, 0.35, 0.05);
    vec3 fireCool = vec3(0.55, 0.10, 0.02);
    vec3 col = mix(fireHot, fireMid, edge * 0.6 + turbulence * 0.15);
    col = mix(col, fireCool, pow(edge, 0.6) * 0.5);

    intensity *= 1.0 + 0.04 * sin(t * 1.2);

    float alpha = clamp(intensity * 1.1, 0.0, 0.8);
    gl_FragColor = vec4(col * intensity * 1.5, alpha);
  }
`

/* ─────────────────────────────────────────────
   태양 — NASA 텍스처 + 코로나/플레어 애니메이션
───────────────────────────────────────────── */
function Sun() {
  const sunTex = useTexture('/textures/sun.jpg')
  const uniforms = useMemo(() => ({ uTime: { value: 0.0 } }), [])
  const meshRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
    if (meshRef.current) meshRef.current.rotation.y += 0.0004
  })

  return (
    <group position={[18, 6, -22]}>
      {/* 외부 글로우 (Additive blending) */}
      {[3.2, 2.6, 2.1].map((r, i) => (
        <mesh key={i}>
          <sphereGeometry args={[r, 24, 24]} />
          <meshBasicMaterial
            color={(['#ff2200', '#ff6600', '#ffaa00'] as const)[i]}
            transparent
            opacity={[0.025, 0.045, 0.07][i]}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* 코로나 / 플레어 셰이더 레이어 */}
      <mesh>
        <sphereGeometry args={[1.85, 64, 64]} />
        <shaderMaterial
          vertexShader={CORONA_VERT}
          fragmentShader={CORONA_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 태양 본체 — 실제 텍스처 + 자체 발광 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshStandardMaterial
          map={sunTex}
          emissiveMap={sunTex}
          emissive="#ff8800"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      <pointLight intensity={2.5} color="#ffe880" distance={80} decay={1.2} />
    </group>
  )
}

/* ─────────────────────────────────────────────
   목성 — NASA 텍스처
───────────────────────────────────────────── */
function Jupiter() {
  const jupTex = useTexture('/textures/jupiter.jpg')
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.06
  })

  return (
    <group position={[-16, 4, -18]}>
      {/* 대기 글로우 */}
      <mesh>
        <sphereGeometry args={[0.96, 24, 24]} />
        <meshBasicMaterial
          color="#cc8855"
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <meshStandardMaterial map={jupTex} roughness={0.8} metalness={0} />
      </mesh>
    </group>
  )
}

/* ─────────────────────────────────────────────
   토성 — NASA 텍스처 + 고리 텍스처
───────────────────────────────────────────── */
function Saturn() {
  const [satTex, ringTex] = useTexture([
    '/textures/saturn.jpg',
    '/textures/saturn_ring.png',
  ])
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.04
  })

  return (
    <group ref={groupRef} position={[12, -7, -16]} rotation={[0.3, 0.5, 0.2]}>
      {/* 대기 글로우 */}
      <mesh>
        <sphereGeometry args={[0.65, 24, 24]} />
        <meshBasicMaterial
          color="#ccaa66"
          transparent
          opacity={0.03}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.6, 64, 64]} />
        <meshStandardMaterial map={satTex} roughness={0.8} metalness={0} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 1.55, 128]} />
        <meshBasicMaterial
          map={ringTex}
          side={THREE.DoubleSide}
          transparent
          opacity={0.25}
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
