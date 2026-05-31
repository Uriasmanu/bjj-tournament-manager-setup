import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Stack,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconShield, IconLock } from '@tabler/icons-react';

export function LoginPage() {
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (value.length === 0 ? 'Informe o e-mail' : null),
      password: (value) => (value.length === 0 ? 'Informe a senha' : null),
    },
  });

  function handleLogin(values: { email: string; password: string }) {
    console.log('Login:', values);
  }

  return (
    <Center style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Container size="clamp(360px, 90vw, 420px)">
        <Paper withBorder shadow="md" p="clamp(24px, 4vw, 40px)" radius="md">
          <Stack align="center" mb="clamp(20px, 3vw, 30px)">
            <IconShield size="1em" color="#1a6ad9" style={{ fontSize: 'clamp(36px, 6vw, 48px)' }} />
            <Title order={2} ta="center">
              BJJ Tournament Manager
            </Title>
            <Text c="dimmed" size="sm">
              Faça login para acessar o sistema
            </Text>
          </Stack>

          <form onSubmit={form.onSubmit(handleLogin)}>
            <Stack>
              <TextInput
                label="E-mail"
                placeholder="seu@email.com"
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                {...form.getInputProps('password')}
              />

              <Button
                fullWidth
                type="submit"
                size="md"
                leftSection={<IconLock size={18} />}
              >
                Entrar
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}
