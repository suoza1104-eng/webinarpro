-- Plano de escala (PLANO_OTIMIZACAO_ESCALA.md): Salas de Atendimento estilo inbox (Fase 5),
-- alertas do sistema / sininho (Fase 3) e canal "webnar" do Sino (Fase 6).
-- So adiciona colunas/tabelas - nada e removido nem renomeado, roda com o sistema no ar.

-- ---------- Fase 5: inbox de atendimento ----------
ALTER TABLE atendimentos
  ADD COLUMN modo ENUM('ia','humano') NOT NULL DEFAULT 'humano' AFTER status,
  ADD COLUMN nao_lidas INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN total_mensagens_lead INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN respostas_ia INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN ultima_mensagem_texto VARCHAR(1000) NULL,
  ADD COLUMN ultima_mensagem_remetente ENUM('lead','suporte','ia','sistema') NULL,
  ADD COLUMN ultima_mensagem_lead_em DATETIME NULL,
  ADD COLUMN ultima_resposta_em DATETIME NULL,
  ADD COLUMN auto_resposta_enviada TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  ADD INDEX idx_atend_webinar_status_ult (webinar_id, status, ultima_mensagem_em),
  ADD INDEX idx_atend_atualizado (atualizado_em);

ALTER TABLE atendimento_mensagens
  MODIFY COLUMN remetente ENUM('lead','suporte','ia','sistema') NOT NULL,
  ADD COLUMN autor_nome VARCHAR(120) NULL AFTER remetente,
  ADD COLUMN external_id VARCHAR(80) NULL,
  ADD UNIQUE KEY uq_atendmsg_external (external_id);

-- Preenche as colunas desnormalizadas a partir do historico que ja existe
UPDATE atendimentos a
JOIN (
  SELECT m.atendimento_id,
         SUM(m.remetente = 'lead') AS total_lead,
         MAX(CASE WHEN m.remetente = 'lead' THEN m.criado_em END) AS ult_lead,
         MAX(CASE WHEN m.remetente <> 'lead' THEN m.criado_em END) AS ult_resp
  FROM atendimento_mensagens m GROUP BY m.atendimento_id
) s ON s.atendimento_id = a.id
SET a.total_mensagens_lead = s.total_lead,
    a.ultima_mensagem_lead_em = s.ult_lead,
    a.ultima_resposta_em = s.ult_resp;

UPDATE atendimentos a
JOIN atendimento_mensagens m ON m.id = (
  SELECT m2.id FROM atendimento_mensagens m2 WHERE m2.atendimento_id = a.id ORDER BY m2.criado_em DESC, m2.id DESC LIMIT 1
)
SET a.ultima_mensagem_texto = m.mensagem, a.ultima_mensagem_remetente = m.remetente;

-- ---------- Fase 6: canal webnar do Sino ----------
CREATE TABLE IF NOT EXISTS prompt_templates (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id    BIGINT UNSIGNED NOT NULL,
  nome          VARCHAR(120) NOT NULL,
  objetivo      ENUM('venda','captacao','conteudo','onboarding','outro') NOT NULL DEFAULT 'venda',
  conteudo      TEXT NOT NULL,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prompt_tpl_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_prompt_tpl_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS webinar_sino_config (
  webinar_id             BIGINT UNSIGNED PRIMARY KEY,
  habilitado             TINYINT(1) NOT NULL DEFAULT 0,
  atuacao                ENUM('ao_vivo','ao_vivo_replay') NOT NULL DEFAULT 'ao_vivo',
  objetivo               ENUM('venda','captacao','conteudo','onboarding','outro') NOT NULL DEFAULT 'venda',
  prompt                 TEXT NULL,
  agente_id              VARCHAR(64) NULL,
  agente_nome            VARCHAR(120) NULL,
  setor_venda            VARCHAR(64) NULL,
  setor_suporte          VARCHAR(64) NULL,
  followup_habilitado    TINYINT(1) NOT NULL DEFAULT 1,
  followup_dias          VARCHAR(20) NOT NULL DEFAULT '1,3',
  followup_template_1    VARCHAR(120) NULL,
  followup_template_2    VARCHAR(120) NULL,
  followup_publico       ENUM('chat','todos_presentes') NOT NULL DEFAULT 'chat',
  limite_respostas_ia    INT UNSIGNED NOT NULL DEFAULT 20,
  segurar_chat           TINYINT(1) NOT NULL DEFAULT 0,
  contexto_hash          CHAR(64) NULL,
  contexto_enviado_em    DATETIME NULL,
  fim_live_enviado_para  DATETIME NULL,
  atualizado_em          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sino_cfg_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Fila de saida pro canal webnar: mensagens do aluno (agrupadas), contexto do webinar e eventos.
CREATE TABLE IF NOT EXISTS webnar_sino_outbox (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo                  ENUM('mensagem','contexto','evento') NOT NULL,
  webinar_id            BIGINT UNSIGNED NOT NULL,
  atendimento_id        BIGINT UNSIGNED NULL,
  mensagem_id           BIGINT UNSIGNED NULL,
  payload               JSON NOT NULL,
  status                ENUM('pendente','retido','enviado','falhou_definitivo','descartado') NOT NULL DEFAULT 'pendente',
  tentativas            INT UNSIGNED NOT NULL DEFAULT 0,
  proxima_tentativa_em  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  criado_em             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  enviado_em            DATETIME NULL,
  ultimo_erro           VARCHAR(255) NULL,
  INDEX idx_wso_status (status, proxima_tentativa_em),
  INDEX idx_wso_atendimento (atendimento_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- Fase 3: alertas do sistema ----------
CREATE TABLE IF NOT EXISTS system_settings (
  chave         VARCHAR(60) PRIMARY KEY,
  valor         TEXT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS system_alert_rules (
  metrica          VARCHAR(60) PRIMARY KEY,
  limite_amarelo   DOUBLE NULL,
  limite_vermelho  DOUBLE NULL,
  habilitado       TINYINT(1) NOT NULL DEFAULT 1,
  atualizado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS system_alert_events (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  metrica          VARCHAR(60) NOT NULL,
  nivel            ENUM('amarelo','vermelho') NOT NULL,
  valor            DOUBLE NULL,
  limite           DOUBLE NULL,
  iniciado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  encerrado_em     DATETIME NULL,
  reconhecido_por  BIGINT UNSIGNED NULL,
  reconhecido_em   DATETIME NULL,
  silenciado_ate   DATETIME NULL,
  INDEX idx_sae_aberto (encerrado_em, metrica),
  INDEX idx_sae_iniciado (iniciado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS system_metric_snapshots (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coletado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado      ENUM('verde','amarelo','vermelho') NOT NULL,
  payload     JSON NOT NULL,
  INDEX idx_sms_coletado (coletado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS system_alert_channels (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo          ENUM('sino','webhook') NOT NULL,
  destino       VARCHAR(500) NULL,
  nivel_minimo  ENUM('amarelo','vermelho') NOT NULL DEFAULT 'vermelho',
  habilitado    TINYINT(1) NOT NULL DEFAULT 1,
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
