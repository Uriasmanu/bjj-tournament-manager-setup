import { Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { PlacarLuta } from '../types/bracket';

const AZUL_ANIL = '#1e3a8a';
const BRANCO = '#ffffff';

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface PlacarTelaoData {
  tipo: 'luta' | 'luta-casada';
  nomeA: string;
  nomeB: string;
  equipeA?: string;
  equipeB?: string;
  faixaA?: string;
  faixaB?: string;
  placarA: PlacarLuta;
  placarB: PlacarLuta;
  tempoRestante: number;
  rodando: boolean;
  tempoEsgotado: boolean;
  bloqueado: boolean;
  titulo?: string;
}

function LadoAtleta({
  nome,
  placar,
  lado,
}: {
  nome: string;
  placar: PlacarLuta;
  lado: 'A' | 'B';
}) {
  const isAzul = lado === 'A';
  const bg = isAzul ? AZUL_ANIL : BRANCO;
  const color = isAzul ? '#fff' : '#212529';

  return (
    <div
      style={{
        backgroundColor: bg,
        color,
        flex: 1,
        display: 'flex',
        flexDirection: 'row', // Mudado para row
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 12px',
        minWidth: 0,
        gap: '8px', // Espaço entre nome e placar
      }}
    >
      <Text
        fw={900}
        style={{
          fontSize: 'clamp(14px, 1.8vw, 28px)',
          lineHeight: 1.1,
          color,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '60%', // Limita a largura do nome
        }}
      >
        {nome}
      </Text>
      <Text
        fw={900}
        style={{
          fontSize: 'clamp(20px, 3vw, 48px)',
          lineHeight: 1,
          color,
          flexShrink: 0, // Impede que o placar encolha
        }}
      >
        {placar.total}
      </Text>
    </div>
  );
}

export function PlacarExibicao() {
  const [_dados, setDados] = useState<PlacarTelaoData | null>(null);

  useEffect(() => {
    window.electronAPI.onAtualizarPlacarTelao((novoDados: unknown) => {
      setDados(novoDados as PlacarTelaoData);
    });
  }, []);

  const dados = _dados ?? {
    tipo: 'luta' as const,
    nomeA: '',
    nomeB: '',
    placarA: { total: 0, pontos2: 0, pontos3: 0, pontos4: 0, vantagens: 0, punicoes: 0 },
    placarB: { total: 0, pontos2: 0, pontos3: 0, pontos4: 0, vantagens: 0, punicoes: 0 },
    tempoRestante: 0,
    rodando: false,
    tempoEsgotado: false,
    bloqueado: false,
  };

  const corCronometro = dados.tempoEsgotado ? '#fa5252' : dados.rodando ? '#2e7d32' : '#ffffff';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      <LadoAtleta
        lado="B"
        nome={dados.nomeB}
        placar={dados.placarB}
      />

      <div
        style={{
          backgroundColor: '#16213e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 8px',
          minWidth: 80,
          flexShrink: 0, // Impede que o cronômetro encolha
        }}
      >
        <Text
          fw={900}
          ta="center"
          style={{
            fontSize: 'clamp(18px, 2.5vw, 40px)',
            lineHeight: 1,
            color: corCronometro,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {dados.tempoEsgotado ? '⏰' : formatarTempo(dados.tempoRestante)}
        </Text>
      </div>

      <LadoAtleta
        lado="A"
        nome={dados.nomeA}
        placar={dados.placarA}
      />
    </div>
  );
}