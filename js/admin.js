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
      showAlert('login-error');
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

      // Nome cell
      const tdNome = document.createElement('td');
      tdNome.textContent = item.nome || '';

      // Categoria cell
      const tdCat = document.createElement('td');
      tdCat.textContent = item.categoria || '—';

      // Cor cell (validate hex before inline style)
      const tdCor = document.createElement('td');
      const corDiv = document.createElement('div');
      corDiv.className = 'table-cor';
      if (item.cor && /^#[0-9a-fA-F]{3,6}$/.test(item.cor)) {
        const swatch = document.createElement('span');
        swatch.style.display = 'inline-block';
        swatch.style.width = '14px';
        swatch.style.height = '14px';
        swatch.style.borderRadius = '50%';
        swatch.style.background = item.cor;
        swatch.style.border = '1px solid #ccc';
        swatch.style.verticalAlign = 'middle';
        swatch.style.marginRight = '4px';
        corDiv.appendChild(swatch);
      }
      corDiv.appendChild(document.createTextNode(item.cor_nome || ''));
      tdCor.appendChild(corDiv);

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

      tr.appendChild(tdNome);
      tr.appendChild(tdCat);
      tr.appendChild(tdCor);
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
