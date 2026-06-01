import { Card, Text, Group, Badge } from '@mantine/core';
import type { Luta } from '../types/bracket';

interface BracketCardProps {
  luta: Luta;
  atletaANome?: string;
  atletaBNome?: string;
  vencedorNome?: string;
  onClick?: () => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'gray', label: 'Pendente' },
  scheduled: { color: 'blue', label: 'Agendada' },
  in_progress: { color: 'yellow', label: 'Em andamento' },
  completed: { color: 'green', label: 'Finalizada' },
  wo: { color: 'orange', label: 'WO' },
};

export function BracketCard({ luta, atletaANome, atletaBNome, vencedorNome, onClick }: BracketCardProps) {
  const config = statusConfig[luta.status] || statusConfig.pending;

  return (
    <Card
      withBorder
      shadow="sm"
      padding="sm"
      radius="md"
      style={{
        minWidth: 180,
        cursor: luta.status === 'pending' || luta.status === 'scheduled' ? 'pointer' : 'default',
        opacity: luta.status === 'completed' || luta.status === 'wo' ? 0.85 : 1,
        borderLeft: `4px solid ${config.color}`,
      }}
      onClick={onClick}
    >
      <Group justify="space-between" mb={4}>
        <Text size="xs" c="dimmed">Luta {luta.ordem}</Text>
        <Badge color={config.color} size="sm" variant="light">{config.label}</Badge>
      </Group>
      <Text size="sm" fw={500} td={luta.status === 'wo' && luta.vencedorId === luta.atletaAId ? 'line-through' : undefined}>
        {atletaANome || 'Bye'}
      </Text>
      <Text size="xs" c="dimmed" ta="center">vs</Text>
      <Text size="sm" fw={500} td={luta.status === 'wo' && luta.vencedorId === luta.atletaBId ? 'line-through' : undefined}>
        {atletaBNome || 'Bye'}
      </Text>
      {vencedorNome && (
        <Text size="xs" c="green" fw={600} mt={4}>
          Vencedor: {vencedorNome}
        </Text>
      )}
    </Card>
  );
}
