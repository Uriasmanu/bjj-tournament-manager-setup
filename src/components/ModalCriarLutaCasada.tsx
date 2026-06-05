import { useEffect, useMemo, useState } from 'react';
import { Modal, Stack, Select, Group, Button, Text, Paper, Badge, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';
import type { AreaLuta } from '../types/area';
import type { LutaCasada, AtletaSnapshot } from '../types/lutaCasada';
import { categoriaLabels } from '../types/category';

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

function getCategoriaLabel(categoriaId: string): string {
  return categoriaLabels[categoriaId] ?? categoriaId;
}

interface AtletaCardProps {
  label: string;
  atleta: Atleta | null;
}

function AtletaCard({ label, atleta }: AtletaCardProps) {
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
            <Text size="xs">{getCategoriaLabel(atleta.categoria)}</Text>
          </Group>
        </Stack>
      ) : (
        <Text size="xs" c="dimmed">Nenhum atleta selecionado.</Text>
      )}
    </Paper>
  );
}

interface ModalCriarLutaCasadaProps {
  opened: boolean;
  onClose: () => void;
  area: AreaLuta;
  atletas: Atleta[];
  arbitros: Arbitro[];
  onCriada: (luta: LutaCasada) => void;
}

export function ModalCriarLutaCasada({ opened, onClose, area, atletas, arbitros, onCriada }: ModalCriarLutaCasadaProps) {
  const [atletaAId, setAtletaAId] = useState<string | null>(null);
  const [atletaBId, setAtletaBId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setAtletaAId(null);
      setAtletaBId(null);
      setErro(null);
    }
  }, [opened]);

  const atletasData = useMemo(
    () => atletas
      .map(a => ({ value: a.id, label: `${capitalize(a.nome)} — ${FAIXA_LABEL[a.faixa] ?? a.faixa} · ${a.pesoKg.toFixed(1)}kg` }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [atletas]
  );

  const atletaA = useMemo(() => atletas.find(a => a.id === atletaAId) ?? null, [atletas, atletaAId]);
  const atletaB = useMemo(() => atletas.find(a => a.id === atletaBId) ?? null, [atletas, atletaBId]);

  const arbitroAtualId = area.arbitroIds[0] ?? null;
  const arbitroAtual = useMemo(
    () => arbitros.find(a => a.id === arbitroAtualId) ?? null,
    [arbitros, arbitroAtualId]
  );

  const semArbitro = !arbitroAtualId;
  const mesmoAtleta = !!(atletaAId && atletaBId && atletaAId === atletaBId);
  const podeCriar = !!atletaAId && !!atletaBId && !mesmoAtleta && !semArbitro && !salvando;

  const handleCriar = async () => {
    if (!podeCriar || !atletaA || !atletaB) return;
    setSalvando(true);
    setErro(null);
    try {
      const nova: LutaCasada = await window.electronAPI.saveLutaCasada({
        areaId: area.id,
        arbitroId: arbitroAtualId,
        atletaAId: atletaA.id,
        atletaBId: atletaB.id,
        atletaASnapshot: atletaToSnapshot(atletaA),
        atletaBSnapshot: atletaToSnapshot(atletaB),
        status: 'pending',
        vencedorId: null,
        finalizacao: false,
        desclassificacao: false,
        desempateArbitro: false,
        dataFinalizacao: null,
      });
      onCriada(nova);
      onClose();
    } catch (err) {
      console.error('Erro ao criar luta casada:', err);
      setErro(err instanceof Error ? err.message : 'Erro ao criar luta casada.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nova Luta Casada"
      size="lg"
      centered
    >
      <Stack gap="md">
        {semArbitro && (
          <Alert color="orange" icon={<IconAlertCircle size={18} />}>
            Esta área não possui árbitro cadastrado. Cadastre um árbitro na área antes de criar uma Luta Casada.
          </Alert>
        )}

        <Paper withBorder p="sm" radius="sm" bg="dark.0">
          <Group justify="space-between">
            <Text size="sm" fw={600}>Árbitro da Área</Text>
            <Badge variant="filled">
              {arbitroAtual ? `${capitalize(arbitroAtual.nome)} (${FAIXA_LABEL[arbitroAtual.faixa] ?? arbitroAtual.faixa})` : 'Sem árbitro'}
            </Badge>
          </Group>
        </Paper>

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
          <AtletaCard label="Atleta A" atleta={atletaA} />
          <AtletaCard label="Atleta B" atleta={atletaB} />
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
          <Button onClick={handleCriar} disabled={!podeCriar} loading={salvando}>
            Criar Luta Casada
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
