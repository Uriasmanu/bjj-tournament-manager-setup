import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, Group, Box, Title, Grid, Switch, Badge, TextInput, Loader, Center } from '@mantine/core';
import { IconPlus, IconList, IconSearch, IconChevronRight, IconTag } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { CATEGORIAS_IBJJF, type CategoriaCustomizada } from '../types/category';
import { PageLayout } from '../components/PageLayout';
import { CategoriaForm } from '../components/CategoriaForm';

const cards = [
  {
    label: 'Categorias IBJJF',
    description: 'Habilitar ou desabilitar categorias do sistema',
    icon: IconTag,
    iconColor: '#1b325f',
  },
  {
    label: 'Nova Categoria Customizada',
    description: 'Criar uma nova categoria personalizada para o torneio',
    icon: IconPlus,
    iconColor: '#1b325f',
  },
  {
    label: 'Listar Categorias Customizadas',
    description: 'Visualizar, editar e excluir categorias personalizadas',
    icon: IconList,
    iconColor: '#1b325f',
  },
];

export function CategoriasMenu() {
  const navigate = useNavigate();
  const [desabilitadas, setDesabilitadas] = useState<string[]>([]);
  const [customizadas, setCustomizadas] = useState<CategoriaCustomizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

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

  const handleSave = async (data: Omit<CategoriaCustomizada, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      await window.electronAPI.saveCategoriaCustomizada(data);
      notifications.show({ title: 'Sucesso', message: 'Categoria criada com sucesso!', color: 'green' });
      await loadData();
      return true;
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao criar categoria.', color: 'red' });
      return false;
    }
  };

  const ibjjfAtivas = CATEGORIAS_IBJJF.length - desabilitadas.length;

  const filteredIbjjf = useMemo(() => {
    const desabilitadasSet = new Set(desabilitadas);
    const list = !search.trim()
      ? [...CATEGORIAS_IBJJF]
      : CATEGORIAS_IBJJF.filter(c =>
          c.nome.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())
        );
    return list.sort((a, b) => {
      const aAtivo = !desabilitadasSet.has(a.id);
      const bAtivo = !desabilitadasSet.has(b.id);
      if (aAtivo && !bAtivo) return -1;
      if (!aAtivo && bAtivo) return 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [search, desabilitadas]);

  if (loading) {
    return (
      <PageLayout title="Categorias" backRoute="/admin/dashboard">
        <Center py="xl"><Loader color="#3a89c9" /></Center>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Categorias" backRoute="/admin/dashboard">
      {/* Welcome banner + quick stats */}
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
                Módulo de Gestão de Categorias
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Opções de administração para categorias IBJJF e categorias personalizadas do torneio.
              </Text>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Box
              style={{
                background: '#fff',
                border: '1px solid #e9f2f9',
                borderRadius: 16,
                padding: 'clamp(16px, 2vw, 24px)',
                height: '100%',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#e9f2f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <IconTag size={18} color="#1b325f" />
              </Box>
              <Text fw={800} size="xl" style={{ color: '#1b325f' }}>{ibjjfAtivas + customizadas.length}</Text>
              <Text size="xs" fw={600} tt="uppercase" style={{ color: 'rgba(27,50,95,0.5)', letterSpacing: '1px' }}>Total</Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Box>

      {/* Cards */}
      <Stack gap="lg" maw={900} mx="auto">
        <Group gap="lg" grow align="stretch">
          {cards.map((card) => {
            const Icon = card.icon;
            const isIbjjf = card.label === 'Categorias IBJJF';
            const isList = card.label === 'Listar Categorias Customizadas';

            return (
              <Box
                key={card.label}
                style={{
                  background: '#fff',
                  borderLeft: '5px solid #1b325f',
                  borderRadius: 12,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 240,
                  cursor: 'pointer',
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
                onClick={() => {
                  if (isIbjjf) {
                    document.getElementById('ibjjf-section')?.scrollIntoView({ behavior: 'smooth' });
                  } else if (isList) {
                    navigate('/admin/categorias/lista');
                  } else {
                    openForm();
                  }
                }}
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
                      marginBottom: 20,
                    }}
                  >
                    <Icon size={22} color={card.iconColor} />
                  </Box>
                  <Text fw={700} size="lg" style={{ color: '#1b325f' }} mb={4}>
                    {card.label}
                  </Text>
                  <Text size="sm" style={{ color: 'rgba(27,50,95,0.6)', lineHeight: 1.5 }}>
                    {card.description}
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
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,188,17,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1b325f';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <span>Acessar</span>
                  <IconChevronRight size={12} />
                </Box>
              </Box>
            );
          })}
        </Group>
      </Stack>

      {/* Search */}
      <TextInput
        placeholder="Buscar categorias..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mt="xl"
        mb="lg"
        maw={600}
        styles={{
          input: {
            border: '2px solid #09738a4d',
            borderRadius: 8,
          },
        }}
      />

      {/* IBJJF Categories list */}
      <Box
        id="ibjjf-section"
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
            const limite = cat.pesoMaximoKg !== null
              ? `até ${cat.pesoMaximoKg.toFixed(1).replace('.', ',')} kg`
              : 'sem limite';
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
                <Group gap="sm">
                  <Text size="sm" fw={600} style={{ color: '#1b325f', minWidth: 200 }}>
                    {cat.nome}
                  </Text>
                  <Badge size="sm" variant="light" color="gray">
                    {limite}
                  </Badge>
                </Group>
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

      {/* Form modal */}
      <CategoriaForm opened={formOpened} onClose={closeForm} onSave={handleSave} categoria={null} />
    </PageLayout>
  );
}
