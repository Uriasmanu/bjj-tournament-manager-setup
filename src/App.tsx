import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, Loader, Center } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { theme } from './styles/theme';
import { MenuInicial } from './pages/MenuInicial';
import { Dashboard } from './pages/Dashboard';
import { CriarTorneio } from './pages/CriarTorneio';
import { ImportarTorneio } from './pages/ImportarTorneio';
import { ListarTorneios } from './pages/ListarTorneios';
import { AdminAthletes } from './pages/AdminAthletes';
import { AthletesMenu } from './pages/AthletesMenu';
import { ArbitrosMenu } from './pages/ArbitrosMenu';
import { AdminArbitros } from './pages/AdminArbitros';
import { Equipes } from './pages/Equipes';
import { ActivationScreen } from './components/ActivationScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

function MainApp() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<MenuInicial />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/criar-torneio" element={<CriarTorneio />} />
          <Route path="/admin/importar-torneio" element={<ImportarTorneio />} />
          <Route path="/admin/listar-torneios" element={<ListarTorneios />} />
          <Route path="/admin/atletas" element={<AthletesMenu />} />
          <Route path="/admin/atletas/lista" element={<AdminAthletes />} />
          <Route path="/admin/arbitros" element={<ArbitrosMenu />} />
          <Route path="/admin/arbitros/lista" element={<AdminArbitros />} />
          <Route path="/admin/equipes" element={<Equipes />} />
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  )
}

function App() {
  const [activated, setActivated] = useState<boolean | null>(null)

  useEffect(() => {
    window.activation.check().then(setActivated).catch(() => setActivated(false))
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
