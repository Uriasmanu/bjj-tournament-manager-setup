import type { Luta } from '../types/bracket';

interface BracketCardProps {
  luta: Luta;
  atletaANome?: string;
  atletaBNome?: string;
  onSelectWinner?: (luta: Luta, atletaId: string) => void;
}

function getAthleteRowStyle(athleteId: string | null | undefined, winnerId: string | null | undefined, isTbdOrBye: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: isTbdOrBye ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.15s',
    fontSize: '14px',
  };

  // Atleta indefinido ou BYE (cinza bem claro)
  if (!athleteId || isTbdOrBye) {
    return { ...base, backgroundColor: '#f8fafc', color: '#94a3b8' };
  }

  if (winnerId) {
    // Atleta Vencedor (Verde suave com texto escuro legível)
    if (winnerId === athleteId) {
      return {
        ...base,
        backgroundColor: '#f0fdf4',
        color: '#166534',
        fontWeight: 600,
        borderLeft: '4px solid #10b981',
      };
    }
    // Atleta Derrotado (Cinza opaco com tachado)
    return {
      ...base,
      backgroundColor: '#ffffff',
      color: '#94a3b8',
      opacity: 0.6,
      textDecoration: 'line-through',
    };
  }

  // Atleta Ativo/Padrão (Fundo branco com texto escuro)
  return { ...base, backgroundColor: '#ffffff', color: '#334155' };
}

export function BracketCard({ luta, atletaANome, atletaBNome, onSelectWinner }: BracketCardProps) {
  const aIsTbd = !luta.atletaAId || luta.atletaAId === 'tbd' || luta.atletaAId === 'bye';
  const bIsTbd = !luta.atletaBId || luta.atletaBId === 'tbd' || luta.atletaBId === 'bye';
  const aNome = aIsTbd ? 'A definir' : (atletaANome || 'A definir');
  const bNome = bIsTbd ? 'A definir' : (atletaBNome || 'A definir');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff', // Fundo principal branco do card
        border: '1px solid #e2e8f0', // Borda cinza clara neutra
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', // Sombra sutil para o fundo branco
        width: 224,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <div
        onClick={() => {
          if (!aIsTbd && luta.atletaAId && onSelectWinner) {
            onSelectWinner(luta, luta.atletaAId);
          }
        }}
        style={{
          ...getAthleteRowStyle(luta.atletaAId, luta.vencedorId, aIsTbd),
          borderTopLeftRadius: '7px',
          borderTopRightRadius: '7px',
          borderBottom: '1px solid #e2e8f0', // Divisor sutil entre as linhas
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 8,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {aNome}
        </span>
        {luta.vencedorId === luta.atletaAId && luta.atletaAId && (
          <span style={{ color: '#166534', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>VENCEU</span>
        )}
      </div>
      <div
        onClick={() => {
          if (!bIsTbd && luta.atletaBId && onSelectWinner) {
            onSelectWinner(luta, luta.atletaBId);
          }
        }}
        style={{
          ...getAthleteRowStyle(luta.atletaBId, luta.vencedorId, bIsTbd),
          borderBottomLeftRadius: '7px',
          borderBottomRightRadius: '7px',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: 8,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {bNome}
        </span>
        {luta.vencedorId === luta.atletaBId && luta.atletaBId && (
          <span style={{ color: '#166534', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>VENCEU</span>
        )}
      </div>
    </div>
  );
}