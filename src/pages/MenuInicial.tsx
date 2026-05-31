import {
  Container,
  Paper,
  Title,
  Text,
  SimpleGrid,
  Card,
  Center,
  Group,
  Badge,
} from '@mantine/core';
import {
  IconUsers,
  IconBuildingCommunity,
  IconTrophy,
  IconCategory,
  IconBrackets,
  IconMapPin,
  IconUsersGroup,
  IconScoreboard,
  IconChartBar,
  IconMedal,
} from '@tabler/icons-react';

const menuItems = [
  { label: 'Atletas', icon: IconUsers, color: 'blue', description: 'Gerenciar atletas' },
  { label: 'Equipes', icon: IconBuildingCommunity, color: 'teal', description: 'Gerenciar equipes' },
  { label: 'Campeonatos', icon: IconTrophy, color: 'yellow', description: 'Gerenciar campeonatos' },
  { label: 'Categorias', icon: IconCategory, color: 'violet', description: 'Gerenciar categorias' },
  { label: 'Chaves', icon: IconBrackets, color: 'orange', description: 'Gerenciar chaves' },
  { label: 'Áreas de Luta', icon: IconMapPin, color: 'red', description: 'Gerenciar áreas' },
  { label: 'Árbitros', icon: IconUsersGroup, color: 'grape', description: 'Gerenciar árbitros' },
  { label: 'Placar', icon: IconScoreboard, color: 'indigo', description: 'Controlar placar' },
  { label: 'Relatórios', icon: IconChartBar, color: 'cyan', description: 'Emitir relatórios' },
  { label: 'Medalhistas', icon: IconMedal, color: 'pink', description: 'Ranking e medalhistas' },
];

export function MenuInicial() {
  return (
    <>
      <Paper
        withBorder
        shadow="sm"
        p="md"
        style={{
          borderBottom: '2px solid var(--mantine-color-blue-6)',
          borderRadius: 0,
        }}
      >
        <Group justify="space-between" align="center">
          <Group>
            <IconTrophy size={32} color="var(--mantine-color-blue-6)" />
            <div>
              <Title order={3}>BJJ Tournament Manager</Title>
              <Text size="sm" c="dimmed">Sistema de Gerenciamento de Campeonatos</Text>
            </div>
          </Group>
          <Badge size="lg" variant="light" color="blue">Online</Badge>
        </Group>
      </Paper>

      <Container size="lg" py="xl">
        <Title order={2} mb="xs">Menu Principal</Title>
        <Text c="dimmed" mb="lg">Selecione uma opção para começar</Text>

        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                withBorder
                shadow="sm"
                padding="lg"
                radius="md"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <Center>
                  <Icon size={40} color={`var(--mantine-color-${item.color}-6)`} />
                </Center>
                <Text ta="center" fw={600} mt="md" size="md">
                  {item.label}
                </Text>
                <Text ta="center" size="xs" c="dimmed" mt={4}>
                  {item.description}
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>
    </>
  );
}
