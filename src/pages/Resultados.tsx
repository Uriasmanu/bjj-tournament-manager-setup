import {
  Paper,
  Text,
  Stack,
  Group,
  Loader,
  Center,
  Badge,
  Table,
  Tabs,
  Title,
  Card,
  SimpleGrid,
  Button,
  Divider,
  UnstyledButton,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import {
  IconTrophy,
  IconBrackets,
  IconUsers,
  IconUserShield,
  IconBuildingSkyscraper,
  IconSwords,
  IconChartBar,
  IconClock,
  IconChevronDown,
  IconSearch,
  IconX,
  IconFileDownload,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Torneio } from '../types/tournament';
import type { Atleta } from '../types/athlete';
import type { Chave, Luta, PlacarLuta } from '../types/bracket';
import type { Arbitro } from '../types/referee';
import type { AreaLuta } from '../types/area';
import { gerarPdfLutasCasadas, gerarPdfChaves } from '../utils/pdfGenerator';
import type { LutaCasada } from '../types/lutaCasada';
import { getCategoriaLabel, type CategoriaCustomizada } from '../types/category';
import { PageLayout } from '../components/PageLayout';
import { formatarDuracao } from '../utils/format';

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'branca-adulto': 'Branca', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getChaveStatus(chave: Chave): { label: string; color: string } {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0);
  const isEncerrado = chave.lutas.some(l => l.rodada === maxRodada && l.vencedorId);
  if (isEncerrado) return { label: 'ENCERRADO', color: 'yellow' };
  const isEmAndamento = chave.lutas.some(l => l.status === 'completed');
  if (isEmAndamento) return { label: 'EM ANDAMENTO', color: 'cyan' };
  return { label: 'PENDENTE', color: 'gray' };
}

function getChaveVencedorId(chave: Chave): string | null {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0);
  const finalLuta = chave.lutas.find(l => l.rodada === maxRodada);
  if (!finalLuta) return null;
  return finalLuta.vencedorId ?? null;
}

function getChavePerdedorFinalId(chave: Chave): string | null {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0);
  const finalLuta = chave.lutas.find(l => l.rodada === maxRodada);
  if (!finalLuta || !finalLuta.vencedorId) return null;
  const perdedorId = finalLuta.vencedorId === finalLuta.atletaAId ? finalLuta.atletaBId : finalLuta.atletaAId;
  return perdedorId;
}

function getPerdedoresSemifinal(chave: Chave): string[] {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0);
  if (maxRodada < 3) return [];
  const semis = chave.lutas.filter(l => l.rodada === maxRodada - 1);
  return semis
    .filter(l => l.vencedorId)
    .map(l => (l.vencedorId === l.atletaAId ? l.atletaBId : l.atletaAId));
}

function getCategoriaTitulo(categoriaId: string, customizadas?: CategoriaCustomizada[]): string {
  return getCategoriaLabel(categoriaId, customizadas);
}

function getChaveTitulo(chave: Chave, customizadas?: CategoriaCustomizada[]): string {
  const base = getCategoriaLabel(chave.categoriaId, customizadas);
  if (chave.faixa) {
    return `${base} - ${FAIXA_LABEL[chave.faixa] || chave.faixa}`;
  }
  return base;
}

function getTipoVitoria(luta: { finalizacao?: boolean; desclassificacao?: boolean; desempateArbitro?: boolean; desclassificadoId?: string }): { label: string; color: string; icon?: string } {
  if (luta.desclassificacao) return { label: 'Desclassificação', color: 'red', icon: '🚫' };
  if (luta.finalizacao) return { label: 'Finalização', color: 'grape', icon: '🏁' };
  if (luta.desempateArbitro) return { label: 'Desempate', color: 'orange', icon: '⚖️' };
  return { label: 'Pontos', color: 'blue', icon: '🏆' };
}

function isLutaValida(luta: Luta | LutaCasada): boolean {
  return Boolean(luta.vencedorId && luta.vencedorId !== 'tbd' && luta.vencedorId !== 'bye');
}

function PlacarDetalhado({ placar, color, dimmed }: { placar: PlacarLuta | undefined; color: string; dimmed?: boolean }) {
  if (!placar) {
    return <Text size="sm" c="dimmed" style={{ opacity: dimmed ? 0.6 : 1 }}>0</Text>;
  }
  return (
    <Stack gap={2} align="center" style={{ opacity: dimmed ? 0.6 : 1 }}>
      <Group gap={6} wrap="wrap" justify="center">
        <Badge size="xs" variant="light" color="gray">+2: {placar.pontos2}</Badge>
        <Badge size="xs" variant="light" color="gray">+3: {placar.pontos3}</Badge>
        <Badge size="xs" variant="light" color="gray">+4: {placar.pontos4}</Badge>
      </Group>
      <Group gap={6} wrap="wrap" justify="center">
        <Text size="xs" c="dimmed">Vant: <b style={{ color }}>{placar.vantagens}</b></Text>
        <Text size="xs" c="dimmed">Pun: <b style={{ color }}>{placar.punicoes}</b></Text>
        <Text size="sm" fw={900} c={color}>Total: {placar.total}</Text>
      </Group>
    </Stack>
  );
}

type AtletaResumo = {
  id: string;
  nome: string;
  equipe: string;
  faixa: string;
  pesoKg: number;
  categoria: string;
};

function AtletaInfo({ resumo, lado, vencedor, desclassificado, compacto, customizadas }: {
  resumo: AtletaResumo;
  lado: 'A' | 'B';
  vencedor: boolean;
  desclassificado: boolean;
  compacto?: boolean;
  customizadas?: CategoriaCustomizada[];
}) {
  const faixaLabel = FAIXA_LABEL[resumo.faixa] ?? resumo.faixa;
  const textDecoration = desclassificado ? 'line-through' : 'none';
  return (
    <Stack gap={2} style={{ flex: 1 }}>
      <Group gap={4} wrap="nowrap" align="center">
        <Text size="xs" c="dimmed" fw={700}>Atleta {lado}</Text>
        {vencedor && (
          <Badge size="xs" color="green" variant="filled">VENCEDOR</Badge>
        )}
        {desclassificado && (
          <Badge size="xs" color="red" variant="filled">DQ</Badge>
        )}
      </Group>
      <Text
        size={compacto ? 'sm' : 'md'}
        fw={700}
        style={{ textDecoration }}
      >
        {capitalize(resumo.nome)}
      </Text>
      {!compacto && (
        <Text size="xs" c="dimmed" tt="capitalize" style={{ textDecoration }}>
          {resumo.equipe || '—'}
        </Text>
      )}
      {!compacto && (
        <Group gap={6} wrap="wrap">
          <Badge size="xs" variant="light">{faixaLabel}</Badge>
          <Badge size="xs" variant="light" color="dark">{resumo.pesoKg.toFixed(1)}kg</Badge>
          {resumo.categoria && (
            <Text size="xs" c="dimmed">{getCategoriaTitulo(resumo.categoria, customizadas)}</Text>
          )}
        </Group>
      )}
    </Stack>
  );
}

function LutaResumoCard({
  chaveOrigem,
  ordem,
  rodada,
  atletaA,
  atletaB,
  placarA,
  placarB,
  vencedorId,
  finalizacao,
  desclassificacao,
  desclassificadoId,
  desempateArbitro,
  status,
  tempoRealSegundos,
  horarioInicio,
  horarioTermino,
  isCasada,
  statusBadge,
  customizadas,
}: {
  chaveOrigem?: string;
  ordem?: number;
  rodada?: number;
  atletaA: AtletaResumo;
  atletaB: AtletaResumo;
  placarA?: PlacarLuta;
  placarB?: PlacarLuta;
  vencedorId: string;
  finalizacao?: boolean;
  desclassificacao?: boolean;
  desclassificadoId?: string;
  desempateArbitro?: boolean;
  status: 'completed' | 'wo' | 'pending';
  tempoRealSegundos?: number;
  horarioInicio?: string;
  horarioTermino?: string;
  isCasada?: boolean;
  statusBadge?: { label: string; color: string };
  customizadas?: CategoriaCustomizada[];
}) {
  const tipoVitoria = getTipoVitoria({ finalizacao, desclassificacao, desempateArbitro, desclassificadoId });
  const vencedorIdEfetivo = vencedorId;
  const aVenceu = vencedorIdEfetivo === atletaA.id;
  const bVenceu = vencedorIdEfetivo === atletaB.id;
  const aDesclassificado = desclassificadoId === atletaA.id;
  const bDesclassificado = desclassificadoId === atletaB.id;

  return (
    <Card withBorder padding="md" radius="md" aria-label={`Luta: ${atletaA.nome} vs ${atletaB.nome} — ${tipoVitoria.label}${tempoRealSegundos !== undefined ? ` em ${formatarDuracao(tempoRealSegundos)}` : ''}`}>
      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap" gap="xs">
          <Group gap="xs" wrap="wrap">
            {chaveOrigem && (
              <Badge size="sm" variant="outline" color="dark">{chaveOrigem}</Badge>
            )}
            {ordem !== undefined && (
              <Badge size="sm" variant="light" color="gray">Luta {ordem}</Badge>
            )}
            {rodada !== undefined && (
              <Badge size="sm" variant="light" color="gray">Rodada {rodada}</Badge>
            )}
            {isCasada && (
              <Badge size="sm" color="dark" variant="filled">LUTA CASADA</Badge>
            )}
            {statusBadge && (
              <Badge size="sm" color={statusBadge.color} variant="light">{statusBadge.label}</Badge>
            )}
            <Badge
              size="sm"
              color={tipoVitoria.color}
              variant={status === 'pending' ? 'light' : 'filled'}
              aria-label={`Tipo de vitória: ${tipoVitoria.label}`}
            >
              {tipoVitoria.icon} {tipoVitoria.label}
            </Badge>
          </Group>
          <Group gap={4} align="center">
            <IconClock size={14} color="var(--mantine-color-gray-6)" />
            <Text size="sm" c="dimmed" fw={600}>
              {tempoRealSegundos !== undefined ? formatarDuracao(tempoRealSegundos) : '—'}
            </Text>
          </Group>
        </Group>

        <Group gap="md" align="center" wrap="wrap" aria-label="Horários da luta">
          <Text size="xs" c="dimmed" aria-label={`Iniciada em ${horarioInicio ?? 'desconhecido'}`}>
            <b>Início:</b> {horarioInicio ?? '—'}
          </Text>
          <Text size="xs" c="dimmed" aria-label={`Terminada em ${horarioTermino ?? 'desconhecido'}`}>
            <b>Término:</b> {horarioTermino ?? '—'}
          </Text>
        </Group>

        <Group align="flex-start" gap="md" wrap="nowrap">
          <AtletaInfo
            resumo={atletaA}
            lado="A"
            vencedor={aVenceu}
            desclassificado={aDesclassificado}
            customizadas={customizadas}
          />
          <Stack gap={2} align="center" style={{ minWidth: 90 }}>
            <Text size="xs" c="dimmed" fw={700}>PLACAR</Text>
            <Group gap={6} align="center" justify="center">
              <Text fw={900} size="xl" c={aVenceu ? 'green.7' : aDesclassificado ? 'red.7' : 'dark'}>
                {placarA?.total ?? 0}
              </Text>
              <Text fw={900} size="xl" c="dimmed">×</Text>
              <Text fw={900} size="xl" c={bVenceu ? 'green.7' : bDesclassificado ? 'red.7' : 'dark'}>
                {placarB?.total ?? 0}
              </Text>
            </Group>
          </Stack>
          <AtletaInfo
            resumo={atletaB}
            lado="B"
            vencedor={bVenceu}
            desclassificado={bDesclassificado}
            customizadas={customizadas}
          />
        </Group>

        <Divider />

        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap={4} align="center" style={{ flex: 1, minWidth: 200 }}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Placar Atleta A</Text>
            <PlacarDetalhado placar={placarA} color={aVenceu ? 'var(--mantine-color-green-7)' : 'var(--mantine-color-dark-7)'} dimmed={aDesclassificado} />
          </Stack>
          <Stack gap={4} align="center" style={{ flex: 1, minWidth: 200 }}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Placar Atleta B</Text>
            <PlacarDetalhado placar={placarB} color={bVenceu ? 'var(--mantine-color-green-7)' : 'var(--mantine-color-dark-7)'} dimmed={bDesclassificado} />
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
}

export function Resultados() {
  const navigate = useNavigate();
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChaveId, setExpandedChaveId] = useState<string | null>(null);
  const [buscaOverview, setBuscaOverview] = useState<string>('');
  const [buscaChaves, setBuscaChaves] = useState<string>('');
  const [buscaCasadas, setBuscaCasadas] = useState<string>('');
  const [buscaEquipes, setBuscaEquipes] = useState<string>('');
  const [buscaArbitros, setBuscaArbitros] = useState<string>('');
  const [buscaAtletas, setBuscaAtletas] = useState<string>('');
  const [customizadas, setCustomizadas] = useState<CategoriaCustomizada[]>([]);

  useEffect(() => {
    const fetchData = () => {
      window.electronAPI.getActiveTournament().then((t) => {
        setTorneio(t);
        setLoading(false);
      }).catch(() => setLoading(false));
      window.electronAPI.loadCategorias().then((data) => {
        setCustomizadas(data.customizadas);
      }).catch(() => {});
    };
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, []);

  const atletas = useMemo<Atleta[]>(() => torneio?.atletas ?? [], [torneio]);
  const chaves = useMemo<Chave[]>(() => torneio?.chaves ?? [], [torneio]);
  const areas = useMemo<AreaLuta[]>(() => torneio?.areas ?? [], [torneio]);
  const arbitros = useMemo<Arbitro[]>(() => torneio?.arbitros ?? [], [torneio]);
  const lutasCasadas = useMemo<LutaCasada[]>(() => torneio?.lutasCasadas ?? [], [torneio]);

  const atletasMap = useMemo(() => new Map(atletas.map(a => [a.id, a])), [atletas]);

  const getAtletaNome = (id: string | null | undefined): string => {
    if (!id || id === 'tbd' || id === 'bye') return 'A definir';
    const a = atletasMap.get(id);
    if (!a) return 'Atleta removido';
    return capitalize(a.nome);
  };

  const getAtletaResumo = (id: string): AtletaResumo | null => {
    if (!id || id === 'tbd' || id === 'bye') return null;
    const a = atletasMap.get(id);
    if (!a) return { id, nome: 'Atleta removido', equipe: '', faixa: 'branca', pesoKg: 0, categoria: '' };
    return {
      id: a.id,
      nome: a.nome,
      equipe: a.equipe || '',
      faixa: a.faixa,
      pesoKg: a.pesoKg,
      categoria: a.categoria,
    };
  };

  const getAreaDaChave = (chave: Chave): string | null => {
    if (!chave.arbitroId) return null;
    for (const area of areas) {
      if (area.arbitroIds.includes(chave.arbitroId)) return area.nome;
    }
    return null;
  };

  const chavesEncerradas = useMemo(() => chaves.filter(c => {
    const max = Math.max(...c.lutas.map(l => l.rodada), 0);
    return c.lutas.some(l => l.rodada === max && l.vencedorId);
  }), [chaves]);

  const medalhasPorEquipe = useMemo(() => {
    const counts: Record<string, { ouro: number; prata: number; bronze: number }> = {};
    const equipeDoAtleta = new Map<string, string>();
    for (const a of atletas) {
      equipeDoAtleta.set(a.id, a.equipe || 'Sem equipe');
    }
    for (const c of chavesEncerradas) {
      const ouro = getChaveVencedorId(c);
      const prata = getChavePerdedorFinalId(c);
      const bronzes = getPerdedoresSemifinal(c);
      if (ouro) {
        const eq = equipeDoAtleta.get(ouro) ?? 'Sem equipe';
        counts[eq] = counts[eq] ?? { ouro: 0, prata: 0, bronze: 0 };
        counts[eq].ouro += 1;
      }
      if (prata) {
        const eq = equipeDoAtleta.get(prata) ?? 'Sem equipe';
        counts[eq] = counts[eq] ?? { ouro: 0, prata: 0, bronze: 0 };
        counts[eq].prata += 1;
      }
      for (const id of bronzes) {
        const eq = equipeDoAtleta.get(id) ?? 'Sem equipe';
        counts[eq] = counts[eq] ?? { ouro: 0, prata: 0, bronze: 0 };
        counts[eq].bronze += 1;
      }
    }
    return counts;
  }, [atletas, chavesEncerradas]);

  const lutasPorArbitro = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of chaves) {
      if (c.arbitroId) counts[c.arbitroId] = (counts[c.arbitroId] ?? 0) + 1;
    }
    for (const l of lutasCasadas) {
      if (l.arbitroId) counts[l.arbitroId] = (counts[l.arbitroId] ?? 0) + 1;
    }
    return counts;
  }, [chaves, lutasCasadas]);

  const chavesFiltradas = useMemo(() => {
    const termo = buscaChaves.trim().toLowerCase();
    const list = !termo ? chaves : chaves.filter(c => {
      const categoria = getCategoriaTitulo(c.categoriaId, customizadas).toLowerCase();
      if (categoria.includes(termo)) return true;
      return c.lutas.some(l => {
        const nomeA = getAtletaNome(l.atletaAId).toLowerCase();
        const nomeB = getAtletaNome(l.atletaBId).toLowerCase();
        return nomeA.includes(termo) || nomeB.includes(termo);
      });
    });
    return list.slice().sort((a, b) => {
      const order: Record<string, number> = { 'ENCERRADO': 0, 'EM ANDAMENTO': 1, 'PENDENTE': 2 };
      return order[getChaveStatus(a).label] - order[getChaveStatus(b).label];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaves, buscaChaves, atletas]);

  const chavesEncerradasFiltradas = useMemo(() => {
    const termo = buscaOverview.trim().toLowerCase();
    if (!termo) return chavesEncerradas;
    return chavesEncerradas.filter(c => {
      const ouro = getAtletaNome(getChaveVencedorId(c)).toLowerCase();
      const prata = getAtletaNome(getChavePerdedorFinalId(c)).toLowerCase();
      const bronzes = getPerdedoresSemifinal(c).map(id => getAtletaNome(id).toLowerCase());
      return ouro.includes(termo) || prata.includes(termo) || bronzes.some(n => n.includes(termo));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chavesEncerradas, buscaOverview, atletas]);

  const lutasCasadasFiltradas = useMemo(() => {
    const sorted = lutasCasadas.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const termo = buscaCasadas.trim().toLowerCase();
    if (!termo) return sorted;
    return sorted.filter(l =>
      l.atletaASnapshot.nome.toLowerCase().includes(termo) ||
      l.atletaBSnapshot.nome.toLowerCase().includes(termo)
    );
  }, [lutasCasadas, buscaCasadas]);

  const equipesAgrupadas = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of atletas) {
      const key = a.equipe || 'Sem equipe';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [atletas]);

  const equipesFiltradas = useMemo(() => {
    const termo = buscaEquipes.trim().toLowerCase();
    if (!termo) return equipesAgrupadas;
    return equipesAgrupadas.filter(([nome]) => nome.toLowerCase().includes(termo));
  }, [equipesAgrupadas, buscaEquipes]);

  const arbitrosFiltrados = useMemo(() => {
    const termo = buscaArbitros.trim().toLowerCase();
    if (!termo) return arbitros;
    return arbitros.filter(a => a.nome.toLowerCase().includes(termo));
  }, [arbitros, buscaArbitros]);

  const atletasFiltrados = useMemo(() => {
    const termo = buscaAtletas.trim().toLowerCase();
    if (!termo) return atletas;
    return atletas.filter(a => a.nome.toLowerCase().includes(termo));
  }, [atletas, buscaAtletas]);

  useEffect(() => {
    const termo = buscaChaves.trim();
    if (!termo) {
      setExpandedChaveId(null);
      return;
    }
    const first = chavesFiltradas[0];
    if (first) setExpandedChaveId(first.id);
  }, [buscaChaves, chavesFiltradas]);

  if (loading) {
    return (
      <Center py="xl" style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (!torneio) {
    return (
      <PageLayout title="Resultados" backRoute="/admin/dashboard">
        <Stack align="center" gap="md" py="xl">
          <IconTrophy size={48} stroke={1.5} color="var(--mantine-color-gray-4)" />
          <Text c="dimmed" size="lg">Nenhum torneio ativo</Text>
          <Text c="dimmed" size="sm">Crie ou importe um torneio para visualizar os resultados.</Text>
          <Button onClick={() => navigate('/')}>Voltar ao menu inicial</Button>
        </Stack>
      </PageLayout>
    );
  }

  const lutasCasadasFinalizadas = lutasCasadas.filter(l => l.status === 'completed' || l.status === 'wo');
  const lutasCasadasPendentes = lutasCasadas.length - lutasCasadasFinalizadas.length;

  return (
    <PageLayout title="Resultados" backRoute="/admin/dashboard">
      <Stack gap="md">
        <Group gap="xs" align="center">
          <Text fw={700} size="lg">{torneio.nome || `Torneio ${torneio.data.slice(0, 10)}`}</Text>
          {torneio.startedAt && (
            <Badge color="green" variant="light">Iniciado</Badge>
          )}
        </Group>

        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>Visão Geral</Tabs.Tab>
            <Tabs.Tab value="chaves" leftSection={<IconBrackets size={16} />}>Chaves</Tabs.Tab>
            <Tabs.Tab value="casadas" leftSection={<IconSwords size={16} />}>Lutas Casadas</Tabs.Tab>
            <Tabs.Tab value="equipes" leftSection={<IconBuildingSkyscraper size={16} />}>Equipes</Tabs.Tab>
            <Tabs.Tab value="arbitros" leftSection={<IconUserShield size={16} />}>Árbitros</Tabs.Tab>
            <Tabs.Tab value="atletas" leftSection={<IconUsers size={16} />}>Atletas</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="md">
                <Paper withBorder p="md" radius="md">
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Atletas</Text>
                    <Text size="xl" fw={900}>{atletas.length}</Text>
                  </Stack>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Chaves</Text>
                    <Text size="xl" fw={900}>{chaves.length}</Text>
                    <Text size="xs" c="dimmed">{chavesEncerradas.length} encerradas</Text>
                  </Stack>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Lutas Casadas</Text>
                    <Text size="xl" fw={900}>{lutasCasadas.length}</Text>
                    <Text size="xs" c="dimmed">{lutasCasadasFinalizadas.length} finalizadas · {lutasCasadasPendentes} pendentes</Text>
                  </Stack>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Áreas</Text>
                    <Text size="xl" fw={900}>{areas.length}</Text>
                  </Stack>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Árbitros</Text>
                    <Text size="xl" fw={900}>{arbitros.length}</Text>
                  </Stack>
                </Paper>
              </SimpleGrid>

              <Title order={4} mt="sm">Medalhistas</Title>
              {chavesEncerradas.length === 0 ? (
                <Text c="dimmed">Nenhuma chave encerrada ainda.</Text>
              ) : (
                <Stack gap="md">
                  <Group gap="md" align="center" wrap="wrap" w="100%">
                    <TextInput
                      leftSection={<IconSearch size={16} />}
                      placeholder="Buscar medalhista por nome"
                      value={buscaOverview}
                      onChange={(e) => setBuscaOverview(e.currentTarget.value)}
                      rightSection={
                        buscaOverview ? (
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => setBuscaOverview('')}
                            aria-label="Limpar busca"
                            size="sm"
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        ) : null
                      }
                      aria-label="Buscar medalhistas por nome de atleta"
                      style={{ flex: 1, maxWidth: 400 }}
                    />
                    <Text size="sm" c="dimmed" fw={600}>
                      Exibindo {chavesEncerradasFiltradas.length} de {chavesEncerradas.length} chaves encerradas
                    </Text>
                  </Group>
                  {chavesEncerradasFiltradas.length === 0 ? (
                    <Stack align="center" gap="md" py="xl">
                      <Text c="dimmed" ta="center">Nenhum medalhista encontrado para o termo '{buscaOverview}'.</Text>
                      <Button variant="default" onClick={() => setBuscaOverview('')}>
                        Limpar busca
                      </Button>
                    </Stack>
                  ) : (
                    <Stack gap="md">
                      {chavesEncerradasFiltradas.map(chave => {
                    const ouro = getChaveVencedorId(chave);
                    const prata = getChavePerdedorFinalId(chave);
                    const bronzes = getPerdedoresSemifinal(chave);
                    return (
                      <Card key={chave.id} withBorder padding="md" radius="md">
                        <Stack gap="xs">
                           <Text fw={700} size="sm">{getChaveTitulo(chave, customizadas)} — {chave.totalAtletas} atleta(s){(() => { const area = getAreaDaChave(chave); return area ? ` — ${area}` : ''; })()}</Text>
                          <Group gap="md" wrap="wrap">
                            <Group gap="xs">
                              <Badge color="yellow" variant="filled" size="lg">🥇 1º</Badge>
                              <Text size="sm" fw={600}>{getAtletaNome(ouro)}</Text>
                            </Group>
                            {prata && (
                              <Group gap="xs">
                                <Badge color="gray" variant="filled" size="lg">🥈 2º</Badge>
                                <Text size="sm" fw={600}>{getAtletaNome(prata)}</Text>
                              </Group>
                            )}
                            {bronzes.length > 0 && bronzes.map((id) => (
                              <Group gap="xs" key={id}>
                                <Badge color="orange" variant="filled" size="lg">🥉 3º</Badge>
                                <Text size="sm" fw={600}>{getAtletaNome(id)}</Text>
                              </Group>
                            ))}
                          </Group>
                        </Stack>
                      </Card>
                    );
                  })}
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="chaves" pt="md">
            {chaves.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma chave gerada.</Text>
            ) : (
              <Stack gap="md">
                <Group gap="md" align="center" wrap="wrap" w="100%">
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconFileDownload size={16} />}
                    onClick={() => gerarPdfChaves(chaves, atletas, torneio.nome || `Torneio ${torneio.data}`)}
                  >
                    Gerar PDF Chaves
                  </Button>
                  <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Buscar por categoria ou atleta"
                    value={buscaChaves}
                    onChange={(e) => setBuscaChaves(e.currentTarget.value)}
                    rightSection={
                      buscaChaves ? (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => setBuscaChaves('')}
                          aria-label="Limpar busca"
                          size="sm"
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      ) : null
                    }
                    aria-label="Buscar chaves por categoria ou atleta"
                    style={{ flex: 1, maxWidth: 400 }}
                  />
                  <Text size="sm" c="dimmed" fw={600}>
                    Exibindo {chavesFiltradas.length} de {chaves.length} chaves
                  </Text>
                </Group>
                {chavesFiltradas.length === 0 ? (
                  <Stack align="center" gap="md" py="xl">
                    <Text c="dimmed" ta="center">Nenhuma chave encontrada para o termo '{buscaChaves}'.</Text>
                    <Button variant="default" onClick={() => setBuscaChaves('')}>
                      Limpar busca
                    </Button>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    {chavesFiltradas.map(chave => {
                  const status = getChaveStatus(chave);
                  const vencedor = getChaveVencedorId(chave);
                  const isExpanded = expandedChaveId === chave.id;
                  return (
                    <Card key={chave.id} withBorder padding="md" radius="md">
                      <Stack gap="sm">
                        <UnstyledButton
                          onClick={() => setExpandedChaveId(isExpanded ? null : chave.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`chave-body-${chave.id}`}
                           aria-label={`${getChaveTitulo(chave, customizadas)} — clique para ${isExpanded ? 'recolher' : 'expandir'}`}
                          style={{ width: '100%' }}
                        >
                          <Group justify="space-between" wrap="wrap">
                            <Stack gap={2}>
                               <Text fw={700} size="sm">{getChaveTitulo(chave, customizadas)}</Text>
                              <Text size="xs" c="dimmed">{chave.totalAtletas} atleta(s) · {chave.totalLutas} luta(s){(() => { const area = getAreaDaChave(chave); return area ? ` · ${area}` : ''; })()}</Text>
                            </Stack>
                            <Group gap="xs">
                              <Badge color={status.color} variant={status.color === 'yellow' ? 'filled' : 'light'}>
                                {status.label}
                              </Badge>
                              {vencedor && (
                                <Text size="sm" fw={600}>Vencedor: {getAtletaNome(vencedor)}</Text>
                              )}
                              <IconChevronDown
                                size={20}
                                aria-hidden="true"
                                style={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                }}
                              />
                            </Group>
                          </Group>
                        </UnstyledButton>
                        {isExpanded && (
                          <Stack gap="xs" id={`chave-body-${chave.id}`}>
                            <Divider />
                            {chave.lutas
                              .slice()
                              .sort((a, b) => a.ordem - b.ordem)
                              .map(l => {
                                const a = getAtletaResumo(l.atletaAId) ?? { id: l.atletaAId, nome: 'A definir', equipe: '', faixa: 'branca', pesoKg: 0, categoria: '' };
                                const b = getAtletaResumo(l.atletaBId) ?? { id: l.atletaBId, nome: 'A definir', equipe: '', faixa: 'branca', pesoKg: 0, categoria: '' };
                                const lutaValida = isLutaValida(l);
                                const statusBadge = !lutaValida
                                  ? { label: 'PENDENTE', color: 'yellow' }
                                  : l.status === 'wo'
                                    ? { label: 'WO', color: 'red' }
                                    : undefined;
                                return (
                                  <LutaResumoCard
                                    key={l.id}
                                     chaveOrigem={getCategoriaTitulo(chave.categoriaId, customizadas)}
                                    ordem={l.ordem}
                                    rodada={l.rodada}
                                    atletaA={a}
                                    atletaB={b}
                                    placarA={l.placarA}
                                    placarB={l.placarB}
                                    vencedorId={l.vencedorId ?? ''}
                                    finalizacao={l.finalizacao}
                                    desclassificacao={l.desclassificacao}
                                    desclassificadoId={l.desclassificadoId}
                                    desempateArbitro={l.desempateArbitro}
                                    status={l.status as 'completed' | 'wo' | 'pending'}
                                    tempoRealSegundos={l.tempoRealSegundos}
                                    horarioInicio={l.horarioInicio}
                                    horarioTermino={l.horarioTermino}
                                    statusBadge={statusBadge}
                                    customizadas={customizadas}
                                  />
                                );
                              })}
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  );
                })}
                  </Stack>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="casadas" pt="md">
            {lutasCasadas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma luta casada cadastrada.</Text>
            ) : (
              <Stack gap="md">
                <Group gap="md" align="center" wrap="wrap" w="100%">
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconFileDownload size={16} />}
                    onClick={() => gerarPdfLutasCasadas(lutasCasadas, torneio.nome || `Torneio ${torneio.data}`, arbitros)}
                  >
                    Gerar PDF Lutas Casadas
                  </Button>
                  <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Buscar por nome do atleta"
                    value={buscaCasadas}
                    onChange={(e) => setBuscaCasadas(e.currentTarget.value)}
                    rightSection={
                      buscaCasadas ? (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => setBuscaCasadas('')}
                          aria-label="Limpar busca"
                          size="sm"
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      ) : null
                    }
                    aria-label="Buscar lutas casadas por nome do atleta"
                    style={{ flex: 1, maxWidth: 400 }}
                  />
                  <Text size="sm" c="dimmed" fw={600}>
                    Exibindo {lutasCasadasFiltradas.length} de {lutasCasadas.length} lutas casadas
                  </Text>
                </Group>
                {lutasCasadasFiltradas.length === 0 ? (
                  <Stack align="center" gap="md" py="xl">
                    <Text c="dimmed" ta="center">Nenhuma luta casada encontrada para o termo '{buscaCasadas}'.</Text>
                    <Button variant="default" onClick={() => setBuscaCasadas('')}>
                      Limpar busca
                    </Button>
                  </Stack>
                ) : (
                  <Stack gap="xs">
                    {lutasCasadasFiltradas
                      .map(luta => {
                        const atletaA: AtletaResumo = {
                          id: luta.atletaAId,
                          nome: luta.atletaASnapshot.nome,
                          equipe: luta.atletaASnapshot.equipe,
                          faixa: luta.atletaASnapshot.faixa,
                          pesoKg: luta.atletaASnapshot.pesoKg,
                          categoria: luta.atletaASnapshot.categoria,
                        };
                        const atletaB: AtletaResumo = {
                          id: luta.atletaBId,
                          nome: luta.atletaBSnapshot.nome,
                          equipe: luta.atletaBSnapshot.equipe,
                          faixa: luta.atletaBSnapshot.faixa,
                          pesoKg: luta.atletaBSnapshot.pesoKg,
                          categoria: luta.atletaBSnapshot.categoria,
                        };
                        const statusBadge =
                          luta.status === 'pending'
                            ? { label: 'PENDENTE', color: 'yellow' }
                            : luta.status === 'wo'
                              ? { label: 'WO', color: 'red' }
                              : undefined;
                        return (
                          <LutaResumoCard
                            key={luta.id}
                            atletaA={atletaA}
                            atletaB={atletaB}
                            placarA={luta.placarA}
                            placarB={luta.placarB}
                            vencedorId={luta.vencedorId ?? ''}
                            finalizacao={luta.finalizacao}
                            desclassificacao={luta.desclassificacao}
                            desempateArbitro={luta.desempateArbitro}
                            status={luta.status as 'completed' | 'wo' | 'pending'}
                            tempoRealSegundos={luta.tempoRealSegundos}
                            horarioInicio={luta.horarioInicio}
                            horarioTermino={luta.dataFinalizacao ?? undefined}
                            isCasada
                            statusBadge={statusBadge}
                            customizadas={customizadas}
                          />
                        );
                      })}
                  </Stack>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="equipes" pt="md">
            {equipesAgrupadas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma equipe cadastrada.</Text>
            ) : (
              <Stack gap="md">
                <Group gap="md" align="center" wrap="wrap" w="100%">
                  <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Buscar por nome da equipe"
                    value={buscaEquipes}
                    onChange={(e) => setBuscaEquipes(e.currentTarget.value)}
                    rightSection={
                      buscaEquipes ? (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => setBuscaEquipes('')}
                          aria-label="Limpar busca"
                          size="sm"
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      ) : null
                    }
                    aria-label="Buscar equipes por nome"
                    style={{ flex: 1, maxWidth: 400 }}
                  />
                  <Text size="sm" c="dimmed" fw={600}>
                    Exibindo {equipesFiltradas.length} de {equipesAgrupadas.length} equipes
                  </Text>
                </Group>
                {equipesFiltradas.length === 0 ? (
                  <Stack align="center" gap="md" py="xl">
                    <Text c="dimmed" ta="center">Nenhuma equipe encontrada para o termo '{buscaEquipes}'.</Text>
                    <Button variant="default" onClick={() => setBuscaEquipes('')}>
                      Limpar busca
                    </Button>
                  </Stack>
                ) : (
                  <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Equipe</Table.Th>
                          <Table.Th style={{ textAlign: 'right' }}>Atletas</Table.Th>
                          <Table.Th style={{ textAlign: 'right' }}>🥇 Ouro</Table.Th>
                          <Table.Th style={{ textAlign: 'right' }}>🥈 Prata</Table.Th>
                          <Table.Th style={{ textAlign: 'right' }}>🥉 Bronze</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {equipesFiltradas.map(([equipe, count]) => {
                          const m = medalhasPorEquipe[equipe] ?? { ouro: 0, prata: 0, bronze: 0 };
                          return (
                            <Table.Tr key={equipe}>
                              <Table.Td><Text tt="capitalize">{equipe}</Text></Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>{count}</Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>{m.ouro > 0 ? <Badge color="yellow" variant="filled">{m.ouro}</Badge> : '—'}</Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>{m.prata > 0 ? <Badge color="gray" variant="filled">{m.prata}</Badge> : '—'}</Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>{m.bronze > 0 ? <Badge color="orange" variant="filled">{m.bronze}</Badge> : '—'}</Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="arbitros" pt="md">
            {arbitros.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhum árbitro cadastrado.</Text>
            ) : (
              <Stack gap="md">
                <Group gap="md" align="center" wrap="wrap" w="100%">
                  <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Buscar por nome do árbitro"
                    value={buscaArbitros}
                    onChange={(e) => setBuscaArbitros(e.currentTarget.value)}
                    rightSection={
                      buscaArbitros ? (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => setBuscaArbitros('')}
                          aria-label="Limpar busca"
                          size="sm"
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      ) : null
                    }
                    aria-label="Buscar árbitros por nome"
                    style={{ flex: 1, maxWidth: 400 }}
                  />
                  <Text size="sm" c="dimmed" fw={600}>
                    Exibindo {arbitrosFiltrados.length} de {arbitros.length} árbitros
                  </Text>
                </Group>
                {arbitrosFiltrados.length === 0 ? (
                  <Stack align="center" gap="md" py="xl">
                    <Text c="dimmed" ta="center">Nenhum árbitro encontrado para o termo '{buscaArbitros}'.</Text>
                    <Button variant="default" onClick={() => setBuscaArbitros('')}>
                      Limpar busca
                    </Button>
                  </Stack>
                ) : (
                  <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Árbitro</Table.Th>
                          <Table.Th>Faixa</Table.Th>
                          <Table.Th>Equipe</Table.Th>
                          <Table.Th style={{ textAlign: 'right' }}>Lutas (chave + casada)</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {arbitrosFiltrados.map(a => (
                          <Table.Tr key={a.id}>
                            <Table.Td>{capitalize(a.nome)}</Table.Td>
                            <Table.Td><Badge size="sm" variant="light">{FAIXA_LABEL[a.faixa] ?? a.faixa}</Badge></Table.Td>
                            <Table.Td><Text tt="capitalize" size="sm">{a.equipe || '—'}</Text></Table.Td>
                            <Table.Td style={{ textAlign: 'right' }}>
                              <Badge size="sm" color="blue" variant="light">{lutasPorArbitro[a.id] ?? 0}</Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="atletas" pt="md">
            {atletas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhum atleta cadastrado.</Text>
            ) : (
              <Stack gap="md">
                <Group gap="md" align="center" wrap="wrap" w="100%">
                  <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Buscar por nome do atleta"
                    value={buscaAtletas}
                    onChange={(e) => setBuscaAtletas(e.currentTarget.value)}
                    rightSection={
                      buscaAtletas ? (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => setBuscaAtletas('')}
                          aria-label="Limpar busca"
                          size="sm"
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      ) : null
                    }
                    aria-label="Buscar atletas por nome"
                    style={{ flex: 1, maxWidth: 400 }}
                  />
                  <Text size="sm" c="dimmed" fw={600}>
                    Exibindo {atletasFiltrados.length} de {atletas.length} atletas
                  </Text>
                </Group>
                {atletasFiltrados.length === 0 ? (
                  <Stack align="center" gap="md" py="xl">
                    <Text c="dimmed" ta="center">Nenhum atleta encontrado para o termo '{buscaAtletas}'.</Text>
                    <Button variant="default" onClick={() => setBuscaAtletas('')}>
                      Limpar busca
                    </Button>
                  </Stack>
                ) : (
                  <Paper withBorder radius="md" style={{ overflow: 'auto', maxHeight: '60vh' }}>
                    <Table striped highlightOnHover stickyHeader>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Atleta</Table.Th>
                          <Table.Th>Equipe</Table.Th>
                          <Table.Th>Faixa</Table.Th>
                          <Table.Th style={{ textAlign: 'right' }}>Peso (kg)</Table.Th>
                          <Table.Th>Categoria</Table.Th>
                          <Table.Th>Chave</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {atletasFiltrados.map(a => {
                          const chave = chaves.find(c => c.posicoesAtletas.includes(a.id));
                          return (
                            <Table.Tr key={a.id}>
                              <Table.Td>{capitalize(a.nome)}</Table.Td>
                              <Table.Td><Text tt="capitalize" size="sm">{a.equipe || '—'}</Text></Table.Td>
                              <Table.Td><Badge size="sm" variant="light">{FAIXA_LABEL[a.faixa] ?? a.faixa}</Badge></Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>{a.pesoKg.toFixed(1)}</Table.Td>
                               <Table.Td><Text size="sm">{getCategoriaTitulo(a.categoria, customizadas)}</Text></Table.Td>
                              <Table.Td>
                                {chave ? (
                                   <Text size="sm">{getCategoriaTitulo(chave.categoriaId, customizadas)}</Text>
                                ) : (
                                  <Text size="sm" c="dimmed">—</Text>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                )}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </PageLayout>
  );
}
