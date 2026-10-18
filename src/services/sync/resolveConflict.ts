type Stamped = { updatedAt?: string | null }

export function resolveConflict<T extends Stamped>(local: T | null, remote: T | null): T | null {
  if (!local) return remote
  if (!remote) return local
  const localUpdatedAt = local.updatedAt ?? ''
  const remoteUpdatedAt = remote.updatedAt ?? ''
  return remoteUpdatedAt > localUpdatedAt ? remote : local
}
