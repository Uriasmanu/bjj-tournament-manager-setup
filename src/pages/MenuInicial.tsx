import { Title, Text, Card, Center, Stack, Group } from '@mantine/core';
import { IconPlus, IconFileUpload, IconList } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PageLayout } from '../components/PageLayout';

const menuOptions = [
  {
    label: 'Criar Torneio',
    description: 'Cadastre um novo torneio',
    icon: IconPlus,
    route: '/admin/criar-torneio',
    ariaLabel: 'Criar Torneio',
    key: '1',
  },
  {
    label: 'Importar Torneio',
    description: 'Importe torneio de arquivo JSON',
    icon: IconFileUpload,
    route: '/admin/importar-torneio',
    ariaLabel: 'Importar Torneio',
    key: '2',
  },
  {
    label: 'Listar Torneios',
    description: 'Veja todos os torneios cadastrados',
    icon: IconList,
    route: '/admin/listar-torneios',
    ariaLabel: 'Listar Torneios',
    key: '3',
  },
];

export function MenuInicial() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '1') navigate('/admin/criar-torneio');
      if (e.key === '2') navigate('/admin/importar-torneio');
      if (e.key === '3') navigate('/admin/listar-torneios');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <PageLayout title="BJJ TOURNAMENT MANAGER">
      <Stack align="center" gap="xs" mb="xl">
        <Title order={1} ta="center" style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 700 }}>
          BJJ TOURNAMENT MANAGER
        </Title>
        <Text ta="center" size="lg" c="#1565C0" fw={500}>
          Gerencie seu campeonato
        </Text>
      </Stack>

      <Stack gap="md">
        {menuOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.key}
              withBorder
              shadow="sm"
              padding="lg"
              radius="md"
              role="button"
              tabIndex={0}
              aria-label={option.ariaLabel}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = '';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(option.route);
                }
              }}
              onClick={() => navigate(option.route)}
            >
              <Group>
                <Center style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
                  <Icon size="1em" color="#1565C0" />
                </Center>
                <div>
                  <Text fw={600} size="lg">
                    {option.label}
                  </Text>
                  <Text size="sm" c="#6c757d">
                    {option.description}
                  </Text>
                </div>
              </Group>
            </Card>
          );
        })}
      </Stack>

      <Text ta="center" size="sm" c="dimmed" mt="xl">
        Pressione 1, 2 ou 3 para selecionar
      </Text>
    </PageLayout>
  );
}
