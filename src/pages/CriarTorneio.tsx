import { Title, Text, TextInput, Button, Stack, Group } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageLayout } from '../components/PageLayout';

export function CriarTorneio() {
  const navigate = useNavigate();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      nome: '',
      data: null as Date | null,
    },
    validate: {
      data: (value) => {
        if (!value) return 'Informe uma data válida';
        const today = dayjs().startOf('day');
        if (dayjs(value).isBefore(today) || dayjs(value).isSame(today, 'day')) {
          return 'A data do torneio deve ser futura';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: { nome: string; data: Date | null }) => {
    if (!values.data) return;

    const dataStr = dayjs(values.data).format('YYYY-MM-DD');

    try {
      await window.electronAPI.createTournament({
        nome: values.nome,
        data: dataStr,
      });
      notifications.show({
        title: 'Sucesso',
        message: 'Torneio criado com sucesso!',
        color: 'green',
      });
      navigate('/admin/listar-torneios');
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar o torneio.',
        color: 'red',
      });
    }
  };

  return (
    <PageLayout title="Criar Torneio" backRoute="/">
      <Stack gap="xs" mb="lg">
        <Title order={2}>BJJ TOURNAMENT MANAGER</Title>
        <Text c="blue" fw={500}>Cadastre um novo torneio</Text>
      </Stack>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Nome do Torneio (opcional)"
            placeholder="Digite o nome do torneio"
            key={form.key('nome')}
            {...form.getInputProps('nome')}
          />

          <DatePickerInput
            label="Data do Evento"
            placeholder="__/__/____"
            valueFormat="DD/MM/YYYY"
            minDate={dayjs().add(1, 'day').toDate()}
            clearable
            key={form.key('data')}
            {...form.getInputProps('data')}
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit">
              Criar Torneio
            </Button>
          </Group>
        </Stack>
      </form>
    </PageLayout>
  );
}
