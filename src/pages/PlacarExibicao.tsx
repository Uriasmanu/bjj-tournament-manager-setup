import { Paper, Text, Stack, Center, Badge, Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PlacarLuta } from '../types/bracket';

const AZUL_ANIL = '#1e3a8a';
const BRANCO = '#ffffff';

const FONT_TOTAL = 'clamp(80px, 8vw, 160px)';
const FONT_NOME = 'clamp(24px, 3vw, 48px)';
const FONT_CRONOMETRO = 'clamp(60px, 8vw, 140px)';
const FONT_VANT_PUN = 'clamp(18px, 2.5vw, 36px)';

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

function AtletaPanelTelao({
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
  const bg = lado === 'A' ? AZUL_ANIL : BRANCO;
  const color = lado === 'A' ? '#fff' : '#212529';
  const subcolor = lado === 'A' ? 'rgba(255,255,255,0.85)' : '#6c757d';
  const borderColor = lado === 'A' ? '#1e3a8a' : '#dee2e6';

  return (
    <Paper
      withBorder
      p="xl"
      radius="md"
      style={{
        backgroundColor: bg,
        color,
        borderColor,
        flex: 1,
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack gap="lg" style={{ flex: 1 }}>
        <Stack gap={4}>
          <Text size="sm" c={subcolor} fw={700} tt="uppercase" style={{ letterSpacing: 1.5 }}>
            Atleta {lado}
          </Text>
          <Text fw={900} style={{ fontSize: FONT_NOME, lineHeight: 1.1, color, wordBreak: 'break-word' }}>
            {nome}
          </Text>
          {faixa && (
            <Text size="sm" c={subcolor} fw={600}>
              {FAIXA_LABEL[faixa] ?? faixa}
            </Text>
          )}
          {equipe && (
            <Text size="lg" c={subcolor} tt="capitalize" fw={600}>
              {equipe}
            </Text>
          )}
        </Stack>

        <Center style={{ flex: 1 }}>
          <Stack gap={0} align="center">
            <Text size="sm" c={subcolor} fw={700} tt="uppercase" style={{ letterSpacing: 1.5 }}>
              Total
            </Text>
            <Text fw={900} style={{ fontSize: FONT_TOTAL, lineHeight: 1, color }}>
              {placar.total}
            </Text>
          </Stack>
        </Center>

        <Group justify="space-around" align="center" w="100%">
          <Stack gap={2} align="center">
            <Text fw={900} style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color }}>
              {placar.pontos2}
            </Text>
            <Text size="xs" c={subcolor} fw={600}>+2</Text>
          </Stack>
          <Stack gap={2} align="center">
            <Text fw={900} style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color }}>
              {placar.pontos3}
            </Text>
            <Text size="xs" c={subcolor} fw={600}>+3</Text>
          </Stack>
          <Stack gap={2} align="center">
            <Text fw={900} style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color }}>
              {placar.pontos4}
            </Text>
            <Text size="xs" c={subcolor} fw={600}>+4</Text>
          </Stack>
        </Group>

        <Group justify="space-between" align="center" w="100%">
          <Text size="md" c={color} fw={700}>Vantagens</Text>
          <Text fw={900} style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color }}>
            {placar.vantagens}
          </Text>
        </Group>

        <Group justify="space-between" align="center" w="100%">
          <Text size="md" c={color} fw={700}>Punições</Text>
          <Text
            fw={900}
            style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color: placar.punicoes >= 3 ? '#fa5252' : color }}
          >
            {placar.punicoes}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

export function PlacarExibicao() {
  const { lutaId } = useParams<{ lutaId: string }>();
  const [dados, setDados] = useState<PlacarTelaoData | null>(null);

  useEffect(() => {
    window.electronAPI.onAtualizarPlacarTelao((novoDados: unknown) => {
      setDados(novoDados as PlacarTelaoData);
    });
  }, []);

  if (!dados) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack gap="md" align="center">
          <Text c="white" size="xl" fw={700}>TELÃO</Text>
          <Text c="dimmed" size="lg">Aguardando dados do placar...</Text>
          <Badge color="yellow" variant="filled" size="lg">
            Luta: {lutaId ? `#${lutaId.slice(0, 8)}` : '---'}
          </Badge>
        </Stack>
      </div>
    );
  }

  const corCronometro = dados.tempoEsgotado ? '#fa5252' : dados.rodando ? '#2e7d32' : '#ffffff';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', padding: 'clamp(16px, 2vw, 32px)' }}>
      <Stack gap="md">
        {dados.titulo && (
          <Center>
            <Badge color="blue" variant="filled" size="xl">{dados.titulo}</Badge>
          </Center>
        )}

        <Center>
          <Paper
            withBorder
            p="md"
            radius="md"
            style={{
              backgroundColor: '#16213e',
              borderColor: '#0f3460',
              minWidth: 400,
            }}
          >
            <Text
              fw={900}
              ta="center"
              style={{
                fontSize: FONT_CRONOMETRO,
                lineHeight: 1,
                color: corCronometro,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {dados.tempoEsgotado ? '⏰ TEMPO ESGOTADO' : formatarTempo(dados.tempoRestante)}
            </Text>
          </Paper>
        </Center>

        <Group align="stretch" gap="md" grow wrap="nowrap">
          <AtletaPanelTelao
            lado="A"
            nome={dados.nomeA}
            equipe={dados.equipeA}
            faixa={dados.faixaA}
            placar={dados.placarA}
          />
          <AtletaPanelTelao
            lado="B"
            nome={dados.nomeB}
            equipe={dados.equipeB}
            faixa={dados.faixaB}
            placar={dados.placarB}
          />
        </Group>
      </Stack>
    </div>
  );
}
