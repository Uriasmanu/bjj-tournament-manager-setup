export function getTipoVitoria(luta: { finalizacao?: boolean; desclassificacao?: boolean; desempateArbitro?: boolean }): { label: string; color: string; icon?: string } {
  if (luta.desclassificacao) return { label: 'Desclassificação', color: 'red', icon: '🚫' };
  if (luta.finalizacao) return { label: 'Finalização', color: 'grape', icon: '🏁' };
  if (luta.desempateArbitro) return { label: 'Desempate', color: 'orange', icon: '⚖️' };
  return { label: 'Pontos', color: 'blue', icon: '🏆' };
}
