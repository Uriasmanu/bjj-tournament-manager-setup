import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, Group, Box, Title, Grid } from '@mantine/core';
import { IconPlus, IconList, IconFileUpload, IconChevronRight, IconUsers } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { Arbitro } from '../types/referee';
import { PageLayout } from '../components/PageLayout';
import { ArbitroForm } from '../components/ArbitroForm';

const cards = [
  {
    label: 'Cadastrar Árbitro',
    description: 'Cadastrar um novo árbitro no sistema',
    icon: IconPlus,
    iconColor: '#1b325f',
  },
  {
    label: 'Listar Árbitros',
    description: 'Visualizar, editar e excluir árbitros cadastrados',
    icon: IconList,
    iconColor: '#1b325f',
  },
  {
    label: 'Importar Árbitros',
    description: 'Importar árbitros a partir de arquivo JSON',
    icon: IconFileUpload,
    iconColor: '#1b325f',
  },
];

export function ArbitrosMenu() {
  const navigate = useNavigate();
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const loadArbitros = async () => {
    try { const list = await window.electronAPI.loadArbitros(); setArbitros(list); } catch { /* silent */ }
  };

  useEffect(() => { loadArbitros(); }, []);

  const handleNew = () => { openForm(); };

  const handleSave = async (arbitro: Arbitro): Promise<boolean> => {
    const duplicate = arbitros.some((a) => a.id !== arbitro.id && a.nome.trim().toLowerCase() === arbitro.nome.trim().toLowerCase());
    if (duplicate) { notifications.show({ title: 'Erro', message: 'Já existe um árbitro com este nome.', color: 'red' }); return false; }
    try {
      await window.electronAPI.saveArbitro({ nome: arbitro.nome, equipe: arbitro.equipe, faixa: arbitro.faixa, chaveIds: arbitro.chaveIds });
      notifications.show({ title: 'Sucesso', message: 'Árbitro cadastrado com sucesso!', color: 'green' });
      await loadArbitros(); return true;
    } catch { notifications.show({ title: 'Erro', message: 'Erro ao salvar o árbitro.', color: 'red' }); return false; }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importArbitros();
      if (result.imported === 0 && result.skipped === 0) return;
      notifications.show({ title: 'Sucesso', message: `${result.imported} árbitro(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''}.`, color: 'green' });
      await loadArbitros();
    } catch (err) {
      notifications.show({ title: 'Erro ao importar', message: err instanceof Error ? err.message : 'Erro ao importar árbitros.', color: 'red', autoClose: false });
    }
  };

  return (
    <PageLayout title="Árbitros" backRoute="/admin/dashboard">
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
                Módulo de Gestão de Árbitros
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Opções de administração para cadastro, importação e gerenciamento de árbitros.
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
                <IconUsers size={18} color="#1b325f" />
              </Box>
              <Text fw={800} size="xl" style={{ color: '#1b325f' }}>{arbitros.length}</Text>
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
            const isImport = card.label === 'Importar Árbitros';
            const isList = card.label === 'Listar Árbitros';

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
                  if (isImport) handleImport();
                  else if (isList) navigate('/admin/arbitros/lista');
                  else handleNew();
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

      <ArbitroForm opened={formOpened} onClose={closeForm} onSave={handleSave} arbitro={null} />
    </PageLayout>
  );
}
