import { OrbitControls } from '@react-three/drei'
import { GLOBE_RADIUS } from '../constants'
import { PhraseLabel } from './PhraseLabel'
import type { Phrase } from '../types/phrase'

interface GlobeSceneProps {
  phrases: Phrase[]
}

export function GlobeScene({ phrases }: GlobeSceneProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      {/* 구체 메시 */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 와이어프레임 오버레이 */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#4d96ff"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

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
        autoRotateSpeed={0.5}
      />
    </>
  )
}
