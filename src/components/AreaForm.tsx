import { Modal, TextInput, MultiSelect, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import type { AreaLuta } from '../types/area';
import type { Arbitro } from '../types/referee';

interface AreaFormProps {
  opened: boolean;
  onClose: () => void;
  onSave: (area: AreaLuta) => Promise<boolean>;
  area?: AreaLuta | null;
}

export function AreaForm({ opened, onClose, onSave, area }: AreaFormProps) {
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);

  useEffect(() => {
    window.electronAPI.loadArbitros().then(setArbitros).catch(() => {});
  }, []);

  const form = useForm({
    initialValues: {
      nome: '',
      arbitroIds: [] as string[],
    },
    validate: {
      nome: (v) => (v.trim().length < 2 ? 'Nome deve ter ao menos 2 caracteres' : null),
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

  const arbitroOptions = arbitros.map((a) => ({
    value: a.id,
    label: a.nome.charAt(0).toUpperCase() + a.nome.slice(1),
  }));

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
            label="Nome *"
            placeholder="Nome da área de luta"
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

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
