import { Container, Paper, Title, Text, PasswordInput, Button, Stack, Alert } from '@mantine/core';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';

interface ActivationScreenProps {
  onActivated: () => void;
}

export function ActivationScreen({ onActivated }: ActivationScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setError('');
    setLoading(true);
    try {
      const valid = await window.activation.validate(password);
      if (valid) {
        const activated = await window.activation.activate();
        if (activated) {
          onActivated();
        } else {
          setError('Erro ao salvar ativação. Tente novamente.');
        }
      } else {
        setError('Senha incorreta. Verifique e tente novamente.');
      }
    } catch {
      setError('Erro ao validar a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <Stack align="center" gap="md">
          <IconLock size={48} color="blue" />
          <Title order={2} ta="center">Ativação do Software</Title>
          <Text ta="center" size="sm" c="dimmed">
            Informe a senha de ativação fornecida pelo desenvolvedor para liberar o acesso.
          </Text>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red" w="100%">
              {error}
            </Alert>
          )}

          <PasswordInput
            label="Senha de Ativação"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleActivate(); }}
            w="100%"
            size="lg"
          />

          <Button
            onClick={handleActivate}
            loading={loading}
            fullWidth
            size="lg"
          >
            Ativar
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
