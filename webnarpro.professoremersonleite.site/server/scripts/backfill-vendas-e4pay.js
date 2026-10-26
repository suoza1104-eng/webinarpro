// Recupera as vendas aprovadas na E4Pay antes do webhook existir e liga cada uma ao aluno
// do webinar (mesma regra do webhook - services/vendas.js). Idempotente: pode rodar de novo.
//
// A E4Pay fica em outro banco (sem acesso pelo usuario do WebnarPRO), entao primeiro se exporta
// as transacoes aprovadas como TSV, como root no servidor (datas da E4Pay estao em UTC):
//   mysql -N -e "SELECT t.id, c.slug, t.clienteEmail, t.clienteTelefone, t.valorCentavos, t.metodo,
//     DATE_FORMAT(t.updatedAt, '%Y-%m-%dT%H:%i:%sZ') FROM \`Transaction\` t JOIN Checkout c ON c.id = t.checkoutId
//     WHERE t.status = 'aprovado' AND t.createdAt >= '2026-09-01'" professoremerson_4epay > /tmp/vendas-e4pay.tsv
// e depois, na pasta server do app:
//   node scripts/backfill-vendas-e4pay.js /tmp/vendas-e4pay.tsv
require('dotenv').config();
const fs = require('fs');
const pool = require('../src/db');
const vendas = require('../src/services/vendas');

async function main() {
  const arquivo = process.argv[2];
  if (!arquivo) throw new Error('uso: node scripts/backfill-vendas-e4pay.js <arquivo.tsv>');
  const linhas = fs.readFileSync(arquivo, 'utf8').split('\n').filter((l) => l.trim());
  const motivos = {};
  let registradas = 0;
  for (const linha of linhas) {
    const [transacaoId, checkoutSlug, email, telefone, valor, metodo, pagoEm] = linha.split('\t');
    const r = await vendas.registrarCompra({
      transacaoId,
      checkoutSlug,
      email,
      telefone: telefone === 'NULL' ? '' : telefone,
      valorCentavos: Number(valor) || 0,
      metodo,
      pagoEm: new Date(pagoEm),
    });
    if (r.registrada) registradas += 1;
    else motivos[r.motivo] = (motivos[r.motivo] || 0) + 1;
  }
  console.log(`${linhas.length} transacoes lidas, ${registradas} ligadas a alunos de webinar`);
  for (const [motivo, n] of Object.entries(motivos)) console.log(`  ${n} sem vinculo: ${motivo}`);
  const [porWebinar] = await pool.query(
    `SELECT w.id, w.nome, COUNT(*) AS vendas, COUNT(DISTINCT v.lead_id) AS compradores, SUM(v.valor_centavos) / 100 AS total,
            SUM(v.vinculo = 'telefone') AS pelo_telefone
     FROM webinar_vendas v JOIN webinars w ON w.id = v.webinar_id
     WHERE v.status = 'aprovada' GROUP BY w.id ORDER BY w.data_inicio`,
  );
  console.table(porWebinar);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
