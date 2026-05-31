import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './styles/theme';
import { MenuInicial } from './pages/MenuInicial';
import { CriarTorneio } from './pages/CriarTorneio';
import { ImportarTorneio } from './pages/ImportarTorneio';
import { ListarTorneios } from './pages/ListarTorneios';

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuInicial />} />
          <Route path="/admin/criar-torneio" element={<CriarTorneio />} />
          <Route path="/admin/importar-torneio" element={<ImportarTorneio />} />
          <Route path="/admin/listar-torneios" element={<ListarTorneios />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  )
}

export default App
