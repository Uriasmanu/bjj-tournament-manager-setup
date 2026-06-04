import { useState, useEffect, useRef, useMemo } from 'react';
import { useMantineTheme } from '@mantine/core';
import type { Chave, Luta } from '../types/bracket';

interface BracketTreeProps {
  chave: Chave;
  getAtletaNome: (id: string | null) => string;
  onSelectWinner?: (luta: Luta, vencedorId: string) => void;
}

function isPlaceholder(id: string | null | undefined): boolean {
  return !id || id === 'tbd' || id === 'bye';
}

const ROUND_LABELS: Record<number, string> = {
  1: 'PRIMEIRA RODADA',
  2: 'QUARTAS DE FINAL',
  3: 'SEMIFINAL',
  4: 'FINAL',
};

function getRoundLabel(rodada: number, totalRodadas: number): string | undefined {
  const offset = Math.max(0, 4 - totalRodadas);
  return ROUND_LABELS[rodada + offset];
}

function getLutasByRound(chave: Chave): Map<number, Luta[]> {
  const byRodada = new Map<number, Luta[]>();
  for (const l of chave.lutas) {
    if (!byRodada.has(l.rodada)) byRodada.set(l.rodada, []);
    byRodada.get(l.rodada)!.push(l);
  }
  for (const [, lutas] of byRodada) {
    lutas.sort((a, b) => a.ordem - b.ordem);
  }
  return byRodada;
}

function buildConnections(chave: Chave, athleteIds?: string[]): { from: string; to: string }[] {
  if (chave.totalAtletas === 3) {
    const r1 = chave.lutas.find(l => l.rodada === 1);
    const r2 = chave.lutas.find(l => l.rodada === 2);
    const r3 = chave.lutas.find(l => l.rodada === 3);
    const conns: { from: string; to: string }[] = [];
    if (r1 && r2) conns.push({ from: `m${r1.id}`, to: `m${r2.id}` });
    if (r2) conns.push({ from: 'bye-card', to: `m${r2.id}` });
    if (r2 && r3) conns.push({ from: `m${r2.id}`, to: `m${r3.id}` });
    if (r3?.vencedorId) conns.push({ from: `m${r3.id}`, to: 'champion-card' });
    return conns;
  }

  if (chave.totalAtletas === 5) {
    const luta1 = chave.lutas.find(l => l.ordem === 1);
    const luta2 = chave.lutas.find(l => l.ordem === 2);
    const luta3 = chave.lutas.find(l => l.ordem === 3);
    const luta4 = chave.lutas.find(l => l.ordem === 4);
    const luta5 = chave.lutas.find(l => l.ordem === 5);
    const luta6 = chave.lutas.find(l => l.ordem === 6);
    const conns: { from: string; to: string }[] = [];
    if (luta1 && luta5) conns.push({ from: `m${luta1.id}`, to: `m${luta5.id}` });
    if (luta2 && luta4) conns.push({ from: `m${luta2.id}`, to: `m${luta4.id}` });
    if (luta3 && luta4) conns.push({ from: `m${luta3.id}`, to: `m${luta4.id}` });
    if (luta4 && luta6) conns.push({ from: `m${luta4.id}`, to: `m${luta6.id}` });
    if (luta5 && luta6) conns.push({ from: `m${luta5.id}`, to: `m${luta6.id}` });
    if (luta6?.vencedorId) conns.push({ from: `m${luta6.id}`, to: 'champion-card' });
    return conns;
  }

  if (chave.totalAtletas === 16) {
    return buildConnections16(chave, athleteIds);
  }

  const byRodada = getLutasByRound(chave);
  const rodadas = Array.from(byRodada.keys()).sort((a, b) => a - b);
  const conns: { from: string; to: string }[] = [];

  for (let r = 0; r < rodadas.length - 1; r++) {
    const currentRound = byRodada.get(rodadas[r])!;
    const nextRound = byRodada.get(rodadas[r + 1])!;
    const fightsPerNext = currentRound.length / nextRound.length;

    for (let i = 0; i < currentRound.length; i++) {
      conns.push({ from: `m${currentRound[i].id}`, to: `m${nextRound[Math.floor(i / fightsPerNext)].id}` });
    }
  }

  const lastRound = rodadas[rodadas.length - 1];
  if (lastRound) {
    const lastLutas = byRodada.get(lastRound)!;
    for (const l of lastLutas) {
      if (l.vencedorId && l.vencedorId !== 'tbd') {
        conns.push({ from: `m${l.id}`, to: 'champion-card' });
      }
    }
  }

  return conns;
}

function buildConnections16(chave: Chave, athleteIds?: string[]): { from: string; to: string }[] {
  const conns: { from: string; to: string }[] = [];
  const lutas = [...chave.lutas].sort((a, b) => a.ordem - b.ordem);

  if (athleteIds) {
    for (let i = 0; i < 8; i++) {
      conns.push({ from: `a${athleteIds[i * 2]}`, to: `m${lutas[i].id}` });
      conns.push({ from: `a${athleteIds[i * 2 + 1]}`, to: `m${lutas[i].id}` });
    }
  }

  for (let i = 0; i < 8; i++) {
    conns.push({ from: `m${lutas[i].id}`, to: `m${lutas[8 + Math.floor(i / 2)].id}` });
  }
  for (let i = 8; i < 12; i++) {
    conns.push({ from: `m${lutas[i].id}`, to: `m${lutas[12 + Math.floor((i - 8) / 2)].id}` });
  }
  for (let i = 12; i < 14; i++) {
    conns.push({ from: `m${lutas[i].id}`, to: `m${lutas[14].id}` });
  }

  const final16 = lutas[14];
  if (final16?.vencedorId && final16.vencedorId !== 'tbd') {
    conns.push({ from: `m${final16.id}`, to: 'champion-card' });
  }

  return conns;
}

export function BracketTree({ chave, getAtletaNome, onSelectWinner }: BracketTreeProps) {
  const theme = useMantineTheme();
  const [paths, setPaths] = useState<string[]>([]);
  const bracketRef = useRef<HTMLDivElement>(null);

  const isPyramidLayout = chave.totalAtletas === 3;
  const isFiveLayout = chave.totalAtletas === 5;
  const is16Layout = chave.totalAtletas === 16;

  const columns = useMemo(() => {
    if (isPyramidLayout) {
      const r1 = chave.lutas.find(l => l.rodada === 1);
      const r2 = chave.lutas.find(l => l.rodada === 2);
      const r3 = chave.lutas.find(l => l.rodada === 3);
      const cols: (Luta | ('bye' | 'champion'))[][] = [];

      const col1: (Luta | 'bye')[] = [];
      if (r1) col1.push(r1);
      col1.push('bye');
      cols.push(col1);

      if (r2) cols.push([r2]);
      if (r3) cols.push([r3]);

      const hasChampion = r3?.vencedorId != null && r3.vencedorId !== 'tbd';
      if (hasChampion) cols.push(['champion']);

      return cols;
    }

    if (isFiveLayout) {
      const luta1 = chave.lutas.find(l => l.ordem === 1);
      const luta2 = chave.lutas.find(l => l.ordem === 2);
      const luta3 = chave.lutas.find(l => l.ordem === 3);
      const luta4 = chave.lutas.find(l => l.ordem === 4);
      const luta5 = chave.lutas.find(l => l.ordem === 5);
      const luta6 = chave.lutas.find(l => l.ordem === 6);
      const cols: (Luta | 'bye5' | 'champion')[][] = [];

      const col1: (Luta | 'bye5')[] = [];
      if (luta1) col1.push(luta1);
      if (luta2) col1.push(luta2);
      if (luta3) col1.push(luta3);
      cols.push(col1);

      const col2: (Luta | 'bye5')[] = [];
      if (luta4) col2.push(luta4);
      if (luta5) col2.push(luta5);
      cols.push(col2);

      const col3: (Luta | 'champion')[] = [];
      if (luta6) col3.push(luta6);
      const hasChampion = luta6?.vencedorId != null && luta6.vencedorId !== 'tbd';
      if (hasChampion) col3.push('champion');
      if (col3.length > 0) cols.push(col3);

      return cols;
    }

    if (is16Layout) {
      const r1 = chave.lutas.filter(l => l.rodada === 1).sort((a, b) => a.ordem - b.ordem);
      const r2 = chave.lutas.filter(l => l.rodada === 2).sort((a, b) => a.ordem - b.ordem);
      const r3 = chave.lutas.filter(l => l.rodada === 3).sort((a, b) => a.ordem - b.ordem);
      const r4 = chave.lutas.filter(l => l.rodada === 4).sort((a, b) => a.ordem - b.ordem);
      const cols: (Luta | 'champion')[][] = [r1, r2, r3, r4];

      const r4Winner = r4[0]?.vencedorId != null && r4[0].vencedorId !== 'tbd';
      if (r4Winner) cols.push(['champion']);

      return cols;
    }

    const byRodada = new Map<number, Luta[]>();
    for (const l of chave.lutas) {
      if (!byRodada.has(l.rodada)) byRodada.set(l.rodada, []);
      byRodada.get(l.rodada)!.push(l);
    }
    const rodadas = Array.from(byRodada.keys()).sort((a, b) => a - b);
    const cols: (Luta | 'champion')[][] = rodadas.map(r => byRodada.get(r)!.sort((a, b) => a.ordem - b.ordem));

    const ultimaRodada = cols[cols.length - 1] as Luta[] | undefined;
    const hasChampion = ultimaRodada?.some(l => l.vencedorId != null && l.vencedorId !== 'tbd');
    if (hasChampion) cols.push(['champion']);

    return cols;
  }, [chave, isPyramidLayout, isFiveLayout, is16Layout]);

  const athleteIds16 = useMemo(() => {
    if (!is16Layout) return undefined;
    return chave.posicoesAtletas;
  }, [chave, is16Layout]);

  const connections = useMemo(() => buildConnections(chave, athleteIds16), [chave, athleteIds16]);

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
  }, [connections]);

  return (
    <div style={{ minHeight: '100%', backgroundColor: theme.colors.gray[0], padding: 24, color: theme.black, borderRadius: 8 }}>
      <div
        ref={bracketRef}
        style={{
          position: 'relative',
          display: 'flex',
          gap: isPyramidLayout ? 40 : (isFiveLayout ? 40 : (is16Layout ? 32 : 48)),
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

        {is16Layout && (
          <ColumnAthletes16
            side="left"
            chave={chave}
            getAtletaNome={getAtletaNome}
            theme={theme}
          />
        )}

        {columns.map((columnLutas, colIdx) => {
          const firstLuta = columnLutas.find((item): item is Luta => item !== 'bye' && item !== 'champion');
          const rodada = firstLuta?.rodada;
          const label = rodada ? getRoundLabel(rodada, chave.totalRodadas) : undefined;

          return (
            <div
              key={colIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: columnLutas.length === 1 ? 'center' : 'space-around',
                gap: 24,
              }}
            >
              {label && (
                <div style={{ fontSize: 10, color: theme.colors.gray[5], fontWeight: 700, marginBottom: 8, textAlign: 'center', letterSpacing: 1 }}>
                  {label}
                </div>
              )}
              {columnLutas.map(item => {
                if (item === 'bye' || item === 'bye5') {
                  return <ByeCard key={item} chave={chave} getAtletaNome={getAtletaNome} theme={theme} />;
                }
                if (item === 'champion') {
                  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada));
                  const r = chave.lutas.find(l => l.rodada === maxRodada);
                  return <ChampionCard key="champion" r3={r} getAtletaNome={getAtletaNome} theme={theme} />;
                }
                return (
                  <Card
                    key={item.id}
                    luta={item}
                    id={`m${item.id}`}
                    getAtletaNome={getAtletaNome}
                    onSelectWinner={onSelectWinner}
                    theme={theme}
                  />
                );
              })}
            </div>
          );
        })}

        {is16Layout && (
          <ColumnAthletes16
            side="right"
            chave={chave}
            getAtletaNome={getAtletaNome}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}

function AthleteCard({
  athleteId,
  pos,
  getAtletaNome,
  theme,
}: {
  athleteId: string;
  pos: number;
  getAtletaNome: (id: string | null) => string;
  theme: ReturnType<typeof useMantineTheme>;
}) {
  const nome = getAtletaNome(athleteId);
  const isBye = athleteId === 'bye';

  if (isBye) {
    return (
      <div
        id={`a${athleteId}`}
        style={{
          width: 160,
          backgroundColor: theme.colors.gray[1],
          border: `1px dashed ${theme.colors.gray[4]}`,
          borderRadius: 6,
          padding: '8px 12px',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.colors.gray[5], backgroundColor: theme.colors.gray[2], borderRadius: 3, padding: '1px 5px' }}>
          BYE
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.colors.gray[5] }}>---</span>
      </div>
    );
  }

  return (
    <div
      id={`a${athleteId}`}
      style={{
        width: 160,
        backgroundColor: theme.white,
        border: `1px solid ${theme.colors.gray[3]}`,
        borderRadius: 6,
        padding: '8px 12px',
        boxShadow: theme.shadows.xs,
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: theme.colors.gray[5], backgroundColor: theme.colors.gray[1], borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
        #{pos}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: theme.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {nome}
      </span>
    </div>
  );
}

function ColumnAthletes16({
  side,
  chave,
  getAtletaNome,
  theme,
}: {
  side: 'left' | 'right';
  chave: Chave;
  getAtletaNome: (id: string | null) => string;
  theme: ReturnType<typeof useMantineTheme>;
}) {
  const athletes: { athleteId: string; pos: number }[] = [];

  for (let i = 0; i < chave.posicoesAtletas.length; i += 2) {
    if (side === 'left' && i < chave.posicoesAtletas.length) {
      athletes.push({ athleteId: chave.posicoesAtletas[i], pos: i + 1 });
    }
    if (side === 'right' && i + 1 < chave.posicoesAtletas.length) {
      athletes.push({ athleteId: chave.posicoesAtletas[i + 1], pos: i + 2 });
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        gap: 24,
      }}
    >
      <div style={{ fontSize: 10, color: theme.colors.gray[5], fontWeight: 700, marginBottom: 8, textAlign: 'center', letterSpacing: 1 }}>
        {side === 'left' ? 'ATLETAS' : ''}
      </div>
      {athletes.map(({ athleteId, pos }) => (
        <AthleteCard
          key={athleteId}
          athleteId={athleteId}
          pos={pos}
          getAtletaNome={getAtletaNome}
          theme={theme}
        />
      ))}
    </div>
  );
}

function ByeCard({ chave, getAtletaNome, theme }: { chave: Chave; getAtletaNome: (id: string | null) => string; theme: ReturnType<typeof useMantineTheme> }) {
  const byeId = chave.totalAtletas === 5 ? chave.posicoesAtletas[4] : chave.posicoesAtletas[2];
  return (
    <div
      id="bye-card"
      style={{
        width: 200,
        backgroundColor: theme.colors.gray[1],
        border: `1px dashed ${theme.colors.gray[4]}`,
        borderRadius: 8,
        padding: 10,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 10, color: theme.colors.gray[5], fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>
        BYE
      </div>
      <div style={{ padding: 8, borderRadius: 4, backgroundColor: theme.colors.blue[0], display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.colors.blue[7], backgroundColor: theme.colors.blue[2], borderRadius: 4, padding: '1px 6px' }}>BYE</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: theme.black }}>{getAtletaNome(byeId)}</span>
      </div>
    </div>
  );
}

function ChampionCard({ r3, getAtletaNome, theme }: { r3: Luta | undefined; getAtletaNome: (id: string | null) => string; theme: ReturnType<typeof useMantineTheme> }) {
  const championName = r3?.vencedorId ? getAtletaNome(r3.vencedorId) : '';
  return (
    <div
      id="champion-card"
      style={{
        width: 200,
        backgroundColor: theme.colors.yellow[0],
        border: `2px solid ${theme.colors.yellow[6]}`,
        borderRadius: 8,
        padding: 10,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 10, color: theme.colors.yellow[8], fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>
        CAMPEÃO
      </div>
      <div style={{ padding: '20px 8px', borderRadius: 4, backgroundColor: theme.colors.yellow[1], display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.colors.yellow[9] }}>
          {championName || '---'}
        </span>
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
        width: 200,
        backgroundColor: theme.white,
        border: `1px solid ${theme.colors.gray[3]}`,
        borderRadius: 8,
        padding: 10,
        boxShadow: theme.shadows.sm,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 10, color: theme.colors.gray[5], fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>
        LUTA #{luta.ordem}
      </div>
      {([1, 2] as const).map(slot => {
        const slotId = slot === 1 ? luta.atletaAId : luta.atletaBId;
        const placeholder = isPlaceholder(slotId);
        const isWinner = !!luta.vencedorId && slotId === luta.vencedorId;
        const isDisqualified = !!luta.desclassificadoId && slotId === luta.desclassificadoId && luta.status !== 'pending';
        const nome = placeholder ? 'A definir...' : getAtletaNome(slotId);
        return (
          <div
            key={slot}
            style={{
              padding: '6px 8px',
              borderRadius: 4,
              marginBottom: slot === 1 ? 4 : 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: isDisqualified ? theme.colors.red[1] : isWinner ? theme.colors.green[1] : theme.colors.gray[0],
              cursor: !placeholder && slotId && onSelectWinner ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (!placeholder && slotId && onSelectWinner) {
                onSelectWinner(luta, slotId);
              }
            }}
          >
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: placeholder ? theme.colors.gray[5] : theme.black }}>
                {nome}
              </div>
            </div>
            {isWinner && (
              <span style={{ color: theme.colors.green[7], fontSize: 10, fontWeight: 700, flexShrink: 0 }}>VENCEU</span>
            )}
            {isDisqualified && (
              <span style={{ color: theme.colors.red[7], fontSize: 10, fontWeight: 700, flexShrink: 0 }}>DESCLASSIFICADO</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
