/* ==========================================================================
   🚀 DA FAMÍLIA LANCHES (DFL) — CÓDIGO FONTE INTEGRAL (SEM CORTES)
   PARTE 1 de 5
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================================================
    // 1. INICIALIZAÇÃO ROBUSTA DO FIREBASE (CORREÇÃO DO ERRO DE LOGIN)
    // ==========================================================================
    // Coloque suas chaves aqui se não estiverem no HTML
    const firebaseConfig = {
        // apiKey: "...",
        // authDomain: "...",
        // projectId: "...",
    };

    let db, auth;
    let currentUser = null;
    let isFirebaseInitialized = false;

    // Função declarada no topo para evitar "ReferenceError"
    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            if (!firebase.apps.length) {
                if (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey) {
                    firebase.initializeApp(firebaseConfig);
                    console.log("Firebase iniciado via Config Interna.");
                } else {
                    console.warn("Firebase iniciado via Config Global (HTML).");
                }
            } else {
                firebase.app(); // Usa instância existente
            }
            
            // Define variáveis globais do sistema
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseInitialized = true;
            
            // Listener de Autenticação (Mantém o usuário logado)
            auth.onAuthStateChanged((user) => {
                if (user) {
                    currentUser = user;
                    // Atualiza nome no botão de login se existir
                    const btnLogin = document.querySelector(".login-btn-header"); 
                    if(btnLogin) {
                        const primeiroNome = user.displayName ? user.displayName.split(' ')[0] : 'Cliente';
                        btnLogin.textContent = `Olá, ${primeiroNome}`;
                    }
                } else {
                    currentUser = null;
                }
            });
            console.log("🔥 Sistema DFL: Banco de Dados Conectado.");
        } catch (e) {
            console.error("ERRO CRÍTICO AO INICIAR FIREBASE:", e);
            alert("Erro de conexão. Verifique sua internet.");
        }
    }

    // Tenta iniciar imediatamente para garantir
    try { inicializarFirebase(); } catch(e) {}

    // ==========================================================================
    // 2. INJEÇÃO DE CSS (ESTILOS PREMIUM COMPLETOS)
    // ==========================================================================
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- Grade de Promoções --- */
        #promocoes-area {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
            gap: 15px;
            padding: 5px 10px;
        }

        /* --- Card Premium --- */
        .promo-card-styled {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border: 1px solid #eee;
            height: 100%;
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .promo-card-styled:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .promo-card-styled img {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-bottom: 4px solid #ffca28; /* Amarelo DFL */
        }

        .promo-body { 
            padding: 12px;
            display: flex;
            flex-direction: column;
            flex: 1; 
            text-align: center;
        }

        .promo-title { 
            color: #d84315;
            font-size: 1rem;
            font-weight: 800;
            margin: 0 0 6px 0;
            line-height: 1.3;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .promo-desc { 
            font-size: 0.8rem;
            color: #555;
            margin-bottom: 10px;
            line-height: 1.4;
            flex: 1;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .promo-prices {
            margin-bottom: 10px;
        }
        .promo-old {
            text-decoration: line-through;
            color: #999;
            font-size: 0.85rem;
            display: block;
        }
        .promo-new {
            color: #2e7d32;
            font-weight: 800;
            font-size: 1.4rem;
        }
        
        /* --- Botão Verde Largo --- */
        .btn-add-green {
            background: linear-gradient(180deg, #66bb6a 0%, #43a047 100%);
            color: white;
            border: none; 
            padding: 12px;
            border-radius: 8px;
            font-weight: 700; 
            font-size: 1rem;
            width: 100%;
            cursor: pointer;
            box-shadow: 0 4px 0 #2e7d32; 
            transition: transform 0.1s, box-shadow 0.1s;
            text-transform: uppercase;
            margin-top: auto;
        }
        .btn-add-green:active {
            transform: translateY(4px);
            box-shadow: 0 0 0 #2e7d32;
        }
        
        /* --- Ícones de Recompensa (Estilos) --- */
        .tier-icon {
            font-size: 2rem; /* Tamanho Grande como pedido */
            margin-right: 15px;
        }
        .recompensa-item {
            background: #fff;
            border: 1px solid #eee;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .recompensa-item.conquistado {
            background: #e8f5e9;
            border-color: #4caf50;
        }
    `;
    document.head.appendChild(style);
    // ==========================================================================
    // 3. DADOS, VARIÁVEIS E FUNÇÕES UTILITÁRIAS
    // ==========================================================================
    
    /* Variáveis Globais */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   

    /* Função de Formatação de Dinheiro */
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    
    /* Wrapper de Segurança */
    const safe = (fn) => (...a) => { 
        try { fn(...a); } catch (e) { console.error("Erro DFL:", e); } 
    };  

    /* Algoritmo de Busca Inteligente (Levenshtein) */
    const levenshtein = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    /* CATÁLOGO DE PRODUTOS COMPLETO */
    const PROMO_DATA = [  
        null, // Índice 0 reservado  
        { 
            id: 1, 
            nome: "Dupla Purizin + Fanta", 
            desc: "2 Hot Dogs 'Purizin' com purê cremoso, milho e batata + 1 Fanta Laranja Geladinha!", 
            preco: 34.99, 
            precoAntigo: 40.00, 
            img: "promocoes/promo1.jpg" 
        },  
        { 
            id: 2, 
            nome: "Trio Padaná - Desconto Fiel", 
            desc: "3 Hot Dogs 'Padaná' completos (2 salsichas, bacon, vinagrete) para dividir com a galera!", 
            preco: 37.99, 
            precoAntigo: 45.00, 
            img: "promocoes/promo2.jpg" 
        },  
        { 
            id: 3, 
            nome: "Combo 2 Peleja Artesanal", 
            desc: "2 Burgers Artesanais 'Peleja' (120g) com filé de frango e bacon. Sabor inigualável!", 
            preco: 39.99, 
            precoAntigo: 52.00, 
            img: "promocoes/promo3.jpg" 
        },  
        { 
            id: 4, 
            nome: "Trio Trem Completo + Refri", 
            desc: "3 Burgers 'Trem' tradicionais com bacon, milho, queijo e batata palha + Fanta 1L!", 
            preco: 44.99, 
            precoAntigo: 52.00, 
            img: "promocoes/promo4.jpg" 
        },  
        { 
            id: 5, 
            nome: "Combo 4 Trem + Fanta 1L", 
            desc: "O clássico da família: 4 sanduíches Trem deliciosos e refri para acompanhar.", 
            preco: 49.99, 
            precoAntigo: 65.00, 
            img: "promocoes/promo5.jpg" 
        },  
        { 
            id: 6, 
            nome: "Combo 5 Uai", 
            desc: "5 Lanches Uai (X-Bacon Salada) para matar a fome de todo mundo.", 
            preco: 54.99, 
            precoAntigo: 65.00, 
            img: "promocoes/promo6.jpg" 
        },  
        { 
            id: 7, 
            nome: "Combo 4 TremBão + Fanta", 
            desc: "4 Dogões 'TremBão' com tudo dentro (purê, bacon, 2 salsichas) + Refri.", 
            preco: 59.99, 
            precoAntigo: 77.00, 
            img: "promocoes/promo7.jpg" 
        },  
        { 
            id: 8, 
            nome: "Combo 4 Armaria", 
            desc: "4 Sanduíches Armaria (Hambúrguer + Frango + Tudo) com bastante recheio.", 
            preco: 59.99, 
            precoAntigo: 72.00, 
            img: "promocoes/promo8.jpg" 
        },  
        { 
            id: 9, 
            nome: "Combo 5 Uai + Kuat 2L", 
            desc: "A festa completa com 5 lanches Uai e um refrigerante tamanho família.", 
            preco: 64.99, 
            precoAntigo: 79.99, 
            img: "promocoes/promo9.jpg" 
        }  
    ];

    /* ELEMENTOS DO DOM (SELETORES) */
    const el = {  
        cartIcon: document.getElementById("cart-icon"),  
        cartCount: document.getElementById("cart-count"),  
        miniCart: document.getElementById("mini-cart"),  
        miniList: document.querySelector(".mini-list"),  
        miniFoot: document.querySelector(".mini-foot"),  
        cartBackdrop: document.getElementById("cart-backdrop"),  
        extrasModal: document.getElementById("extras-modal"),  
        extrasList: document.querySelector("#extras-modal .extras-list"),  
        comboModal: document.getElementById("combo-modal"),  
        comboBody: document.querySelector("#combo-modal #combo-body"),  
        loginModal: document.getElementById("login-modal"),  
        googleBtn: document.getElementById("google-login"),  
        
        promocoesGrid: document.getElementById("promocoes-area"),
        searchInput: document.getElementById("search-input"),
        
        userBtn: document.getElementById("user-btn"),  
        reportsBtn: document.getElementById("reports-btn"),   
        
        pedidosBtn: document.querySelector(".meus-pedidos-btn"),  
        pedidosPanel: document.getElementById("painelPedidos"),  
        pedidosLista: document.getElementById("listaPedidos"),  
        
        recompensasBtn: document.querySelector(".recompensas-btn"),  
        recompensasPanel: document.getElementById("recompensas-panel"),  
        recompensasLista: document.getElementById("listaRecompensas"),  
        
        // Elementos de Frete e Endereço Manual
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill")
    };

    /* RENDERIZAÇÃO DA GRADE (PRODUTOS) */
    function renderPromocoesGrid() {
        if (!el.promocoesGrid) return;
        
        el.promocoesGrid.innerHTML = PROMO_DATA.map(p => {
            if(!p) return ''; 
            
            return `
            <div class="promo-card-styled" data-name="${p.nome}" data-price="${p.preco}">
                <img src="${p.img}" alt="${p.nome}" loading="lazy">
                <div class="promo-body">
                    <h3 class="promo-title">${p.nome}</h3>
                    <p class="promo-desc">${p.desc}</p>
                    <div class="promo-prices">
                        <span class="promo-old">De ${money(p.precoAntigo)}</span>
                        <span class="promo-new">Por ${money(p.preco)}</span>
                    </div>
                    <button class="btn-add-green" onclick="window.addToCart('${p.nome}', ${p.preco})">Adicionar</button>
                </div>
            </div>`;
        }).join('');
    }
    
    // Torna a função global acessível ao HTML
    window.addToCart = (nome, preco) => addCommonItem(nome, preco);
    
    // Inicia a renderização
    renderPromocoesGrid();
    
    // Configura a Busca
    if (el.searchInput) {
        el.searchInput.placeholder = "🔍 O que você procura? (Ex: TremBão)";
        el.searchInput.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".card, .promo-card-styled"); 
            
            cards.forEach(card => {
                let nome = card.getAttribute("data-name")?.toLowerCase() || "";
                if (!nome) nome = card.querySelector(".promo-title")?.innerText.toLowerCase() || "";

                if (!termo) { 
                    card.style.display = "flex"; 
                    return; 
                }
                
                const contem = nome.includes(termo);
                const erroAceitavel = termo.length > 3 && levenshtein(nome, termo) <= 2;

                if (contem || erroAceitavel) {
                    card.style.display = "flex"; 
                } else {
                    card.style.display = "none";
                }
            });
        });
    }
    // ==========================================================================
    // 4. LÓGICA DE INTERFACE (MODAIS E BACKDROP)
    // ==========================================================================
    
    // Garante que o backdrop existe
    if (!el.cartBackdrop) {  
        const bd = document.createElement("div");  
        bd.id = "cart-backdrop";  
        document.body.appendChild(bd);  
        el.cartBackdrop = bd;  
    }  

    const Overlays = {  
        closeAll() {  
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach((e) => e.classList.remove("show", "active"));  
            el.cartBackdrop.classList.remove("active");  
            document.body.classList.remove("no-scroll");
        },  
        open(modalLike) {  
            Overlays.closeAll();  
            if (!modalLike) return;  
            
            const isPanel = (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel");
            modalLike.classList.add(isPanel ? "active" : "show");  
            
            el.cartBackdrop.classList.add("active");  
            document.body.classList.add("no-scroll");
        },  
    };  
    
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

    // Listener Global para botões de fechar
    document.addEventListener('click', (e) => {
        if (e.target.matches('.fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .login-close, .promo-close, .dashboard-close')) {
            Overlays.closeAll();
        }
        if (e.target.classList.contains('modal')) {
            Overlays.closeAll();
        }
    });
    
    // ABERTURA DO CARRINHO (AGORA SEGURA)
    if (el.cartIcon) {
        el.cartIcon.addEventListener("click", () => {
            inicializarFirebase(); // Garante conexão antes de abrir
            Overlays.open(el.miniCart);
        });
    }


    // ==========================================================================
    // 5. LÓGICA DE CARRINHO (COMBOS E EXTRAS)
    // ==========================================================================
    
    const comboDrinkOptions = {  
        casal: [  
            { rotulo: "Fanta 1L (padrão)", delta: 0.01 },  
            { rotulo: "Coca-Cola 1L", delta: 3.0 },  
            { rotulo: "Coca-Cola 1L Zero", delta: 3.0 },  
        ],  
        familia: [  
            { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 },  
            { rotulo: "Coca-Cola 2L", delta: 5.0 }, 
            { rotulo: "Coca-Cola 2L Zero", delta: 5.0 }, 
        ],  
    };  

    let _comboCtx = null;  
    
    function addCommonItem(nome, preco) {  
        const low = (nome||"").toLowerCase();
        
        // Lógica de Bebidas para Combos
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(nome)) { 
             const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;
             
             if (grupo && comboDrinkOptions[grupo]) {
                 el.comboBody.innerHTML = comboDrinkOptions[grupo].map((o, i) => `  
                  <label class="combo-option-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;margin-bottom:8px;cursor:pointer;">  
                    <span style="font-weight:600;">${o.rotulo}</span>  
                    <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>  
                    <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="margin-left:10px;">  
                  </label>`).join("");
                  
                 _comboCtx = { nomeCombo: nome, precoBase: preco, grupo };  
                 
                 const btnConfirm = document.getElementById("combo-confirm");
                 const newBtn = btnConfirm.cloneNode(true);
                 btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
                 
                 newBtn.onclick = () => {
                     const sel = el.comboBody.querySelector('input[name="combo-drink"]:checked');
                     if (!sel) return;
                     
                     const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
                     const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
                     const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);
                     
                     addToCartFinal(finalName, finalPrice);
                     Overlays.closeAll();
                 };
                 
                 Overlays.open(el.comboModal);
                 return;
             }
        }
        
        // Adição Simples
        addToCartFinal(nome, preco);
    }  
    
    function addToCartFinal(nome, preco) {
        const found = cart.find((i) => i.nome === nome && i.preco === preco);  
        if (found) found.qtd++;  
        else cart.push({ nome, preco, qtd: 1 });  
        renderMiniCart();  
        popupAdd(`${nome} adicionado!`); 
    }

    // EXTRAS (ADICIONAIS)
    const adicionais = [  
        { nome: "Cebola", preco: 0.99 }, { nome: "Salada", preco: 1.99 },  
        { nome: "Ovo", preco: 1.99 }, { nome: "Bacon", preco: 2.99 },  
        { nome: "Hambúrguer Tradicional 56g", preco: 2.99 }, { nome: "Cheddar Cremoso", preco: 3.99 },  
        { nome: "Filé de Frango", preco: 5.99 }, { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },  
    ];  

    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const card = e.currentTarget.closest(".card");
            const produtoExtras = card.dataset.name;
            const produtoPrecoBase = parseFloat(card.dataset.price) || 0;
            
            el.extrasList.innerHTML = adicionais.map((a, i) => `  
              <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #eee;border-radius:8px;margin-bottom:8px;cursor:pointer;">  
                <span style="font-weight:600;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>  
                <input type="checkbox" value="${i}" style="margin-left:10px;">  
              </label>`).join("");
            
            const btnConfirm = document.getElementById("extras-confirm");
            const newBtn = btnConfirm.cloneNode(true);
            btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
            
            newBtn.onclick = () => {
                const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];  
                let extrasTotal = 0;
                let nomes = [];
                
                checks.forEach(c => {
                    const idx = +c.value;
                    const ad = adicionais[idx];
                    extrasTotal += ad.preco;
                    nomes.push(ad.nome);
                });
                
                const nomeCompleto = nomes.length > 0 ? `${produtoExtras} + ${nomes.join(", ")}` : produtoExtras;
                const precoTotal = produtoPrecoBase + extrasTotal;
                
                addToCartFinal(nomeCompleto, precoTotal);
                Overlays.closeAll();  
            };
            
            Overlays.open(el.extrasModal);
        })
    );
    
    // Bind para botões estáticos no HTML
    document.querySelectorAll(".add-cart").forEach((btn) =>
        btn.addEventListener("click", (e) => {  
            const card = e.currentTarget.closest(".card");  
            if (!card) return;  
            addCommonItem(card.dataset.name, parseFloat(card.dataset.price));  
        })
    );
    // ==========================================================================
    // 6. FUNÇÃO DE ÍCONES DE RECOMPENSA (VERSÃO COMPLETA SEM CORTES)
    // ==========================================================================
    function getTierIcon(tier) {  
        const level = tier ? String(tier).toLowerCase().trim() : '';  
        
        // Lista completa de ícones (como você pediu)
        if (level.includes('ouro')) return '🥇';  
        if (level.includes('platina')) return '💎';  
        if (level.includes('diamante')) return '👑';  
        if (level.includes('safira')) return '💠';       
        if (level.includes('rubi')) return '♦️';         
        if (level.includes('esmeralda')) return '❇️';   
        if (level.includes('elite')) return '⚔️';        
        if (level.includes('supremo')) return '🚀';      
        if (level.includes('lenda') || level.includes('lendário')) return '🦁';        
        if (level.includes('mítico') || level.includes('mitico')) return '🦄';
        if (level.includes('brinde')) return '🎁';
        if (level.includes('coca')) return '🥤';
        if (level.includes('hambúrguer') || level.includes('burguer')) return '🍔';
        
        return '👤'; // Padrão
    } 

    // ==========================================================================
    // 7. RENDERIZAÇÃO E CÁLCULOS DO CARRINHO
    // ==========================================================================
    
    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  

        // Cálculo da Barra de Progresso
        const subtotal = cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
        const falta = LIMITE_FRETE_GRATIS - subtotal;
        const porcentagem = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
        
        if (el.progressFill) el.progressFill.style.width = `${porcentagem}%`;
        if (el.progressText) {
            if (subtotal >= LIMITE_FRETE_GRATIS) {
                el.progressText.innerHTML = `🎉 <strong>Oba!</strong> Você ganhou <strong>Frete Grátis</strong>!`;
            } else {
                el.progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> para Frete Grátis 🚀`;
            }
        }

        if (!cart.length) {  
            el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';  
            if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
            return;  
        }  

        el.miniList.innerHTML = cart.map((item, idx) => `  
      <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">  
        <div style="display:flex;justify-content:space-between;align-items:center;">  
          <div style="flex:1;">  
            <p style="font-weight:600;margin-bottom:4px;">${item.nome}</p>  
            <p style="color:#666;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p>  
          </div>  
          <div style="display:flex;gap:8px;align-items:center;">  
            <button type="button" class="cart-minus" onclick="window.updateQtd(${idx}, -1)" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>  
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>  
            <button type="button" class="cart-plus" onclick="window.updateQtd(${idx}, 1)" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>  
            <button type="button" class="cart-remove" onclick="window.removeItem(${idx})" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>  
          </div>  
        </div>  
      </div>`).join("");
      
      enhanceMiniCartUI(); 
    }  

    // Funções Globais do Carrinho
    window.updateQtd = (idx, delta) => {
        if (cart[idx]) {
            cart[idx].qtd += delta;
            if (cart[idx].qtd <= 0) cart.splice(idx, 1);
            renderMiniCart();
        }
    };
    window.removeItem = (idx) => {
        cart.splice(idx, 1);
        renderMiniCart();
        popupAdd("Item removido!");
    };

    // Validação de Cupom (Firestore) - CORRIGIDA para não quebrar se desconectado
    async function validarCupomFirestore(codigo, valorCompra) {
        if (!codigo) return { valido: false, discount: 0, msg: '' };
        
        try {
            if (!db) inicializarFirebase(); // Garante conexão
            
            const cupomRef = db.collection('cupons').doc(codigo.toUpperCase());
            const doc = await cupomRef.get();

            if (doc.exists) {
                const dados = doc.data();
                if (dados.ativo && (!dados.minimo || valorCompra >= dados.minimo)) {
                    let descontoFinal = 0;
                    if (dados.tipo === 'porcentagem') {
                        descontoFinal = (valorCompra * dados.valor) / 100;
                    } else {
                        descontoFinal = dados.valor;
                    }
                    return {
                        valido: true,
                        discount: descontoFinal,
                        freeShipping: dados.freteGratis || false,
                        msg: 'Cupom aplicado!'
                    };
                }
            }
            return { valido: false, discount: 0, msg: 'Inválido' };
        } catch (error) {
            console.error("Erro cupom:", error);
            return { valido: false, discount: 0, msg: 'Erro' };
        }
    }

    async function calcTotals() {  
        const subtotal = cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
        
        const couponInput = document.getElementById("coupon-input");
        const d = await validarCupomFirestore(couponInput ? couponInput.value : "", subtotal);   
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        let deliveryFee = DELIVERY_FEE_DEFAULT;   

        // Se for retirar, ou frete grátis, ou cupom de frete
        if (isRetirarLocal || subtotal >= LIMITE_FRETE_GRATIS || d.freeShipping) {  
            deliveryFee = 0;  
        } 

        const total = Math.max(0, subtotal + deliveryFee - d.discount);  
        return { subtotal, delivery: deliveryFee, discount: d.discount, total, cupomInfo: d };  
    }

    async function enhanceMiniCartUI() {  
        if (!el.miniFoot) return;  
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
        if (cart.length === 0) return;  

        const { subtotal, delivery, discount, total } = await calcTotals();
        
        const summaryDiv = document.createElement('div');  
        summaryDiv.className = 'cart-summary-generated';  
        summaryDiv.innerHTML = `  
          <div style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Subtotal</span><b>${money(subtotal)}</b></div>  
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span>Entrega</span><b>${delivery === 0 ? "Grátis 🎉" : money(delivery)}</b></div>  
              ${discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;color:green;"><span>Desconto</span><b>-${money(discount)}</b></div>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin:10px 0;font-size:1.2rem;"><span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span></div>  
              <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">Finalizar Pedido 🛍️</button>  
              <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Limpar Carrinho</button>
          </div>`;  

        el.miniFoot.appendChild(summaryDiv);
        
        summaryDiv.querySelector("#finish-order").addEventListener("click", fecharPedido);  
        summaryDiv.querySelector("#clear-cart").addEventListener("click", () => {  
            if (confirm("Limpar carrinho?")) { cart = []; renderMiniCart(); popupAdd("Carrinho limpo!"); }  
        });
        
        document.getElementById('retirar-local')?.addEventListener('change', renderMiniCart);
    }
    // ==========================================================================
    // 8. ÁREA DO USUÁRIO (RECOMPENSAS E MEUS PEDIDOS)
    // ==========================================================================
    
    // Botão de Recompensas
    el.recompensasBtn?.addEventListener("click", async () => { 
        inicializarFirebase();
        if (!currentUser) { 
            alert("Faça login para ver suas recompensas!"); 
            Overlays.open(el.loginModal); 
            return; 
        } 
        
        Overlays.open(el.recompensasPanel); 
        
        // Busca dados do usuário
        try {
            const u = await db.collection("Usuarios").doc(currentUser.uid).get();
            const feitos = u.data()?.pedidosFeitos || 0;
            
            // Dados das Metas
            const metas = [
                {limite:5, valor:'Coca Lata', tipo:'brinde'},
                {limite:10, valor:'Burguer Simples', tipo:'brinde'},
                {limite:15, valor:'Nível OURO', tipo:'cupom'},
                {limite:30, valor:'Nível PLATINA', tipo:'cupom'},
                {limite:50, valor:'Nível DIAMANTE', tipo:'cupom'},
                {limite:100, valor:'Nível LENDÁRIO', tipo:'cupom'}
            ];

            // Atualiza barra visual
            document.getElementById('contador-valor').textContent = feitos;
            const prox = metas.find(m => m.limite > feitos) || metas[metas.length-1];
            const pct = Math.min(100, (feitos / prox.limite) * 100);
            document.getElementById('progresso-bar').style.width = `${pct}%`;
            document.getElementById('progresso-mensagem').textContent = `Faltam ${Math.max(0, prox.limite - feitos)} para: ${prox.valor}`;

            // Renderiza Lista
            el.recompensasLista.innerHTML = metas.map(m => {
                const conquistado = feitos >= m.limite;
                const icon = getTierIcon(m.valor); // Usa a função gigante da Parte 4
                return `
                <div class="recompensa-item ${conquistado ? 'conquistado' : ''}">
                    <div class="tier-icon">${icon}</div>
                    <div style="flex:1">
                        <b>${m.valor}</b><br>
                        <small>Meta: ${m.limite} pedidos</small>
                    </div>
                    <div>${conquistado ? '✅' : '🔒'}</div>
                </div>`;
            }).join("");
        } catch(e) {
            console.error(e);
            el.recompensasLista.innerHTML = "Erro ao carregar dados.";
        }
    });

    // Botão Meus Pedidos
    el.pedidosBtn?.addEventListener("click", () => { 
        inicializarFirebase();
        if (!currentUser) { 
            alert("Faça login para ver seus pedidos."); 
            Overlays.open(el.loginModal); 
            return; 
        } 
        Overlays.open(el.pedidosPanel); 
        carregarPedidos(currentUser.uid); 
    });  
    
    async function carregarPedidos(userId) {  
        if (!el.pedidosLista) return; 
        el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando...</p>`;  
        try { 
            const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc").limit(20); 
            const snapshot = await q.get();  
            if (snapshot.empty) { el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado.</p>`; return; }  
            
            el.pedidosLista.innerHTML = snapshot.docs.map(doc => {
                const d = doc.data();
                const date = new Date(d.data).toLocaleDateString();
                return `
                <div class="pedido-card" style="padding:15px; border:1px solid #eee; border-radius:10px; margin-bottom:10px; background:#fff;">
                    <div style="display:flex;justify-content:space-between;font-weight:bold;">
                        <span>${date}</span><span>${money(d.total)}</span>
                    </div>
                    <div style="font-size:0.85rem;color:#666;margin-top:5px;">
                        ${d.itens.replace(/\n/g, ", ").substring(0, 50)}...
                    </div>
                </div>`;
            }).join('');
        } catch (err) { el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao carregar.</p>`; }  
    }

    // ==========================================================================
    // 9. FINALIZAÇÃO E ENDEREÇO
    // ==========================================================================

    // Login com Google
    el.googleBtn?.addEventListener("click", () => {
        inicializarFirebase(); // Garante conexão
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(res => {
            currentUser = res.user;
            Overlays.closeAll();
            popupAdd(`Bem-vindo, ${currentUser.displayName}!`);
        }).catch(e => alert("Erro no login: " + e.message));
    });

    // Endereço Manual e CEP
    let modoEnderecoManual = false;
    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank"));
    
    document.getElementById("btnManual")?.addEventListener("click", () => {
        modoEnderecoManual = true;
        document.querySelector('.frete-container').style.display = 'none';
        document.getElementById('manualArea').style.display = 'block';
    });

    document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        document.querySelector('.frete-container').style.display = 'block';
        document.getElementById('manualArea').style.display = 'none';
    });

    // Busca CEP (ViaCEP)
    document.getElementById('btn-calcular-frete')?.addEventListener('click', async () => {  
        const cepInput = document.getElementById('cep-input');  
        const cep = cepInput.value.trim().replace(/\D/g, '');  
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (data.erro) {
                    popupAdd("CEP não encontrado.");
                } else {
                    document.getElementById('endereco-auto').value = `${data.logradouro} - ${data.bairro}`;
                    renderMiniCart();
                }
            } catch(e) { popupAdd("Erro na busca do CEP."); }
        } else {
            popupAdd("CEP inválido.");
        }
    });

    // Fechar Pedido e Enviar para WhatsApp
    async function fecharPedido() {  
        if (!cart.length) return alert("Carrinho vazio!");  
        if (!currentUser) { 
            alert("Faça login para finalizar!"); 
            Overlays.open(el.loginModal); 
            return; 
        }  
        
        inicializarFirebase(); // Segurança extra
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        let finalAddressString = "";
        
        if (isRetirarLocal) {
            finalAddressString = "CLIENTE IRÁ RETIRAR NO LOCAL";  
        } else if (modoEnderecoManual) {
            const end = document.getElementById('manualEndereco').value;
            const num = document.getElementById('manualNumero').value;
            if (!end || !num) return alert("Preencha o endereço manual.");
            finalAddressString = `${end}, N° ${num} (MANUAL)`;
        } else {
            const end = document.getElementById('endereco-auto').value;
            const num = document.getElementById('numero-input').value;
            if (!end || !num) return alert("Preencha o número da casa.");
            finalAddressString = `${end}, N° ${num}`;
        }

        const { subtotal, delivery, discount, total } = await calcTotals();  
        
        const pedido = { 
            usuario: currentUser.email, 
            userId: currentUser.uid, 
            nome: currentUser.displayName || "Cliente", 
            itens: cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
            subtotal: subtotal, 
            entrega: delivery, 
            desconto: discount, 
            total: total, 
            endereco: finalAddressString, 
            data: new Date().toISOString() 
        };  

        try {  
            const batch = db.batch();
            const pedidoRef = db.collection("Pedidos").doc(); 
            batch.set(pedidoRef, pedido);  
            // Incrementa contador para recompensas
            batch.update(db.collection("Usuarios").doc(currentUser.uid), { pedidosFeitos: firebase.firestore.FieldValue.increment(1) });  
            await batch.commit();  

            popupAdd("Pedido Enviado! ✅"); 
            
            // Link WhatsApp
            const linhas = [
                "🍔 *Pedido Realizado (DFL)*", 
                cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
                "", 
                `*Total: ${money(total)}*`, 
                `🏠 *Endereço:* ${finalAddressString}`
            ].join("\n");  
            
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(linhas)}`, "_blank");  
            cart = []; 
            renderMiniCart(); 
            Overlays.closeAll();  
        } catch (err) { 
            console.error("Erro fechar pedido:", err); 
            alert(`Erro ao salvar pedido.`); 
        }  
    }

    /* --- POPUP HELPER --- */
    function popupAdd(msg) {  
        let pop = document.querySelector(".popup-add");  
        if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }  
        pop.textContent = msg; pop.classList.add("show"); setTimeout(() => pop.classList.remove("show"), 2000);  
    }

}); // FIM DO CÓDIGO
