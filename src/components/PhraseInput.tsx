import { useState, FormEvent } from 'react'

interface PhraseInputProps {
  onSubmit: (text: string) => Promise<void>
  disabled: boolean
}

export function PhraseInput({ onSubmit, disabled }: PhraseInputProps) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    setSubmitting(true)
    await onSubmit(trimmed)
    setValue('')
    setSubmitting(false)
  }

  const isDisabled = disabled || submitting

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        gap: '8px',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="글귀를 입력하세요..."
        maxLength={100}
        disabled={isDisabled}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: '16px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={isDisabled}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: '#4d96ff',
          color: '#fff',
          fontSize: '16px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
        }}
      >
        새기기
      </button>
    </form>
  )
}
