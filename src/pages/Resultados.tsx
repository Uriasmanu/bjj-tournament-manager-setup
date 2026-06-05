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
} from '@mantine/core';
import {
  IconTrophy,
  IconBrackets,
  IconUsers,
  IconUserShield,
  IconBuildingSkyscraper,
  IconSwords,
  IconChartBar,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Torneio } from '../types/tournament';
import type { Atleta } from '../types/athlete';
import type { Chave } from '../types/bracket';
import type { Arbitro } from '../types/referee';
import type { AreaLuta } from '../types/area';
import type { LutaCasada } from '../types/lutaCasada';
import { categoriaLabels } from '../types/category';
import { PageLayout } from '../components/PageLayout';

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

          <Tabs.Panel value="chaves" pt="md">
            {chaves.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma chave gerada.</Text>
            ) : (
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Categoria</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Atletas</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Vencedor</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {chaves.map(chave => {
                      const status = getChaveStatus(chave);
                      const vencedor = getChaveVencedorId(chave);
                      return (
                        <Table.Tr key={chave.id}>
                          <Table.Td>{getCategoriaTitulo(chave.categoriaId)}</Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>{chave.totalAtletas}</Table.Td>
                          <Table.Td>
                            <Badge color={status.color} variant={status.color === 'yellow' ? 'filled' : 'light'}>
                              {status.label}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {vencedor ? (
                              <Text size="sm" fw={600}>{getAtletaNome(vencedor)}</Text>
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

          <Tabs.Panel value="casadas" pt="md">
            {lutasCasadas.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">Nenhuma luta casada cadastrada.</Text>
            ) : (
              <Stack gap="xs">
                {lutasCasadas
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map(luta => {
                    const nomeA = capitalize(luta.atletaASnapshot.nome);
                    const nomeB = capitalize(luta.atletaBSnapshot.nome);
                    const vencedorId = luta.vencedorId;
                    const vencedorNome = vencedorId === luta.atletaAId ? nomeA
                      : vencedorId === luta.atletaBId ? nomeB
                      : null;
                    return (
                      <Card key={luta.id} withBorder padding="sm" radius="sm">
                        <Group justify="space-between" wrap="wrap">
                          <Stack gap={2} style={{ flex: 1 }}>
                            <Group gap="xs">
                              <Text size="sm" fw={600}>{nomeA}</Text>
                              <Text size="sm" c="dimmed">vs</Text>
                              <Text size="sm" fw={600}>{nomeB}</Text>
                            </Group>
                            {vencedorNome && (
                              <Text size="xs" c="green.7">Vencedor: {vencedorNome}</Text>
                            )}
                          </Stack>
                          <Group gap="xs">
                            <Badge size="sm" color="dark" variant="filled">LUTA CASADA</Badge>
                            {luta.status === 'pending' && <Badge size="sm" color="yellow" variant="light">PENDENTE</Badge>}
                            {luta.status === 'completed' && <Badge size="sm" color="green" variant="filled">FINALIZADA</Badge>}
                            {luta.status === 'wo' && <Badge size="sm" color="red" variant="filled">WO</Badge>}
                          </Group>
                        </Group>
                      </Card>
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
