import { Modal, TextInput, NumberInput, Select, Button, Group, Stack, Box, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useMemo } from 'react';
import { IconUserPlus } from '@tabler/icons-react';
import type { Atleta, Faixa } from '../types/athlete';
import { CATEGORIAS_IBJJF } from '../types/category';

const COLORS = {
  c1: '#092b5a',
  c2: '#09738a',
  c3: '#fcfaf4',
  c4: '#78a890',
  c5: '#9ed1b7',
};

const inputStyles = {
  input: {
    border: `2px solid ${COLORS.c2}4d`,
    borderRadius: 8,
    padding: '12px',
    transition: 'all 0.2s',
  },
  inputFocus: {
    borderColor: COLORS.c2,
    boxShadow: `0 0 0 2px ${COLORS.c2}66`,
  },
};

const labelProps = {
  style: {
    color: COLORS.c1,
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 4,
  },
};

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

function calcularIdade(anoNascimento: number): number {
  return anoAtual - anoNascimento;
}

function categoriasFiltradas(genero: string, faixa: string, anoNascimento: string | number) {
  const idade = anoNascimento ? calcularIdade(Number(anoNascimento)) : 0;

  let faixaEtariaMatch: string | null = null;
  if (idade >= 4 && idade <= 5) faixaEtariaMatch = 'pre-mirim';
  else if (idade >= 6 && idade <= 7) faixaEtariaMatch = 'mirim';
  else if (idade >= 8 && idade <= 9) faixaEtariaMatch = 'infantil-a';
  else if (idade >= 10 && idade <= 11) faixaEtariaMatch = 'infantil-b';
  else if (idade >= 12 && idade <= 13) faixaEtariaMatch = 'infanto-juvenil-a';
  else if (idade >= 14 && idade <= 15) faixaEtariaMatch = 'infanto-juvenil-b';
  else if (idade >= 16 && idade <= 17) faixaEtariaMatch = 'juvenil';
  else if (idade >= 18 && idade <= 29) faixaEtariaMatch = 'adulto';
  else if (idade >= 30 && idade <= 35) faixaEtariaMatch = 'master1';
  else if (idade >= 36 && idade <= 40) faixaEtariaMatch = 'master2';
  else if (idade >= 41 && idade <= 45) faixaEtariaMatch = 'master3';
  else if (idade >= 46 && idade <= 50) faixaEtariaMatch = 'master4';
  else if (idade >= 51 && idade <= 55) faixaEtariaMatch = 'master5';
  else if (idade >= 56 && idade <= 60) faixaEtariaMatch = 'master6';
  else if (idade >= 61) faixaEtariaMatch = 'master7';

  const faixaNormalizada = faixa === 'branca-adulto' ? 'branca' : faixa;

  return CATEGORIAS_IBJJF
    .filter((c) => {
      if (genero && c.genero !== genero) return false;
      if (faixaEtariaMatch && c.faixaEtaria !== faixaEtariaMatch) return false;
      if (faixaNormalizada && c.faixaMinima) {
        const faixaOrder = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'];
        const faixaIdx = faixaOrder.indexOf(faixaNormalizada);
        const minIdx = faixaOrder.indexOf(c.faixaMinima);
        if (faixaIdx !== -1 && minIdx !== -1 && faixaIdx < minIdx) return false;
      }
      return true;
    })
    .map((c) => {
      const limite = c.pesoMaximoKg !== null
        ? `até ${c.pesoMaximoKg.toFixed(1).replace('.', ',')} kg`
        : 'sem limite';
      return {
        value: c.id,
        label: `${c.nome} (${limite})`,
      };
    });
}

function agruparCategorias(data: { value: string; label: string }[]) {
  const grupos: Record<string, { value: string; label: string }[]> = {};
  for (const item of data) {
    const prefix = item.label.split(' ')[0];
    const chave = prefix || 'Outros';
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(item);
  }
  return Object.entries(grupos).map(([group, items]) => ({
    group,
    items,
  }));
}

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
      genero: '' as string,
      categoria: '' as string,
      pesoKg: '' as string | number,
      faixa: '' as string,
      anoNascimento: '' as string | number,
    },
    validate: {
      nome: (v) => (v.length < 2 ? 'Nome deve ter ao menos 2 caracteres' : null),
      equipe: (v) => (v.length < 2 ? 'Equipe deve ter ao menos 2 caracteres' : null),
      genero: (v) => (!v ? 'Selecione um gênero' : null),
      categoria: (v) => (!v ? 'Selecione uma categoria' : null),
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
          genero: athlete.genero || '',
          categoria: athlete.categoria || '',
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
      genero: values.genero as 'masculino' | 'feminino',
      categoria: values.categoria,
      pesoKg: Number(values.pesoKg),
      faixa: (values.faixa === 'branca-adulto' ? 'branca' : values.faixa) as Faixa,
      anoNascimento: Number(values.anoNascimento),
      createdAt: athlete?.createdAt || now,
      updatedAt: now,
    };
    const saved = await onSave(data);
    if (saved) onClose();
  };

  const catOptions = useMemo(
    () => categoriasFiltradas(form.values.genero as string, form.values.faixa as string, form.values.anoNascimento),
    [form.values.genero, form.values.faixa, form.values.anoNascimento]
  );

  const catGrouped = useMemo(() => agruparCategorias(catOptions), [catOptions]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton
      centered
      size="lg"
      padding={0}
      styles={{
        body: { padding: 0 },
        header: { display: 'none' },
      }}
    >
      <Box
        style={{
          background: '#fff',
          borderTop: `8px solid ${COLORS.c1}`,
          borderRadius: 16,
          padding: 32,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        }}
      >
        <Title
          order={2}
          mb="xl"
          style={{
            color: COLORS.c1,
            fontWeight: 700,
            fontSize: '1.875rem',
            textAlign: 'center',
          }}
        >
          {athlete ? 'Editar Atleta' : 'Novo Atleta'}
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nome *"
              placeholder="Nome completo do atleta"
              labelProps={labelProps}
              styles={inputStyles}
              {...form.getInputProps('nome')}
            />

            <TextInput
              label="Equipe *"
              placeholder="Nome da equipe / academia"
              labelProps={labelProps}
              styles={inputStyles}
              {...form.getInputProps('equipe')}
            />

            <Group grow gap="md">
              <Select
                label="Gênero *"
                placeholder="Selecione o gênero"
                data={[
                  { value: 'masculino', label: 'Masculino' },
                  { value: 'feminino', label: 'Feminino' },
                ]}
                labelProps={labelProps}
                styles={inputStyles}
                {...form.getInputProps('genero')}
              />

              <NumberInput
                label="Peso (kg) *"
                placeholder="Ex.: 72.5"
                min={1}
                max={300}
                decimalScale={1}
                labelProps={labelProps}
                styles={inputStyles}
                {...form.getInputProps('pesoKg')}
              />
            </Group>

            <Select
              label="Faixa *"
              placeholder="Selecione a faixa"
              data={faixas.map((g) => ({
                group: g.group,
                items: g.items.map((i) => ({ value: i.value, label: i.label })),
              }))}
              labelProps={labelProps}
              styles={inputStyles}
              {...form.getInputProps('faixa')}
            />

            <Select
              label="Categoria *"
              placeholder="Selecione a categoria IBJJF"
              data={catGrouped}
              disabled={catOptions.length === 0}
              searchable
              labelProps={labelProps}
              styles={inputStyles}
              {...form.getInputProps('categoria')}
            />

            <NumberInput
              label="Ano de Nascimento *"
              placeholder="Ex.: 1998"
              min={1920}
              max={anoAtual}
              allowDecimal={false}
              labelProps={labelProps}
              styles={inputStyles}
              {...form.getInputProps('anoNascimento')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                type="submit"
                leftSection={<IconUserPlus size={16} />}
                styles={{
                  root: {
                    backgroundColor: '#1b325f',
                    color: '#fff',
                    borderRadius: 12,
                    '&:hover': { backgroundColor: '#3a89c9' },
                  },
                }}
              >
                {athlete ? 'Salvar Alterações' : 'Cadastrar Atleta'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
}
