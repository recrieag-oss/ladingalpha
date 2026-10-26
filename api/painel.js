const fs = require('fs');
const path = require('path');
const { tokenOk } = require('./_store');

// Rota oculta: /painel/<ADMIN_TOKEN>. Token errado = 404 idêntico ao de uma página inexistente.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!tokenOk(req.query && req.query.token)) {
    res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('<!doctype html><title>404</title><h1>404 — Página não encontrada</h1>');
  }
  const html = fs.readFileSync(path.join(process.cwd(), 'private', 'painel.html'), 'utf8');
  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
};
