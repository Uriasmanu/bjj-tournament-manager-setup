import { Component } from 'react';
import { Center, Stack, Title, Text, Button } from '@mantine/core';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, error.stack, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center py="xl" style={{ minHeight: '100vh' }}>
          <Stack align="center" gap="md">
            <Title order={3}>Erro inesperado</Title>
            <Text c="dimmed" size="sm">Ocorreu um erro ao carregar a página.</Text>
            <Text c="red" size="xs">{this.state.error?.message}</Text>
            <Text c="dimmed" size="xs" style={{ maxWidth: 600, wordBreak: 'break-all' }}>
              {this.state.error?.stack?.split('\n').slice(0, 4).join('\n')}
            </Text>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Tentar novamente
            </Button>
          </Stack>
        </Center>
      );
    }

    return this.props.children;
  }
}
