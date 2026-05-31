import { Container, Paper, Title, Text, Card, Center, Stack, Group, Badge, ActionIcon, Loader, Grid } from '@mantine/core';
import { IconUsers, IconBuildingSkyscraper, IconCategory, IconClipboardText, IconScale, IconBrackets, IconMapPin, IconUserShield, IconScoreboard, IconTrophy, IconFileReport, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Torneio } from '../types/tournament';

interface DashboardCard {
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: string | number }>;
  route?: string;
  status: 'implemented' | 'planned';
}

const dashboardCards: DashboardCard[] = [
  { label: 'Atletas', description: 'Cadastro e gerenciamento de atletas', icon: IconUsers, route: '/admin/atletas', status: 'implemented' },
  { label: 'Equipes', description: 'Cadastro de equipes / academias', icon: IconBuildingSkyscraper, status: 'planned' },
  { label: 'Categorias', description: 'Configuração de categorias e divisões', icon: IconCategory, status: 'planned' },
  { label: 'Inscrições', description: 'Vincular atletas a categorias', icon: IconClipboardText, status: 'planned' },
  { label: 'Controle de Pesagem', description: 'Registro de peso dos atletas', icon: IconScale, status: 'planned' },
  { label: 'Geração de Chaves', description: 'Criação de chaves por categoria', icon: IconBrackets, status: 'planned' },
  { label: 'Áreas de Luta', description: 'Gerenciamento de áreas de competição', icon: IconMapPin, status: 'planned' },
  { label: 'Árbitros', description: 'Cadastro e escala de árbitros', icon: IconUserShield, status: 'planned' },
  { label: 'Placar / Chamadas', description: 'Acompanhamento de lutas ao vivo', icon: IconScoreboard, status: 'planned' },
  { label: 'Resultados', description: 'Classificação e medalhistas', icon: IconTrophy, status: 'planned' },
  { label: 'Relatórios', description: 'Exportação de relatórios do torneio', icon: IconFileReport, status: 'planned' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [cols, setCols] = useState(4);

  const updateCols = () => {
    const w = window.innerWidth;
    if (w < 700) setCols(1);
    else if (w < 1000) setCols(2);
    else if (w < 1400) setCols(2);
    else if (w < 1800) setCols(3);
    else setCols(4);
  };

  useEffect(() => {
    updateCols();
    const onResize = () => updateCols();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    window.electronAPI.getActiveTournament().then((t) => {
      setTorneio(t);
      setLoading(false);
    });
  }, []);

  const span = Math.floor(12 / cols);

  const formatDate = (isoDate: string) => dayjs(isoDate).format('DD/MM/YYYY');

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Center py="xl">
          <Loader />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group>
          <ActionIcon variant="subtle" onClick={() => navigate('/')} aria-label="Voltar">
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div style={{ flex: 1 }}>
            <Title order={2}>Dashboard</Title>
            {torneio && (
              <Text size="sm" c="dimmed">
                {torneio.nome || `Torneio ${formatDate(torneio.data)}`} — {formatDate(torneio.data)}
              </Text>
            )}
          </div>
          {torneio?.startedAt && (
            <Badge color="green" variant="light">
              Iniciado {formatDate(torneio.startedAt)}
            </Badge>
          )}
        </Group>

        <Paper withBorder shadow="sm" p="clamp(12px, 2vw, 24px)" radius="md">
          <Title order={4} mb="md">Administração do Torneio</Title>
          <Grid>
            {dashboardCards.map((card) => {
              const Icon = card.icon;
              const isImplemented = card.status === 'implemented';
              return (
                <Grid.Col key={card.label} span={span}>
                  <Card
                  withBorder
                  shadow="sm"
                  padding="lg"
                  radius="md"
                  h={140}
                  role="button"
                  tabIndex={isImplemented ? 0 : -1}
                  aria-label={card.label}
                  style={{
                    cursor: isImplemented ? 'pointer' : 'not-allowed',
                    opacity: isImplemented ? 1 : 0.5,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!isImplemented) return;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  onClick={() => {
                    if (isImplemented && card.route) navigate(card.route);
                  }}
                >
                  <Group>
                    <Center>
                      <Icon size={28} />
                    </Center>
                    <div style={{ flex: 1 }}>
                      <Text fw={600} size="lg">{card.label}</Text>
                      <Text size="sm" c="#666">{card.description}</Text>
                    </div>
                    {!isImplemented && (
                      <Badge color="gray" variant="light" size="sm">Em breve</Badge>
                    )}
                  </Group>
                  </Card>
                </Grid.Col>

              );
            })}
            </Grid>
        </Paper>
      </Stack>
    </Container>
  );
}
