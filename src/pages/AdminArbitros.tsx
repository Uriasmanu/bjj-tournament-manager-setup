import { Text, Button, Stack, Group, Loader, Center, Modal, Badge, Table, ActionIcon, Checkbox, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconFileUpload, IconDownload, IconPencil, IconTrash, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useMemo } from 'react';
import type { Arbitro } from '../types/referee';
import type { Faixa } from '../types/athlete';
import { ArbitroForm } from '../components/ArbitroForm';
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

export function AdminArbitros() {
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedArbitro, setSelectedArbitro] = useState<Arbitro | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Arbitro | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadArbitros = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await window.electronAPI.loadArbitros();
      setArbitros(list.sort((a, b) => a.nome.localeCompare(b.nome)));
      setSelectedIds([]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredArbitros = useMemo(() => {
    if (!searchQuery.trim()) return arbitros;
    const q = searchQuery.toLowerCase().trim();
    return arbitros.filter(a =>
      a.nome.toLowerCase().includes(q) ||
      (a.equipe && a.equipe.toLowerCase().includes(q)) ||
      a.faixa.toLowerCase().includes(q)
    );
  }, [arbitros, searchQuery]);

  useEffect(() => {
    loadArbitros();
  }, []);

  const handleNew = () => {
    setSelectedArbitro(null);
    openForm();
  };

  const handleEdit = (arbitro: Arbitro) => {
    setSelectedArbitro(arbitro);
    openForm();
  };

  const handleDelete = (arbitro: Arbitro) => {
    setDeleteTarget(arbitro);
    openDelete();
  };

  const handleSave = async (arbitro: Arbitro): Promise<boolean> => {
    const duplicate = arbitros.some(
      (a) =>
        a.id !== arbitro.id &&
        a.nome.trim().toLowerCase() === arbitro.nome.trim().toLowerCase()
    );
    if (duplicate) {
      notifications.show({
        title: 'Erro',
        message: 'Já existe um árbitro com este nome.',
        color: 'red',
      });
      return false;
    }
    try {
      if (selectedArbitro) {
        await window.electronAPI.updateArbitro(arbitro);
        notifications.show({ title: 'Sucesso', message: 'Árbitro atualizado com sucesso!', color: 'green' });
      } else {
        await window.electronAPI.saveArbitro({
          nome: arbitro.nome,
          equipe: arbitro.equipe,
          faixa: arbitro.faixa,
          chaveIds: arbitro.chaveIds,
        });
        notifications.show({ title: 'Sucesso', message: 'Árbitro cadastrado com sucesso!', color: 'green' });
      }
      await loadArbitros();
      return true;
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao salvar o árbitro.', color: 'red' });
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteArbitro(deleteTarget.id);
      closeDelete();
      setDeleteTarget(null);
      notifications.show({ title: 'Sucesso', message: 'Árbitro excluído com sucesso!', color: 'green' });
      await loadArbitros();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir o árbitro.', color: 'red' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await window.electronAPI.deleteArbitros(selectedIds);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      notifications.show({ title: 'Sucesso', message: `${selectedIds.length} árbitro(s) excluído(s) com sucesso!`, color: 'green' });
      await loadArbitros();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir árbitros.', color: 'red' });
    }
  };

  const handleExport = async () => {
    try {
      await window.electronAPI.exportArbitros();
      notifications.show({ title: 'Sucesso', message: 'Árbitros exportados com sucesso!', color: 'green' });
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao exportar árbitros.', color: 'red' });
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importArbitros();
      if (result.imported === 0 && result.skipped === 0) return;
      const msg = `${result.imported} árbitro(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''}.`;
      notifications.show({ title: 'Sucesso', message: msg, color: 'green' });
      await loadArbitros();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar árbitros.';
      notifications.show({ title: 'Erro ao importar', message: msg, color: 'red', autoClose: false });
    }
  };

  const allSelected = arbitros.length > 0 && selectedIds.length === arbitros.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(arbitros.map(a => a.id));
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
          <Text c="red">Erro ao carregar árbitros.</Text>
          <Button onClick={loadArbitros}>Tentar novamente</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <PageLayout title="Cadastro de Árbitros" backRoute="/admin/arbitros">
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
            placeholder="Buscar árbitro..."
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

      {arbitros.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhum árbitro cadastrado</Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleNew}
          >
            Cadastrar primeiro árbitro
          </Button>
        </Stack>
      ) : filteredArbitros.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhum árbitro encontrado para a busca "{searchQuery}"</Text>
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
                    aria-label="Selecionar todos"
                  />
                </Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Equipe</Table.Th>
                <Table.Th>Faixa</Table.Th>
                <Table.Th>Chaves Atribuídas</Table.Th>
                <Table.Th style={{ width: 100 }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredArbitros.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedIds.includes(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      aria-label={`Selecionar ${a.nome}`}
                    />
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{a.nome}</Table.Td>
                  <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{a.equipe || '-'}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="gray" size="sm">
                      {faixaLabels[a.faixa] || a.faixa}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue" size="sm">
                      {a.chaveIds.length} chave(s)
                    </Badge>
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

      <ArbitroForm
        opened={formOpened}
        onClose={closeForm}
        onSave={handleSave}
        arbitro={selectedArbitro}
      />

      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Excluir Árbitro"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          {deleteTarget && deleteTarget.chaveIds.length > 0
            ? `Este árbitro está vinculado a ${deleteTarget.chaveIds.length} chave(s). As chaves ficarão sem árbitro.`
            : (
              <>
                Deseja realmente excluir o árbitro{' '}
                <Text component="span" fw={600}>
                  {deleteTarget?.nome}
                </Text>
                ? Esta ação não pode ser desfeita.
              </>
            )
          }
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={closeDelete}>Cancelar</Button>
          <Button color="red" onClick={handleDeleteConfirm}>Excluir</Button>
        </Group>
      </Modal>

      <Modal
        opened={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Excluir Árbitros"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          Deseja realmente excluir os {selectedIds.length} árbitro(s) selecionados? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancelar</Button>
          <Button color="red" onClick={handleBulkDelete}>Excluir {selectedIds.length}</Button>
        </Group>
      </Modal>
    </PageLayout>
  );
}
