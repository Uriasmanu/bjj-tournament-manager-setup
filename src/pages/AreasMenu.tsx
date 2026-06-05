import { Stack } from '@mantine/core';
import { IconPlus, IconList } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import type { AreaLuta } from '../types/area';
import { PageLayout } from '../components/PageLayout';
import { MenuCard } from '../components/MenuCard';
import { AreaForm } from '../components/AreaForm';

export function AreasMenu() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaLuta[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const loadAreas = async () => {
    try { const list = await window.electronAPI.loadAreas(); setAreas(list); } catch { /* silent */ }
  };

  const handleNew = () => { openForm(); };

  const handleSave = async (area: AreaLuta): Promise<boolean> => {
    const duplicate = areas.some((a) => a.id !== area.id && a.nome.trim().toLowerCase() === area.nome.trim().toLowerCase());
    if (duplicate) { notifications.show({ title: 'Erro', message: 'Já existe uma área de luta com este nome.', color: 'red' }); return false; }
    try {
      await window.electronAPI.saveArea({ nome: area.nome, arbitroIds: area.arbitroIds ?? [] });
      notifications.show({ title: 'Sucesso', message: 'Área de luta cadastrada com sucesso!', color: 'green' });
      await loadAreas(); return true;
    } catch (err) { notifications.show({ title: 'Erro', message: err instanceof Error ? err.message : 'Erro ao salvar a área de luta.', color: 'red' }); return false; }
  };

  const cards = [
    { label: 'Cadastrar Área de Luta', description: 'Cadastrar uma nova área de luta no sistema', icon: IconPlus, onClick: handleNew },
    { label: 'Listar Áreas de Luta', description: 'Visualizar, editar e excluir áreas de luta cadastradas', icon: IconList, onClick: () => navigate('/admin/areas/lista') },
  ];

  return (
    <PageLayout title="Áreas de Luta" backRoute="/admin/dashboard">
      <Stack gap="md" maw={600} mx="auto">
        {cards.map((card) => (
          <MenuCard key={card.label} label={card.label} description={card.description} icon={card.icon} onClick={card.onClick} />
        ))}
      </Stack>
      <AreaForm opened={formOpened} onClose={closeForm} onSave={handleSave} area={null} />
    </PageLayout>
  );
}
