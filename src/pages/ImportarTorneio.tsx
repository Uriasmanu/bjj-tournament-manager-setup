import { Title, Text, Button, Stack, Group, Paper } from '@mantine/core';
import { IconFileUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import type { Torneio } from '../types/tournament';
import { PageLayout } from '../components/PageLayout';

type ImportTournamentResult = {
  success: true;
  merged: boolean;
  created: number;
  updated: number;
  kept: number;
  removed: number;
};

export function ImportarTorneio() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Torneio | null>(null);

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
      const result: ImportTournamentResult = await window.electronAPI.importTournament(parsedData);

      if (!result.merged) {
        notifications.show({
          title: 'Sucesso',
          message: 'Torneio importado com sucesso!',
          color: 'green',
        });
      } else {
        notifications.show({
          title: 'Sucesso',
          message: `Torneio mesclado: ${result.created} adicionado(s), ${result.updated} atualizado(s), ${result.kept} mantido(s).`,
          color: 'green',
        });
        if (result.removed > 0) {
          notifications.show({
            title: 'Atenção',
            message: `${result.removed} item(ns) marcados como deletados (delete recente prevaleceu).`,
            color: 'yellow',
          });
        }
      }
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
    <PageLayout title="Importar Torneio" backRoute="/">
      <Stack gap="xs" mb="lg">
        <Title order={2}>BJJ TOURNAMENT MANAGER</Title>
        <Text c="blue" fw={500}>Importar Torneio</Text>
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
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <IconFileUpload size="1em" color="blue" style={{ display: 'block', margin: '0 auto 8px', fontSize: 'clamp(36px, 6vw, 56px)' }} />
          <Text size="sm" c="dimmed">
            {selectedFile ? selectedFile.name : 'Arraste o arquivo JSON aqui ou clique para selecionar'}
          </Text>
        </Paper>

        {parsedData && (
          <Text size="sm" c="dimmed">
            Torneio: {parsedData.nome || `Torneio ${parsedData.data}`}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          {parsedData && (
            <Button onClick={handleImport}>
              Importar
            </Button>
          )}
        </Group>
      </Stack>
    </PageLayout>
  );
}
