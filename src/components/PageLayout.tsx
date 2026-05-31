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
    <Container size="md" py="xl">
      <Paper withBorder shadow="sm" p="clamp(12px, 2vw, 24px)" radius="md">
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
        {children}
      </Paper>
    </Container>
  );
}