import { Modal, TextInput, MultiSelect, Button, Group, Stack, Alert, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useMemo, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';
import type { AreaLuta } from '../types/area';
import type { Arbitro } from '../types/referee';

interface AreaFormProps {
  opened: boolean;
  onClose: () => void;
  onSave: (area: AreaLuta) => Promise<boolean>;
  area?: AreaLuta | null;
  areas?: AreaLuta[];
}

export function AreaForm({ opened, onClose, onSave, area, areas = [] }: AreaFormProps) {
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);

  useEffect(() => {
    window.electronAPI.loadArbitros().then(setArbitros).catch(() => {});
  }, []);

  const form = useForm({
    initialValues: {
      nome: '',
      arbitroIds: [] as string[],
    },
  });

  useEffect(() => {
    if (opened) {
      if (area) {
        form.setValues({
          nome: area.nome || '',
          arbitroIds: area.arbitroIds || [],
        });
      } else {
        form.reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, area]);

  const handleSubmit = async (values: typeof form.values) => {
    const now = new Date().toISOString();
    const data: AreaLuta = {
      id: area?.id || crypto.randomUUID(),
      nome: values.nome.trim(),
      arbitroIds: values.arbitroIds,
      createdAt: area?.createdAt || now,
      updatedAt: now,
    };
    const saved = await onSave(data);
    if (saved) onClose();
  };

  const arbitroOptions = arbitros
    .map((a) => ({
      value: a.id,
      label: a.nome.charAt(0).toUpperCase() + a.nome.slice(1),
    }));

  const warnings = useMemo(() => {
    const selectedIds = form.values.arbitroIds ?? [];
    const msgs: string[] = [];
    for (const arbitroId of selectedIds) {
      const arbitro = arbitros.find(a => a.id === arbitroId);
      if (!arbitro) continue;
      const nomeArbitro = arbitro.nome.charAt(0).toUpperCase() + arbitro.nome.slice(1);
      const otherAreas = areas.filter(
        a => a.id !== area?.id && (a.arbitroIds ?? []).includes(arbitroId)
      );
      for (const other of otherAreas) {
        msgs.push(`O árbitro "${nomeArbitro}" já está atribuído à área "${other.nome}".`);
      }
    }
    return msgs;
  }, [form.values.arbitroIds, arbitros, areas, area?.id]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={area ? 'Editar Área de Luta' : 'Nova Área de Luta'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nome"
            placeholder="Deixe vazio para gerar automaticamente (Área N)"
            {...form.getInputProps('nome')}
          />

          <MultiSelect
            label="Árbitros Responsáveis"
            placeholder="Selecione um ou mais árbitros"
            data={arbitroOptions}
            clearable
            searchable
            nothingFoundMessage="Nenhum árbitro encontrado"
            {...form.getInputProps('arbitroIds')}
          />

          {warnings.length > 0 && (
            <Alert color="yellow" icon={<IconAlertCircle size={18} />}>
              <Stack gap={4}>
                {warnings.map((msg, i) => (
                  <Text key={i} size="sm">{msg}</Text>
                ))}
              </Stack>
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
