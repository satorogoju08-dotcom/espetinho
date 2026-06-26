import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

function lighten(rgb: [number, number, number], t: number): string {
  return toHex(rgb[0] + (255 - rgb[0]) * t, rgb[1] + (255 - rgb[1]) * t, rgb[2] + (255 - rgb[2]) * t)
}

function darken(rgb: [number, number, number], t: number): string {
  return toHex(rgb[0] * (1 - t), rgb[1] * (1 - t), rgb[2] * (1 - t))
}

export function applyStoreTheme(primaryColor: string): void {
  const rgb = hexToRgb(primaryColor)
  if (!rgb) return
  const root = document.documentElement
  root.style.setProperty('--color-brand-50', lighten(rgb, 0.93))
  root.style.setProperty('--color-brand-100', lighten(rgb, 0.82))
  root.style.setProperty('--color-brand-500', primaryColor)
  root.style.setProperty('--color-brand-600', darken(rgb, 0.12))
  root.style.setProperty('--color-brand-700', darken(rgb, 0.28))
}

export const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export const getImageFallback = () =>
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14" font-family="sans-serif"%3ESem imagem%3C/text%3E%3C/svg%3E'

export function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}
