import { Container, Paper, Title, Text, Button, Stack, Group, Loader, Center, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconFileUpload, IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import type { Atleta } from '../types/athlete';
import { AthleteForm } from '../components/AthleteForm';
import { AthleteTable } from '../components/AthleteTable';
import { PageLayout } from '../components/PageLayout';

export function AdminAthletes() {
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

  const handleSave = async (athlete: Atleta): Promise<boolean> => {
    const duplicate = athletes.some(
      (a) =>
        a.id !== athlete.id &&
        a.nome.trim().toLowerCase() === athlete.nome.trim().toLowerCase() &&
        a.anoNascimento === athlete.anoNascimento
    );
    if (duplicate) {
      notifications.show({
        title: 'Erro',
        message: 'Já existe um atleta cadastrado com este nome e ano de nascimento.',
        color: 'red',
      });
      return false;
    }
    try {
      if (selectedAthlete) {
        await window.electronAPI.updateAthlete(athlete);
        notifications.show({ title: 'Sucesso', message: 'Atleta atualizado com sucesso!', color: 'green' });
      } else {
        await window.electronAPI.saveAthlete(athlete);
        notifications.show({ title: 'Sucesso', message: 'Atleta cadastrado com sucesso!', color: 'green' });
      }
      await loadAthletes();
      return true;
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao salvar o atleta.', color: 'red' });
      return false;
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

  const handleExport = async () => {
    try {
      await window.electronAPI.exportAthletes();
      notifications.show({ title: 'Sucesso', message: 'Atletas exportados com sucesso!', color: 'green' });
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao exportar atletas.', color: 'red' });
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importAthletes();
      if (result.imported === 0 && result.skipped === 0) return;
      const msg = `${result.imported} atleta(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''}.`;
      notifications.show({ title: 'Sucesso', message: msg, color: 'green' });
      await loadAthletes();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao importar atletas.', color: 'red' });
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
    <PageLayout title="Cadastro de Atletas " backRoute="/admin/atletas">
      <Group mb="md" justify="space-between">
        <Title order={2} style={{ flex: 1 }}>Cadastro de Atletas</Title>
        <Group>
          <Button variant="outline" leftSection={<IconDownload size={16} />} onClick={handleExport}>
            Exportar
          </Button>
          <Button variant="outline" leftSection={<IconFileUpload size={16} />} onClick={handleImport}>
            Importar
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
            Cadastrar
          </Button>
        </Group>
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
    </PageLayout>
  );
}
