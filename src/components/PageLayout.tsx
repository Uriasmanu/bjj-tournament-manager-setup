import { Container, Paper, Group, ActionIcon, Text } from '@mantine/core';
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
      <header
        style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0d47a1 100%)',
          padding: '0 clamp(16px, 3vw, 32px)',
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <Group justify="space-between" w="100%">
          <Group gap="sm">
            {backRoute && (
              <ActionIcon
                variant="subtle"
                color="white"
                size="lg"
                onClick={() => navigate(backRoute)}
                aria-label="Voltar"
              >
                <IconArrowLeft size={22} />
              </ActionIcon>
            )}
            <Text c="white" fw={700} size="lg" style={{ letterSpacing: '0.5px' }}>
              {title}
            </Text>
          </Group>
          {headerExtras && (
            <Group gap="xs">
              {headerExtras}
            </Group>
          )}
        </Group>
      </header>

      <Container fluid px="clamp(12px, 2vw, 24px)" py="clamp(12px, 2vw, 24px)" style={{ flex: 1, width: '100%' }}>
        <Paper
          shadow="sm"
          radius="md"
          p="clamp(16px, 2vw, 28px)"
          style={{
            minHeight: 'calc(100vh - var(--header-height) - 2 * clamp(12px, 2vw, 24px))',
            border: '1px solid var(--mantine-color-gray-2)',
          }}
        >
          {children}
        </Paper>
      </Container>
    </div>
  );
}
