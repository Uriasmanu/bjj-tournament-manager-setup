import { Card, Stack, Text, Center, Group } from '@mantine/core';
import { IconPlus, IconList } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import type { AreaLuta } from '../types/area';
import { PageLayout } from '../components/PageLayout';
import { AreaForm } from '../components/AreaForm';

export function AreasMenu() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaLuta[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const loadAreas = async () => {
    try {
      const list = await window.electronAPI.loadAreas();
      setAreas(list);
    } catch {
      /* silent */
    }
  };

  const handleNew = () => {
    openForm();
  };

  const handleSave = async (area: AreaLuta): Promise<boolean> => {
    const duplicate = areas.some(
      (a) =>
        a.id !== area.id &&
        a.nome.trim().toLowerCase() === area.nome.trim().toLowerCase()
    );
    if (duplicate) {
      notifications.show({
        title: 'Erro',
        message: 'Já existe uma área de luta com este nome.',
        color: 'red',
      });
      return false;
    }
    try {
      await window.electronAPI.saveArea({
        nome: area.nome,
        arbitroIds: area.arbitroIds ?? [],
      });
      notifications.show({ title: 'Sucesso', message: 'Área de luta cadastrada com sucesso!', color: 'green' });
      await loadAreas();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar a área de luta.';
      notifications.show({ title: 'Erro', message: msg, color: 'red' });
      return false;
    }
  };

  const cards = [
    {
      label: 'Cadastrar Área de Luta',
      description: 'Cadastrar uma nova área de luta no sistema',
      icon: IconPlus,
      onClick: handleNew,
    },
    {
      label: 'Listar Áreas de Luta',
      description: 'Visualizar, editar e excluir áreas de luta cadastradas',
      icon: IconList,
      onClick: () => navigate('/admin/areas/lista'),
    },
  ];

  return (
    <PageLayout title="Áreas de Luta" backRoute="/admin/dashboard">
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

      <AreaForm
        opened={formOpened}
        onClose={closeForm}
        onSave={handleSave}
        area={null}
      />
    </PageLayout>
  );
}
