const { addLead } = require('./_store');

const MAX = 120;
const clean = (v) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX);
const yesNo = (v) => (v === 'sim' || v === 'nao' ? v : '');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Requisição inválida' });

  // Honeypot: bots preenchem, humanos não. Responde ok sem salvar.
  if (clean(body.website)) return res.status(200).json({ ok: true });

  const lead = {
    nome: clean(body.nome),
    instagram: clean(body.instagram).replace(/^@+/, ''),
    whatsapp: clean(body.whatsapp).replace(/\D/g, '').slice(0, 13),
    jaUsou: yesNo(body.jaUsou),
    alunos: clean(body.alunos),
    revenda: yesNo(body.revenda),
    revendaMedia: clean(body.revendaMedia),
    produtosMes: clean(body.produtosMes),
    prazoFornecedor: clean(body.prazoFornecedor),
    estado: clean(body.estado).toUpperCase(),
    cidade: clean(body.cidade),
  };

  const missing = ['nome', 'instagram', 'whatsapp', 'jaUsou', 'alunos', 'revenda', 'estado', 'cidade'].filter((k) => !lead[k]);
  if (missing.length) return res.status(400).json({ error: 'Preencha todos os campos obrigatórios', fields: missing });
  if (lead.whatsapp.length < 10 || lead.whatsapp.length > 13) return res.status(400).json({ error: 'WhatsApp inválido', fields: ['whatsapp'] });

  try {
    await addLead(lead);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('lead:', e.message);
    return res.status(500).json({ error: 'Não foi possível enviar agora. Tente novamente.' });
  }
};
