// Avisos breves que confirman una acción ("Consulta aceptada").
import { useSyncExternalStore } from 'react'

export interface Toast { id: number; text: string }

let toasts: Toast[] = []
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(text: string) {
  const id = ++seq
  toasts = [...toasts.slice(-2), { id, text }]
  emit()
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit() }, 3200)
}

export function useToasts(): Toast[] {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => toasts, () => toasts)
}
