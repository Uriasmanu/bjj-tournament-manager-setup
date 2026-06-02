import { Container, Paper, Text, Button, Stack, Group, Loader, Center, Modal, Badge, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconFileUpload, IconDownload, IconTrash, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useMemo } from 'react';
import type { Atleta, Faixa } from '../types/athlete';
import { categoriaLabels } from '../types/category';
import { AthleteForm } from '../components/AthleteForm';
import { AthleteTable } from '../components/AthleteTable';
import { PageLayout } from '../components/PageLayout';

const faixaLabels: Record<Faixa, string> = {
  branca: 'Branca',
  cinza: 'Cinza',
  amarela: 'Amarela',
  laranja: 'Laranja',
  verde: 'Verde',
  azul: 'Azul',
  roxa: 'Roxa',
  marrom: 'Marrom',
  preta: 'Preta',
};

const faixaOrder: Faixa[] = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'];

export function AdminAthletes() {
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Atleta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Atleta | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadAthletes = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await window.electronAPI.loadAthletes();
      setAthletes(list.sort((a, b) => a.nome.localeCompare(b.nome)));
      setSelectedIds([]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletes;
    const q = searchQuery.toLowerCase().trim();
    return athletes.filter(a =>
      a.nome.toLowerCase().includes(q) ||
      (a.equipe && a.equipe.toLowerCase().includes(q)) ||
      (categoriaLabels[a.categoria] || a.categoria).toLowerCase().includes(q)
    );
  }, [athletes, searchQuery]);

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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await window.electronAPI.deleteAthletes(selectedIds);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      notifications.show({ title: 'Sucesso', message: `${selectedIds.length} atleta(s) excluído(s) com sucesso!`, color: 'green' });
      await loadAthletes();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir atletas.', color: 'red' });
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar atletas.';
      notifications.show({ title: 'Erro ao importar', message: msg, color: 'red', autoClose: false });
    }
  };

  const faixaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of athletes) {
      counts[a.faixa] = (counts[a.faixa] || 0) + 1;
    }
    return counts;
  }, [athletes]);

  const categoriaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of athletes) {
      if (a.categoria) {
        counts[a.categoria] = (counts[a.categoria] || 0) + 1;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 10);
  }, [athletes]);

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
        <Group>
          <TextInput
            placeholder="Buscar atleta..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            w={250}
          />
          {selectedIds.length > 0 && (
            <Button color="red" leftSection={<IconTrash size={16} />} onClick={() => setBulkDeleteOpen(true)}>
              Excluir Selecionados ({selectedIds.length})
            </Button>
          )}
        </Group>
      </Group>

      {athletes.length > 0 && (
        <Paper withBorder p="sm" mb="md" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="sm" fw={600}>Total: {athletes.length}</Text>
              <Text size="sm" c="dimmed">|</Text>
              {faixaOrder.map((faixa) => (
                <Badge key={faixa} variant="light" color="gray" size="sm">
                  {faixaLabels[faixa]}: {faixaCounts[faixa] || 0}
                </Badge>
              ))}
            </Group>
            {categoriaCounts.length > 0 && (
              <Group gap="xs">
                <Text size="sm" fw={600}>Categorias:</Text>
                {categoriaCounts.map(([catId, count]) => (
                  <Badge key={catId} variant="light" color="blue" size="sm">
                    {categoriaLabels[catId] || catId}: {count}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
        </Paper>
      )}

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
      ) : filteredAthletes.length === 0 && searchQuery.trim() ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhum atleta encontrado para a busca "{searchQuery}"</Text>
        </Stack>
      ) : (
        <AthleteTable
          athletes={filteredAthletes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
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

      <Modal
        opened={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Excluir Atletas"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          Deseja realmente excluir os {selectedIds.length} atleta(s) selecionados? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancelar</Button>
          <Button color="red" onClick={handleBulkDelete}>Excluir {selectedIds.length}</Button>
        </Group>
      </Modal>
    </PageLayout>
  );
}
