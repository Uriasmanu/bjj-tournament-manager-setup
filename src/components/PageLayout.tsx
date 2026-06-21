import { Container, Paper, ActionIcon, Group, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  backRoute?: string;
  headerExtras?: React.ReactNode;
}

export function PageLayout({ title, children, backRoute, headerExtras }: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container fluid px="clamp(12px, 2vw, 24px)" py="clamp(12px, 2vw, 24px)" style={{ flex: 1, width: '100%' }}>
        {backRoute && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => navigate(backRoute)}
            aria-label="Voltar"
            mb="xs"
          >
            <IconArrowLeft size={22} />
          </ActionIcon>
        )}
        <Paper
          shadow="sm"
          radius="md"
          p="clamp(16px, 2vw, 28px)"
          style={{
            minHeight: 'calc(100vh - 2 * clamp(12px, 2vw, 24px))',
            border: '1px solid var(--mantine-color-gray-2)',
          }}
        >
          <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="xs">
            <Title order={3}>{title}</Title>
            {headerExtras}
          </Group>
          {children}
        </Paper>
      </Container>
    </div>
  );
}
