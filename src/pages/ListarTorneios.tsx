import { Container, Paper, Title, Text, Button, Stack, Group, Table, ActionIcon, Loader, Center } from '@mantine/core';
import { IconPlayerPlay, IconDownload, IconArrowLeft } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Torneio } from '../types/tournament';

export function ListarTorneios() {
  const navigate = useNavigate();
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadTorneios = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await window.electronAPI.listTournaments();
      setTorneios(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTorneios();
  }, []);

  const handleStart = async (torneio: Torneio) => {
    try {
      await window.electronAPI.startTournament(torneio.id);
      const nome = torneio.nome || `Torneio ${torneio.data}`;
      notifications.show({
        title: 'Sucesso',
        message: `Torneio '${nome}' iniciado com sucesso!`,
        color: 'green',
      });
      navigate('/admin/dashboard');
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao iniciar o torneio.',
        color: 'red',
      });
    }
  };

  const handleExport = async (id: string) => {
    try {
      await window.electronAPI.exportTournament(id);
      notifications.show({
        title: 'Sucesso',
        message: 'Torneio exportado com sucesso!',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao exportar o torneio.',
        color: 'red',
      });
    }
  };

  const formatDate = (isoDate: string) => {
    return dayjs(isoDate).format('DD/MM/YYYY');
  };

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Center py="xl">
          <Loader />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="sm" py="xl">
        <Paper withBorder shadow="sm" p="lg" radius="md">
          <Stack align="center" gap="md">
            <Text c="red">Erro ao carregar torneios.</Text>
            <Button onClick={loadTorneios}>Tentar novamente</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <Group mb="md">
          <ActionIcon variant="subtle" onClick={() => navigate('/')} aria-label="Voltar">
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={2}>Torneios Cadastrados</Title>
        </Group>

        {torneios.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text c="dimmed">Nenhum torneio cadastrado</Text>
            <Button onClick={() => navigate('/admin/criar-torneio')}>
              Criar primeiro torneio
            </Button>
          </Stack>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Torneio</Table.Th>
                <Table.Th>Data</Table.Th>
                <Table.Th w={100}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {torneios.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td>{t.nome || `Torneio ${formatDate(t.data)}`}</Table.Td>
                  <Table.Td>{formatDate(t.data)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleStart(t)}
                        aria-label={`Iniciar ${t.nome || formatDate(t.data)}`}
                      >
                        <IconPlayerPlay size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="gray"
                        onClick={() => handleExport(t.id)}
                        aria-label={`Exportar ${t.nome || formatDate(t.data)}`}
                      >
                        <IconDownload size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Container>
  );
}
