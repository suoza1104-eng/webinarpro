// Integração puxada pelo "sino" (sistema de automação de WhatsApp) - ele chama esses
// endpoints periodicamente pra saber quem assistiu a live, quem chegou no pitch/oferta
// e quem clicou em comprar, e dispara as campanhas dele a partir disso. Autenticação
// por chave compartilhada (Authorization: Bearer <SINO_API_KEY>), nao por JWT de
// admin - e um sistema externo chamando, nao uma sessao de usuario.
const express = require('express');
const pool = require('../db');

const router = express.Router();

function requireIntegrationKey(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !process.env.SINO_API_KEY || token !== process.env.SINO_API_KEY) {
    return res.status(401).json({ error: 'Chave de integração inválida' });
  }
  next();
}

router.use(requireIntegrationKey);

// Lista os webinars da conta, com dados da oferta (link de checkout, preço, segundo
// de início) - usado pelo sino pra saber o contexto de cada participante sincronizado.
router.get('/webinars', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.id, w.nome, w.titulo, w.slug, w.status, w.data_inicio,
            v.duracao_segundos,
            oc.nome_oferta, oc.link_checkout, oc.preco_oferta_centavos, oc.inicio_oferta_segundos,
            (SELECT COUNT(*) FROM leads WHERE webinar_id = w.id) AS cadastrados,
            (SELECT COUNT(*) FROM view_sessions WHERE webinar_id = w.id AND is_replay = 0) AS entraram
     FROM webinars w
     LEFT JOIN videos v ON v.id = w.video_id
     LEFT JOIN webinar_offer_config oc ON oc.webinar_id = w.id
     ORDER BY w.data_inicio DESC`,
  );
  res.json(rows.map((w) => ({
    id: w.id,
    nome: w.nome,
    titulo: w.titulo,
    slug: w.slug,
    status: w.status,
    data_inicio: w.data_inicio,
    duracao_segundos: w.duracao_segundos,
    oferta: w.nome_oferta ? {
      nome: w.nome_oferta,
      link_checkout: w.link_checkout || null,
      preco_centavos: w.preco_oferta_centavos,
      inicio_segundos: w.inicio_oferta_segundos,
    } : null,
    cadastrados: w.cadastrados,
    entraram: w.entraram,
  })));
});

// Sincronização incremental por cursor: devolve quem teve a sessão de visualização
// (ao vivo, nunca replay) atualizada desde `desde`, até `limite` por página, com
// `proximo` pra continuar de onde parou na próxima chamada.
router.get('/participantes', async (req, res) => {
  const desde = req.query.desde ? new Date(req.query.desde) : new Date(0);
  const limite = Math.min(500, Math.max(1, Number(req.query.limite) || 500));
  if (Number.isNaN(desde.getTime())) return res.status(400).json({ error: 'Parâmetro "desde" inválido' });

  const [rows] = await pool.query(
    `SELECT l.id AS lead_id, vs.webinar_id, l.nome, l.email, l.whatsapp,
            l.criado_em AS cadastrado_em, vs.entrou_em, vs.ultimo_marco_pct, vs.max_segundos,
            vs.clicou_compra_em, vs.atualizado_em
     FROM view_sessions vs
     JOIN leads l ON l.id = vs.lead_id
     WHERE vs.is_replay = 0 AND vs.atualizado_em > ?
     ORDER BY vs.atualizado_em ASC
     LIMIT ?`,
    [desde, limite],
  );

  const participantes = rows.map((r) => ({
    lead_id: r.lead_id,
    webinar_id: r.webinar_id,
    nome: r.nome,
    email: r.email,
    whatsapp: r.whatsapp,
    cadastrado_em: r.cadastrado_em,
    entrou_em: r.entrou_em,
    ultimo_marco_pct: r.ultimo_marco_pct,
    max_segundos: r.max_segundos,
    clicou_compra_em: r.clicou_compra_em,
    atualizado_em: r.atualizado_em,
  }));

  const proximo = rows.length === limite ? rows[rows.length - 1].atualizado_em : null;
  res.json({ participantes, proximo });
});

module.exports = router;
