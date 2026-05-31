import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { theme } from './styles/theme';
import { LoginPage } from './pages/Login';

function App() {
  return (
    <MantineProvider theme={theme}>
      <LoginPage />
    </MantineProvider>
  )
}

export default App
