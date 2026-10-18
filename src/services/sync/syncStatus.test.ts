import { describe, it, expect, vi } from 'vitest'
import { subscribeSyncStatus } from './syncStatus'

function createFakeWindow() {
  const listeners: Record<string, (() => void)[]> = { online: [], offline: [] }
  return {
    addEventListener: vi.fn((type: string, listener: () => void) => {
      listeners[type].push(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: () => void) => {
      listeners[type] = listeners[type].filter(l => l !== listener)
    }),
    fire: (type: 'online' | 'offline') => listeners[type].forEach(l => l()),
  }
}

describe('subscribeSyncStatus', () => {
  it('chama onChange com "offline" quando o evento offline dispara', () => {
    const fakeWindow = createFakeWindow()
    const onChange = vi.fn()
    subscribeSyncStatus(onChange, fakeWindow)
    fakeWindow.fire('offline')
    expect(onChange).toHaveBeenCalledWith('offline')
  })

  it('chama onChange com "online" quando o evento online dispara', () => {
    const fakeWindow = createFakeWindow()
    const onChange = vi.fn()
    subscribeSyncStatus(onChange, fakeWindow)
    fakeWindow.fire('online')
    expect(onChange).toHaveBeenCalledWith('online')
  })

  it('retorna uma função de unsubscribe que remove os listeners', () => {
    const fakeWindow = createFakeWindow()
    const onChange = vi.fn()
    const unsubscribe = subscribeSyncStatus(onChange, fakeWindow)
    unsubscribe()
    expect(fakeWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(fakeWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
