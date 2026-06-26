import type { OpeningHours, DayKey } from '../types'

const DAY_MAP: DayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

export function isStoreOpenNow(
  isOpenToggle: boolean,
  openingHours: OpeningHours | null
): boolean {
  if (!openingHours || !openingHours.enabled) {
    return isOpenToggle
  }

  const now = new Date()
  const dayKey = DAY_MAP[now.getDay()]
  const daySchedule = openingHours.days[dayKey]

  if (!daySchedule.open) return false

  const [fromH, fromM] = daySchedule.from.split(':').map(Number)
  const [toH, toM] = daySchedule.to.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const fromMinutes = fromH * 60 + fromM
  const toMinutes = toH * 60 + toM

  return currentMinutes >= fromMinutes && currentMinutes <= toMinutes && isOpenToggle
}

export function getStoreStatusLabel(
  isOpenToggle: boolean,
  openingHours: OpeningHours | null
): { isOpen: boolean; label: string; sublabel: string | null } {
  const isOpen = isStoreOpenNow(isOpenToggle, openingHours)

  if (!openingHours || !openingHours.enabled) {
    return { isOpen, label: isOpen ? 'Aberto' : 'Fechado', sublabel: null }
  }

  const now = new Date()
  const dayKey = DAY_MAP[now.getDay()]
  const daySchedule = openingHours.days[dayKey]

  if (!daySchedule.open) {
    return { isOpen: false, label: 'Fechado hoje', sublabel: null }
  }

  return {
    isOpen,
    label: isOpen ? 'Aberto' : 'Fechado',
    sublabel: isOpen
      ? `Fecha às ${daySchedule.to}`
      : `Abre às ${daySchedule.from}`,
  }
}
