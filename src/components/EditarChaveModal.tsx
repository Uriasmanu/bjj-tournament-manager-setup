import { Modal, Stack, Group, Button, Text, Card, ActionIcon, Select } from '@mantine/core';
import { IconArrowUp, IconArrowDown, IconArrowsShuffle } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import type { Chave } from '../types/bracket';
import type { Arbitro } from '../types/referee';

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

interface EditarChaveModalProps {
  opened: boolean;
  onClose: () => void;
  chave: Chave | null;
  getAtletaNome: (id: string | null) => string;
  arbitros: Arbitro[];
  onSave: (chaveId: string, posicoesAtletas: string[]) => void;
  onTrocarArbitro: (chaveId: string, arbitroId: string | null) => void;
}

export function EditarChaveModal({
  opened,
  onClose,
  chave,
  getAtletaNome,
  arbitros,
  onSave,
  onTrocarArbitro,
}: EditarChaveModalProps) {
  const [posicoes, setPosicoes] = useState<string[]>([]);

  useMemo(() => {
    if (chave) {
      setPosicoes([...chave.posicoesAtletas]);
    }
  }, [chave]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const nova = [...posicoes];
    [nova[index - 1], nova[index]] = [nova[index], nova[index - 1]];
    setPosicoes(nova);
  };

  const handleMoveDown = (index: number) => {
    if (index === posicoes.length - 1) return;
    const nova = [...posicoes];
    [nova[index], nova[index + 1]] = [nova[index + 1], nova[index]];
    setPosicoes(nova);
  };

  const handleShuffle = () => {
    const nova = [...posicoes];
    for (let i = nova.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nova[i], nova[j]] = [nova[j], nova[i]];
    }
    setPosicoes(nova);
  };

  const teamConflicts = useMemo(() => {
    if (!chave || posicoes.length <= 2) return [];
    const n = posicoes.length;
    let sideA: number[], sideB: number[];
    if (n === 3) { sideA = [0]; sideB = [1, 2]; }
    else if (n === 4) { sideA = [0, 3]; sideB = [1, 2]; }
    else { sideA = [0, 3, 4]; sideB = [1, 2]; }

    const conflicts: string[] = [];
    for (const side of [sideA, sideB]) {
      const teams = new Map<string, number>();
      for (const idx of side) {
        const nome = getAtletaNome(posicoes[idx]);
        const parts = nome.split(' ');
        const eq = parts.slice(0, 2).join(' ');
        teams.set(eq, (teams.get(eq) || 0) + 1);
      }
      for (const [team, count] of teams) {
        if (count > 1) {
          conflicts.push(team);
        }
      }
    }
    return conflicts;
  }, [posicoes, chave, getAtletaNome]);

  const handleSave = () => {
    if (!chave) return;
    onSave(chave.id, posicoes);
    onClose();
  };

  const handleArbitroChange = (val: string | null) => {
    if (!chave) return;
    onTrocarArbitro(chave.id, val || null);
  };

  const arbitrosOptions = useMemo(() => {
    return [
      { value: '', label: 'Sem árbitro' },
      ...arbitros.map(r => ({
        value: r.id,
        label: `${r.nome} (${FAIXA_LABEL[r.faixa] || r.faixa})${r.equipe ? ` — ${r.equipe}` : ''}`,
      })),
    ];
  }, [arbitros]);

  if (!chave) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Editar Chave"
      centered
      size="md"
    >
      <Stack gap="md">
        <Select
          label="Árbitro da Chave"
          placeholder="Selecionar árbitro"
          data={arbitrosOptions}
          value={chave.arbitroId || ''}
          onChange={handleArbitroChange}
          clearable
          searchable
        />

        <Text size="sm" c="dimmed">
          Reordene os atletas com as setas ou clique em "Embaralhar" para aleatorizar.
        </Text>

        <Group>
          <Button
            variant="light"
            leftSection={<IconArrowsShuffle size={16} />}
            onClick={handleShuffle}
          >
            Embaralhar
          </Button>
        </Group>

        {posicoes.map((atletaId, index) => (
          <Card key={atletaId} withBorder shadow="xs" padding="sm" radius="md">
            <Group justify="space-between">
              <Group>
                <Text fw={700} size="sm" c="dimmed" w={24}>
                  {index + 1}
                </Text>
                <Text size="sm">{getAtletaNome(atletaId)}</Text>
              </Group>
              <Group gap={4}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  aria-label="Subir"
                >
                  <IconArrowUp size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === posicoes.length - 1}
                  aria-label="Descer"
                >
                  <IconArrowDown size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        ))}

        {teamConflicts.length > 0 && (
          <Text size="sm" c="orange">
            Atenção: atletas da mesma equipe estão no mesmo lado da chave ({teamConflicts.join(', ')}).
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Edição</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
