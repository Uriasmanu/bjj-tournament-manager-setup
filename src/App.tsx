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
import { GerenciarChaves } from './pages/GerenciarChaves';
import { AreasMenu } from './pages/AreasMenu';
import { AdminAreas } from './pages/AdminAreas';
import { PlacarMenu } from './pages/PlacarMenu';
import { PlacarChaves } from './pages/PlacarChaves';
import { PlacarBracket } from './pages/PlacarBracket';
import { PlacarLuta } from './pages/PlacarLuta';
import { PlacarLutaCasada } from './pages/PlacarLutaCasada';
import { Resultados } from './pages/Resultados';
import { AdminLutasCasadas } from './pages/AdminLutasCasadas';
import { ActivationScreen } from './components/ActivationScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TournamentModeProvider } from './utils/TournamentModeContext';
import { AreaGuard } from './components/AreaGuard';

function MainApp() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <TournamentModeProvider>
        <Routes>
          <Route path="/" element={<MenuInicial />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/placar" element={<PlacarMenu />} />
          <Route path="/admin/placar/chaves/:areaId" element={<PlacarChaves />} />
          <Route path="/admin/placar/chave/:areaId/:chaveId" element={<PlacarBracket />} />
          <Route path="/admin/placar/luta/:areaId/:chaveId/:lutaId" element={<PlacarLuta />} />
          <Route path="/admin/placar/luta-casada/:areaId/:lutaCasadaId" element={<PlacarLutaCasada />} />
          <Route path="/admin/resultados" element={<Resultados />} />
          <Route path="/admin/criar-torneio" element={<AreaGuard><CriarTorneio /></AreaGuard>} />
          <Route path="/admin/importar-torneio" element={<AreaGuard><ImportarTorneio /></AreaGuard>} />
          <Route path="/admin/listar-torneios" element={<ListarTorneios />} />
          <Route path="/admin/atletas" element={<AreaGuard><AthletesMenu /></AreaGuard>} />
          <Route path="/admin/atletas/lista" element={<AreaGuard><AdminAthletes /></AreaGuard>} />
          <Route path="/admin/arbitros" element={<AreaGuard><ArbitrosMenu /></AreaGuard>} />
          <Route path="/admin/arbitros/lista" element={<AreaGuard><AdminArbitros /></AreaGuard>} />
          <Route path="/admin/equipes" element={<AreaGuard><Equipes /></AreaGuard>} />
          <Route path="/admin/categorias/chaves" element={<AreaGuard><GerenciarChaves /></AreaGuard>} />
          <Route path="/admin/areas" element={<AreaGuard><AreasMenu /></AreaGuard>} />
          <Route path="/admin/areas/lista" element={<AreaGuard><AdminAreas /></AreaGuard>} />
          <Route path="/admin/lutas-casadas" element={<AreaGuard><AdminLutasCasadas /></AreaGuard>} />
        </Routes>
        </TournamentModeProvider>
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
