import {
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
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { PageLayout } from '../components/PageLayout';
import type { PlacarLuta } from '../types/bracket';
import type { LutaCasada, AtletaSnapshot } from '../types/lutaCasada';
import type { Atleta } from '../types/athlete';
import type { AreaLuta } from '../types/area';
import { sugerirTempoLutaMinutos, TEMPO_LUTA_FALLBACK_MINUTOS } from '../types/fightTime';
import { getTipoVitoria } from '../utils/vitoria';

const AZUL_ANIL = '#1e3a8a';
const BRANCO = '#ffffff';

const TEMPO_DEFAULT_SEGUNDOS = 5 * 60;
const TEMPO_MIN_MINUTOS = 1;
const TEMPO_MAX_MINUTOS = 30;
const MAX_PUNICOES = 4;

const FONT_TOTAL = 'clamp(70px, 4vw, 100px)';
const FONT_COUNTER = 'clamp(36px, 2vw, 56px)';
const FONT_VANT_PUN = 'clamp(22px, 2.2vw, 32px)';
const FONT_NOME = 'clamp(28px, 2.3vw, 40px)';
const FONT_CRONOMETRO = 'clamp(96px, 6vw, 220px)';

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

const FAIXA_LABEL: Record<string, string> = {
  'branca': 'Branca', 'cinza': 'Cinza', 'amarela': 'Amarela', 'laranja': 'Laranja',
  'verde': 'Verde', 'azul': 'Azul', 'roxa': 'Roxa', 'marrom': 'Marrom', 'preta': 'Preta',
};

function AtletaPanel({
  snapshot,
  placar,
  onChange,
  bloqueado,
  lado,
}: {
  snapshot: AtletaSnapshot;
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
    <Stack gap={4} align="center" style={{ flex: 1 }}>
      <Group gap={6} align="center" justify="center" wrap="nowrap">
        <ActionIcon
          size="xl"
          radius="md"
          aria-label={`Remover ${pontos} pontos`}
          disabled={bloqueado || valor === 0}
          onClick={() => inc(`pontos${pontos}` as 'pontos2' | 'pontos3' | 'pontos4', -1)}
          style={{
            backgroundColor: valor > 0 ? btnBg : btnDisabled,
            color: valor > 0 ? color : subcolor,
            width: 44,
            height: 44,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          −
        </ActionIcon>
        <Text fw={900} w={48} ta="center" style={{ fontSize: FONT_COUNTER, lineHeight: 1, color }}>
          {valor}
        </Text>
        <ActionIcon
          size="xl"
          radius="md"
          aria-label={`Adicionar ${pontos} pontos`}
          disabled={bloqueado}
          onClick={() => inc(`pontos${pontos}` as 'pontos2' | 'pontos3' | 'pontos4', 1)}
          style={{ backgroundColor: btnBg, color, width: 44, height: 44, fontSize: 22, fontWeight: 700 }}
        >
          +
        </ActionIcon>
      </Group>
      <Text size="sm" c={subcolor} fw={700} tt="uppercase" style={{ letterSpacing: 0.5 }}>
        +{pontos} pts
      </Text>
    </Stack>
  );

  return (
    <Paper
      withBorder
      p="xl"
      radius="md"
      style={{
        backgroundColor: bg,
        color,
        borderColor,
        minHeight: 540,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack gap="lg" style={{ flex: 1 }}>
        <Stack gap={4}>
          <Text size="sm" c={subcolor} fw={700} tt="uppercase" style={{ letterSpacing: 1.5 }}>
            Atleta {lado}
          </Text>
          <Text fw={900} style={{ fontSize: FONT_NOME, lineHeight: 1.1, color, wordBreak: 'break-word' }}>
            {capitalize(snapshot.nome)}
          </Text>
          <Text size="sm" c={subcolor} fw={600}>
            {FAIXA_LABEL[snapshot.faixa] ?? snapshot.faixa} · {snapshot.pesoKg.toFixed(1)}kg
          </Text>
          {snapshot.equipe && (
            <Text size="lg" c={subcolor} tt="capitalize" fw={600}>
              {snapshot.equipe}
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

        <Group gap="md" align="flex-start" grow wrap="nowrap">
          <PontoBloco pontos={2} valor={placar.pontos2} />
          <PontoBloco pontos={3} valor={placar.pontos3} />
          <PontoBloco pontos={4} valor={placar.pontos4} />
        </Group>

        <Divider color={lado === 'A' ? 'rgba(255,255,255,0.3)' : '#dee2e6'} />

        <Group justify="space-between" align="center" w="100%">
          <Text size="md" c={color} fw={700}>
            Vantagens
          </Text>
          <Group gap={6}>
            <ActionIcon
              size="md"
              radius="md"
              aria-label="Remover vantagem"
              disabled={bloqueado || placar.vantagens === 0}
              onClick={() => inc('vantagens', -1)}
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 16, fontWeight: 700 }}
            >
              −
            </ActionIcon>
            <Text fw={900} w={32} ta="center" style={{ fontSize: FONT_VANT_PUN, lineHeight: 1, color }}>
              {placar.vantagens}
            </Text>
            <ActionIcon
              size="md"
              radius="md"
              aria-label="Adicionar vantagem"
              disabled={bloqueado}
              onClick={() => inc('vantagens', 1)}
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 16, fontWeight: 700 }}
            >
              +
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="space-between" align="center" w="100%">
          <Text size="md" c={color} fw={700}>
            Punições
          </Text>
          <Group gap={6}>
            <ActionIcon
              size="md"
              radius="md"
              aria-label="Remover punição"
              disabled={bloqueado || placar.punicoes === 0}
              onClick={() => inc('punicoes', -1)}
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 16, fontWeight: 700 }}
            >
              −
            </ActionIcon>
            <Text
              fw={900}
              w={32} ta="center"
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
              style={{ backgroundColor: counterBg, color: counterColor, width: 32, height: 32, fontSize: 16, fontWeight: 700 }}
            >
              +
            </ActionIcon>
          </Group>
        </Group>

        {placar.punicoes >= MAX_PUNICOES && (
          <Alert color="red" variant="filled" icon={<IconAlertTriangle size={16} />}>
            Atleta {lado} Desclassificado
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

export function PlacarLutaCasada() {
  const navigate = useNavigate();
  const { areaId, lutaCasadaId } = useParams<{ areaId: string; lutaCasadaId: string }>();
  const [luta, setLuta] = useState<LutaCasada | null>(null);
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

  useEffect(() => {
    if (!areaId || !lutaCasadaId) return;
    Promise.all([
      window.electronAPI.loadLutasCasadasPorArea(areaId),
      window.electronAPI.loadAthletes(),
      window.electronAPI.loadAreas(),
    ]).then(([lutas, ath, areas]) => {
      const found = (lutas as LutaCasada[]).find(l => l.id === lutaCasadaId) ?? null;
      setLuta(found);
      const foundArea = (areas as AreaLuta[]).find(a => a.id === areaId) ?? null;
      setArea(foundArea);
      if (found?.placarA) setPlacarA({ ...placarVazio(), ...found.placarA, total: calcularTotal(found.placarA) });
      if (found?.placarB) setPlacarB({ ...placarVazio(), ...found.placarB, total: calcularTotal(found.placarB) });
      const atletas = ath as Atleta[];
      const refA = atletas.find(a => a.id === found?.atletaAId);
      const refB = atletas.find(a => a.id === found?.atletaBId);
      const minutosA = refA ? sugerirTempoLutaMinutos(refA) : 0;
      const minutosB = refB ? sugerirTempoLutaMinutos(refB) : 0;
      const minutos = Math.max(
        refA ? minutosA : 0,
        refB ? minutosB : 0,
        TEMPO_LUTA_FALLBACK_MINUTOS,
      );
      setTempoSugeridoMinutos(minutos);
      const segundos = minutos * 60;
      setTempoInicial(segundos);
      if (found?.tempoRealSegundos !== undefined && found.tempoRealSegundos !== null) {
        setTempoRestante(segundos - found.tempoRealSegundos);
      } else {
        setTempoRestante(segundos);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [areaId, lutaCasadaId]);

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

  const lutaFinalizada = useMemo(() => {
    if (!luta) return false;
    return luta.status === 'completed' || luta.status === 'wo';
  }, [luta]);

  const bloqueado = lutaFinalizada;
  const tempoEsgotado = !rodando && tempoRestante === 0 && tempoInicial > 0;

  const handleIniciarPausar = () => {
    if (bloqueado) return;
    if (!rodando && horarioInicioRef.current === null) {
      horarioInicioRef.current = dayjs().format('DD/MM/YYYY HH:mm:ss');
    }
    setRodando(r => !r);
  };

  const handleZerar = () => {
    setRodando(false);
    setTempoRestante(tempoInicial);
  };

  const handleTempoInicialChange = (value: number | string) => {
    const minutos = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(minutos) || minutos < TEMPO_MIN_MINUTOS || minutos > TEMPO_MAX_MINUTOS) return;
    const novoSegundos = Math.floor(minutos * 60);
    setTempoInicial(novoSegundos);
    if (!rodando) setTempoRestante(novoSegundos);
  };

  const enviarDadosTelao = useCallback(() => {
    if (!telaoAberto || !luta) return;
    const dados = {
      tipo: 'luta-casada' as const,
      nomeA: capitalize(luta.atletaASnapshot.nome),
      nomeB: capitalize(luta.atletaBSnapshot.nome),
      equipeA: luta.atletaASnapshot.equipe,
      equipeB: luta.atletaBSnapshot.equipe,
      faixaA: luta.atletaASnapshot.faixa,
      faixaB: luta.atletaBSnapshot.faixa,
      placarA,
      placarB,
      tempoRestante,
      rodando,
      tempoEsgotado,
      bloqueado,
      titulo: area ? `${area.nome} · Luta Casada` : 'Luta Casada',
    };
    window.electronAPI.enviarDadosPlacarTelao(dados);
  }, [telaoAberto, luta, placarA, placarB, tempoRestante, rodando, tempoEsgotado, bloqueado, area]);

  const enviarDadosTelaoImmediate = useCallback(() => {
    if (!luta) return;
    const dados = {
      tipo: 'luta-casada' as const,
      nomeA: capitalize(luta.atletaASnapshot.nome),
      nomeB: capitalize(luta.atletaBSnapshot.nome),
      equipeA: luta.atletaASnapshot.equipe,
      equipeB: luta.atletaBSnapshot.equipe,
      faixaA: luta.atletaASnapshot.faixa,
      faixaB: luta.atletaBSnapshot.faixa,
      placarA,
      placarB,
      tempoRestante,
      rodando,
      tempoEsgotado,
      bloqueado,
      titulo: area ? `${area.nome} · Luta Casada` : 'Luta Casada',
    };
    window.electronAPI.enviarDadosPlacarTelao(dados);
  }, [luta, placarA, placarB, tempoRestante, rodando, tempoEsgotado, bloqueado, area]);

  useEffect(() => {
    enviarDadosTelao();
  }, [enviarDadosTelao]);

  useEffect(() => {
    window.electronAPI.onTelaoFechado(() => {
      setTelaoAberto(false);
    });
  }, []);

  const handleAbrirTelao = () => {
    window.electronAPI.abrirTelao(`/admin/telao/${lutaCasadaId}`);
    setTelaoAberto(true);
    setTimeout(() => enviarDadosTelaoImmediate(), 100);
  };

  const handleFecharTelao = () => {
    window.electronAPI.fecharTelao();
    setTelaoAberto(false);
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
    if (!luta || !vencedorFinal) return;

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
    if (!luta || !vencedorFinal) return;
    setSalvando(true);
    try {
      const status = resultadoTipo === 'desclassificacao' ? 'wo' : 'completed';
      const tempoRealSegundos = tempoInicial - tempoRestante;
      const atualizada: LutaCasada = {
        ...luta,
        status,
        placarA: { ...placarA, total: calcularTotal(placarA) },
        placarB: { ...placarB, total: calcularTotal(placarB) },
        vencedorId: vencedorFinal,
        finalizacao: resultadoTipo === 'finalizacao',
        desclassificacao: resultadoTipo === 'desclassificacao',
        desempateArbitro: resultadoTipo === 'desempate',
        tempoRealSegundos,
        dataFinalizacao: dayjs().format('DD/MM/YYYY HH:mm:ss'),
        horarioInicio: horarioInicioRef.current ?? luta.horarioInicio,
      };
      const updated = await window.electronAPI.updateLutaCasada(atualizada);
      setLuta(updated);
      closeFinalizar();
      closeConfirmarResultado();
      navigate(`/admin/placar/chaves/${areaId}`);
    } catch (err) {
      console.error('Erro ao registrar resultado da luta casada:', err);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Center py="xl" style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (!luta) {
    return (
      <PageLayout title="Placar · Luta Casada" backRoute={`/admin/placar/chaves/${areaId}`}>
        <Text c="dimmed" ta="center" py="xl">Luta casada não encontrada.</Text>
      </PageLayout>
    );
  }

  const nomeA = capitalize(luta.atletaASnapshot.nome);
  const nomeB = capitalize(luta.atletaBSnapshot.nome);
  const corCronometro = tempoEsgotado ? '#fa5252' : rodando ? '#2e7d32' : '#212529';

  return (
    <PageLayout title={area ? `Placar - ${area.nome} · Luta Casada` : 'Placar · Luta Casada'} backRoute={`/admin/placar/chaves/${areaId}`}>
      <Stack gap="md">
        <Badge color="dark" variant="filled" size="lg" style={{ alignSelf: 'flex-start' }}>LUTA CASADA</Badge>
        {lutaFinalizada && (
          <Alert color="green" icon={<IconFlag size={18} />}>
            Luta casada finalizada. Vencedor registrado: {luta.vencedorId === luta.atletaAId ? nomeA : nomeB} ({getTipoVitoria(luta).label})
          </Alert>
        )}

        <Paper withBorder p="sm" radius="md" style={{ backgroundColor: '#f8f9fa' }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="md" align="center">
              <Button
                leftSection={rodando ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
                color={rodando ? 'orange' : 'green'}
                onClick={handleIniciarPausar}
                disabled={bloqueado || tempoRestante === 0}
                aria-label={rodando ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
                size="md"
              >
                {rodando ? 'Pausar' : 'Iniciar'}
              </Button>
              <Button
                leftSection={<IconReload size={18} />}
                variant="default"
                onClick={handleZerar}
                disabled={bloqueado}
                aria-label="Zerar cronômetro"
                size="md"
              >
                Zerar
              </Button>
            </Group>
            <Group gap="xs" align="center">
              <Text size="sm" c="dimmed" fw={600}>Tempo inicial (min):</Text>
              <NumberInput
                value={tempoInicial / 60}
                onChange={handleTempoInicialChange}
                min={TEMPO_MIN_MINUTOS}
                max={TEMPO_MAX_MINUTOS}
                step={1}
                w={100}
                disabled={bloqueado}
                aria-label="Tempo inicial em minutos"
                size="md"
              />
              <Badge
                variant="light"
                color="blue"
                size="sm"
                aria-label="Sugestão de tempo de luta pela IBJJF"
              >
                Sugestão IBJJF · {tempoSugeridoMinutos} min
              </Badge>
            </Group>
          </Group>
        </Paper>

        <Paper
          withBorder
          p="md"
          radius="md"
          onClick={bloqueado || tempoRestante === 0 ? undefined : handleIniciarPausar}
          style={{
            cursor: bloqueado || tempoRestante === 0 ? 'default' : 'pointer',
            backgroundColor: '#ffffff',
            userSelect: 'none',
          }}
          aria-label="Cronômetro central — clique para iniciar/pausar"
        >
          <Center style={{ minHeight: 140 }}>
            <Stack gap="xs" align="center">
              {tempoEsgotado ? (
                <Text
                  fw={900}
                  ta="center"
                  style={{
                    fontSize: 'clamp(40px, 6vw, 80px)',
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
                <Text size="md" c="dimmed" fw={600}>
                  {rodando ? '⏸ clique para pausar' : '▶ clique para iniciar'}
                </Text>
              )}
            </Stack>
          </Center>
        </Paper>

        <Group align="stretch" gap="md" grow wrap="nowrap">
          <AtletaPanel
            lado="B"
            snapshot={luta.atletaBSnapshot}
            placar={placarB}
            onChange={setPlacarB}
            bloqueado={bloqueado}
          />
          <AtletaPanel
            lado="A"
            snapshot={luta.atletaASnapshot}
            placar={placarA}
            onChange={setPlacarA}
            bloqueado={bloqueado}
          />
        </Group>

        <Group justify="center" gap="md">
          <Button
            size="lg"
            color="dark"
            leftSection={<IconFlag size={18} />}
            onClick={handleAbrirFinalizar}
            disabled={bloqueado}
          >
            Finalizar Luta
          </Button>
          <Button
            size="lg"
            variant="default"
            leftSection={<IconArrowBack size={18} />}
            onClick={() => navigate(`/admin/placar/chaves/${areaId}`)}
          >
            Voltar sem finalizar
          </Button>
          {telaoAberto ? (
            <Button
              size="lg"
              color="red"
              leftSection={<IconDeviceDesktop size={18} />}
              onClick={handleFecharTelao}
            >
              Fechar Telão
            </Button>
          ) : (
            <Button
              size="lg"
              variant="light"
              color="dark"
              leftSection={<IconDeviceDesktop size={18} />}
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
        title="Finalizar Luta Casada"
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Placar: {nomeA} <b>{placarA.total}</b> × <b>{placarB.total}</b> {nomeB}
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
              <Radio value={luta.atletaAId} label={nomeA} />
              <Radio value={luta.atletaBId} label={nomeB} />
            </Stack>
          </Radio.Group>

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeFinalizar} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              color="dark"
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
                {vencedorFinal === luta.atletaAId ? nomeB : nomeA}
              </Text>
              ?
              <br />
              Vencedor: <b>{vencedorFinal === luta.atletaAId ? nomeA : nomeB}</b>
            </Text>
          ) : resultadoTipo === 'pontos' ? (
            <Text ta="center" size="lg" fw={700}>
              Confirmar vitória por pontos do atleta{' '}
              <Text component="span" c="dark" fw={900} tt="uppercase">
                {vencedorFinal === luta.atletaAId ? nomeA : nomeB}
              </Text>
              ?
            </Text>
          ) : resultadoTipo === 'finalizacao' ? (
            <Text ta="center" size="lg" fw={700}>
              Confirmar vitória por finalização do atleta{' '}
              <Text component="span" c="dark" fw={900} tt="uppercase">
                {vencedorFinal === luta.atletaAId ? nomeA : nomeB}
              </Text>
              ?
            </Text>
          ) : (
            <Text ta="center" size="lg" fw={700}>
              Confirmar decisão dos árbitros a favor do atleta{' '}
              <Text component="span" c="orange" fw={900} tt="uppercase">
                {vencedorFinal === luta.atletaAId ? nomeA : nomeB}
              </Text>
              ?
            </Text>
          )}
          <Group justify="center" gap="sm" mt="sm">
            <Button variant="default" onClick={handleCancelarResultado} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              color={resultadoTipo === 'desclassificacao' ? 'red' : 'dark'}
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
            Placar: {nomeA} {placarA.total} × {placarB.total} {nomeB}
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
