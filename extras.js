/* =====================================================
   🍔 Da Família Lanches — Extras.js (v1.3 Corrigida)
   - Corrige a altura das imagens (sem cortar)
   - Remove o fundo cinza duplicado
   - Reativa as notificações de "Adicionado ao Carrinho"
   - Força o aviso de "Login realizado"
   ===================================================== */

(function () {
  
  // 1. INJEÇÃO DE CSS (Toast + Ajuste de Miniatura)
  (function injectStyles() {
    if (document.getElementById('dfl-extras-style')) return;
    const st = document.createElement('style');
    st.id = 'dfl-extras-style';
    st.textContent = `
      /* Estilo do Toast Flutuante */
      .dfl-toast {
        position: fixed;
        top: 20px; left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: #333; color: #fff;
        padding: 12px 24px; border-radius: 50px; 
        font-weight: 600; font-size: 0.95rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        opacity: 0; z-index: 99999; pointer-events: none;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        display: flex; align-items: center; gap: 8px;
      }
      .dfl-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      .dfl-toast.success { background: #4caf50; } /* Verde para sucesso */

      /* Correção da Miniatura nos Pedidos */
      .pedido-card .pedido-thumb {
        width: 100% !important;
        height: 110px !important; /* Altura fixa menor para não cortar */
        background-size: cover !important;
        background-position: center center !important;
        border-radius: 8px !important;
        margin-bottom: 10px !important;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
      }
    `;
    document.head.appendChild(st);
  })();

  // 2. SISTEMA DE NOTIFICAÇÃO (TOAST)
  let toastTimer = null;
  
  function showToast(msg, tipo = 'normal') {
    let el = document.querySelector('.dfl-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'dfl-toast';
      document.body.appendChild(el);
    }
    
    // Ícones baseados no texto
    let icon = '🔔';
    if(msg.includes('adicionado')) icon = '✅';
    if(msg.includes('removido')) icon = '🗑️';
    if(msg.includes('Login')) icon = '🎉';
    if(msg.includes('erro')) icon = '⚠️';

    el.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    
    // Cores
    if (tipo === 'success' || msg.includes('sucesso') || msg.includes('adicionado')) {
        el.style.background = '#4caf50'; // Verde
    } else {
        el.style.background = '#333'; // Padrão
    }

    // Animação
    void el.offsetWidth; // Trigger reflow
    el.classList.add('show');
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // 3. INTEGRAÇÃO: Sobrescreve a função 'popupAdd' do script.js principal
  // Isso faz com que o "Adicionar ao Carrinho" use este toast novo automaticamente!
  window.addEventListener('load', () => {
      if (typeof window.popupAdd !== 'undefined') {
          window.popupAdd = function(msg) {
              showToast(msg);
          };
          console.log('✅ Extras.js assumiu as notificações do site.');
      }
  });

  // 4. DETECTOR DE LOGIN (Backup)
  // Caso o script principal não chame o popup, este aqui garante.
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
          // Só mostra se o usuário acabou de logar (evita mostrar ao recarregar a página)
          // Usamos session storage para saber se já mostramos nessa sessão
          if (user && !sessionStorage.getItem('dfl_welcome_shown')) {
            sessionStorage.setItem('dfl_welcome_shown', 'true');
            setTimeout(() => showToast(`Login realizado com sucesso! Bem-vindo, ${user.displayName?.split(' ')[0] || 'Cliente'}!`), 500);
          }
        });
      }
    } catch (e) { console.warn(e); }
  });

  // 5. MAPA DE IMAGENS (Palavras-chave)
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
    return null; // Retorna null se não achar, mantendo a imagem padrão do script.js
  }

  // 6. PROCESSADOR DE MINIATURAS
  function fixThumbnail(cardElement) {
    // Procura a div da imagem que o script.js JÁ criou
    const thumbDiv = cardElement.querySelector('.pedido-thumb');
    if (!thumbDiv) return;

    // Pega o texto do pedido para descobrir qual imagem usar
    const textContent = cardElement.innerText || '';
    const newImg = pickThumb(textContent);

    // Se acharmos uma imagem melhor no mapa, aplicamos
    if (newImg) {
        thumbDiv.style.backgroundImage = `url('${newImg}')`;
    }
    
    // APLICAMOS A CORREÇÃO DE TAMANHO AQUI (Sobrescrevendo o CSS inline)
    // Isso remove o problema da imagem cortada/cinza
    thumbDiv.style.height = '110px'; 
    thumbDiv.style.backgroundSize = 'cover';
    thumbDiv.style.backgroundPosition = 'center';
  }

  function processOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    // Aplica a correção para cada cartão de pedido
    Array.from(list.children).forEach(fixThumbnail);
  }

  // Observador: Fica vigiando se novos pedidos aparecem na tela
  function watchOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    
    // Roda uma vez imediatamente
    processOrders();

    // Roda sempre que o HTML da lista mudar (ex: carregou do Firebase)
    const mo = new MutationObserver(processOrders);
    mo.observe(list, { childList: true, subtree: true });
  }

  // Inicializa
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchOrders);
  } else {
    watchOrders();
  }

})();
