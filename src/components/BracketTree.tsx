import { Group, Text, Stack } from '@mantine/core';
import type { Chave, Luta } from '../types/bracket';
import { BracketCard } from './BracketCard';

interface BracketTreeProps {
  chave: Chave;
  getAtletaNome: (id: string | null) => string;
  onLutaClick: (luta: Luta) => void;
}

export function BracketTree({ chave, getAtletaNome, onLutaClick }: BracketTreeProps) {
  const rounds = groupByRound(chave.lutas);
  const roundLabels: Record<number, string> = {
    1: chave.totalRodadas === 1 ? 'Final' : chave.totalRodadas === 3 ? 'Quartas de Final' : 'Semifinais',
    2: chave.totalRodadas === 3 ? 'Semifinais' : 'Final',
    3: 'Final',
  };

  return (
    <Group align="flex-start" gap="xl" wrap="nowrap" style={{ overflowX: 'auto', padding: '16px 0' }}>
      {rounds.map((roundLutas, roundIndex) => {
        const roundNum = roundIndex + 1;
        return (
          <Stack key={roundNum} gap="lg" align="center" style={{ minWidth: 200 }}>
            <Text fw={700} size="sm" ta="center">
              {roundLabels[roundNum] || `Rodada ${roundNum}`}
            </Text>
            {roundLutas.map(luta => (
              <BracketCard
                key={luta.id}
                luta={luta}
                atletaANome={getAtletaNome(luta.atletaAId)}
                atletaBNome={getAtletaNome(luta.atletaBId)}
                vencedorNome={
                  luta.vencedorId ? getAtletaNome(luta.vencedorId) : undefined
                }
                onClick={() => onLutaClick(luta)}
              />
            ))}
          </Stack>
        );
      })}
    </Group>
  );
}

function groupByRound(lutas: Luta[]): Luta[][] {
  const maxRodada = Math.max(...lutas.map(l => l.rodada));
  const rounds: Luta[][] = Array.from({ length: maxRodada }, () => []);
  for (const luta of lutas) {
    rounds[luta.rodada - 1].push(luta);
  }
  return rounds;
}
