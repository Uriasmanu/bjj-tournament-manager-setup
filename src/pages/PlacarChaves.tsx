import { Container, Text, Card, Stack, Group, Badge, Loader, Center, SimpleGrid, TextInput, Button } from '@mantine/core';
import { IconSearch, IconPlus, IconSwords } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { ModalCriarLutaCasada } from '../components/ModalCriarLutaCasada';
import type { Chave } from '../types/bracket';
import type { AreaLuta } from '../types/area';
import type { Arbitro } from '../types/referee';
import type { Atleta } from '../types/athlete';
import type { LutaCasada } from '../types/lutaCasada';
import { categoriaLabels } from '../types/category';

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
  return PESO_LABEL[parts.slice(genIndex + 1).join('-')] || categoriaId;
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

export function PlacarChaves() {
  const navigate = useNavigate();
  const { areaId } = useParams<{ areaId: string }>();
  const [chaves, setChaves] = useState<Chave[]>([]);
  const [area, setArea] = useState<AreaLuta | null>(null);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [lutasCasadas, setLutasCasadas] = useState<LutaCasada[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalLutaCasadaOpen, setModalLutaCasadaOpen] = useState(false);

  useEffect(() => {
    if (!areaId) return;
    Promise.all([
      window.electronAPI.loadAreas(),
      window.electronAPI.loadChavesPorArea(areaId),
      window.electronAPI.loadArbitros(),
      window.electronAPI.loadAthletes(),
      window.electronAPI.loadLutasCasadasPorArea(areaId),
    ]).then(([areas, ch, arb, ath, lutas]) => {
      const found = (areas as AreaLuta[]).find(a => a.id === areaId);
      setArea(found ?? null);
      setChaves(ch);
      setArbitros(arb as Arbitro[]);
      setAthletes(ath as Atleta[]);
      setLutasCasadas(lutas as LutaCasada[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [areaId]);

  const handleLutaCasadaCriada = (luta: LutaCasada) => {
    setLutasCasadas(prev => [...prev, luta]);
    navigate(`/admin/placar/luta-casada/${areaId}/${luta.id}`);
  };

  const filteredChaves = useMemo(() => {
    if (!searchQuery.trim()) return chaves;
    const q = searchQuery.toLowerCase().trim();
    return chaves.filter(chave =>
      getChaveTitle(chave, athletes).toLowerCase().includes(q)
    );
  }, [chaves, athletes, searchQuery]);

  const getArbitroNome = (id: string | null): string => {
    if (!id) return 'Sem árbitro';
    const r = arbitros.find(a => a.id === id);
    if (!r) return 'Árbitro removido';
    return `${r.nome} (${FAIXA_LABEL[r.faixa]})`;
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

  return (
    <PageLayout title={area ? `Placar - ${area.nome}` : 'Placar'} backRoute="/admin/placar">
      <Stack gap="lg">
        <Text c="dimmed" size="sm">
          {chaves.length} chave(s) nesta área. Clique em uma chave para ver as lutas.
        </Text>

        <Card withBorder shadow="sm" padding="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Group gap="xs" align="center">
                <IconSwords size={20} color="grape" />
                <Text fw={700} size="md">Lutas Casadas</Text>
                <Badge size="sm" color="grape" variant="light">{lutasCasadas.length}</Badge>
              </Group>
              <Button
                size="sm"
                color="grape"
                leftSection={<IconPlus size={16} />}
                onClick={() => setModalLutaCasadaOpen(true)}
              >
                Nova Luta Casada
              </Button>
            </Group>
            {lutasCasadas.length === 0 ? (
              <Text size="sm" c="dimmed">
                Nenhuma luta casada cadastrada. Clique em "Nova Luta Casada" para criar uma luta de exibição.
              </Text>
            ) : (
              <Stack gap="xs">
                {lutasCasadas
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map(luta => (
                    <Card
                      key={luta.id}
                      withBorder
                      padding="sm"
                      radius="sm"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/placar/luta-casada/${areaId}/${luta.id}`)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                          <Text size="sm" fw={600} truncate>
                            {luta.atletaASnapshot.nome.charAt(0).toUpperCase() + luta.atletaASnapshot.nome.slice(1)}
                          </Text>
                          <Text size="xs" c="dimmed">vs</Text>
                          <Text size="sm" fw={600} truncate>
                            {luta.atletaBSnapshot.nome.charAt(0).toUpperCase() + luta.atletaBSnapshot.nome.slice(1)}
                          </Text>
                        </Group>
                        <Group gap="xs" wrap="nowrap">
                          <Badge size="sm" color="grape" variant="filled">LUTA CASADA</Badge>
                          {luta.status === 'pending' && <Badge size="sm" color="yellow" variant="light">PENDENTE</Badge>}
                          {luta.status === 'completed' && <Badge size="sm" color="green" variant="filled">FINALIZADA</Badge>}
                          {luta.status === 'wo' && <Badge size="sm" color="red" variant="filled">WO</Badge>}
                        </Group>
                      </Group>
                    </Card>
                  ))}
              </Stack>
            )}
          </Stack>
        </Card>

        <TextInput
          placeholder="Buscar chave..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          w={320}
        />

        {filteredChaves.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {chaves.length === 0
              ? 'Nenhuma chave associada a esta área de luta.'
              : `Nenhuma chave encontrada para a busca "${searchQuery}"`}
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {filteredChaves.map(chave => {
              const chaveAtletas = chave.posicoesAtletas
                .map(id => athletes.find(a => a.id === id))
                .filter((a): a is Atleta => a !== undefined);
              return (
                <Card
                  key={chave.id}
                  withBorder
                  shadow="sm"
                  padding="md"
                  radius="md"
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  onClick={() => navigate(`/admin/placar/chave/${areaId}/${chave.id}`)}
                >
                  {(() => {
                    const maxRodada = Math.max(...chave.lutas.map(l => l.rodada));
                    const isEncerrado = chave.lutas.some(l => l.rodada === maxRodada && l.vencedorId);
                    const isEmAndamento = !isEncerrado && chave.lutas.some(l => l.status === 'completed');
                    if (isEncerrado) {
                      return (
                        <Badge size="sm" color="yellow" variant="filled" style={{ position: 'absolute', top: 8, right: 8 }}>
                          ENCERRADO
                        </Badge>
                      );
                    }
                    if (isEmAndamento) {
                      return (
                        <Badge size="sm" color="cyan" variant="filled" style={{ position: 'absolute', top: 8, right: 8 }}>
                          EM ANDAMENTO
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                  <Stack gap="xs">
                    <Text fw={700} size="sm">{getChaveTitle(chave, athletes)}</Text>
                    <Group gap={4}>
                      <Badge size="sm" color="blue">{chave.totalLutas} luta(s)</Badge>
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
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>

      {area && (
        <ModalCriarLutaCasada
          opened={modalLutaCasadaOpen}
          onClose={() => setModalLutaCasadaOpen(false)}
          area={area}
          atletas={athletes}
          arbitros={arbitros}
          onCriada={handleLutaCasadaCriada}
        />
      )}
    </PageLayout>
  );
}
