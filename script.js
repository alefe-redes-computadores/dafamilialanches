/* ===========================================================
   🍰 Degust script.js — v12.0.4 (ENGINE PRINCIPAL)
   ESTRATÉGIA: LEGO DE MICRO-MÓDULOS (PARTE 1)
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  
  // --- ESTADO GLOBAL (REATIVO) ---
  const state = {
    cart: [],
    currentUser: null,
    db: null,
    auth: null,
    isFirebaseInitialized: false,
    ui_lock: false,
    pixCopied: false,
    activeCoupon: null,
    deliveryConfig: {
      taxa: 7.00,
      gratisAcima: 80.00,
      statusLoja: 'aberto' // 'aberto' ou 'fechado'
    }
  };
  
    // --- CONFIGURAÇÃO LOGÍSTICA AVANÇADA (EXPANSÃO 1) ---
  const CONFIG_BUSINESS = {
    horarios: {
      abertura: "09:00",
      fechamento: "22:00",
      dias: [1, 2, 3, 4, 5, 6, 0] // 0 é domingo
    },
    contatos: {
      whatsapp: "5534999999999",
      instagram: "@degust.bolos",
      email_admin: "degustbolosnopote@gmail.com"
    }
  };

  const isLojaAberta = () => {
    const agora = new Date();
    const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + agora.getMinutes().toString().padStart(2, '0');
    const diaSemana = agora.getDay();
    if (!CONFIG_BUSINESS.horarios.dias.includes(diaSemana)) return false;
    return horaAtual >= CONFIG_BUSINESS.horarios.abertura && horaAtual <= CONFIG_BUSINESS.horarios.fechamento;
  };

  /* =========================================================
     🛡️ SISTEMA DE AUDITORIA E LOGS (EXPANSÃO 2)
  ========================================================= */
  const registrarErroTecnico = async (contexto, erro) => {
    console.error(`[Erro - ${contexto}]:`, erro);
    if (!state.db) return;
    try {
      await state.db.collection("LogsErros").add({
        usuario: state.currentUser ? state.currentUser.email : "Visitante",
        contexto: contexto,
        mensagem: erro.message || "Erro desconhecido",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        prefixo: "degust"
      });
    } catch (e) {
      console.warn("Falha ao registrar log.");
    }
  };


  // --- CONFIGURAÇÃO DE FIDELIDADE (MATRIZ DE PRÊMIOS) ---
  const FIDELIDADE_MASTER = {
    prefixo: "degust_",
    meta: 5,
    recompensas: [
      { nível: 1, pedido: 5,  tipo: "cupom",  valor: 5,  desc: "Cupom R$ 5,00 OFF" },
      { nível: 2, pedido: 10, tipo: "cupom",  valor: 10, desc: "Cupom R$ 10,00 OFF" },
      { nível: 3, pedido: 15, tipo: "brinde", valor: 1,  desc: "1 Bolo no Pote Grátis" },
      { nível: 4, pedido: 20, tipo: "cupom",  valor: 15, desc: "Cupom R$ 15,00 OFF" },
      { nível: 5, pedido: 25, tipo: "brinde", valor: 2,  desc: "2 Bolos no Pote Grátis" },
      { nível: 6, pedido: 30, tipo: "combo",  valor: 0,  desc: "Combo Degust Especial" }
    ]
  };

  // --- UTILS: TRAVA DE SEGURANÇA (Debounce de Cliques) ---
  const lockUI = (duration = 400) => {
    state.ui_lock = true;
    setTimeout(() => { state.ui_lock = false; }, duration);
  };

  // --- UTILS: MOTOR DE RETRY (Blindagem de Conexão) ---
  const withRetry = async (fn, maxRetries = 3, interval = 1500) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const wait = interval * Math.pow(2, i); // Exponential Backoff
        console.warn(`[Retry ${i+1}/${maxRetries}] Falha na conexão. Tentando em ${wait}ms...`);
        await new Promise(resolve => setTimeout(resolve, wait));
      }
    }
    throw lastError;
  };

  // --- UTILS: FORMATADOR DE MOEDA ---
  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  /* FIM DA PARTE 1 - AGUARDANDO OK PARA INICIAR O UIMANAGER COMPLETO */
  /* =========================================================
     🛡️ UIManager v11.5 (CONTROLE DE FLUXO E INTERFACE)
     Focado em performance mobile e prevenção de conflitos.
  ========================================================= */
  const UIManager = {
    activePanels: new Set(),

    open(name, element) {
      if (state.ui_lock || !element) return;
      lockUI(500);

      // Se o painel já estiver aberto, não faz nada
      if (this.activePanels.has(name)) return;

      console.log(`[UI] Abrindo: ${name}`);

      // Lógica de visualização baseada no tipo de container
      if (element.classList.contains('modal') || element.classList.contains('painel-overlay')) {
        element.style.display = 'flex';
        // Pequeno delay para a animação CSS (fade-in/scale) funcionar
        setTimeout(() => element.classList.add('show', 'active'), 10);
      } else if (element.id === 'mini-cart' || element.id === 'side-menu') {
        element.classList.add('active');
        element.setAttribute('aria-hidden', 'false');
      }

      this.activePanels.add(name);

      // Gestão de Backdrop e Travamento de Scroll
      const backdrop = document.getElementById('cart-backdrop');
      if (backdrop && name !== 'side-menu') {
        backdrop.classList.add('active');
        document.body.classList.add('no-scroll');
      }

      // Se abrir algo que não seja o menu lateral, garante que o menu feche
      if (name !== 'side-menu') this.closeSideMenu();
    },

    close(name, element) {
      if (!element) return;
      console.log(`[UI] Fechando: ${name}`);

      element.classList.remove('show', 'active');
      element.setAttribute('aria-hidden', 'true');

      // Se for modal, espera a animação de saída antes de dar display: none
      if (element.classList.contains('modal') || element.classList.contains('painel-overlay')) {
        setTimeout(() => {
          if (!element.classList.contains('show')) {
            element.style.display = 'none';
          }
        }, 400);
      }

      this.activePanels.delete(name);

      // Só remove o backdrop e o no-scroll se não houver mais nada aberto
      if (this.activePanels.size === 0 || (this.activePanels.size === 1 && this.activePanels.has('side-menu'))) {
        const backdrop = document.getElementById('cart-backdrop');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    },

    closeAll() {
      console.log("[UI] Fechando todos os componentes ativos");
      
      // Fecha Modais e Overlays
      document.querySelectorAll('.modal, .painel-overlay, #mini-cart').forEach(el => {
        const name = el.id || 'unnamed-panel';
        this.close(name, el);
      });

      this.closeSideMenu();
      this.activePanels.clear();
      
      const backdrop = document.getElementById('cart-backdrop');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('no-scroll');
    },

    closeSideMenu() {
      const menu = document.getElementById('side-menu');
      const overlay = document.getElementById('menu-overlay');
      if (menu) menu.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      this.activePanels.delete('side-menu');
      
      // Se for a única coisa aberta, devolve o scroll ao body
      if (this.activePanels.size === 0) {
        document.body.classList.remove('no-scroll');
      }
    },

    // Executa uma ação após fechar o menu (limpa a fila de execução)
    handleMenuAction(callback) {
      this.closeSideMenu();
      setTimeout(() => {
        if (typeof callback === 'function') callback();
      }, 350);
    }
  };

  /* FIM DA PARTE 2 - AGUARDANDO OK PARA A PARTE 3: FIREBASE E AUTH COMPLETO */
    /* =========================================================
     ✨ UI ENHANCEMENTS (Lifecycle de Animação)
     Garante que o DOM não sofra "reflow" pesado no celular.
  ========================================================= */

  const playFeedback = (type = 'click') => {
    if (navigator.vibrate) {
      const patterns = { click: 10, success: [10, 30, 10], error: [50, 50, 50] };
      navigator.vibrate(patterns[type] || 10);
    }
  };

  const safeAnimate = (element, className, displayType = 'flex') => {
    return new Promise((resolve) => {
      if (!element) return resolve();
      
      if (className === 'show') {
        element.style.display = displayType;
        void element.offsetWidth; 
        element.classList.add('show');
        element.addEventListener('transitionend', () => resolve(), { once: true });
      } else {
        element.classList.remove('show');
        element.addEventListener('transitionend', () => {
          element.style.display = 'none';
          resolve();
        }, { once: true });
      }
    });
  };

  const originalOpen = UIManager.open;
  UIManager.open = async function(name, element) {
    playFeedback('click');
    if (element && element.classList.contains('modal')) {
      await safeAnimate(element, 'show');
    }
    originalOpen.apply(this, arguments);
  };

  
  /* =========================================================
     🔥 FIREBASE CORE & AUTHENTICATION (DETALHADO)
     Garante que o app saiba quem é o usuário em tempo real.
  ========================================================= */

  const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "degust-bolos.firebaseapp.com",
    projectId: "degust-bolos",
    storageBucket: "degust-bolos.appspot.com",
    messagingSenderId: "9514758263",
    appId: "1:9514758263:web:ce0f8a8e3"
  };

  const initFirebase = async () => {
    try {
      if (state.isFirebaseInitialized) return;

      // Inicializa App apenas se não houver um ativo
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      state.db = firebase.firestore();
      state.auth = firebase.auth();
      state.isFirebaseInitialized = true;

      // ATIVAÇÃO DE PERSISTÊNCIA (Crucial para o seu 4G/5G em Patos)
      // Permite que o carrinho e dados do user fiquem salvos mesmo sem internet
      await state.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("[Firestore] Persistência falhou: Múltiplas abas.");
        } else if (err.code === 'unimplemented') {
          console.warn("[Firestore] Persistência não suportada pelo navegador.");
        }
      });

      console.log("Firebase: Sistema On-line e Persistente. ✅");
      
      // Gatilhos iniciais
      loadGlobalSettings();
      setupAuthListener();

    } catch (error) {
      console.error("Erro Crítico Firebase:", error);
      popupAdd("⚠️ Erro de conexão com o servidor. Verifique seu sinal.");
    }
  };

  // 👤 O VIGILANTE (Auth Listener)
  const setupAuthListener = () => {
    state.auth.onAuthStateChanged(async (user) => {
      const loginBtn = document.getElementById("user-btn-content");
      const fotoWrap = document.getElementById("user-foto-wrap");
      const fotoImg = document.getElementById("user-foto");

      if (user) {
        console.log(`[Auth] Usuário logado: ${user.displayName}`);
        state.currentUser = user;
        
        // Atualiza UI do Header
        if (loginBtn) loginBtn.textContent = user.displayName.split(' ')[0];
        if (fotoWrap && fotoImg) {
          fotoImg.src = user.photoURL || 'default-avatar.png';
          fotoWrap.style.display = "block";
        }

        // Sincroniza dados do banco com o prefixo degust_
        await syncUserProgress(user.uid);
        
      } else {
        console.log("[Auth] Usuário deslogado.");
        state.currentUser = null;
        
        // Reseta UI do Header
        if (loginBtn) loginBtn.textContent = "Entrar";
        if (fotoWrap) fotoWrap.style.display = "none";
      }

      // Re-renderiza o carrinho para atualizar possíveis benefícios de logado
      renderCart();
    });
  };

  // 🔄 SINCRONIZAÇÃO DE PERFIL (Proteção de Dados)
  const syncUserProgress = async (uid) => {
    try {
      const userRef = state.db.collection("usuarios").doc(uid);
      const doc = await withRetry(() => userRef.get());

      if (!doc.exists) {
        console.log("[Sync] Criando perfil para novo cliente...");
        await userRef.set({
          degust_nome: state.currentUser.displayName,
          degust_email: state.currentUser.email,
          degust_bolosPedidos: 0,
          degust_pontosAcumulados: 0,
          degust_cadastroData: firebase.firestore.FieldValue.serverTimestamp(),
          prefixo: "degust"
        });
      } else {
        console.log("[Sync] Perfil existente carregado.");
      }
    } catch (err) {
      console.error("[Sync] Erro ao sincronizar:", err);
    }
  };

  /* FIM DA PARTE 3 - AGUARDANDO OK PARA A PARTE 4: LOGIN GOOGLE E CONFIGS DA CAROL */
  /* =========================================================
     🔑 LOGIN GOOGLE & CONFIGURAÇÕES REMOTAS
     Gerencia a entrada do usuário e os ajustes da Carol.
  ========================================================= */

  // ⚙️ BUSCA AJUSTES DA CAROL (settings/degust_config)
  const loadGlobalSettings = async () => {
    try {
      // Tenta buscar as configurações reais do banco de dados
      const configDoc = await withRetry(() => 
        state.db.collection("settings").doc("degust_config").get()
      );

      if (configDoc.exists) {
        const remoteData = configDoc.data();
        // Mescla as configurações remotas com os estados locais
        if (remoteData.gratisAcima) state.deliveryConfig.gratisAcima = remoteData.gratisAcima;
        if (remoteData.taxaPadrao) state.deliveryConfig.taxa = remoteData.taxaPadrao;
        
        console.log("Configurações: Ajustes da Carol aplicados com sucesso.");
      } else {
        console.warn("Configurações: Documento não encontrado. Usando padrões locais.");
      }
    } catch (err) {
      console.error("Configurações: Falha ao carregar ajustes remotos.", err);
    }
  };

  // 🔐 HANDLER DO LOGIN GOOGLE
  const handleGoogleLogin = async () => {
    if (state.ui_lock) return;
    lockUI(1500); // Trava maior para processo de login

    const loginBtn = document.getElementById("google-login");
    const originalContent = loginBtn ? loginBtn.innerHTML : "Entrar com Google";

    const provider = new firebase.auth.GoogleAuthProvider();
    // Força a escolha da conta para evitar logins automáticos indesejados
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner"></span> Conectando ao Google...';
      }

      const result = await state.auth.signInWithPopup(provider);
      const userFirstName = result.user.displayName.split(' ')[0];
      
      popupAdd(`Seja bem-vindo(a), ${userFirstName}! 🧁`);
      UIManager.closeAll();

    } catch (error) {
      console.error("Login: Erro na autenticação.", error);
      
      // Tratamento de erros específicos para o usuário
      if (error.code === 'auth/popup-closed-by-user') {
        popupAdd("⚠️ O login foi cancelado.");
      } else if (error.code === 'auth/network-request-failed') {
        popupAdd("❌ Erve de rede. Verifique seu sinal de celular.");
      } else {
        popupAdd("❌ Falha ao entrar. Tente novamente mais tarde.");
      }
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalContent;
      }
    }
  };

  // 🚪 LOGOUT (Para o menu de configurações)
  const handleLogout = async () => {
    try {
      await state.auth.signOut();
      popupAdd("Você saiu da sua conta. Até logo! 👋");
      UIManager.closeAll();
    } catch (err) {
      console.error("Logout: Erro ao sair.", err);
    }
  };

  /* FIM DA PARTE 4 - AGUARDANDO OK PARA A PARTE 5: GESTÃO DO CARRINHO E ADICIONAIS */
  /* =========================================================
     🛒 MOTOR DO CARRINHO & CUSTOMIZAÇÃO (EXTRAS)
     Gerencia a entrada de itens e a lógica de toppings.
  ========================================================= */

  // ➕ ADIÇÃO SIMPLES (Botão Adicionar direto)
  window.addItem = (nome, preco) => {
    if (state.ui_lock) return;
    lockUI(200);

    // Procura se já existe exatamente esse mesmo item (sem extras) no carrinho
    const index = state.cart.findIndex(item => item.nome === nome && !item.extras);
    
    if (index !== -1) {
      state.cart[index].qtd++;
    } else {
      state.cart.push({
        nome: nome,
        preco: parseFloat(preco),
        qtd: 1,
        extras: null // Identificador de item "puro"
      });
    }
    
    // Feedback visual e sonoro
    renderCart();
    if (typeof sound !== 'undefined') sound.play(); 
    
    // Incentivo de Fidelidade (Função virá na Parte 7)
    if (state.currentUser) {
      mostrarIncentivoFidelidade();
    } else {
      popupAdd("Bolo no carrinho! Entre para ganhar prêmios. 🎁");
    }
  };

  // 🍫 ABRIR CONFIGURADOR DE EXTRAS
  window.openExtras = (nome, precoBase) => {
    const modal = document.getElementById("extras-modal");
    const container = modal ? modal.querySelector(".extras-list") : null;
    
    if (!modal || !container) return;

    // Limpa e reconstrói a lista de Toppings (TOPPINGS_DATA vem do extras.js)
    container.innerHTML = TOPPINGS_DATA.map(t => `
      <div class="extra-item-row" onclick="this.querySelector('input').click()">
        <div class="extra-main-info">
          <input type="checkbox" name="topping" value="${t.nome}" data-price="${t.preco}" onclick="event.stopPropagation()">
          <span class="extra-name">${t.nome}</span>
        </div>
        <span class="extra-price-tag">+ ${formatCurrency(t.preco)}</span>
      </div>
    `).join("");

    // Armazena metadados no elemento para a confirmação
    modal.dataset.tempNome = nome;
    modal.dataset.tempPreco = precoBase;
    
    UIManager.open("extras", modal);
  };

  // ✅ CONFIRMAR E ADICIONAR COM EXTRAS
  document.getElementById("extras-confirm")?.addEventListener("click", () => {
    const modal = document.getElementById("extras-modal");
    if (!modal) return;

    const nomeOriginal = modal.dataset.tempNome;
    const precoOriginal = parseFloat(modal.dataset.tempPreco);
    
    // Captura apenas os marcados
    const selecionados = Array.from(modal.querySelectorAll('input[name="topping"]:checked')).map(i => ({
      nome: i.value,
      preco: parseFloat(i.dataset.price)
    }));

    if (selecionados.length === 0) {
      // Se não escolheu nada, trata como item comum
      window.addItem(nomeOriginal, precoOriginal);
    } else {
      // Cria um nome descritivo para o carrinho
      const extrasNomes = selecionados.map(s => s.nome).join(", ");
      const precoAdicionais = selecionados.reduce((acc, curr) => acc + curr.preco, 0);
      
      state.cart.push({
        nome: `${nomeOriginal} (+ ${selecionados.length} extras)`,
        detalhes: extrasNomes,
        preco: precoOriginal + precoAdicionais,
        qtd: 1,
        extras: selecionados // Guarda o array para relatórios futuros
      });
      
      renderCart();
      if (typeof sound !== 'undefined') sound.play();
      popupAdd("Personalizado com sucesso! 🍰✨");
    }

    UIManager.close("extras", modal);
  });

  /* FIM DA PARTE 5 - AGUARDANDO OK PARA A PARTE 6: LOGÍSTICA, VIACEP E FRETE DINÂMICO */
  /* =========================================================
     🚚 LOGÍSTICA: VIA CEP & CÁLCULO DE FRETE
     Calcula a distância (CEP) e o progresso para frete grátis.
  ========================================================= */

  // 📍 BUSCA DE ENDEREÇO VIA API
  const executarBuscaCEP = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, "");
    const btn = document.getElementById("btn-calcular-frete");
    const inputEndereco = document.getElementById("endereco-auto");

    if (cleanCEP.length !== 8) {
      popupAdd("⚠️ CEP incompleto. Digite os 8 números.");
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';
      }

      // Consulta ViaCEP com o motor de Retry para falhas de sinal
      const response = await withRetry(() => fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`));
      const data = await response.json();

      if (data.erro) {
        popupAdd("❌ CEP não encontrado. Verifique os números.");
        return;
      }

      // Preenche os campos automaticamente
      if (inputEndereco) {
        inputEndereco.value = `${data.logradouro}, ${data.bairro} — ${data.localidade}/${data.uf}`;
      }
      
      // Habilita campos de complemento e número
      document.getElementById("numero-input").disabled = false;
      document.getElementById("complemento-input").disabled = false;
      
      // Define a taxa padrão (que pode ser sobrescrita pela Carol no Firebase)
      state.deliveryConfig.taxa = 7.00; 
      
      popupAdd("Endereço localizado! 📍");
      renderCart(); // Re-renderiza para aplicar a taxa no total

    } catch (err) {
      console.error("Erro ViaCEP:", err);
      popupAdd("⚠️ Erro ao conectar ao serviço de mapas.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Buscar";
      }
    }
  };

  // 📈 ATUALIZADOR DA BARRA DE PROGRESSO (UX)
  const atualizarVisualFrete = (subtotal) => {
    const barFill = document.getElementById("progressFill");
    const labelText = document.getElementById("progressText");
    const meta = state.deliveryConfig.gratisAcima;

    if (!barFill || !labelText) return;

    if (subtotal >= meta) {
      // FRETE GRÁTIS ATINGIDO
      barFill.style.width = "100%";
      barFill.style.background = "var(--success)";
      labelText.innerHTML = "<strong>Parabéns!</strong> Você ganhou Frete Grátis! 🚀";
      state.deliveryConfig.taxa = 0;
    } else {
      // CALCULA O QUE FALTA
      const faltam = meta - subtotal;
      const porcentagem = (subtotal / meta) * 100;
      
      barFill.style.width = `${porcentagem}%`;
      barFill.style.background = "linear-gradient(90deg, var(--dourado), var(--vermelho))";
      labelText.innerHTML = `Faltam <strong>${formatCurrency(faltam)}</strong> para Frete Grátis 🚀`;
      
      // Se não for retirada e o CEP foi buscado, restaura a taxa padrão
      const isRetirada = document.getElementById("retirar-local")?.checked;
      if (!isRetirada && document.getElementById("endereco-auto")?.value !== "") {
        state.deliveryConfig.taxa = 7.00;
      }
    }
  };

  // Listeners de Logística
  document.getElementById("btn-calcular-frete")?.addEventListener("click", () => {
    const val = document.getElementById("cep-input").value;
    executarBuscaCEP(val);
  });

  document.getElementById("retirar-local")?.addEventListener("change", (e) => {
    const areaEntrega = document.getElementById("frete-area");
    if (e.target.checked) {
      if (areaEntrega) areaEntrega.style.opacity = "0.5";
      state.deliveryConfig.taxa = 0;
    } else {
      if (areaEntrega) areaEntrega.style.opacity = "1";
      // Recalcula se deve cobrar taxa ou se já bateu o frete grátis
      renderCart();
    }
    renderCart();
  });

  /* FIM DA PARTE 6 - AGUARDANDO OK PARA A PARTE 7: RENDERIZAÇÃO DO CARRINHO E RESUMO DE VALORES */
  /* =========================================================
     🎨 MOTOR DE RENDERIZAÇÃO PRO (v12.5 - ESTENDIDO)
     Inclui gestão de observações e metadados por item.
  ========================================================= */

  window.renderCart = () => {
    const listCont = document.querySelector(".mini-list");
    const countHeader = document.getElementById("cart-count");
    if (!listCont) return;

    listCont.innerHTML = "";
    let subtotal = 0;
    let totalItensQtd = 0;

    if (state.cart.length === 0) {
      listCont.innerHTML = `
        <div class="cart-empty-state">
          <span class="empty-icon">🍰</span>
          <p>Seu carrinho está vazio.<br>Escolha uma doçura!</p>
        </div>`;
    }

    state.cart.forEach((item, index) => {
      const itemTotal = item.preco * item.qtd;
      subtotal += itemTotal;
      totalItensQtd += item.qtd;

      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item-expanded";
      itemDiv.innerHTML = `
        <div class="cart-item-main">
          <div class="cart-item-details">
            <span class="cart-item-name">${item.nome}</span>
            ${item.detalhes ? `<small class="cart-item-extras">${item.detalhes}</small>` : ''}
            <span class="cart-item-price-unit">${formatCurrency(item.preco)}</span>
          </div>
          <div class="cart-item-ctrl">
            <button class="btn-qty" onclick="changeQty(${index}, -1)">−</button>
            <span class="qty-val">${item.qtd}</span>
            <button class="btn-qty" onclick="changeQty(${index}, 1)">+</button>
          </div>
        </div>
        <div class="item-obs-area" style="margin-top: 8px;">
          <input type="text" class="input-obs-cart" 
                 placeholder="Alguma observação para este item?" 
                 onchange="state.cart[${index}].obs = this.value" 
                 value="${item.obs || ''}"
                 style="width: 100%; font-size: 12px; padding: 5px; border-radius: 5px; border: 1px solid #ddd; background: #f9f9f9;">
        </div>
      `;
      listCont.appendChild(itemDiv);
    });

    if (countHeader) countHeader.textContent = totalItensQtd;

    atualizarVisualFrete(subtotal);
    
    let valorDesconto = 0;
    if (state.activeCoupon) {
      const c = state.activeCoupon;
      valorDesconto = c.tipo === "fixo" ? c.valor : (subtotal * (c.valor / 100));
    }

    const totalFinal = Math.max(0, subtotal + state.deliveryConfig.taxa - valorDesconto);
    atualizarResumoFinalUI(subtotal, state.deliveryConfig.taxa, totalFinal);
  };

  // 📝 ATUALIZA OS TEXTOS DE VALORES NO RODAPÉ DO CARRINHO
  const atualizarResumoFinalUI = (sub, taxa, total) => {
    const actionsArea = document.getElementById("cart-actions-area");
    if (!actionsArea) return;

    actionsArea.innerHTML = `
      <div class="cart-totals-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${formatCurrency(sub)}</span>
        </div>
        <div class="summary-row">
          <span>Taxa de Entrega</span>
          <span class="${taxa === 0 ? 'free-tag' : ''}">${taxa === 0 ? 'GRÁTIS' : formatCurrency(taxa)}</span>
        </div>
        <div class="summary-row total-row-main">
          <span>Total</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
      <button id="main-finish-btn" class="btn-checkout-start" onclick="iniciarCheckout(${total})">
        FECHAR PEDIDO ➔
      </button>
    `;
  };

  // 🔄 ALTERADOR DE QUANTIDADE
  window.changeQty = (index, delta) => {
    if (state.ui_lock) return;
    lockUI(100);

    state.cart[index].qtd += delta;
    
    if (state.cart[index].qtd <= 0) {
      state.cart.splice(index, 1);
      popupAdd("Item removido.");
    }
    
    renderCart();
  };

  /* FIM DA PARTE 7 - AGUARDANDO OK PARA A PARTE 8: CUPONS E FIDELIDADE PROGRESSIVA */
  /* =========================================================
     🎁 SISTEMA DE FIDELIDADE & CUPONS REATIVOS
     Lógica de descontos e progressão de prêmios.
  ========================================================= */

  /* =========================================================
     🎫 ADVANCED COUPON ENGINE (Validação Profunda)
     Gerencia regras de negócio, validade e limites.
  ========================================================= */

  const aplicarCupomService = async (codigo) => {
    if (state.ui_lock) return;
    lockUI(1000);

    const subtotalAtual = state.cart.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    const msgEl = document.getElementById("coupon-message");
    if (!msgEl) return;

    try {
      msgEl.innerHTML = '<span class="spinner-small"></span> Validando regras...';
      
      const doc = await withRetry(() => state.db.collection("cupons").doc(codigo).get());
      
      if (!doc.exists) {
        throw new Error("Este cupom não existe.");
      }
      
      const c = doc.data();

      // 1. Verificação de Ativação
      if (!c.ativo) throw new Error("Este cupom foi desativado.");

      // 2. Verificação de Validade Temporal
      if (c.validade && c.validade.toDate() < new Date()) {
        throw new Error("Este cupom expirou.");
      }
      
      // 3. Verificação de Valor Mínimo
      if (c.valorMinimo && subtotalAtual < c.valorMinimo) {
        throw new Error(`Pedido mínimo para este cupom: ${formatCurrency(c.valorMinimo)}`);
      }

      // 4. Verificação de Uso Único (Opcional)
      if (c.apenasPrimeira && state.currentUser) {
        const checkPeds = await state.db.collection("Pedidos")
          .where("userId", "==", state.currentUser.uid)
          .where("prefixo", "==", "degust")
          .limit(1).get();
          
        if (!checkPeds.empty) throw new Error("Válido apenas para sua primeira compra!");
      }

      // Sucesso
      state.activeCoupon = {
        id: codigo,
        tipo: c.tipo,
        valor: c.valor
      };

      msgEl.innerHTML = `<span class="success-txt">✅ Cupom "${codigo}" aplicado!</span>`;
      playFeedback('success');
      popupAdd(`Desconto de ${c.tipo === 'fixo' ? formatCurrency(c.valor) : c.valor + '%'} ativado! 🎁`);
      
    } catch (err) {
      state.activeCoupon = null;
      msgEl.innerHTML = `<span class="err-txt">❌ ${err.message}</span>`;
      playFeedback('error');
    } finally {
      renderCart(); // Atualiza os totais
    }
  };

  // 🎁 MOTOR DE INCENTIVO (Quanto falta para o prêmio?)
  const mostrarIncentivoFidelidade = async () => {
    if (!state.currentUser) return;
    
    try {
      const userRef = state.db.collection("usuarios").doc(state.currentUser.uid);
      const userDoc = await userRef.get();
      
      // Busca o progresso real usando o prefixo degust_
      const bolosJaPedidos = userDoc.exists ? (userDoc.data().degust_bolosPedidos || 0) : 0;
      
      // Encontra na nossa matriz (FIDELIDADE_MASTER) o próximo marco
      const proximoMarco = FIDELIDADE_MASTER.recompensas.find(r => r.pedido > bolosJaPedidos);
      
      if (proximoMarco) {
        const faltam = proximoMarco.pedido - bolosJaPedidos;
        const msgIncentivo = faltam === 1 
          ? `Falta só 1 bolo para você ganhar: ${proximoMarco.desc}! 🍰`
          : `Faltam ${faltam} bolos para você ganhar seu prêmio de ${proximoMarco.desc}! 🎁`;
        
        // Dispara o toast especial do extras.js
        if (typeof popupAdd === 'function') {
          setTimeout(() => popupAdd(msgIncentivo, 4500), 800);
        }
      }
    } catch (err) {
      console.warn("Fidelidade: Erro ao calcular incentivo visual.", err);
    }
  };

  // Listener do Formulário de Cupom
  document.getElementById("coupon-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.ui_lock) return;
    lockUI(1000);

    const input = document.getElementById("coupon-input");
    if (input && input.value.trim() !== "") {
      aplicarCupomService(input.value.trim().toUpperCase());
    }
  });

  /* FIM DA PARTE 8 - AGUARDANDO OK PARA A PARTE 9: CHECKOUT E MODAL DE PAGAMENTO PIX */
  /* =========================================================
     💠 CHECKOUT INTELIGENTE & PAGAMENTO (v12.0)
     Garante que o pedido só avance se todos os dados estiverem OK.
  ========================================================= */

  window.iniciarCheckout = async (valorTotal) => {
    if (state.ui_lock) return;
    lockUI(600);

    // 1. Validação de Carrinho Vazio
    if (state.cart.length === 0) {
      return popupAdd("Seu carrinho está vazio! Escolha um bolo primeiro. 🛒");
    }

    // 2. Validação de Autenticação (Garante pontos para o cliente)
    if (!state.currentUser) {
      popupAdd("Identifique-se para acumular pontos neste pedido! 👤");
      UIManager.open("login", document.getElementById("login-modal"));
      return;
    }

    // 3. Validação de Logística
    const isRetirada = document.getElementById("retirar-local")?.checked;
    const enderecoAuto = document.getElementById("endereco-auto")?.value;
    const numeroManual = document.getElementById("numero-input")?.value;
    const enderecoManual = document.getElementById("manualEndereco")?.value;

    if (!isRetirada) {
      // Se não for retirada, precisa de um endereço (seja via CEP ou Manual)
      const temEndereco = (enderecoAuto && numeroManual) || (enderecoManual);
      if (!temEndereco) {
        popupAdd("⚠️ Por favor, informe onde devemos entregar seu bolo.");
        return;
      }
    }

    // 4. Preparação do Modal de Pagamento
    const pixModal = document.getElementById("pix-modal");
    const displayValor = document.getElementById("pix-valor");

    if (displayValor) {
      displayValor.textContent = formatCurrency(valorTotal);
    }

    // Abre o modal de finalização
    UIManager.open("pix", pixModal);
    console.log(`[Checkout] Iniciado para o valor: ${valorTotal}`);
  };

  // --- CONTROLE DOS BOTÕES DO MODAL PIX ---
  
  // Copiar chave PIX
  document.getElementById("btn-copy-pix")?.addEventListener("click", () => {
    const chavePix = "degustbolosnopote@gmail.com";
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(chavePix).then(() => {
        state.pixCopied = true;
        popupAdd("Chave PIX copiada com sucesso! 💠");
        
        // Efeito visual no botão
        const btn = document.getElementById("btn-copy-pix");
        if (btn) {
          const originalText = btn.innerHTML;
          btn.innerHTML = "✅ Chave Copiada!";
          setTimeout(() => { btn.innerHTML = originalText; }, 3000);
        }
      });
    } else {
      // Fallback para navegadores antigos/celulares específicos
      popupAdd(`Chave: ${chavePix}`);
    }
  });

  /* FIM DA PARTE 9 - AGUARDANDO OK PARA A PARTE 10: SALVAMENTO BLINDADO NO FIRESTORE (A JOIA DA COROA) */
  /* =========================================================
     💾 GRAVAÇÃO BLINDADA (DATABASE & FIDELIDADE)
     Garante a integridade do pedido e dos pontos do cliente.
  ========================================================= */

  const processarPedidoNoBanco = async (metodoPagamento) => {
    if (state.ui_lock) return;
    lockUI(2000);

    const btnFinish = document.getElementById("btn-finish-pix");
    const originalBtnTxt = btnFinish ? btnFinish.innerHTML : "";

    try {
      // 1. Início do Loading Visual
      if (btnFinish) {
        btnFinish.disabled = true;
        btnFinish.innerHTML = '<span class="spinner"></span> Processando Pedido...';
      }

      // 2. Coleta de Dados de Logística
      const isRetirada = document.getElementById("retirar-local")?.checked;
      const endAuto = document.getElementById("endereco-auto")?.value;
      const numAuto = document.getElementById("numero-input")?.value;
      const endManual = document.getElementById("manualEndereco")?.value;

      const enderecoFinal = isRetirada 
        ? "Retirada na Loja (Degust)" 
        : (endAuto ? `${endAuto}, Nº ${numAuto}` : endManual);

      // 3. Cálculos de Conferência
      const subtotal = state.cart.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
      const desconto = state.activeCoupon ? (state.activeCoupon.tipo === 'fixo' ? state.activeCoupon.valor : (subtotal * (state.activeCoupon.valor / 100))) : 0;
      const totalGeral = Math.max(0, subtotal + state.deliveryConfig.taxa - desconto);

      // 4. Objeto do Pedido (Estrutura v12.0)
      const novoPedido = {
        userId: state.currentUser.uid,
        cliente_nome: state.currentUser.displayName,
        cliente_email: state.currentUser.email,
        prefixo: "degust",
        itens: state.cart.map(item => ({
          nome: item.nome,
          qtd: item.qtd,
          preco_un: item.preco,
          extras: item.detalhes || "Nenhum"
        })),
        financeiro: {
          subtotal: subtotal,
          taxa_entrega: state.deliveryConfig.taxa,
          desconto_aplicado: desconto,
          cupom: state.activeCoupon ? state.activeCoupon.id : "Nenhum",
          total_pago: totalGeral
        },
        logistica: {
          metodo: isRetirada ? "Retirada" : "Entrega",
          endereco_completo: enderecoFinal,
          pagamento_escolhido: metodoPagamento
        },
        status: "novo",
        data_criacao: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 5. EXECUÇÃO DA TRANSAÇÃO (Pedido + Ponto de Fidelidade)
      await withRetry(async () => {
        const userRef = state.db.collection("usuarios").doc(state.currentUser.uid);
        const pedidosRef = state.db.collection("Pedidos").doc(); // Gera ID automático

        await state.db.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          
          // Incrementa contador de bolos do usuário (prefixo degust_)
          const totalAntigo = userDoc.exists ? (userDoc.data().degust_bolosPedidos || 0) : 0;
          const novoTotal = totalAntigo + 1;

          transaction.set(pedidosRef, novoPedido);
          transaction.update(userRef, {
            degust_bolosPedidos: novoTotal,
            degust_ultimoPedidoData: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
      });

      // 6. Sucesso: Disparar WhatsApp e Resetar
      enviarWhatsApp(novoPedido);
      
      popupAdd("Pedido Confirmado! 🍰✨");
      state.cart = [];
      state.activeCoupon = null;
      renderCart();
      UIManager.closeAll();

    } catch (err) {
      console.error("Erro Crítico no Salvamento:", err);
      popupAdd("❌ Falha ao salvar. Por favor, tire print do carrinho e envie no Whats!");
    } finally {
      if (btnFinish) {
        btnFinish.disabled = false;
        btnFinish.innerHTML = originalBtnTxt;
      }
    }
  };

  // Funções de gatilho do Modal PIX
  document.getElementById("btn-finish-pix")?.addEventListener("click", () => processarPedidoNoBanco("PIX Copia e Cola"));
  document.getElementById("btn-finish-sem-pix")?.addEventListener("click", () => processarPedidoNoBanco("Pagamento na Entrega"));

  /* FIM DA PARTE 10 - AGUARDANDO OK PARA A PARTE 11: INTEGRAÇÃO WHATSAPP E PAINÉIS DE HISTÓRICO */
  /* =========================================================
     📱 INTEGRAÇÃO WHATSAPP & HISTÓRICO DE CLIENTE
     Transforma dados em mensagens e exibe o passado do usuário.
  ========================================================= */

  // 🟢 GERADOR DE MENSAGEM WHATSAPP (v12.0)
  const enviarWhatsApp = (p) => {
    const f = p.financeiro;
    const l = p.logistica;
    
    let msg = `*🍰 NOVO PEDIDO - DEGUST BOLOS*\n`;
    msg += `_ID do Cliente: ${p.userId.substring(0, 5)}..._\n`;
    msg += `--------------------------------------\n`;
    msg += `👤 *Cliente:* ${p.cliente_nome}\n`;
    msg += `📍 *Local:* ${l.endereco_completo}\n`;
    msg += `💳 *Pagamento:* ${l.pagamento_escolhido}\n`;
    msg += `--------------------------------------\n\n`;

    p.itens.forEach(item => {
      msg += `▪️ ${item.qtd}x *${item.nome}*\n`;
      if (item.extras !== "Nenhum") msg += `   _Extras: ${item.extras}_\n`;
      msg += `   Sub: ${formatCurrency(item.preco_un * item.qtd)}\n\n`;
    });

    msg += `--------------------------------------\n`;
    msg += `💰 *Subtotal:* ${formatCurrency(f.subtotal)}\n`;
    if (f.desconto_aplicado > 0) msg += `🎁 *Desconto:* -${formatCurrency(f.desconto_aplicado)}\n`;
    msg += `🛵 *Entrega:* ${f.taxa_entrega === 0 ? 'GRÁTIS' : formatCurrency(f.taxa_entrega)}\n`;
    msg += `⭐ *TOTAL: ${formatCurrency(f.total_pago)}*\n`;
    msg += `--------------------------------------\n\n`;
    msg += `_Pedido enviado via site Degust Bolos_`;

    const numeroCarol = "5538998527894"; // Substitua pelo número real dela
    const url = `https://wa.me/${numeroCarol}?text=${encodeURIComponent(msg)}`;
    
    // Pequeno delay para o usuário ver o feedback de sucesso no site antes de sair
    setTimeout(() => { window.open(url, '_blank'); }, 1000);
  };

  // 📦 CARREGADOR DE HISTÓRICO (Painel Meus Pedidos)
  window.carregarPedidos = async () => {
    if (!state.currentUser) return;
    
    const container = document.getElementById("listaPedidos");
    if (!container) return;

    container.innerHTML = `
      <div class="loading-history">
        <span class="spinner"></span>
        <p>Buscando suas doçuras...</p>
      </div>
    `;

    try {
      const snapshot = await withRetry(() => 
        state.db.collection("Pedidos")
          .where("userId", "==", state.currentUser.uid)
          .where("prefixo", "==", "degust")
          .orderBy("data_criacao", "desc")
          .limit(8)
          .get()
      );

      if (snapshot.empty) {
        container.innerHTML = '<p class="empty-msg">Você ainda não tem pedidos salvos. 🍰</p>';
        return;
      }

      container.innerHTML = snapshot.docs.map(doc => {
        const d = doc.data();
        const dataFmt = d.data_criacao ? d.data_criacao.toDate().toLocaleDateString('pt-BR') : 'Agora';
        const totalFmt = formatCurrency(d.financeiro.total_pago);
        
        return `
          <div class="pedido-card-item">
            <div class="p-card-header">
              <span class="p-data">${dataFmt}</span>
              <span class="p-status st-${d.status}">${d.status.toUpperCase()}</span>
            </div>
            <div class="p-card-body">
              ${d.itens.map(i => `<span>${i.qtd}x ${i.nome}</span>`).join('')}
            </div>
            <div class="p-card-footer">
              <span class="p-pagto">${d.logistica.pagamento_escolhido}</span>
              <strong class="p-total">${totalFmt}</strong>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error("Histórico:", err);
      container.innerHTML = '<p class="err-msg">Não conseguimos carregar seus pedidos agora. ⚠️</p>';
    }
  };

  /* FIM DA PARTE 11 - AGUARDANDO OK PARA A PARTE 12: PAINEL DE RECOMPENSAS E BUSCA INTELIGENTE */
  /* =========================================================
     🎁 PAINEL DE RECOMPENSAS (FIDELIDADE ATIVA)
     Renderiza o progresso do cliente e libera os prêmios.
  ========================================================= */

  window.carregarRecompensasUI = async () => {
    if (!state.currentUser) return;
    
    const listaRec = document.getElementById("listaRecompensas");
    const progMsg = document.getElementById("progresso-mensagem");
    const progBar = document.getElementById("progresso-bar");
    const contVal = document.getElementById("contador-valor");

    if (!listaRec) return;

    try {
      // Busca o progresso real do usuário no Firestore
      const userDoc = await state.db.collection("usuarios").doc(state.currentUser.uid).get();
      const bolosRealizados = userDoc.exists ? (userDoc.data().degust_bolosPedidos || 0) : 0;
      
      // Atualiza o contador gigante (Aquele da "Carol Admin")
      if (contVal) contVal.textContent = bolosRealizados;

      // Renderiza os cards de prêmios baseados na FIDELIDADE_MASTER (Parte 1)
      listaRec.innerHTML = FIDELIDADE_MASTER.recompensas.map(r => {
        const alcancado = bolosRealizados >= r.pedido;
        return `
          <div class="recompensa-item ${alcancado ? 'concluida' : ''}">
            <div class="rec-info-wrap">
              <span class="rec-icon">${alcancado ? '✨' : '🔒'}</span>
              <div class="rec-text-group">
                <p class="rec-title">${r.desc}</p>
                <small class="rec-meta">Meta: ${r.pedido}º pedido</small>
              </div>
            </div>
            ${alcancado ? '<span class="rec-status-badge">LIBERADO</span>' : ''}
          </div>
        `;
      }).join('');

      // --- ATUALIZAÇÃO DO TERMÔMETRO (BARRA) ---
      // Encontra qual é o próximo prêmio que ele ainda não ganhou
      const proximo = FIDELIDADE_MASTER.recompensas.find(r => r.pedido > bolosRealizados);
      
      if (proxima && progBar && progMsg) {
        const metaAtual = proximo.pedido;
        const faltam = metaAtual - bolosRealizados;
        const percentual = (bolosRealizados / metaAtual) * 100;
        
        progBar.style.width = `${percentual}%`;
        progMsg.innerHTML = `Faltam apenas <strong>${faltam}</strong> pedidos para seu próximo prêmio!`;
      } else if (progBar && progMsg) {
        progBar.style.width = "100%";
        progBar.style.background = "var(--success)";
        progMsg.textContent = "Parabéns! Você completou todos os níveis de fidelidade! 🏆";
      }

    } catch (err) {
      console.error("[Fidelidade UI] Falha ao renderizar prêmios:", err);
    }
  };

  /* =========================================================
     🔍 FILTRO DE BUSCA INTELIGENTE (SEM RELOAD)
     Esconde e mostra produtos conforme a digitação do cliente.
  ========================================================= */

  const dispararFiltroProdutos = (termo) => {
    // Normaliza para ignorar acentos e letras maiúsculas
    const query = termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cards = document.querySelectorAll(".card");
    const sections = document.querySelectorAll(".menu-section");

    cards.forEach(card => {
      // Busca no nome e na descrição (dataset ou texto)
      const nome = card.dataset.name ? card.dataset.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      const descricao = card.querySelector("p") ? card.querySelector("p").textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      
      if (nome.includes(query) || descricao.includes(query)) {
        card.style.display = "flex";
        card.classList.add("fade-in-search");
      } else {
        card.style.display = "none";
        card.classList.remove("fade-in-search");
      }
    });

    // Limpeza visual: Se uma seção ficar sem nenhum bolo visível, esconde o título dela
    sections.forEach(sec => {
      const temBolosVisiveis = Array.from(sec.querySelectorAll(".card")).some(c => c.style.display !== "none");
      sec.style.display = temBolosVisiveis ? "block" : "none";
    });
  };

  // Listener Real-time (Digitação)
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    dispararFiltroProdutos(e.target.value);
  });

  /* FIM DA PARTE 12 - AGUARDANDO OK PARA A PARTE 13: RELATÓRIOS ADMIN E INICIALIZAÇÃO FINAL */
  /* =========================================================
     📊 ADMIN DASHBOARD PRO (Relatórios Detalhados)
     Versão estendida para fechamento de caixa e métricas.
  ========================================================= */

  window.carregarRelatoriosAdmin = async (periodo = 'hoje') => {
    if (!state.currentUser) return;
    const container = document.getElementById("listaPedidos");
    if (!container) return;

    container.innerHTML = `
      <div class="admin-loading-state">
        <p>Gerando relatório de ${periodo}... 📈</p>
      </div>`;

    try {
      let inicio = new Date();
      inicio.setHours(0, 0, 0, 0); // Começo do dia de hoje
      
      // Lógica de Filtro Temporal
      if (periodo === 'semana') inicio.setDate(inicio.getDate() - 7);
      if (periodo === 'mes') inicio.setMonth(inicio.getMonth() - 1);

      const snapshot = await withRetry(() => 
        state.db.collection("Pedidos")
          .where("prefixo", "==", "degust")
          .where("data_criacao", ">=", firebase.firestore.Timestamp.fromDate(inicio))
          .orderBy("data_criacao", "desc")
          .get()
      );

      if (snapshot.empty) {
        container.innerHTML = `
          <div class="admin-header-controls">
            <button onclick="carregarRelatoriosAdmin('hoje')" class="btn-filter ${periodo === 'hoje' ? 'active' : ''}">Hoje</button>
            <button onclick="carregarRelatoriosAdmin('semana')" class="btn-filter ${periodo === 'semana' ? 'active' : ''}">Semana</button>
          </div>
          <p class="admin-empty">Nenhuma venda encontrada para este período.</p>`;
        return;
      }

      let stats = { total: 0, pix: 0, entrega: 0, itens: 0, fretes: 0 };
      let listaHtml = "";

      snapshot.forEach(doc => {
        const p = doc.data();
        const valorDoc = p.financeiro.total_pago;
        stats.total += valorDoc;
        stats.itens += p.itens.length;
        stats.fretes += p.financeiro.taxa_entrega;
        
        if (p.logistica.pagamento_escolhido.includes("PIX")) {
          stats.pix += valorDoc;
        } else {
          stats.entrega += valorDoc;
        }

        listaHtml += `
          <div class="admin-card-venda">
            <div class="venda-topo">
              <strong>${p.cliente_nome.split(' ')[0]}</strong>
              <span class="venda-valor">${formatCurrency(valorDoc)}</span>
            </div>
            <div class="venda-detalhes-min">
              <small>${p.logistica.metodo} • ${p.logistica.pagamento_escolhido}</small>
            </div>
          </div>`;
      });

      container.innerHTML = `
        <div class="admin-header-controls">
          <button onclick="carregarRelatoriosAdmin('hoje')" class="btn-filter ${periodo === 'hoje' ? 'active' : ''}">Hoje</button>
          <button onclick="carregarRelatoriosAdmin('semana')" class="btn-filter ${periodo === 'semana' ? 'active' : ''}">Semana</button>
        </div>
        <div class="admin-summary-grid">
          <div class="stat-box"><strong>Total</strong><span>${formatCurrency(stats.total)}</span></div>
          <div class="stat-box"><strong>Em PIX</strong><span>${formatCurrency(stats.pix)}</span></div>
          <div class="stat-box"><strong>Fretes</strong><span>${formatCurrency(stats.fretes)}</span></div>
        </div>
        <div class="admin-vendas-lista">
          ${listaHtml}
        </div>
      `;

    } catch (err) {
      console.error("[Admin Error]:", err);
      container.innerHTML = `<p class="err-msg">Erro ao gerar relatório. Verifique sua conexão. ⚠️</p>`;
    }
  };

  
    /* =========================================================
     🎯 NAVEGAÇÃO POR CATEGORIAS (SCROLL SUAVE)
     Faz o menu de abas acompanhar o movimento do usuário.
  ========================================================= */
  const observarCategorias = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.target === id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    document.querySelectorAll('.menu-section').forEach(sec => observer.observe(sec));
  };

  const setupScrollSuave = () => {
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = document.getElementById(tab.dataset.target);
        if (target) {
          window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        }
      });
    });
  };

  
  /* =========================================================
     🚀 INICIALIZAÇÃO DE EVENTOS (A SOLDA FINAL)
     Conecta todos os IDs do HTML às funções do JavaScript.
  ========================================================= */

  const vincularEventosDOM = () => {
    
    // 1. Menu e Navegação
    document.getElementById("hamburger-btn")?.addEventListener("click", () => UIManager.open("side-menu", document.getElementById("side-menu")));
    document.getElementById("menu-close")?.addEventListener("click", () => UIManager.closeSideMenu());
    document.getElementById("menu-overlay")?.addEventListener("click", () => UIManager.closeSideMenu());
    document.getElementById("cart-backdrop")?.addEventListener("click", () => UIManager.closeAll());

    // 2. Botões de Acesso (Header)
    document.getElementById("user-btn")?.addEventListener("click", () => {
      if (state.currentUser) {
        UIManager.open("recompensas", document.getElementById("painelRecompensasOverlay"));
        carregarRecompensasUI();
      } else {
        UIManager.open("login", document.getElementById("login-modal"));
      }
    });

    document.getElementById("cart-icon")?.addEventListener("click", () => {
      UIManager.open("mini-cart", document.getElementById("mini-cart"));
      renderCart();
    });

    // 3. Login e Logout
    document.getElementById("google-login")?.addEventListener("click", handleGoogleLogin);
    document.querySelectorAll(".btn-logout-action").forEach(btn => {
      btn.addEventListener("click", handleLogout);
    });

    // 4. Ações do Menu Lateral (Data-Actions)
    document.querySelectorAll(".menu-link-action").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const action = e.currentTarget.dataset.action;
        UIManager.handleMenuAction(() => {
          if (action === "perfil" || action === "recompensas") {
            UIManager.open("recompensas", document.getElementById("painelRecompensasOverlay"));
            carregarRecompensasUI();
          } else if (action === "meus-pedidos") {
            UIManager.open("pedidos", document.getElementById("painelPedidosOverlay"));
            carregarPedidos();
          } else if (action === "admin-vendas") {
            UIManager.open("admin", document.getElementById("painelPedidosOverlay"));
            carregarRelatoriosAdmin();
          }
        });
      });
    });

    // 5. Botões de Modais de Fechamento
    document.querySelectorAll(".extras-close, .modal-close").forEach(btn => {
      btn.addEventListener("click", () => UIManager.closeAll());
    });

    // 6. Sistema de Cookies (Banner)
    const cookieBtn = document.getElementById("cookie-accept");
    if (cookieBtn) {
      cookieBtn.addEventListener("click", () => {
        const banner = document.getElementById("cookie-banner");
        if (banner) banner.style.display = "none";
        localStorage.setItem("degust_cookies_v12", "accepted");
      });
      
      if (localStorage.getItem("degust_cookies_v12")) {
        const banner = document.getElementById("cookie-banner");
        if (banner) banner.style.display = "none";
      }
    }
  };

  /* =========================================================
     🛡️ MOTOR DE RESILIÊNCIA E LIFECYCLE (v12.9.3)
  ========================================================= */
  window.addEventListener('unhandledrejection', (event) => {
    registrarErroTecnico("Promessa Rejeitada", {
      message: event.reason.message || "Erro de Promessa",
      stack: event.reason.stack || "N/A"
    });
  });

  const sanitizarEstadoGlobal = () => {
    if (state.cart.length > 50) state.cart = state.cart.slice(0, 50);
    validarIntegridadeCart();
  };

  /* =========================================================
     💾 GESTÃO DE PERSISTÊNCIA (AUTO-SAVE)
  ========================================================= */
  const salvarSessaoLocal = () => {
    localStorage.setItem('degust_session_v12', JSON.stringify({
      cart: state.cart,
      coupon: state.activeCoupon,
      timestamp: Date.now()
    }));
  };

  const carregarSessaoLocal = () => {
    const salvo = localStorage.getItem('degust_session_v12');
    if (!salvo) return;
    try {
      const dados = JSON.parse(salvo);
      if (Date.now() - dados.timestamp < 86400000) {
        state.cart = dados.cart || [];
        state.activeCoupon = dados.coupon || null;
        renderCart();
      }
    } catch (e) { console.warn("Falha ao recuperar sessão."); }
  };


  const validarIntegridadeCart = () => {
    state.cart = state.cart.filter(item => item.nome && item.preco > 0);
  };

  window.updateItemObs = (index, valor) => {
    if (state.cart[index]) state.cart[index].obs = valor.substring(0, 100);
  };

  window.forceCloseUI = () => {
    state.ui_lock = false;
    UIManager.closeAll();
    popupAdd("Interface resetada! 🔄");
  };

  // --- IGNITE! (DISPARO DO SISTEMA) ---
  const bootstrap = async () => {
  const bootstrap = async () => {
    try {
      await initFirebase();
      sanitizarEstadoGlobal();
      carregarSessaoLocal(); // Ativa o que você colou antes
      observarCategorias();  // Ativa o que você acabou de colar
      setupScrollSuave();    // Ativa o clique nas categorias
      vincularEventosDOM();
      renderCart();
      console.log("🍰 Degust v12.9: Sistema 100% Robusto.");
    } catch (err) {
      console.error("Erro no Bootstrap:", err);
    }
  };

  bootstrap();

}); // FIM DO DOMCONTENTLOADED
