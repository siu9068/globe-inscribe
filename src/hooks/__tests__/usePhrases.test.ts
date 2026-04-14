import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePhrases } from '../usePhrases'

// Mock entire Supabase client
vi.mock('../../lib/supabase', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((cb) => {
      cb('SUBSCRIBED')
      return mockChannel
    }),
  }
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'abc-1',
          text: '첫 번째 글귀',
          theta: 1.0,
          phi: 0.5,
          color: '#ff6b6b',
          created_at: '2026-04-14T00:00:00Z',
        },
      ],
      error: null,
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })
  return {
    supabase: {
      from: mockFrom,
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    },
  }
})

describe('usePhrases', () => {
  it('fetches initial phrases on mount', async () => {
    const { result } = renderHook(() => usePhrases())

    await waitFor(() => {
      expect(result.current.phrases).toHaveLength(1)
    })

    expect(result.current.phrases[0].text).toBe('첫 번째 글귀')
  })

  it('insertPhrase returns no error on success', async () => {
    const { result } = renderHook(() => usePhrases())

    await waitFor(() => result.current.phrases.length > 0)

    let insertResult: { error: unknown }
    await act(async () => {
      insertResult = await result.current.insertPhrase('새 글귀')
    })

    expect(insertResult!.error).toBeNull()
  })
})
