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
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Torneio } from '../types/tournament';
import type { Atleta } from '../types/athlete';
import type { Chave, Luta, PlacarLuta } from '../types/bracket';
import type { Arbitro } from '../types/referee';
import type { AreaLuta } from '../types/area';
import type { LutaCasada } from '../types/lutaCasada';
import { categoriaLabels } from '../types/category';
import { PageLayout } from '../components/PageLayout';
import { formatarDuracao } from '../utils/format';

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getChaveStatus(chave: Chave): { label: string; color: string } {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0);
  const isEncerrado = chave.lutas.some(l => l.rodada === maxRodada && l.vencedorId);
  if (isEncerrado) return { label: 'ENCERRADO', color: 'yellow' };
  const isEmAndamento = chave.lutas.some(l => l.status === 'completed' || l.status === 'wo');
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

function getCategoriaTitulo(categoriaId: string): string {
  return categoriaLabels[categoriaId] ?? categoriaId;
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

function AtletaInfo({ resumo, lado, vencedor, desclassificado, compacto }: {
  resumo: AtletaResumo;
  lado: 'A' | 'B';
  vencedor: boolean;
  desclassificado: boolean;
  compacto?: boolean;
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
            <Text size="xs" c="dimmed">{getCategoriaTitulo(resumo.categoria)}</Text>
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
  isCasada,
  statusBadge,
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
  isCasada?: boolean;
  statusBadge?: { label: string; color: string };
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

        <Group align="flex-start" gap="md" wrap="nowrap">
          <AtletaInfo
            resumo={atletaA}
            lado="A"
            vencedor={aVenceu}
            desclassificado={aDesclassificado}
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

  useEffect(() => {
    window.electronAPI.getActiveTournament().then((t) => {
      setTorneio(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const atletas = useMemo<Atleta[]>(() => torneio?.atletas ?? [], [torneio]);
  const chaves = useMemo<Chave[]>(() => torneio?.chaves ?? [], [torneio]);
  const areas = useMemo<AreaLuta[]>(() => torneio?.areas ?? [], [torneio]);
  const arbitros = useMemo<Arbitro[]>(() => torneio?.arbitros ?? [], [torneio]);
  const lutasCasadas = useMemo<LutaCasada[]>(() => torneio?.lutasCasadas ?? [], [torneio]);

  const getAtletaNome = (id: string | null | undefined): string => {
    if (!id || id === 'tbd' || id === 'bye') return 'A definir';
    const a = atletas.find(x => x.id === id);
    if (!a) return 'Atleta removido';
    return capitalize(a.nome);
  };

  const getAtletaResumo = (id: string): AtletaResumo | null => {
    if (!id || id === 'tbd' || id === 'bye') return null;
    const a = atletas.find(x => x.id === id);
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

  const todasLutasFinalizadas = useMemo(() => {
    type Item = {
      chaveOrigem: string;
      ordem: number;
      rodada: number;
      luta: Luta | LutaCasada;
      isCasada: boolean;
    };
    const itens: Item[] = [];
    for (const c of chaves) {
      const titulo = getCategoriaTitulo(c.categoriaId);
      for (const l of c.lutas) {
        if (!isLutaValida(l)) continue;
        itens.push({ chaveOrigem: titulo, ordem: l.ordem, rodada: l.rodada, luta: l, isCasada: false });
      }
    }
    for (const l of lutasCasadas) {
      if (!isLutaValida(l)) continue;
      const titulo = `${capitalize(l.atletaASnapshot.nome)} × ${capitalize(l.atletaBSnapshot.nome)}`;
      const ordem = itens.length;
      itens.push({ chaveOrigem: titulo, ordem, rodada: 0, luta: l, isCasada: true });
    }
    itens.sort((a, b) => {
      if (a.chaveOrigem !== b.chaveOrigem) return a.chaveOrigem.localeCompare(b.chaveOrigem);
      if (a.isCasada !== b.isCasada) return a.isCasada ? 1 : -1;
      return a.ordem - b.ordem;
    });
    return itens;
  }, [chaves, lutasCasadas]);

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
            <Tabs.Tab value="lutas" leftSection={<IconSwords size={16} />}>Lutas</Tabs.Tab>
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
                  {chavesEncerradas.map(chave => {
                    const ouro = getChaveVencedorId(chave);
                    const prata = getChavePerdedorFinalId(chave);
                    const bronzes = getPerdedoresSemifinal(chave);
                    return (
                      <Card key={chave.id} withBorder padding="md" radius="md">
                        <Stack gap="xs">
                          <Text fw={700} size="sm">{getCategoriaTitulo(chave.categoriaId)} — {chave.totalAtletas} atleta(s)</Text>
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
          </Tabs.Panel>

          <Tabs.Panel value="lutas" pt="md">
            {todasLutasFinalizadas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma luta finalizada ainda.</Text>
            ) : (
              <Stack gap="md">
                {todasLutasFinalizadas.map((item, idx) => {
                  const prev = todasLutasFinalizadas[idx - 1];
                  const showHeader = !prev || prev.chaveOrigem !== item.chaveOrigem;
                  if (item.isCasada) {
                    const l = item.luta as LutaCasada;
                    const atletaA: AtletaResumo = {
                      id: l.atletaAId,
                      nome: l.atletaASnapshot.nome,
                      equipe: l.atletaASnapshot.equipe,
                      faixa: l.atletaASnapshot.faixa,
                      pesoKg: l.atletaASnapshot.pesoKg,
                      categoria: l.atletaASnapshot.categoria,
                    };
                    const atletaB: AtletaResumo = {
                      id: l.atletaBId,
                      nome: l.atletaBSnapshot.nome,
                      equipe: l.atletaBSnapshot.equipe,
                      faixa: l.atletaBSnapshot.faixa,
                      pesoKg: l.atletaBSnapshot.pesoKg,
                      categoria: l.atletaBSnapshot.categoria,
                    };
                    return (
                      <Stack gap="xs" key={l.id}>
                        {showHeader && (
                          <Title order={5} mt={idx === 0 ? 0 : 'md'}>{item.chaveOrigem}</Title>
                        )}
                        <LutaResumoCard
                          chaveOrigem={item.chaveOrigem}
                          atletaA={atletaA}
                          atletaB={atletaB}
                          placarA={l.placarA}
                          placarB={l.placarB}
                          vencedorId={l.vencedorId ?? ''}
                          finalizacao={l.finalizacao}
                          desclassificacao={l.desclassificacao}
                          desempateArbitro={l.desempateArbitro}
                          status={l.status as 'completed' | 'wo' | 'pending'}
                          tempoRealSegundos={l.tempoRealSegundos}
                          isCasada
                        />
                      </Stack>
                    );
                  }
                  const l = item.luta as Luta;
                  const atletaA = getAtletaResumo(l.atletaAId) ?? {
                    id: l.atletaAId,
                    nome: 'A definir',
                    equipe: '',
                    faixa: 'branca',
                    pesoKg: 0,
                    categoria: '',
                  };
                  const atletaB = getAtletaResumo(l.atletaBId) ?? {
                    id: l.atletaBId,
                    nome: 'A definir',
                    equipe: '',
                    faixa: 'branca',
                    pesoKg: 0,
                    categoria: '',
                  };
                  return (
                    <Stack gap="xs" key={l.id}>
                      {showHeader && (
                        <Title order={5} mt={idx === 0 ? 0 : 'md'}>{item.chaveOrigem}</Title>
                      )}
                      <LutaResumoCard
                        chaveOrigem={item.chaveOrigem}
                        ordem={l.ordem}
                        rodada={l.rodada}
                        atletaA={atletaA}
                        atletaB={atletaB}
                        placarA={l.placarA}
                        placarB={l.placarB}
                        vencedorId={l.vencedorId ?? ''}
                        finalizacao={l.finalizacao}
                        desclassificacao={l.desclassificacao}
                        desclassificadoId={l.desclassificadoId}
                        desempateArbitro={l.desempateArbitro}
                        status={l.status as 'completed' | 'wo' | 'pending'}
                        tempoRealSegundos={l.tempoRealSegundos}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="chaves" pt="md">
            {chaves.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma chave gerada.</Text>
            ) : (
              <Stack gap="md">
                {chaves.map(chave => {
                  const status = getChaveStatus(chave);
                  const vencedor = getChaveVencedorId(chave);
                  return (
                    <Card key={chave.id} withBorder padding="md" radius="md">
                      <Stack gap="sm">
                        <Group justify="space-between" wrap="wrap">
                          <Stack gap={2}>
                            <Text fw={700} size="sm">{getCategoriaTitulo(chave.categoriaId)}</Text>
                            <Text size="xs" c="dimmed">{chave.totalAtletas} atleta(s) · {chave.totalLutas} luta(s)</Text>
                          </Stack>
                          <Group gap="xs">
                            <Badge color={status.color} variant={status.color === 'yellow' ? 'filled' : 'light'}>
                              {status.label}
                            </Badge>
                            {vencedor && (
                              <Text size="sm" fw={600}>Vencedor: {getAtletaNome(vencedor)}</Text>
                            )}
                          </Group>
                        </Group>
                        <Divider />
                        <Stack gap="xs">
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
                                  chaveOrigem={getCategoriaTitulo(chave.categoriaId)}
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
                                  statusBadge={statusBadge}
                                />
                              );
                            })}
                        </Stack>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="casadas" pt="md">
            {lutasCasadas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma luta casada cadastrada.</Text>
            ) : (
              <Stack gap="xs">
                {lutasCasadas
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
                        isCasada
                        statusBadge={statusBadge}
                      />
                    );
                  })}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="equipes" pt="md">
            {atletas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhum atleta cadastrado.</Text>
            ) : (() => {
              const counts: Record<string, number> = {};
              for (const a of atletas) {
                const key = a.equipe || 'Sem equipe';
                counts[key] = (counts[key] ?? 0) + 1;
              }
              const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
              return (
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
                      {sorted.map(([equipe, count]) => {
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
              );
            })()}
          </Tabs.Panel>

          <Tabs.Panel value="arbitros" pt="md">
            {arbitros.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhum árbitro cadastrado.</Text>
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
                    {arbitros.map(a => (
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
          </Tabs.Panel>

          <Tabs.Panel value="atletas" pt="md">
            {atletas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhum atleta cadastrado.</Text>
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
                    {atletas.map(a => {
                      const chave = chaves.find(c => c.posicoesAtletas.includes(a.id));
                      return (
                        <Table.Tr key={a.id}>
                          <Table.Td>{capitalize(a.nome)}</Table.Td>
                          <Table.Td><Text tt="capitalize" size="sm">{a.equipe || '—'}</Text></Table.Td>
                          <Table.Td><Badge size="sm" variant="light">{FAIXA_LABEL[a.faixa] ?? a.faixa}</Badge></Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>{a.pesoKg.toFixed(1)}</Table.Td>
                          <Table.Td><Text size="sm">{getCategoriaTitulo(a.categoria)}</Text></Table.Td>
                          <Table.Td>
                            {chave ? (
                              <Text size="sm">{getCategoriaTitulo(chave.categoriaId)}</Text>
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
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </PageLayout>
  );
}
