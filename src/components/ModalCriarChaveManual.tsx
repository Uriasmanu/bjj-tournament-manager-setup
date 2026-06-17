import { useEffect, useMemo, useState } from 'react';
import { Modal, Stack, Select, Group, Button, Text, Paper, Badge, Alert, TextInput, ActionIcon, Divider } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconPlus, IconTrash } from '@tabler/icons-react';
import type { Atleta } from '../types/athlete';
import type { Chave } from '../types/bracket';
import { categoriaLabels } from '../types/category';

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function gerarNomeAutomatico(atletas: Atleta[]): string {
  if (atletas.length === 0) return 'Chave Manual';
  const nomes = atletas.slice(0, 3).map(a => capitalize(a.nome));
  const suffix = atletas.length > 3 ? ` +${atletas.length - 3}` : '';
  return `Chave Manual — ${nomes.join(', ')}${suffix}`;
}

interface ModalCriarChaveManualProps {
  opened: boolean;
  onClose: () => void;
  atletas: Atleta[];
  onCriada: (chave: Chave) => void;
}

export function ModalCriarChaveManual({ opened, onClose, atletas, onCriada }: ModalCriarChaveManualProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [nomeChave, setNomeChave] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setSelectedIds([]);
      setNomeChave('');
      setErro(null);
    }
  }, [opened]);

  const atletasData = useMemo(
    () => atletas
      .filter(a => !selectedIds.includes(a.id))
      .map(a => ({
        value: a.id,
        label: `${capitalize(a.nome)} — ${FAIXA_LABEL[a.faixa] ?? a.faixa} · ${a.pesoKg.toFixed(1)}kg · ${categoriaLabels[a.categoria] || a.categoria}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [atletas, selectedIds]
  );

  const selectedAtletas = useMemo(
    () => selectedIds.map(id => atletas.find(a => a.id === id)).filter((a): a is Atleta => a !== undefined),
    [atletas, selectedIds]
  );

  const nomeFinal = nomeChave.trim() || (selectedAtletas.length > 0 ? gerarNomeAutomatico(selectedAtletas) : '');
  const podeCriar = selectedAtletas.length >= 2 && !salvando;

  const handleAdicionarAtleta = (atletaId: string | null) => {
    if (!atletaId) return;
    if (selectedIds.includes(atletaId)) {
      setErro('Atleta já adicionado à chave.');
      return;
    }
    setSelectedIds(prev => [...prev, atletaId]);
    setErro(null);
  };

  const handleRemoverAtleta = (atletaId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== atletaId));
  };

  const handleCriar = async () => {
    if (!podeCriar) return;
    setSalvando(true);
    setErro(null);
    try {
      const chave: Chave = await window.electronAPI.gerarChave({
        categoriaId: 'manual',
        atletaIds: selectedIds,
        nome: nomeFinal,
      });
      onCriada(chave);
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar chave manual.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Criar Chave Manual"
      size="lg"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Nome da Chave"
          placeholder={selectedAtletas.length > 0 ? gerarNomeAutomatico(selectedAtletas) : 'Ex: Chave Especial, Copa X...'}
          value={nomeChave}
          onChange={(e) => setNomeChave(e.currentTarget.value)}
          description="Deixe vazio para gerar automaticamente"
        />

        <Select
          label="Adicionar Atleta"
          placeholder="Buscar atleta..."
          data={atletasData}
          value={null}
          onChange={handleAdicionarAtleta}
          searchable
          nothingFoundMessage="Nenhum atleta disponível"
        />

        {selectedAtletas.length > 0 && (
          <>
            <Divider />
            <Text size="sm" fw={600}>
              Atletas na Chave ({selectedAtletas.length})
            </Text>
            <Stack gap="xs">
              {selectedAtletas.map(atleta => (
                <Paper key={atleta.id} withBorder p="xs" radius="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <Badge size="sm" color="blue" variant="light">
                        {FAIXA_LABEL[atleta.faixa] ?? atleta.faixa}
                      </Badge>
                      <Text size="sm" fw={500} style={{ textTransform: 'capitalize' }}>
                        {atleta.nome}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {atleta.pesoKg.toFixed(1)}kg
                      </Text>
                      <Text size="xs" c="dimmed">
                        {atleta.equipe ? capitalize(atleta.equipe) : '—'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {categoriaLabels[atleta.categoria] || atleta.categoria}
                      </Text>
                    </Group>
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="subtle"
                      onClick={() => handleRemoverAtleta(atleta.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </>
        )}

        {selectedAtletas.length > 0 && selectedAtletas.length < 2 && (
          <Alert color="orange" icon={<IconAlertCircle size={18} />}>
            Adicione pelo menos 2 atletas para criar a chave.
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
          <Button onClick={handleCriar} disabled={!podeCriar} loading={salvando} leftSection={<IconPlus size={16} />}>
            Criar Chave
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
