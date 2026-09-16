const express = require('express');
const pool = require('../db');

const router = express.Router();

// ETAPA 7a — dados públicos da sala (antes do cadastro do lead)
router.get('/webinars/:slug', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.titulo, w.nome_apresentador, w.avatar_apresentador_url, w.status,
            w.data_inicio, w.data_fim, w.fuso_horario, w.usar_sala_espera
     FROM webinars w
     WHERE w.slug = ? LIMIT 1`,
    [req.params.slug],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Webinar não encontrado' });

  const w = rows[0];
  const [loginConfigRows] = await pool.query(
    `SELECT lc.* FROM webinar_login_config lc
     JOIN webinars w ON w.id = lc.webinar_id
     WHERE w.slug = ? LIMIT 1`,
    [req.params.slug],
  );

  res.json({
    titulo: w.titulo,
    nomeApresentador: w.nome_apresentador,
    avatarApresentadorUrl: w.avatar_apresentador_url,
    status: w.status,
    dataInicio: w.data_inicio,
    dataFim: w.data_fim,
    fusoHorario: w.fuso_horario,
    usarSalaEspera: !!w.usar_sala_espera,
    loginConfig: loginConfigRows[0] || null,
  });
});

module.exports = router;
