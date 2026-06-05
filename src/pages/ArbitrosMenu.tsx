import { Stack } from '@mantine/core';
import { IconPlus, IconList, IconFileUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import type { Arbitro } from '../types/referee';
import { PageLayout } from '../components/PageLayout';
import { MenuCard } from '../components/MenuCard';
import { ArbitroForm } from '../components/ArbitroForm';

export function ArbitrosMenu() {
  const navigate = useNavigate();
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const loadArbitros = async () => {
    try { const list = await window.electronAPI.loadArbitros(); setArbitros(list); } catch { /* silent */ }
  };

  const handleNew = () => { openForm(); };

  const handleSave = async (arbitro: Arbitro): Promise<boolean> => {
    const duplicate = arbitros.some((a) => a.id !== arbitro.id && a.nome.trim().toLowerCase() === arbitro.nome.trim().toLowerCase());
    if (duplicate) { notifications.show({ title: 'Erro', message: 'Já existe um árbitro com este nome.', color: 'red' }); return false; }
    try {
      await window.electronAPI.saveArbitro({ nome: arbitro.nome, equipe: arbitro.equipe, faixa: arbitro.faixa, chaveIds: arbitro.chaveIds });
      notifications.show({ title: 'Sucesso', message: 'Árbitro cadastrado com sucesso!', color: 'green' });
      await loadArbitros(); return true;
    } catch { notifications.show({ title: 'Erro', message: 'Erro ao salvar o árbitro.', color: 'red' }); return false; }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importArbitros();
      if (result.imported === 0 && result.skipped === 0) return;
      notifications.show({ title: 'Sucesso', message: `${result.imported} árbitro(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''}.`, color: 'green' });
      await loadArbitros();
    } catch (err) {
      notifications.show({ title: 'Erro ao importar', message: err instanceof Error ? err.message : 'Erro ao importar árbitros.', color: 'red', autoClose: false });
    }
  };

  const cards = [
    { label: 'Cadastrar Árbitro', description: 'Cadastrar um novo árbitro no sistema', icon: IconPlus, onClick: handleNew },
    { label: 'Listar Árbitros', description: 'Visualizar, editar e excluir árbitros cadastrados', icon: IconList, onClick: () => navigate('/admin/arbitros/lista') },
    { label: 'Importar Árbitros', description: 'Importar árbitros a partir de arquivo JSON', icon: IconFileUpload, onClick: handleImport },
  ];

  return (
    <PageLayout title="Árbitros" backRoute="/admin/dashboard">
      <Stack gap="md" maw={600} mx="auto">
        {cards.map((card) => (
          <MenuCard key={card.label} label={card.label} description={card.description} icon={card.icon} onClick={card.onClick} />
        ))}
      </Stack>
      <ArbitroForm opened={formOpened} onClose={closeForm} onSave={handleSave} arbitro={null} />
    </PageLayout>
  );
}
