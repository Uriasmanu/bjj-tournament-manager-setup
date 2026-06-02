import { Container, Paper, Title, Group, Button, Badge, Stack, Text, Loader, Center, Card, SimpleGrid, Modal, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';
import type { Chave } from '../types/bracket';
import { categoriaLabels } from '../types/category';
import { PageLayout } from '../components/PageLayout';

const FAIXA_ORDER: Record<string, number> = {
  'branca': 0, 'cinza': 1, 'amarela': 2, 'laranja': 3,
  'verde': 4, 'azul': 5, 'roxa': 6, 'marrom': 7, 'preta': 8,
};

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

const PESO_LABEL: Record<string, string> = {
  'galo': 'Galo', 'pluma': 'Pluma', 'pena': 'Pena', 'leve': 'Leve',
  'medio': 'Médio', 'meio-pesado': 'Meio-Pesado', 'pesado': 'Pesado',
  'super-pesado': 'Super Pesado', 'pesadissimo': 'Pesadíssimo',
};

function extrairPeso(categoriaId: string): string {
  const parts = categoriaId.split('-');
  const genIndex = parts.findIndex(p => p === 'masculino' || p === 'feminino');
  if (genIndex < 0) return categoriaId;
  const pesoKey = parts.slice(genIndex + 1).join('-');
  return PESO_LABEL[pesoKey] || pesoKey;
}

function getChaveTitle(chave: Chave, athletes: Atleta[]): string {
  const chaveAtletas = chave.posicoesAtletas
    .map(id => athletes.find(a => a.id === id))
    .filter((a): a is Atleta => a !== undefined);
  if (chaveAtletas.length === 0) return categoriaLabels[chave.categoriaId] || chave.categoriaId;

  const faixas = chaveAtletas.map(a => a.faixa);
  const levels = faixas.map(f => FAIXA_ORDER[f] ?? 0);
  const minFaixa = faixas[levels.indexOf(Math.min(...levels))];
  const maxFaixa = faixas[levels.indexOf(Math.max(...levels))];

  const beltRange = minFaixa === maxFaixa
    ? FAIXA_LABEL[minFaixa]
    : `${FAIXA_LABEL[minFaixa]} a ${FAIXA_LABEL[maxFaixa]}`;

  const peso = extrairPeso(chave.categoriaId);

  return `${beltRange} - ${peso} - ${chaveAtletas.length} atleta${chaveAtletas.length > 1 ? 's' : ''}`;
}

function getTeamConflicts(chave: Chave, athletes: Atleta[]): string[] {
  const teams = new Map<string, number[]>();
  chave.posicoesAtletas.forEach((id, idx) => {
    const a = athletes.find(at => at.id === id);
    if (a?.equipe) {
      const list = teams.get(a.equipe) ?? [];
      list.push(idx);
      teams.set(a.equipe, list);
    }
  });

  const conflicts: string[] = [];
  for (const [equipe, positions] of teams) {
    if (positions.length < 2) continue;
    const ladoA = [0, 3, 4];
    const ladoB = [1, 2];
    const hasA = positions.some(p => ladoA.includes(p));
    const hasB = positions.some(p => ladoB.includes(p));
    if (hasA && hasB) {
      const nomeEquipe = equipe.charAt(0).toUpperCase() + equipe.slice(1);
      conflicts.push(nomeEquipe);
    }
  }
  return conflicts;
}

function getFirstRoundFights(chave: Chave, athletes: Atleta[]): { atletaA: string; atletaB: string }[] {
  return chave.lutas.map(luta => ({
    atletaA: luta.atletaAId === 'bye' ? '(bye)' : getAtletaNomeStatic(luta.atletaAId, athletes),
    atletaB: luta.atletaBId === 'bye' ? '(bye)' : getAtletaNomeStatic(luta.atletaBId, athletes),
  }));
}

function getAtletaNomeStatic(id: string, athletes: Atleta[]): string {
  if (id === 'bye') return '(bye)';
  const atleta = athletes.find(a => a.id === id);
  if (!atleta) return 'Atleta removido';
  const nome = atleta.nome.charAt(0).toUpperCase() + atleta.nome.slice(1);
  const equipe = atleta.equipe ? ` (${atleta.equipe.charAt(0).toUpperCase() + atleta.equipe.slice(1)})` : '';
  return `${nome}${equipe}`;
}

export function GerenciarChaves() {
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [chaves, setChaves] = useState<Chave[]>([]);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [loading, setLoading] = useState(true);
  const [chavesGeradas, setChavesGeradas] = useState(false);
  const [atletasSemChave, setAtletasSemChave] = useState<Atleta[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewChave, setViewChave] = useState<Chave | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [confirmGerarOpen, { open: openConfirmGerar, close: closeConfirmGerar }] = useDisclosure(false);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  const sortedChaves = useMemo(() => {
    return [...chaves].sort((a, b) => {
      const titleA = getChaveTitle(a, athletes);
      const titleB = getChaveTitle(b, athletes);
      return titleA.localeCompare(titleB);
    });
  }, [chaves, athletes]);

  useEffect(() => {
    Promise.all([
      window.electronAPI.loadAthletes(),
      window.electronAPI.loadChaves(),
      window.electronAPI.loadArbitros(),
    ]).then(([a, c, r]) => {
      const chavesList = c as Chave[];
      const athletesList = a as Atleta[];
      setAthletes(athletesList);
      setChaves(chavesList);
      const arbitrosList = r as Arbitro[];
      arbitrosList.sort((a, b) => a.nome.localeCompare(b.nome));
      setArbitros(arbitrosList);
      setChavesGeradas(chavesList.length > 0);

      // Compute solo athletes: athletes not in any chave whose categoria has only 1 athlete
      const atletasEmChaves = new Set<string>();
      for (const chave of chavesList) {
        for (const id of chave.posicoesAtletas) {
          atletasEmChaves.add(id);
        }
      }
      const catCount = new Map<string, number>();
      for (const at of athletesList) {
        catCount.set(at.categoria, (catCount.get(at.categoria) ?? 0) + 1);
      }
      const solo: Atleta[] = [];
      for (const at of athletesList) {
        if (!atletasEmChaves.has(at.id) && (catCount.get(at.categoria) ?? 0) === 1) {
          solo.push(at);
        }
      }
      setAtletasSemChave(solo);

      setLoading(false);
    }).catch(() => {
      setLoading(false);
      notifications.show({ color: 'red', title: 'Erro', message: 'Erro ao carregar dados.' });
    });
  }, [refreshKey]);

  const getAtletaNome = (id: string): string => {
    if (id === 'bye') return '(bye)';
    const atleta = athletes.find(a => a.id === id);
    if (!atleta) return 'Atleta removido';
    const nome = atleta.nome.charAt(0).toUpperCase() + atleta.nome.slice(1);
    const equipe = atleta.equipe ? ` (${atleta.equipe.charAt(0).toUpperCase() + atleta.equipe.slice(1)})` : '';
    return `${nome}${equipe}`;
  };

  const getArbitroNome = (id: string | null): string => {
    if (!id) return 'Sem árbitro';
    const r = arbitros.find(a => a.id === id);
    if (!r) return 'Árbitro removido';
    return `${r.nome} (${FAIXA_LABEL[r.faixa]})`;
  };

  const handleGerarTodas = async () => {
    try {
      const result = await window.electronAPI.gerarTodasChaves() as { chaves: Chave[]; metadados: unknown[]; atletasSemChave: Atleta[] };
      setChaves(result.chaves);
      setAtletasSemChave(result.atletasSemChave ?? []);
      setChavesGeradas(true);
      const qtd = result.chaves.length;
      const solos = (result.atletasSemChave ?? []).length;
      const msg = solos > 0
        ? `${qtd} chave(s) gerada(s). ${solos} atleta(s) sem oponente na categoria.`
        : `${qtd} chave(s) gerada(s) com árbitro(s) atribuído(s) automaticamente.`;
      notifications.show({ color: solos > 0 ? 'yellow' : 'green', title: 'Sucesso', message: msg });
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao gerar chaves' });
    }
  };

  const handleGerarNovamente = async () => {
    closeConfirmGerar();
    try {
      const result = await window.electronAPI.gerarTodasChaves() as { chaves: Chave[]; metadados: unknown[]; atletasSemChave: Atleta[] };
      setChaves(result.chaves);
      setAtletasSemChave(result.atletasSemChave ?? []);
      const qtd = result.chaves.length;
      const solos = (result.atletasSemChave ?? []).length;
      const msg = solos > 0
        ? `${qtd} chave(s) regenerada(s). ${solos} atleta(s) sem oponente na categoria.`
        : `${qtd} chave(s) regenerada(s) com árbitro(s) reatribuído(s).`;
      notifications.show({ color: solos > 0 ? 'yellow' : 'green', title: 'Sucesso', message: msg });
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao regenerar chaves' });
    }
  };

  const handleRandomizar = async (chaveId: string) => {
    try {
      const updated = await window.electronAPI.randomizarChave({ chaveId });
      setChaves(prev => prev.map(c => c.id === chaveId ? updated : c));
      setViewChave(prev => prev?.id === chaveId ? updated : prev);
      notifications.show({ color: 'green', title: 'Sucesso', message: 'Chave embaralhada com separação de equipes.' });
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao embaralhar chave' });
    }
  };

  const handleTrocarArbitro = async (chaveId: string, arbitroId: string | null) => {
    try {
      const updated = await window.electronAPI.atribuirArbitroChave({ chaveId, arbitroId });
      setChaves(prev => prev.map(c => c.id === chaveId ? updated : c));
      triggerRefresh();
      const nome = arbitroId ? getArbitroNome(arbitroId) : 'Sem árbitro';
      notifications.show({
        color: arbitroId ? 'green' : 'blue',
        title: arbitroId ? 'Árbitro atribuído' : 'Árbitro removido',
        message: `${nome} na chave.`,
      });
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao alterar árbitro' });
    }
  };

  const handleViewChave = (chave: Chave) => {
    setViewChave(chave);
    setViewModalOpen(true);
  };

  const handleImportarChaves = async () => {
    try {
      const result = await window.electronAPI.importChaves();
      if (result.imported > 0) {
        notifications.show({ color: 'green', title: 'Sucesso', message: `${result.imported} chave(s) importada(s).` });
        triggerRefresh();
      }
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao importar chaves' });
    }
  };

  const handleExportarChaves = async () => {
    try {
      await window.electronAPI.exportChaves();
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao exportar chaves' });
    }
  };

  if (loading) {
    return (
      <Container fluid px="xl" py="xl" style={{ minHeight: '100vh' }}>
        <Center py="xl" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <Loader />
        </Center>
      </Container>
    );
  }

  const gruposValidos = athletes.filter(a => {
    const count = athletes.filter(a2 => a2.categoria === a.categoria).length;
    return count >= 1;
  });
  const categoriasComAtletas = new Set(gruposValidos.map(a => a.categoria));

  return (
    <PageLayout title="Gerenciar Chaves" backRoute="/admin/dashboard">
      <Stack gap="lg">
        {!chavesGeradas ? (
          <Center py="xl" style={{ minHeight: '40vh' }}>
            <Stack align="center" gap="lg">
              <Title order={3}>Gerar Chaves do Torneio</Title>
              <Text c="dimmed" ta="center">
                {categoriasComAtletas.size > 0
                  ? `${categoriasComAtletas.size} categoria(s) com atletas para gerar chave.`
                  : 'Nenhuma categoria com atletas encontrada. Cadastre atletas primeiro.'}
              </Text>
              {categoriasComAtletas.size > 0 && (
                <Button size="xl" onClick={handleGerarTodas}>
                  Gerar Chaves
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <>
            <Group justify="space-between" w="100%">
              <Group>
                <Button onClick={openConfirmGerar} variant="light">Gerar Novamente</Button>
              </Group>
              <Group>
                <Button onClick={handleImportarChaves} variant="light">Importar Chaves</Button>
                <Button onClick={handleExportarChaves} variant="light">Exportar Chaves</Button>
              </Group>
            </Group>

            <Paper withBorder shadow="sm" p="md" radius="md">
              <Title order={4} mb="md">Chaves Geradas ({chaves.length})</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {sortedChaves.map(chave => {
                  const chaveAtletas = chave.posicoesAtletas
                    .map(id => athletes.find(a => a.id === id))
                    .filter((a): a is Atleta => a !== undefined);
                  return (
                    <Card key={chave.id} withBorder shadow="sm" padding="md" radius="md">
                      <Stack gap="xs">
                        <Text fw={700} size="sm">{getChaveTitle(chave, athletes)}</Text>
                        <Group gap={4}>
                          <Badge size="sm" color="grape">{chave.totalLutas} luta(s)</Badge>
                          <Badge size="sm" color="green">Gerada</Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          Árbitro: {getArbitroNome(chave.arbitroId)}
                        </Text>
                        {chaveAtletas.length > 0 && (
                          <Text size="xs" c="dimmed">
                            Atletas: {chaveAtletas.map(a => a.nome.charAt(0).toUpperCase() + a.nome.slice(1)).join(', ')}
                          </Text>
                        )}
                        <Group grow>
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => handleRandomizar(chave.id)}
                          >
                            Embaralhar
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleViewChave(chave)}
                          >
                            Visualizar
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Paper>

            {atletasSemChave.length > 0 && (
              <Paper withBorder shadow="sm" p="md" radius="md" bg="orange.0">
                <Title order={4} mb="md" c="orange.8">Atletas Sem Chave ({atletasSemChave.length})</Title>
                <Text size="sm" c="dimmed" mb="sm">
                  Estes atletas não puderam ser colocados em uma chave por serem os únicos em sua categoria.
                </Text>
                {atletasSemChave.map(at => (
                  <Text key={at.id} size="sm">
                    {at.nome.charAt(0).toUpperCase() + at.nome.slice(1)}
                    {at.equipe ? ` (${at.equipe.charAt(0).toUpperCase() + at.equipe.slice(1)})` : ''}
                    {' — '}{categoriaLabels[at.categoria] || at.categoria}
                  </Text>
                ))}
              </Paper>
            )}
          </>
        )}
      </Stack>

      <Modal
        opened={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setViewChave(null); }}
        title={viewChave ? getChaveTitle(viewChave, athletes) : 'Chave'}
        size="lg"
      >
        {viewChave && (
          <Stack gap="md">
            <Paper withBorder p="sm" radius="sm">
              <Text size="sm" fw={600} mb="xs">Árbitro da Chave</Text>
              <Text size="sm">{getArbitroNome(viewChave.arbitroId)}</Text>
              {viewChave.arbitroId && (
                <Select
                  size="xs"
                  mt="xs"
                  placeholder="Trocar árbitro..."
                  data={arbitros.map(r => ({ value: r.id, label: `${r.nome} (${FAIXA_LABEL[r.faixa]}) — ${r.equipe || 'Sem equipe'}` }))}
                  value={viewChave.arbitroId}
                  onChange={(val) => {
                    if (val !== undefined) {
                      handleTrocarArbitro(viewChave.id, val ?? null);
                    }
                  }}
                  clearable
                />
              )}
            </Paper>

            <Group justify="space-between" w="100%">
              <Text size="sm" fw={600}>Ações</Text>
              <Button size="xs" variant="light" onClick={() => handleRandomizar(viewChave.id)}>
                Embaralhar
              </Button>
            </Group>

            <Paper withBorder p="sm" radius="sm">
              <Text size="sm" fw={600} mb="xs">Lutas da 1ª Rodada</Text>
              {getFirstRoundFights(viewChave, athletes).map((fight, i) => (
                <Text key={i} size="sm">
                  {i + 1}. {fight.atletaA} vs {fight.atletaB}
                </Text>
              ))}
            </Paper>

            <Paper withBorder p="sm" radius="sm">
              <Text size="sm" fw={600} mb="xs">Ordem dos Atletas</Text>
              {viewChave.posicoesAtletas.map((id, i) => (
                <Text key={id} size="sm">
                  {i + 1}. {getAtletaNome(id)}
                </Text>
              ))}
            </Paper>

            {getTeamConflicts(viewChave, athletes).length > 0 && (
              <Paper withBorder p="sm" radius="sm" bg="yellow.0">
                <Text size="sm" c="orange.8" fw={500}>
                  Atenção: atletas da mesma equipe estão no mesmo lado da chave: {getTeamConflicts(viewChave, athletes).join(', ')}.
                  Use "Embaralhar" para tentar uma distribuição melhor.
                </Text>
              </Paper>
            )}
          </Stack>
        )}
      </Modal>

      <Modal
        opened={confirmGerarOpen}
        onClose={closeConfirmGerar}
        title="Confirmar Regeneração"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Deseja realmente gerar novamente todas as chaves? As chaves atuais serão substituídas.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeConfirmGerar}>Cancelar</Button>
            <Button color="red" onClick={handleGerarNovamente}>Gerar Novamente</Button>
          </Group>
        </Stack>
      </Modal>
    </PageLayout>
  );
}
