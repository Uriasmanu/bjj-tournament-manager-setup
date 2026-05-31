import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, Loader, Center } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { theme } from './styles/theme';
import { MenuInicial } from './pages/MenuInicial';
import { Dashboard } from './pages/Dashboard';
import { CriarTorneio } from './pages/CriarTorneio';
import { ImportarTorneio } from './pages/ImportarTorneio';
import { ListarTorneios } from './pages/ListarTorneios';
import { AdminAthletes } from './pages/AdminAthletes';
import { AthletesMenu } from './pages/AthletesMenu';
import { ActivationScreen } from './components/ActivationScreen';

function MainApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuInicial />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/criar-torneio" element={<CriarTorneio />} />
        <Route path="/admin/importar-torneio" element={<ImportarTorneio />} />
        <Route path="/admin/listar-torneios" element={<ListarTorneios />} />
        <Route path="/admin/atletas" element={<AthletesMenu />} />
        <Route path="/admin/atletas/lista" element={<AdminAthletes />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  const [activated, setActivated] = useState<boolean | null>(null)

  useEffect(() => {
    window.activation.check().then(setActivated)
  }, [])

  if (activated === null) {
    return (
      <MantineProvider theme={theme}>
        <Center py="xl" style={{ minHeight: '100vh' }}>
          <Loader />
        </Center>
      </MantineProvider>
    )
  }

  if (!activated) {
    return (
      <MantineProvider theme={theme}>
        <ActivationScreen onActivated={() => setActivated(true)} />
      </MantineProvider>
    )
  }

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <MainApp />
    </MantineProvider>
  )
}

export default App
