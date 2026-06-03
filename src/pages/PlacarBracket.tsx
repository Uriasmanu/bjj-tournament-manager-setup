import { Container, Paper, Text, Stack, Loader, Center, Button, Table, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { BracketTree } from '../components/BracketTree';
import { RegistrarResultadoModal } from '../components/RegistrarResultadoModal';
import type { Chave, Luta } from '../types/bracket';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

export function PlacarBracket() {
  const navigate = useNavigate();
  const { areaId, chaveId } = useParams<{ areaId: string; chaveId: string }>();
  const [chave, setChave] = useState<Chave | null>(null);
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [loading, setLoading] = useState(true);

  const [resultModalLuta, setResultModalLuta] = useState<Luta | null>(null);
  const [resultModalInitialVencedor, setResultModalInitialVencedor] = useState<string | null | undefined>(undefined);
  const [resultModalOpened, { open: openResultModal, close: closeResultModal }] = useDisclosure(false);

  useEffect(() => {
    if (!chaveId) return;
    Promise.all([
      window.electronAPI.loadChaves(),
      window.electronAPI.loadAthletes(),
      window.electronAPI.loadArbitros(),
    ]).then(([chaves, ath, arb]) => {
      const found = (chaves as Chave[]).find(c => c.id === chaveId);
      setChave(found ?? null);
      setAthletes(ath as Atleta[]);
      setArbitros(arb as Arbitro[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chaveId]);

  const getAtletaNome = (id: string | null): string => {
    if (!id || id === 'bye') return 'A definir';
    if (id === 'tbd') return 'A definir';
    const atleta = athletes.find(a => a.id === id);
    if (!atleta) return 'Atleta removido';
    const nome = atleta.nome.charAt(0).toUpperCase() + atleta.nome.slice(1);
    const equipe = atleta.equipe ? ` (${atleta.equipe.charAt(0).toUpperCase() + atleta.equipe.slice(1)})` : '';
    return `${nome}${equipe}`;
  };

  const getArbitroNome = (id: string | null): string => {
    if (!id) return 'Sem árbitro';
    const r = arbitros.find(a => a.id === id);
    if (!r) return 'Árbitro removido';
    return `${r.nome} (${FAIXA_LABEL[r.faixa]})`;
  };

  const startableFights = useMemo(() => {
    if (!chave) return [];
    return chave.lutas.filter(l =>
      l.status === 'pending'
      && l.atletaAId !== 'bye' && l.atletaBId !== 'bye'
      && l.atletaAId !== 'tbd' && l.atletaBId !== 'tbd'
    );
  }, [chave]);

  const handleIniciar = (luta: Luta) => {
    navigate(`/admin/placar/luta/${areaId}/${chaveId}/${luta.id}`);
  };

  const handleSelectWinner = (luta: Luta, vencedorId: string) => {
    setResultModalLuta(luta);
    setResultModalInitialVencedor(vencedorId);
    openResultModal();
  };

  const handleConfirmResult = async (vencedorId: string, status: string) => {
    if (!chave || !resultModalLuta) return;

    try {
      const updatedChave = await window.electronAPI.registrarResultado({
        chaveId: chave.id,
        lutaId: resultModalLuta.id,
        vencedorId,
        status,
      });
      setChave(updatedChave);
    } catch (err: unknown) {
      console.error('Erro ao registrar resultado:', err);
    }
  };

  if (loading) {
    return (
      <Container fluid px="xl" py="xl" style={{ minHeight: '100vh' }}>
        <Center py="xl" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!chave) {
    return (
      <PageLayout title="Chave" backRoute="/admin/placar">
        <Text c="dimmed" ta="center" py="xl">Chave não encontrada.</Text>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Lutas da Chave" backRoute={`/admin/placar/chaves/${areaId}`}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Árbitro: {getArbitroNome(chave.arbitroId)} — {chave.totalLutas} luta(s), {chave.totalAtletas} atleta(s)
        </Text>

        <Paper withBorder p="md" radius="md" style={{ overflowX: 'auto', backgroundColor: '#FFF' }}>
          <BracketTree
            chave={chave}
            getAtletaNome={getAtletaNome}
            onSelectWinner={handleSelectWinner}
          />
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Text fw={700} size="sm" mb="sm">Lutas para Iniciar</Text>
          {startableFights.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              Nenhuma luta disponível para iniciar.
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Luta</Table.Th>
                  <Table.Th>Atleta A</Table.Th>
                  <Table.Th>Atleta B</Table.Th>
                  <Table.Th>Ação</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {startableFights.map(luta => (
                  <Table.Tr key={luta.id}>
                    <Table.Td>
                      <Badge size="sm" variant="light" color="gray">
                        #{luta.ordem}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{getAtletaNome(luta.atletaAId)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{getAtletaNome(luta.atletaBId)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        variant="filled"
                        color="green"
                        leftSection={<IconPlayerPlay size={14} />}
                        onClick={() => handleIniciar(luta)}
                      >
                        Iniciar
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>

      <RegistrarResultadoModal
        opened={resultModalOpened}
        onClose={closeResultModal}
        luta={resultModalLuta}
        atletaANome={resultModalLuta ? getAtletaNome(resultModalLuta.atletaAId) : ''}
        atletaBNome={resultModalLuta ? getAtletaNome(resultModalLuta.atletaBId) : ''}
        initialVencedorId={resultModalInitialVencedor}
        onConfirm={handleConfirmResult}
      />
    </PageLayout>
  );
}
