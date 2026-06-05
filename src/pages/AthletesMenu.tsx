import { Stack } from '@mantine/core';
import { IconPlus, IconList, IconFileUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import type { Atleta } from '../types/athlete';
import { PageLayout } from '../components/PageLayout';
import { MenuCard } from '../components/MenuCard';
import { AthleteForm } from '../components/AthleteForm';

export function AthletesMenu() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const loadAthletes = async () => {
    try {
      const list = await window.electronAPI.loadAthletes();
      setAthletes(list);
    } catch {
      /* silent */
    }
  };

  const handleNew = () => { openForm(); };

  const handleSave = async (athlete: Atleta): Promise<boolean> => {
    const duplicate = athletes.some(
      (a) =>
        a.id !== athlete.id &&
        a.nome.trim().toLowerCase() === athlete.nome.trim().toLowerCase() &&
        a.anoNascimento === athlete.anoNascimento
    );
    if (duplicate) {
      notifications.show({ title: 'Erro', message: 'Já existe um atleta cadastrado com este nome e ano de nascimento.', color: 'red' });
      return false;
    }
    try {
      await window.electronAPI.saveAthlete(athlete);
      notifications.show({ title: 'Sucesso', message: 'Atleta cadastrado com sucesso!', color: 'green' });
      await loadAthletes();
      return true;
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao salvar o atleta.', color: 'red' });
      return false;
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importAthletes();
      if (result.imported === 0 && result.skipped === 0) return;
      const msg = `${result.imported} atleta(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''}.`;
      notifications.show({ title: 'Sucesso', message: msg, color: 'green' });
      await loadAthletes();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar atletas.';
      notifications.show({ title: 'Erro ao importar', message: msg, color: 'red', autoClose: false });
    }
  };

  const cards = [
    { label: 'Cadastrar Atleta', description: 'Cadastrar um novo atleta no sistema', icon: IconPlus, onClick: handleNew },
    { label: 'Listar Atletas', description: 'Visualizar, editar e excluir atletas cadastrados', icon: IconList, onClick: () => navigate('/admin/atletas/lista') },
    { label: 'Importar Atletas', description: 'Importar atletas a partir de arquivo JSON', icon: IconFileUpload, onClick: handleImport },
  ];

  return (
    <PageLayout title="Atletas" backRoute="/admin/dashboard">
      <Stack gap="md" maw={600} mx="auto">
        {cards.map((card) => (
          <MenuCard key={card.label} label={card.label} description={card.description} icon={card.icon} onClick={card.onClick} />
        ))}
      </Stack>
      <AthleteForm opened={formOpened} onClose={closeForm} onSave={handleSave} athlete={null} />
    </PageLayout>
  );
}
