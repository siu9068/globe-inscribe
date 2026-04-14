declare module 'troika-three-text' {
  import { Material, Mesh, Object3D } from 'three'

  export interface TextGeometryProps {
    text: string
    font?: string
    fontSize?: number
    letterSpacing?: number
    lineHeight?: number
    maxWidth?: number
    textAlign?: 'left' | 'center' | 'right'
    textIndent?: number
    whiteSpace?: 'normal' | 'nowrap'
    overflowWrap?: 'normal' | 'break-word'
    direction?: 'auto' | 'ltr' | 'rtl'
  }

  export class Text extends Object3D {
    constructor()
    text: string
    font: string
    fontSize: number
    letterSpacing: number
    lineHeight: number
    maxWidth: number
    textAlign: 'left' | 'center' | 'right'
    color: number
    colorRanges?: Record<number, number>
    outlineWidth: number | string
    outlineColor: number
    strokeColor: number
    strokeWidth: number
    sync(callback?: () => void): void
  }

  export function preloadFont(
    options: {
      font?: string
      characters?: string
    },
    callback?: () => void,
  ): void

  export const troikaTextCacheKey: string
}
