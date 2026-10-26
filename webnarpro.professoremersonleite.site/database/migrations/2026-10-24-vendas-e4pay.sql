-- Vendas reais do webinar, vindas do webhook da E4Pay (evento compra_aprovada).
-- Uma linha por transacao: o webhook pode chegar repetido (retentativas da E4Pay),
-- entao transacao_id e unico. Reembolso/chargeback/cancelamento nao apaga, so muda o status.
-- leads.comprou_em / valor_comprado_centavos continuam sendo o resumo por aluno (lidos pelo
-- Sino e pelas Salas de Atendimento) e sao recalculados a partir desta tabela.
-- So adiciona tabela - roda com o sistema no ar.

CREATE TABLE IF NOT EXISTS webinar_vendas (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  webinar_id      BIGINT UNSIGNED NOT NULL,
  lead_id         BIGINT UNSIGNED NOT NULL,
  transacao_id    VARCHAR(64)  NOT NULL,                 -- id da Transaction na E4Pay
  checkout_slug   VARCHAR(150) NULL,
  email           VARCHAR(160) NULL,
  valor_centavos  INT UNSIGNED NOT NULL DEFAULT 0,
  metodo          VARCHAR(30)  NULL,                     -- credit_card, pix, boleto...
  status          ENUM('aprovada','reembolsada','chargeback','cancelada') NOT NULL DEFAULT 'aprovada',
  vinculo         ENUM('email','telefone') NOT NULL DEFAULT 'email', -- como o comprador foi ligado ao aluno
  pago_em         DATETIME NOT NULL,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vendas_transacao (transacao_id),
  INDEX idx_vendas_webinar_status (webinar_id, status),
  INDEX idx_vendas_pago_em (pago_em),
  INDEX idx_vendas_lead (lead_id),
  CONSTRAINT fk_vendas_webinar FOREIGN KEY (webinar_id) REFERENCES webinars(id) ON DELETE CASCADE,
  CONSTRAINT fk_vendas_lead    FOREIGN KEY (lead_id)    REFERENCES leads(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
