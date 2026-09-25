ALTER TABLE webinars
  ADD COLUMN IF NOT EXISTS audiencia_min_participantes INT UNSIGNED NOT NULL DEFAULT 50 AFTER tipo_audiencia,
  ADD COLUMN IF NOT EXISTS audiencia_max_participantes INT UNSIGNED NOT NULL DEFAULT 65 AFTER audiencia_min_participantes,
  ADD COLUMN IF NOT EXISTS mostrar_botao_ao_vivo TINYINT(1) NOT NULL DEFAULT 1 AFTER audiencia_max_participantes;