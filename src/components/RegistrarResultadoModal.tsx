import { Modal, Stack, Group, Button, Radio, Text } from '@mantine/core';
import { useState } from 'react';
import type { Luta } from '../types/bracket';

interface RegistrarResultadoModalProps {
  opened: boolean;
  onClose: () => void;
  luta: Luta | null;
  atletaANome: string;
  atletaBNome: string;
  onConfirm: (vencedorId: string, status: string) => void;
}

export function RegistrarResultadoModal({
  opened,
  onClose,
  luta,
  atletaANome,
  atletaBNome,
  onConfirm,
}: RegistrarResultadoModalProps) {
  const [vencedorId, setVencedorId] = useState<string | null>(null);
  const [isWO, setIsWO] = useState(false);

  if (!luta) return null;

  const handleConfirm = () => {
    if (!vencedorId) return;
    onConfirm(vencedorId, isWO ? 'wo' : 'completed');
    setVencedorId(null);
    setIsWO(false);
    onClose();
  };

  const handleClose = () => {
    setVencedorId(null);
    setIsWO(false);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Registrar Resultado - Luta ${luta.ordem}`}
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Selecione o vencedor desta luta:
        </Text>

        {luta.atletaAId && luta.atletaBId ? (
          <>
            <Radio.Group
              value={vencedorId}
              onChange={setVencedorId}
              label="Vencedor"
              withAsterisk
            >
              <Stack gap="xs" mt="xs">
                <Radio value={luta.atletaAId} label={atletaANome} />
                <Radio value={luta.atletaBId} label={atletaBNome} />
              </Stack>
            </Radio.Group>

            <Group>
              <Button
                variant="light"
                color="orange"
                onClick={() => {
                  setIsWO(true);
                  setVencedorId(luta.atletaAId);
                }}
              >
                WO {atletaANome}
              </Button>
              <Button
                variant="light"
                color="orange"
                onClick={() => {
                  setIsWO(true);
                  setVencedorId(luta.atletaBId);
                }}
              >
                WO {atletaBNome}
              </Button>
            </Group>
          </>
        ) : (
          <Text size="sm" c="orange">
            Esta luta aguarda definição de luta(s) anterior(es).
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!vencedorId}>
            Confirmar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
