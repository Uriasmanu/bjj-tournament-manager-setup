type Stamped = { updatedAt?: string | null }

function normalizedUpdatedAt(value: string | null | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) return ''
  return value
}

export function resolveConflict<T extends Stamped>(local: T | null, remote: T | null): T | null {
  if (!local) return remote
  if (!remote) return local
  const localUpdatedAt = normalizedUpdatedAt(local.updatedAt)
  const remoteUpdatedAt = normalizedUpdatedAt(remote.updatedAt)
  return remoteUpdatedAt > localUpdatedAt ? remote : local
}
