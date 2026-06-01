import { Modal, TextInput, Select, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import type { Arbitro } from '../types/referee';
import type { Faixa } from '../types/athlete';

const faixaOptions = [
  { value: 'roxa', label: 'Roxa' },
  { value: 'marrom', label: 'Marrom' },
  { value: 'preta', label: 'Preta' },
];

interface ArbitroFormProps {
  opened: boolean;
  onClose: () => void;
  onSave: (arbitro: Arbitro) => Promise<boolean>;
  arbitro?: Arbitro | null;
}

export function ArbitroForm({ opened, onClose, onSave, arbitro }: ArbitroFormProps) {
  const form = useForm({
    initialValues: {
      nome: '',
      faixa: '' as string,
    },
    validate: {
      nome: (v) => (v.trim().length < 2 ? 'Nome deve ter ao menos 2 caracteres' : null),
      faixa: (v) => (!v ? 'Selecione uma faixa' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (arbitro) {
        form.setValues({
          nome: arbitro.nome || '',
          faixa: arbitro.faixa || '',
        });
      } else {
        form.reset();
      }
    }
  }, [opened, arbitro]);

  const handleSubmit = async (values: typeof form.values) => {
    const now = new Date().toISOString();
    const data: Arbitro = {
      id: arbitro?.id || crypto.randomUUID(),
      nome: values.nome.trim().toLowerCase(),
      faixa: values.faixa as Faixa,
      chaveIds: arbitro?.chaveIds || [],
      createdAt: arbitro?.createdAt || now,
      updatedAt: now,
    };
    const saved = await onSave(data);
    if (saved) onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={arbitro ? 'Editar Árbitro' : 'Novo Árbitro'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nome *"
            placeholder="Nome do árbitro"
            {...form.getInputProps('nome')}
          />

          <Select
            label="Faixa *"
            placeholder="Selecione a faixa"
            data={faixaOptions}
            {...form.getInputProps('faixa')}
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
