(function () {
  'use strict';
  var form = document.getElementById('form');
  var errorEl = document.getElementById('error');
  var btn = document.getElementById('submit');
  var revendaFields = form.querySelectorAll('[data-revenda]');

  function val(name) { var el = form.elements[name]; return el ? el.value.trim() : ''; }

  // Campos de revenda só aparecem se "Trabalha com revenda?" = Sim
  function syncRevenda() {
    var sim = val('revenda') === 'sim';
    revendaFields.forEach(function (f) { f.hidden = !sim; });
  }
  form.addEventListener('change', function (e) { if (e.target.name === 'revenda') syncRevenda(); });
  syncRevenda();

  // Máscara (00) 00000-0000
  form.elements.whatsapp.addEventListener('input', function (e) {
    var d = e.target.value.replace(/\D/g, '').slice(0, 11);
    var cut = d.length > 10 ? 7 : 6;
    var out = d;
    if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, cut) + (d.length > cut ? '-' + d.slice(cut) : '');
    e.target.value = out;
  });
  form.elements.estado.addEventListener('input', function (e) { e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase(); });

  function mark(name, bad) {
    var el = form.elements[name];
    var field = el && (el.closest ? el.closest('.field') : (el[0] && el[0].closest('.field')));
    if (field) field.classList.toggle('is-invalid', bad);
  }

  function fail(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    var required = ['nome', 'instagram', 'whatsapp', 'jaUsou', 'alunos', 'revenda', 'estado', 'cidade'];
    var bad = required.filter(function (n) { return !val(n); });
    var wa = val('whatsapp').replace(/\D/g, '');
    if (wa && (wa.length < 10 || wa.length > 11) && bad.indexOf('whatsapp') < 0) bad.push('whatsapp');
    required.concat(['revendaMedia', 'produtosMes', 'prazoFornecedor']).forEach(function (n) { mark(n, bad.indexOf(n) >= 0); });
    if (bad.length) {
      fail(bad.indexOf('whatsapp') >= 0 && wa ? 'Confira o número de WhatsApp.' : 'Preencha todos os campos obrigatórios.');
      var first = form.elements[bad[0]];
      (first.focus ? first : first[0]).focus();
      return;
    }

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
    if (data.revenda !== 'sim') { data.revendaMedia = data.produtosMes = data.prazoFornecedor = ''; }

    btn.disabled = true;
    btn.firstElementChild.textContent = 'Enviando…';
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.body && r.body.error || 'Erro ao enviar');
        form.hidden = true;
        document.querySelector('.sel__sub').hidden = true;
        document.getElementById('done').hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.fbq) window.fbq('trackCustom', 'seletiva_enviada');
      })
      .catch(function (err) {
        fail(err.message === 'Failed to fetch' ? 'Sem conexão. Tente novamente.' : err.message);
        btn.disabled = false;
        btn.firstElementChild.textContent = 'Enviar candidatura';
      });
  });
})();
