const firebaseConfig = {
  apiKey: "AIzaSyB6KnJHqNCQCQVOrALregGjwjn4g2o0e-E",
  authDomain: "cha-bar-yn.firebaseapp.com",
  databaseURL: "https://cha-bar-yn-default-rtdb.firebaseio.com",
  projectId: "cha-bar-yn",
  storageBucket: "cha-bar-yn.firebasestorage.app",
  messagingSenderId: "228052728131",
  appId: "1:228052728131:web:c55461f47aa87d00ded7f6",
  measurementId: "G-FP9C25241G"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
window.db = db;

/* ── Paleta de cores (fonte única: site + admin) ── */
window.COLOR_PALETTE = [
  { slug: 'preto',     nome: 'Preto',     css: '#1a1a1a' },
  { slug: 'off-white', nome: 'Off White', css: '#f4f0e6' },
  { slug: 'cinza',     nome: 'Cinza',     css: '#9a9a9a' },
  { slug: 'inox',      nome: 'Inox',      css: 'linear-gradient(135deg,#eceef0,#a9adb2 50%,#eceef0)' }
];

window.corBySlug = slug => window.COLOR_PALETTE.find(c => c.slug === slug);

/* Monta bolinha(s) de cor + rótulo. opts.dotsOnly = só bolinhas. */
window.buildCorChips = (cores, opts = {}) => {
  const wrap = document.createElement('div');
  wrap.className = 'cor-chips';
  (cores || []).forEach(slug => {
    const c = window.corBySlug(slug);
    if (!c) return;
    const chip = document.createElement('span');
    chip.className = 'cor-chip';
    const dot = document.createElement('span');
    dot.className = 'cor-dot';
    dot.style.background = c.css;
    chip.appendChild(dot);
    if (!opts.dotsOnly) chip.appendChild(document.createTextNode(c.nome));
    wrap.appendChild(chip);
  });
  return wrap;
};
