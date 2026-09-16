const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middlewares/auth');
const bunny = require('../services/bunny');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, nome_arquivo, bunny_video_id, duracao_segundos, tamanho_bytes,
            status_processamento, thumbnail_url, criado_em
     FROM videos WHERE account_id = ? ORDER BY criado_em DESC`,
    [req.accountId],
  );
  res.json(rows);
});

const uploadInitSchema = z.object({
  titulo: z.string().min(1).max(255),
});

router.post('/upload-init', async (req, res) => {
  const parsed = uploadInitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let bunnyVideo;
  try {
    bunnyVideo = await bunny.createVideo(parsed.data.titulo);
  } catch (err) {
    req.log.error(err, 'falha ao criar vídeo na Bunny');
    return res.status(502).json({ error: 'Falha ao iniciar upload na Bunny Stream' });
  }

  const [result] = await pool.query(
    `INSERT INTO videos (account_id, nome_arquivo, bunny_video_id, bunny_library_id, status_processamento)
     VALUES (?, ?, ?, ?, 'enviando')`,
    [req.accountId, parsed.data.titulo, bunnyVideo.guid, process.env.BUNNY_LIBRARY_ID],
  );

  const expirationUnixSeconds = Math.floor(Date.now() / 1000) + 3600;
  const signature = bunny.generateTusSignature(bunnyVideo.guid, expirationUnixSeconds);

  res.status(201).json({
    id: result.insertId,
    tusEndpoint: 'https://video.bunnycdn.com/tusupload',
    bunnyVideoId: bunnyVideo.guid,
    libraryId: process.env.BUNNY_LIBRARY_ID,
    expira: expirationUnixSeconds,
    assinatura: signature,
  });
});

router.get('/:id/status', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM videos WHERE id = ? AND account_id = ? LIMIT 1',
    [req.params.id, req.accountId],
  );
  const video = rows[0];
  if (!video) return res.status(404).json({ error: 'Vídeo não encontrado' });

  if (!video.bunny_video_id) return res.json(video);

  try {
    const bunnyData = await bunny.getVideo(video.bunny_video_id);
    const status = bunny.mapStatus(bunnyData.status);
    const thumb = bunny.thumbnailUrl(video.bunny_video_id, bunnyData.thumbnailFileName);

    await pool.query(
      `UPDATE videos SET status_processamento = ?, duracao_segundos = ?, tamanho_bytes = ?, thumbnail_url = ?
       WHERE id = ?`,
      [status, bunnyData.length || null, bunnyData.storageSize || null, thumb, video.id],
    );

    res.json({ ...video, status_processamento: status, duracao_segundos: bunnyData.length, thumbnail_url: thumb });
  } catch (err) {
    req.log.error(err, 'falha ao consultar status na Bunny');
    res.json(video);
  }
});

router.delete('/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT bunny_video_id FROM videos WHERE id = ? AND account_id = ? LIMIT 1',
    [req.params.id, req.accountId],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Vídeo não encontrado' });

  if (rows[0].bunny_video_id) {
    try {
      await bunny.deleteVideo(rows[0].bunny_video_id);
    } catch (err) {
      req.log.error(err, 'falha ao remover vídeo na Bunny');
    }
  }

  await pool.query('DELETE FROM videos WHERE id = ? AND account_id = ?', [req.params.id, req.accountId]);
  res.json({ ok: true });
});

module.exports = router;
