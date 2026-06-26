import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Store } from '../types'

export function useStore(slug: string) {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error: e }) => {
        if (e) setError('Loja não encontrada')
        else setStore(data)
        setLoading(false)
      })
  }, [slug])

  return { store, loading, error }
}
