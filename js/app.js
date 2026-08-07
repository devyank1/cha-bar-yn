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
    (entries, o) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); }
    }),
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
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
  db.ref('/evento').on('value', snapshot => {
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
  }, () => {
    // Firebase read failed — event section keeps placeholder text
  });
}

let _itensData   = null;
let _reservasData = {};
let _itemObs     = null;

function loadItens() {
  _itemObs = new IntersectionObserver(
    (entries, o) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); }
    }),
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
  );

  db.ref('/itens').on('value', snapshot => {
    _itensData = snapshot.val();
    renderLista();
  }, () => {
    document.getElementById('lista-grid').innerHTML =
      '<p class="lista-empty">Erro ao carregar a lista. Tente recarregar a página.</p>';
  });

  db.ref('/reservas').on('value', snapshot => {
    _reservasData = snapshot.val() || {};
    renderLista();
  });
}

// Ordem e rótulo das seções. Categorias fora desta lista caem em "Outros".
const SECAO_ORDEM = [
  { cat: 'Cozinha',  icone: '🍳' },
  { cat: 'Banheiro', icone: '🛁' },
  { cat: 'Quarto',   icone: '🛏️' },
  { cat: 'Sala',     icone: '🛋️' },
  { cat: 'Outros',   icone: '🎁' }
];

function renderLista() {
  const grid = document.getElementById('lista-grid');
  if (_itensData === null) return; // itens ainda carregando

  const entries = Object.entries(_itensData || {});
  if (!entries.length) {
    grid.innerHTML = '<p class="lista-empty">A lista de presentes será revelada em breve! 🎁</p>';
    return;
  }

  // Agrupa itens por seção
  const grupos = {};
  entries.forEach(([key, item]) => {
    const cat = SECAO_ORDEM.some(s => s.cat === item.categoria) ? item.categoria : 'Outros';
    (grupos[cat] = grupos[cat] || []).push([key, item]);
  });

  grid.innerHTML = '';
  SECAO_ORDEM.forEach(({ cat, icone }) => {
    const itens = grupos[cat];
    if (!itens || !itens.length) return; // seção vazia não aparece

    const secao = document.createElement('div');
    secao.className = 'lista-secao fade-in';

    const titulo = document.createElement('h3');
    titulo.className = 'lista-secao-titulo';
    titulo.textContent = `${icone} ${cat}`;
    secao.appendChild(titulo);

    const secaoGrid = document.createElement('div');
    secaoGrid.className = 'lista-secao-grid';

    itens.forEach(([key, item]) => secaoGrid.appendChild(buildItemCard(key, item)));

    secao.appendChild(secaoGrid);
    grid.appendChild(secao);
    _itemObs.observe(secao);
  });
}

function buildItemCard(key, item) {
  const reservado = !!_reservasData[key];

  const card = document.createElement('div');
  card.className = 'item-card' + (reservado ? ' reserved' : '');

  if (item.foto && /^https?:\/\//.test(item.foto)) {
    const foto = document.createElement('img');
    foto.className = 'item-foto';
    foto.src = item.foto;
    foto.alt = '';
    foto.loading = 'lazy';
    card.appendChild(foto);
  }

  const info = document.createElement('div');
  info.className = 'item-info';

  const nome = document.createElement('div');
  nome.className = 'item-nome';
  nome.textContent = item.nome;
  info.appendChild(nome);

  if (item.observacao) {
    const desc = document.createElement('div');
    desc.className = 'item-desc';
    desc.textContent = item.observacao;
    info.appendChild(desc);
  }

  if (reservado) {
    const badge = document.createElement('div');
    badge.className = 'item-reservado';
    badge.textContent = '💝 Presente já escolhido';
    info.appendChild(badge);
    card.appendChild(info);

    const done = document.createElement('button');
    done.className = 'btn btn-ver-lojas btn-reservado';
    done.disabled = true;
    done.textContent = '✔ Já comprado';
    card.appendChild(done);
  } else {
    card.appendChild(info);

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-ver-lojas';
    btn.style.cssText = 'white-space:nowrap;font-size:.82rem';
    btn.textContent = '🛍️ Ver nas lojas';
    btn.addEventListener('click', () => {
      if (window._openShopModal) window._openShopModal(key, item.nome);
    });
    card.appendChild(btn);
  }

  return card;
}

function initModal() {
  const backdrop = document.getElementById('modal-backdrop');
  document.getElementById('modal-close').addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  window._openShopModal = (key, nome) => openShopModal(key, nome);
}

function openShopModal(itemKey, itemNome) {
  const backdrop = document.getElementById('modal-backdrop');

  document.getElementById('modal-item-nome').textContent = itemNome;

  const storesContainer = document.getElementById('modal-stores');

  // (Re)constrói os links das lojas conforme a cor escolhida
  function buildStores(termo) {
    const q = encodeURIComponent(termo);
    storesContainer.innerHTML = '';
    const stores = [
      { label: 'Magazine Luiza', url: `https://www.magazineluiza.com.br/busca/${q}` },
      { label: 'Amazon',         url: `https://www.amazon.com.br/s?k=${q}` },
      { label: 'Mercado Livre',  url: `https://lista.mercadolivre.com.br/${q}` },
      { label: 'Shopee',         url: `https://shopee.com.br/search?keyword=${q}` },
      { label: 'Havan',          url: `https://www.havan.com.br/busca?q=${q}` }
    ];
    stores.forEach(s => {
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.className = 'store-btn';
      a.textContent = s.label;
      storesContainer.appendChild(a);
    });
  }
  buildStores(itemNome);

  // Seletor de cor (acima das lojas). Escolher cor refaz a busca com a cor.
  const coresEl = document.getElementById('modal-cores');
  coresEl.innerHTML = '';
  const corLabel = document.createElement('span');
  corLabel.className = 'modal-cor-label';
  corLabel.textContent = 'Escolha a cor do presente:';
  coresEl.appendChild(corLabel);
  window.COLOR_PALETTE.forEach(c => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cor-pick-dot';
    dot.style.background = c.css;
    dot.title = c.nome;
    dot.setAttribute('aria-label', c.nome);
    dot.addEventListener('click', () => {
      coresEl.querySelectorAll('.cor-pick-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      buildStores(`${itemNome} ${c.nome}`);
    });
    coresEl.appendChild(dot);
  });

  // Corpo: instrução + botão "já comprei"
  const body = document.getElementById('modal-body');
  body.innerHTML = '';

  const hint = document.createElement('p');
  hint.className = 'modal-hint';
  hint.textContent = 'Já comprou este presente? Marque abaixo para ninguém repetir. 💝';
  body.appendChild(hint);

  const nomeInput = document.createElement('input');
  nomeInput.type = 'text';
  nomeInput.className = 'modal-input';
  nomeInput.placeholder = 'Seu nome';
  body.appendChild(nomeInput);

  const contatoInput = document.createElement('input');
  contatoInput.type = 'text';
  contatoInput.className = 'modal-input';
  contatoInput.placeholder = 'Seu contato (WhatsApp/telefone)';
  body.appendChild(contatoInput);

  const reserveBtn = document.createElement('button');
  reserveBtn.className = 'btn btn-primary btn-reservar';
  reserveBtn.textContent = '✅ Já comprei este presente';
  reserveBtn.addEventListener('click', () =>
    reservarItem(itemKey, reserveBtn, nomeInput.value, contatoInput.value));
  body.appendChild(reserveBtn);

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function reservarItem(key, btn, nome, contato) {
  const quem     = (nome || '').trim();
  const quemZap  = (contato || '').trim();
  btn.disabled = true;
  btn.textContent = 'Marcando...';
  db.ref('/reservas/' + key).set({ nome: quem, contato: quemZap, ts: Date.now() })
    .then(() => { closeModal(); })
    .catch(() => {
      btn.disabled = false;
      btn.textContent = '✅ Já comprei este presente';
      alert('Esse presente já foi escolhido por outra pessoa. 💝');
    });
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}
