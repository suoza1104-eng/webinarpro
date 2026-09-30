const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_EXT.includes(path.extname(file.originalname).toLowerCase()));
  },
});

router.post('/image', (req, res) => {
  upload.single('imagem')(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Falha no envio: ' + err.message });
    if (!req.file) return res.status(400).json({ error: 'Envie uma imagem PNG, JPG, WEBP ou GIF de até 5MB.' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

module.exports = router;
