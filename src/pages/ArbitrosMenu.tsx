import { Card, Stack, Text, Center, Group } from '@mantine/core';
import { IconPlus, IconList, IconFileUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import type { Arbitro } from '../types/referee';
import { PageLayout } from '../components/PageLayout';
import { ArbitroForm } from '../components/ArbitroForm';

export function ArbitrosMenu() {
  const navigate = useNavigate();
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const loadArbitros = async () => {
    try {
      const list = await window.electronAPI.loadArbitros();
      setArbitros(list);
    } catch {
      /* silent */
    }
  };

  const handleNew = () => {
    openForm();
  };

  const handleSave = async (arbitro: Arbitro): Promise<boolean> => {
    const duplicate = arbitros.some(
      (a) =>
        a.id !== arbitro.id &&
        a.nome.trim().toLowerCase() === arbitro.nome.trim().toLowerCase()
    );
    if (duplicate) {
      notifications.show({
        title: 'Erro',
        message: 'Já existe um árbitro com este nome.',
        color: 'red',
      });
      return false;
    }
    try {
      await window.electronAPI.saveArbitro({
        nome: arbitro.nome,
        equipe: arbitro.equipe,
        faixa: arbitro.faixa,
        chaveIds: arbitro.chaveIds,
      });
      notifications.show({ title: 'Sucesso', message: 'Árbitro cadastrado com sucesso!', color: 'green' });
      await loadArbitros();
      return true;
    } catch {
      notifications.show({ title: 'Erro', message: 'Erro ao salvar o árbitro.', color: 'red' });
      return false;
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.importArbitros();
      if (result.imported === 0 && result.skipped === 0) return;
      const msg = `${result.imported} árbitro(s) importado(s)${result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''}.`;
      notifications.show({ title: 'Sucesso', message: msg, color: 'green' });
      await loadArbitros();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar árbitros.';
      notifications.show({ title: 'Erro ao importar', message: msg, color: 'red', autoClose: false });
    }
  };

  const cards = [
    {
      label: 'Cadastrar Árbitro',
      description: 'Cadastrar um novo árbitro no sistema',
      icon: IconPlus,
      onClick: handleNew,
    },
    {
      label: 'Listar Árbitros',
      description: 'Visualizar, editar e excluir árbitros cadastrados',
      icon: IconList,
      onClick: () => navigate('/admin/arbitros/lista'),
    },
    {
      label: 'Importar Árbitros',
      description: 'Importar árbitros a partir de arquivo JSON',
      icon: IconFileUpload,
      onClick: handleImport,
    },
  ];

  return (
    <PageLayout title="Árbitros" backRoute="/admin/dashboard">
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

      <ArbitroForm
        opened={formOpened}
        onClose={closeForm}
        onSave={handleSave}
        arbitro={null}
      />
    </PageLayout>
  );
}
