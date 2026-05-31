import { Container, Paper, Title, Text, Button, Stack, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import type { Torneio } from '../types/tournament';

export function ImportarTorneio() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Torneio | null>(null);
  const [overwriteData, setOverwriteData] = useState<Torneio | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const resetFile = () => {
    setSelectedFile(null);
    setParsedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      resetFile();
      return;
    }

    if (!file.name.endsWith('.json')) {
      notifications.show({
        title: 'Erro',
        message: 'Selecione um arquivo JSON',
        color: 'red',
      });
      resetFile();
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as Torneio;

      if (!data.id || !data.data || data.nome === undefined) {
        notifications.show({
          title: 'Erro',
          message: 'Arquivo inválido. Estrutura de torneio não reconhecida.',
          color: 'red',
        });
        resetFile();
        return;
      }

      setParsedData(data);
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Arquivo inválido. Selecione um arquivo de torneio válido.',
        color: 'red',
      });
      resetFile();
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    try {
      const result = await window.electronAPI.importTournament(parsedData);

      if (result.exists) {
        setOverwriteData(parsedData);
        open();
        return;
      }

      notifications.show({
        title: 'Sucesso',
        message: 'Torneio importado com sucesso!',
        color: 'green',
      });
      navigate('/admin/listar-torneios');
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao importar o torneio.',
        color: 'red',
      });
    }
  };

  const handleOverwrite = async () => {
    if (!overwriteData) return;

    try {
      await window.electronAPI.importTournamentOverwrite(overwriteData);
      close();
      notifications.show({
        title: 'Sucesso',
        message: 'Torneio importado com sucesso!',
        color: 'green',
      });
      navigate('/admin/listar-torneios');
    } catch {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao importar o torneio.',
        color: 'red',
      });
    }
  };

  return (
    <Container size="clamp(360px, 90vw, 480px)" py="xl">
      <Paper withBorder shadow="sm" p="clamp(16px, 3vw, 24px)" radius="md">
        <Stack align="center" gap="xs" mb="lg">
          <Title order={2}>BJJ TOURNAMENT MANAGER</Title>
          <Text c="#1565C0" fw={500}>Importar Torneio</Text>
        </Stack>

        <Stack gap="md">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />

          <Paper
            withBorder
            p="xl"
            style={{
              borderStyle: 'dashed',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconFileUpload size="1em" color="#1565C0" style={{ display: 'block', margin: '0 auto 8px', fontSize: 'clamp(36px, 6vw, 56px)' }} />
            <Text size="sm" c="dimmed">
              {selectedFile ? selectedFile.name : 'Arraste o arquivo JSON aqui ou clique para selecionar'}
            </Text>
          </Paper>

          {parsedData && (
            <Text size="sm" c="dimmed">
              Torneio: {parsedData.nome || `Torneio ${parsedData.data}`}
            </Text>
          )}

          <Group justify="space-between" mt="md">
            <Button variant="outline" onClick={() => navigate('/')}>
              Voltar
            </Button>
            {parsedData && (
              <Button onClick={handleImport}>
                Importar
              </Button>
            )}
          </Group>
        </Stack>
      </Paper>

      <Modal opened={opened} onClose={close} title="Sobrescrever Torneio" centered size="clamp(320px, 90vw, 480px)">
        <Text size="sm" mb="md">
          Já existe um torneio com este ID. Deseja sobrescrever o arquivo existente?
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleOverwrite}>Sobrescrever</Button>
        </Group>
      </Modal>
    </Container>
  );
}
