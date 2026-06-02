import { Container, Paper, Title, Text, Select, Button, Center, Stack, Loader } from '@mantine/core';
import { IconScoreboard } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { AreaLuta } from '../types/area';

export function PlacarMenu() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaLuta[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI.loadAreas().then((data) => {
      setAreas(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
    <Container fluid px="xl" py="xl" style={{ minHeight: '100vh', width: '100%' }}>
      <Paper withBorder shadow="sm" p="clamp(12px, 2vw, 24px)" radius="md" style={{ minHeight: 'calc(100vh - 4rem)', width: '100%' }}>
        <Stack gap="lg" align="center" style={{ paddingTop: '10vh' }}>
          <IconScoreboard size={48} />
          <Title order={2}>Placar</Title>

          {areas.length === 0 ? (
            <Text c="dimmed" ta="center">Nenhuma área de luta cadastrada. Cadastre áreas primeiro.</Text>
          ) : (
            <>
              <Text c="dimmed" ta="center">Selecione a área de luta:</Text>
              <Select
                placeholder="Selecione uma área..."
                data={areas.map(a => ({ value: a.id, label: a.nome }))}
                value={selectedArea}
                onChange={setSelectedArea}
                w={320}
                searchable
              />
              <Button
                disabled={!selectedArea}
                onClick={() => navigate(`/admin/placar/chaves/${selectedArea}`)}
              >
                Acessar
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
