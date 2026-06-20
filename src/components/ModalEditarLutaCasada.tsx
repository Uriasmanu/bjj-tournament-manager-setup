import { useEffect, useMemo, useState } from 'react';
import { Modal, Stack, Select, Group, Button, Text, Paper, Badge, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';
import type { AreaLuta } from '../types/area';
import type { LutaCasada, AtletaSnapshot } from '../types/lutaCasada';
import { getCategoriaLabel, type CategoriaCustomizada } from '../types/category';

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function atletaToSnapshot(atleta: Atleta): AtletaSnapshot {
  return {
    id: atleta.id,
    nome: atleta.nome,
    faixa: atleta.faixa,
    pesoKg: atleta.pesoKg,
    equipe: atleta.equipe,
    categoria: atleta.categoria,
  };
}

interface AtletaCardProps {
  label: string;
  atleta: Atleta | null;
  customizadas?: CategoriaCustomizada[];
}

function AtletaCard({ label, atleta, customizadas }: AtletaCardProps) {
  return (
    <Paper withBorder p="sm" radius="sm" bg="var(--mantine-color-gray-0)">
      <Group justify="space-between" mb={4}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase">{label}</Text>
        {atleta && <Badge size="xs" color="green" leftSection={<IconCheck size={10} />}>OK</Badge>}
      </Group>
      {atleta ? (
        <Stack gap={2}>
          <Text size="sm" fw={600}>{capitalize(atleta.nome)}</Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">Faixa:</Text>
            <Badge size="xs" variant="light">{FAIXA_LABEL[atleta.faixa] ?? atleta.faixa}</Badge>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">Peso:</Text>
            <Text size="xs">{atleta.pesoKg.toFixed(1)} kg</Text>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">Equipe:</Text>
            <Text size="xs">{atleta.equipe ? capitalize(atleta.equipe) : '—'}</Text>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">Categoria:</Text>
            <Text size="xs">{getCategoriaLabel(atleta.categoria, customizadas)}</Text>
          </Group>
        </Stack>
      ) : (
        <Text size="xs" c="dimmed">Nenhum atleta selecionado.</Text>
      )}
    </Paper>
  );
}

interface ModalEditarLutaCasadaProps {
  opened: boolean;
  onClose: () => void;
  luta: LutaCasada | null;
  atletas: Atleta[];
  arbitros: Arbitro[];
  areas: AreaLuta[];
  onSalvo: (luta: LutaCasada) => void;
}

export function ModalEditarLutaCasada({ opened, onClose, luta, atletas, arbitros, areas, onSalvo }: ModalEditarLutaCasadaProps) {
  const [atletaAId, setAtletaAId] = useState<string | null>(null);
  const [atletaBId, setAtletaBId] = useState<string | null>(null);
  const [arbitroSelectedId, setArbitroSelectedId] = useState<string | null>(null);
  const [areaSelectedId, setAreaSelectedId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [customizadas, setCustomizadas] = useState<CategoriaCustomizada[]>([]);

  useEffect(() => {
    window.electronAPI.loadCategorias().then((data) => {
      setCustomizadas(data.customizadas);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (opened && luta) {
      setAtletaAId(luta.atletaAId);
      setAtletaBId(luta.atletaBId);
      setArbitroSelectedId(luta.arbitroId);
      const area = areas.find(a => a.arbitroIds.includes(luta.arbitroId ?? ''));
      setAreaSelectedId(area?.id ?? null);
      setErro(null);
    }
  }, [opened, luta, areas]);

  const atletasData = useMemo(
    () => atletas
      .map(a => ({ value: a.id, label: `${capitalize(a.nome)} — ${FAIXA_LABEL[a.faixa] ?? a.faixa} · ${a.pesoKg.toFixed(1)}kg` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [atletas]
  );

  const arbitrosData = useMemo(
    () => arbitros
      .map(a => ({ value: a.id, label: `${capitalize(a.nome)} (${FAIXA_LABEL[a.faixa] ?? a.faixa})` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [arbitros]
  );

  const areasData = useMemo(
    () => areas
      .map(a => ({ value: a.id, label: a.nome || `Área ${a.id.slice(0, 4)}` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [areas]
  );

  const handleAreaChange = (areaId: string | null) => {
    setAreaSelectedId(areaId);
    if (areaId) {
      const area = areas.find(a => a.id === areaId);
      const primeiroArbitro = area?.arbitroIds?.[0] ?? null;
      setArbitroSelectedId(primeiroArbitro);
    } else {
      setArbitroSelectedId(null);
    }
  };

  const atletaA = useMemo(() => atletas.find(a => a.id === atletaAId) ?? null, [atletas, atletaAId]);
  const atletaB = useMemo(() => atletas.find(a => a.id === atletaBId) ?? null, [atletas, atletaBId]);

  const mesmoAtleta = !!(atletaAId && atletaBId && atletaAId === atletaBId);
  const podeSalvar = !!atletaAId && !!atletaBId && !!arbitroSelectedId && !mesmoAtleta && !salvando;

  const handleSalvar = async () => {
    if (!podeSalvar || !luta || !atletaA || !atletaB) return;
    setSalvando(true);
    setErro(null);
    try {
      const lutaAtualizada: LutaCasada = await window.electronAPI.updateLutaCasada({
        ...luta,
        areaId: areaSelectedId ?? luta.areaId,
        arbitroId: arbitroSelectedId,
        atletaAId: atletaA.id,
        atletaBId: atletaB.id,
        atletaASnapshot: atletaToSnapshot(atletaA),
        atletaBSnapshot: atletaToSnapshot(atletaB),
        updatedAt: new Date().toISOString(),
      });
      onSalvo(lutaAtualizada);
      onClose();
    } catch (err) {
      console.error('Erro ao editar luta casada:', err);
      setErro(err instanceof Error ? err.message : 'Erro ao editar luta casada.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Editar Luta Casada"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Select
          label="Área de Luta"
          placeholder="Buscar área..."
          data={areasData}
          value={areaSelectedId}
          onChange={handleAreaChange}
          searchable
          clearable
          nothingFoundMessage="Nenhuma área encontrada"
        />

        <Select
          label="Árbitro"
          placeholder="Buscar árbitro..."
          data={arbitrosData}
          value={arbitroSelectedId}
          onChange={setArbitroSelectedId}
          searchable
          clearable
          nothingFoundMessage="Nenhum árbitro encontrado"
        />

        <Select
          label="Atleta A"
          placeholder="Buscar atleta..."
          data={atletasData}
          value={atletaAId}
          onChange={setAtletaAId}
          searchable
          nothingFoundMessage="Nenhum atleta cadastrado"
          clearable
        />

        <Select
          label="Atleta B"
          placeholder="Buscar atleta..."
          data={atletasData.filter(a => a.value !== atletaAId)}
          value={atletaBId}
          onChange={setAtletaBId}
          searchable
          nothingFoundMessage="Nenhum atleta disponível"
          clearable
        />

        <Group grow align="stretch">
          <AtletaCard label="Atleta A" atleta={atletaA} customizadas={customizadas} />
          <AtletaCard label="Atleta B" atleta={atletaB} customizadas={customizadas} />
        </Group>

        {mesmoAtleta && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            Atleta A e Atleta B não podem ser o mesmo atleta.
          </Alert>
        )}

        {erro && (
          <Alert color="red" icon={<IconAlertCircle size={18} />}>
            {erro}
          </Alert>
        )}

        <Group justify="flex-end" mt="sm">
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!podeSalvar} loading={salvando}>
            Salvar Alterações
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
