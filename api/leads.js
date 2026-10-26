const { listLeads, tokenOk } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!tokenOk(req.headers['x-admin-token'])) return res.status(404).json({ error: 'Not found' });
  try {
    return res.status(200).json({ leads: await listLeads() });
  } catch (e) {
    console.error('leads:', e.message);
    return res.status(500).json({ error: 'Erro ao carregar' });
  }
};
