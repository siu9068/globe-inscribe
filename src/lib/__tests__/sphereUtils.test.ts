import { describe, it, expect } from 'vitest'
import { sphericalToCartesian } from '../sphereUtils'

describe('sphericalToCartesian', () => {
  it('converts north pole (phi=0) correctly', () => {
    const { x, y, z } = sphericalToCartesian(2, 0, 0)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(2)
    expect(z).toBeCloseTo(0)
  })

  it('converts equator (phi=PI/2, theta=0) correctly', () => {
    const { x, y, z } = sphericalToCartesian(2, 0, Math.PI / 2)
    expect(x).toBeCloseTo(2)
    expect(y).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)
  })

  it('scales with radius', () => {
    const r1 = sphericalToCartesian(1, 0, Math.PI / 2)
    const r3 = sphericalToCartesian(3, 0, Math.PI / 2)
    expect(r3.x).toBeCloseTo(r1.x * 3)
  })

  it('resulting vector length equals radius', () => {
    const { x, y, z } = sphericalToCartesian(2, 1.23, 0.78)
    const length = Math.sqrt(x * x + y * y + z * z)
    expect(length).toBeCloseTo(2)
  })
})
