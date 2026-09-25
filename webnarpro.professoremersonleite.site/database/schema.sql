-- =====================================================================
-- WEBNARPRO — SCHEMA MYSQL
-- Versão: 1.0
-- Motor: InnoDB | Charset: utf8mb4
--
-- Este schema já nasce multi-tenant (multi-conta), mesmo que hoje só
-- exista UMA conta em produção (a do Emerson / 4E Treinamentos).
-- Toda tabela de dados carrega account_id, então adicionar um segundo
-- cliente pagante no futuro é inserir uma linha em `accounts` — não
-- exige migração de schema.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. CONTAS (tenants) — pronta para o modelo de licenciamento futuro
-- ---------------------------------------------------------------------
CREATE TABLE accounts (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_empresa      VARCHAR(150) NOT NULL,
  subdominio        VARCHAR(80)  NOT NULL UNIQUE,        -- ex: 'suaempresa' -> suaempresa.webnarpro.com.br
  dominio_custom    VARCHAR(150) NULL,                    -- domínio próprio, se o cliente configurar
  status            ENUM('ativa','suspensa','cancelada') NOT NULL DEFAULT 'ativa',
  plano_id          BIGINT UNSIGNED NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. PLANOS — para quando o licenciamento for ativado
-- ---------------------------------------------------------------------
CREATE TABLE plans (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome              VARCHAR(60) NOT NULL,                 -- Start / Growth / Ilimitado
  preco_mensal_centavos INT UNSIGNED NOT NULL DEFAULT 0,
  limite_armazenamento_gb INT UNSIGNED NULL,               -- NULL = ilimitado
  limite_banda_gb   INT UNSIGNED NULL,
  limite_tokens_ia  INT UNSIGNED NULL,
  ativo             TINYINT(1) NOT NULL DEFAULT 1,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE accounts
  ADD CONSTRAINT fk_accounts_plan FOREIGN KEY (plano_id) REFERENCES plans(id);

-- ---------------------------------------------------------------------
-- 3. USUÁRIOS DO PAINEL (admins e atendentes)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id        BIGINT UNSIGNED NOT NULL,
  nome              VARCHAR(120) NOT NULL,
  email             VARCHAR(160) NOT NULL,
  senha_hash        VARCHAR(255) NOT NULL,                 -- bcrypt/argon2, NUNCA texto puro
  tipo              ENUM('administrador','atendente') NOT NULL DEFAULT 'atendente',
  ultimo_login_em   DATETIME NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_account_email (account_id, email),
  CONSTRAINT fk_users_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. VÍDEOS (biblioteca) — metadados; o arquivo em si vive na Bunny Stream
-- ---------------------------------------------------------------------
CREATE TABLE videos (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id        BIGINT UNSIGNED NOT NULL,
  nome_arquivo      VARCHAR(255) NOT NULL,
  bunny_video_id    VARCHAR(64)  NULL,                     -- guid retornado pela Bunny
  bunny_library_id  VARCHAR(32)  NULL,
  duracao_segundos  INT UNSIGNED NULL,
  tamanho_bytes     BIGINT UNSIGNED NULL,
  status_processamento ENUM('enviando','processando','pronto','erro') NOT NULL DEFAULT 'enviando',
  thumbnail_url     VARCHAR(500) NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_videos_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_videos_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5. WEBINARS — a tabela central (etapa "Início" + "Webinar" do wizard)
-- ---------------------------------------------------------------------
CREATE TABLE webinars (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id        BIGINT UNSIGNED NOT NULL,
  nome              VARCHAR(150) NOT NULL,
  titulo            VARCHAR(255) NULL,
  slug              VARCHAR(150) NOT NULL,                 -- parte final da URL amigável
  idioma            VARCHAR(10)  NOT NULL DEFAULT 'pt-BR',
  nome_apresentador VARCHAR(120) NULL,
  avatar_apresentador_url VARCHAR(500) NULL,
  tipo_agendamento  ENUM('unico','just_in_time') NOT NULL DEFAULT 'unico',  -- just_in_time reservado p/ versão futura
  repeticao_automatica TINYINT(1) NOT NULL DEFAULT 0,
  data_inicio       DATETIME NULL,
  data_fim          DATETIME NULL,
  fuso_horario      VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
  usar_sala_espera  TINYINT(1) NOT NULL DEFAULT 0,
  video_id          BIGINT UNSIGNED NULL,
  video_autoplay    TINYINT(1) NOT NULL DEFAULT 0,
  video_fullscreen  TINYINT(1) NOT NULL DEFAULT 0,
  ocultar_barra_progresso TINYINT(1) NOT NULL DEFAULT 1,
  bloquear_avanco_video   TINYINT(1) NOT NULL DEFAULT 1,
  modo_youtube      TINYINT(1) NOT NULL DEFAULT 0,          -- barra estilo YouTube: rever o já assistido, sem avançar
  modo_youtube_bloqueio_segundo INT UNSIGNED NULL,          -- a partir deste segundo, trava avanço mesmo revendo (protege o pitch)
  tipo_audiencia    ENUM('nenhuma','fixa','dinamica') NOT NULL DEFAULT 'nenhuma',
  audiencia_min_participantes INT UNSIGNED NOT NULL DEFAULT 50,
  audiencia_max_participantes INT UNSIGNED NOT NULL DEFAULT 65,
  mostrar_botao_ao_vivo TINYINT(1) NOT NULL DEFAULT 1,
  status            ENUM('rascunho','ativo','pausado','finalizado') NOT NULL DEFAULT 'rascunho',
  criado_por        BIGINT UNSIGNED NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_webinars_account_slug (account_id, slug),
  CONSTRAINT fk_webinars_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_webinars_video   FOREIGN KEY (video_id)   REFERENCES videos(id)   ON DELETE SET NULL,
  CONSTRAINT fk_webinars_criador FOREIGN KEY (criado_por) REFERENCES users(id)    ON DELETE SET NULL,
  INDEX idx_webinars_account_status (account_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6. CONFIGURAÇÃO DE LOGIN/CADASTRO (etapa "Login")
-- ---------------------------------------------------------------------
CREATE TABLE webinar_login_config (
  webinar_id        BIGINT UNSIGNED PRIMARY KEY,
  logo_url          VARCHAR(500) NULL,
  exibir_barra_progresso TINYINT(1) NOT NULL DEFAULT 1,
  progresso_inicial INT UNSIGNED NOT NULL DEFAULT 0,        -- ex: 63 (%)
  pedir_whatsapp    TINYINT(1) NOT NULL DEFAULT 1,
  pedir_empresa     TINYINT(1) NOT NULL DEFAULT 0,
  titulo_botao      VARCHAR(60) NOT NULL DEFAULT 'Entrar na Aula',
  cor_botao         VARCHAR(9)  NOT NULL DEFAULT '#1F9D57',
  cor_texto_botao   VARCHAR(9)  NOT NULL DEFAULT '#FFFFFF',
  CONSTRAINT fk_login_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 7. CONFIGURAÇÃO DA OFERTA (etapa "Oferta")
-- ---------------------------------------------------------------------
CREATE TABLE webinar_offer_config (
  webinar_id            BIGINT UNSIGNED PRIMARY KEY,
  nome_oferta           VARCHAR(150) NOT NULL,
  titulo_oferta         VARCHAR(255) NULL,
  preco_original_centavos INT UNSIGNED NULL,
  preco_oferta_centavos   INT UNSIGNED NOT NULL,
  texto_botao           VARCHAR(80) NOT NULL DEFAULT 'inscreva-se aqui',
  cor_botao             VARCHAR(9)  NOT NULL DEFAULT '#D93B3B',
  layout_temporizador   ENUM('classico','rotulos','urgente') NOT NULL DEFAULT 'classico',
  temporizador_segundos INT UNSIGNED NOT NULL DEFAULT 300,
  imagem_desktop_url    VARCHAR(500) NULL,
  imagem_mobile_url     VARCHAR(500) NULL,
  inicio_pitch_segundos INT UNSIGNED NULL,                  -- minuto do vídeo em que o pitch começa
  inicio_oferta_segundos INT UNSIGNED NULL,
  fim_oferta_segundos   INT UNSIGNED NULL,
  link_checkout         VARCHAR(500) NOT NULL,
  repassar_utms         TINYINT(1) NOT NULL DEFAULT 0,
  oferta_desabilitada   TINYINT(1) NOT NULL DEFAULT 0,
  sorteio_habilitado    TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_offer_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 8. MENSAGENS DE CHAT SIMULADO (etapa "Chat")
-- ---------------------------------------------------------------------
CREATE TABLE webinar_chat_messages (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webinar_id        BIGINT UNSIGNED NOT NULL,
  segundo_exibicao  INT UNSIGNED NOT NULL,                  -- segundos desde o início do vídeo
  nome_exibido      VARCHAR(80) NOT NULL,
  mensagem          VARCHAR(500) NOT NULL,
  eh_suporte        TINYINT(1) NOT NULL DEFAULT 0,           -- true = mensagem destacada "Suporte - ..."
  ordem             INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_chatmsg_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
  INDEX idx_chatmsg_webinar_tempo (webinar_id, segundo_exibicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 9. NOTIFICAÇÕES DE VENDA SIMULADA (etapa "Vendas")
-- ---------------------------------------------------------------------
CREATE TABLE webinar_sales_notifications (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webinar_id        BIGINT UNSIGNED NOT NULL,
  segundo_exibicao  INT UNSIGNED NOT NULL,
  nome_exibido      VARCHAR(80) NOT NULL,
  titulo_notificacao VARCHAR(120) NOT NULL DEFAULT 'Venda confirmada!',
  CONSTRAINT fk_sales_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
  INDEX idx_sales_webinar_tempo (webinar_id, segundo_exibicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 10. PALAVRAS-CHAVE DO CHATBOT (etapa "Chatbot")
-- ---------------------------------------------------------------------
CREATE TABLE webinar_chatbot_keywords (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webinar_id        BIGINT UNSIGNED NOT NULL,
  remetente_exibido VARCHAR(80) NOT NULL,
  palavra_chave     VARCHAR(120) NOT NULL,
  resposta_automatica VARCHAR(500) NOT NULL,                -- suporta placeholder #nome
  delay_segundos    INT UNSIGNED NOT NULL DEFAULT 5,
  imagem_url        VARCHAR(500) NULL,
  CONSTRAINT fk_kw_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
  INDEX idx_kw_webinar (webinar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 11. INTEGRAÇÕES (por conta — reservado, hoje sem integrações ativas)
-- ---------------------------------------------------------------------
CREATE TABLE account_integrations (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id        BIGINT UNSIGNED NOT NULL,
  provedor          VARCHAR(60) NOT NULL,                   -- 'active_campaign','manychat','webhook', etc.
  credenciais_json  TEXT NULL,                               -- SEMPRE cifrado em repouso (ver seção de segurança)
  ativo             TINYINT(1) NOT NULL DEFAULT 0,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_integ_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 12. LEADS / INSCRITOS (quem se cadastrou pra assistir)
-- ---------------------------------------------------------------------
CREATE TABLE leads (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webinar_id        BIGINT UNSIGNED NOT NULL,
  nome              VARCHAR(150) NOT NULL,
  email             VARCHAR(160) NOT NULL,
  whatsapp          VARCHAR(30)  NULL,
  empresa           VARCHAR(150) NULL,
  ip_cadastro       VARCHAR(45)  NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leads_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
  UNIQUE KEY uq_leads_webinar_email (webinar_id, email),
  INDEX idx_leads_webinar (webinar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 13. VISUALIZAÇÕES AGREGADAS (analytics leve — nunca grava por segundo)
--     Ver seção "Escala para 1000 espectadores" no prompt de handoff.
-- ---------------------------------------------------------------------
CREATE TABLE view_sessions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webinar_id        BIGINT UNSIGNED NOT NULL,
  lead_id           BIGINT UNSIGNED NOT NULL,
  entrou_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_marco_pct  TINYINT UNSIGNED NOT NULL DEFAULT 0,     -- 0,25,50,75,100 — grava só nesses marcos
  atualizado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_view_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
  CONSTRAINT fk_view_lead    FOREIGN KEY (lead_id)    REFERENCES leads(id)    ON DELETE CASCADE,
  UNIQUE KEY uq_view_webinar_lead (webinar_id, lead_id),
  INDEX idx_view_webinar (webinar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 14. HISTÓRICO DE AÇÕES (auditoria do painel)
-- ---------------------------------------------------------------------
CREATE TABLE historico_acoes (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id        BIGINT UNSIGNED NOT NULL,
  user_id           BIGINT UNSIGNED NULL,
  webinar_id        BIGINT UNSIGNED NULL,
  tipo_acao         ENUM('criou','editou','deletou','login') NOT NULL,
  descricao         VARCHAR(255) NOT NULL,
  ip_origem         VARCHAR(45) NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL,
  CONSTRAINT fk_hist_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE SET NULL,
  INDEX idx_hist_account_data (account_id, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 15. CONSUMO DE PLANO (armazenamento / banda / tokens) — snapshot mensal
-- ---------------------------------------------------------------------
CREATE TABLE account_usage (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id        BIGINT UNSIGNED NOT NULL,
  ciclo_inicio      DATE NOT NULL,
  ciclo_fim         DATE NOT NULL,
  armazenamento_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  banda_bytes       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  tokens_ia_usados  INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_usage_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY uq_usage_account_ciclo (account_id, ciclo_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED mínimo para o ambiente do Emerson (ajustar antes de rodar)
-- =====================================================================
INSERT INTO plans (nome, preco_mensal_centavos, limite_armazenamento_gb, limite_banda_gb, limite_tokens_ia)
VALUES ('Interno', 0, NULL, NULL, NULL);

INSERT INTO accounts (nome_empresa, subdominio, plano_id)
VALUES ('4E Treinamentos / Professor Emerson Leite', 'professoremersonleite', LAST_INSERT_ID());
