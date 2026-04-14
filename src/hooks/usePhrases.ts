import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PALETTE, MAX_PHRASES } from '../constants'
import type { Phrase } from '../types/phrase'

export function usePhrases() {
  const [phrasesById, setPhrasesById] = useState<Record<string, Phrase>>({})

  const fetchAllPhrases = async () => {
    const { data } = await supabase
      .from('phrases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_PHRASES)
    if (data) {
      setPhrasesById(Object.fromEntries(data.map((p: Phrase) => [p.id, p])))
    }
  }

  useEffect(() => {
    fetchAllPhrases()

    const channel = supabase
      .channel('phrases-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'phrases' },
        (payload: { new: Phrase }) => {
          setPhrasesById((prev) => {
            const updated = { ...prev, [payload.new.id]: payload.new }
            const entries = Object.entries(updated).sort(
              ([, a], [, b]) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            return Object.fromEntries(entries.slice(0, MAX_PHRASES))
          })
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') fetchAllPhrases()
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const insertPhrase = async (text: string) => {
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
    const { error } = await supabase
      .from('phrases')
      .insert({ text, theta, phi, color })
    return { error }
  }

  const clearAllPhrases = async () => {
    const { error } = await supabase
      .from('phrases')
      .delete()
      .not('id', 'is', null)
    if (!error) setPhrasesById({})
    return { error }
  }

  const phrases = Object.values(phrasesById)

  return { phrases, insertPhrase, clearAllPhrases }
}
