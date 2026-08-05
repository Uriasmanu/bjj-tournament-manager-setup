import {
  Container,
  Paper,
  Text,
  Center,
  Stack,
  Loader,
  Group,
  Button,
  NumberInput,
  ActionIcon,
  Modal,
  Radio,
  Alert,
  Divider,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconReload,
  IconFlag,
  IconAlertTriangle,
  IconArrowBack,
  IconDeviceDesktop,
  IconCamera,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { PageLayout } from '../components/PageLayout';
import { useGestureScoring } from '../hooks/useGestureScoring';
import { showNotification } from '@mantine/notifications';
import type { GestureType } from '../types/gesture';
import type { Chave, Luta, PlacarLuta } from '../types/bracket';
import type { Atleta } from '../types/athlete';
import type { AreaLuta } from '../types/area';
import { sugerirTempoLutaMinutos, TEMPO_LUTA_FALLBACK_MINUTOS } from '../types/fightTime';

function useCtrlZReset(handleZerar: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleZerar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleZerar]);
}

const AZUL_ANIL = '#1e3a8a';
const BRANCO = '#ffffff';

const FAIXA_LABEL: Record<string, string> = {
  branca: 'Branca',
  cinza: 'Cinza',
  amarela: 'Amarela',
  laranja: 'Laranja',
  verde: 'Verde',
  azul: 'Azul',
  roxa: 'Roxa',
  marrom: 'Marrom',
  preta: 'Preta',
};

const TEMPO_DEFAULT_SEGUNDOS = 5 * 60;
const TEMPO_MIN_MINUTOS = 1;
const TEMPO_MAX_MINUTOS = 30;
const MAX_PUNICOES = 4;

const FONT_TOTAL = 'clamp(52px, 4vw, 90px)';
const FONT_COUNTER = 'clamp(28px, 2vw, 48px)';
const FONT_VANT_PUN = 'clamp(20px, 1.8vw, 32px)';
const FONT_NOME = 'clamp(22px, 2vw, 36px)';
const FONT_CRONOMETRO = 'clamp(48px, 4vw, 100px)';

type ResultadoTipo = 'pontos' | 'finalizacao' | 'desclassificacao' | 'desempate';

const placarVazio = (): PlacarLuta => ({
  pontos2: 0,
  pontos3: 0,
  pontos4: 0,
  vantagens: 0,
  punicoes: 0,
  total: 0,
});

function calcularTotal(p: PlacarLuta): number {
  return p.pontos2 * 2 + p.pontos3 * 3 + p.pontos4 * 4;
}

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function AtletaPanel({
  nome,
  equipe,
  faixa,
  placar,
  onChange,
  bloqueado,
  lado,
}: {
  nome: string;
  equipe: string;
  faixa: string;
  placar: PlacarLuta;
  onChange: (p: PlacarLuta) => void;
  bloqueado: boolean;
  lado: 'A' | 'B';
}) {
  const bg = lado === 'A' ? AZUL_ANIL : BRANCO;
  const color = lado === 'A' ? '#fff' : '#212529';
  const subcolor = lado === 'A' ? 'rgba(255,255,255,0.85)' : '#6c757d';
  const borderColor = lado === 'A' ? '#1e3a8a' : '#dee2e6';
  const counterBg = lado === 'A' ? 'rgba(255,255,255,0.2)' : '#e9ecef';
  const counterColor = lado === 'A' ? '#fff' : '#212529';
  const btnBg = lado === 'A' ? 'rgba(255,255,255,0.25)' : '#e9ecef';
  const btnDisabled = lado === 'A' ? 'rgba(255,255,255,0.1)' : '#f1f3f5';

  const update = (patch: Partial<PlacarLuta>) => {
    const novo = { ...placar, ...patch };
    novo.total = calcularTotal(novo);
    onChange(novo);
  };

  const inc = (field: keyof PlacarLuta, delta: number, max?: number) => {
    const atual = placar[field] as number;
    const prox = Math.max(0, max !== undefined ? Math.min(max, atual + delta) : atual + delta);
    update({ [field]: prox } as Partial<PlacarLuta>);
  };

  const PontoBloco = ({ pontos, valor }: { pontos: number; valor: number }) => (
    <Stack gap={2} align="center" style={{ flex: 1 }}>
      <Group gap={4} align="center" justify="center" wrap="nowrap">
        <ActionIcon
          size="md"
          radius="md"
          aria-label={`Remover ${pontos} pontos`}
          disabled={bloqueado || valor === 0}
          onClick={() => inc(`pontos${pontos}` as 'pontos2' | 'pontos3' | 'pontos4', -1)}
          style={{
            backgroundColor: valor > 0 ? btnBg : btnDisabled,
            color: valor > 0 ? color : subcolor,
            width: 36,
            height: 36,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          −
        </ActionIcon>
        <Text fw={900} w={40} ta="center" style={{ fontSize: FONT_COUNTER, lineHeight: 1, color }}>
          {valor}
        </Text>
        <ActionIcon
          size="md"
          radius="md"
          aria-label={`Adicionar ${pontos} pontos`}
          disabled={bloqueado}
          onClick={() => inc(`pontos${pontos}` as 'pontos2' | 'pontos3' | 'pontos4', 1)}
          style={{ backgroundColor: btnBg, color, width: 36, height: 36, fontSize: 18, fontWeight: 700 }}
        >
          +
        </ActionIcon>
      </Group>
      <Text size="xs" c={subcolor} fw={700} tt="uppercase" style={{ letterSpacing: 0.5 }}>
        +{pontos} pts
      </Text>
    </Stack>
  );

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        backgroundColor: bg,
        color,
        borderColor,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Stack gap={6} style={{ flex: 1, minHeight: 0 }}>
        <Stack gap={4}>
          <Text size="sm" c={subcolor} fw={700} tt="uppercase" style={{ letterSpacing: 1.5 }}>
            Atleta {lado}
          </Text>
          <Text fw={900} style={{ fontSize: FONT_NOME, lineHeight: 1.1, color, wordBreak: 'break-word' }}>
            {nome}
          </Text>
          {faixa && (
            <Text size="sm" c={subcolor} fw={600}>
              {FAIXA_LABEL[faixa] ?? faixa}
            </Text>
          )}
          {equipe && (
            <Text size="sm" c={subcolor} tt="capitalize" fw={600}>
              {equipe}
            </Text>
          )}
        </Stack>

        <Center>
          <Stack gap={0} align="center">
            <Text size="sm" c={subcolor} fw={700} tt="uppercase" style={{ letterSpacing: 1.5 }}>
              Total
            </Text>
            <Text fw={900} style={{ fontSize: FONT_TOTAL, lineHeight: 1, color }}>
              {placar.total}
            </Text>
          </Stack>
        </Center>

        <Divider color={lado === 'A' ? 'rgba(255,255,255,0.3)' : '#dee2e6'} />

        <Group gap="xs" align="flex-start" grow wrap="nowrap">
          <PontoBloco pontos={2} valor={placar.pontos2} />
          <PontoBloco pontos={3} valor={placar.pontos3} />
          <PontoBloco pontos={4} valor={placar.pontos4} />
        </Group>

        <Divider color={lado === 'A' ? 'rgba(255,255,255,0.3)' : '#dee2e6'} />

        <Group justify="space-between" align="center" w="100%" gap={6}>
          <Text size="sm" c={color} fw={700}>
            Vantagens
          </Text>
          <Group gap={4}>
            <ActionIcon
              size="md"
              radius="md"
              aria-label="Remover vantagem"
              disabled={bloqueado || placar.vantagens === 0}
              onClick={() => inc('vantagens', -1)}
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 14, fontWeight: 700 }}
            >
              −
            </ActionIcon>
            <Text fw={900} w={28} ta="center" style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color }}>
              {placar.vantagens}
            </Text>
            <ActionIcon
              size="md"
              radius="md"
              aria-label="Adicionar vantagem"
              disabled={bloqueado}
              onClick={() => inc('vantagens', 1)}
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 14, fontWeight: 700 }}
            >
              +
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="space-between" align="center" w="100%" gap={6}>
          <Text size="sm" c={color} fw={700}>
            Punições
          </Text>
          <Group gap={4}>
            <ActionIcon
              size="md"
              radius="md"
              aria-label="Remover punição"
              disabled={bloqueado || placar.punicoes === 0}
              onClick={() => inc('punicoes', -1)}
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 14, fontWeight: 700 }}
            >
              −
            </ActionIcon>
            <Text
              fw={900}
              w={28}
              ta="center"
              style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color: placar.punicoes >= 3 ? '#fa5252' : color }}
            >
              {placar.punicoes}
            </Text>
            <ActionIcon
              size="md"
              radius="md"
              aria-label="Adicionar punição"
              disabled={bloqueado || placar.punicoes >= MAX_PUNICOES}
              onClick={() => inc('punicoes', 1, MAX_PUNICOES)}
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 14, fontWeight: 700 }}
            >
              +
            </ActionIcon>
          </Group>
        </Group>

        {placar.punicoes >= MAX_PUNICOES && (
          <Alert color="red" variant="filled" icon={<IconAlertTriangle size={16} />} p="xs">
            Atleta {lado} Desclassificado
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

export function PlacarLuta() {
  const navigate = useNavigate();
  const { areaId, chaveId, lutaId } = useParams<{ areaId: string; chaveId: string; lutaId: string }>();
  const [chave, setChave] = useState<Chave | null>(null);
  const [luta, setLuta] = useState<Luta | null>(null);
  const [athletes, setAthletes] = useState<Atleta[]>([]);
  const [area, setArea] = useState<AreaLuta | null>(null);
  const [loading, setLoading] = useState(true);

  const [placarA, setPlacarA] = useState<PlacarLuta>(placarVazio());
  const [placarB, setPlacarB] = useState<PlacarLuta>(placarVazio());
  const [tempoInicial, setTempoInicial] = useState<number>(TEMPO_DEFAULT_SEGUNDOS);
  const [tempoRestante, setTempoRestante] = useState<number>(TEMPO_DEFAULT_SEGUNDOS);
  const [tempoSugeridoMinutos, setTempoSugeridoMinutos] = useState<number>(TEMPO_LUTA_FALLBACK_MINUTOS);
  const [rodando, setRodando] = useState(false);

  const [finalizarOpened, { open: openFinalizar, close: closeFinalizar }] = useDisclosure(false);
  const [confirmarResultadoOpened, { open: openConfirmarResultado, close: closeConfirmarResultado }] = useDisclosure(false);
  const [avisoPontosOpened, { open: openAvisoPontos, close: closeAvisoPontos }] = useDisclosure(false);
  const [resultadoTipo, setResultadoTipo] = useState<ResultadoTipo>('pontos');
  const [vencedorFinal, setVencedorFinal] = useState<string | null>(null);
  const [confirmouAvisoPontos, setConfirmouAvisoPontos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const horarioInicioRef = useRef<string | null>(null);
  const [telaoAberto, setTelaoAberto] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false);

  const handleZerarRef = useRef<() => void>(() => {});
  const handleZerar = useCallback(() => {
    setRodando(false);
    setTempoRestante(tempoInicial);
  }, [tempoInicial]);
  handleZerarRef.current = handleZerar;

  useCtrlZReset(() => handleZerarRef.current());

  useEffect(() => {
    if (!chaveId || !lutaId) return;
    Promise.all([
      window.electronAPI.loadChaves(),
      window.electronAPI.loadAthletes(),
      window.electronAPI.loadAreas(),
    ]).then(([chaves, ath, areas]) => {
      const foundChave = (chaves as Chave[]).find(c => c.id === chaveId) ?? null;
      setChave(foundChave);
      const foundLuta = foundChave?.lutas.find(l => l.id === lutaId) ?? null;
      setLuta(foundLuta);
      setAthletes(ath as Atleta[]);
      const foundArea = (areas as AreaLuta[]).find(a => a.id === areaId) ?? null;
      setArea(foundArea);
      if (foundLuta?.placarA) setPlacarA({ ...placarVazio(), ...foundLuta.placarA, total: calcularTotal(foundLuta.placarA) });
      if (foundLuta?.placarB) setPlacarB({ ...placarVazio(), ...foundLuta.placarB, total: calcularTotal(foundLuta.placarB) });
      const atletas = ath as Atleta[];
      const refId = foundLuta?.atletaAId && foundLuta.atletaAId !== 'tbd' && foundLuta.atletaAId !== 'bye'
        ? foundLuta.atletaAId
        : foundLuta?.atletaBId ?? '';
      const refAtleta = atletas.find(a => a.id === refId);
      const minutos = refAtleta
        ? sugerirTempoLutaMinutos(refAtleta)
        : TEMPO_LUTA_FALLBACK_MINUTOS;
      setTempoSugeridoMinutos(minutos);
      const segundos = minutos * 60;
      setTempoInicial(segundos);
      if (foundLuta?.tempoRealSegundos !== undefined && foundLuta.tempoRealSegundos !== null) {
        setTempoRestante(segundos - foundLuta.tempoRealSegundos);
      } else {
        setTempoRestante(segundos);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chaveId, lutaId, areaId]);

  useEffect(() => {
    if (!rodando) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          setRodando(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rodando]);

  const getAtletaInfo = useCallback((id: string): { nome: string; equipe: string; faixa: string } => {
    if (!id || id === 'bye' || id === 'tbd') {
      return { nome: 'A definir', equipe: '', faixa: '' };
    }
    const atleta = athletes.find(a => a.id === id);
    if (!atleta) return { nome: 'Atleta removido', equipe: '', faixa: '' };
    return {
      nome: capitalize(atleta.nome),
      equipe: atleta.equipe ? capitalize(atleta.equipe) : '',
      faixa: atleta.faixa,
    };
  }, [athletes]);

  const atletaAInfo = useMemo(
    () => (luta ? getAtletaInfo(luta.atletaAId) : { nome: '', equipe: '', faixa: '' }),
    [luta, getAtletaInfo]
  );
  const atletaBInfo = useMemo(
    () => (luta ? getAtletaInfo(luta.atletaBId) : { nome: '', equipe: '', faixa: '' }),
    [luta, getAtletaInfo]
  );

  const lutaInvalida = useMemo(() => {
    if (!luta) return true;
    return [luta.atletaAId, luta.atletaBId].some(id => !id || id === 'tbd' || id === 'bye');
  }, [luta]);

  const lutaFinalizada = useMemo(() => {
    if (!luta) return false;
    return luta.status === 'completed' || luta.status === 'wo';
  }, [luta]);

  const bloqueado = lutaInvalida || lutaFinalizada;
  const tempoEsgotado = !rodando && tempoRestante === 0 && tempoInicial > 0;

  const handleGestureScore = useCallback(
    (side: 'A' | 'B', type: GestureType) => {
      if (bloqueado) return;
      const setter = side === 'A' ? setPlacarA : setPlacarB;
      setter((prev) => {
        const novo = { ...prev };
        switch (type) {
          case 'points_2':
            novo.pontos2 += 1;
            break;
          case 'points_3':
            novo.pontos3 += 1;
            break;
          case 'points_4':
            novo.pontos4 += 1;
            break;
          case 'advantage':
            novo.vantagens += 1;
            break;
          case 'penalty':
            novo.punicoes = Math.min(4, novo.punicoes + 1);
            break;
        }
        novo.total = novo.pontos2 * 2 + novo.pontos3 * 3 + novo.pontos4 * 4;
        return novo;
      });
      const labels: Record<string, string> = {
        points_2: '+2',
        points_3: '+3',
        points_4: '+4',
        advantage: 'Vantagem',
        penalty: 'Punição',
      };
      showNotification({
        title: labels[type] ?? type,
        message: `→ Atleta ${side}`,
        color: type === 'penalty' ? 'red' : 'green',
        autoClose: 2500,
      });
    },
    [bloqueado]
  );

  const handleGestureTimer = useCallback(
    (action: 'start' | 'pause') => {
      if (bloqueado) return;
      if (action === 'start') {
        if (!rodando && horarioInicioRef.current === null) {
          horarioInicioRef.current = dayjs().format('DD/MM/YYYY HH:mm:ss');
        }
        setRodando(true);
      } else {
        setRodando(false);
      }
      showNotification({
        title: action === 'start' ? 'Luta Iniciada' : 'Luta Pausada',
        message: 'Cronômetro ajustado por gesto',
        color: 'blue',
        autoClose: 2500,
      });
    },
    [bloqueado, rodando]
  );

  const gesture = useGestureScoring({
    enabled: gestureEnabled,
    dwellTimeMs: 3000,
    onScoreUpdate: handleGestureScore,
    onTimerControl: handleGestureTimer,
  });

  useEffect(() => {
    if (gestureEnabled) {
      gesture.start();
    } else {
      gesture.stop();
    }
  }, [gestureEnabled, gesture.start, gesture.stop]);

  const enviarDadosTelao = useCallback(() => {
    if (!telaoAberto) return;
    const dados = {
      tipo: 'luta' as const,
      nomeA: atletaAInfo.nome,
      nomeB: atletaBInfo.nome,
      equipeA: atletaAInfo.equipe,
      equipeB: atletaBInfo.equipe,
      faixaA: atletaAInfo.faixa,
      faixaB: atletaBInfo.faixa,
      placarA,
      placarB,
      tempoRestante,
      rodando,
      tempoEsgotado,
      bloqueado,
      titulo: area ? `${area.nome} · Luta ${luta?.ordem} · Rodada ${luta?.rodada}` : undefined,
    };
    window.electronAPI.enviarDadosPlacarTelao(dados);
  }, [telaoAberto, atletaAInfo, atletaBInfo, placarA, placarB, tempoRestante, rodando, tempoEsgotado, bloqueado, area, luta]);

  const enviarDadosTelaoImmediate = useCallback(() => {
    const dados = {
      tipo: 'luta' as const,
      nomeA: atletaAInfo.nome,
      nomeB: atletaBInfo.nome,
      equipeA: atletaAInfo.equipe,
      equipeB: atletaBInfo.equipe,
      faixaA: atletaAInfo.faixa,
      faixaB: atletaBInfo.faixa,
      placarA,
      placarB,
      tempoRestante,
      rodando,
      tempoEsgotado,
      bloqueado,
      titulo: area ? `${area.nome} · Luta ${luta?.ordem} · Rodada ${luta?.rodada}` : undefined,
    };
    window.electronAPI.enviarDadosPlacarTelao(dados);
  }, [atletaAInfo, atletaBInfo, placarA, placarB, tempoRestante, rodando, tempoEsgotado, bloqueado, area, luta]);

  useEffect(() => {
    enviarDadosTelao();
  }, [enviarDadosTelao]);

  useEffect(() => {
    window.electronAPI.onTelaoFechado(() => {
      setTelaoAberto(false);
    });
  }, []);

  const handleAbrirTelao = () => {
    window.electronAPI.abrirTelao(`/admin/telao/${lutaId}`);
    setTelaoAberto(true);
    setTimeout(() => enviarDadosTelaoImmediate(), 100);
  };

  const handleFecharTelao = () => {
    window.electronAPI.fecharTelao();
    setTelaoAberto(false);
  };

  const handleIniciarPausar = () => {
    if (bloqueado) return;
    if (!rodando && horarioInicioRef.current === null) {
      horarioInicioRef.current = dayjs().format('DD/MM/YYYY HH:mm:ss');
    }
    setRodando(r => !r);
  };

  const handleTempoInicialChange = (value: number | string) => {
    const minutos = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(minutos) || minutos < TEMPO_MIN_MINUTOS || minutos > TEMPO_MAX_MINUTOS) return;
    const novoSegundos = Math.floor(minutos * 60);
    setTempoInicial(novoSegundos);
    if (!rodando) setTempoRestante(novoSegundos);
  };

  const handleAbrirFinalizar = () => {
    if (bloqueado) return;
    setRodando(false);
    if (placarA.total === placarB.total) {
      setResultadoTipo('desempate');
    } else {
      setResultadoTipo('pontos');
    }
    setVencedorFinal(null);
    setConfirmouAvisoPontos(false);
    openFinalizar();
  };

  const handleConfirmarFinalizar = () => {
    if (!chave || !luta || !vencedorFinal) return;

    if (resultadoTipo === 'pontos' && !confirmouAvisoPontos) {
      const vencedorPlacar = vencedorFinal === luta.atletaAId ? placarA : placarB;
      const perdedorPlacar = vencedorFinal === luta.atletaAId ? placarB : placarA;
      const vencedorValido = vencedorPlacar.total > perdedorPlacar.total ||
        (vencedorPlacar.total === perdedorPlacar.total && vencedorPlacar.vantagens > perdedorPlacar.vantagens);

      if (!vencedorValido) {
        openAvisoPontos();
        return;
      }
    }

    closeFinalizar();
    openConfirmarResultado();
  };

  const handleConfirmarResultado = () => {
    void persistirResultado();
  };

  const handleCancelarResultado = () => {
    closeConfirmarResultado();
    openFinalizar();
  };

  const persistirResultado = async () => {
    if (!chave || !luta || !vencedorFinal) return;
    setSalvando(true);
    try {
      const status = resultadoTipo === 'desclassificacao' ? 'wo' : 'completed';
      const tempoRealSegundos = tempoInicial - tempoRestante;
      const updatedChave = await window.electronAPI.registrarResultado({
        chaveId: chave.id,
        lutaId: luta.id,
        vencedorId: vencedorFinal,
        status,
        placarA: { ...placarA, total: calcularTotal(placarA) },
        placarB: { ...placarB, total: calcularTotal(placarB) },
        finalizacao: resultadoTipo === 'finalizacao',
        desclassificacao: resultadoTipo === 'desclassificacao',
        desempateArbitro: resultadoTipo === 'desempate',
        tempoRealSegundos,
        horarioInicio: horarioInicioRef.current ?? undefined,
        horarioTermino: dayjs().format('DD/MM/YYYY HH:mm:ss'),
      });
      setChave(updatedChave);
      const updatedLuta = updatedChave.lutas.find(l => l.id === luta.id) ?? null;
      setLuta(updatedLuta);
      closeFinalizar();
      closeConfirmarResultado();
      navigate(`/admin/placar/chave/${areaId}/${chaveId}`);
    } catch (err) {
      console.error('Erro ao registrar resultado:', err);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Container fluid px="xl" py="xl" style={{ minHeight: '100vh' }}>
        <Center py="xl" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!luta || !chave) {
    return (
      <PageLayout title="Placar" backRoute="/admin/placar">
        <Text c="dimmed" ta="center" py="xl">Luta não encontrada.</Text>
      </PageLayout>
    );
  }

  const corCronometro = tempoEsgotado ? '#fa5252' : rodando ? '#2e7d32' : '#212529';

  return (
    <PageLayout
      title={area ? `Placar - ${area.nome} · Luta ${luta.ordem} · Rodada ${luta.rodada}` : `Placar · Luta ${luta.ordem} · Rodada ${luta.rodada}`}
      backRoute={`/admin/placar/chave/${areaId}/${chaveId}`}
      fullHeight
    >
      <Stack gap="xs" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {lutaInvalida && (
          <Alert color="yellow" icon={<IconAlertTriangle size={18} />}>
            Luta aguardando definição anterior. Atletas ainda não definidos.
          </Alert>
        )}

        {lutaFinalizada && (
          <Alert color="green" icon={<IconFlag size={18} />}>
            Luta finalizada. Vencedor registrado: {luta.vencedorId === luta.atletaAId ? atletaAInfo.nome : atletaBInfo.nome}
          </Alert>
        )}

        <Paper withBorder p="xs" radius="md" style={{ backgroundColor: '#f8f9fa', flexShrink: 0 }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs" align="center">
              <Button
                leftSection={<IconReload size={16} />}
                variant="default"
                onClick={handleZerarRef.current}
                disabled={bloqueado}
                aria-label="Zerar cronômetro"
                size="sm"
              >
                Zerar
              </Button>
              <Button
                leftSection={rodando ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                color={rodando ? 'orange' : 'green'}
                onClick={handleIniciarPausar}
                disabled={bloqueado || tempoRestante === 0}
                aria-label={rodando ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
                size="sm"
                variant="light"
              >
                {rodando ? 'Pausar' : 'Iniciar'}
              </Button>
            </Group>
            <Group gap="xs" align="center">
              <Text size="xs" c="dimmed" fw={600}>Tempo (min):</Text>
              <NumberInput
                value={tempoInicial / 60}
                onChange={handleTempoInicialChange}
                min={TEMPO_MIN_MINUTOS}
                max={TEMPO_MAX_MINUTOS}
                step={1}
                w={80}
                disabled={bloqueado}
                aria-label="Tempo inicial em minutos"
                size="xs"
              />
              <Badge
                variant="light"
                color="blue"
                size="xs"
                aria-label="Sugestão de tempo de luta pela IBJJF"
              >
                IBJJF · {tempoSugeridoMinutos}min
              </Badge>
            </Group>
          </Group>
        </Paper>

        <Paper
          withBorder
          p="xs"
          radius="md"
          onClick={bloqueado || tempoRestante === 0 ? undefined : handleIniciarPausar}
          style={{
            cursor: bloqueado || tempoRestante === 0 ? 'default' : 'pointer',
            backgroundColor: '#ffffff',
            userSelect: 'none',
            flexShrink: 0,
          }}
          aria-label="Cronômetro central — clique para iniciar/pausar"
        >
          <Center style={{ minHeight: 0 }}>
            <Stack gap={0} align="center">
              {tempoEsgotado ? (
                <Text
                  fw={900}
                  ta="center"
                  style={{
                    fontSize: 'clamp(28px, 4vw, 60px)',
                    lineHeight: 1.1,
                    color: '#fa5252',
                    letterSpacing: 2,
                  }}
                >
                  ⏰ TEMPO ESGOTADO
                </Text>
              ) : (
                <Text
                  fw={900}
                  ta="center"
                  style={{
                    fontSize: FONT_CRONOMETRO,
                    lineHeight: 1,
                    color: corCronometro,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatarTempo(tempoRestante)}
                </Text>
              )}
              {!bloqueado && tempoRestante > 0 && (
                <Text size="xs" c="dimmed" fw={600}>
                  {rodando ? '⏸ clique para pausar' : '▶ clique para iniciar'}
                </Text>
              )}
            </Stack>
          </Center>
        </Paper>

        <Group align="stretch" gap="md" grow wrap="nowrap" style={{ flex: 1, minHeight: 0 }}>
          <AtletaPanel
            lado="B"
            nome={atletaBInfo.nome}
            equipe={atletaBInfo.equipe}
            faixa={atletaBInfo.faixa}
            placar={placarB}
            onChange={setPlacarB}
            bloqueado={bloqueado}
          />
          <AtletaPanel
            lado="A"
            nome={atletaAInfo.nome}
            equipe={atletaAInfo.equipe}
            faixa={atletaAInfo.faixa}
            placar={placarA}
            onChange={setPlacarA}
            bloqueado={bloqueado}
          />
        </Group>

        <Group justify="center" gap="xs" style={{ flexShrink: 0 }}>
          <Button
            size="xs"
            color="blue"
            leftSection={<IconFlag size={14} />}
            onClick={handleAbrirFinalizar}
            disabled={bloqueado}
          >
            Finalizar
          </Button>
          <Button
            size="xs"
            variant="default"
            leftSection={<IconArrowBack size={14} />}
            onClick={() => navigate(`/admin/placar/chave/${areaId}/${chaveId}`)}
          >
            Voltar
          </Button>
          <Button
            size="xs"
            variant={gestureEnabled ? 'filled' : 'light'}
            color={gestureEnabled ? 'green' : 'dark'}
            leftSection={<IconCamera size={14} />}
            onClick={() => setGestureEnabled((g) => !g)}
            disabled={bloqueado}
          >
            {gestureEnabled ? 'Câmera On' : 'Câmera'}
          </Button>
          {telaoAberto ? (
            <Button
              size="xs"
              color="red"
              leftSection={<IconDeviceDesktop size={14} />}
              onClick={handleFecharTelao}
            >
              Telão Off
            </Button>
          ) : (
            <Button
              size="xs"
              variant="light"
              color="dark"
              leftSection={<IconDeviceDesktop size={14} />}
              onClick={handleAbrirTelao}
            >
              Telão
            </Button>
          )}
        </Group>
      </Stack>

      <Modal
        opened={finalizarOpened}
        onClose={closeFinalizar}
        title="Finalizar Luta"
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Placar: {atletaAInfo.nome} <b>{placarA.total}</b> × <b>{placarB.total}</b> {atletaBInfo.nome}
            {placarA.total === placarB.total && (
              <Text component="span" c="orange" fw={600}> · Empate</Text>
            )}
          </Text>

          <Radio.Group
            label="Tipo de resultado"
            value={resultadoTipo}
            onChange={(v) => setResultadoTipo(v as ResultadoTipo)}
          >
            <Stack gap="xs" mt="xs">
              <Radio value="pontos" label="Vitória por pontos" />
              <Radio value="finalizacao" label="Vitória por finalização (submission)" />
              <Radio value="desclassificacao" label="Vitória por desclassificação (DQ)" />
              <Radio value="desempate" label="Decisão dos árbitros (desempate)" />
            </Stack>
          </Radio.Group>

          <Radio.Group
            label="Vencedor"
            value={vencedorFinal}
            onChange={setVencedorFinal}
          >
            <Stack gap="xs" mt="xs">
              <Radio value={luta.atletaAId} label={atletaAInfo.nome} />
              <Radio value={luta.atletaBId} label={atletaBInfo.nome} />
            </Stack>
          </Radio.Group>

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeFinalizar} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              color="blue"
              onClick={handleConfirmarFinalizar}
              loading={salvando}
              disabled={!vencedorFinal}
            >
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={confirmarResultadoOpened}
        onClose={closeConfirmarResultado}
        title="Confirmar resultado"
        size="sm"
        centered
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack gap="md">
          {resultadoTipo === 'desclassificacao' ? (
            <Text ta="center" size="lg" fw={700}>
              Confirmar desclassificação do atleta{' '}
              <Text component="span" c="red" fw={900} tt="uppercase">
                {vencedorFinal === luta.atletaAId ? atletaBInfo.nome : atletaAInfo.nome}
              </Text>
              ?
              <br />
              Vencedor: <b>{vencedorFinal === luta.atletaAId ? atletaAInfo.nome : atletaBInfo.nome}</b>
            </Text>
          ) : resultadoTipo === 'pontos' ? (
            <Text ta="center" size="lg" fw={700}>
              Confirmar vitória por pontos do atleta{' '}
              <Text component="span" c="blue" fw={900} tt="uppercase">
                {vencedorFinal === luta.atletaAId ? atletaAInfo.nome : atletaBInfo.nome}
              </Text>
              ?
            </Text>
          ) : resultadoTipo === 'finalizacao' ? (
            <Text ta="center" size="lg" fw={700}>
              Confirmar vitória por finalização do atleta{' '}
              <Text component="span" c="blue" fw={900} tt="uppercase">
                {vencedorFinal === luta.atletaAId ? atletaAInfo.nome : atletaBInfo.nome}
              </Text>
              ?
            </Text>
          ) : (
            <Text ta="center" size="lg" fw={700}>
              Confirmar decisão dos árbitros a favor do atleta{' '}
              <Text component="span" c="orange" fw={900} tt="uppercase">
                {vencedorFinal === luta.atletaAId ? atletaAInfo.nome : atletaBInfo.nome}
              </Text>
              ?
            </Text>
          )}
          <Group justify="center" gap="sm" mt="sm">
            <Button variant="default" onClick={handleCancelarResultado} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              color={resultadoTipo === 'desclassificacao' ? 'red' : 'blue'}
              onClick={handleConfirmarResultado}
              loading={salvando}
              leftSection={resultadoTipo === 'desclassificacao' ? <IconAlertTriangle size={16} /> : <IconFlag size={16} />}
            >
              {resultadoTipo === 'desclassificacao' ? 'Confirmar desclassificação' : 'Confirmar resultado'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={avisoPontosOpened}
        onClose={closeAvisoPontos}
        title="Atenção"
        size="sm"
        centered
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
      >
        <Stack gap="md">
          <Text ta="center" size="lg" fw={700} c="red">
            O atleta selecionado não está vencendo no placar. Tem certeza que este é o campeão?
          </Text>
          <Text ta="center" size="sm" c="dimmed">
            Placar: {atletaAInfo.nome} {placarA.total} × {placarB.total} {atletaBInfo.nome}
            {placarA.vantagens !== placarB.vantagens && (
              <Text component="span" size="sm" c="dimmed">
                {' · '}Vantagens: {placarA.vantagens} × {placarB.vantagens}
              </Text>
            )}
          </Text>
          <Group justify="center" gap="sm" mt="sm">
            <Button
              variant="default"
              onClick={() => { closeAvisoPontos(); }}
              disabled={salvando}
            >
              Voltar
            </Button>
            <Button
              color="red"
              onClick={() => {
                closeAvisoPontos();
                setConfirmouAvisoPontos(true);
                closeFinalizar();
                openConfirmarResultado();
              }}
              loading={salvando}
              leftSection={<IconAlertTriangle size={16} />}
            >
              Confirmar mesmo assim
            </Button>
          </Group>
        </Stack>
      </Modal>
    </PageLayout>
  );
}
