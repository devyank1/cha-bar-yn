document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  initScrollAnimations();
  initCountdown('2026-11-14');
  loadEvento();
  loadItens();
  initModal();
}

function initScrollAnimations() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.15 }
  );
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

function initCountdown(dateStr) {
  let targetHour = '12:00';

  function buildTarget() {
    const [h, m] = targetHour.split(':').map(Number);
    return new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
  }

  function update() {
    const diff = buildTarget() - new Date();
    if (diff <= 0) {
      document.getElementById('countdown-grid').innerHTML =
        '<p class="countdown-arrived">O grande dia chegou! 🏠</p>';
      return;
    }
    document.getElementById('cd-days').textContent    = String(Math.floor(diff/86400000)).padStart(2,'0');
    document.getElementById('cd-hours').textContent   = String(Math.floor((diff%86400000)/3600000)).padStart(2,'0');
    document.getElementById('cd-minutes').textContent = String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
    document.getElementById('cd-seconds').textContent = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
  }

  update();
  setInterval(update, 1000);
  window._setCountdownHour = hora => { targetHour = hora || '12:00'; };
}

function loadEvento() {
  db.ref('/evento').once('value').then(snapshot => {
    const ev = snapshot.val() || {};

    if (ev.frase_hero)
      document.getElementById('hero-frase').textContent = ev.frase_hero;

    if (ev.hora) {
      document.getElementById('evento-hora').textContent = ev.hora + 'h';
      if (window._setCountdownHour) window._setCountdownHour(ev.hora);
    }

    if (ev.local) {
      document.getElementById('evento-local').textContent = ev.local;
      if (ev.endereco) {
        const link = document.getElementById('mapa-link');
        link.href = 'https://www.google.com/maps/search/' + encodeURIComponent(ev.endereco);
        link.style.display = 'inline-flex';
      }
    }

    if (ev.mensagem_footer)
      document.getElementById('footer-message').textContent = ev.mensagem_footer;
  });
}

function loadItens() {
  const grid = document.getElementById('lista-grid');
  const itemObs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.1 }
  );

  db.ref('/itens').once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      grid.innerHTML = '<p class="lista-empty">A lista de presentes será revelada em breve! 🎁</p>';
      return;
    }

    grid.innerHTML = '';
    Object.values(data).forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card fade-in';
      const corStyle = item.cor ? `background:${item.cor}` : 'background:#ccc';
      const corNome  = item.cor_nome || '';
      const obs      = item.observacao ? ` title="${item.observacao}"` : '';

      card.innerHTML = `
        <div class="item-info"${obs}>
          <div class="item-nome">${item.nome}</div>
          <div class="item-categoria">${item.categoria || ''}</div>
          ${corNome ? `<div class="item-cor-badge"><span class="cor-swatch" style="${corStyle}"></span>${corNome}</div>` : ''}
        </div>
        <button class="btn btn-primary btn-ver-lojas" data-nome="${item.nome}" style="white-space:nowrap;font-size:.82rem">
          🛍️ Ver nas lojas
        </button>
      `;

      grid.appendChild(card);
      itemObs.observe(card);
    });

    grid.querySelectorAll('.btn-ver-lojas').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window._openShopModal) window._openShopModal(btn.dataset.nome);
      });
    });
  });
}

function initModal() {
  const backdrop = document.getElementById('modal-backdrop');
  document.getElementById('modal-close').addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  window._openShopModal = nome => openShopModal(nome);
}

function openShopModal(itemNome) {
  const backdrop = document.getElementById('modal-backdrop');
  const q = encodeURIComponent(itemNome);

  document.getElementById('modal-item-nome').textContent = itemNome;
  document.getElementById('modal-body').innerHTML = '<div class="spinner"></div>';
  document.getElementById('modal-stores').innerHTML = `
    <a href="https://www.magazineluiza.com.br/busca/${q}" target="_blank" rel="noopener" class="store-btn">Magazine Luiza</a>
    <a href="https://www.amazon.com.br/s?k=${q}" target="_blank" rel="noopener" class="store-btn">Amazon</a>
    <a href="https://www.americanas.com.br/busca/${q}" target="_blank" rel="noopener" class="store-btn">Americanas</a>
    <a href="https://shopee.com.br/search?keyword=${q}" target="_blank" rel="noopener" class="store-btn">Shopee</a>
  `;

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${q}&limit=5`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      const results = data.results || [];
      if (!results.length) {
        document.getElementById('modal-body').innerHTML =
          '<p class="ml-error">Nenhum resultado no Mercado Livre. Use os botões acima.</p>';
        return;
      }
      document.getElementById('modal-body').innerHTML =
        '<div class="ml-results">' +
        results.map(r => `
          <div class="ml-item">
            <img class="ml-thumb" src="${r.thumbnail}" alt="" loading="lazy">
            <div class="ml-info">
              <div class="ml-title">${r.title}</div>
              <div class="ml-price">R$ ${r.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
            </div>
            <div class="ml-buy">
              <a href="${r.permalink}" target="_blank" rel="noopener" class="btn btn-primary" style="font-size:.8rem;padding:.5rem .8rem">Comprar</a>
            </div>
          </div>
        `).join('') +
        '</div>';
    })
    .catch(() => {
      document.getElementById('modal-body').innerHTML =
        '<p class="ml-error">Não foi possível carregar. Use os botões acima.</p>';
    });
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}
