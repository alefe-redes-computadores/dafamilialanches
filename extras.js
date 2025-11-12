// =====================================================
// DFL - extras.js (não quebra nada do seu v3.7)
// - Toast automático ao logar (Firebase v8 + fallback evento custom)
// - Miniaturas em "Meus Pedidos" com observer
// =====================================================

(function () {
  // ----- Utils de DOM -----
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  // ----- Injetar CSS do toast (auto) -----
  const TOAST_CSS = `
  .dfl-toast {
    position: fixed;
    top: 16px; left: 50%;
    transform: translateX(-50%) translateY(-10px);
    background: #111;
    color: #fff;
    padding: 12px 16px;
    border-radius: 10px;
    font-weight: 700;
    box-shadow: 0 10px 30px rgba(0,0,0,.25);
    opacity: 0;
    z-index: 2001;
    transition: opacity .25s ease, transform .25s ease;
    pointer-events: none;
  }
  .dfl-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }`;
  (function injectToastCSS() {
    if (!$('#dfl-toast-style')) {
      const st = document.createElement('style');
      st.id = 'dfl-toast-style';
      st.textContent = TOAST_CSS;
      document.head.appendChild(st);
    }
  })();

  // ----- Toast -----
  let toastTimer = null;
  function showToast(msg, ms = 2200) {
    let el = $('.dfl-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'dfl-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg || 'Ação concluída!';
    // reflow simples
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, ms);
  }

  // ----- Miniaturas: mapeamento de palavras-chave -> imagem -----
  // Ajuste aqui se quiser melhorar o mapeamento
  const THUMB_MAP = [
    // Combos
    { re: /\bcombo\b|\bpromo\b|\bpromoções?\b/i, img: 'promo1.jpg', path: 'promocoes' },
    { re: /\bcasal\b/i, img: 'combo1.png', path: 'imagens' },
    { re: /\bfamília|familia\b/i, img: 'combo3.png', path: 'imagens' },
    // Tradicionais
    { re: /\bbão|bao\b/i, img: 'bao.png', path: 'imagens' },
    { re: /\buai\b/i, img: 'uai.png', path: 'imagens' },
    { re: /\btrem\b/i, img: 'trem.png', path: 'imagens' },
    { re: /\bcadim\b/i, img: 'cadim.png', path: 'imagens' },
    { re: /\barmaria\b/i, img: 'armaria.png', path: 'imagens' },
    { re: /\bbitela\b/i, img: 'bitela.png', path: 'imagens' },
    { re: /\bapruma\b/i, img: 'apruma.png', path: 'imagens' },
    // Artesanais
    { re: /\bpeleja\b/i, img: 'peleja.png', path: 'imagens' },
    { re: /\btudibom\b/i, img: 'tudibom.png', path: 'imagens' },
    { re: /\bcustoso\b/i, img: 'custoso.png', path: 'imagens' },
    // Hot dogs
    { re: /\bnigucim\b/i, img: 'nigucim.png', path: 'imagens' },
    { re: /\bsimpr[aã]o|simprao\b/i, img: 'simprao.png', path: 'imagens' },
    { re: /\bnimin\b/i, img: 'nimin.png', path: 'imagens' },
    { re: /\bpadan[aá]\b/i, img: 'padana.png', path: 'imagens' },
    { re: /\bpurizin\b/i, img: 'purizin.png', path: 'imagens' },
    { re: /\btremb[aã]o|trembao\b/i, img: 'trembao.png', path: 'imagens' },
  ];

  function pickThumbFromText(text) {
    if (!text) return null;
    for (const rule of THUMB_MAP) {
      if (rule.re.test(text)) {
        const base = rule.path || 'imagens';
        return `./${base}/${rule.img}`;
      }
    }
    return null;
  }

  // Aceita tanto cards estilo novo (.pedido-card) quanto antigo (.pedido-item),
  // ou qualquer bloco- filho de #listaPedidos (exceto mensagens vazias).
  function isOrderBlock(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.classList.contains('pedido-card') || el.classList.contains('pedido-item')) return true;
    // Heurística: tem botão repetir, ou contém total/itens, etc.
    if (el.querySelector('.repetir-btn') || el.querySelector('.btn-repetir')) return true;
    // Evita parágrafos de "empty"
    if (el.classList.contains('empty-orders')) return false;
    // Se for <div> com algum conteúdo, tratamos como bloco de pedido
    return el.tagName === 'DIV';
  }

  function ensureThumb(el) {
    if (!isOrderBlock(el)) return;

    // Já tem miniatura?
    if (el.querySelector('.pedido-thumb')) return;

    const text = el.innerText || '';
    const src = pickThumbFromText(text);
    if (!src) return;

    // Cria a thumb e insere no topo do bloco
    const thumb = document.createElement('div');
    thumb.className = 'pedido-thumb';
    thumb.style.width = '100%';
    thumb.style.height = '140px';
    thumb.style.borderRadius = '8px';
    thumb.style.backgroundColor = '#f0f0f0';
    thumb.style.backgroundPosition = 'center';
    thumb.style.backgroundRepeat = 'no-repeat';
    thumb.style.backgroundSize = 'cover';
    thumb.style.border = '1px solid #e0e0e0';
    thumb.style.marginBottom = '8px';
    thumb.style.backgroundImage = `url("${src}")`;

    // Preferir inserir antes do primeiro título/linha do pedido
    const firstChild = el.firstElementChild;
    if (firstChild) el.insertBefore(thumb, firstChild);
    else el.prepend(thumb);
  }

  function processAllOrders() {
    const container = $('#listaPedidos');
    if (!container) return;
    const children = Array.from(container.children);
    children.forEach(ensureThumb);
  }

  // ----- Observa mudanças na lista de pedidos (quando o app preenche via JS) -----
  function observeOrders() {
    const container = $('#listaPedidos');
    if (!container) return;
    const mo = new MutationObserver(() => {
      processAllOrders();
    });
    mo.observe(container, { childList: true, subtree: true });
    // Primeira passada (se já tiver conteúdo)
    processAllOrders();
  }

  // ----- Login: detectar sucesso -----
  function wireLoginSuccess() {
    // 1) Firebase v8 global
    try {
      if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            showToast('🎉 Login realizado com sucesso!');
          }
        });
      }
    } catch (e) {
      // ignora
    }

    // 2) Fallback: caso seu script principal dispare esse evento custom
    window.addEventListener('dfl:login-success', () => {
      showToast('🎉 Login realizado com sucesso!');
    });

    // 3) Fallback extra: se o script principal manter window.currentUser
    const checkUser = () => {
      if (window.currentUser) {
        showToast('🎉 Login realizado com sucesso!');
      }
    };
    document.addEventListener('dfl:auth-ready', checkUser);
    // tentativa única após load (sem spam)
    setTimeout(checkUser, 1500);
  }

  // ----- Inicialização -----
  function init() {
    wireLoginSuccess();
    observeOrders();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();