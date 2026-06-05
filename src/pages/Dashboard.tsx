import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text, Group, Badge, Center, Loader, Grid, Box, Title,
} from '@mantine/core';
import {
  IconChevronRight, IconArrowLeft, IconCalendar,
  IconChartPie, IconUser, IconUsersGroup,
  IconHierarchy2, IconSquareRounded, IconGavel,
  IconStopwatch, IconMedal, IconTrophyFilled,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Torneio } from '../types/tournament';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  route: string;
  section: 'painel' | 'gestao' | 'combate';
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <IconChartPie size={18} />, route: '/admin/dashboard', section: 'painel' },
  { label: 'Atletas', icon: <IconUser size={18} />, route: '/admin/atletas', section: 'gestao' },
  { label: 'Equipes', icon: <IconUsersGroup size={18} />, route: '/admin/equipes', section: 'gestao' },
  { label: 'Geração de Chaves', icon: <IconHierarchy2 size={18} />, route: '/admin/categorias/chaves', section: 'gestao' },
  { label: 'Áreas de Luta', icon: <IconSquareRounded size={18} />, route: '/admin/areas', section: 'gestao' },
  { label: 'Árbitros', icon: <IconGavel size={18} />, route: '/admin/arbitros', section: 'gestao' },
  { label: 'Placar', icon: <IconStopwatch size={18} />, route: '/admin/placar', section: 'combate' },
  { label: 'Resultados', icon: <IconMedal size={18} />, route: '/admin/resultados', section: 'combate' },
];

interface DashboardCard {
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: string | number; color?: string }>;
  route?: string;
  status: 'implemented' | 'planned';
  iconBg: string;
  iconColor: string;
  footerLabel: string;
  badge?: { label: string; color: string };
}

const dashboardCards: DashboardCard[] = [
  { label: 'Atletas', description: 'Cadastro, regularização médica, pesagem e gerenciamento de atletas.', icon: IconUser, route: '/admin/atletas', status: 'implemented', iconBg: '#3a89c9', iconColor: '#3a89c9', footerLabel: 'Inscritos' },
  { label: 'Equipes', description: 'Resumo, estatísticas, filiações de equipes e academias participantes.', icon: IconUsersGroup, route: '/admin/equipes', status: 'implemented', iconBg: '#3a89c9', iconColor: '#3a89c9', footerLabel: 'Academias' },
  { label: 'Geração de Chaves', description: 'Criação, sorteio e visualização dinâmica de chaves por categoria de peso.', icon: IconHierarchy2, route: '/admin/categorias/chaves', status: 'implemented', iconBg: '#3a89c9', iconColor: '#3a89c9', footerLabel: 'Categorias' },
  { label: 'Áreas de Luta', description: 'Status dos tatames, filas de espera de lutas e andamento em tempo real.', icon: IconSquareRounded, route: '/admin/areas', status: 'implemented', iconBg: '#3a89c9', iconColor: '#3a89c9', footerLabel: 'Áreas Ativas' },
  { label: 'Árbitros', description: 'Cadastro, controle de escala por tatame e histórico de atuações.', icon: IconGavel, route: '/admin/arbitros', status: 'implemented', iconBg: '#3a89c9', iconColor: '#3a89c9', footerLabel: 'Árbitros Escalados' },
  { label: 'Placar', description: 'Acompanhamento de lutas e controle de pontos/penalidades ativo.', icon: IconStopwatch, route: '/admin/placar', status: 'implemented', iconBg: '#f26c4f', iconColor: '#f26c4f', footerLabel: 'Ao Vivo', badge: { label: 'Ao Vivo', color: '#f26c4f' } },
  { label: 'Resultados', description: 'Quadro Geral de Medalhas por equipes, campeões de categorias e distribuição de pódios do torneio em tempo real.', icon: IconMedal, route: '/admin/resultados', status: 'implemented', iconBg: '#f26c4f', iconColor: '#f26c4f', footerLabel: 'Classificação' },
];

function SidebarNav({ activeRoute, onNavigate }: { activeRoute: string; onNavigate: (r: string) => void }) {
  const sectionLabels: Record<string, string> = {
    painel: 'Painel',
    gestao: 'Gestão e Dados',
    combate: 'Combate e Placar',
  };

  return (
    <Box
      style={{
        width: 260,
        minWidth: 260,
        background: '#1b325f',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(156, 196, 228, 0.3)',
        height: '100%',
      }}
      px="md"
      py="lg"
    >
      {/* Logo */}
      <Group gap="sm" mb="xl" px="sm">
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconTrophyFilled size={20} color="#1b325f" />
        </Box>
        <div>
          <Text fw={800} size="lg" style={{ lineHeight: 1.2, color: '#fff', letterSpacing: '0.5px' }}>ARENA</Text>
          <Text size="xs" style={{ color: '#9cc4e4' }} fw={600} tt="uppercase" lts="1px">Championship</Text>
        </div>
      </Group>

      {/* Nav sections */}
      {(Object.keys(sectionLabels) as Array<keyof typeof sectionLabels>).map((sectionKey) => (
        <Box key={sectionKey} mb="md">
          <Text size="xs" fw={600} tt="uppercase" lts="1px" px="sm" mb="xs" style={{ color: '#9cc4e4' }}>
            {sectionLabels[sectionKey]}
          </Text>
          {navItems
            .filter((item) => item.section === sectionKey)
            .map((item) => {
              const isActive = activeRoute === item.route;
              return (
                <Box
                  key={item.route}
                  component="button"
                  onClick={() => onNavigate(item.route)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: 'none',
                    background: isActive ? '#e9f2f9' : 'transparent',
                    color: isActive ? '#1b325f' : 'rgba(255,255,255,0.8)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    borderLeft: isActive ? '4px solid #3a89c9' : '4px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Box style={{ width: 22, textAlign: 'center', color: isActive ? '#3a89c9' : '#9cc4e4' }}>
                    {item.icon}
                  </Box>
                  <span>{item.label}</span>
                </Box>
              );
            })}
        </Box>
      ))}

      {/* Footer */}
      <Box mt="auto" pt="md" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} ta="center">
        <Text size="xs" style={{ color: '#9cc4e4' }}>Torneio ID: #75892</Text>
        <Text size="xs" fw={600} style={{ color: '#f26c4f' }}>Admin Panel v2.2</Text>
      </Box>
    </Box>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [torneio, setTorneio] = useState<Torneio | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cols, setCols] = useState(3);

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

  const formatDate = (isoDate: string) => dayjs(isoDate).format('DD/MM/YYYY');

  const athleteCount = torneio?.atletas?.length ?? 0;
  const teamCount = torneio?.atletas
    ? new Set(torneio.atletas.map((a) => a.equipe).filter(Boolean)).size
    : 0;

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  if (loading) {
    return (
      <Center py="xl" style={{ minHeight: '100vh', background: '#e9f2f9' }}>
        <Loader color="#3a89c9" />
      </Center>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', background: '#e9f2f9', color: '#1b325f' }}>
      {/* Sidebar */}
      <Box
        component="aside"
        visibleFrom="lg"
        style={{ display: 'flex' }}
      >
        <SidebarNav activeRoute="/admin/dashboard" onNavigate={handleNavigate} />
      </Box>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <Box
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <Box
            style={{ width: 260, height: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarNav activeRoute="/admin/dashboard" onNavigate={(r) => { setSidebarOpen(false); navigate(r); }} />
          </Box>
        </Box>
      )}

      {/* Main content */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <Box
          component="header"
          style={{
            background: '#fff',
            borderBottom: '1px solid rgba(156, 196, 228, 0.4)',
            padding: '20px clamp(16px, 3vw, 32px)',
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            {/* Left: title + meta */}
            <div>
              <Group gap="xs" mb={4}>
                <IconArrowLeft
                  size={20}
                  style={{ cursor: 'pointer', color: '#1b325f' }}
                  onClick={() => navigate('/')}
                />
                <Title order={3} style={{ color: '#1b325f', fontWeight: 800 }}>
                  Administração do Torneio
                </Title>
              </Group>
              <Group gap="xs" mt={4}>
                {torneio && (
                  <Group gap={4}>
                    <IconCalendar size={14} color="#3a89c9" />
                    <Text size="sm" style={{ color: 'rgba(27,50,95,0.7)' }}>
                      {torneio.nome || `Torneio ${formatDate(torneio.data)}`} — {formatDate(torneio.data)}
                    </Text>
                  </Group>
                )}
                <Text size="sm" style={{ color: '#9cc4e4' }}>•</Text>
                {torneio?.startedAt && (
                  <Badge
                    variant="light"
                    color="red"
                    size="sm"
                    styles={{ root: { textTransform: 'none' } }}
                    leftSection={
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#f26c4f',
                          animation: 'pulse-dot 1.5s infinite',
                        }}
                      />
                    }
                  >
                    INICIADO EM {formatDate(torneio.startedAt)}
                  </Badge>
                )}
              </Group>
            </div>

            {/* Right: stats */}
            <Group gap="sm" visibleFrom="sm">
              <Box
                style={{
                  background: '#fff',
                  border: '1px solid #9cc4e4',
                  borderRadius: 12,
                  padding: '8px 16px',
                  textAlign: 'right',
                }}
              >
                <Text size="xs" fw={700} tt="uppercase" style={{ color: 'rgba(27,50,95,0.6)', letterSpacing: '0.5px' }}>
                  Atletas
                </Text>
                <Text fw={800} size="xl" style={{ color: '#1b325f' }}>
                  {athleteCount}
                </Text>
              </Box>
              <Box
                style={{
                  background: '#fff',
                  border: '1px solid #9cc4e4',
                  borderRadius: 12,
                  padding: '8px 16px',
                  textAlign: 'right',
                }}
              >
                <Text size="xs" fw={700} tt="uppercase" style={{ color: 'rgba(27,50,95,0.6)', letterSpacing: '0.5px' }}>
                  Equipes
                </Text>
                <Text fw={800} size="xl" style={{ color: '#1b325f' }}>
                  {teamCount}
                </Text>
              </Box>
            </Group>
          </Group>
        </Box>

        {/* Content */}
        <Box
          style={{
            flex: 1,
            padding: 'clamp(16px, 3vw, 32px)',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Hero banner */}
          <Box
            mb="xl"
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #1b325f, #3a89c9, #1b325f)',
              borderRadius: 16,
              padding: 'clamp(20px, 3vw, 32px)',
              overflow: 'hidden',
              color: '#fff',
            }}
          >
            <Box
              style={{
                position: 'absolute',
                right: -80,
                bottom: -80,
                width: 320,
                height: 320,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                filter: 'blur(60px)',
              }}
            />
            <Box style={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
              <Badge
                size="sm"
                style={{
                  background: '#f26c4f',
                  color: '#fff',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  fontSize: 10,
                }}
              >
                Painel Geral
              </Badge>
              <Title order={2} mt="md" style={{ fontWeight: 800, lineHeight: 1.2, color: '#fff' }}>
                Painel de Controle Unificado do Evento
              </Title>
              <Text size="sm" mt="sm" style={{ color: '#e9f2f9', maxWidth: 500 }}>
                Gerencie chaves, cronômetros, árbitros e categorias a partir de um único ambiente centralizado.
              </Text>
            </Box>
          </Box>

          {/* Cards grid */}
          <Grid>
            {dashboardCards.map((card) => {
              const isImplemented = card.status === 'implemented';
              const isResultados = card.label === 'Resultados';
              const isPlacar = card.label === 'Placar';
              const Icon = card.icon;

              return (
                <Grid.Col
                  key={card.label}
                  span={isResultados ? 12 : Math.floor(12 / Math.min(cols, 3))}
                >
                  <Box
                    style={{
                      background: '#fff',
                      border: '1px solid rgba(156, 196, 228, 0.6)',
                      borderRadius: 16,
                      cursor: isImplemented ? 'pointer' : 'not-allowed',
                      opacity: isImplemented ? 1 : 0.5,
                      transition: 'all 0.25s',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      if (!isImplemented) return;
                      e.currentTarget.style.borderColor = '#3a89c9';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(58,137,201,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(156, 196, 228, 0.6)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => {
                      if (isImplemented && card.route) handleNavigate(card.route);
                    }}
                  >
                    {isResultados ? (
                      /* Resultados: horizontal layout */
                      <Box p="lg">
                        <Group align="flex-start" wrap="nowrap" gap="lg">
                          <Box
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              background: 'rgba(242,108,79,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(242,108,79,0.2)',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={22} color="#f26c4f" />
                          </Box>
                          <div style={{ flex: 1 }}>
                            <Text fw={700} size="lg" style={{ color: '#1b325f' }}>{card.label}</Text>
                            <Text size="sm" style={{ color: 'rgba(27,50,95,0.7)', maxWidth: 500 }}>
                              {card.description}
                            </Text>
                          </div>
                          <Box
                            component="span"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#f26c4f',
                              background: 'rgba(242,108,79,0.1)',
                              padding: '10px 20px',
                              borderRadius: 12,
                              border: '1px solid rgba(242,108,79,0.2)',
                              transition: 'transform 0.2s',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
                          >
                            Acessar Classificação
                            <IconChevronRight size={12} />
                          </Box>
                        </Group>
                      </Box>
                    ) : (
                      /* Standard cards */
                      <Box p="lg" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: `${card.iconBg}16`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 20,
                            border: `1px solid ${card.iconBg}30`,
                          }}
                        >
                          <Icon size={22} color={card.iconColor} />
                        </Box>
                        <Group justify="space-between" align="center" mb={4}>
                          <Text fw={700} size="lg" style={{ color: '#1b325f' }}>{card.label}</Text>
                          {isPlacar && card.badge && (
                            <Badge
                              size="sm"
                              styles={{
                                root: {
                                  background: 'rgba(242,108,79,0.1)',
                                  color: '#f26c4f',
                                  border: '1px solid rgba(242,108,79,0.2)',
                                  textTransform: 'none',
                                },
                              }}
                              leftSection={
                                <Box
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: '#f26c4f',
                                    animation: 'pulse-dot 1.5s infinite',
                                  }}
                                />
                              }
                            >
                              {card.badge.label}
                            </Badge>
                          )}
                        </Group>
                        <Text size="sm" style={{ color: 'rgba(27,50,95,0.7)', lineHeight: 1.6, flex: 1 }}>
                          {card.description}
                        </Text>
                        <Box
                          mt="lg"
                          pt="sm"
                          style={{
                            borderTop: '1px solid rgba(156, 196, 228, 0.3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text size="xs" fw={600} style={{ color: 'rgba(27,50,95,0.6)' }}>
                            {card.footerLabel}
                          </Text>
                          <Box
                            component="span"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#3a89c9',
                              background: 'rgba(58,137,201,0.1)',
                              padding: '6px 12px',
                              borderRadius: 8,
                              transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(3px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
                          >
                            Acessar
                            <IconChevronRight size={10} />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid.Col>
              );
            })}
          </Grid>
        </Box>
      </Box>

      {/* Global styles */}
      <style>{`
        @keyframes pulse-dot {
          0% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.6; }
        }
      `}</style>
    </Box>
  );
}
