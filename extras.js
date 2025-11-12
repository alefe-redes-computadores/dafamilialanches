/* =====================================================
   🍔 Da Família Lanches — Extras.js (v1.2 Estável)
   - Toast flutuante de "Login realizado com sucesso"
   - Miniaturas automáticas em "📦 Meus Pedidos"
   - Compatível com script.js v3.7 funcional
   ===================================================== */

(function () {
  // ---------- Helpers ----------
  function $(sel, root = document) { return root.querySelector(sel); }

  // ----- Injetar CSS do toast -----
  (function injectToastCSS() {
    if (document.getElementById('dfl-toast-style')) return;
    const st = document.createElement('style');
    st.id = 'dfl-toast-style';
    st.textContent = `
      .dfl-toast {
        position: fixed;
        top: 16px; left: 50%;
        transform: translateX(-50%) translateY(-10px);
        background: #111; color: #fff;
        padding: 12px 16px; border-radius: 10px; font-weight: 700;
        box-shadow: 0 10px 30px rgba(0,0,0,.25);
        opacity: 0; z-index: 2001; pointer-events: none;
        transition: opacity .25s ease, transform .25s ease;
      }
      .dfl-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(st);
  })();

  // ----- Toast -----
  let toastTimer = null;
  function showToast(msg, ms = 2200) {
    let el = document.querySelector('.dfl-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'dfl-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg || 'Ação concluída!';
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  // ---------- Toast de Login ----------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
          if (user && !window._toastShown) {
            window._toastShown = true;
            showToast('🎉 Login realizado com sucesso!');
          }
        });
      }
    } catch (e) {
      console.warn('Erro ao detectar login Firebase:', e);
    }
  });

  // ---------- Miniaturas de Pedidos ----------
  const THUMB_MAP = [
    { key: 'casal', img: 'imagens/combo1.png' },
    { key: 'família', img: 'imagens/combo3.png' },
    { key: 'familia', img: 'imagens/combo3.png' },
    { key: 'artesanal', img: 'imagens/combo4.png' },
    { key: 'purizin', img: 'imagens/purizin.png' },
    { key: 'padaná', img: 'imagens/padana.png' },
    { key: 'padana', img: 'imagens/padana.png' },
    { key: 'nigucim', img: 'imagens/nigucim.png' },
    { key: 'nimin', img: 'imagens/nimin.png' },
    { key: 'trembão', img: 'imagens/trembao.png' },
    { key: 'trembao', img: 'imagens/trembao.png' },
    { key: 'bão', img: 'imagens/bao.png' },
    { key: 'bao', img: 'imagens/bao.png' },
    { key: 'trem', img: 'imagens/trem.png' },
    { key: 'uai', img: 'imagens/uai.png' },
    { key: 'cadim', img: 'imagens/cadim.png' },
    { key: 'bitela', img: 'imagens/bitela.png' },
    { key: 'armaria', img: 'imagens/armaria.png' },
    { key: 'apruma', img: 'imagens/apruma.png' },
    { key: 'peleja', img: 'imagens/peleja.png' },
    { key: 'custoso', img: 'imagens/custoso.png' },
    { key: 'tudibom', img: 'imagens/tudibom.png' }
  ];

  function pickThumb(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const t of THUMB_MAP) {
      if (lower.includes(t.key)) return t.img;
    }
    return null;
  }

  function ensureThumb(el) {
    if (!el || el.querySelector('.dfl-thumb')) return;
    const text = el.innerText || '';
    const src = pickThumb(text);
    if (!src) return;
    const th = document.createElement('div');
    th.className = 'dfl-thumb';
    th.style.width = '100%';
    th.style.height = '140px';
    th.style.borderRadius = '8px';
    th.style.background = `#f0f0f0 url("${src}") center / cover no-repeat`;
    th.style.border = '1px solid #e0e0e0';
    th.style.marginBottom = '8px';
    const first = el.firstElementChild;
    if (first) el.insertBefore(th, first);
    else el.prepend(th);
  }

  function processOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    Array.from(list.children).forEach(ensureThumb);
  }

  function watchOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    const mo = new MutationObserver(processOrders);
    mo.observe(list, { childList: true, subtree: true });
    processOrders();
  }

  // ---------- Inicialização ----------
  function init() {
    watchOrders();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();