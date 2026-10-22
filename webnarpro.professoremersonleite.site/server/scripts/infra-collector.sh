#!/bin/bash
# Coletor de metricas de infraestrutura do WebnarPRO (Fase 3 do PLANO_OTIMIZACAO_ESCALA.md).
# Roda como root pelo cron, 1x por minuto, e grava um JSON que o app Node le pra montar o
# sininho de alertas. Precisa de root por causa do apachectl fullstatus, ss e nstat.
# So le - nao altera nada no servidor. Leva ~1s.
#
# Uso: infra-collector.sh <arquivo-de-saida.json>
# Cron: * * * * * /usr/local/bin/webnarpro-infra-collector.sh /home/professoremerson/webnarpro.professoremersonleite.site/server/runtime/infra-metrics.json
set -u
# o cron roda com PATH minimo (sem /usr/sbin) - sem isso apachectl, ss e nstat nao sao encontrados
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
OUT="${1:?informe o arquivo de saida}"
TMP="${OUT}.tmp"
HEALTH_URL="${HEALTH_URL:-https://webnarpro.professoremersonleite.site/api/health}"

num() { local v="${1:-}"; [[ "$v" =~ ^-?[0-9]+(\.[0-9]+)?$ ]] && echo "$v" || echo null; }

# --- Apache ---
FULL="$(apachectl fullstatus 2>/dev/null)"
BUSY=$(echo "$FULL" | grep -oE '[0-9]+ requests currently being processed' | head -1 | awk '{print $1}')
IDLE=$(echo "$FULL" | grep -oE '[0-9]+ idle' | head -1 | awk '{print $1}')
# Tabela de processos do mpm_event: coluna "accepting" = yes/no
# (com locale UTF-8 a tabela usa "│"; no cron, sem locale, usa "|")
read -r PROCS NOT_ACCEPTING < <(echo "$FULL" | grep -E "^(│|\|)[0-9]" | sed 's/│/|/g' | awk -F"|" '{n++; if ($6 ~ /no/) na++} END {print n+0, na+0}')
MAXW=$(apachectl -t -D DUMP_RUN_CFG 2>/dev/null | sed -n 's/.*MaxRequestWorkers: *\([0-9]*\).*/\1/p' | head -1)
[ -z "$MAXW" ] && MAXW=$(grep -hE "^\s*MaxRequestWorkers" /etc/apache2/conf/httpd.conf /etc/apache2/conf.d/includes/*.conf 2>/dev/null | tail -1 | awk '{print $2}')

# --- Rede ---
EST443=$(ss -Htn state established '( sport = :443 )' 2>/dev/null | wc -l)
RECVQ443=$(ss -Hltn '( sport = :443 )' 2>/dev/null | awk '{print $2}' | head -1)
OVERFLOWS=$(nstat -az TcpExtListenOverflows 2>/dev/null | awk '/TcpExtListenOverflows/{print $2}')

# Latencia pelo caminho publico (Apache + TLS + Node + MySQL), resolvendo pro proprio servidor
HOST=$(echo "$HEALTH_URL" | sed -E 's#https?://([^/]+).*#\1#')
LAT=$(curl -s -o /dev/null -m 10 --resolve "$HOST:443:127.0.0.1" -w "%{time_total}" "$HEALTH_URL" 2>/dev/null)
LAT_MS=$(awk -v t="${LAT:-}" 'BEGIN{ if (t=="" || t+0==0) print "null"; else printf "%d", t*1000 }')

# --- Sistema ---
MEM_AVAIL=$(awk '/MemAvailable/{printf "%d", $2/1024}' /proc/meminfo)
SWAP_USED=$(awk '/SwapTotal/{t=$2} /SwapFree/{f=$2} END{printf "%d", (t-f)/1024}' /proc/meminfo)
LOAD1=$(awk '{print $1}' /proc/loadavg)
CPUS=$(nproc)
DISK=$(df -P / | awk 'NR==2{gsub("%","",$5); print $5}')

# --- MySQL ---
MYSQL_STATUS="$(mysql -N -B -e "SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected','Threads_running','Slow_queries','Aborted_connects','Innodb_row_lock_current_waits','Innodb_buffer_pool_read_requests','Innodb_buffer_pool_reads')" 2>/dev/null)"
gs() { echo "$MYSQL_STATUS" | awk -v k="$1" '$1==k{print $2}'; }
MAXCONN=$(mysql -N -B -e "SELECT @@max_connections" 2>/dev/null)
PER_USER="$(mysql -N -B -e "SELECT user, COUNT(*) FROM information_schema.processlist GROUP BY user" 2>/dev/null)"
uc() { echo "$PER_USER" | awk -v u="$1" '$1==u{print $2}'; }
WEBNAR_CONN=$(uc professoremerson_webnarpro); E4PAY_CONN=$(uc professoremerson_4epay)

cat > "$TMP" <<EOF
{
  "coletadoEm": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "apache": {
    "workersOcupados": $(num "$BUSY"),
    "workersLivres": $(num "$IDLE"),
    "maxRequestWorkers": $(num "$MAXW"),
    "processos": $(num "$PROCS"),
    "processosSemAceitar": $(num "$NOT_ACCEPTING")
  },
  "rede": {
    "conexoes443": $(num "$EST443"),
    "filaEspera443": $(num "$RECVQ443"),
    "listenOverflowsTotal": $(num "$OVERFLOWS"),
    "latenciaPublicaMs": $LAT_MS
  },
  "sistema": {
    "ramDisponivelMb": $(num "$MEM_AVAIL"),
    "swapUsadoMb": $(num "$SWAP_USED"),
    "load1": $(num "$LOAD1"),
    "cpus": $(num "$CPUS"),
    "discoPct": $(num "$DISK")
  },
  "mysql": {
    "threadsConectadas": $(num "$(gs Threads_connected)"),
    "threadsRodando": $(num "$(gs Threads_running)"),
    "maxConnections": $(num "$MAXCONN"),
    "slowQueriesTotal": $(num "$(gs Slow_queries)"),
    "abortedConnectsTotal": $(num "$(gs Aborted_connects)"),
    "lockWaits": $(num "$(gs Innodb_row_lock_current_waits)"),
    "bufferPoolReadRequestsTotal": $(num "$(gs Innodb_buffer_pool_read_requests)"),
    "bufferPoolReadsTotal": $(num "$(gs Innodb_buffer_pool_reads)"),
    "conexoesWebnarpro": $(num "${WEBNAR_CONN:-0}"),
    "conexoesE4pay": $(num "${E4PAY_CONN:-0}")
  }
}
EOF
chmod 644 "$TMP"
mv -f "$TMP" "$OUT"
