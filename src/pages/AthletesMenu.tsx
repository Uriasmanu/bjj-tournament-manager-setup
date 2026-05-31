import { Card, Stack, Text, Center, Group } from '@mantine/core';
import { IconPlus, IconList, IconFileUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { PageLayout } from '../components/PageLayout';

export function AthletesMenu() {
  const navigate = useNavigate();

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importAthletes();
      if (result.imported === 0 && result.skipped === 0) return;
      const msg = `${result.imported} atleta(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''}.`;
      notifications.show({ title: 'Sucesso', message: msg, color: 'green' });
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao importar atletas.', color: 'red' });
    }
  };

  const cards = [
    {
      label: 'Cadastrar Atleta',
      description: 'Cadastrar um novo atleta no sistema',
      icon: IconPlus,
      onClick: () => navigate('/admin/atletas/lista'),
    },
    {
      label: 'Listar Atletas',
      description: 'Visualizar, editar e excluir atletas cadastrados',
      icon: IconList,
      onClick: () => navigate('/admin/atletas/lista'),
    },
    {
      label: 'Importar Atletas',
      description: 'Importar atletas a partir de arquivo JSON',
      icon: IconFileUpload,
      onClick: handleImport,
    },
  ];

  return (
    <PageLayout title="Atletas" backRoute="/admin/dashboard">
      <Stack gap="md">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              withBorder
              shadow="sm"
              padding="lg"
              radius="md"
              role="button"
              tabIndex={0}
              aria-label={card.label}
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
              onClick={card.onClick}
            >
              <Group>
                <Center>
                  <Icon size={28} />
                </Center>
                <div style={{ flex: 1 }}>
                  <Text fw={600} size="lg">{card.label}</Text>
                  <Text size="sm" c="#666">{card.description}</Text>
                </div>
              </Group>
            </Card>
          );
        })}
      </Stack>
    </PageLayout>
  );
}
