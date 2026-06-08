import { Text, Card, Stack, Group, Badge, Loader, Center, TextInput, Button } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';
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

  const sortedChaves = useMemo(() => {
    const list = chaves.slice();

    const getLatestTs = (chave: Chave): string => {
      let max = '';
      for (const l of chave.lutas) {
        const ts = l.horarioTermino || l.horarioInicio || '';
        if (ts > max) max = ts;
      }
      return max;
    };

    list.sort((a, b) => {
      const aEncerrado = a.lutas.some(l => l.rodada === Math.max(...a.lutas.map(x => x.rodada)) && l.vencedorId);
      const bEncerrado = b.lutas.some(l => l.rodada === Math.max(...b.lutas.map(x => x.rodada)) && l.vencedorId);
      if (aEncerrado !== bEncerrado) return aEncerrado ? 1 : -1;
      return getLatestTs(b).localeCompare(getLatestTs(a));
    });

    return list;
  }, [chaves]);

  const filteredChaves = useMemo(() => {
    if (!searchQuery.trim()) return sortedChaves;
    const q = searchQuery.toLowerCase().trim();
    return sortedChaves.filter(chave =>
      getChaveTitle(chave, athletes).toLowerCase().includes(q)
    );
  }, [sortedChaves, athletes, searchQuery]);

  const filteredLutasCasadas = useMemo(() => {
    if (!searchQuery.trim()) return lutasCasadas;
    const q = searchQuery.toLowerCase().trim();
    return lutasCasadas.filter(l => {
      const nomeA = l.atletaASnapshot.nome.toLowerCase();
      const nomeB = l.atletaBSnapshot.nome.toLowerCase();
      return nomeA.includes(q) || nomeB.includes(q);
    });
  }, [lutasCasadas, searchQuery]);

  const getArbitroNome = (id: string | null): string => {
    if (!id) return 'Sem árbitro';
    const r = arbitros.find(a => a.id === id);
    if (!r) return 'Árbitro removido';
    return `${r.nome} (${FAIXA_LABEL[r.faixa]})`;
  };

  if (loading) {
    return (
      <Center py="xl" style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  const totalItens = filteredChaves.length + filteredLutasCasadas.length;

  return (
    <PageLayout title={area ? `Placar - ${area.nome}` : 'Placar'} backRoute="/admin/placar">
      <Stack gap="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Text c="dimmed" size="sm">
            {chaves.length} chave(s) e {lutasCasadas.length} luta(s) casada(s) nesta área. Clique para ver as lutas.
          </Text>
          <Button
            size="sm"
            color="dark"
            leftSection={<IconPlus size={16} />}
            onClick={() => setModalLutaCasadaOpen(true)}
          >
            Nova Luta Casada
          </Button>
        </Group>

        <TextInput
          placeholder="Buscar chave, atleta ou luta casada..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          w={360}
        />

        {totalItens === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {chaves.length === 0 && lutasCasadas.length === 0
              ? 'Nenhuma chave ou luta casada associada a esta área de luta.'
              : `Nenhum item encontrado para a busca "${searchQuery}"`}
          </Text>
        ) : (
          <Stack gap="md">
            {filteredChaves.map(chave => {
              const chaveAtletas = chave.posicoesAtletas
                .map(id => athletes.find(a => a.id === id))
                .filter((a): a is Atleta => a !== undefined);
              const maxRodada = Math.max(...chave.lutas.map(l => l.rodada));
              const isEncerrado = chave.lutas.some(l => l.rodada === maxRodada && l.vencedorId);
              const isEmAndamento = !isEncerrado && chave.lutas.some(l => l.status === 'completed');
              return (
                <Card
                  key={chave.id}
                  withBorder
                  shadow="sm"
                  padding="md"
                  radius="md"
                  role="button"
                  tabIndex={0}
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                    opacity: isEncerrado ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  onClick={() => navigate(`/admin/placar/chave/${areaId}/${chave.id}`)}
                >
                  {isEncerrado && (
                    <Badge size="sm" color="yellow" variant="filled" style={{ position: 'absolute', top: 8, right: 8 }}>
                      ENCERRADO
                    </Badge>
                  )}
                  {isEmAndamento && (
                    <Badge size="sm" color="cyan" variant="filled" style={{ position: 'absolute', top: 8, right: 8 }}>
                      EM ANDAMENTO
                    </Badge>
                  )}
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

            {filteredLutasCasadas
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map(luta => {
                const nomeA = luta.atletaASnapshot.nome.charAt(0).toUpperCase() + luta.atletaASnapshot.nome.slice(1);
                const nomeB = luta.atletaBSnapshot.nome.charAt(0).toUpperCase() + luta.atletaBSnapshot.nome.slice(1);
                const vencedorId = luta.vencedorId;
                const vencedorNome = vencedorId === luta.atletaAId ? nomeA
                  : vencedorId === luta.atletaBId ? nomeB
                  : null;
                return (
                  <Card
                    key={`luta-casada-${luta.id}`}
                    withBorder
                    shadow="sm"
                    padding="md"
                    radius="md"
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onClick={() => navigate(`/admin/placar/luta-casada/${areaId}/${luta.id}`)}
                  >
                    <Badge size="sm" color="dark" variant="filled" style={{ position: 'absolute', top: 8, right: 8 }}>
                      LUTA CASADA
                    </Badge>
                    <Stack gap="xs">
                      <Text fw={700} size="sm">
                        {nomeA} <Text component="span" c="dimmed" fw={500}>vs</Text> {nomeB}
                      </Text>
                      <Group gap={4}>
                        {luta.status === 'pending' && <Badge size="sm" color="yellow" variant="light">PENDENTE</Badge>}
                        {luta.status === 'completed' && <Badge size="sm" color="green" variant="filled">FINALIZADA</Badge>}
                        {luta.status === 'wo' && <Badge size="sm" color="red" variant="filled">WO</Badge>}
                      </Group>
                      <Text size="xs" c="dimmed">
                        Árbitro: {luta.arbitroId
                          ? (() => {
                              const r = arbitros.find(a => a.id === luta.arbitroId);
                              if (!r) return 'Árbitro removido';
                              return `${r.nome.charAt(0).toUpperCase() + r.nome.slice(1)} (${FAIXA_LABEL[r.faixa] ?? r.faixa})`;
                            })()
                          : 'Sem árbitro'}
                      </Text>
                      {vencedorNome && (
                        <Text size="xs" c="dimmed">
                          Vencedor: <Text component="span" fw={700} c="green.7">{vencedorNome}</Text>
                        </Text>
                      )}
                    </Stack>
                  </Card>
                );
              })}
          </Stack>
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
