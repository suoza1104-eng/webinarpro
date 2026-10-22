#!/bin/bash
# Deploy do PLANO_OTIMIZACAO_ESCALA.md (rodar como root no servidor).
# Pre-requisito: o pacote /tmp/webnarpro-escala.tgz enviado do repositorio (ver instrucao no fim).
# Cada etapa confere o resultado e para no primeiro erro. Backup de producao em
# /home/professoremerson/backups/webnarpro/2026-10-22-pre-escala (app, banco, my.cnf, include do Apache, crontab).
#
#   bash deploy-escala.sh app      -> migracao + codigo + .env + coletor + restart do app   (~2s fora do ar)
#   bash deploy-escala.sh infra    -> buffer do MySQL (ao vivo) + cache do E4Pay + HTTP/2  (reload do Apache)
#   bash deploy-escala.sh rollback -> volta o codigo e o .env do backup (o banco fica: so ganhou colunas/tabelas)
#
# Variaveis (padrao = producao): APP, DB, APP_PORT, PM2_NAME, BK, SKIP_CRON=1, SKIP_PUBLIC=1
set -euo pipefail
APP=${APP:-/home/professoremerson/webnarpro.professoremersonleite.site}
DB=${DB:-professoremerson_webnarpro}
APP_PORT=${APP_PORT:-3000}
PM2_NAME=${PM2_NAME:-webnarpro}
BK=${BK:-/home/professoremerson/backups/webnarpro/2026-10-22-pre-escala}
SKIP_CRON=${SKIP_CRON:-0}
SKIP_PUBLIC=${SKIP_PUBLIC:-0}
PKG=/tmp/webnarpro-escala.tgz
X=/tmp/escala-pkg/webnarpro.professoremersonleite.site
COLLECTOR=/usr/local/bin/webnarpro-infra-collector.sh
E4PAY_DIR=/etc/apache2/conf.d/userdata/ssl/2_4/professoremerson/e4pay.professoremersonleite.site

ok()   { echo -e "  \033[32m✔\033[0m $*"; }
fail() { echo -e "  \033[31m✘ $*\033[0m"; exit 1; }
health() { curl -s -m 10 "http://127.0.0.1:$APP_PORT/api/health" | grep -q '"ok"'; }
restart_app() { su - professoremerson -c "pm2 restart $PM2_NAME --update-env" >/dev/null; }

deploy_app() {
  [ -f "$PKG" ] || fail "pacote $PKG nao encontrado"
  mkdir -p "$BK"
  [ -f "$BK/env.bak" ] || cp "$APP/server/.env" "$BK/env.bak"
  ok "backup do .env em $BK/env.bak"
  rm -rf /tmp/escala-pkg && mkdir -p /tmp/escala-pkg && tar xzf "$PKG" -C /tmp/escala-pkg
  [ -d "$X/server/src" ] || fail "pacote sem server/src"

  echo "[1/6] migracao do banco (so adiciona colunas/tabelas)"
  if mysql -N -e "SHOW TABLES LIKE 'webinar_sino_config'" "$DB" | grep -q webinar_sino_config; then
    ok "migracao ja aplicada"
  else
    mysql "$DB" < "$X/database/migrations/2026-10-22-escala-alertas-sino.sql"
    ok "migracao aplicada"
  fi

  echo "[2/6] codigo (preserva .env, uploads e node_modules)"
  cp -a "$X/public" "$X/database" "$APP/"
  cp -a "$X/server/src" "$X/server/scripts" "$APP/server/"
  sed -i 's/\r$//' "$APP"/server/scripts/*.sh
  mkdir -p "$APP/server/runtime"
  chown -R professoremerson:professoremerson "$APP/server/src" "$APP/server/scripts" "$APP/server/runtime" "$APP/public" "$APP/database"
  ok "arquivos copiados"

  echo "[3/6] .env: canal do Sino e Sino pela rede interna (item 2.5)"
  E="$APP/server/.env"
  grep -q '^SINO_CHANNEL_URL=' "$E" || echo 'SINO_CHANNEL_URL=http://127.0.0.1:3710' >> "$E"
  grep -q '^APP_PUBLIC_URL=' "$E" || echo 'APP_PUBLIC_URL=https://webnarpro.professoremersonleite.site' >> "$E"
  sed -i -E 's#^SINO_WEBHOOK_URL=https://sino\.professoremersonleite\.site#SINO_WEBHOOK_URL=http://127.0.0.1:3710#' "$E"
  grep -E '^(SINO_CHANNEL_URL|SINO_WEBHOOK_URL|APP_PUBLIC_URL)=' "$E" | sed 's/^/    /'
  ok ".env atualizado"

  echo "[4/6] coletor de infraestrutura (cron do root, 1x por minuto)"
  if [ "$SKIP_CRON" = 1 ]; then
    ok "pulado (SKIP_CRON=1)"
  else
    install -m 755 "$APP/server/scripts/infra-collector.sh" "$COLLECTOR"
    "$COLLECTOR" "$APP/server/runtime/infra-metrics.json"
    chown professoremerson:professoremerson "$APP/server/runtime/infra-metrics.json"
    ok "coletor rodou ($(wc -c < "$APP/server/runtime/infra-metrics.json") bytes)"
    if ! crontab -l 2>/dev/null | grep -q webnarpro-infra-collector; then
      (crontab -l 2>/dev/null; echo "* * * * * $COLLECTOR $APP/server/runtime/infra-metrics.json >/dev/null 2>&1") | crontab -
    fi
    ok "cron instalado"
  fi

  echo "[5/6] reinicio do app"
  restart_app
  for i in $(seq 1 20); do health && break; sleep 1; done
  health || fail "app nao respondeu - rode: bash deploy-escala.sh rollback"
  ok "app no ar"

  echo "[6/6] verificacao"
  if [ "$SKIP_PUBLIC" != 1 ]; then
    [ "$(curl -s -m 10 -o /dev/null -w '%{http_code}' https://webnarpro.professoremersonleite.site/api/health)" = 200 ] && ok "caminho publico (Apache) ok" || fail "caminho publico falhou"
    curl -sI -m 10 "https://webnarpro.professoremersonleite.site/js/sala.js?v=27" | grep -qi immutable && ok "cache dos arquivos versionados ativo" || fail "cache nao ativo"
  fi
  grep -q "sala.js?v=27" "$APP/public/sala.html" && ok "sala nova publicada (v=27)"
  echo "  aguardando o primeiro ciclo do motor de alertas (~75s)..."
  sleep 75
  su - professoremerson -c "pm2 logs $PM2_NAME --err --lines 10 --nostream" | tail -6
  mysql -N -e "SELECT CONCAT('    snapshots de metricas: ', COUNT(*), ' · ultimo estado: ', COALESCE((SELECT estado FROM system_metric_snapshots ORDER BY id DESC LIMIT 1),'-')) FROM system_metric_snapshots" "$DB"
}

deploy_infra() {
  echo "[1/3] buffer do InnoDB 128M -> 1G (redimensiona ao vivo, sem reiniciar o MySQL)"
  mysql -e "SET GLOBAL innodb_buffer_pool_size = 1073741824"
  sed -i -E 's/^innodb_buffer_pool_size=128M.*/innodb_buffer_pool_size=1G/' /etc/my.cnf
  grep -q '^innodb_buffer_pool_size=1G' /etc/my.cnf && ok "my.cnf atualizado (vale tambem depois de reiniciar)"
  sleep 5
  mysql -N -e "SELECT CONCAT('    buffer pool agora: ', @@innodb_buffer_pool_size/1024/1024, ' MB')"

  echo "[2/3] cache das imagens do checkout E4Pay (item 1.4)"
  install -m 644 "$APP/server/scripts/apache/e4pay-cache.conf" "$E4PAY_DIR/e4pay-cache.conf"
  if apachectl configtest 2>&1 | grep -q "Syntax OK"; then
    apachectl graceful && ok "Apache recarregado (graceful)"
  else
    rm -f "$E4PAY_DIR/e4pay-cache.conf"; fail "configtest falhou - arquivo removido, nada mudou"
  fi
  sleep 2
  curl -sI -m 10 https://e4pay.professoremersonleite.site/assets/icons.svg | grep -i cache-control | sed 's/^/    /'

  echo "[3/3] HTTP/2 no Apache (item 2.2)"
  if httpd -M 2>/dev/null | grep -q http2_module; then
    ok "mod_http2 ja instalado"
  else
    dnf install -y ea-apache24-mod_http2 >/dev/null
    apachectl configtest 2>&1 | grep -q "Syntax OK" || { dnf remove -y ea-apache24-mod_http2 >/dev/null; fail "configtest falhou - pacote removido"; }
    apachectl graceful
    ok "mod_http2 instalado"
  fi
  sleep 3
  curl -s -m 10 -o /dev/null --http2 -w "    protocolo negociado: HTTP/%{http_version}\n" https://webnarpro.professoremersonleite.site/api/health
  curl -s -m 10 -o /dev/null -w "    e4pay: HTTP %{http_code} em %{time_total}s\n" https://e4pay.professoremersonleite.site/
}

rollback() {
  echo "Voltando codigo e .env do backup (o banco mantem as colunas novas - o codigo antigo funciona com elas)"
  rm -rf /tmp/escala-rb && mkdir -p /tmp/escala-rb && tar xzf "$BK/app.tgz" -C /tmp/escala-rb
  R=/tmp/escala-rb/webnarpro.professoremersonleite.site
  rm -rf "$APP/server/src" "$APP/public"
  cp -a "$R/server/src" "$APP/server/"
  cp -a "$R/public" "$APP/"
  cp "$BK/env.bak" "$APP/server/.env"
  chown -R professoremerson:professoremerson "$APP/server/src" "$APP/public" "$APP/server/.env"
  restart_app
  for i in $(seq 1 20); do health && break; sleep 1; done
  health && ok "versao anterior no ar" || fail "app nao respondeu"
}

case "${1:-}" in
  app) deploy_app ;;
  infra) deploy_infra ;;
  rollback) rollback ;;
  *) echo "uso: bash deploy-escala.sh app|infra|rollback"; exit 1 ;;
esac

# Envio do pacote (no computador, na pasta do projeto):
#   tar czf - webnarpro.professoremersonleite.site/{server/src,server/scripts,public,database} | ssh firepay-site "cat > /tmp/webnarpro-escala.tgz"
#   ssh firepay-site "bash /tmp/escala-pkg/.../deploy-escala.sh app"   (ou copie o script pra /root)
