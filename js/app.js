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

  let timer;
  function update() {
    const diff = buildTarget() - new Date();
    if (diff <= 0) {
      clearInterval(timer);
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
  timer = setInterval(update, 1000);
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

      const info = document.createElement('div');
      info.className = 'item-info';
      if (item.observacao) info.title = item.observacao; // browsers encode title attribute safely

      const nome = document.createElement('div');
      nome.className = 'item-nome';
      nome.textContent = item.nome;

      const cat = document.createElement('div');
      cat.className = 'item-categoria';
      cat.textContent = item.categoria || '';

      info.appendChild(nome);
      info.appendChild(cat);

      if (item.cor_nome) {
        const badge = document.createElement('div');
        badge.className = 'item-cor-badge';
        const swatch = document.createElement('span');
        swatch.className = 'cor-swatch';
        // Validate hex color before setting inline style
        if (item.cor && /^#[0-9a-fA-F]{3,6}$/.test(item.cor)) {
          swatch.style.background = item.cor;
        } else {
          swatch.style.background = '#ccc';
        }
        badge.appendChild(swatch);
        badge.appendChild(document.createTextNode(item.cor_nome));
        info.appendChild(badge);
      }

      const btn = document.createElement('button');
      btn.className = 'btn btn-primary btn-ver-lojas';
      btn.style.cssText = 'white-space:nowrap;font-size:.82rem';
      btn.textContent = '🛍️ Ver nas lojas';
      btn.dataset.nome = item.nome;

      card.appendChild(info);
      card.appendChild(btn);
      grid.appendChild(card);
      itemObs.observe(card);
    });

    grid.querySelectorAll('.btn-ver-lojas').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window._openShopModal) window._openShopModal(btn.dataset.nome);
      });
    });
  }).catch(() => {
    grid.innerHTML = '<p class="lista-empty">Erro ao carregar a lista. Tente recarregar a página.</p>';
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

  // Cancel any in-flight ML fetch from a previous modal
  if (window._mlAbortController) window._mlAbortController.abort();
  window._mlAbortController = new AbortController();

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

  fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${q}&limit=5`, { signal: window._mlAbortController.signal })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      const results = data.results || [];
      if (!results.length) {
        document.getElementById('modal-body').innerHTML =
          '<p class="ml-error">Nenhum resultado no Mercado Livre. Use os botões acima.</p>';
        return;
      }
      const container = document.createElement('div');
      container.className = 'ml-results';

      results.forEach(r => {
        const item = document.createElement('div');
        item.className = 'ml-item';

        const img = document.createElement('img');
        img.className = 'ml-thumb';
        img.alt = '';
        img.loading = 'lazy';
        img.src = r.thumbnail || '';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'ml-info';

        const titleEl = document.createElement('div');
        titleEl.className = 'ml-title';
        titleEl.textContent = r.title;

        const priceEl = document.createElement('div');
        priceEl.className = 'ml-price';
        priceEl.textContent = r.price != null
          ? 'R$ ' + r.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          : 'Preço indisponível';

        infoDiv.appendChild(titleEl);
        infoDiv.appendChild(priceEl);

        const buyDiv = document.createElement('div');
        buyDiv.className = 'ml-buy';
        const buyLink = document.createElement('a');
        // Validate permalink is http/https before using
        if (r.permalink && /^https?:\/\//.test(r.permalink)) {
          buyLink.href = r.permalink;
        } else {
          buyLink.href = '#';
        }
        buyLink.target = '_blank';
        buyLink.rel = 'noopener';
        buyLink.className = 'btn btn-primary';
        buyLink.style.cssText = 'font-size:.8rem;padding:.5rem .8rem';
        buyLink.textContent = 'Comprar';
        buyDiv.appendChild(buyLink);

        item.appendChild(img);
        item.appendChild(infoDiv);
        item.appendChild(buyDiv);
        container.appendChild(item);
      });

      document.getElementById('modal-body').innerHTML = '';
      document.getElementById('modal-body').appendChild(container);
    })
    .catch(err => {
      if (err.name === 'AbortError') return;
      document.getElementById('modal-body').innerHTML =
        '<p class="ml-error">Não foi possível carregar. Use os botões acima.</p>';
    });
}

function closeModal() {
  if (window._mlAbortController) window._mlAbortController.abort();
  document.getElementById('modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}
