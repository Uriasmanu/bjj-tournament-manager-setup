import { Text, Button, Group, Loader, Center, Stack, Table, Badge, ActionIcon, Checkbox, TextInput, Switch, Modal, Select } from '@mantine/core';
import { IconTrash, IconSearch, IconRestore, IconArrowsCross, IconPlus, IconPencil, IconFileDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { ModalCriarLutaCasada } from '../components/ModalCriarLutaCasada';
import { ModalEditarLutaCasada } from '../components/ModalEditarLutaCasada';
import { gerarPdfLutasCasadas } from '../utils/pdfGenerator';
import type { LutaCasada } from '../types/lutaCasada';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';
import type { AreaLuta } from '../types/area';
import type { Torneio } from '../types/tournament';
import type { CategoriaCustomizada } from '../types/category';
import { getTipoVitoria } from '../utils/vitoria';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkPermanentOpen, setBulkPermanentOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLuta, setEditingLuta] = useState<LutaCasada | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [areas, setAreas] = useState<AreaLuta[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [customizadas, setCustomizadas] = useState<CategoriaCustomizada[]>([]);

  const loadList = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = showDeleted
        ? await window.electronAPI.loadDeletedLutasCasadas()
        : await window.electronAPI.loadLutasCasadas();
      setLutas(list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      setSelectedIds([]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredLutas = useMemo(() => {
    if (!searchQuery.trim()) return lutas;
    const q = searchQuery.toLowerCase().trim();
    return lutas.filter(l => {
      const nomeA = l.atletaASnapshot?.nome?.toLowerCase() || l.atletaAId.toLowerCase();
      const nomeB = l.atletaBSnapshot?.nome?.toLowerCase() || l.atletaBId.toLowerCase();
      return nomeA.includes(q) || nomeB.includes(q);
    });
  }, [lutas, searchQuery]);

  useEffect(() => {
    loadList();
    window.electronAPI.loadAreas().then((a) => setAreas(a as AreaLuta[])).catch(() => {});
    window.electronAPI.loadAthletes().then((a) => setAtletas(a as Atleta[])).catch(() => {});
    window.electronAPI.loadArbitros().then((a) => setArbitros(a as Arbitro[])).catch(() => {});
    window.electronAPI.getActiveTournament().then((t) => setTorneio(t)).catch(() => {});
    window.electronAPI.loadCategorias().then((data) => setCustomizadas(data.customizadas)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

  const allSelected = lutas.length > 0 && selectedIds.length === lutas.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(lutas.map(l => l.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await window.electronAPI.deleteLutasCasadas(selectedIds);
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      notifications.show({ title: 'Sucesso', message: `${selectedIds.length} luta(s) casada(s) movida(s) para os deletados.`, color: 'green' });
      await loadList();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir lutas casadas.', color: 'red' });
    }
  };

  const handleBulkPermanent = async () => {
    if (selectedIds.length === 0) return;
    try {
      await window.electronAPI.permanentlyDeleteLutasCasadas(selectedIds);
      setBulkPermanentOpen(false);
      setSelectedIds([]);
      notifications.show({ title: 'Sucesso', message: `${selectedIds.length} luta(s) casada(s) excluída(s) permanentemente.`, color: 'green' });
      await loadList();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir permanentemente.', color: 'red' });
    }
  };

  const handleDelete = async (luta: LutaCasada) => {
    try {
      await window.electronAPI.deleteLutaCasada(luta.id);
      notifications.show({ title: 'Sucesso', message: 'Luta casada movida para os deletados.', color: 'green' });
      await loadList();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir luta casada.', color: 'red' });
    }
  };

  const handleRestore = async (luta: LutaCasada) => {
    try {
      await window.electronAPI.restoreLutaCasada(luta.id);
      notifications.show({ title: 'Sucesso', message: 'Luta casada restaurada com sucesso!', color: 'green' });
      await loadList();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao restaurar luta casada.', color: 'red' });
    }
  };

  const handlePermanent = async (luta: LutaCasada) => {
    try {
      await window.electronAPI.permanentlyDeleteLutaCasada(luta.id);
      notifications.show({ title: 'Sucesso', message: 'Luta casada excluída permanentemente.', color: 'green' });
      await loadList();
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao excluir permanentemente.', color: 'red' });
    }
  };

  const handleLutaCasadaCriada = (_luta: LutaCasada) => {
    setCreateModalOpen(false);
    setSelectedAreaId(null);
    notifications.show({ title: 'Sucesso', message: 'Luta casada criada com sucesso!', color: 'green' });
    loadList();
  };

  const handleEdit = (luta: LutaCasada) => {
    setEditingLuta(luta);
    setEditModalOpen(true);
  };

  const handleEditSaved = (_lutaAtualizada: LutaCasada) => {
    setEditModalOpen(false);
    setEditingLuta(null);
    notifications.show({ title: 'Sucesso', message: 'Luta casada atualizada com sucesso!', color: 'green' });
    loadList();
  };

  const getNomeArea = (areaId: string | null): string => {
    if (!areaId) return '—';
    const area = areas.find(a => a.id === areaId);
    return area?.nome || '—';
  };

  const getNome = (l: LutaCasada, side: 'A' | 'B'): string => {
    const snapshot = side === 'A' ? l.atletaASnapshot : l.atletaBSnapshot;
    const id = side === 'A' ? l.atletaAId : l.atletaBId;
    return snapshot?.nome ? snapshot.nome.charAt(0).toUpperCase() + snapshot.nome.slice(1) : id;
  };

  const getVencedor = (l: LutaCasada): string => {
    if (l.vencedorId === l.atletaAId) return getNome(l, 'A');
    if (l.vencedorId === l.atletaBId) return getNome(l, 'B');
    return '—';
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
    <PageLayout title={showDeleted ? 'Lutas Casadas Deletadas' : 'Lutas Casadas'} backRoute="/admin/dashboard">
      <Group mb="md" justify="space-between" wrap="wrap">
        <Group>
          <Switch
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.currentTarget.checked)}
            label="Mostrar apenas os deletados"
            size="md"
            styles={{ label: { fontWeight: 600 } }}
          />
        </Group>
        <Group>
          {!showDeleted && (
            <>
              <Button
                leftSection={<IconFileDownload size={16} />}
                variant="outline"
                onClick={async () => {
                  const nomeTorneio = torneio?.nome || 'Torneio';
                  await gerarPdfLutasCasadas(lutas, nomeTorneio, arbitros, customizadas);
                }}
                disabled={lutas.length === 0}
              >
                Gerar PDF
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpen(true)}
                style={{ backgroundColor: '#1b325f', color: '#fff' }}
              >
                Nova Luta Casada
              </Button>
            </>
          )}
          <Text fw={800} size="xl" style={{ color: '#1b325f' }}>
            {showDeleted ? 'Lutas Casadas Deletadas' : 'Lutas Casadas'}
          </Text>
        </Group>
      </Group>
      <Group mb="md" justify="space-between" wrap="wrap">
        <Group>
          <TextInput
            placeholder={showDeleted ? 'Buscar luta deletada...' : 'Buscar luta...'}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            w={250}
          />
          {selectedIds.length > 0 && (showDeleted ? (
            <Button color="red" leftSection={<IconTrash size={16} />} onClick={() => setBulkPermanentOpen(true)}>
              Excluir Permanentemente ({selectedIds.length})
            </Button>
          ) : (
            <Button color="red" leftSection={<IconTrash size={16} />} onClick={() => setBulkDeleteOpen(true)}>
              Excluir Selecionados ({selectedIds.length})
            </Button>
          ))}
        </Group>
      </Group>

      {lutas.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <div
              style={{
                width: 80, height: 80, borderRadius: '50%', background: '#e9f2f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconArrowsCross size={32} color="#1b325f" />
            </div>
            <Text fw={700} size="lg" style={{ color: '#1b325f' }}>
              {showDeleted ? 'Nenhuma luta casada na lixeira' : 'Nenhuma luta casada'}
            </Text>
        <Text size="sm" c="dimmed">Crie lutas casadas pelo menu acima.</Text>
          </Stack>
        </Center>
      ) : filteredLutas.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhuma luta encontrada para a busca "{searchQuery}"</Text>
        </Stack>
      ) : (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <Table horizontalSpacing="clamp(8px, 1.5vw, 24px)">
              <Table.Thead>
                <Table.Tr style={{ background: '#f8fafd' }}>
                  <Table.Th w={40}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selectedIds.length > 0 && !allSelected}
                      onChange={toggleAll}
                      aria-label="Selecionar todas"
                    />
                  </Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Atleta A</Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Atleta B</Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Status</Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Tipo</Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Vencedor</Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Área</Table.Th>
                  <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Criada em</Table.Th>
                  {showDeleted && <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Deletado em</Table.Th>}
                  <Table.Th style={{ width: 100, textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredLutas.map((l) => {
                  const nomeA = getNome(l, 'A');
                  const nomeB = getNome(l, 'B');
                  const vencedor = getVencedor(l);
                  return (
                    <Table.Tr
                      key={l.id}
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    >
                      <Table.Td>
                        <Checkbox
                          checked={selectedIds.includes(l.id)}
                          onChange={() => toggleSelect(l.id)}
                          aria-label={`Selecionar ${nomeA} vs ${nomeB}`}
                        />
                      </Table.Td>
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
                        {l.status !== 'pending' && (() => {
                          const tipo = getTipoVitoria(l);
                          return <Badge size="sm" color={tipo.color} variant="light">{tipo.icon} {tipo.label}</Badge>;
                        })()}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600} style={{ color: '#374151' }}>{vencedor}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{getNomeArea(l.areaId)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{formatDateTime(l.createdAt)}</Text>
                      </Table.Td>
                      {showDeleted && (
                        <Table.Td>
                          <Text size="sm" c="dimmed">{formatDateTime(l.deletedAt)}</Text>
                        </Table.Td>
                      )}
                      <Table.Td>
                        <Group gap="xs" justify="center">
                          {showDeleted ? (
                            <>
                              <ActionIcon
                                variant="subtle"
                                color="green"
                                onClick={() => handleRestore(l)}
                                aria-label={`Restaurar luta casada`}
                                title="Restaurar"
                              >
                                <IconRestore size={18} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => handlePermanent(l)}
                                aria-label={`Excluir permanentemente luta casada`}
                                title="Excluir permanentemente"
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </>
                          ) : (
                            <>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => handleEdit(l)}
                                aria-label={`Editar luta casada`}
                                title="Editar"
                              >
                                <IconPencil size={18} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => handleDelete(l)}
                                aria-label={`Excluir luta casada`}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </>
                          )}
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
        opened={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Excluir Lutas Casadas"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          As {selectedIds.length} luta(s) casada(s) selecionada(s) serão movidas para os deletados. Você poderá restaurá-las na aba de lixeira.
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
          As {selectedIds.length} luta(s) casada(s) selecionada(s) serão removidas para sempre e não poderão ser restauradas.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setBulkPermanentOpen(false)}>Cancelar</Button>
          <Button color="red" onClick={handleBulkPermanent}>
            Excluir {selectedIds.length} Permanentemente
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setSelectedAreaId(null); }}
        title="Nova Luta Casada"
        centered
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">Selecione a área para criar a luta casada:</Text>
          <Select
            placeholder="Selecione uma área"
            data={areas.map(a => ({ value: a.id, label: a.nome }))}
            value={selectedAreaId}
            onChange={setSelectedAreaId}
            searchable
            clearable
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => { setCreateModalOpen(false); setSelectedAreaId(null); }}>Cancelar</Button>
          </Group>
        </Stack>
      </Modal>

      {selectedAreaId && (() => {
        const area = areas.find(a => a.id === selectedAreaId);
        if (!area) return null;
        return (
          <ModalCriarLutaCasada
            opened={true}
            onClose={() => { setSelectedAreaId(null); }}
            area={area}
            atletas={atletas}
            arbitros={arbitros}
            onCriada={handleLutaCasadaCriada}
          />
        );
      })()}

      <ModalEditarLutaCasada
        opened={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingLuta(null); }}
        luta={editingLuta}
        atletas={atletas}
        arbitros={arbitros}
        areas={areas}
        onSalvo={handleEditSaved}
      />
    </PageLayout>
  );
}
