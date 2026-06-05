import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, Text, Group, Box, Title, Grid } from '@mantine/core';
import { IconPlus, IconList, IconFileUpload, IconChevronRight, IconUsers } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { Atleta } from '../types/athlete';
import { PageLayout } from '../components/PageLayout';
import { AthleteForm } from '../components/AthleteForm';

const cards = [
  {
    label: 'Cadastrar Atleta',
    description: 'Cadastrar um novo atleta no sistema',
    icon: IconPlus,
    iconColor: '#1b325f',
  },
  {
    label: 'Listar Atletas',
    description: 'Visualizar, editar e excluir atletas cadastrados',
    icon: IconList,
    iconColor: '#1b325f',
  },
  {
    label: 'Importar Atletas',
    description: 'Importar atletas a partir de arquivo JSON',
    icon: IconFileUpload,
    iconColor: '#1b325f',
  },
];

export function AthletesMenu() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const loadAthletes = async () => {
    try {
      const list = await window.electronAPI.loadAthletes();
      setAthletes(list);
    } catch { /* silent */ }
  };

  useEffect(() => { loadAthletes(); }, []);

  const handleNew = () => { openForm(); };

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
      await window.electronAPI.saveAthlete(athlete);
      notifications.show({ title: 'Sucesso', message: 'Atleta cadastrado com sucesso!', color: 'green' });
      await loadAthletes();
      return true;
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao salvar o atleta.', color: 'red' });
      return false;
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

  return (
    <PageLayout title="Atletas" backRoute="/admin/dashboard">
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
                Módulo de Gestão de Atletas
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Opções de administração para cadastro, importação e gerenciamento de atletas.
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
              <Text fw={800} size="xl" style={{ color: '#1b325f' }}>{athletes.length}</Text>
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
            const isImport = card.label === 'Importar Atletas';
            const isList = card.label === 'Listar Atletas';

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
                  else if (isList) navigate('/admin/atletas/lista');
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

      <AthleteForm opened={formOpened} onClose={closeForm} onSave={handleSave} athlete={null} />
    </PageLayout>
  );
}
