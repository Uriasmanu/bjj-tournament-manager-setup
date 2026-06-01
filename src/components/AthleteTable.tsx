import { Table, ActionIcon, Group, Badge, Checkbox } from '@mantine/core';
import { IconPencil, IconTrash, IconMars, IconVenus } from '@tabler/icons-react';
import type { Atleta } from '../types/athlete';
import { categoriaLabels } from '../types/category';

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
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function AthleteTable({ athletes, onEdit, onDelete, selectedIds = [], onSelectionChange }: AthleteTableProps) {
  const sortedAthletes = [...athletes].sort((a, b) => a.nome.localeCompare(b.nome));
  const allSelected = athletes.length > 0 && selectedIds.length === athletes.length;

  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter(sid => sid !== id)
      : [...selectedIds, id];
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(athletes.map(a => a.id));
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table horizontalSpacing="clamp(4px, 1.5vw, 12px)">
        <Table.Thead>
          <Table.Tr>
            {onSelectionChange && (
              <Table.Th w={40}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedIds.length > 0 && !allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos"
                />
              </Table.Th>
            )}
            <Table.Th>Nome</Table.Th>
            <Table.Th>Equipe</Table.Th>
            <Table.Th>Gênero</Table.Th>
            <Table.Th>Faixa</Table.Th>
            <Table.Th>Categoria</Table.Th>
            <Table.Th>Idade</Table.Th>
            <Table.Th style={{ width: 100 }}>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedAthletes.map((a) => (
            <Table.Tr key={a.id}>
              {onSelectionChange && (
                <Table.Td>
                  <Checkbox
                    checked={selectedIds.includes(a.id)}
                    onChange={() => toggleSelect(a.id)}
                    aria-label={`Selecionar ${a.nome}`}
                  />
                </Table.Td>
              )}
              <Table.Td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{a.nome}</Table.Td>
              <Table.Td style={{ whiteSpace: 'nowrap' }}>{a.equipe}</Table.Td>
              <Table.Td>
                {a.genero === 'masculino' ? (
                  <IconMars size={18} style={{ display: 'block' }} aria-label="Masculino" />
                ) : (
                  <IconVenus size={18} style={{ display: 'block' }} aria-label="Feminino" />
                )}
              </Table.Td>
              <Table.Td>{faixaLabels[a.faixa] || a.faixa}</Table.Td>
              <Table.Td>
                <Badge variant="light" color="blue" size="sm" style={{ maxWidth: 180 }}>
                  {categoriaLabels[a.categoria] || a.categoria}
                </Badge>
              </Table.Td>
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
