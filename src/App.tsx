import { usePhrases } from './hooks/usePhrases'
import { Globe } from './components/Globe'
import { PhraseInput } from './components/PhraseInput'

export default function App() {
  const { phrases, insertPhrase } = usePhrases()

  const handleSubmit = async (text: string) => {
    const { error } = await insertPhrase(text)
    if (error) {
      console.error('글귀 저장 실패:', error)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Globe phrases={phrases} />
      <PhraseInput onSubmit={handleSubmit} disabled={false} />

      {/* 글귀 카운터 */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '14px',
          fontFamily: 'monospace',
        }}
      >
        {phrases.length} / 30 글귀
      </div>
    </div>
  )
}
