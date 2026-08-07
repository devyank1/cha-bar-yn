const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email':     'Email inválido.',
  'auth/user-not-found':    'Usuário não encontrado.',
  'auth/wrong-password':    'Senha incorreta.',
  'auth/invalid-credential':'Email ou senha incorretos.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.'
};

document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(user => {
    document.getElementById('login-screen').style.display = user ? 'none'  : 'flex';
    document.getElementById('admin-panel').style.display  = user ? 'block' : 'none';
    if (user) initAdmin();
  });

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('senha').value;
    try {
      await firebase.auth().signInWithEmailAndPassword(email, senha);
    } catch (err) {
      document.getElementById('login-error').textContent =
        AUTH_ERROR_MESSAGES[err.code] || 'Erro ao entrar. Tente novamente.';
      showAlert('login-error');
    }
  });

  document.getElementById('btn-esqueci-senha').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
      document.getElementById('login-error').textContent = 'Digite seu email acima primeiro.';
      showAlert('login-error');
      return;
    }
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      document.getElementById('login-error').textContent = 'Email de redefinição enviado!';
      document.getElementById('login-error').style.color = 'green';
      showAlert('login-error');
    } catch (err) {
      document.getElementById('login-error').style.color = '';
      document.getElementById('login-error').textContent =
        AUTH_ERROR_MESSAGES[err.code] || 'Erro ao enviar email.';
      showAlert('login-error');
    }
  });

  document.getElementById('btn-sair').addEventListener('click', () => firebase.auth().signOut());
});

function showAlert(id) {
  const el = document.getElementById(id);
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

/* ── Init ── */
function initAdmin() {
  loadAdminEvento();
  loadAdminItens();
  loadReservados();
  initEventoForm();
  initItemForm();
}

/* ── Evento ── */
function loadAdminEvento() {
  db.ref('/evento').once('value').then(s => {
    const ev = s.val() || {};
    if (ev.hora)            document.getElementById('ev-hora').value    = ev.hora;
    if (ev.local)           document.getElementById('ev-local').value   = ev.local;
    if (ev.endereco)        document.getElementById('ev-endereco').value = ev.endereco;
    if (ev.frase_hero)      document.getElementById('ev-frase').value   = ev.frase_hero;
    if (ev.mensagem_footer) document.getElementById('ev-footer').value  = ev.mensagem_footer;
  }).catch(() => {
    // silently fail — event form just stays blank
  });
}

function initEventoForm() {
  document.getElementById('form-evento').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await db.ref('/evento').set({
        hora:            document.getElementById('ev-hora').value,
        local:           document.getElementById('ev-local').value,
        endereco:        document.getElementById('ev-endereco').value,
        frase_hero:      document.getElementById('ev-frase').value,
        mensagem_footer: document.getElementById('ev-footer').value
      });
      showAlert('alert-evento');
    } catch { showAlert('alert-evento-err'); }
  });
}

/* ── Itens ── */
function loadAdminItens() {
  db.ref('/itens').once('value').then(s => {
    const data   = s.val();
    const tbody  = document.getElementById('items-tbody');

    if (!data) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);font-style:italic">Nenhum item ainda.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    Object.entries(data).forEach(([key, item]) => {
      const tr = document.createElement('tr');

      // Foto cell
      const tdFoto = document.createElement('td');
      if (item.foto && /^https?:\/\//.test(item.foto)) {
        const thumb = document.createElement('img');
        thumb.className = 'admin-thumb';
        thumb.src = item.foto;
        thumb.alt = '';
        thumb.loading = 'lazy';
        tdFoto.appendChild(thumb);
      } else {
        tdFoto.textContent = '—';
      }

      // Nome cell
      const tdNome = document.createElement('td');
      tdNome.textContent = item.nome || '';

      // Categoria cell
      const tdCat = document.createElement('td');
      tdCat.textContent = item.categoria || '—';

      // Obs cell
      const tdObs = document.createElement('td');
      tdObs.style.fontSize = '.8rem';
      tdObs.style.color = 'var(--text-muted)';
      tdObs.textContent = item.observacao || '—';

      // Actions cell
      const tdActions = document.createElement('td');
      const actDiv = document.createElement('div');
      actDiv.className = 'table-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = 'Editar';
      editBtn.dataset.key = key;

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.textContent = 'Excluir';
      delBtn.dataset.key = key;

      actDiv.appendChild(editBtn);
      actDiv.appendChild(delBtn);
      tdActions.appendChild(actDiv);

      tr.appendChild(tdFoto);
      tr.appendChild(tdNome);
      tr.appendChild(tdCat);
      tr.appendChild(tdObs);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', () => editItem(btn.dataset.key, data[btn.dataset.key]))
    );
    tbody.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => deleteItem(btn.dataset.key))
    );
  }).catch(() => {
    document.getElementById('items-tbody').innerHTML =
      '<tr><td colspan="5" style="color:#c0392b;font-style:italic">Erro ao carregar itens. Verifique a conexão.</td></tr>';
  });
}

function initItemForm() {
  const form      = document.getElementById('form-item');
  const cancelBtn = document.getElementById('btn-cancelar-edit');

  const fotoInput = document.getElementById('item-foto');
  fotoInput.addEventListener('input', () => updateFotoPreview(fotoInput.value.trim()));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const key  = document.getElementById('item-key').value;
    const data = {
      nome:       document.getElementById('item-nome').value.trim(),
      categoria:  document.getElementById('item-categoria').value,
      foto:       document.getElementById('item-foto').value.trim(),
      observacao: document.getElementById('item-obs').value.trim()
    };
    if (!data.nome) return;

    try {
      if (key) {
        await db.ref(`/itens/${key}`).set(data);
      } else {
        await db.ref('/itens').push(data);
      }
      resetItemForm();
      showAlert('alert-item');
      loadAdminItens();
    } catch { showAlert('alert-item-err'); }
  });

  cancelBtn.addEventListener('click', resetItemForm);
}

function updateFotoPreview(url) {
  const img = document.getElementById('item-foto-preview');
  if (url && /^https?:\/\//.test(url)) {
    img.src = url;
    img.style.display = 'block';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
  }
}

function resetItemForm() {
  document.getElementById('form-item').reset();
  document.getElementById('item-key').value          = '';
  document.getElementById('item-foto').value         = '';
  updateFotoPreview('');
  document.getElementById('form-item-title').textContent = '➕ Adicionar Item';
  document.getElementById('btn-salvar-item').textContent  = '➕ Adicionar';
  document.getElementById('btn-cancelar-edit').style.display = 'none';
}

function editItem(key, item) {
  document.getElementById('item-key').value       = key;
  document.getElementById('item-nome').value      = item.nome;
  document.getElementById('item-categoria').value = item.categoria || 'Outros';
  document.getElementById('item-foto').value      = item.foto || '';
  updateFotoPreview(item.foto || '');
  document.getElementById('item-obs').value       = item.observacao || '';
  document.getElementById('form-item-title').textContent = '✏️ Editar Item';
  document.getElementById('btn-salvar-item').textContent  = '💾 Salvar alterações';
  document.getElementById('btn-cancelar-edit').style.display = 'inline-flex';
  document.getElementById('form-item').scrollIntoView({ behavior: 'smooth' });
}

async function deleteItem(key) {
  if (!confirm('Excluir este item da lista?')) return;
  try {
    await db.ref(`/itens/${key}`).remove();
    loadAdminItens();
  } catch { alert('Erro ao excluir.'); }
}

async function reabrirItem(key) {
  if (!confirm('Reabrir este presente? Volta a aparecer como disponível para os convidados.')) return;
  try {
    await db.ref(`/reservas/${key}`).remove();
    loadReservados();
  } catch { alert('Erro ao reabrir.'); }
}

/* ── Presentes já escolhidos ── */
function loadReservados() {
  Promise.all([
    db.ref('/itens').once('value'),
    db.ref('/reservas').once('value')
  ]).then(([sItens, sReservas]) => {
    const itens    = sItens.val() || {};
    const reservas = sReservas.val() || {};
    const tbody    = document.getElementById('reservados-tbody');
    const keys     = Object.keys(reservas).filter(k => itens[k]);

    if (!keys.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);font-style:italic">Nenhum presente escolhido ainda.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    keys.forEach(key => {
      const item = itens[key];
      const r    = reservas[key];
      const tr   = document.createElement('tr');

      const tdFoto = document.createElement('td');
      if (item.foto && /^https?:\/\//.test(item.foto)) {
        const thumb = document.createElement('img');
        thumb.className = 'admin-thumb';
        thumb.src = item.foto;
        thumb.alt = '';
        thumb.loading = 'lazy';
        tdFoto.appendChild(thumb);
      } else {
        tdFoto.textContent = '—';
      }

      const tdNome = document.createElement('td');
      tdNome.textContent = item.nome || '';

      const tdQuem = document.createElement('td');
      tdQuem.textContent = (r && r.nome) ? r.nome : '—';

      const tdContato = document.createElement('td');
      tdContato.textContent = (r && r.contato) ? r.contato : '—';

      const tdAct = document.createElement('td');
      const reabrirBtn = document.createElement('button');
      reabrirBtn.className = 'btn-edit';
      reabrirBtn.textContent = 'Reabrir';
      reabrirBtn.dataset.reabrir = key;
      tdAct.appendChild(reabrirBtn);

      tr.appendChild(tdFoto);
      tr.appendChild(tdNome);
      tr.appendChild(tdQuem);
      tr.appendChild(tdContato);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-reabrir]').forEach(btn =>
      btn.addEventListener('click', () => reabrirItem(btn.dataset.reabrir))
    );
  }).catch(() => {
    document.getElementById('reservados-tbody').innerHTML =
      '<tr><td colspan="5" style="color:#c0392b;font-style:italic">Erro ao carregar. Verifique a conexão.</td></tr>';
  });
}
