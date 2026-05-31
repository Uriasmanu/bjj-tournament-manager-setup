import { Container, Paper, Title, Text, Button, Stack, Group, ActionIcon, Loader, Center, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Atleta } from '../types/athlete';
import { AthleteForm } from '../components/AthleteForm';
import { AthleteTable } from '../components/AthleteTable';

export function AdminAthletes() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Atleta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Atleta | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadAthletes = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await window.electronAPI.loadAthletes();
      setAthletes(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAthletes();
  }, []);

  const handleNew = () => {
    setSelectedAthlete(null);
    openForm();
  };

  const handleEdit = (athlete: Atleta) => {
    setSelectedAthlete(athlete);
    openForm();
  };

  const handleDelete = (athlete: Atleta) => {
    setDeleteTarget(athlete);
    openDelete();
  };

  const handleSave = async (athlete: Atleta) => {
    try {
      if (selectedAthlete) {
        await window.electronAPI.updateAthlete(athlete);
        notifications.show({ title: 'Sucesso', message: 'Atleta atualizado com sucesso!', color: 'green' });
      } else {
        await window.electronAPI.saveAthlete(athlete);
        notifications.show({ title: 'Sucesso', message: 'Atleta cadastrado com sucesso!', color: 'green' });
      }
      await loadAthletes();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao salvar o atleta.', color: 'red' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteAthlete(deleteTarget.id);
      closeDelete();
      setDeleteTarget(null);
      notifications.show({ title: 'Sucesso', message: 'Atleta excluído com sucesso!', color: 'green' });
      await loadAthletes();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir o atleta.', color: 'red' });
    }
  };

  if (loading) {
    return (
      <Container size="clamp(360px, 95vw, 720px)" py="xl">
        <Center py="xl">
          <Loader />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="clamp(360px, 95vw, 720px)" py="xl">
        <Paper withBorder shadow="sm" p="lg" radius="md">
          <Stack align="center" gap="md">
            <Text c="red">Erro ao carregar atletas.</Text>
            <Button onClick={loadAthletes}>Tentar novamente</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="clamp(360px, 95vw, 720px)" py="xl">
      <Paper withBorder shadow="sm" p="clamp(12px, 2vw, 24px)" radius="md">
        <Group mb="md">
          <ActionIcon variant="subtle" onClick={() => navigate('/admin/dashboard')} aria-label="Voltar">
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={2} style={{ flex: 1 }}>Cadastro de Atletas</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
            Novo Atleta
          </Button>
        </Group>

        {athletes.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text c="dimmed">Nenhum atleta cadastrado</Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleNew}
            >
              Cadastrar primeiro atleta
            </Button>
          </Stack>
        ) : (
          <AthleteTable
            athletes={athletes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Paper>

      <AthleteForm
        opened={formOpened}
        onClose={closeForm}
        onSave={handleSave}
        athlete={selectedAthlete}
      />

      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Excluir Atleta"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          Deseja realmente excluir o atleta{' '}
          <Text component="span" fw={600}>
            {deleteTarget?.nome}
          </Text>
          ? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={closeDelete}>Cancelar</Button>
          <Button color="red" onClick={handleDeleteConfirm}>Excluir</Button>
        </Group>
      </Modal>
    </Container>
  );
}
