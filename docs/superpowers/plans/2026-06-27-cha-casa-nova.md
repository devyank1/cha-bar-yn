# Chá de Casa Nova — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static housewarming site (index.html + admin.html) with Firebase-backed item list, countdown timer, and Mercado Livre price search for Yan & Nicolle's Chá de Casa Nova on 14/11/2026.

**Architecture:** Pure HTML/CSS/JS, zero build tools. Firebase 9 compat SDK via CDN. All persistent state in Firebase Realtime Database. Hosted on GitHub Pages.

**Tech Stack:** HTML5 · CSS3 · Vanilla JS (ES2020) · Firebase 9 Compat CDN · Mercado Livre Public API · Google Fonts CDN

## Global Constraints
- Zero npm / zero node / zero build tools — all deps via CDN
- Firebase CDN: `https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js` + `firebase-database-compat.js`
- CSS custom props: `--olive:#555934` · `--cream:#f2e6d8` · `--white:#ffffff` · `--text:#2e2c1e`
- Fonts: Playfair Display (h1/h2) · Inter (body) via Google Fonts
- Event date constant: `2026-11-14` hardcoded in `app.js`
- Default countdown time: `12:00` (overridden by `evento.hora` from Firebase)
- Firebase paths: `/evento` (object) · `/itens` (push-keyed map)
- Admin password default: `yankoll2026` (SHA-256 hash in `admin.js`)
- Firebase rules: public read + public write (appropriate for a personal party site)
- Mobile-first — breakpoints 480px / 768px / 1024px

## File Map
| File | Responsibility |
|------|---------------|
| `index.html` | Public site — all sections + modal markup |
| `admin.html` | Admin panel — login + event form + items CRUD |
| `css/style.css` | All styles (CSS vars, layout, components, admin, responsive) |
| `js/firebase.js` | Firebase init + `window.db` |
| `js/app.js` | Countdown, Firebase reads, modal, Mercado Livre fetch |
| `js/admin.js` | Auth gate (SHA-256), event CRUD, items CRUD |

---

### Task 1: Firebase Setup + Project Scaffold

**Files:**
- Create: `js/firebase.js`
- Create: `README.md`

**Interfaces:**
- Produces: `window.db` — Firebase database reference, global

- [ ] **Step 1: Create directories**

```powershell
New-Item -ItemType Directory -Path "c:/Users/Cliente/Desktop/cha-bar/css" -Force
New-Item -ItemType Directory -Path "c:/Users/Cliente/Desktop/cha-bar/js" -Force
```

- [ ] **Step 2: Create Firebase project**

1. Go to https://console.firebase.google.com
2. "Add project" → name: `cha-casa-nova-yan-nicolle` → disable Analytics
3. Click `</>` (web) → app nickname: `cha-bar` → do NOT check Hosting
4. Copy the `firebaseConfig` object shown

- [ ] **Step 3: Create Realtime Database**

1. Left sidebar → Build → Realtime Database → Create Database
2. Region: `us-central1` → Start in **test mode** → Enable
3. Go to Rules tab, set and Publish:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

- [ ] **Step 4: Create `js/firebase.js`**

Replace all `YOUR_*` with values from Firebase console:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
```

- [ ] **Step 5: Seed initial Firebase data**

In Firebase console → Realtime Database → Data tab → ⋮ → Import JSON:

```json
{
  "evento": {
    "hora": "",
    "local": "",
    "endereco": "",
    "frase_hero": "Venham celebrar conosco!",
    "mensagem_footer": "Com amor, Yan e Nicolle ♥"
  }
}
```

- [ ] **Step 6: Create `README.md`**

```markdown
# Chá de Casa Nova — Yan & Nicolle

## Setup Firebase
1. Crie projeto em https://console.firebase.google.com
2. Adicione app web, copie `firebaseConfig`
3. Cole em `js/firebase.js` substituindo os `YOUR_*`
4. Crie Realtime Database em modo test
5. Importe o JSON inicial (ver plano de implementação)

## Deploy (GitHub Pages)
1. Crie repositório no GitHub
2. `git remote add origin https://github.com/SEU_USUARIO/REPO.git`
3. `git push -u origin main`
4. Settings → Pages → Source: main branch / root
```

- [ ] **Step 7: Commit**

```bash
git add js/firebase.js README.md
git commit -m "feat: Firebase config + project README"
```

---

### Task 2: CSS Foundation

**Files:**
- Create: `css/style.css`

**Interfaces:**
- Produces: all CSS custom properties and component styles consumed by both HTML files

- [ ] **Step 1: Create `css/style.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');

/* ── Variables ── */
:root {
  --olive: #555934;
  --olive-light: #7a7d52;
  --olive-pale: #c8caaa;
  --cream: #f2e6d8;
  --cream-dark: #e8d5c0;
  --white: #ffffff;
  --text: #2e2c1e;
  --text-muted: #7a7263;
  --shadow: 0 4px 20px rgba(85,89,52,0.12);
  --shadow-hover: 0 8px 32px rgba(85,89,52,0.2);
  --radius: 16px;
  --radius-sm: 8px;
  --transition: 0.3s ease;
}

/* ── Reset ── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:var(--cream);color:var(--text);line-height:1.6;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{cursor:pointer;border:none;background:none;font-family:inherit}

/* ── Typography ── */
h1,h2,h3{font-family:'Playfair Display',serif;line-height:1.2}
h1{font-size:clamp(2.2rem,5vw,3.5rem)}
h2{font-size:clamp(1.6rem,3vw,2.2rem)}
h3{font-size:1.2rem}

/* ── Layout ── */
.container{max-width:1100px;margin:0 auto;padding:0 1.5rem}
section{padding:5rem 0}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;border-radius:var(--radius-sm);font-size:.9rem;font-weight:500;transition:var(--transition)}
.btn-primary{background:var(--olive);color:var(--white)}
.btn-primary:hover{background:var(--olive-light);transform:translateY(-1px);box-shadow:var(--shadow-hover)}
.btn-outline{border:2px solid var(--olive);color:var(--olive);background:transparent}
.btn-outline:hover{background:var(--olive);color:var(--white)}

/* ── Section Header ── */
.section-header{text-align:center;margin-bottom:3rem}
.section-header h2{color:var(--olive)}
.section-header p{color:var(--text-muted);margin-top:.5rem}
.divider{width:60px;height:3px;background:var(--olive-pale);margin:1rem auto 0;border-radius:2px}

/* ── Fade-in ── */
.fade-in{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
.fade-in.visible{opacity:1;transform:none}

/* ── Spinner ── */
.spinner{width:40px;height:40px;border:3px solid var(--cream-dark);border-top-color:var(--olive);border-radius:50%;animation:spin .8s linear infinite;margin:2rem auto}
@keyframes spin{to{transform:rotate(360deg)}}

/* ══ HERO ══ */
#hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden;background:var(--cream);padding:2rem}
.hero-leaves{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.hero-leaves svg{position:absolute;opacity:.18}
.leaf-1{top:-60px;left:-40px;width:320px}
.leaf-2{bottom:-80px;right:-60px;width:400px;transform:rotate(180deg)}
.leaf-3{top:40%;left:-80px;width:200px;opacity:.08!important}
.hero-content{position:relative;z-index:1}
.hero-eyebrow{font-size:.85rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--olive-light);margin-bottom:1rem}
.hero-title{color:var(--olive)}
.hero-names{font-family:'Playfair Display',serif;font-size:clamp(1.4rem,4vw,2.2rem);font-style:italic;color:var(--text-muted);margin:.5rem 0 1.5rem}
.hero-phrase{font-size:1.1rem;color:var(--text-muted);max-width:480px;margin:0 auto 2rem}
.hero-date-badge{display:inline-flex;align-items:center;gap:.5rem;background:var(--olive);color:var(--white);padding:.6rem 1.2rem;border-radius:100px;font-size:.9rem;font-weight:500}

/* ══ COUNTDOWN ══ */
#countdown{background:var(--olive);color:var(--white);padding:4rem 0;text-align:center}
#countdown h2{color:rgba(255,255,255,.8);font-size:1rem;letter-spacing:.15em;text-transform:uppercase;margin-bottom:2rem;font-family:'Inter',sans-serif;font-weight:500}
.countdown-grid{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap}
.cd-unit{text-align:center;min-width:80px}
.cd-number{font-family:'Playfair Display',serif;font-size:clamp(3rem,8vw,5rem);font-weight:700;line-height:1;display:block}
.cd-label{font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;opacity:.7;margin-top:.5rem;display:block}
.countdown-arrived{font-family:'Playfair Display',serif;font-size:2rem;font-style:italic}

/* ══ EVENTO ══ */
#evento{background:var(--white)}
.evento-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;max-width:700px;margin:0 auto}
.evento-card{background:var(--cream);border-radius:var(--radius);padding:2rem 1.5rem;text-align:center;box-shadow:var(--shadow)}
.evento-icon{font-size:2rem;margin-bottom:1rem}
.evento-label{font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;color:var(--olive-light);font-weight:600;margin-bottom:.5rem}
.evento-value{font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--text)}
.evento-placeholder{color:var(--text-muted);font-style:italic;font-size:.95rem;font-family:'Inter',sans-serif}
.mapa-link{display:inline-flex;align-items:center;gap:.4rem;color:var(--olive);font-size:.85rem;margin-top:.5rem;font-weight:500}
.mapa-link:hover{text-decoration:underline}

/* ══ LISTA ══ */
#lista{background:var(--cream)}
.lista-grid{display:grid;grid-template-columns:1fr;gap:1.5rem}
.item-card{background:var(--white);border-radius:var(--radius);padding:1.5rem;box-shadow:var(--shadow);display:flex;align-items:center;justify-content:space-between;gap:1rem;transition:var(--transition)}
.item-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-hover)}
.item-info{flex:1}
.item-nome{font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--text);margin-bottom:.4rem}
.item-categoria{font-size:.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em}
.item-cor-badge{display:inline-flex;align-items:center;gap:.35rem;background:var(--cream);border-radius:100px;padding:.25rem .75rem;font-size:.8rem;margin-top:.5rem}
.cor-swatch{width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.1);flex-shrink:0}
.lista-empty{text-align:center;color:var(--text-muted);font-style:italic;padding:3rem;grid-column:1/-1}

/* ══ MODAL ══ */
.modal-backdrop{position:fixed;inset:0;background:rgba(46,44,30,.6);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s ease}
.modal-backdrop.open{opacity:1;pointer-events:all}
.modal{background:var(--white);border-radius:var(--radius) var(--radius) 0 0;width:100%;max-height:90vh;overflow-y:auto;padding:2rem 1.5rem;transform:translateY(100%);transition:transform .35s ease}
.modal-backdrop.open .modal{transform:none}
.modal-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.5rem}
.modal-title{font-family:'Playfair Display',serif;font-size:1.3rem}
.modal-close{font-size:1.5rem;color:var(--text-muted);line-height:1;padding:.25rem}
.modal-close:hover{color:var(--text)}
.modal-stores{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem}
.store-btn{padding:.5rem 1rem;border-radius:var(--radius-sm);font-size:.85rem;font-weight:500;border:2px solid var(--olive-pale);color:var(--olive);transition:var(--transition);display:inline-block}
.store-btn:hover{background:var(--olive);color:var(--white);border-color:var(--olive)}
.ml-results{display:flex;flex-direction:column;gap:1rem}
.ml-item{display:flex;gap:1rem;align-items:center;padding:1rem;background:var(--cream);border-radius:var(--radius-sm)}
.ml-thumb{width:64px;height:64px;object-fit:contain;border-radius:var(--radius-sm);flex-shrink:0;background:var(--white)}
.ml-info{flex:1;min-width:0}
.ml-title{font-size:.9rem;color:var(--text);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ml-price{font-weight:600;color:var(--olive);font-size:1rem;margin-top:.3rem}
.ml-buy{flex-shrink:0}
.ml-error{color:var(--text-muted);font-style:italic;text-align:center;padding:1rem}

/* ══ FOOTER ══ */
footer{background:var(--olive);color:rgba(255,255,255,.85);text-align:center;padding:3rem 1.5rem}
.footer-message{font-family:'Playfair Display',serif;font-size:1.3rem;font-style:italic;color:var(--white);margin-bottom:1rem}
footer small{font-size:.8rem;opacity:.6}

/* ══ ADMIN ══ */
.admin-login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--cream)}
.login-card{background:var(--white);border-radius:var(--radius);padding:2.5rem;width:100%;max-width:380px;box-shadow:var(--shadow);text-align:center}
.login-card h1{font-size:1.5rem;color:var(--olive);margin-bottom:.5rem}
.login-card p{color:var(--text-muted);font-size:.9rem;margin-bottom:2rem}
.form-group{margin-bottom:1.2rem;text-align:left}
.form-group label{font-size:.85rem;font-weight:500;color:var(--text);display:block;margin-bottom:.4rem}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:.75rem 1rem;border:2px solid var(--cream-dark);border-radius:var(--radius-sm);font-family:'Inter',sans-serif;font-size:.95rem;color:var(--text);background:var(--white);transition:border-color var(--transition)}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{outline:none;border-color:var(--olive)}
.form-group textarea{resize:vertical;min-height:80px}
.login-error{color:#c0392b;font-size:.85rem;margin-top:.5rem;display:none}
#admin-panel{display:none}
.admin-header{background:var(--olive);color:var(--white);padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between}
.admin-header h1{font-size:1.2rem;color:var(--white)}
.admin-body{padding:2rem;max-width:900px;margin:0 auto}
.admin-section{background:var(--white);border-radius:var(--radius);padding:2rem;margin-bottom:2rem;box-shadow:var(--shadow)}
.admin-section h2{color:var(--olive);margin-bottom:1.5rem;font-size:1.3rem}
.admin-table{width:100%;border-collapse:collapse}
.admin-table th{text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);border-bottom:2px solid var(--cream-dark);padding:.75rem .5rem}
.admin-table td{padding:.75rem .5rem;border-bottom:1px solid var(--cream);font-size:.9rem}
.admin-table tr:last-child td{border-bottom:none}
.table-cor{display:flex;align-items:center;gap:.5rem}
.table-actions{display:flex;gap:.5rem}
.btn-edit{color:var(--olive);font-size:.85rem;font-weight:500;padding:.35rem .75rem;border:1px solid var(--olive-pale);border-radius:var(--radius-sm);cursor:pointer}
.btn-delete{color:#c0392b;font-size:.85rem;font-weight:500;padding:.35rem .75rem;border:1px solid #e8a9a9;border-radius:var(--radius-sm);cursor:pointer}
.btn-edit:hover{background:var(--olive);color:var(--white)}
.btn-delete:hover{background:#c0392b;color:var(--white)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.admin-form-actions{display:flex;gap:1rem;margin-top:1.5rem}
.alert{padding:.75rem 1rem;border-radius:var(--radius-sm);font-size:.9rem;margin-top:1rem;display:none}
.alert-success{background:#d4edda;color:#155724}
.alert-error{background:#f8d7da;color:#721c24}

/* ══ RESPONSIVE ══ */
@media(min-width:480px){.lista-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:768px){
  .lista-grid{grid-template-columns:repeat(2,1fr)}
  .modal-backdrop{align-items:center}
  .modal{border-radius:var(--radius);max-width:600px;max-height:80vh;transform:scale(.95);opacity:0;transition:transform .3s ease,opacity .3s ease}
  .modal-backdrop.open .modal{transform:scale(1);opacity:1}
}
@media(min-width:1024px){.lista-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:480px){.form-row{grid-template-columns:1fr}.admin-form-actions{flex-direction:column}}
```

- [ ] **Step 2: Verify**

Open any HTML file linking `style.css` (even just a blank HTML with the link tag). Check DevTools Network → `fonts.googleapis.com` returns 200. No CSS parse errors in console.

- [ ] **Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat: CSS foundation — variables, layout, all component styles"
```

---

### Task 3: index.html + Hero + app.js Skeleton

**Files:**
- Create: `index.html`
- Create: `js/app.js`

**Interfaces:**
- Produces: `initApp()` called on DOMContentLoaded — calls `initScrollAnimations`, `initCountdown`, `loadEvento`, `loadItens`, `initModal`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chá de Casa Nova · Yan & Nicolle</title>
  <link rel="stylesheet" href="css/style.css">
  <meta name="description" content="Chá de Casa Nova de Yan & Nicolle — 14 de novembro de 2026">
</head>
<body>

  <!-- HERO -->
  <section id="hero">
    <div class="hero-leaves" aria-hidden="true">
      <svg class="leaf-1" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M150 20 C200 80 260 160 230 260 C200 360 80 390 40 310 C0 230 60 100 150 20Z" fill="#555934"/>
        <path d="M150 20 C140 100 130 200 150 260 C170 320 200 350 230 310" stroke="#555934" stroke-width="2" fill="none" opacity="0.4"/>
      </svg>
      <svg class="leaf-2" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M150 20 C200 80 260 160 230 260 C200 360 80 390 40 310 C0 230 60 100 150 20Z" fill="#555934"/>
      </svg>
      <svg class="leaf-3" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 10 C140 60 160 130 140 200 C120 270 50 290 20 230 C-10 170 30 80 100 10Z" fill="#555934"/>
      </svg>
    </div>
    <div class="hero-content fade-in">
      <p class="hero-eyebrow">Você está convidado ✨</p>
      <h1 class="hero-title">Chá de Casa Nova</h1>
      <p class="hero-names">Yan & Nicolle</p>
      <p class="hero-phrase" id="hero-frase">Venham celebrar conosco!</p>
      <span class="hero-date-badge">📅 14 de novembro de 2026</span>
    </div>
  </section>

  <!-- COUNTDOWN -->
  <section id="countdown">
    <h2>Faltam...</h2>
    <div class="countdown-grid" id="countdown-grid">
      <div class="cd-unit">
        <span class="cd-number" id="cd-days">00</span>
        <span class="cd-label">dias</span>
      </div>
      <div class="cd-unit">
        <span class="cd-number" id="cd-hours">00</span>
        <span class="cd-label">horas</span>
      </div>
      <div class="cd-unit">
        <span class="cd-number" id="cd-minutes">00</span>
        <span class="cd-label">minutos</span>
      </div>
      <div class="cd-unit">
        <span class="cd-number" id="cd-seconds">00</span>
        <span class="cd-label">segundos</span>
      </div>
    </div>
  </section>

  <!-- EVENTO -->
  <section id="evento">
    <div class="container">
      <div class="section-header fade-in">
        <h2>O Grande Dia</h2>
        <div class="divider"></div>
      </div>
      <div class="evento-grid fade-in">
        <div class="evento-card">
          <div class="evento-icon">📅</div>
          <div class="evento-label">Data</div>
          <div class="evento-value">14 de novembro de 2026</div>
        </div>
        <div class="evento-card">
          <div class="evento-icon">🕐</div>
          <div class="evento-label">Hora</div>
          <div class="evento-value" id="evento-hora"><span class="evento-placeholder">Em breve</span></div>
        </div>
        <div class="evento-card">
          <div class="evento-icon">📍</div>
          <div class="evento-label">Local</div>
          <div class="evento-value" id="evento-local"><span class="evento-placeholder">Em breve</span></div>
          <a href="#" id="mapa-link" class="mapa-link" target="_blank" rel="noopener" style="display:none">
            🗺️ Ver no mapa
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- LISTA -->
  <section id="lista">
    <div class="container">
      <div class="section-header fade-in">
        <h2>Lista de Presentes</h2>
        <p>Escolha algo que vai tornar nossa casa ainda mais especial 🏡</p>
        <div class="divider"></div>
      </div>
      <div class="lista-grid" id="lista-grid">
        <p class="lista-empty">Carregando lista...</p>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer>
    <p class="footer-message" id="footer-message">Com amor, Yan e Nicolle ♥</p>
    <small>© 2026 · Chá de Casa Nova</small>
  </footer>

  <!-- MODAL -->
  <div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-item-nome">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title" id="modal-item-nome"></h3>
        <button class="modal-close" id="modal-close" aria-label="Fechar">✕</button>
      </div>
      <div class="modal-stores" id="modal-stores"></div>
      <div id="modal-body"></div>
    </div>
  </div>

  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
  <script src="js/firebase.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `js/app.js` skeleton**

```javascript
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
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. Confirm:
- Hero shows leaf SVGs, olive title, italic names, date badge
- Countdown ticks every second toward 14/11/2026
- Event section shows "Em breve" placeholders
- Gift list shows "Carregando lista..." (Firebase error expected if config not set yet)
- Footer shows default message

- [ ] **Step 4: Commit**

```bash
git add index.html js/app.js
git commit -m "feat: public site — hero, countdown, event details, gift list, modal, footer"
```

---

### Task 4: Admin Panel

**Files:**
- Create: `admin.html`
- Create: `js/admin.js`

**Interfaces:**
- Consumes: `db` from `js/firebase.js`
- Produces: full CRUD for `/evento` and `/itens` in Firebase

- [ ] **Step 1: Compute SHA-256 of admin password**

Run in PowerShell:
```powershell
$bytes = [System.Text.Encoding]::UTF8.GetBytes("yankoll2026")
$hash  = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
[System.BitConverter]::ToString($hash).Replace("-","").ToLower()
```

Copy the 64-character hex output. Use it in Step 3.

- [ ] **Step 2: Create `admin.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin · Chá de Casa Nova</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- LOGIN -->
  <div class="admin-login" id="login-screen">
    <div class="login-card">
      <h1>Painel Admin</h1>
      <p>Chá de Casa Nova · Yan & Nicolle</p>
      <form id="login-form">
        <div class="form-group">
          <label for="senha">Senha</label>
          <input type="password" id="senha" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%">Entrar</button>
        <p class="login-error" id="login-error">Senha incorreta.</p>
      </form>
    </div>
  </div>

  <!-- ADMIN PANEL -->
  <div id="admin-panel">
    <div class="admin-header">
      <h1>🏠 Admin — Chá de Casa Nova</h1>
      <button class="btn btn-outline" id="btn-sair" style="color:#fff;border-color:rgba(255,255,255,.5)">Sair</button>
    </div>
    <div class="admin-body">

      <!-- Evento -->
      <div class="admin-section">
        <h2>📅 Dados do Evento</h2>
        <form id="form-evento">
          <div class="form-row">
            <div class="form-group">
              <label>Hora do evento</label>
              <input type="time" id="ev-hora">
            </div>
            <div class="form-group">
              <label>Nome do local</label>
              <input type="text" id="ev-local" placeholder="Ex: Espaço Jardim">
            </div>
          </div>
          <div class="form-group">
            <label>Endereço completo (link do mapa)</label>
            <input type="text" id="ev-endereco" placeholder="Rua X, nº Y, Bairro, Cidade">
          </div>
          <div class="form-group">
            <label>Frase do Hero</label>
            <textarea id="ev-frase" rows="2" placeholder="Venham celebrar conosco!"></textarea>
          </div>
          <div class="form-group">
            <label>Mensagem do Rodapé</label>
            <textarea id="ev-footer" rows="2" placeholder="Com amor, Yan e Nicolle ♥"></textarea>
          </div>
          <div class="admin-form-actions">
            <button type="submit" class="btn btn-primary">💾 Salvar evento</button>
          </div>
          <div class="alert alert-success" id="alert-evento">Dados do evento salvos!</div>
          <div class="alert alert-error" id="alert-evento-err">Erro ao salvar.</div>
        </form>
      </div>

      <!-- Itens -->
      <div class="admin-section">
        <h2>🎁 Itens da Lista</h2>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nome</th><th>Categoria</th><th>Cor</th><th>Obs</th><th>Ações</th>
            </tr>
          </thead>
          <tbody id="items-tbody">
            <tr><td colspan="5" style="color:var(--text-muted);font-style:italic">Carregando...</td></tr>
          </tbody>
        </table>

        <h3 style="margin:2rem 0 1rem;color:var(--olive)" id="form-item-title">➕ Adicionar Item</h3>
        <form id="form-item">
          <input type="hidden" id="item-key">
          <div class="form-row">
            <div class="form-group">
              <label>Nome do item *</label>
              <input type="text" id="item-nome" required placeholder="Ex: Panela de pressão">
            </div>
            <div class="form-group">
              <label>Categoria</label>
              <select id="item-categoria">
                <option value="Cozinha">Cozinha</option>
                <option value="Banheiro">Banheiro</option>
                <option value="Sala">Sala</option>
                <option value="Quarto">Quarto</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Cor preferida (nome)</label>
              <input type="text" id="item-cor-nome" placeholder="Ex: Preta, Branca, Inox">
            </div>
            <div class="form-group">
              <label>Cor (visual)</label>
              <input type="color" id="item-cor" value="#555555" style="height:46px;padding:4px">
            </div>
          </div>
          <div class="form-group">
            <label>Observação (opcional)</label>
            <input type="text" id="item-obs" placeholder="Ex: 5L ou maior">
          </div>
          <div class="admin-form-actions">
            <button type="submit" class="btn btn-primary" id="btn-salvar-item">➕ Adicionar</button>
            <button type="button" class="btn btn-outline" id="btn-cancelar-edit" style="display:none">Cancelar</button>
          </div>
          <div class="alert alert-success" id="alert-item">Item salvo!</div>
          <div class="alert alert-error" id="alert-item-err">Erro ao salvar item.</div>
        </form>
      </div>

    </div>
  </div>

  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
  <script src="js/firebase.js"></script>
  <script src="js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `js/admin.js`**

Replace `PASTE_SHA256_HASH_HERE` with the 64-char hex from Step 1:

```javascript
// SHA-256 of the admin password — change password by updating this hash
// To get a new hash: run sha256('new_password') in browser console after logging in
const PASSWORD_HASH = 'PASTE_SHA256_HASH_HERE';

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
```

- [ ] **Step 4: Verify full flow**

1. Open `admin.html` → type wrong password → "Senha incorreta." flashes
2. Type `yankoll2026` → admin panel appears
3. Fill event form (hora: 14:00, local: "Espaço Teste", endereco: "Rua X, SP") → Salvar → green alert
4. Open `index.html` → refresh → hora shows "14:00h", local shows "Espaço Teste", mapa link appears
5. Add item: nome "Panela de pressão", Cozinha, cor #000000, cor_nome "Preta", obs "5L" → Adicionar → appears in table
6. Open `index.html` → refresh → card shows with black swatch
7. Click "Ver nas lojas" → modal opens → spinner → ML results + store buttons
8. Click store button → opens correct search URL in new tab
9. Edit item in admin → Salvar alterações → table updates
10. Delete item → confirm → removed from table and index.html

- [ ] **Step 5: Commit**

```bash
git add admin.html js/admin.js
git commit -m "feat: admin panel — SHA-256 auth, event CRUD, items CRUD"
```

---

## Self-Review

**Spec coverage:**
- §4.1 Hero — Task 3 ✓
- §4.2 Countdown — Task 3 (`initCountdown`) ✓
- §4.3 Event details + Firebase load — Task 3 (`loadEvento`) ✓
- §4.4 Gift list + card render — Task 3 (`loadItens`) ✓
- §4.4 Shop modal + ML API + store links — Task 3 (`initModal`, `openShopModal`, `fetchMercadoLivre`) ✓
- §4.5 Footer Firebase load — Task 3 (`loadEvento` sets `footer-message`) ✓
- §5 Admin auth (SHA-256) — Task 4 ✓
- §5 Admin event data CRUD — Task 4 ✓
- §5 Admin items CRUD — Task 4 ✓
- §6 Firebase structure `/evento` + `/itens` — Tasks 1 + 3 + 4 ✓
- §7 ML API + 4 store quick-search URLs — Task 3 ✓
- §8 Responsive CSS 480/768/1024 — Task 2 ✓
- §3 Paleta visual + fonts — Task 2 ✓

**Type consistency:**
- `window._setCountdownHour` set in `initCountdown` (Task 3), called in `loadEvento` (Task 3) ✓
- `window._openShopModal` set in `initModal` (Task 3), called in `loadItens` click handlers (Task 3) ✓
- `showAlert(id)` defined once in `admin.js`, used throughout Task 4 ✓
- Firebase paths `/evento` and `/itens` consistent across all tasks ✓

**Placeholder check:** `PASTE_SHA256_HASH_HERE` in Task 4 Step 3 — intentional template, resolved in Step 1 of same task ✓
