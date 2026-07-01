import { Text, Stack, Badge } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { PlacarLuta } from '../types/bracket';

const AZUL_ANIL = '#1e3a8a';
const BRANCO = '#ffffff';
const VERDE = '#22c55e';
const VERMELHO = '#fa5252';

const FAIXA_COLORS: Record<string, string> = {
  branca: '#e2e8f0',
  cinza: '#9ca3af',
  amarela: '#fbbf24',
  laranja: '#f97316',
  verde: '#22c55e',
  azul: '#3b82f6',
  roxa: '#a855f7',
  marrom: '#78350f',
  preta: '#000000',
};

const FAIXA_LABEL: Record<string, string> = {
  branca: 'Branca',
  cinza: 'Cinza',
  amarela: 'Amarela',
  laranja: 'Laranja',
  verde: 'Verde',
  azul: 'Azul',
  roxa: 'Roxa',
  marrom: 'Marrom',
  preta: 'Preta',
};

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

function ColunaPlacar({
  label,
  valor,
  align,
}: {
  label: string;
  valor: number;
  align: 'left' | 'right';
}) {
  const labelColor = label === 'Vant' ? VERDE : VERMELHO;

  return (
    <Stack
      gap={0}
      align="center"
      style={{ minWidth: 48, margin: '0 6px' }}
    >
      <Text
        fw={600}
        style={{
          fontSize: 'clamp(9px, 0.8vw, 14px)',
          color: labelColor,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
          textAlign: align,
        }}
      >
        {label}
      </Text>
      <Text
        fw={900}
        style={{
          fontSize: 'clamp(18px, 2vw, 36px)',
          lineHeight: 1,
          color: labelColor,
          fontVariantNumeric: 'tabular-nums',
          textAlign: align,
        }}
      >
        {valor}
      </Text>
    </Stack>
  );
}

function LadoAtleta({
  nome,
  equipe,
  faixa,
  placar,
  lado,
}: {
  nome: string;
  equipe?: string;
  faixa?: string;
  placar: PlacarLuta;
  lado: 'A' | 'B';
}) {
  const isAzul = lado === 'A';
  const bg = isAzul ? AZUL_ANIL : BRANCO;
  const color = isAzul ? '#fff' : '#212529';
  const subColor = isAzul ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  const scoreBlock = (
    <Stack
      gap={0}
      align="center"
      style={{ minWidth: 56, margin: '0 12px' }}
    >
      <Text
        fw={600}
        style={{
          fontSize: 'clamp(9px, 0.8vw, 14px)',
          color,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
          opacity: 0.7,
        }}
      >
        Total
      </Text>
      <Text
        fw={900}
        style={{
          fontSize: 'clamp(28px, 3.5vw, 64px)',
          lineHeight: 1,
          color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {placar.total}
      </Text>
    </Stack>
  );

  const vantPunBlock = (
    <>
      {placar.vantagens > 0 && (
        <ColunaPlacar label="Vant" valor={placar.vantagens} align={isAzul ? 'left' : 'right'} />
      )}
      {placar.punicoes > 0 && (
        <ColunaPlacar label="Pun" valor={placar.punicoes} align={isAzul ? 'left' : 'right'} />
      )}
    </>
  );

  const faixaColor = faixa ? (FAIXA_COLORS[faixa] ?? '#9ca3af') : null;
  const faixaLabel = faixa ? (FAIXA_LABEL[faixa] ?? faixa) : null;

  const nameBlock = (
    <div style={{ flex: 1, textAlign: isAzul ? 'right' : 'left', overflow: 'hidden' }}>
      <Text
        fw={900}
        style={{
          fontSize: 'clamp(14px, 1.4vw, 24px)',
          color,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {nome}
      </Text>
      {equipe && (
        <Text
          fw={500}
          style={{
            fontSize: 'clamp(9px, 0.8vw, 14px)',
            color: subColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textTransform: 'capitalize',
          }}
        >
          {equipe}
        </Text>
      )}
      {faixaLabel && (
        <Badge
          size="xs"
          variant="filled"
          radius="sm"
          style={{
            backgroundColor: faixaColor ?? '#9ca3af',
            color: faixa === 'branca' ? '#1a1a2e' : '#fff',
            fontSize: 'clamp(7px, 0.6vw, 11px)',
            fontWeight: 700,
            marginTop: 2,
          }}
        >
          {faixaLabel}
        </Badge>
      )}
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: bg,
        color,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        overflow: 'hidden',
      }}
    >
      {/* Lado Branco -> Nome | Vant/Pun | Total */}
      {!isAzul && (
        <>
          {nameBlock}
          {vantPunBlock}
          {scoreBlock}
        </>
      )}

      {/* Lado Azul -> Total | Vant/Pun | Nome */}
      {isAzul && (
        <>
          {scoreBlock}
          {vantPunBlock}
          {nameBlock}
        </>
      )}
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
    placarA: {
      total: 0,
      pontos2: 0,
      pontos3: 0,
      pontos4: 0,
      vantagens: 0,
      punicoes: 0,
    },
    placarB: {
      total: 0,
      pontos2: 0,
      pontos3: 0,
      pontos4: 0,
      vantagens: 0,
      punicoes: 0,
    },
    tempoRestante: 0,
    rodando: false,
    tempoEsgotado: false,
    bloqueado: false,
  };

  const corCronometro = '#ffffff';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <LadoAtleta
        lado="B"
        nome={dados.nomeB}
        equipe={dados.equipeB}
        faixa={dados.faixaB}
        placar={dados.placarB}
      />

      <div
        style={{
          backgroundColor: '#16213e',
          width: 180,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderLeft: '2px solid rgba(255,255,255,.08)',
          borderRight: '2px solid rgba(255,255,255,.08)',
        }}
      >
        <Text
          fw={900}
          style={{
            fontSize: 'clamp(28px, 3vw, 52px)',
            color: corCronometro,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {dados.tempoEsgotado
            ? '⏰'
            : formatarTempo(dados.tempoRestante)}
        </Text>
      </div>

      <LadoAtleta
        lado="A"
        nome={dados.nomeA}
        equipe={dados.equipeA}
        faixa={dados.faixaA}
        placar={dados.placarA}
      />
    </div>
  );
}