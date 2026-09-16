const crypto = require('crypto');

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

function libraryId() {
  return process.env.BUNNY_LIBRARY_ID;
}

function apiKey() {
  return process.env.BUNNY_STREAM_API_KEY;
}

async function createVideo(title) {
  const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId()}/videos`, {
    method: 'POST',
    headers: { AccessKey: apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Bunny createVideo falhou: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getVideo(bunnyVideoId) {
  const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId()}/videos/${bunnyVideoId}`, {
    headers: { AccessKey: apiKey() },
  });
  if (!res.ok) throw new Error(`Bunny getVideo falhou: ${res.status} ${await res.text()}`);
  return res.json();
}

async function deleteVideo(bunnyVideoId) {
  const res = await fetch(`${BUNNY_API_BASE}/library/${libraryId()}/videos/${bunnyVideoId}`, {
    method: 'DELETE',
    headers: { AccessKey: apiKey() },
  });
  if (!res.ok) throw new Error(`Bunny deleteVideo falhou: ${res.status} ${await res.text()}`);
  return res.json();
}

// Assinatura TUS: SHA256(libraryId + apiKey + expiration + videoId)
function generateTusSignature(bunnyVideoId, expirationUnixSeconds) {
  const hash = crypto
    .createHash('sha256')
    .update(`${libraryId()}${apiKey()}${expirationUnixSeconds}${bunnyVideoId}`)
    .digest('hex');
  return hash;
}

// Status da Bunny: 0 Created, 1 Uploaded, 2 Processing, 3 Transcoding, 4 Finished, 5 Error, 6 UploadFailed
const BUNNY_STATUS_MAP = {
  0: 'enviando',
  1: 'processando',
  2: 'processando',
  3: 'processando',
  4: 'pronto',
  5: 'erro',
  6: 'erro',
};

function mapStatus(bunnyStatus) {
  return BUNNY_STATUS_MAP[bunnyStatus] || 'processando';
}

function playbackUrl(bunnyVideoId) {
  const host = process.env.BUNNY_CDN_HOSTNAME;
  return `https://${host}/${bunnyVideoId}/playlist.m3u8`;
}

function thumbnailUrl(bunnyVideoId, thumbnailFileName) {
  if (!thumbnailFileName) return null;
  const host = process.env.BUNNY_CDN_HOSTNAME;
  return `https://${host}/${bunnyVideoId}/${thumbnailFileName}`;
}

module.exports = {
  createVideo,
  getVideo,
  deleteVideo,
  generateTusSignature,
  mapStatus,
  playbackUrl,
  thumbnailUrl,
};
