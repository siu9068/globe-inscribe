import { OrbitControls, useTexture, Stars } from '@react-three/drei'
import { GLOBE_RADIUS } from '../constants'
import { PhraseLabel } from './PhraseLabel'
import { SpaceObjects } from './SpaceObjects'
import type { Phrase } from '../types/phrase'

interface GlobeSceneProps {
  phrases: Phrase[]
}

export function GlobeScene({ phrases }: GlobeSceneProps) {
  const [moonMap, bumpMap] = useTexture([
    '/textures/moon.jpg',
    '/textures/moon_bump.jpg',
  ])

  return (
    <>
      {/* 별이 가득한 우주 배경 */}
      <Stars radius={100} depth={60} count={4000} factor={4} fade />

      {/* 달 표면을 비추는 태양광 — 한쪽에서만 강하게 */}
      <ambientLight intensity={0.08} />
      <directionalLight
        position={[6, 3, 4]}
        intensity={2.2}
        color="#fffbe8"
      />

      {/* 달 구체 — 텍스처 + 범프맵으로 분화구 깊이감 */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
        <meshStandardMaterial
          map={moonMap}
          bumpMap={bumpMap}
          bumpScale={0.25}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* 배경 우주 천체 */}
      <SpaceObjects />

      {/* 글귀 레이블 목록 */}
      {phrases.map((phrase) => (
        <PhraseLabel key={phrase.id} phrase={phrase} />
      ))}

      {/* 마우스/터치 회전 */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  )
}
