import { useState, useEffect, useMemo } from 'react';
import {
  Text, Group, Box, Title, Table, ActionIcon, TextInput, Loader, Center, Modal, Stack, Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconSearch, IconPlus } from '@tabler/icons-react';
import type { CategoriaCustomizada } from '../types/category';
import { PageLayout } from '../components/PageLayout';
import { CategoriaForm } from '../components/CategoriaForm';

export function AdminCategorias() {
  const [customizadas, setCustomizadas] = useState<CategoriaCustomizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaCustomizada | null>(null);
  const [deleteModalOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deletingCategoria, setDeletingCategoria] = useState<CategoriaCustomizada | null>(null);

  const loadData = async () => {
    try {
      const data = await window.electronAPI.loadCategorias();
      setCustomizadas(data.customizadas);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleNew = () => {
    setEditingCategoria(null);
    openForm();
  };

  const handleEdit = (cat: CategoriaCustomizada) => {
    setEditingCategoria(cat);
    openForm();
  };

  const handleSave = async (data: Omit<CategoriaCustomizada, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      if (editingCategoria) {
        await window.electronAPI.updateCategoriaCustomizada({
          ...editingCategoria,
          ...data,
        });
        notifications.show({ title: 'Sucesso', message: 'Categoria atualizada com sucesso!', color: 'green' });
      } else {
        await window.electronAPI.saveCategoriaCustomizada(data);
        notifications.show({ title: 'Sucesso', message: 'Categoria criada com sucesso!', color: 'green' });
      }
      await loadData();
      return true;
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao salvar categoria.', color: 'red' });
      return false;
    }
  };

  const handleDeleteClick = (cat: CategoriaCustomizada) => {
    setDeletingCategoria(cat);
    openDelete();
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategoria) return;
    try {
      await window.electronAPI.deleteCategoriaCustomizada(deletingCategoria.id);
      notifications.show({ title: 'Sucesso', message: 'Categoria excluída com sucesso!', color: 'green' });
      await loadData();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir categoria.', color: 'red' });
    }
    closeDelete();
    setDeletingCategoria(null);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customizadas;
    const term = search.toLowerCase();
    return customizadas.filter(c => c.nome.toLowerCase().includes(term));
  }, [search, customizadas]);

  if (loading) {
    return (
      <PageLayout title="Categorias Customizadas" backRoute="/admin/categorias">
        <Center py="xl"><Loader color="#3a89c9" /></Center>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Categorias Customizadas" backRoute="/admin/categorias">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={4} style={{ color: '#1b325f', fontWeight: 800 }}>
            Categorias Customizadas
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            {customizadas.length} categoria(s) personalizada(s) cadastrada(s).
          </Text>
        </Box>
        <Group gap="sm">
          <TextInput
            placeholder="Buscar..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
            styles={{
              input: {
                border: '2px solid #09738a4d',
                borderRadius: 8,
              },
            }}
          />
          <Box
            component="button"
            onClick={handleNew}
            style={{
              background: '#1b325f',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3a89c9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1b325f';
            }}
          >
            <IconPlus size={16} />
            Nova Categoria
          </Box>
        </Group>
      </Group>

      {/* Table */}
      {filtered.length === 0 ? (
        <Box
          style={{
            background: '#fff',
            border: '1px solid #e9f2f9',
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
          }}
        >
          <Text size="lg" fw={600} style={{ color: '#1b325f' }} mb={4}>
            {search ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria customizada'}
          </Text>
          <Text size="sm" c="dimmed">
            {search ? 'Tente outro termo de busca.' : 'Clique em "Nova Categoria" para criar a primeira.'}
          </Text>
        </Box>
      ) : (
        <Box
          style={{
            background: '#fff',
            border: '1px solid #e9f2f9',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Peso</Table.Th>
                <Table.Th>Tempo</Table.Th>
                <Table.Th style={{ width: 100 }}>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((cat) => (
                <Table.Tr key={cat.id}>
                  <Table.Td>
                    <Text fw={500} size="sm">{cat.nome}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{cat.pesoMinimoKg} - {cat.pesoMaximoKg} kg</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{cat.tempoLutaMinutos} min</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(cat)}
                        aria-label={`Editar ${cat.nome}`}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteClick(cat)}
                        aria-label={`Excluir ${cat.nome}`}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      {/* Form modal */}
      <CategoriaForm
        opened={formOpened}
        onClose={closeForm}
        onSave={handleSave}
        categoria={editingCategoria}
      />

      {/* Delete confirmation modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDelete}
        centered
        title={
          <Text fw={700} style={{ color: '#1b325f' }}>
            Excluir Categoria
          </Text>
        }
      >
        <Stack gap="md">
          <Text size="sm">
            Tem certeza que deseja excluir a categoria{' '}
            <strong>{deletingCategoria?.nome}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            Esta ação não pode ser desfeita.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={closeDelete}>Cancelar</Button>
            <Button
              color="red"
              onClick={handleConfirmDelete}
              styles={{
                root: {
                  backgroundColor: '#e03131',
                  color: '#fff',
                  borderRadius: 12,
                  '&:hover': { backgroundColor: '#c92a2a' },
                },
              }}
            >
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>
    </PageLayout>
  );
}
