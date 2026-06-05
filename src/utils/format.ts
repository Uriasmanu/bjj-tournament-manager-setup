export function formatarDuracao(segundos: number | undefined | null): string {
  if (segundos === undefined || segundos === null || !Number.isFinite(segundos) || segundos < 0) {
    return '—';
  }
  const total = Math.floor(segundos);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
