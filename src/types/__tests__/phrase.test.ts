import { describe, it, expect } from 'vitest'
import type { Phrase } from '../phrase'

describe('Phrase type', () => {
  it('has required fields', () => {
    const phrase: Phrase = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      text: '안녕하세요',
      theta: 1.23,
      phi: 0.78,
      color: '#ff6b6b',
      created_at: '2026-04-14T00:00:00Z',
    }
    expect(phrase.id).toBeDefined()
    expect(phrase.text).toBeDefined()
    expect(phrase.theta).toBeTypeOf('number')
    expect(phrase.phi).toBeTypeOf('number')
  })
})
