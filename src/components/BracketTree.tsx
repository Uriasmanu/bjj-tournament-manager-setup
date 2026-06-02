import type { Chave, Luta } from '../types/bracket';
import { BracketCard } from './BracketCard';

interface BracketTreeProps {
  chave: Chave;
  getAtletaNome: (id: string | null) => string;
  onSelectWinner?: (luta: Luta, vencedorId: string) => void;
}

const LINE_COLOR = '#94a3b8';

function getRoundLabel(roundNum: number, totalRodadas: number): string {
  const deTrasParaFrente = totalRodadas - roundNum + 1;

  if (deTrasParaFrente === 1) return 'Grande Final';
  if (deTrasParaFrente === 2) return 'Semifinal';
  if (deTrasParaFrente === 3) return 'Quartas de Final';
  if (deTrasParaFrente === 4) return 'Oitavas de Final';

  return `Rodada ${roundNum}`;
}

export function BracketTree({ chave, getAtletaNome, onSelectWinner }: BracketTreeProps) {
  const totalRodadas = chave.totalRodadas || 1;
  const rounds = groupByRound(chave.lutas);

  // Calcula dinamicamente o número esperado de cards por rodada
  // Se a primeira rodada tiver 4 cards, o array será [4, 2, 1]
  const firstRoundCount = rounds[0]?.length || 0;
  const expectedCounts = Array.from({ length: totalRodadas }, (_, i) => 
    Math.max(1, Math.ceil(firstRoundCount / Math.pow(2, i)))
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 64,
        minWidth: 800,
        overflowX: 'auto',
        padding: '32px 16px',
        userSelect: 'none',
        backgroundColor: '#ffffff',
      }}
    >
      {rounds.map((roundLutas, roundIndex) => {
        const roundNum = roundIndex + 1;
        const isLast = roundIndex === rounds.length - 1;

        let lutasParaExibir = [...roundLutas];
        const expected = expectedCounts[roundIndex] ?? lutasParaExibir.length;
        
        if (lutasParaExibir.length > expected) {
          lutasParaExibir = lutasParaExibir.slice(0, expected);
        } else if (lutasParaExibir.length < expected) {
          const lacuna = expected - lutasParaExibir.length;
          for (let i = 0; i < lacuna; i++) {
            lutasParaExibir.push({
              id: `placeholder-r${roundNum}-${i}`,
              rodada: roundNum,
              atletaAId: null,
              atletaBId: null,
              vencedorId: null,
            } as unknown as Luta);
          }
        }

        return (
          <div
            key={roundNum}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              height: '100%',
              gap: 32,
              position: 'relative',
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#475569',
                position: 'absolute',
                top: -8,
                left: 0,
                right: 0,
              }}
            >
              {getRoundLabel(roundNum, totalRodadas)}
            </div>

            {lutasParaExibir.map((luta, lutaIdx) => {
              const isEven = lutaIdx % 2 === 0;
              return (
                <div key={luta.id} style={{ position: 'relative', margin: '8px 0' }}>
                  {/* Conexão para a direita */}
                  {!isLast && (
                    <div
                      style={{
                        position: 'absolute',
                        right: -24,
                        top: '50%',
                        width: 24,
                        height: 2,
                        backgroundColor: LINE_COLOR,
                        zIndex: 10,
                      }}
                    />
                  )}

                  {/* Conexão para a esquerda */}
                  {roundIndex > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: -24,
                        width: 24,
                        zIndex: 10,
                        ...(isEven
                          ? {
                              top: '25%',
                              height: 'calc(50% + 2px)',
                              borderLeft: `2px solid ${LINE_COLOR}`,
                              borderTop: `2px solid ${LINE_COLOR}`,
                            }
                          : {
                              bottom: '25%',
                              height: 'calc(50% + 2px)',
                              borderLeft: `2px solid ${LINE_COLOR}`,
                              borderBottom: `2px solid ${LINE_COLOR}`,
                            }),
                      }}
                    />
                  )}

                  <BracketCard
                    luta={luta}
                    atletaANome={getAtletaNome(luta.atletaAId)}
                    atletaBNome={getAtletaNome(luta.atletaBId)}
                    onSelectWinner={onSelectWinner}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Champion Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          position: 'relative',
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#d97706',
            position: 'absolute',
            top: -8,
            left: 0,
            right: 0,
          }}
        >
          Campeão
        </div>
        {(() => {
          const finalRound = rounds[rounds.length - 1];
          const finalMatch = finalRound?.[0];
          const winner = finalMatch?.vencedorId ? getAtletaNome(finalMatch.vencedorId) : null;
          return winner ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, rgba(251,191,36,0.1), rgba(245,158,11,0.1))',
                border: '2px solid #f59e0b',
                borderRadius: 12,
                padding: 20,
                width: 224,
                boxShadow: '0 10px 15px -3px rgba(245,158,11,0.05)',
                textAlign: 'center',
                animation: 'bounce 1s ease-in-out 2',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  color: '#b45309',
                  letterSpacing: '0.1em',
                  marginBottom: 4,
                }}
              >
                VENCEDOR
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: '#1e293b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                {winner}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 12,
                padding: 20,
                width: 224,
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                A Definir
              </span>
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

function groupByRound(lutas: Luta[]): Luta[][] {
  if (!lutas || lutas.length === 0) return [];
  const rodadas = lutas.map(l => l.rodada).filter((r): r is number => typeof r === 'number' && r > 0);
  if (rodadas.length === 0) return [lutas];
  const maxRodada = Math.max(...rodadas);
  const rounds: Luta[][] = Array.from({ length: maxRodada }, () => []);
  for (const luta of lutas) {
    const r = luta.rodada && luta.rodada > 0 ? luta.rodada - 1 : 0;
    if (rounds[r]) {
      rounds[r].push(luta);
    }
  }
  return rounds;
}