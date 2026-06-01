import { Container, Paper, Title, Group, Button, Badge, Stack, Text, Loader, Center, Card, SimpleGrid } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';
import type { Chave } from '../types/bracket';
import { categoriaLabels } from '../types/category';
import { PageLayout } from '../components/PageLayout';
import { EditarChaveModal } from '../components/EditarChaveModal';

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

export function GerenciarChaves() {
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [chaves, setChaves] = useState<Chave[]>([]);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [loading, setLoading] = useState(true);
  const [chavesGeradas, setChavesGeradas] = useState(false);
  const [editingChave, setEditingChave] = useState<Chave | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    Promise.all([
      window.electronAPI.loadAthletes(),
      window.electronAPI.loadChaves(),
      window.electronAPI.loadArbitros(),
    ]).then(([a, c, r]) => {
      const chavesList = c as Chave[];
      setAthletes(a as Atleta[]);
      setChaves(chavesList);
      setArbitros(r as Arbitro[]);
      setChavesGeradas(chavesList.length > 0);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      notifications.show({ color: 'red', title: 'Erro', message: 'Erro ao carregar dados.' });
    });
  }, [refreshKey]);

  const getAtletaNome = (id: string | null): string => {
    if (!id) return 'Aguardando...';
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
      const result = await window.electronAPI.gerarTodasChaves();
      setChaves(result);
      setChavesGeradas(true);
      const qtd = result.length;
      notifications.show({
        color: 'green',
        title: 'Sucesso',
        message: `${qtd} chave(s) gerada(s) com árbitro(s) atribuído(s) automaticamente.`,
      });
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao gerar chaves' });
    }
  };

  const handleGerarNovamente = async () => {
    try {
      const result = await window.electronAPI.gerarTodasChaves();
      setChaves(result);
      const qtd = result.length;
      notifications.show({
        color: 'green',
        title: 'Sucesso',
        message: `${qtd} chave(s) regenerada(s) com árbitro(s) reatribuído(s).`,
      });
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao regenerar chaves' });
    }
  };

  const handleEditarSalvar = async (chaveId: string, posicoesAtletas: string[]) => {
    try {
      const updated = await window.electronAPI.editarChave({ chaveId, posicoesAtletas });
      setChaves(prev => prev.map(c => c.id === chaveId ? updated : c));
      notifications.show({ color: 'green', title: 'Sucesso', message: 'Posições da chave atualizadas.' });
    } catch (err: unknown) {
      notifications.show({ color: 'red', title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao salvar edição' });
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

  const handleOpenEdit = (chave: Chave) => {
    setEditingChave(chave);
    setEditModalOpen(true);
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
    return count >= 2 && count <= 5;
  });
  const categoriasValidas = new Set(gruposValidos.map(a => a.categoria));

  return (
    <PageLayout title="Gerenciar Chaves" backRoute="/admin/dashboard">
      <Stack gap="lg">
        {!chavesGeradas ? (
          <Center py="xl" style={{ minHeight: '40vh' }}>
            <Stack align="center" gap="lg">
              <Title order={3}>Gerar Chaves do Torneio</Title>
              <Text c="dimmed" ta="center">
                {categoriasValidas.size > 0
                  ? `${categoriasValidas.size} categoria(s) com atletas suficientes (2 a 5) para gerar chave.`
                  : 'Nenhuma categoria com 2 a 5 atletas encontrada. Cadastre atletas primeiro.'}
              </Text>
              {categoriasValidas.size > 0 && (
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
                <Button onClick={handleGerarNovamente} variant="light">Gerar Novamente</Button>
              </Group>
              <Group>
                <Button onClick={handleImportarChaves} variant="light">Importar Chaves</Button>
                <Button onClick={handleExportarChaves} variant="light">Exportar Chaves</Button>
              </Group>
            </Group>

            <Paper withBorder shadow="sm" p="md" radius="md">
              <Title order={4} mb="md">Chaves Geradas ({chaves.length})</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {chaves.map(chave => {
                  const chaveAtletas = chave.posicoesAtletas
                    .map(id => athletes.find(a => a.id === id))
                    .filter((a): a is Atleta => a !== undefined);
                  return (
                    <Card key={chave.id} withBorder shadow="sm" padding="md" radius="md">
                      <Stack gap="xs">
                        <Text fw={700} size="sm">{getChaveTitle(chave, athletes)}</Text>
                        <Group gap={4}>
                          <Badge size="sm" color="violet">{chave.totalRodadas} rodada(s)</Badge>
                          <Badge size="sm" color="grape">{chave.totalLutas} luta(s)</Badge>
                          <Badge size="sm" color={chave.status === 'gerada' ? 'green' : chave.status === 'em_andamento' ? 'yellow' : 'blue'}>
                            {chave.status === 'gerada' ? 'Gerada' : chave.status === 'em_andamento' ? 'Em andamento' : 'Finalizada'}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          Árbitro: {getArbitroNome(chave.arbitroId)}
                        </Text>
                        {chaveAtletas.length > 0 && (
                          <Text size="xs" c="dimmed">
                            Atletas: {chaveAtletas.map(a => a.nome.charAt(0).toUpperCase() + a.nome.slice(1)).join(', ')}
                          </Text>
                        )}
                        {chave.status === 'gerada' && (
                          <Button
                            size="xs"
                            variant="light"
                            fullWidth
                            onClick={() => handleOpenEdit(chave)}
                          >
                            Editar Chave
                          </Button>
                        )}
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Paper>
          </>
        )}
      </Stack>

      <EditarChaveModal
        opened={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingChave(null); }}
        chave={editingChave}
        getAtletaNome={getAtletaNome}
        arbitros={arbitros}
        onSave={handleEditarSalvar}
        onTrocarArbitro={handleTrocarArbitro}
      />
    </PageLayout>
  );
}
