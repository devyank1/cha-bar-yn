// SHA-256 of the admin password — change password by updating this hash
// To get a new hash: run sha256('new_password') in browser console after logging in
const PASSWORD_HASH = 'e6831fb6232e3262ed32bf2eacf4f58eb7ddb5ca853f2e98eb76cf766150e42b';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const hash = await sha256(document.getElementById('senha').value);
    if (hash === PASSWORD_HASH) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-panel').style.display  = 'block';
      initAdmin();
    } else {
      const err = document.getElementById('login-error');
      err.style.display = 'block';
      setTimeout(() => { err.style.display = 'none'; }, 3000);
    }
  });

  document.getElementById('btn-sair').addEventListener('click', () => location.reload());
});

async function sha256(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function showAlert(id) {
  const el = document.getElementById(id);
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

/* ── Init ── */
function initAdmin() {
  loadAdminEvento();
  loadAdminItens();
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
      const swatch = item.cor
        ? `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${item.cor};border:1px solid #ccc;vertical-align:middle;margin-right:4px"></span>`
        : '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.nome}</td>
        <td>${item.categoria || '—'}</td>
        <td><div class="table-cor">${swatch}${item.cor_nome || ''}</div></td>
        <td style="font-size:.8rem;color:var(--text-muted)">${item.observacao || '—'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-edit"   data-key="${key}">Editar</button>
            <button class="btn-delete" data-key="${key}">Excluir</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', () => editItem(btn.dataset.key, data[btn.dataset.key]))
    );
    tbody.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => deleteItem(btn.dataset.key))
    );
  });
}

function initItemForm() {
  const form      = document.getElementById('form-item');
  const cancelBtn = document.getElementById('btn-cancelar-edit');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const key  = document.getElementById('item-key').value;
    const data = {
      nome:       document.getElementById('item-nome').value.trim(),
      categoria:  document.getElementById('item-categoria').value,
      cor:        document.getElementById('item-cor').value,
      cor_nome:   document.getElementById('item-cor-nome').value.trim(),
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

function resetItemForm() {
  document.getElementById('form-item').reset();
  document.getElementById('item-key').value          = '';
  document.getElementById('item-cor').value          = '#555555';
  document.getElementById('form-item-title').textContent = '➕ Adicionar Item';
  document.getElementById('btn-salvar-item').textContent  = '➕ Adicionar';
  document.getElementById('btn-cancelar-edit').style.display = 'none';
}

function editItem(key, item) {
  document.getElementById('item-key').value       = key;
  document.getElementById('item-nome').value      = item.nome;
  document.getElementById('item-categoria').value = item.categoria || 'Outros';
  document.getElementById('item-cor').value       = item.cor || '#555555';
  document.getElementById('item-cor-nome').value  = item.cor_nome || '';
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
