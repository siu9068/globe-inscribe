import { Text } from '@react-three/drei'
import { sphericalToCartesian } from '../lib/sphereUtils'
import { GLOBE_RADIUS } from '../constants'
import type { Phrase } from '../types/phrase'

interface PhraseLabelProps {
  phrase: Phrase
}

export function PhraseLabel({ phrase }: PhraseLabelProps) {
  const { x, y, z } = sphericalToCartesian(
    GLOBE_RADIUS + 0.05,
    phrase.theta,
    phrase.phi
  )

  return (
    <Text
      position={[x, y, z]}
      color={phrase.color}
      fontSize={0.12}
      maxWidth={1.5}
      textAlign="center"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.004}
      outlineColor="#000000"
      onUpdate={(self) => {
        self.lookAt(0, 0, 0)
        self.rotateY(Math.PI)
      }}
    >
      {phrase.text}
    </Text>
  )
}
