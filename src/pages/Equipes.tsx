import { Paper, Title, Text, Button, Stack, Group, Loader, Center, Table, Badge, TextInput } from '@mantine/core';
import { IconBuildingSkyscraper, IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import type { Atleta } from '../types/athlete';
import { PageLayout } from '../components/PageLayout';

export function Equipes() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  useEffect(() => {
    window.addEventListener('focus', loadAthletes);
    return () => window.removeEventListener('focus', loadAthletes);
  }, []);

  const equipeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of athletes) {
      const key = a.equipe;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [athletes]);

  const sortedEquipes = useMemo(() => {
    return Object.entries(equipeCounts)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [equipeCounts]);

  const filteredEquipes = useMemo(() => {
    if (!searchQuery.trim()) return sortedEquipes;
    const q = searchQuery.toLowerCase().trim();
    return sortedEquipes.filter(([nome]) => nome.toLowerCase().includes(q));
  }, [sortedEquipes, searchQuery]);

  const totalAtletas = athletes.length;
  const totalEquipes = sortedEquipes.length;

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
    <PageLayout title="Equipes" backRoute="/admin/dashboard">
      <Group mb="md" justify="space-between">
        <Title order={2}>Equipes / Academias</Title>
        <TextInput
          placeholder="Buscar equipe..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          w={250}
        />
      </Group>

      {totalEquipes > 0 && (
        <Paper withBorder p="sm" mb="md" radius="md">
          <Group gap="xs">
            <Badge variant="light" color="blue" size="lg">Total: {totalAtletas} atletas</Badge>
            <Badge variant="light" color="teal" size="lg">{totalEquipes} equipes</Badge>
          </Group>
        </Paper>
      )}

      {totalEquipes === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <IconBuildingSkyscraper size={48} stroke={1.5} color="#ccc" />
          <Text c="dimmed">Nenhum atleta cadastrado</Text>
          <Button onClick={() => navigate('/admin/atletas')}>
            Cadastrar atletas
          </Button>
        </Stack>
      ) : filteredEquipes.length === 0 ? (
        <Stack align="center" gap="md" py="xl">
          <Text c="dimmed">Nenhuma equipe encontrada para a busca "{searchQuery}"</Text>
        </Stack>
      ) : (
        <Paper withBorder shadow="sm" radius="md" style={{ overflow: 'hidden' }}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Equipe</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Atletas</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredEquipes.map(([equipe, count]) => (
                <Table.Tr key={equipe}>
                  <Table.Td>
                    <Text tt="capitalize">{equipe}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <Badge variant="light" color="gray" size="sm">{count}</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </PageLayout>
  );
}
