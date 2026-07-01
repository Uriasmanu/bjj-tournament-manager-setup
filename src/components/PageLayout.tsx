import { Container, Paper, ActionIcon, Group, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  title: string;
  children: React.ReactNode;
  backRoute?: string;
  headerExtras?: React.ReactNode;
  fullHeight?: boolean;
}

export function PageLayout({ title, children, backRoute, headerExtras, fullHeight }: PageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div style={{ height: fullHeight ? '100vh' : 'min-content', minHeight: fullHeight ? undefined : '100vh', display: 'flex', flexDirection: 'column', overflow: fullHeight ? 'hidden' : undefined }}>
      <Container fluid px="clamp(8px, 1.5vw, 16px)" py="clamp(4px, 0.8vw, 8px)" style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', overflow: fullHeight ? 'hidden' : undefined }}>
        <Paper
          shadow="sm"
          radius="md"
          p="clamp(8px, 1.2vw, 16px)"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: fullHeight ? 'hidden' : undefined,
            border: '1px solid var(--mantine-color-gray-2)',
          }}
        >
          <Group justify="space-between" align="center" mb="xs" wrap="nowrap" gap="xs">
            <Group gap="xs" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
              {backRoute && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="md"
                  onClick={() => navigate(backRoute)}
                  aria-label="Voltar"
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>
              )}
              <Title order={4} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</Title>
            </Group>
            {headerExtras}
          </Group>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: fullHeight ? 'hidden' : undefined, minHeight: 0 }}>
            {children}
          </div>
        </Paper>
      </Container>
    </div>
  );
}
