import { Text, Stack, Group, Badge, Center } from '@mantine/core';
import { IconPlus, IconFileUpload, IconList } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { MenuCard } from '../components/MenuCard';

const menuOptions = [
  {
    label: 'Criar Novo Torneio',
    description: 'Cadastre um novo campeonato, selecione faixas, categorias de peso e configure os atletas inscritos.',
    icon: IconPlus,
    route: '/admin/criar-torneio',
    ariaLabel: 'Criar Torneio',
    iconBg: 'var(--mantine-color-blue-0)',
    iconColor: 'var(--mantine-color-blue-6)',
    badge: <Badge size="sm" variant="light" color="blue">Novo</Badge>,
  },
  {
    label: 'Importar via JSON',
    description: 'Importe as configurações completas de chaves, inscrições de atletas e categorias usando um arquivo padronizado.',
    icon: IconFileUpload,
    route: '/admin/importar-torneio',
    ariaLabel: 'Importar Torneio',
    iconBg: 'var(--mantine-color-gray-1)',
    iconColor: 'var(--mantine-color-gray-6)',
    badge: null,
  },
  {
    label: 'Central de Torneios',
    description: 'Acesse os torneios ativos, controle resultados das lutas, avance atletas de forma interativa e finalize campeonatos.',
    icon: IconList,
    route: '/admin/listar-torneios',
    ariaLabel: 'Listar Torneios',
    iconBg: 'var(--mantine-color-teal-0)',
    iconColor: 'var(--mantine-color-teal-6)',
    badge: null,
  },
];

export function MenuInicial() {
  const navigate = useNavigate();

  return (
    <PageLayout title="BJJ TOURNAMENT MANAGER">
      <Center mb={48} mt={16}>
        <Stack align="center" gap="md" maw={560}>
          <Badge
            variant="light"
            color="blue"
            size="lg"
            style={{ textTransform: 'none' }}
            leftSection={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            }
          >
            Gestão de Competições
          </Badge>

          <Text
            ta="center"
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 900,
              lineHeight: 1.1,
              background: 'linear-gradient(135deg, #1565C0, #0d47a1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            BJJ TOURNAMENT MANAGER
          </Text>

          <Text ta="center" size="sm" c="dimmed" maw={440}>
            Crie e coordene chaves de lutas dinâmicas, controle categorias de peso de forma automatizada e administre campeonatos profissionais de Jiu-Jitsu.
          </Text>
        </Stack>
      </Center>

      <Group gap="lg" grow align="stretch" maw={900} mx="auto">
        {menuOptions.map((option) => (
          <MenuCard
            key={option.label}
            label={option.label}
            description={option.description}
            icon={option.icon}
            iconBg={option.iconBg}
            iconColor={option.iconColor}
            badge={option.badge}
            ariaLabel={option.ariaLabel}
            onClick={() => navigate(option.route)}
          />
        ))}
      </Group>
    </PageLayout>
  );
}
