import { Text, Button, Stack, Group, Loader, Center, Modal, Badge, Table, ActionIcon, Checkbox, TextInput, Switch } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconPencil, IconTrash, IconSearch, IconFileUpload, IconFileCode, IconRestore } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useMemo } from 'react';
import type { AreaLuta } from '../types/area';
import type { Arbitro } from '../types/referee';
import { AreaForm } from '../components/AreaForm';
import { PageLayout } from '../components/PageLayout';

function formatDeletedAt(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function AdminAreas() {
  const [areas, setAreas] = useState<AreaLuta[]>([]);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaLuta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AreaLuta | null>(null);
  const [permanentTarget, setPermanentTarget] = useState<AreaLuta | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkPermanentOpen, setBulkPermanentOpen] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [permanentOpened, { open: openPermanent, close: closePermanent }] = useDisclosure(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [areaList, arbitroList] = await Promise.all([
        showDeleted
          ? window.electronAPI.loadDeletedAreas()
          : window.electronAPI.loadAreas(),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

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

  const handleRestore = async (area: AreaLuta) => {
    try {
      await window.electronAPI.restoreArea(area.id);
      notifications.show({ title: 'Sucesso', message: 'Área de luta restaurada com sucesso!', color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao restaurar a área de luta.', color: 'red' });
    }
  };

  const handlePermanent = (area: AreaLuta) => {
    setPermanentTarget(area);
    openPermanent();
  };

  const handleSave = async (area: AreaLuta): Promise<boolean> => {
    if (area.nome.trim() !== '') {
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

  const handleExport = async () => {
    try {
      await window.electronAPI.exportAreas();
      notifications.show({ title: 'Sucesso', message: 'Áreas de luta exportadas em JSON!', color: 'green' });
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao exportar áreas de luta.', color: 'red' });
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importAreas();
      if (result.imported === 0 && result.skipped === 0) return;
      const msg = `${result.imported} área(s) importada(s)${result.skipped > 0 ? `, ${result.skipped} ignorada(s) (já existentes)` : ''}.`;
      notifications.show({ title: 'Sucesso', message: msg, color: 'green' });
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar áreas de luta.';
      notifications.show({ title: 'Erro ao importar', message: msg, color: 'red', autoClose: false });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteArea(deleteTarget.id);
      closeDelete();
      setDeleteTarget(null);
      notifications.show({ title: 'Sucesso', message: 'Área de luta movida para os deletados.', color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir a área de luta.', color: 'red' });
    }
  };

  const handlePermanentConfirm = async () => {
    if (!permanentTarget) return;
    try {
      await window.electronAPI.permanentlyDeleteArea(permanentTarget.id);
      closePermanent();
      setPermanentTarget(null);
      notifications.show({ title: 'Sucesso', message: 'Área de luta excluída permanentemente.', color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir permanentemente.', color: 'red' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await window.electronAPI.deleteAreas(selectedIds);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      notifications.show({ title: 'Sucesso', message: `${selectedIds.length} área(s) de luta movida(s) para os deletados.`, color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir áreas de luta.', color: 'red' });
    }
  };

  const handleBulkPermanent = async () => {
    if (selectedIds.length === 0) return;
    try {
      await window.electronAPI.permanentlyDeleteAreas(selectedIds);
      setBulkPermanentOpen(false);
      setSelectedIds([]);
      notifications.show({ title: 'Sucesso', message: `${selectedIds.length} área(s) de luta excluída(s) permanentemente.`, color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir permanentemente.', color: 'red' });
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
      <Center py="xl" style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center py="xl" style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Text c="red">Erro ao carregar áreas de luta.</Text>
          <Button onClick={loadData}>Tentar novamente</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <PageLayout title={showDeleted ? 'Áreas de Luta Deletadas' : 'Áreas de Luta'} backRoute="/admin/areas">
      <Group mb="md" justify="space-between" wrap="wrap">
        <Group>
          <Switch
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.currentTarget.checked)}
            label="Mostrar apenas os deletados"
            size="md"
            color="red"
            styles={{ label: { fontWeight: 600 } }}
          />
        </Group>
        <Group>
          {!showDeleted && (
            <>
              <Button
                variant="default"
                leftSection={<IconFileUpload size={16} />}
                onClick={handleImport}
                styles={{ root: { borderRadius: 12 } }}
                aria-label="Importar áreas de luta"
              >
                Importar
              </Button>
              <Button
                variant="default"
                leftSection={<IconFileCode size={16} />}
                onClick={handleExport}
                styles={{ root: { borderRadius: 12 } }}
                aria-label="Exportar áreas de luta em JSON"
              >
                Exportar JSON
              </Button>
              <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
                Cadastrar
              </Button>
            </>
          )}
        </Group>
        <Group>
          <TextInput
            placeholder={showDeleted ? 'Buscar área deletada...' : 'Buscar área...'}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            w={250}
          />
          {!showDeleted && selectedIds.length > 0 && (
            <Button color="red" leftSection={<IconTrash size={16} />} onClick={() => setBulkDeleteOpen(true)}>
              Excluir Selecionados ({selectedIds.length})
            </Button>
          )}
        </Group>
      </Group>

      {areas.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">{showDeleted ? 'Nenhuma área de luta na lixeira' : 'Nenhuma área de luta cadastrada'}</Text>
          {!showDeleted && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleNew}
            >
              Cadastrar primeira área
            </Button>
          )}
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
                {showDeleted && <Table.Th>Deletado em</Table.Th>}
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
                  {showDeleted && (
                    <Table.Td>
                      <Text size="sm" c="dimmed">{formatDeletedAt(a.deletedAt)}</Text>
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {showDeleted ? (
                        <>
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            onClick={() => handleRestore(a)}
                            aria-label={`Restaurar ${a.nome}`}
                            title="Restaurar"
                          >
                            <IconRestore size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handlePermanent(a)}
                            aria-label={`Excluir permanentemente ${a.nome}`}
                            title="Excluir permanentemente"
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      {showDeleted && selectedIds.length > 0 && (
        <Group justify="flex-end" mt="md">
          <Button
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={() => setBulkPermanentOpen(true)}
          >
            Excluir Selecionados ({selectedIds.length})
          </Button>
        </Group>
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
          A área de luta{' '}
          <Text component="span" fw={600}>
            {deleteTarget?.nome}
          </Text>{' '}
          será movida para os deletados. Você poderá restaurá-la na aba "Mostrar apenas os deletados".
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={closeDelete}>Cancelar</Button>
          <Button color="red" onClick={handleDeleteConfirm}>Excluir</Button>
        </Group>
      </Modal>

      <Modal
        opened={permanentOpened}
        onClose={closePermanent}
        title="Excluir Permanentemente"
        centered
        size="sm"
      >
        <Text size="sm" mb="md" fw={600} c="red">
          Esta ação é IRREVERSÍVEL.
        </Text>
        <Text size="sm" mb="md">
          A área de luta{' '}
          <Text component="span" fw={600}>
            {permanentTarget?.nome}
          </Text>{' '}
          será removida para sempre e não poderá ser restaurada.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={closePermanent}>Cancelar</Button>
          <Button color="red" onClick={handlePermanentConfirm}>
            Excluir Permanentemente
          </Button>
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
          As {selectedIds.length} área(s) de luta selecionada(s) serão movidas para os deletados. Você poderá restaurá-las na aba de lixeira.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancelar</Button>
          <Button color="red" onClick={handleBulkDelete}>Excluir {selectedIds.length}</Button>
        </Group>
      </Modal>

      <Modal
        opened={bulkPermanentOpen}
        onClose={() => setBulkPermanentOpen(false)}
        title="Excluir Permanentemente"
        centered
        size="sm"
      >
        <Text size="sm" mb="md" fw={600} c="red">
          Esta ação é IRREVERSÍVEL.
        </Text>
        <Text size="sm" mb="md">
          As {selectedIds.length} área(s) de luta selecionada(s) serão removidas para sempre e não poderão ser restauradas.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setBulkPermanentOpen(false)}>Cancelar</Button>
          <Button color="red" onClick={handleBulkPermanent}>
            Excluir {selectedIds.length} Permanentemente
          </Button>
        </Group>
      </Modal>
    </PageLayout>
  );
}
