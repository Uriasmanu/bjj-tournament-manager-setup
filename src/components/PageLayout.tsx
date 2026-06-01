import { Container, Paper, Title, Group, ActionIcon } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  backRoute?: string;
}

export function PageLayout({ title, children, backRoute }: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <Container fluid px="xl" py="xl" style={{ minHeight: '100vh' }}>
      <Paper
        withBorder
        shadow="sm"
        p="clamp(12px, 2vw, 24px)"
        radius="md"
        style={{ minHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}
      >
        <Group mb="md" justify="space-between">
          <Group>
            {backRoute && (
              <ActionIcon variant="subtle" onClick={() => navigate(backRoute)} aria-label="Voltar">
                <IconArrowLeft size={20} />
              </ActionIcon>
            )}
            <Title order={2}>{title}</Title>
          </Group>
        </Group>
        <div style={{ flex: 1 }}>{children}</div>
      </Paper>
    </Container>
  );
}