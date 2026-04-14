import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { Mesh, Group } from 'three'

/* ── 캔버스로 행성 텍스처 생성 ── */

function makeSunTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 256
  const ctx = c.getContext('2d')!
  const grad = ctx.createRadialGradient(256, 128, 0, 256, 128, 256)
  grad.addColorStop(0,   '#fff7a0')
  grad.addColorStop(0.3, '#ffdd00')
  grad.addColorStop(0.6, '#ff8800')
  grad.addColorStop(1,   '#cc3300')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 256)
  // 표면 흑점 노이즈
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 256
    const r = Math.random() * 8 + 2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180,60,0,${Math.random() * 0.4})`
    ctx.fill()
  }
  return new THREE.CanvasTexture(c)
}

function makeJupiterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 256
  const ctx = c.getContext('2d')!
  const bands = [
    '#c8a07a','#a0704a','#d4b090','#b07840','#e0c0a0',
    '#906040','#c89060','#a06030','#d4a878','#8a5a38',
    '#c09070','#b07848',
  ]
  const bh = 256 / bands.length
  bands.forEach((col, i) => {
    const grad = ctx.createLinearGradient(0, i * bh, 0, (i + 1) * bh)
    grad.addColorStop(0, col)
    grad.addColorStop(1, shiftColor(col, -15))
    ctx.fillStyle = grad
    ctx.fillRect(0, i * bh, 512, bh + 1)
  })
  // 대적점
  ctx.beginPath()
  ctx.ellipse(160, 128, 30, 18, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(160,60,30,0.7)'
  ctx.fill()
  return new THREE.CanvasTexture(c)
}

function makeSaturnTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 256
  const ctx = c.getContext('2d')!
  const bands = [
    '#e8d8b0','#d4c090','#e0cc98','#c8b078','#dcc898',
    '#bca068','#d4bc88','#c4aa70',
  ]
  const bh = 256 / bands.length
  bands.forEach((col, i) => {
    ctx.fillStyle = col
    ctx.fillRect(0, i * bh, 512, bh + 1)
  })
  return new THREE.CanvasTexture(c)
}

function makeSaturnRingTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 1
  const ctx = c.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 512, 0)
  grad.addColorStop(0,    'rgba(200,180,140,0)')
  grad.addColorStop(0.1,  'rgba(200,180,140,0.6)')
  grad.addColorStop(0.3,  'rgba(220,200,160,0.9)')
  grad.addColorStop(0.5,  'rgba(180,160,120,0.7)')
  grad.addColorStop(0.7,  'rgba(210,190,150,0.85)')
  grad.addColorStop(0.85, 'rgba(190,170,130,0.5)')
  grad.addColorStop(1,    'rgba(200,180,140,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 1)
  return new THREE.CanvasTexture(c)
}

function shiftColor(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, (n >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount))
  return `rgb(${r},${g},${b})`
}

/* ── 개별 행성 컴포넌트 ── */

function Sun() {
  const tex = useMemo(makeSunTexture, [])
  const meshRef = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05
  })
  return (
    <group position={[18, 6, -22]}>
      {/* 코로나 글로우 */}
      <mesh>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.08} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.55, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.1} />
      </mesh>
      {/* 태양 본체 */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.4, 48, 48]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <pointLight intensity={1.5} color="#ffe8a0" distance={60} decay={1} />
    </group>
  )
}

function Jupiter() {
  const tex = useMemo(makeJupiterTexture, [])
  const meshRef = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.12
  })
  return (
    <mesh ref={meshRef} position={[-16, 4, -18]}>
      <sphereGeometry args={[0.9, 48, 48]} />
      <meshStandardMaterial map={tex} roughness={0.8} metalness={0} />
    </mesh>
  )
}

function Saturn() {
  const bodyTex = useMemo(makeSaturnTexture, [])
  const ringTex = useMemo(makeSaturnRingTexture, [])
  const groupRef = useRef<Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.08
  })
  return (
    <group ref={groupRef} position={[12, -7, -16]} rotation={[0.25, 0.4, 0.18]}>
      {/* 행성 본체 */}
      <mesh>
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshStandardMaterial map={bodyTex} roughness={0.9} metalness={0} />
      </mesh>
      {/* 고리 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1.5, 80]} />
        <meshBasicMaterial
          map={ringTex}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  )
}

function Earth() {
  const [earthTex] = useTexture(['/textures/earth.jpg'])
  const meshRef = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.1
  })
  return (
    <mesh ref={meshRef} position={[-10, -6, -10]}>
      <sphereGeometry args={[0.45, 48, 48]} />
      <meshStandardMaterial map={earthTex} roughness={0.7} metalness={0} />
    </mesh>
  )
}

/* ── 전체 우주 배경 오브젝트 ── */

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
