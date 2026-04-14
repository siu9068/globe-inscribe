import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhraseInput } from '../PhraseInput'

describe('PhraseInput', () => {
  it('renders input and submit button', () => {
    render(<PhraseInput onSubmit={vi.fn()} disabled={false} />)
    expect(screen.getByPlaceholderText('글귀를 입력하세요...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새기기' })).toBeInTheDocument()
  })

  it('calls onSubmit with trimmed text and clears input', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PhraseInput onSubmit={onSubmit} disabled={false} />)

    const input = screen.getByPlaceholderText('글귀를 입력하세요...') as HTMLInputElement
    await userEvent.type(input, '  안녕하세요  ')
    await userEvent.click(screen.getByRole('button', { name: '새기기' }))

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith('안녕하세요'))
    await vi.waitFor(() => expect(input.value).toBe(''))
  })

  it('does not call onSubmit when input is empty', async () => {
    const onSubmit = vi.fn()
    render(<PhraseInput onSubmit={onSubmit} disabled={false} />)
    fireEvent.click(screen.getByRole('button', { name: '새기기' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('limits input to 100 characters', async () => {
    render(<PhraseInput onSubmit={vi.fn()} disabled={false} />)
    const input = screen.getByPlaceholderText('글귀를 입력하세요...')
    expect(input).toHaveAttribute('maxLength', '100')
  })

  it('disables button and input when disabled prop is true', () => {
    render(<PhraseInput onSubmit={vi.fn()} disabled={true} />)
    expect(screen.getByPlaceholderText('글귀를 입력하세요...')).toBeDisabled()
    expect(screen.getByRole('button', { name: '새기기' })).toBeDisabled()
  })
})
