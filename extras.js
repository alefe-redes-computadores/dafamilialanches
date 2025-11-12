/* =====================================================
   🍔 Da Família Lanches — Extras.js (v1.4 Final)
   - Miniaturas corrigidas (altura e corte)
   - Notificações transformadas (Visual Black Toast)
   - Força visual via CSS Injection agressivo
   ===================================================== */

(function () {
  
    // 1. INJEÇÃO DE CSS (Transforma o visual do site)
    (function injectStyles() {
      if (document.getElementById('dfl-extras-style')) return;
      const st = document.createElement('style');
      st.id = 'dfl-extras-style';
      st.textContent = `
        /* --- TRANSFORMAÇÃO DO POPUP ORIGINAL --- */
        /* Forçamos a classe .popup-add existente a virar o Toast Preto */
        .popup-add, .dfl-toast {
          position: fixed !important;
          top: 20px !important; 
          bottom: auto !important; /* Anula o CSS antigo */
          left: 50% !important;
          transform: translateX(-50%) translateY(-150%) !important; /* Começa escondido pra cima */
          
          background: #222 !important; 
          color: #fff !important;
          font-family: sans-serif !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          
          padding: 12px 24px !important; 
          border-radius: 50px !important; 
          box-shadow: 0 8px 30px rgba(0,0,0,0.4) !important;
          
          z-index: 2147483647 !important; /* Z-index Máximo para ficar acima de tudo */
          opacity: 0 !important;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s !important;
          pointer-events: none !important;
          
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 200px !important;
          white-space: nowrap !important;
        }
  
        /* Classe para mostrar o popup */
        .popup-add.show, .dfl-toast.show {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(0) !important;
        }
  
        /* Ícone simulado via CSS antes do texto */
        .popup-add::before {
          content: "🔔";
          margin-right: 8px;
        }
        
        /* --- CORREÇÃO DAS MINIATURAS (MANTIDO) --- */
        .pedido-card .pedido-thumb {
          width: 100% !important;
          height: 110px !important;
          background-size: cover !important;
          background-position: center center !important;
          border-radius: 8px !important;
          margin-bottom: 10px !important;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
          background-color: transparent !important; /* Remove fundo cinza */
        }
      `;
      document.head.appendChild(st);
    })();
  
    // 2. FUNÇÃO DE TOAST AUXILIAR (Caso o script principal falhe)
    // Cria um elemento igual ao .popup-add se ele não existir
    function showManualToast(msg) {
      let el = document.querySelector('.popup-add');
      
      // Se não existir (script.js ainda não criou), cria um fake
      if (!el) {
        el = document.createElement('div');
        el.className = 'popup-add';
        document.body.appendChild(el);
      }
  
      // Atualiza texto
      el.textContent = msg;
      
      // Força animação
      requestAnimationFrame(() => {
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
      });
    }
  
    // 3. DETECTOR DE LOGIN (Garante a mensagem de sucesso)
    document.addEventListener('DOMContentLoaded', () => {
      try {
        // Pequeno delay para garantir que o Firebase carregou
        setTimeout(() => {
            if (window.firebase && firebase.auth) {
                firebase.auth().onAuthStateChanged(user => {
                  // Verifica se já mostramos a mensagem nesta sessão para não ficar repetindo
                  if (user && !sessionStorage.getItem('dfl_logged_in_msg')) {
                    sessionStorage.setItem('dfl_logged_in_msg', 'true');
                    
                    // Dispara o toast manual
                    const nome = user.displayName ? user.displayName.split(' ')[0] : 'Cliente';
                    showManualToast(`🎉 Login realizado! Olá, ${nome}.`);
                  }
                });
            }
        }, 1500);
      } catch (e) { console.warn(e); }
    });
  
    // 4. MAPA DE IMAGENS E CORREÇÃO VISUAL (MANTIDO)
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
  
    function pickThumb(text) {
      if (!text) return null;
      const lower = text.toLowerCase();
      for (const t of THUMB_MAP) {
        if (lower.includes(t.key)) return t.img;
      }
      return null;
    }
  
    function fixThumbnail(cardElement) {
      const thumbDiv = cardElement.querySelector('.pedido-thumb');
      if (!thumbDiv) return;
  
      const textContent = cardElement.innerText || '';
      const newImg = pickThumb(textContent);
  
      if (newImg) {
          thumbDiv.style.backgroundImage = `url('${newImg}')`;
      }
      
      // Garante o estilo correto
      thumbDiv.style.height = '110px'; 
      thumbDiv.style.backgroundSize = 'cover';
      thumbDiv.style.backgroundPosition = 'center';
    }
  
    function processOrders() {
      const list = document.getElementById('listaPedidos');
      if (!list) return;
      Array.from(list.children).forEach(fixThumbnail);
    }
  
    function watchOrders() {
      const list = document.getElementById('listaPedidos');
      if (!list) return;
      
      processOrders();
      const mo = new MutationObserver(processOrders);
      mo.observe(list, { childList: true, subtree: true });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', watchOrders);
    } else {
      watchOrders();
    }
  
  })();
