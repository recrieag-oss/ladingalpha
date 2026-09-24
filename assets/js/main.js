/* ALPHA GOLD — interações (sem dependências) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Analytics: eventos dos botões WhatsApp ----------
     Compatível com GTM (dataLayer), GA4 (gtag) e Meta Pixel (fbq).
     Eventos: whatsapp_hero_click, whatsapp_mid_click,
              whatsapp_sticky_click, whatsapp_final_click */
  function track(eventName, el) {
    var payload = {
      event: eventName,
      cta_location: eventName.replace('whatsapp_', '').replace('_click', ''),
      link_url: el.href
    };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        cta_location: payload.cta_location,
        link_url: payload.link_url,
        transport_type: 'beacon'
      });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, { cta_location: payload.cta_location });
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (el) track(el.getAttribute('data-track'), el);
  });

  /* ---------- Ano no rodapé ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Reveal ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');

  // atraso escalonado entre irmãos do mesmo grupo
  ['.hero__content', '.bigwords', '.triad', '.cards'].forEach(function (sel) {
    var group = document.querySelector(sel);
    if (!group) return;
    group.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.setProperty('--d', (i * 0.1).toFixed(2) + 's');
    });
  });

  if (!hasIO || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Topbar sólida após o hero ---------- */
  var topbar = document.getElementById('topbar');

  /* ---------- Sticky CTA ----------
     Aparece depois que o CTA do hero sai da tela e se recolhe sempre que
     outro botão WhatsApp estiver visível (evita dois botões iguais na tela). */
  var sticky = document.getElementById('sticky-cta');
  var stickyLink = sticky && sticky.querySelector('a');
  var inlineCtas = document.querySelectorAll('.cta-block .btn-gold');
  var visibleCtas = new Set();
  var passedHero = false;

  function updateSticky() {
    var show = passedHero && visibleCtas.size === 0;
    sticky.classList.toggle('is-visible', show);
    sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
    stickyLink.tabIndex = show ? 0 : -1;
  }

  if (hasIO && sticky && inlineCtas.length) {
    var ctaIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visibleCtas.add(entry.target);
        else visibleCtas.delete(entry.target);
        if (entry.target.id === 'cta-hero') {
          passedHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        }
      });
      updateSticky();
    });
    inlineCtas.forEach(function (el) { ctaIO.observe(el); });
  }

  /* ---------- Scroll: topbar + parallax (um único rAF) ---------- */
  var parallaxEl = document.querySelector('[data-parallax]');
  var parallaxActive = false;
  var ticking = false;

  if (hasIO && parallaxEl && !reduceMotion) {
    new IntersectionObserver(function (entries) {
      parallaxActive = entries[0].isIntersecting;
    }).observe(parallaxEl.parentNode);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      topbar.classList.toggle('is-solid', y > 40);

      if (parallaxActive) {
        var box = parallaxEl.parentNode.getBoundingClientRect();
        var vh = window.innerHeight;
        // progresso de -1 a 1 enquanto a seção atravessa a tela
        var p = (box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2);
        parallaxEl.style.transform = 'translate3d(0,' + (p * 32).toFixed(1) + 'px,0)';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Partículas douradas (hero) ---------- */
  var canvas = document.getElementById('particles');
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var w = 0, h = 0, running = false, rafId = 0, inView = true;
    var COUNT = window.innerWidth < 768 ? 26 : 44;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(p, initial) {
      p.x = Math.random() * w;
      p.y = initial ? Math.random() * h : h + 10;
      p.r = Math.random() * 1.3 + 0.35;
      p.vy = -(Math.random() * 0.22 + 0.06);
      p.vx = (Math.random() - 0.5) * 0.08;
      p.a = Math.random() * 0.5 + 0.15;
      p.t = Math.random() * Math.PI * 2;
      return p;
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.t += 0.02;
        if (p.y < -10) spawn(p, false);
        var alpha = p.a * (0.6 + 0.4 * Math.sin(p.t));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(243,220,154,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; rafId = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(rafId); }

    // inicia depois do carregamento para não competir com o LCP
    window.addEventListener('load', function () {
      resize();
      for (var i = 0; i < COUNT; i++) particles.push(spawn({}, true));
      if (hasIO) {
        new IntersectionObserver(function (entries) {
          inView = entries[0].isIntersecting;
          inView ? start() : stop();
        }).observe(canvas);
      } else {
        start();
      }
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (inView && particles.length) start();
    });
  }
})();
