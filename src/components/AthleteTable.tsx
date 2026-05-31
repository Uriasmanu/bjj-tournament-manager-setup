import { Table, ActionIcon, Group } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { Atleta } from '../types/athlete';

const faixaLabels: Record<string, string> = {
  branca: 'Branca',
  cinza: 'Cinza',
  amarela: 'Amarela',
  laranja: 'Laranja',
  verde: 'Verde',
  azul: 'Azul',
  roxa: 'Roxa',
  marrom: 'Marrom',
  preta: 'Preta',
};

function calcularIdade(anoNascimento: number): number {
  return new Date().getFullYear() - anoNascimento;
}

interface AthleteTableProps {
  athletes: Atleta[];
  onEdit: (athlete: Atleta) => void;
  onDelete: (athlete: Atleta) => void;
}

export function AthleteTable({ athletes, onEdit, onDelete }: AthleteTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table horizontalSpacing="clamp(4px, 1.5vw, 12px)">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Equipe</Table.Th>
            <Table.Th>Faixa</Table.Th>
            <Table.Th>Idade</Table.Th>
            <Table.Th style={{ width: 100 }}>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {athletes.map((a) => (
            <Table.Tr key={a.id}>
              <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{a.nome}</Table.Td>
              <Table.Td style={{ whiteSpace: 'nowrap' }}>{a.equipe}</Table.Td>
              <Table.Td>{faixaLabels[a.faixa] || a.faixa}</Table.Td>
              <Table.Td>{calcularIdade(a.anoNascimento)}</Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <ActionIcon
                    variant="light"
                    color="yellow"
                    onClick={() => onEdit(a)}
                    aria-label={`Editar ${a.nome}`}
                  >
                    <IconPencil size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => onDelete(a)}
                    aria-label={`Excluir ${a.nome}`}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
