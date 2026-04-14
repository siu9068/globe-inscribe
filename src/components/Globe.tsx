import { Canvas } from '@react-three/fiber'
import { preloadFont } from 'troika-three-text'
import { GlobeScene } from './GlobeScene'
import type { Phrase } from '../types/phrase'

// Preload font at module init to prevent async load delay on first text render
preloadFont({ font: undefined }, () => {})

interface GlobeProps {
  phrases: Phrase[]
}

export function Globe({ phrases }: GlobeProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ background: '#0a0a1a' }}
    >
      <GlobeScene phrases={phrases} />
    </Canvas>
  )
}
