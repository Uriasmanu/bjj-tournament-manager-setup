import { Container, Paper, Title, Text, Center, Stack, Loader, Group, Badge } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import type { Chave, Luta } from '../types/bracket';
import type { Atleta } from '../types/athlete';

export function PlacarLuta() {
  const { chaveId, lutaId } = useParams<{ chaveId: string; lutaId: string }>();
  const [chave, setChave] = useState<Chave | null>(null);
  const [luta, setLuta] = useState<Luta | null>(null);
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chaveId || !lutaId) return;
    Promise.all([
      window.electronAPI.loadChaves(),
      window.electronAPI.loadAthletes(),
    ]).then(([chaves, ath]) => {
      const foundChave = (chaves as Chave[]).find(c => c.id === chaveId) ?? null;
      setChave(foundChave);
      const foundLuta = foundChave?.lutas.find(l => l.id === lutaId) ?? null;
      setLuta(foundLuta);
      setAthletes(ath as Atleta[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chaveId, lutaId]);

  const getAtletaNome = (id: string): string => {
    if (id === 'bye' || id === 'tbd') return 'A definir';
    const atleta = athletes.find(a => a.id === id);
    if (!atleta) return 'Atleta removido';
    const nome = atleta.nome.charAt(0).toUpperCase() + atleta.nome.slice(1);
    const equipe = atleta.equipe ? ` (${atleta.equipe.charAt(0).toUpperCase() + atleta.equipe.slice(1)})` : '';
    return `${nome}${equipe}`;
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

  if (!luta || !chave) {
    return (
      <PageLayout title="Placar" backRoute="/admin/placar">
        <Text c="dimmed" ta="center" py="xl">Luta não encontrada.</Text>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Luta ${luta.ordem}`} backRoute={`/admin/placar/chave/${chaveId}`}>
      <Center style={{ minHeight: '50vh' }}>
        <Stack align="center" gap="xl">
          <Title order={1}>Placar</Title>
          <Badge size="lg" color="blue" variant="light">
            Luta {luta.ordem}
          </Badge>
          <Group gap="xl">
            <Paper withBorder shadow="sm" p="xl" radius="md" style={{ minWidth: 200, textAlign: 'center' }}>
              <Text size="xl" fw={700}>{getAtletaNome(luta.atletaAId)}</Text>
            </Paper>
            <Text size="xl" fw={700}>VS</Text>
            <Paper withBorder shadow="sm" p="xl" radius="md" style={{ minWidth: 200, textAlign: 'center' }}>
              <Text size="xl" fw={700}>{getAtletaNome(luta.atletaBId)}</Text>
            </Paper>
          </Group>
        </Stack>
      </Center>
    </PageLayout>
  );
}
