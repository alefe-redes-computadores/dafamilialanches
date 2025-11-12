/* =====================================================
   🍔 Da Família Lanches — Extras.js (v2.0 Fun & Vibrant)
   - Notificações Inteligentes (Topo vs Centro)
   - Animações "Bouncy" e modernas
   - Correção de Miniaturas (Mantida)
   - Detecção de Login (Mantida)
   ===================================================== */

(function () {
  
    // 1. INJEÇÃO DE CSS (Design System DFL Moderno)
    (function injectStyles() {
      if (document.getElementById('dfl-extras-style')) return;
      const st = document.createElement('style');
      st.id = 'dfl-extras-style';
      st.textContent = `
        /* --- BASE DO TOAST (Comum a todos) --- */
        .popup-add, .dfl-toast {
          position: fixed !important;
          left: 50% !important;
          z-index: 2147483647 !important; /* Acima de tudo */
          
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          
          font-family: 'Segoe UI', Roboto, sans-serif !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          white-space: nowrap !important;
          
          border-radius: 50px !important;
          pointer-events: none !important;
          
          /* Transição Suave e Divertida (Bouncy) */
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          opacity: 0 !important;
        }
  
        /* --- MODO 1: TOAST DE TOPO (Ações Rápidas: Carrinho, Cupom) --- */
        .dfl-toast-top {
          top: 20px !important;
          bottom: auto !important;
          transform: translateX(-50%) translateY(-150%) !important; /* Escondido acima */
          
          background: #222 !important;
          color: #fff !important;
          padding: 10px 20px !important;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
          min-width: auto !important;
        }
        
        /* Estado Visível (Topo) */
        .dfl-toast-top.show {
          opacity: 1 !important;
          transform: translateX(-50%) translateY(0) !important;
        }
  
        /* --- MODO 2: TOAST CENTRAL (Momentos Especiais: Login, Pedido) --- */
        .dfl-toast-center {
          top: 50% !important;
          left: 50% !important;
          bottom: auto !important;
          /* Começa pequeno e transparente (Zoom Effect) */
          transform: translate(-50%, -50%) scale(0.8) !important; 
          
          background: rgba(0, 0, 0, 0.85) !important; /* Translúcido Chique */
          backdrop-filter: blur(4px); /* Desfoque sutil no fundo */
          color: #fff !important;
          
          padding: 20px 30px !important;
          font-size: 1.1rem !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
  
        /* Estado Visível (Centro) */
        .dfl-toast-center.show {
          opacity: 1 !important;
          transform: translate(-50%, -50%) scale(1) !important;
        }
  
        /* Cores de Contexto (Opcional, mas dá um charme) */
        .dfl-bg-success { border-left: 4px solid #4caf50 !important; }
        .dfl-bg-error { border-left: 4px solid #f44336 !important; }
        
        /* --- CORREÇÃO DAS MINIATURAS (MANTIDO) --- */
        .pedido-card .pedido-thumb {
          width: 100% !important;
          height: 110px !important;
          background-size: cover !important;
          background-position: center center !important;
          border-radius: 8px !important;
          margin-bottom: 10px !important;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
          background-color: transparent !important;
        }
      `;
      document.head.appendChild(st);
    })();
  
    // 2. LÓGICA INTELIGENTE DE EXIBIÇÃO
    function showSmartToast(msg) {
      // Tenta usar o elemento existente do script principal ou cria um novo
      let el = document.querySelector('.popup-add');
      if (!el) {
        el = document.createElement('div');
        el.className = 'popup-add';
        document.body.appendChild(el);
      }
  
      // Detecta o "clima" da mensagem
      const isSpecial = /Login|Sucesso|Parabéns|Pedido|Finaliz/i.test(msg);
      const isError = /Erro|Inválido|Falha/i.test(msg);
      const isCart = /carrinho/i.test(msg);
  
      // Escolhe o ícone (Emoji)
      let icon = '';
      if (msg.includes('Login')) icon = '🎉';
      else if (msg.includes('Pedido')) icon = '📦';
      else if (msg.includes('adicionado')) icon = '🛒';
      else if (msg.includes('removido')) icon = '🗑️';
      else if (msg.includes('Cupom')) icon = '🎟️';
      else if (isError) icon = '⚠️';
      else icon = '🍔'; // Padrão DFL
  
      // Limpa classes antigas para resetar animação
      el.className = 'popup-add'; 
      el.innerHTML = `<span style="font-size: 1.2em;">${icon}</span> <span>${msg}</span>`;
  
      // Aplica o estilo baseado no tipo
      if (isSpecial) {
          el.classList.add('dfl-toast-center');
          if(!isError) el.style.color = '#fff';
      } else {
          el.classList.add('dfl-toast-top');
          // Borda colorida sutil para feedback rápido
          if(isCart) el.style.borderLeft = '4px solid #ffca28'; // Amarelo DFL
          if(isError) el.style.borderLeft = '4px solid #f44336';
      }
  
      // Trigger Reflow (Reinicia a animação CSS)
      void el.offsetWidth;
  
      // Mostra
      el.classList.add('show');
  
      // Tempo de exibição (Especiais ficam um pouco mais)
      const time = isSpecial ? 3500 : 2500;
      
      // Limpa timer anterior se houver (embora estejamos reaproveitando o elemento)
      if (window.dflToastTimer) clearTimeout(window.dflToastTimer);
      
      window.dflToastTimer = setTimeout(() => {
        el.classList.remove('show');
      }, time);
    }
  
    // 3. INTEGRAÇÃO (O "Monkey Patch")
    // Substitui a função original para usar nosso sistema bonito
    window.addEventListener('load', () => {
        // Salva a original se precisar (opcional), mas aqui vamos sobrescrever
        window.popupAdd = function(msg) {
            showSmartToast(msg);
        };
        console.log('✨ DFL Toast System v2.0 ativado!');
    });
  
    // 4. DETECTOR DE LOGIN (Mensagem Especial)
    document.addEventListener('DOMContentLoaded', () => {
      try {
        setTimeout(() => {
            if (window.firebase && firebase.auth) {
                firebase.auth().onAuthStateChanged(user => {
                  // Verifica sessão para não spamar
                  if (user && !sessionStorage.getItem('dfl_logged_in_msg')) {
                    sessionStorage.setItem('dfl_logged_in_msg', 'true');
                    
                    const nome = user.displayName ? user.displayName.split(' ')[0] : 'Cliente';
                    // Dispara o Toast Central Especial
                    showSmartToast(`🎉 Login realizado com sucesso! Olá, ${nome}.`);
                  }
                });
            }
        }, 1500);
      } catch (e) { console.warn(e); }
    });
  
    // 5. CORREÇÃO DE MINIATURAS (Lógica Mantida)
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
  
      if (newImg) thumbDiv.style.backgroundImage = `url('${newImg}')`;
      
      // Força o estilo correto
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
