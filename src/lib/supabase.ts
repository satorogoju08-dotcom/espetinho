import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const isValidUrl = (s: string) => { try { return Boolean(new URL(s)) } catch { return false } }

export const supabaseConfigured =
  !!url && !!key && isValidUrl(url) && !url.includes('your_supabase')

export const supabase = supabaseConfigured
  ? createClient(url!, key!)
  : createClient('https://placeholder.supabase.co', 'placeholder')
