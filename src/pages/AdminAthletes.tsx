import { Text, Button, Group, Loader, Center, Stack, TextInput, Select, Badge, ActionIcon, Table, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconFileUpload, IconFileCode, IconSearch, IconPencil, IconTrash, IconUsers, IconTrophy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, useMemo } from 'react';
import type { Atleta, Faixa } from '../types/athlete';
import { categoriaLabels } from '../types/category';
import { AthleteForm } from '../components/AthleteForm';
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

const faixaColor: Record<Faixa, string> = {
  branca: '#e2e8f0',
  cinza: '#9ca3af',
  amarela: '#fbbf24',
  laranja: '#f97316',
  verde: '#22c55e',
  azul: '#3b82f6',
  roxa: '#a855f7',
  marrom: '#78350f',
  preta: '#000000',
};

function calcularIdade(anoNascimento: number): number {
  return new Date().getFullYear() - anoNascimento;
}

export function AdminAthletes() {
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Atleta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [beltFilter, setBeltFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<Atleta | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const loadAthletes = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await window.electronAPI.loadAthletes();
      setAthletes(list.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = useMemo(() => {
    let result = athletes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.nome.toLowerCase().includes(q) ||
        (a.equipe && a.equipe.toLowerCase().includes(q)) ||
        (categoriaLabels[a.categoria] || a.categoria).toLowerCase().includes(q)
      );
    }
    if (beltFilter) {
      result = result.filter(a => a.faixa === beltFilter);
    }
    return result;
  }, [athletes, searchQuery, beltFilter]);

  const faixaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of athletes) {
      counts[a.faixa] = (counts[a.faixa] || 0) + 1;
    }
    return counts;
  }, [athletes]);

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
      notifications.show({ title: 'Erro', message: 'Já existe um atleta cadastrado com este nome e ano de nascimento.', color: 'red' });
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
      notifications.show({ title: 'Sucesso', message: 'Atletas exportados em JSON!', color: 'green' });
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
          <Text c="red">Erro ao carregar atletas.</Text>
          <Button onClick={loadAthletes}>Tentar novamente</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <PageLayout title="Atletas" backRoute="/admin/atletas">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Dashboard Header Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Text fw={800} size="xl" style={{ color: '#1b325f' }}>
                Lista Oficial de Atletas
              </Text>
              <Text size="sm" c="dimmed" mt={2}>
                Gerencie inscrições, importe dados e controle os atletas.
              </Text>
            </div>
            <Group gap="sm">
              <Button
                variant="default"
                leftSection={<IconFileUpload size={16} />}
                onClick={handleImport}
                styles={{ root: { borderRadius: 12 } }}
              >
                Importar
              </Button>
              <Button
                variant="default"
                leftSection={<IconFileCode size={16} />}
                onClick={handleExport}
                styles={{ root: { borderRadius: 12 } }}
              >
                Exportar JSON
              </Button>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleNew}
                styles={{
                  root: {
                    backgroundColor: '#1b325f',
                    borderRadius: 12,
                    '&:hover': { backgroundColor: '#3a89c9' },
                  },
                }}
              >
                Cadastrar Atleta
              </Button>
            </Group>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
            <div
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <Text size="xs" fw={700} tt="uppercase" style={{ color: 'rgba(27,50,95,0.5)', letterSpacing: 1 }}>
                  Inscritos
                </Text>
                <Text fw={900} size="2.5rem" style={{ color: '#1b325f', lineHeight: 1.1, marginTop: 4 }}>
                  {athletes.length}
                </Text>
                <Text size="xs" fw={600} style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <IconUsers size={12} /> Prontos para combate
                </Text>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#e9f2f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUsers size={24} color="#1b325f" />
              </div>
            </div>

            <div
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 16,
                padding: 24,
              }}
            >
              <Text fw={700} size="sm" style={{ color: '#1b325f', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconTrophy size={16} /> Graduações (Faixas)
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {faixaOrder.map((faixa) => {
                  const count = faixaCounts[faixa] || 0;
                  return (
                    <div
                      key={faixa}
                      style={{
                        padding: 8,
                        border: `1px solid ${count > 0 ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)'}`,
                        borderRadius: 12,
                        textAlign: 'center',
                        opacity: count > 0 ? 1 : 0.4,
                        background: count > 0 ? '#f8fafd' : 'transparent',
                      }}
                    >
                      <Text size="xs" fw={600} style={{ color: 'rgba(27,50,95,0.5)' }}>
                        {faixaLabels[faixa].toUpperCase()}
                      </Text>
                      <Text fw={900} size="lg" style={{ color: '#1b325f', marginTop: 2 }}>
                        {count}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <TextInput
            placeholder="Buscar atleta por nome, equipe ou categoria..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 280 }}
          />
          <Select
            placeholder="Todas as Faixas"
            data={faixaOrder.map((f) => ({ value: f, label: faixaLabels[f] }))}
            value={beltFilter}
            onChange={(v) => setBeltFilter(v || '')}
            clearable
            style={{ width: 180 }}
          />
        </div>

        {/* Table */}
        {athletes.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Text c="dimmed">Nenhum atleta cadastrado</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={handleNew} styles={{ root: { borderRadius: 12 } }}>
              Cadastrar primeiro atleta
            </Button>
          </Stack>
        ) : filteredAthletes.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#e9f2f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <IconUsers size={32} color="#1b325f" />
            </div>
            <Text fw={700} size="lg" style={{ color: '#1b325f' }}>Nenhum atleta encontrado</Text>
            <Text size="sm" c="dimmed">Refine seus filtros ou tente pesquisar por outro termo.</Text>
          </Stack>
        ) : (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <Table horizontalSpacing="clamp(8px, 1.5vw, 24px)">
                <Table.Thead>
                  <Table.Tr style={{ background: '#f8fafd' }}>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Nome</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Equipe</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Faixa</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)' }}>Categoria</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)', textAlign: 'center' }}>Idade</Table.Th>
                    <Table.Th style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(27,50,95,0.5)', textAlign: 'center', width: 100 }}>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredAthletes.map((a) => (
                    <Table.Tr
                      key={a.id}
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    >
                      <Table.Td>
                        <Text fw={700} size="sm" style={{ color: '#1b325f' }}>{a.nome}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray" styles={{ root: { textTransform: 'none', fontWeight: 600 } }}>
                          {a.equipe}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: faixaColor[a.faixa] || '#ccc',
                              border: '1px solid rgba(0,0,0,0.1)',
                              flexShrink: 0,
                            }}
                          />
                          <Text size="sm" fw={600} style={{ color: '#374151' }}>{faixaLabels[a.faixa] || a.faixa}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue" size="sm" styles={{ root: { fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' } }}>
                          {categoriaLabels[a.categoria] || a.categoria}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Text size="sm" fw={600} style={{ color: '#374151' }}>
                          {calcularIdade(a.anoNascimento)} <Text component="span" size="xs" style={{ color: 'rgba(27,50,95,0.4)' }}>anos</Text>
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="center" wrap="nowrap">
                          <ActionIcon variant="subtle" color="blue" onClick={() => handleEdit(a)} aria-label={`Editar ${a.nome}`}>
                            <IconPencil size={18} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(a)} aria-label={`Excluir ${a.nome}`}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </div>
        )}
      </div>

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
          <Button variant="outline" onClick={closeDelete} styles={{ root: { borderRadius: 12 } }}>Cancelar</Button>
          <Button color="red" onClick={handleDeleteConfirm} styles={{ root: { borderRadius: 12 } }}>Excluir</Button>
        </Group>
      </Modal>
    </PageLayout>
  );
}
