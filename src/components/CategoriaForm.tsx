import { Modal, TextInput, NumberInput, Button, Group, Stack, Box, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { IconPlus } from '@tabler/icons-react';
import type { CategoriaCustomizada } from '../types/category';

const COLORS = {
  c1: '#092b5a',
  c2: '#09738a',
};

const inputStyles = {
  input: {
    border: `2px solid ${COLORS.c2}4d`,
    borderRadius: 8,
    padding: '12px',
    transition: 'all 0.2s',
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

interface CategoriaFormProps {
  opened: boolean;
  onClose: () => void;
  onSave: (data: Omit<CategoriaCustomizada, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  categoria?: CategoriaCustomizada | null;
}

export function CategoriaForm({ opened, onClose, onSave, categoria }: CategoriaFormProps) {
  const form = useForm({
    initialValues: {
      nome: '',
      pesoMinimoKg: 0,
      pesoMaximoKg: 0,
      tempoLutaMinutos: 5,
    },
    validate: {
      nome: (v) => (v.length < 2 ? 'Nome deve ter ao menos 2 caracteres' : null),
      pesoMinimoKg: (v) => (v < 0 ? 'Peso mínimo deve ser >= 0' : null),
      pesoMaximoKg: (v, values) => {
        if (v < 1) return 'Peso máximo deve ser >= 1';
        if (v <= values.pesoMinimoKg) return 'Peso máximo deve ser maior que o mínimo';
        return null;
      },
      tempoLutaMinutos: (v) => (v < 1 ? 'Tempo deve ser >= 1 minuto' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (categoria) {
        form.setValues({
          nome: categoria.nome || '',
          pesoMinimoKg: categoria.pesoMinimoKg ?? 0,
          pesoMaximoKg: categoria.pesoMaximoKg ?? 0,
          tempoLutaMinutos: categoria.tempoLutaMinutos ?? 5,
        });
      } else {
        form.reset();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, categoria]);

  const handleSubmit = async (values: typeof form.values) => {
    const data: Omit<CategoriaCustomizada, 'id' | 'createdAt' | 'updatedAt'> = {
      nome: values.nome.trim(),
      pesoMinimoKg: Number(values.pesoMinimoKg),
      pesoMaximoKg: Number(values.pesoMaximoKg),
      tempoLutaMinutos: Number(values.tempoLutaMinutos),
    };
    const saved = await onSave(data);
    if (saved) onClose();
  };

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
          {categoria ? 'Editar Categoria' : 'Nova Categoria'}
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Nome *"
              placeholder="Ex.: Absoluto Masculino"
              labelProps={labelProps}
              styles={inputStyles}
              {...form.getInputProps('nome')}
            />

            <Group grow gap="md">
              <NumberInput
                label="Peso Mínimo (kg) *"
                placeholder="Ex.: 0"
                min={0}
                decimalScale={1}
                labelProps={labelProps}
                styles={inputStyles}
                {...form.getInputProps('pesoMinimoKg')}
              />

              <NumberInput
                label="Peso Máximo (kg) *"
                placeholder="Ex.: 100"
                min={1}
                decimalScale={1}
                labelProps={labelProps}
                styles={inputStyles}
                {...form.getInputProps('pesoMaximoKg')}
              />
            </Group>

            <NumberInput
              label="Tempo de Luta (min) *"
              placeholder="Ex.: 5"
              min={1}
              max={60}
              allowDecimal={false}
              labelProps={labelProps}
              styles={inputStyles}
              {...form.getInputProps('tempoLutaMinutos')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button
                type="submit"
                leftSection={<IconPlus size={16} />}
                styles={{
                  root: {
                    backgroundColor: '#1b325f',
                    color: '#fff',
                    borderRadius: 12,
                    '&:hover': { backgroundColor: '#3a89c9' },
                  },
                }}
              >
                {categoria ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
}
