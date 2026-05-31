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
      <Container size={420}>
        <Paper withBorder shadow="md" p={40} radius="md">
          <Stack align="center" mb={30}>
            <IconShield size={48} color="#1a6ad9" />
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
