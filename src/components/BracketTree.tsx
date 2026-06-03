import { useState, useEffect, useRef, useMemo } from 'react';
import { useMantineTheme } from '@mantine/core';
import type { Chave, Luta } from '../types/bracket';

interface BracketTreeProps {
  chave: Chave;
  getAtletaNome: (id: string | null) => string;
  onSelectWinner?: (luta: Luta, vencedorId: string) => void;
}

const IconTrophy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8m-4-6l-3 3m6 0l-3-3M6 3h12a2 2 0 0 1 2 2v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V5a2 2 0 0 1 2-2z" />
  </svg>
);

function isPlaceholder(id: string | null | undefined): boolean {
  return !id || id === 'tbd' || id === 'bye';
}

function buildConnections(chave: Chave): { from: string; to: string }[] {
  const sorted = [...chave.lutas].sort((a, b) => a.rodada - b.rodada || a.ordem - b.ordem);
  const winnerToLuta = new Map<string, Luta>();
  for (const l of sorted) {
    if (l.vencedorId) winnerToLuta.set(l.vencedorId, l);
  }

  const queue: Luta[] = [];
  const connections: { from: string; to: string }[] = [];

  for (const luta of sorted) {
    if (luta.rodada === 1) {
      queue.push(luta);
      continue;
    }

    let sourceSlots = 0;
    for (const slot of [luta.atletaAId, luta.atletaBId]) {
      if (slot === 'tbd' || slot === '') {
        sourceSlots++;
      } else if (slot) {
        const sourceLuta = winnerToLuta.get(slot);
        if (sourceLuta && sourceLuta.rodada < luta.rodada) sourceSlots++;
      }
    }

    for (let i = 0; i < sourceSlots; i++) {
      const sourceIdx = queue.findIndex(s => s.rodada < luta.rodada);
      if (sourceIdx < 0) break;
      const source = queue.splice(sourceIdx, 1)[0];
      connections.push({ from: `m${source.id}`, to: `m${luta.id}` });
    }
    queue.push(luta);
  }

  return connections;
}

export function BracketTree({ chave, getAtletaNome, onSelectWinner }: BracketTreeProps) {
  const theme = useMantineTheme();
  const [paths, setPaths] = useState<string[]>([]);
  const bracketRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => {
    const byRodada = new Map<number, Luta[]>();
    for (const l of chave.lutas) {
      if (!byRodada.has(l.rodada)) byRodada.set(l.rodada, []);
      byRodada.get(l.rodada)!.push(l);
    }
    const rodadas = Array.from(byRodada.keys()).sort((a, b) => a - b);
    return rodadas.map(r => byRodada.get(r)!.sort((a, b) => a.ordem - b.ordem));
  }, [chave.lutas]);

  const connections = useMemo(() => buildConnections(chave), [chave]);

  useEffect(() => {
    const drawConnections = () => {
      if (!bracketRef.current) return;
      const newPaths: string[] = [];
      const container = bracketRef.current.getBoundingClientRect();

      connections.forEach(({ from, to }) => {
        const el1 = document.getElementById(from);
        const el2 = document.getElementById(to);
        if (el1 && el2) {
          const rect1 = el1.getBoundingClientRect();
          const rect2 = el2.getBoundingClientRect();

          const x1 = rect1.right - container.left;
          const y1 = rect1.top + rect1.height / 2 - container.top;
          const x2 = rect2.left - container.left;
          const y2 = rect2.top + rect2.height / 2 - container.top;

          newPaths.push(`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`);
        }
      });
      setPaths(newPaths);
    };

    drawConnections();
    window.addEventListener('resize', drawConnections);
    return () => window.removeEventListener('resize', drawConnections);
  }, [connections, chave]);

  return (
    <div style={{ minHeight: '100%', backgroundColor: theme.colors.gray[0], padding: 24, color: theme.black, borderRadius: 8 }}>
      <div
        ref={bracketRef}
        style={{
          position: 'relative',
          display: 'flex',
          gap: 48,
          justifyContent: 'center',
          alignItems: 'stretch',
          minHeight: 320,
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {paths.map((path, i) => (
            <path key={i} d={path} stroke={theme.colors.gray[4]} strokeWidth={2} fill="none" />
          ))}
        </svg>

        {columns.map((columnLutas, colIdx) => (
          <div
            key={colIdx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: columnLutas.length === 1 ? 'center' : 'space-around',
              gap: colIdx === 0 ? 24 : undefined,
            }}
          >
            {columnLutas.map(luta => (
              <Card
                key={luta.id}
                luta={luta}
                id={`m${luta.id}`}
                getAtletaNome={getAtletaNome}
                onSelectWinner={onSelectWinner}
                theme={theme}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CardProps {
  luta: Luta;
  id: string;
  getAtletaNome: (id: string | null) => string;
  onSelectWinner?: (luta: Luta, vencedorId: string) => void;
  theme: ReturnType<typeof useMantineTheme>;
}

function Card({ luta, id, getAtletaNome, onSelectWinner, theme }: CardProps) {
  return (
    <div
      id={id}
      style={{
        width: 256,
        backgroundColor: theme.white,
        border: `1px solid ${theme.colors.gray[3]}`,
        borderRadius: 8,
        padding: 12,
        boxShadow: theme.shadows.sm,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 10, color: theme.colors.gray[5], fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
        LUTA #{luta.ordem}
      </div>
      {([1, 2] as const).map(slot => {
        const slotId = slot === 1 ? luta.atletaAId : luta.atletaBId;
        const placeholder = isPlaceholder(slotId);
        const isWinner = !!luta.vencedorId && slotId === luta.vencedorId;
        const nome = placeholder ? 'A definir...' : getAtletaNome(slotId);
        return (
          <div
            key={slot}
            style={{
              padding: 8,
              borderRadius: 4,
              marginBottom: slot === 1 ? 4 : 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: isWinner ? theme.colors.green[1] : theme.colors.gray[0],
            }}
          >
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.black }}>
                {nome}
              </div>
            </div>
            {!placeholder && slotId && onSelectWinner && (
              <button
                onClick={() => onSelectWinner(luta, slotId)}
                style={{
                  padding: 4,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  color: theme.colors.blue[6],
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.colors.gray[2])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                aria-label="Marcar vencedor"
              >
                <IconTrophy />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
