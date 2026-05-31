import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { theme } from './styles/theme';
import { MenuInicial } from './pages/MenuInicial';

function App() {
  return (
    <MantineProvider theme={theme}>
      <MenuInicial />
    </MantineProvider>
  )
}

export default App
