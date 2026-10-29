-- IA do chat da sala (OpenAI direto do WebnarPRO): responde as duvidas dos alunos como "Equipe",
-- esperando o aluno parar de digitar antes de responder. Aditiva e segura pra rodar com o sistema no ar.

CREATE TABLE IF NOT EXISTS webinar_chat_ia_config (
  webinar_id                 BIGINT UNSIGNED PRIMARY KEY,
  habilitado                 TINYINT(1) NOT NULL DEFAULT 0,
  espera_segundos            INT NOT NULL DEFAULT 120,         -- silencio do aluno antes de responder
  modelo_triagem             VARCHAR(64) NOT NULL DEFAULT 'gpt-4.1-mini',
  modelo_resposta            VARCHAR(64) NOT NULL DEFAULT 'gpt-4.1',
  limite_respostas_por_aluno INT NOT NULL DEFAULT 10,
  prompt                     MEDIUMTEXT NULL,                  -- NULL = prompt padrao do codigo
  atualizado_em              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ate qual mensagem do aluno a IA ja analisou (respondendo ou nao) e se a conversa foi passada pra equipe.
-- MySQL nao tem ADD COLUMN IF NOT EXISTS: rodar este ALTER uma vez so (falha com "Duplicate column" se repetir).
ALTER TABLE atendimentos
  ADD COLUMN ia_processado_ate_msg_id BIGINT UNSIGNED NULL,
  ADD COLUMN ia_pausada TINYINT(1) NOT NULL DEFAULT 0;

-- Registro de cada decisao da IA (pra auditar o que ela respondeu, ignorou ou passou pra equipe)
CREATE TABLE IF NOT EXISTS chat_ia_log (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webinar_id      BIGINT UNSIGNED NOT NULL,
  atendimento_id  BIGINT UNSIGNED NOT NULL,
  ate_msg_id      BIGINT UNSIGNED NULL,
  mensagens       TEXT NULL,
  responder       TINYINT(1) NOT NULL DEFAULT 0,
  categoria       VARCHAR(40) NULL,
  complexidade    VARCHAR(20) NULL,
  passar_equipe   TINYINT(1) NOT NULL DEFAULT 0,
  motivo          VARCHAR(255) NULL,
  modelo          VARCHAR(64) NULL,
  resposta        TEXT NULL,
  tokens          INT NULL,
  ms              INT NULL,
  erro            VARCHAR(500) NULL,
  criado_em       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_ia_log_webinar (webinar_id, criado_em),
  INDEX idx_chat_ia_log_atendimento (atendimento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
