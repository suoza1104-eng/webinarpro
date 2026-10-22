// Metricas de dentro do processo Node (event loop, latencia da API, erros, memoria, pool do
// MySQL). Leves por design: so contadores e um buffer de duracoes por janela de coleta,
// zerados a cada snapshot() - nada cresce sem limite.
const { monitorEventLoopDelay, performance } = require('perf_hooks');
const v8 = require('v8');
const pool = require('../db');

const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();
let lastElu = performance.eventLoopUtilization();

const MAX_SAMPLES = 5000;
let durations = [];
let routeDurations = new Map();
let requests = 0;
let errors5xx = 0;
let inFlight = 0;
let peakInFlight = 0;

// Agrupa /api/public/webinars/211026/presence em /api/public/webinars/:id/presence
function routeKey(req) {
  const path = (req.originalUrl || req.url || '').split('?')[0];
  return `${req.method} ${path.replace(/\/\d+(?=\/|$)/g, '/:id')}`;
}

function middleware(req, res, next) {
  if (!req.originalUrl.startsWith('/api/')) return next();
  const start = process.hrtime.bigint();
  inFlight += 1;
  if (inFlight > peakInFlight) peakInFlight = inFlight;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    inFlight -= 1;
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    requests += 1;
    if (res.statusCode >= 500) errors5xx += 1;
    if (durations.length < MAX_SAMPLES) durations.push(ms);
    const key = routeKey(req);
    let arr = routeDurations.get(key);
    if (!arr) { arr = []; routeDurations.set(key, arr); }
    if (arr.length < 1000) arr.push(ms);
  };
  res.on('finish', finish);
  res.on('close', finish);
  next();
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function poolStats() {
  const p = pool.pool || {};
  const all = p._allConnections?.length ?? 0;
  const free = p._freeConnections?.length ?? 0;
  return {
    limite: p.config?.connectionLimit ?? null,
    abertas: all,
    emUso: all - free,
    fila: p._connectionQueue?.length ?? 0,
  };
}

// Tempo de um SELECT 1 (pegar conexao do pool + ida e volta no banco)
async function dbProbeMs() {
  const start = process.hrtime.bigint();
  try {
    await pool.query('SELECT 1');
    return Math.round(Number(process.hrtime.bigint() - start) / 1e6);
  } catch {
    return null;
  }
}

async function snapshot() {
  const elu = performance.eventLoopUtilization(lastElu);
  lastElu = performance.eventLoopUtilization();
  const mem = process.memoryUsage();
  const heapLimit = v8.getHeapStatistics().heap_size_limit;

  const topRotas = [...routeDurations.entries()]
    .map(([rota, arr]) => ({ rota, req: arr.length, p95: Math.round(percentile(arr, 95)) }))
    .sort((a, b) => b.req - a.req)
    .slice(0, 8);

  const result = {
    eventLoopP99Ms: Math.round(loopDelay.percentile(99) / 1e6),
    eventLoopUtilizacao: Math.round(elu.utilization * 1000) / 10,
    apiP95Ms: Math.round(percentile(durations, 95)),
    requisicoes: requests,
    emAndamentoPico: peakInFlight,
    taxaErro5xx: requests ? Math.round((errors5xx / requests) * 1000) / 10 : 0,
    heapPct: Math.round((mem.heapUsed / heapLimit) * 1000) / 10,
    rssMb: Math.round(mem.rss / 1024 / 1024),
    uptimeSeg: Math.round(process.uptime()),
    pool: poolStats(),
    dbProbeMs: await dbProbeMs(),
    topRotas,
  };

  loopDelay.reset();
  durations = [];
  routeDurations = new Map();
  requests = 0;
  errors5xx = 0;
  peakInFlight = inFlight;
  return result;
}

module.exports = { middleware, snapshot, poolStats };
