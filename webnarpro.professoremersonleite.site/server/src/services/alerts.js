// Motor de alertas do sistema (Fase 3 do PLANO_OTIMIZACAO_ESCALA.md). A cada minuto junta:
//  - metricas de infra gravadas pelo coletor root (scripts/infra-collector.sh -> runtime/infra-metrics.json)
//  - metricas do proprio Node (services/metrics.js)
//  - metricas de negocio (alunos ao vivo) e das filas do Sino
// avalia as regras verde/amarelo/vermelho com histerese (2 coletas pra subir, 3 pra descer),
// grava snapshot + eventos e notifica so quando o estado geral muda.
// Tambem decide o "modo do chat" (normal / economico / retido) que o canal do Sino respeita:
// o chat e secundario e e o primeiro a ser segurado quando o sistema pesa.
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const metrics = require('./metrics');

const INFRA_FILE = process.env.INFRA_METRICS_FILE
  || path.join(__dirname, '..', '..', 'runtime', 'infra-metrics.json');
const INTERVAL_MS = 60 * 1000;
const UP_AFTER = 2;
const DOWN_AFTER = 3;

// direcao: 'acima' = alerta quando valor > limite; 'abaixo' = quando valor < limite
const DEFAULT_RULES = [
  // teste de carga de 22/10: 3.000 alunos sincronizados com p95 de 46ms (Node+MySQL) e Apache sem
  // falhas ate 1.500 conexoes - 3.000 e o maximo ja testado, por isso vira o vermelho
  { metrica: 'alunos_ao_vivo', grupo: 'Negócio', label: 'Alunos ao vivo agora', unidade: '', amarelo: 2000, vermelho: 3000 },

  { metrica: 'apache_conexoes_443', grupo: 'Apache', label: 'Conexões abertas na 443', unidade: '', amarelo: 600, vermelho: 850 },
  { metrica: 'apache_workers_ocupados', grupo: 'Apache', label: 'Workers ocupados', unidade: '', amarelo: 200, vermelho: 300 },
  { metrica: 'apache_processos_sem_aceitar_pct', grupo: 'Apache', label: 'Processos sem aceitar conexão', unidade: '%', amarelo: 30, vermelho: 60 },
  { metrica: 'apache_fila_443', grupo: 'Apache', label: 'Fila de espera na 443', unidade: '', amarelo: 10, vermelho: 50 },
  { metrica: 'apache_descartadas_min', grupo: 'Apache', label: 'Conexões descartadas pelo kernel', unidade: '/min', amarelo: 0, vermelho: 50 },
  { metrica: 'latencia_publica_ms', grupo: 'Apache', label: 'Tempo de resposta (caminho público)', unidade: 'ms', amarelo: 1000, vermelho: 3000 },

  { metrica: 'node_event_loop_p99_ms', grupo: 'Node', label: 'Atraso do event loop (p99)', unidade: 'ms', amarelo: 100, vermelho: 500 },
  { metrica: 'node_event_loop_util_pct', grupo: 'Node', label: 'Uso do event loop', unidade: '%', amarelo: 70, vermelho: 90 },
  { metrica: 'node_api_p95_ms', grupo: 'Node', label: 'Latência da API (p95)', unidade: 'ms', amarelo: 300, vermelho: 1000 },
  { metrica: 'node_em_andamento', grupo: 'Node', label: 'Requisições em andamento (pico)', unidade: '', amarelo: 100, vermelho: 300 },
  { metrica: 'node_erro_5xx_pct', grupo: 'Node', label: 'Taxa de erros 5xx', unidade: '%', amarelo: 1, vermelho: 5 },
  { metrica: 'node_heap_pct', grupo: 'Node', label: 'Memória (heap)', unidade: '%', amarelo: 70, vermelho: 85 },
  { metrica: 'node_pool_em_uso', grupo: 'Node', label: 'Pool MySQL: conexões em uso', unidade: '', amarelo: 35, vermelho: 45 },
  { metrica: 'node_pool_fila', grupo: 'Node', label: 'Pool MySQL: esperando conexão', unidade: '', amarelo: 0, vermelho: 10 },
  { metrica: 'node_db_probe_ms', grupo: 'Node', label: 'Tempo de uma consulta simples', unidade: 'ms', amarelo: 50, vermelho: 500 },
  { metrica: 'node_reinicio_recente', grupo: 'Node', label: 'App reiniciado nos últimos 5 min', unidade: '', amarelo: 0, vermelho: null },
  { metrica: 'sino_fila_eventos', grupo: 'Node', label: 'Fila de eventos pro Sino', unidade: '', amarelo: 100, vermelho: 1000 },

  { metrica: 'sino_fila_chat', grupo: 'Sino', label: 'Fila do chat pro Sino', unidade: '', amarelo: 50, vermelho: 200 },
  { metrica: 'sino_tempo_resposta_ms', grupo: 'Sino', label: 'Tempo de resposta do Sino', unidade: 'ms', amarelo: 5000, vermelho: 15000 },
  { metrica: 'sino_disjuntor_aberto', grupo: 'Sino', label: 'Disjuntor do Sino aberto', unidade: '', amarelo: null, vermelho: 0 },

  { metrica: 'mysql_conexoes', grupo: 'MySQL', label: 'Conexões totais', unidade: '', amarelo: 105, vermelho: 128 },
  { metrica: 'mysql_conexoes_webnarpro', grupo: 'MySQL', label: 'Conexões do WebnarPRO (de 60)', unidade: '', amarelo: 40, vermelho: 52 },
  { metrica: 'mysql_conexoes_e4pay', grupo: 'MySQL', label: 'Conexões do E4Pay (de 25)', unidade: '', amarelo: 15, vermelho: 21 },
  { metrica: 'mysql_threads_rodando', grupo: 'MySQL', label: 'Consultas executando agora', unidade: '', amarelo: 8, vermelho: 16 },
  { metrica: 'mysql_slow_queries_min', grupo: 'MySQL', label: 'Consultas lentas', unidade: '/min', amarelo: 5, vermelho: 20 },
  { metrica: 'mysql_lock_waits', grupo: 'MySQL', label: 'Esperas por lock', unidade: '', amarelo: 0, vermelho: 5 },
  { metrica: 'mysql_buffer_pool_hit_pct', grupo: 'MySQL', label: 'Acerto do buffer pool', unidade: '%', amarelo: 99, vermelho: 95, direcao: 'abaixo' },
  { metrica: 'mysql_aborted_connects_min', grupo: 'MySQL', label: 'Conexões abortadas', unidade: '/min', amarelo: 10, vermelho: 50 },

  { metrica: 'ram_disponivel_mb', grupo: 'Servidor', label: 'RAM disponível', unidade: 'MB', amarelo: 1500, vermelho: 800, direcao: 'abaixo' },
  { metrica: 'swap_crescimento_10min_mb', grupo: 'Servidor', label: 'Swap: crescimento em 10 min', unidade: 'MB', amarelo: 200, vermelho: 500 },
  { metrica: 'cpu_load1', grupo: 'Servidor', label: 'Carga de CPU (4 núcleos)', unidade: '', amarelo: 3, vermelho: 5 },
  { metrica: 'disco_pct', grupo: 'Servidor', label: 'Disco /', unidade: '%', amarelo: 80, vermelho: 90 },
  { metrica: 'coletor_atrasado_min', grupo: 'Servidor', label: 'Coletor de infra sem atualizar', unidade: 'min', amarelo: 3, vermelho: 10 },
];
const RULES_BY_KEY = Object.fromEntries(DEFAULT_RULES.map((r) => [r.metrica, r]));
// Metricas que nao devem segurar o chat: nao indicam sobrecarga do servidor. Os problemas do
// proprio Sino ja sao tratados pelo disjuntor do canal (services/sino-channel.js) - se entrassem
// aqui, o chat ficaria retido minutos depois do Sino ja ter voltado.
const NOT_LOAD_METRICS = new Set([
  'disco_pct', 'node_reinicio_recente', 'coletor_atrasado_min',
  'sino_fila_chat', 'sino_tempo_resposta_ms', 'sino_disjuntor_aberto', 'sino_fila_eventos',
]);
const LEVEL_ORDER = { verde: 0, amarelo: 1, vermelho: 2 };

const state = {
  metricState: {},        // metrica -> { nivel, subindo, descendo, nivelPendente }
  prevTotals: null,       // contadores acumulados da coleta anterior (pra calcular /min)
  swapHistory: [],        // [{t, mb}] dos ultimos ~10 min
  ultimoEstado: 'verde',
  ultimoResultado: null,
  chatMode: 'normal',
  segurarChatGlobal: false,
  timer: null,
  ultimaLimpeza: 0,
};

function readInfra() {
  try {
    const raw = fs.readFileSync(INFRA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function perMinute(curr, prev, minutes) {
  if (curr == null || prev == null || !minutes) return null;
  const delta = curr - prev;
  if (delta < 0) return 0; // contador zerado (reinicio do mysql/kernel)
  return Math.round((delta / minutes) * 10) / 10;
}

async function collectBusinessMetrics() {
  const [[alunos]] = await pool.query(
    `SELECT COUNT(*) AS n FROM view_sessions
     WHERE is_replay = 0 AND atualizado_em > DATE_SUB(NOW(), INTERVAL 70 SECOND)`,
  );
  const [[filaEventos]] = await pool.query(
    "SELECT COUNT(*) AS n FROM sino_webhook_outbox WHERE status = 'pendente'",
  );
  // fila de reenvio no banco + fila em memoria dos eventos ainda nao enviados
  const filaMemoria = require('./sino').queueSize();
  return { alunosAoVivo: Number(alunos.n), filaEventosSino: Number(filaEventos.n) + filaMemoria };
}

async function collectValues() {
  const now = Date.now();
  const node = await metrics.snapshot();
  const business = await collectBusinessMetrics();
  const sinoChannel = require('./sino-channel');
  const sino = await sinoChannel.getStats();
  const infra = readInfra();

  const values = {
    alunos_ao_vivo: business.alunosAoVivo,
    node_event_loop_p99_ms: node.eventLoopP99Ms,
    node_event_loop_util_pct: node.eventLoopUtilizacao,
    node_api_p95_ms: node.apiP95Ms,
    node_em_andamento: node.emAndamentoPico,
    node_erro_5xx_pct: node.taxaErro5xx,
    node_heap_pct: node.heapPct,
    node_pool_em_uso: node.pool.emUso,
    node_pool_fila: node.pool.fila,
    node_db_probe_ms: node.dbProbeMs,
    node_reinicio_recente: node.uptimeSeg < 300 ? 1 : 0,
    sino_fila_eventos: business.filaEventosSino,
    sino_fila_chat: sino.filaChat,
    sino_tempo_resposta_ms: sino.tempoRespostaMs,
    sino_disjuntor_aberto: sino.disjuntorAberto ? 1 : 0,
  };

  if (infra) {
    const infraAgeMin = (now - new Date(infra.coletadoEm).getTime()) / 60000;
    values.coletor_atrasado_min = Math.max(0, Math.round(infraAgeMin * 10) / 10);
    const fresh = infraAgeMin < 3;
    if (fresh) {
      const a = infra.apache || {};
      const r = infra.rede || {};
      const s = infra.sistema || {};
      const m = infra.mysql || {};
      values.apache_conexoes_443 = r.conexoes443;
      values.apache_workers_ocupados = a.workersOcupados;
      values.apache_processos_sem_aceitar_pct = a.processos ? Math.round((a.processosSemAceitar / a.processos) * 100) : 0;
      values.apache_fila_443 = r.filaEspera443;
      values.latencia_publica_ms = r.latenciaPublicaMs;
      values.mysql_conexoes = m.threadsConectadas;
      values.mysql_conexoes_webnarpro = m.conexoesWebnarpro;
      values.mysql_conexoes_e4pay = m.conexoesE4pay;
      values.mysql_threads_rodando = m.threadsRodando;
      values.mysql_lock_waits = m.lockWaits;
      values.ram_disponivel_mb = s.ramDisponivelMb;
      values.cpu_load1 = s.load1;
      values.disco_pct = s.discoPct;

      const totals = {
        t: new Date(infra.coletadoEm).getTime(),
        overflows: r.listenOverflowsTotal,
        slow: m.slowQueriesTotal,
        aborted: m.abortedConnectsTotal,
        bpReq: m.bufferPoolReadRequestsTotal,
        bpReads: m.bufferPoolReadsTotal,
      };
      const prev = state.prevTotals;
      if (prev && totals.t > prev.t) {
        const minutes = (totals.t - prev.t) / 60000;
        values.apache_descartadas_min = perMinute(totals.overflows, prev.overflows, minutes);
        values.mysql_slow_queries_min = perMinute(totals.slow, prev.slow, minutes);
        values.mysql_aborted_connects_min = perMinute(totals.aborted, prev.aborted, minutes);
        const reqDelta = totals.bpReq - prev.bpReq;
        const readsDelta = totals.bpReads - prev.bpReads;
        // Com pouca leitura no intervalo a taxa nao significa nada - so avalia com volume
        if (reqDelta > 1000) values.mysql_buffer_pool_hit_pct = Math.round((1 - readsDelta / reqDelta) * 10000) / 100;
      }
      if (!prev || totals.t !== prev.t) state.prevTotals = totals;

      if (s.swapUsadoMb != null) {
        state.swapHistory.push({ t: now, mb: s.swapUsadoMb });
        state.swapHistory = state.swapHistory.filter((x) => now - x.t <= 11 * 60000);
        const oldest = state.swapHistory[0];
        values.swap_crescimento_10min_mb = Math.max(0, s.swapUsadoMb - oldest.mb);
      }
    }
  }

  return { values, detalhes: { node, infra, sino } };
}

function instantLevel(rule, value) {
  if (value == null || Number.isNaN(value)) return 'verde';
  const below = rule.direcao === 'abaixo';
  const breach = (limit) => limit != null && (below ? value < limit : value > limit);
  if (breach(rule.vermelho)) return 'vermelho';
  if (breach(rule.amarelo)) return 'amarelo';
  return 'verde';
}

// Histerese: sobe depois de UP_AFTER coletas seguidas acima do nivel atual, desce depois de
// DOWN_AFTER coletas seguidas abaixo. Evita alarme por um pico de 1 minuto.
function applyHysteresis(metrica, inst) {
  const st = state.metricState[metrica] || { nivel: 'verde', subindo: 0, descendo: 0, maxSubida: 'verde' };
  state.metricState[metrica] = st;
  if (LEVEL_ORDER[inst] > LEVEL_ORDER[st.nivel]) {
    st.descendo = 0;
    st.subindo += 1;
    if (st.subindo === 1 || LEVEL_ORDER[inst] < LEVEL_ORDER[st.maxSubida]) st.maxSubida = inst;
    if (st.subindo >= UP_AFTER) { st.nivel = st.maxSubida; st.subindo = 0; }
  } else if (LEVEL_ORDER[inst] < LEVEL_ORDER[st.nivel]) {
    st.subindo = 0;
    st.descendo += 1;
    if (st.descendo >= DOWN_AFTER) { st.nivel = inst; st.descendo = 0; }
  } else {
    st.subindo = 0;
    st.descendo = 0;
  }
  return st.nivel;
}

async function loadRules() {
  const [rows] = await pool.query('SELECT metrica, limite_amarelo, limite_vermelho, habilitado FROM system_alert_rules');
  const overrides = Object.fromEntries(rows.map((r) => [r.metrica, r]));
  return DEFAULT_RULES.map((r) => {
    const o = overrides[r.metrica];
    return o ? { ...r, amarelo: o.limite_amarelo, vermelho: o.limite_vermelho, habilitado: !!o.habilitado } : { ...r, habilitado: true };
  });
}

async function getSetting(chave) {
  const [rows] = await pool.query('SELECT valor FROM system_settings WHERE chave = ? LIMIT 1', [chave]);
  return rows[0]?.valor ?? null;
}

async function setSetting(chave, valor) {
  await pool.query(
    'INSERT INTO system_settings (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
    [chave, valor],
  );
}

async function syncEvents(rules, levels, values) {
  const [open] = await pool.query('SELECT id, metrica, nivel FROM system_alert_events WHERE encerrado_em IS NULL');
  const openByMetric = Object.fromEntries(open.map((e) => [e.metrica, e]));
  for (const rule of rules) {
    const nivel = levels[rule.metrica];
    const ev = openByMetric[rule.metrica];
    if (ev && ev.nivel === nivel) continue;
    if (ev) await pool.query('UPDATE system_alert_events SET encerrado_em = NOW() WHERE id = ?', [ev.id]);
    if (nivel !== 'verde') {
      // herda o silencio do evento anterior da mesma metrica (amarelo -> vermelho continua silenciado)
      const limite = nivel === 'vermelho' ? rule.vermelho : rule.amarelo;
      await pool.query(
        `INSERT INTO system_alert_events (metrica, nivel, valor, limite, silenciado_ate)
         VALUES (?, ?, ?, ?, (SELECT s FROM (SELECT MAX(silenciado_ate) AS s FROM system_alert_events
                               WHERE metrica = ? AND silenciado_ate > NOW()) t))`,
        [rule.metrica, nivel, values[rule.metrica] ?? null, limite, rule.metrica],
      );
    }
  }
  // fecha eventos de metricas que sairam da lista de regras ou foram desabilitadas
  for (const ev of open) {
    if (!levels[ev.metrica]) await pool.query('UPDATE system_alert_events SET encerrado_em = NOW() WHERE id = ?', [ev.id]);
  }
}

async function activeAlerts() {
  const [rows] = await pool.query(
    `SELECT e.id, e.metrica, e.nivel, e.valor, e.limite, e.iniciado_em, e.reconhecido_em, e.silenciado_ate,
            u.nome AS reconhecido_por_nome
     FROM system_alert_events e LEFT JOIN users u ON u.id = e.reconhecido_por
     WHERE e.encerrado_em IS NULL ORDER BY FIELD(e.nivel, 'vermelho', 'amarelo'), e.iniciado_em`,
  );
  return rows.map((r) => ({
    ...r,
    label: RULES_BY_KEY[r.metrica]?.label || r.metrica,
    grupo: RULES_BY_KEY[r.metrica]?.grupo || '',
    unidade: RULES_BY_KEY[r.metrica]?.unidade || '',
    silenciado: !!(r.silenciado_ate && new Date(r.silenciado_ate) > new Date()),
  }));
}

function buildMessage(estado, alertas) {
  const emoji = { verde: '🟢', amarelo: '🟡', vermelho: '🔴' }[estado];
  if (estado === 'verde') return `${emoji} WebnarPRO: sistema normalizado, todos os indicadores no verde.`;
  const itens = alertas.slice(0, 4).map((a) => {
    const v = a.valor == null ? '—' : `${a.valor}${a.unidade || ''}`;
    return `${a.nivel === 'vermelho' ? '🔴' : '🟡'} ${a.label} = ${v} (limite ${a.limite}${a.unidade || ''})`;
  });
  return `${emoji} WebnarPRO: ${itens.join(' · ')}`;
}

async function notify(estado, alertas, { teste = false } = {}) {
  const [channels] = await pool.query('SELECT id, tipo, destino, nivel_minimo FROM system_alert_channels WHERE habilitado = 1');
  if (channels.length === 0) return { enviados: 0, canais: 0 };
  const texto = (teste ? '[TESTE] ' : '') + buildMessage(estado, alertas);
  const payload = {
    evento: 'alerta_sistema',
    sistema: 'webnarpro',
    estado,
    texto,
    teste,
    alertas: alertas.map((a) => ({ metrica: a.metrica, label: a.label, nivel: a.nivel, valor: a.valor, limite: a.limite })),
    em: new Date().toISOString(),
  };
  let enviados = 0;
  for (const ch of channels) {
    // canal configurado so pra vermelho nao recebe amarelo - mas sempre recebe a volta ao verde
    if (!teste && estado === 'amarelo' && ch.nivel_minimo === 'vermelho') continue;
    const url = ch.tipo === 'sino' ? process.env.SINO_WEBHOOK_URL : ch.destino;
    if (!url) continue;
    const headers = { 'Content-Type': 'application/json' };
    if (ch.tipo === 'sino' && process.env.SINO_WEBHOOK_SECRET) headers['x-webnarpro-secret'] = process.env.SINO_WEBHOOK_SECRET;
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) });
      if (res.ok) enviados += 1;
      else console.error(`[alertas] canal #${ch.id} (${ch.tipo}) respondeu HTTP ${res.status}`);
    } catch (err) {
      console.error(`[alertas] falha ao notificar canal #${ch.id} (${ch.tipo}): ${err.message}`);
    }
  }
  return { enviados, canais: channels.length };
}

function computeChatMode(rules, levels) {
  if (state.segurarChatGlobal) return 'retido';
  let worst = 'verde';
  for (const rule of rules) {
    if (NOT_LOAD_METRICS.has(rule.metrica)) continue;
    const l = levels[rule.metrica];
    if (LEVEL_ORDER[l] > LEVEL_ORDER[worst]) worst = l;
  }
  return worst === 'vermelho' ? 'retido' : worst === 'amarelo' ? 'economico' : 'normal';
}

async function evaluate() {
  const { values, detalhes } = await collectValues();
  const rules = await loadRules();
  state.segurarChatGlobal = (await getSetting('segurar_chat_global')) === '1';

  const levels = {};
  const items = [];
  for (const rule of rules) {
    const value = values[rule.metrica] ?? null;
    const nivel = rule.habilitado ? applyHysteresis(rule.metrica, instantLevel(rule, value)) : 'verde';
    if (rule.habilitado) levels[rule.metrica] = nivel;
    items.push({
      metrica: rule.metrica, grupo: rule.grupo, label: rule.label, unidade: rule.unidade,
      direcao: rule.direcao || 'acima', amarelo: rule.amarelo, vermelho: rule.vermelho,
      habilitado: rule.habilitado, valor: value, nivel,
    });
  }

  await syncEvents(rules.filter((r) => r.habilitado), levels, values);
  const alertas = await activeAlerts();
  const naoSilenciados = alertas.filter((a) => !a.silenciado);
  const estado = naoSilenciados.some((a) => a.nivel === 'vermelho') ? 'vermelho'
    : naoSilenciados.some((a) => a.nivel === 'amarelo') ? 'amarelo' : 'verde';
  state.chatMode = computeChatMode(rules.filter((r) => r.habilitado), levels);

  await pool.query(
    'INSERT INTO system_metric_snapshots (estado, payload) VALUES (?, ?)',
    [estado, JSON.stringify({ values, chatMode: state.chatMode, topRotas: detalhes.node.topRotas })],
  );

  if (estado !== state.ultimoEstado) {
    const anterior = state.ultimoEstado;
    state.ultimoEstado = estado;
    // na subida da app (anterior desconhecido) so avisa se ja nasceu com problema
    if (!(anterior === 'verde' && estado === 'verde')) {
      notify(estado, naoSilenciados).catch((err) => console.error('[alertas] notificacao falhou:', err.message));
    }
  }

  if (Date.now() - state.ultimaLimpeza > 60 * 60 * 1000) {
    state.ultimaLimpeza = Date.now();
    await pool.query('DELETE FROM system_metric_snapshots WHERE coletado_em < DATE_SUB(NOW(), INTERVAL 14 DAY) LIMIT 5000');
    await pool.query('DELETE FROM system_alert_events WHERE encerrado_em < DATE_SUB(NOW(), INTERVAL 180 DAY) LIMIT 5000');
  }

  state.ultimoResultado = {
    estado,
    chatMode: state.chatMode,
    segurarChatGlobal: state.segurarChatGlobal,
    atualizadoEm: new Date().toISOString(),
    metricas: items,
    alertas,
    detalhes: { topRotas: detalhes.node.topRotas, pool: detalhes.node.pool, infraColetadoEm: detalhes.infra?.coletadoEm || null },
  };
  return state.ultimoResultado;
}

async function getStatus() {
  if (!state.ultimoResultado) return evaluate();
  // alertas podem ter sido reconhecidos/silenciados desde a ultima avaliacao
  const alertas = await activeAlerts();
  const naoSilenciados = alertas.filter((a) => !a.silenciado);
  const estado = naoSilenciados.some((a) => a.nivel === 'vermelho') ? 'vermelho'
    : naoSilenciados.some((a) => a.nivel === 'amarelo') ? 'amarelo' : 'verde';
  return { ...state.ultimoResultado, alertas, estado, segurarChatGlobal: state.segurarChatGlobal, chatMode: state.chatMode };
}

function getChatMode() {
  return state.chatMode;
}

async function setSegurarChatGlobal(on) {
  await setSetting('segurar_chat_global', on ? '1' : '0');
  state.segurarChatGlobal = !!on;
  if (on) state.chatMode = 'retido';
  else if (state.ultimoResultado) {
    const rules = await loadRules();
    state.chatMode = computeChatMode(rules.filter((r) => r.habilitado),
      Object.fromEntries(state.ultimoResultado.metricas.filter((m) => m.habilitado).map((m) => [m.metrica, m.nivel])));
  } else state.chatMode = 'normal';
}

function start() {
  if (state.timer) return;
  fs.mkdirSync(path.dirname(INFRA_FILE), { recursive: true });
  getSetting('segurar_chat_global')
    .then((v) => { state.segurarChatGlobal = v === '1'; if (state.segurarChatGlobal) state.chatMode = 'retido'; })
    .catch(() => {});
  const run = () => evaluate().catch((err) => console.error('[alertas] erro na avaliacao:', err.message));
  setTimeout(run, 15000);
  state.timer = setInterval(run, INTERVAL_MS);
}

module.exports = {
  DEFAULT_RULES, RULES_BY_KEY, start, evaluate, getStatus, getChatMode, setSegurarChatGlobal, notify, activeAlerts,
  _test: { instantLevel, applyHysteresis, state, computeChatMode },
};
