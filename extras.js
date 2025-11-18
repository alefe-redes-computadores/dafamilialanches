/* =====================================================
   🍔 Da Família Lanches — Extras.js (v4.1 Blindada com Correção de Observer)
   - Lógica Inteligente (Topo vs Centro)
   - Correção de Miniaturas
   - INJEÇÃO DE CSS AUTOMÁTICA (Anti-Cache)
   ===================================================== */

(function () {

  // 1. INJEÇÃO DE CSS (Garante o visual mesmo se o HTML estiver em cache)
  (function injectStyles() {
    // ID único para evitar duplicar estilo se já existir no HTML
    if (document.getElementById('dfl-extras-js-style')) return;
    
    const st = document.createElement('style');
    st.id = 'dfl-extras-js-style';
    st.textContent = `
      /* --- BASE DO TOAST (Comum a todos) --- */
      .popup-add, .dfl-toast {
        position: fixed !important;
        top: 20px !important; 
        bottom: auto !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(-150%) !important; /* Começa escondido */
        
        background: #222 !important; 
        color: #fff !important;
        font-family: 'Segoe UI', Roboto, sans-serif !important;
        font-weight: 700 !important;
        font-size: 0.95rem !important;
        white-space: nowrap !important;
        
        padding: 12px 24px !important; 
        border-radius: 50px !important; 
        box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
        
        z-index: 2147483647 !important;
        opacity: 0 !important;
        
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        pointer-events: none !important;
        
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
      }

      /* Estado Visível */
      .popup-add.show, .dfl-toast.show {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
      }

      /* --- MODO ESPECIAL: CENTRO --- */
      .popup-add.dfl-center, .dfl-toast.dfl-center {
        top: 50% !important;
        background: rgba(0, 0, 0, 0.9) !important;
        backdrop-filter: blur(5px) !important;
        padding: 25px 35px !important;
        font-size: 1.1rem !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        transform: translate(-50%, -50%) scale(0.5) !important; 
      }

      .popup-add.dfl-center.show, .dfl-toast.dfl-center.show {
        transform: translate(-50%, -50%) scale(1) !important; 
      }

      /* --- CORREÇÃO DAS MINIATURAS --- */
      .pedido-card .pedido-thumb {
        width: 100% !important;
        height: 110px !important;
        background-size: cover !important;
        background-position: center center !important;
        border-radius: 8px !important;
        margin-bottom: 10px !important;
        background-color: transparent !important;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
      }
    `;
    document.head.appendChild(st);
  })();

  // 2. OBSERVADOR INTELIGENTE
  function setupPopupObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        // Detecta novos elementos
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('popup-add')) {
            stylizePopup(node);
          }
        });
        
        // Detecta alterações em elementos existentes
        if (m.type === 'attributes' && m.target.classList.contains('popup-add')) {
           if (m.target.classList.contains('show')) {
             stylizePopup(m.target);
           }
        }
        // Detecta mudança de texto
        if (m.type === 'characterData' || m.type === 'childList') {
           const target = m.target.closest ? m.target.closest('.popup-add') : m.target.parentElement;
           if(target && target.classList.contains('popup-add')) stylizePopup(target);
        }
      });
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class'] 
    });
  }

  // 3. ESTILIZADOR (Aplica Emojis e Posição)
  function stylizePopup(el) {
    const msg = el.textContent || "";
    if (el.dataset.processed === msg) return;
    
    const isSpecial = /Login|Sucesso|Parabéns|Pedido|Finaliz/i.test(msg);
    const isError = /Erro|Inválido|Falha/i.test(msg);
    
    let icon = '🍔';
    if (msg.includes('Login')) icon = '🎉';
    else if (msg.includes('Pedido')) icon = '📦';
    else if (msg.includes('adicionado')) icon = '🛒';
    else if (msg.includes('removido')) icon = '🗑️';
    else if (msg.includes('Cupom')) icon = '🎟️';
    else if (isError) icon = '⚠️';

    if (isSpecial) {
      el.classList.add('dfl-center');
    } else {
      el.classList.remove('dfl-center');
    }

    if (!msg.includes(icon)) {
        el.innerHTML = `<span style="margin-right:8px; font-size:1.2em">${icon}</span> ${msg}`;
        el.dataset.processed = el.textContent; 
    }
  }

  // 4. DETECTOR DE LOGIN
  document.addEventListener('DOMContentLoaded', () => {
    try {
      setTimeout(() => {
          if (window.firebase && firebase.auth) {
              firebase.auth().onAuthStateChanged(user => {
                if (user && !sessionStorage.getItem('dfl_logged_in_msg')) {
                  sessionStorage.setItem('dfl_logged_in_msg', 'true');
                  if (typeof window.popupAdd === 'function') {
                      const nome = user.displayName ? user.displayName.split(' ')[0] : 'Cliente';
                      window.popupAdd(`🎉 Login realizado! Olá, ${nome}.`);
                  }
                }
              });
          }
      }, 2000);
    } catch (e) { console.warn(e); }
  });

  // 5. MAPA DE MINIATURAS
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
    { key: 'tudibom', img: 'imagens/tudibom.png' },
    { key: 'simprão', img: 'imagens/simprao.png' },
    { key: 'simprao', img: 'imagens/simprao.png' }
  ];

  function fixThumbnail(cardElement) {
    const thumbDiv = cardElement.querySelector('.pedido-thumb');
    if (!thumbDiv) return;
    
    const text = (cardElement.innerText || '').toLowerCase();
    const found = THUMB_MAP.find(t => text.includes(t.key));
    
    if (found) {
       thumbDiv.style.backgroundImage = `url('${found.img}')`;
    }
  }

  // 🚨 CORREÇÃO DE ROBUSTEZ NO OBSERVADOR DE PEDIDOS
  function watchOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    
    const mo = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            // Verifica a adição de novos nós
            mutation.addedNodes.forEach(node => {
                // Garante que o nó adicionado é um elemento e tem a classe 'pedido-card'
                if (node.nodeType === 1 && node.classList.contains('pedido-card')) {
                    fixThumbnail(node);
                }
            });
        });
        // Tenta aplicar o fix também nos cards que já estavam lá para garantir o carregamento inicial.
        Array.from(list.children).forEach(fixThumbnail);
    });
    
    // Observa mudanças de elementos filhos no painel de pedidos
    mo.observe(list, { childList: true, subtree: true });
    
    // Tenta aplicar as miniaturas nos pedidos que já estão na lista (para carregamento inicial)
    Array.from(list.children).forEach(fixThumbnail);
  }

  // 6. INICIALIZAÇÃO
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupPopupObserver();
        watchOrders();
    });
  } else {
    // Tenta inicializar imediatamente se a DOM já estiver pronta
    setupPopupObserver();
    watchOrders();
  }

})();
