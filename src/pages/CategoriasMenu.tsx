import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Text, Group, Box, Title, Grid, Switch, Badge, TextInput, Loader, Center,
} from '@mantine/core';
import { IconList, IconSearch, IconChevronRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { CATEGORIAS_IBJJF, type CategoriaCustomizada } from '../types/category';
import { PageLayout } from '../components/PageLayout';

export function CategoriasMenu() {
  const navigate = useNavigate();
  const [desabilitadas, setDesabilitadas] = useState<string[]>([]);
  const [customizadas, setCustomizadas] = useState<CategoriaCustomizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const data = await window.electronAPI.loadCategorias();
      setDesabilitadas(data.desabilitadas);
      setCustomizadas(data.customizadas);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (categoriaId: string) => {
    try {
      const updated = await window.electronAPI.toggleCategoria(categoriaId);
      setDesabilitadas(updated);
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao alternar categoria.', color: 'red' });
    }
  };

  const ibjjfAtivas = CATEGORIAS_IBJJF.length - desabilitadas.length;

  const filteredIbjjf = useMemo(() => {
    if (!search.trim()) return CATEGORIAS_IBJJF;
    const term = search.toLowerCase();
    return CATEGORIAS_IBJJF.filter(c =>
      c.nome.toLowerCase().includes(term) || c.id.toLowerCase().includes(term)
    );
  }, [search]);

  const filteredCustom = useMemo(() => {
    if (!search.trim()) return customizadas;
    const term = search.toLowerCase();
    return customizadas.filter(c => c.nome.toLowerCase().includes(term));
  }, [search, customizadas]);

  if (loading) {
    return (
      <PageLayout title="Categorias" backRoute="/admin/dashboard">
        <Center py="xl"><Loader color="#3a89c9" /></Center>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Categorias" backRoute="/admin/dashboard">
      {/* Welcome banner + stats */}
      <Box mb="xl">
        <Grid>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Box
              style={{
                background: '#fff',
                border: '1px solid #e9f2f9',
                borderRadius: 16,
                padding: 'clamp(16px, 2vw, 24px)',
                height: '100%',
              }}
            >
              <Title order={4} mt="sm" style={{ color: '#1b325f', fontWeight: 800 }}>
                Módulo de Categorias
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Gerencie categorias IBJJF do sistema e crie categorias personalizadas para o torneio.
              </Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Group gap="sm" grow>
              <Box
                style={{
                  background: '#fff',
                  border: '1px solid #e9f2f9',
                  borderRadius: 16,
                  padding: 'clamp(12px, 2vw, 20px)',
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                <Text fw={800} size="xl" style={{ color: '#1b325f' }}>{ibjjfAtivas}</Text>
                <Text size="xs" fw={600} tt="uppercase" style={{ color: 'rgba(27,50,95,0.5)', letterSpacing: '1px' }}>IBJJF Ativas</Text>
              </Box>
              <Box
                style={{
                  background: '#fff',
                  border: '1px solid #e9f2f9',
                  borderRadius: 16,
                  padding: 'clamp(12px, 2vw, 20px)',
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                <Text fw={800} size="xl" style={{ color: '#1b325f' }}>{customizadas.length}</Text>
                <Text size="xs" fw={600} tt="uppercase" style={{ color: 'rgba(27,50,95,0.5)', letterSpacing: '1px' }}>Customizadas</Text>
              </Box>
            </Group>
          </Grid.Col>
        </Grid>
      </Box>

      {/* Search */}
      <TextInput
        placeholder="Buscar categorias..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="lg"
        maw={600}
        styles={{
          input: {
            border: '2px solid #09738a4d',
            borderRadius: 8,
          },
        }}
      />

      {/* Action cards */}
      <Group gap="lg" mb="xl" maw={900}>
        <Box
          style={{
            background: '#fff',
            borderLeft: '5px solid #1b325f',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 160,
            cursor: 'pointer',
            flex: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(27,50,95,0.2)';
            e.currentTarget.style.borderLeftColor = '#f26c4f';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '';
            e.currentTarget.style.borderLeftColor = '#1b325f';
          }}
          onClick={() => navigate('/admin/categorias/lista')}
        >
          <div>
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#e9f2f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <IconList size={22} color="#1b325f" />
            </Box>
            <Text fw={700} size="lg" style={{ color: '#1b325f' }} mb={4}>
              Categorias Customizadas
            </Text>
            <Text size="sm" style={{ color: 'rgba(27,50,95,0.6)', lineHeight: 1.5 }}>
              Criar, editar e excluir categorias personalizadas para o torneio.
            </Text>
          </div>
          <Box
            mt="lg"
            style={{
              background: '#1b325f',
              color: '#fff',
              borderRadius: 12,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontWeight: 700,
              fontSize: 13,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffbc11';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1b325f';
              e.currentTarget.style.transform = '';
            }}
          >
            <span>Gerenciar</span>
            <IconChevronRight size={12} />
          </Box>
        </Box>
      </Group>

      {/* IBJJF Categories list */}
      <Box
        style={{
          background: '#fff',
          border: '1px solid #e9f2f9',
          borderRadius: 16,
          padding: 'clamp(16px, 2vw, 24px)',
        }}
      >
        <Group justify="space-between" mb="md">
          <Title order={5} style={{ color: '#1b325f' }}>
            Categorias IBJJF do Sistema
          </Title>
          <Badge size="lg" variant="light" color="blue">
            {ibjjfAtivas} / {CATEGORIAS_IBJJF.length} ativas
          </Badge>
        </Group>
        <Text size="sm" c="dimmed" mb="md">
          Alterne para habilitar ou desabilitar categorias. Categorias desabilitadas não aparecerão ao cadastrar atletas.
        </Text>

        <Stack gap={0}>
          {filteredIbjjf.map((cat) => {
            const isDisabled = desabilitadas.includes(cat.id);
            return (
              <Group
                key={cat.id}
                justify="space-between"
                py="xs"
                px="sm"
                style={{
                  borderBottom: '1px solid #f1f3f5',
                  opacity: isDisabled ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <Text size="sm" fw={500} style={{ color: '#1b325f' }}>
                  {cat.nome}
                </Text>
                <Switch
                  size="sm"
                  checked={!isDisabled}
                  onChange={() => handleToggle(cat.id)}
                  color="blue"
                />
              </Group>
            );
          })}
          {filteredIbjjf.length === 0 && (
            <Text size="sm" c="dimmed" py="md" ta="center">
              Nenhuma categoria IBJJF encontrada para a busca.
            </Text>
          )}
        </Stack>
      </Box>

      {/* Custom categories preview */}
      {filteredCustom.length > 0 && (
        <Box
          mt="xl"
          style={{
            background: '#fff',
            border: '1px solid #e9f2f9',
            borderRadius: 16,
            padding: 'clamp(16px, 2vw, 24px)',
          }}
        >
          <Title order={5} mb="md" style={{ color: '#1b325f' }}>
            Categorias Customizadas
          </Title>
          <Stack gap={0}>
            {filteredCustom.map((cat) => (
              <Group
                key={cat.id}
                justify="space-between"
                py="xs"
                px="sm"
                style={{ borderBottom: '1px solid #f1f3f5' }}
              >
                <Group gap="sm">
                  <Box
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: cat.corFaixa,
                      border: '1px solid #ccc',
                    }}
                  />
                  <Text size="sm" fw={500} style={{ color: '#1b325f' }}>
                    {cat.nome}
                  </Text>
                  <Badge size="xs" variant="light" color="gray">
                    {cat.pesoMinimoKg}-{cat.pesoMaximoKg} kg
                  </Badge>
                  <Badge size="xs" variant="light" color="gray">
                    {cat.tempoLutaMinutos} min
                  </Badge>
                </Group>
              </Group>
            ))}
          </Stack>
        </Box>
      )}
    </PageLayout>
  );
}
