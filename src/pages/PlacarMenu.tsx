import { Text, Select, Button, Center, Stack, Loader } from '@mantine/core';
import { IconScoreboard } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { AreaLuta } from '../types/area';
import type { Chave } from '../types/bracket';
import { PageLayout } from '../components/PageLayout';
import { useTournamentMode } from '../utils/TournamentModeContext';

export function PlacarMenu() {
  const navigate = useNavigate();
  const { mode } = useTournamentMode();
  const [areas, setAreas] = useState<AreaLuta[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      window.electronAPI.loadAreas(),
      window.electronAPI.loadChaves(),
    ]).then(([areasData, chavesData]) => {
      const loadedAreas = areasData as AreaLuta[];
      const chaves = chavesData as Chave[];
      setAreas(loadedAreas);

      let latestTs = '';
      let latestAreaId: string | null = null;

      for (const chave of chaves) {
        for (const luta of chave.lutas) {
          const ts = luta.horarioTermino || luta.horarioInicio || '';
          if (ts > latestTs) {
            latestTs = ts;
            const area = loadedAreas.find(a => a.arbitroIds.includes(chave.arbitroId ?? ''));
            if (area) latestAreaId = area.id;
          }
        }
      }

      setSelectedArea(latestAreaId);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Center py="xl" style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  return (
    <PageLayout title="Placar" backRoute={mode === 'area' ? '/admin/listar-torneios' : '/admin/dashboard'}>
      <Stack gap="lg" align="center">
        <IconScoreboard size={48} />

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
    </PageLayout>
  );
}
