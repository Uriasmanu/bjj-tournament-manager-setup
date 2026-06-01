import { Modal, TextInput, NumberInput, Select, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import type { Atleta, Faixa } from '../types/athlete';

const faixas: { group: string; items: { value: string; label: string }[] }[] = [
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
      { value: 'branca-adulto', label: 'Branca' },
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
  onSave: (athlete: Atleta) => Promise<boolean>;
  athlete?: Atleta | null;
}

export function AthleteForm({ opened, onClose, onSave, athlete }: AthleteFormProps) {
  const form = useForm({
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
        if (v === '' || v == null || isNaN(n) || n < 1 || n > 300) return 'Peso deve estar entre 1 e 300 kg';
        return null;
      },
      faixa: (v) => (!v ? 'Selecione uma faixa válida' : null),
      anoNascimento: (v) => {
        const n = Number(v);
        if (v === '' || v == null || isNaN(n) || !Number.isInteger(n) || n < 1920 || n > anoAtual) return `Ano deve estar entre 1920 e ${anoAtual}`;
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      if (athlete) {
        const idade = athlete.anoNascimento ? anoAtual - athlete.anoNascimento : 99;
        const faixaValue = athlete.faixa === 'branca' && idade > 15
          ? 'branca-adulto'
          : athlete.faixa;
        form.setValues({
          nome: athlete.nome || '',
          equipe: athlete.equipe || '',
          pesoKg: athlete.pesoKg ?? 0,
          faixa: faixaValue,
          anoNascimento: athlete.anoNascimento ?? 0,
        });
      } else {
        form.reset();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, athlete]);

  const handleSubmit = async (values: typeof form.values) => {
    const now = new Date().toISOString();
    const data: Atleta = {
      id: athlete?.id || crypto.randomUUID(),
      nome: values.nome.trim().toLowerCase(),
      equipe: values.equipe.trim().toLowerCase(),
      pesoKg: Number(values.pesoKg),
      faixa: (values.faixa === 'branca-adulto' ? 'branca' : values.faixa) as Faixa,
      anoNascimento: Number(values.anoNascimento),
      createdAt: athlete?.createdAt || now,
      updatedAt: now,
    };
    const saved = await onSave(data);
    if (saved) onClose();
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
            {...form.getInputProps('nome')}
          />

          <TextInput
            label="Equipe *"
            placeholder="Nome da equipe / academia"
            {...form.getInputProps('equipe')}
          />

          <NumberInput
            label="Peso (kg) *"
            placeholder="Ex.: 72.5"
            min={1}
            max={300}
            decimalScale={1}
            {...form.getInputProps('pesoKg')}
          />

          <Select
            label="Faixa *"
            placeholder="Selecione a faixa"
            data={faixas.map((g) => ({
              group: g.group,
              items: g.items.map((i) => ({ value: i.value, label: i.label })),
            }))}
            {...form.getInputProps('faixa')}
          />

          <NumberInput
            label="Ano de Nascimento *"
            placeholder="Ex.: 1998"
            min={1920}
            max={anoAtual}
            allowDecimal={false}
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
