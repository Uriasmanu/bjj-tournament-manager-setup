import { Container, Text, Card, Stack, Group, Badge, Loader, Center, SimpleGrid, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import type { Chave } from '../types/bracket';
import type { AreaLuta } from '../types/area';
import type { Arbitro } from '../types/referee';
import type { Atleta } from '../types/athlete';
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!areaId) return;
    Promise.all([
      window.electronAPI.loadAreas(),
      window.electronAPI.loadChavesPorArea(areaId),
      window.electronAPI.loadArbitros(),
      window.electronAPI.loadAthletes(),
    ]).then(([areas, ch, arb, ath]) => {
      const found = (areas as AreaLuta[]).find(a => a.id === areaId);
      setArea(found ?? null);
      setChaves(ch);
      setArbitros(arb as Arbitro[]);
      setAthletes(ath as Atleta[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [areaId]);

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
                    const isEmAndamento = !isEncerrado && chave.lutas.some(l => l.status === 'completed' || l.status === 'wo');
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
    </PageLayout>
  );
}
