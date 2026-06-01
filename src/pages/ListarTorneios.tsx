import { Container, Paper, Text, Button, Stack, Group, Table, ActionIcon, Loader, Center, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlayerPlay, IconDownload, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Torneio } from '../types/tournament';
import { PageLayout } from '../components/PageLayout';

export function ListarTorneios() {
  const navigate = useNavigate();
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Torneio | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const loadTorneios = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await window.electronAPI.listTournaments();
      setTorneios(list.sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteTournament(deleteTarget.id);
      close();
      setDeleteTarget(null);
      notifications.show({
        title: 'Sucesso',
        message: 'Torneio excluído com sucesso!',
        color: 'green',
      });
      loadTorneios();
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir o torneio.',
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
      <Container fluid px="xl" py="xl" style={{ minHeight: '100vh' }}>
        <Center py="xl" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid px="xl" py="xl" style={{ minHeight: '100vh' }}>
        <Paper withBorder shadow="sm" p="lg" radius="md" style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack align="center" gap="md">
            <Text c="red">Erro ao carregar torneios.</Text>
            <Button onClick={loadTorneios}>Tentar novamente</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <PageLayout title="Torneios Cadastrados" backRoute="/">
      {torneios.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhum torneio cadastrado</Text>
          <Button onClick={() => navigate('/admin/criar-torneio')}>
            Criar primeiro torneio
          </Button>
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table horizontalSpacing="clamp(4px, 1.5vw, 12px)">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Torneio</Table.Th>
                <Table.Th>Data</Table.Th>
                <Table.Th style={{ width: 'clamp(130px, 20vw, 190px)' }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {torneios.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'clamp(120px, 30vw, 300px)' }}>{t.nome || `Torneio ${formatDate(t.data)}`}</Table.Td>
                  <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatDate(t.data)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
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
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => {
                          setDeleteTarget(t);
                          open();
                        }}
                        aria-label={`Excluir ${t.nome || formatDate(t.data)}`}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title="Excluir Torneio"
        centered
        size="clamp(320px, 90vw, 480px)"
      >
        <Text size="sm" mb="md">
          Deseja realmente excluir o torneio{' '}
          <Text component="span" fw={600}>
            {deleteTarget?.nome || (deleteTarget ? `Torneio ${formatDate(deleteTarget.data)}` : '')}
          </Text>
          ? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleDeleteConfirm}>Excluir</Button>
        </Group>
      </Modal>
    </PageLayout>
  );
}
