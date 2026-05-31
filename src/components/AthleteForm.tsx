import { Modal, TextInput, NumberInput, Select, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import type { Atleta, Faixa } from '../types/athlete';

const faixas: { group: string; items: { value: Faixa; label: string }[] }[] = [
  {
    group: 'Infantil (4–15 anos)',
    items: [
      { value: 'branca', label: 'Branca' },
      { value: 'cinza', label: 'Cinza' },
      { value: 'amarela', label: 'Amarela' },
      { value: 'laranja', label: 'Laranja' },
      { value: 'verde', label: 'Verde' },
    ],
  },
  {
    group: 'Adulto (16+ anos)',
    items: [
      { value: 'branca', label: 'Branca' },
      { value: 'azul', label: 'Azul' },
      { value: 'roxa', label: 'Roxa' },
      { value: 'marrom', label: 'Marrom' },
      { value: 'preta', label: 'Preta' },
    ],
  },
];

const anoAtual = new Date().getFullYear();

interface AthleteFormProps {
  opened: boolean;
  onClose: () => void;
  onSave: (athlete: Atleta) => Promise<void>;
  athlete?: Atleta | null;
}

export function AthleteForm({ opened, onClose, onSave, athlete }: AthleteFormProps) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      nome: '',
      equipe: '',
      pesoKg: '' as string | number,
      faixa: '' as string,
      anoNascimento: '' as string | number,
    },
    validate: {
      nome: (v) => (v.length < 2 ? 'Nome deve ter ao menos 2 caracteres' : null),
      equipe: (v) => (v.length < 2 ? 'Equipe deve ter ao menos 2 caracteres' : null),
      pesoKg: (v) => {
        const n = Number(v);
        if (!v || isNaN(n) || n < 1 || n > 300) return 'Peso deve estar entre 1 e 300 kg';
        return null;
      },
      faixa: (v) => (!v ? 'Selecione uma faixa válida' : null),
      anoNascimento: (v) => {
        const n = Number(v);
        if (!v || isNaN(n) || !Number.isInteger(n) || n < 1920 || n > anoAtual) return `Ano deve estar entre 1920 e ${anoAtual}`;
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      if (athlete) {
        form.setValues({
          nome: athlete.nome,
          equipe: athlete.equipe,
          pesoKg: athlete.pesoKg,
          faixa: athlete.faixa,
          anoNascimento: athlete.anoNascimento,
        });
      } else {
        form.reset();
      }
    }
  }, [opened, athlete, form]);

  const handleSubmit = async (values: typeof form.values) => {
    const now = new Date().toISOString();
    const data: Atleta = {
      id: athlete?.id || crypto.randomUUID(),
      nome: values.nome,
      equipe: values.equipe,
      pesoKg: Number(values.pesoKg),
      faixa: values.faixa as Faixa,
      anoNascimento: Number(values.anoNascimento),
      createdAt: athlete?.createdAt || now,
      updatedAt: now,
    };
    await onSave(data);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={athlete ? 'Editar Atleta' : 'Novo Atleta'}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nome *"
            placeholder="Nome completo do atleta"
            key={form.key('nome')}
            {...form.getInputProps('nome')}
          />

          <TextInput
            label="Equipe *"
            placeholder="Nome da equipe / academia"
            key={form.key('equipe')}
            {...form.getInputProps('equipe')}
          />

          <NumberInput
            label="Peso (kg) *"
            placeholder="Ex.: 72.5"
            min={1}
            max={300}
            decimalScale={1}
            key={form.key('pesoKg')}
            {...form.getInputProps('pesoKg')}
          />

          <Select
            label="Faixa *"
            placeholder="Selecione a faixa"
            data={faixas.map((g) => ({
              group: g.group,
              items: g.items.map((i) => ({ value: i.value, label: i.label })),
            }))}
            key={form.key('faixa')}
            {...form.getInputProps('faixa')}
          />

          <NumberInput
            label="Ano de Nascimento *"
            placeholder="Ex.: 1998"
            min={1920}
            max={anoAtual}
            allowDecimal={false}
            key={form.key('anoNascimento')}
            {...form.getInputProps('anoNascimento')}
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
