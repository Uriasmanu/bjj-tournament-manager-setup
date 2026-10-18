export type SyncStatus = 'online' | 'offline'

interface EventTargetLike {
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

export function subscribeSyncStatus(
  onChange: (status: SyncStatus) => void,
  target: EventTargetLike = window
): () => void {
  const onOnline = () => onChange('online')
  const onOffline = () => onChange('offline')
  target.addEventListener('online', onOnline)
  target.addEventListener('offline', onOffline)
  return () => {
    target.removeEventListener('online', onOnline)
    target.removeEventListener('offline', onOffline)
  }
}
