import { Text, Button, Group, Loader, Center, Stack, Table, Badge, ActionIcon, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTrash, IconArrowsCross } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import type { LutaCasada } from '../types/lutaCasada';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function statusBadge(status: string) {
  const props: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'yellow' },
    completed: { label: 'Finalizada', color: 'green' },
    wo: { label: 'W.O.', color: 'red' },
  };
  const s = props[status] ?? { label: status, color: 'gray' };
  return <Badge color={s.color} size="sm">{s.label}</Badge>;
}

export function AdminLutasCasadas() {
  const [lutas, setLutas] = useState<LutaCasada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LutaCasada | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadList = async () => {
    setError(false);
    try {
      const list = await window.electronAPI.loadLutasCasadas();
      setLutas(list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleDelete = (luta: LutaCasada) => {
    setDeleteTarget(luta);
    openDelete();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.electronAPI.deleteLutaCasada(deleteTarget.id);
      setLutas(prev => prev.filter(l => l.id !== deleteTarget.id));
      closeDelete();
      setDeleteTarget(null);
      notifications.show({ title: 'Sucesso', message: 'Luta casada excluída com sucesso!', color: 'green' });
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir luta casada.', color: 'red' });
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
          <Text c="red">Erro ao carregar lutas casadas.</Text>
          <Button onClick={loadList}>Tentar novamente</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <PageLayout title="Lutas Casadas" backRoute="/admin/dashboard">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Group mb="lg" justify="space-between">
          <div>
            <Text fw={800} size="xl" style={{ color: '#1b325f' }}>
              Lutas Casadas
            </Text>
            <Text size="sm" c="dimmed" mt={2}>
              Total: {lutas.length} luta(s) — gerencie e exclua quando necessário.
            </Text>
          </div>
        </Group>

        {lutas.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: '#e9f2f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconArrowsCross size={32} color="#1b325f" />
              </div>
              <Text fw={700} size="lg" style={{ color: '#1b325f' }}>Nenhuma luta casada</Text>
              <Text size="sm" c="dimmed">Crie lutas casadas pelo placar em uma área.</Text>
            </Stack>
          </Center>
        ) : (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <Table horizontalSpacing="clamp(8px, 1.5vw, 24px)">
                <Table.Thead>
                  <Table.Tr style={{ background: '#f8fafd' }}>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Atleta A</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Atleta B</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Status</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Vencedor</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Criada em</Table.Th>
                    <Table.Th style={{ width: 80, textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {lutas.map((l) => {
                    const nomeA = l.atletaASnapshot?.nome ? l.atletaASnapshot.nome.charAt(0).toUpperCase() + l.atletaASnapshot.nome.slice(1) : l.atletaAId;
                    const nomeB = l.atletaBSnapshot?.nome ? l.atletaBSnapshot.nome.charAt(0).toUpperCase() + l.atletaBSnapshot.nome.slice(1) : l.atletaBId;
                    const vencedor =
                      l.vencedorId === l.atletaAId ? nomeA :
                      l.vencedorId === l.atletaBId ? nomeB :
                      '—';
                    return (
                      <Table.Tr
                        key={l.id}
                        style={{ transition: 'background 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                      >
                        <Table.Td>
                          <Text fw={700} size="sm" style={{ color: '#1b325f' }}>{nomeA}</Text>
                          <Text size="xs" c="dimmed">{l.atletaASnapshot?.equipe || ''}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={700} size="sm" style={{ color: '#1b325f' }}>{nomeB}</Text>
                          <Text size="xs" c="dimmed">{l.atletaBSnapshot?.equipe || ''}</Text>
                        </Table.Td>
                        <Table.Td>{statusBadge(l.status)}</Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} style={{ color: '#374151' }}>{vencedor}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{formatDateTime(l.createdAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(l)}
                              aria-label={`Excluir luta casada`}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          </div>
        )}

        <Modal
          opened={deleteOpened}
          onClose={closeDelete}
          title="Excluir Luta Casada"
          centered
          size="sm"
        >
          <Text size="sm" mb="md">
            Deseja realmente excluir a luta entre{' '}
            <Text component="span" fw={600}>
              {deleteTarget?.atletaASnapshot?.nome || deleteTarget?.atletaAId}
            </Text>{' '}
            e{' '}
            <Text component="span" fw={600}>
              {deleteTarget?.atletaBSnapshot?.nome || deleteTarget?.atletaBId}
            </Text>
            ? Esta ação não pode ser desfeita.
          </Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={closeDelete} styles={{ root: { borderRadius: 12 } }}>Cancelar</Button>
            <Button color="red" onClick={handleDeleteConfirm} styles={{ root: { borderRadius: 12 } }}>Excluir</Button>
          </Group>
        </Modal>
      </div>
    </PageLayout>
  );
}
