import { Container, Paper, Text, Button, Stack, Group, Loader, Center, Modal, Badge, Table, ActionIcon, Checkbox, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconPencil, IconTrash, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useMemo } from 'react';
import type { AreaLuta } from '../types/area';
import type { Arbitro } from '../types/referee';
import { AreaForm } from '../components/AreaForm';
import { PageLayout } from '../components/PageLayout';

export function AdminAreas() {
  const [areas, setAreas] = useState<AreaLuta[]>([]);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaLuta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AreaLuta | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [areaList, arbitroList] = await Promise.all([
        window.electronAPI.loadAreas(),
        window.electronAPI.loadArbitros(),
      ]);
      setAreas(areaList.sort((a, b) => a.nome.localeCompare(b.nome)));
      setArbitros(arbitroList);
      setSelectedIds([]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    const q = searchQuery.toLowerCase().trim();
    return areas.filter(a =>
      a.nome.toLowerCase().includes(q)
    );
  }, [areas, searchQuery]);

  useEffect(() => {
    loadData();
  }, []);

  const getArbitroNome = (arbitroId: string): string => {
    if (!arbitroId) return '-';
    const arbitro = arbitros.find(a => a.id === arbitroId);
    if (!arbitro) return 'Árbitro não encontrado';
    return arbitro.nome.charAt(0).toUpperCase() + arbitro.nome.slice(1);
  };

  const handleNew = () => {
    setSelectedArea(null);
    openForm();
  };

  const handleEdit = (area: AreaLuta) => {
    setSelectedArea(area);
    openForm();
  };

  const handleDelete = (area: AreaLuta) => {
    setDeleteTarget(area);
    openDelete();
  };

  const handleSave = async (area: AreaLuta): Promise<boolean> => {
    const duplicate = areas.some(
      (a) =>
        a.id !== area.id &&
        a.nome.trim().toLowerCase() === area.nome.trim().toLowerCase()
    );
    if (duplicate) {
      notifications.show({
        title: 'Erro',
        message: 'Já existe uma área de luta com este nome.',
        color: 'red',
      });
      return false;
    }
    try {
      if (selectedArea) {
        await window.electronAPI.updateArea(area);
        notifications.show({ title: 'Sucesso', message: 'Área de luta atualizada com sucesso!', color: 'green' });
      } else {
        await window.electronAPI.saveArea({
          nome: area.nome,
          arbitroIds: area.arbitroIds ?? [],
        });
        notifications.show({ title: 'Sucesso', message: 'Área de luta cadastrada com sucesso!', color: 'green' });
      }
      await loadData();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar a área de luta.';
      notifications.show({ title: 'Erro', message: msg, color: 'red' });
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteArea(deleteTarget.id);
      closeDelete();
      setDeleteTarget(null);
      notifications.show({ title: 'Sucesso', message: 'Área de luta excluída com sucesso!', color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir a área de luta.', color: 'red' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await window.electronAPI.deleteAreas(selectedIds);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      notifications.show({ title: 'Sucesso', message: `${selectedIds.length} área(s) de luta excluída(s) com sucesso!`, color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir áreas de luta.', color: 'red' });
    }
  };

  const allSelected = areas.length > 0 && selectedIds.length === areas.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(areas.map(a => a.id));
    }
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
            <Text c="red">Erro ao carregar áreas de luta.</Text>
            <Button onClick={loadData}>Tentar novamente</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <PageLayout title="Áreas de Luta" backRoute="/admin/areas">
      <Group mb="md" justify="space-between">
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
            Cadastrar
          </Button>
        </Group>
        <Group>
          <TextInput
            placeholder="Buscar área..."
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

      {areas.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhuma área de luta cadastrada</Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleNew}
          >
            Cadastrar primeira área
          </Button>
        </Stack>
      ) : filteredAreas.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhuma área encontrada para a busca "{searchQuery}"</Text>
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table horizontalSpacing="clamp(4px, 1.5vw, 12px)">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={selectedIds.length > 0 && !allSelected}
                    onChange={toggleAll}
                    aria-label="Selecionar todas"
                  />
                </Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Árbitros Responsáveis</Table.Th>
                <Table.Th style={{ width: 100 }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAreas.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedIds.includes(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      aria-label={`Selecionar ${a.nome}`}
                    />
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>{a.nome}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {(a.arbitroIds ?? []).length === 0 ? (
                        <Text size="sm" c="dimmed">Nenhum</Text>
                      ) : (
                        (a.arbitroIds ?? []).map((rid) => (
                          <Badge key={rid} variant="light" color="blue" size="sm">
                            {getArbitroNome(rid)}
                          </Badge>
                        ))
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        color="yellow"
                        onClick={() => handleEdit(a)}
                        aria-label={`Editar ${a.nome}`}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(a)}
                        aria-label={`Excluir ${a.nome}`}
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

      <AreaForm
        opened={formOpened}
        onClose={closeForm}
        onSave={handleSave}
        area={selectedArea}
      />

      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Excluir Área de Luta"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          Deseja realmente excluir a área de luta{' '}
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
        title="Excluir Áreas de Luta"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          Deseja realmente excluir as {selectedIds.length} área(s) de luta selecionadas? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancelar</Button>
          <Button color="red" onClick={handleBulkDelete}>Excluir {selectedIds.length}</Button>
        </Group>
      </Modal>
    </PageLayout>
  );
}
