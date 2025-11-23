/* =========================================================  
   🚀 DFL v7.0 MASTER — CÓDIGO COMPLETO (SEM CORTES)
   - Parte 1: Configurações, Estilos, Busca e Máscaras
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // 0. INJEÇÃO DE CSS AVANÇADO (PARA GARANTIR VISUAL)
    // ============================================================
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
            display: flex; flex-direction: column;
            background: #fff; border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #eee;
            height: 100%; position: relative; transition: transform 0.2s;
        }
        .promo-card-styled:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        
        .promo-card-styled img {
            width: 100%; height: 150px; object-fit: cover;
            border-bottom: 4px solid #ffca28;
        }
        .promo-body { 
            padding: 12px; display: flex; flex-direction: column; flex: 1; 
            text-align: center;
        }
        .promo-title { 
            color: #d84315; font-size: 1rem; font-weight: 800; 
            margin: 0 0 6px 0; line-height: 1.3;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .promo-desc { 
            font-size: 0.8rem; color: #555; margin-bottom: 10px; 
            line-height: 1.4; flex: 1;
            display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .promo-prices { margin-bottom: 10px; }
        .promo-old { text-decoration: line-through; color: #999; font-size: 0.85rem; display: block; }
        .promo-new { color: #2e7d32; font-weight: 800; font-size: 1.4rem; }
        
        /* --- Botão Verde Largo --- */
        .btn-add-green {
            background: linear-gradient(180deg, #66bb6a 0%, #43a047 100%);
            color: white; border: none; 
            padding: 12px; border-radius: 8px; font-weight: 700; 
            font-size: 1rem; width: 100%; cursor: pointer;
            box-shadow: 0 4px 0 #2e7d32; 
            transition: transform 0.1s, box-shadow 0.1s;
            text-transform: uppercase;
        }
        .btn-add-green:active { transform: translateY(4px); box-shadow: 0 0 0 #2e7d32; }
        
        /* --- Inputs e Admin --- */
        #search-input::placeholder { color: #888; font-style: italic; }
        .admin-stat-card { background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #eee; text-align: center; flex: 1; }
        .admin-stat-title { font-size: 0.9rem; color: #666; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; }
        .admin-stat-value { font-size: 1.8rem; font-weight: 800; color: #333; }
    `;
    document.head.appendChild(style);

    // ============================================================
    // 1. VARIÁVEIS E UTILITÁRIOS
    // ============================================================
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   
    
    // Configurações de Negócio
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   

    // Formatador de Moeda
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    
    // Função de Segurança para Eventos
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error("Erro capturado:", e); } };  

    // Ícones de Nível
    function getTierIcon(tier) {  
        const level = tier ? String(tier).toLowerCase().trim() : '';  
        if (level.includes('ouro')) return '🥇';  
        if (level.includes('platina')) return '💎';  
        if (level.includes('diamante')) return '👑';  
        if (level.includes('safira')) return '💠';       
        if (level.includes('rubi')) return '♦️';         
        if (level.includes('esmeralda')) return '❇️';   
        if (level.includes('elite')) return '⚔️';        
        if (level.includes('supremo')) return '🚀';      
        if (level.includes('lenda')) return '🦁';        
        if (level.includes('mítico') || level.includes('mitico')) return '🦄';  
        return '👤';   
    }

    // ============================================================
    // 2. BUSCA INTELIGENTE (ALGORITMO LEVENSHTEIN)
    // ============================================================
    const levenshtein = (a, b) => {
        if(!a || !b) return (a || b).length;
        const matrix = [];
        for(let i=0; i<=b.length; i++){ matrix[i] = [i]; }
        for(let j=0; j<=a.length; j++){ matrix[0][j] = j; }
        for(let i=1; i<=b.length; i++){
            for(let j=1; j<=a.length; j++){
                if(b.charAt(i-1) == a.charAt(j-1)){ matrix[i][j] = matrix[i-1][j-1]; }
                else { matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1)); }
            }
        }
        return matrix[b.length][a.length];
    };

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.placeholder = "🔍 O que você está procurando? (Ex: TremBão, Peleja)";
        searchInput.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            // Seleciona TODOS os cards (promoção e normais)
            const cards = document.querySelectorAll(".card, .promo-card-styled"); 
            
            cards.forEach(card => {
                // Tenta pegar o nome de várias fontes para garantir
                let nome = card.getAttribute("data-name")?.toLowerCase() || "";
                if(!nome) nome = card.querySelector("h3")?.innerText.toLowerCase() || "";
                if(!nome) nome = card.querySelector(".promo-title")?.innerText.toLowerCase() || "";

                if (!termo) { 
                    card.style.display = "flex"; 
                    return; 
                }
                
                const contem = nome.includes(termo);
                // Permite até 2 erros de digitação para palavras maiores
                const erroAceitavel = termo.length > 3 && levenshtein(nome, termo) <= 2;

                if (contem || erroAceitavel) {
                    card.style.display = "flex"; 
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    // ============================================================
    // 3. MÁSCARAS DE INPUT (CEP, CELULAR, ETC)
    // ============================================================
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }
    
    // Máscara genérica para números (pode ser usada futuramente)
    function mascaraNumero(val) {
        return val.replace(/\D/g, "");
    }

    /* ------------------ DADOS DAS PROMOÇÕES (COMPLETOS) ------------------ */
    const PROMO_DATA = [  
        null,   
        { id: 1, nome: "Dupla Purizin + Fanta", desc: "2 Hot Dogs 'Purizin' com purê cremoso, milho e batata + 1 Fanta Laranja Geladinha!", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" },  
        { id: 2, nome: "Trio Padaná - Desconto Fiel", desc: "3 Hot Dogs 'Padaná' completos (2 salsichas, bacon, vinagrete) para dividir com a galera!", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" },  
        { id: 3, nome: "Combo 2 Peleja Artesanal", desc: "2 Burgers Artesanais 'Peleja' (120g) com filé de frango e bacon. Sabor inigualável!", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" },  
        { id: 4, nome: "Trio Trem Completo + Refri", desc: "3 Burgers 'Trem' tradicionais com bacon, milho, queijo e batata palha + Fanta 1L!", preco: 44.99, precoAntigo: 52.00, img: "promocoes/promo4.jpg" },  
        { id: 5, nome: "Combo 4 Trem + Fanta 1L", desc: "O clássico da família: 4 sanduíches Trem deliciosos e refri para acompanhar.", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" },  
        { id: 6, nome: "Combo 5 Uai", desc: "5 Lanches Uai (X-Bacon Salada) para matar a fome de todo mundo.", preco: 54.99, precoAntigo: 65.00, img: "promocoes/promo6.jpg" },  
        { id: 7, nome: "Combo 4 TremBão + Fanta", desc: "4 Dogões 'TremBão' com tudo dentro (purê, bacon, 2 salsichas) + Refri.", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" },  
        { id: 8, nome: "Combo 4 Armaria", desc: "4 Sanduíches Armaria (Hambúrguer + Frango + Tudo) com bastante recheio.", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" },  
        { id: 9, nome: "Combo 5 Uai + Kuat 2L", desc: "A festa completa com 5 lanches Uai e um refrigerante tamanho família.", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" }  
    ];
/* =========================================================  
   🚀 DFL v7.0 MASTER — PARTE 2
   - Elementos DOM, Renderização da Grade
   - Sistema de Modais Robusto
   - Carrinho, Combos e Extras
========================================================= */  

    // --- SELETORES DOM (CACHE) ---
    const el = {  
        cartIcon: document.getElementById("cart-icon"),  
        cartCount: document.getElementById("cart-count"),  
        miniCart: document.getElementById("mini-cart"),  
        miniList: document.querySelector(".mini-list"),  
        miniFoot: document.querySelector(".mini-foot"),  
        cartBackdrop: document.getElementById("cart-backdrop"),  
        extrasModal: document.getElementById("extras-modal"),  
        extrasList: document.querySelector("#extras-modal .extras-list"),  
        extrasConfirm: document.getElementById("extras-confirm"),  
        comboModal: document.getElementById("combo-modal"),  
        comboBody: document.querySelector("#combo-modal #combo-body"),  
        comboConfirm: document.getElementById("combo-confirm"),  
        loginModal: document.getElementById("login-modal"),  
        loginForm: document.getElementById("login-form"),  
        googleBtn: document.getElementById("google-login"),  
        promocoesGrid: document.getElementById("promocoes-area"),  
        userBtn: document.getElementById("user-btn"),  
        statusBanner: document.getElementById("status-banner"),  
        hoursBanner: document.querySelector(".hours-banner"),  
        reportsBtn: document.getElementById("reports-btn"),   
        pedidosContainer: document.querySelector(".meus-pedidos"),  
        pedidosBtn: document.querySelector(".meus-pedidos-btn"),  
        pedidosPanel: document.getElementById("painelPedidos"),  
        pedidosFecharBtn: document.querySelector(".fechar-pedidos"),  
        pedidosLista: document.getElementById("listaPedidos"),  
        recompensasContainer: document.querySelector(".minhas-recompensas"),  
        recompensasBtn: document.querySelector(".recompensas-btn"),  
        recompensasPanel: document.getElementById("recompensas-panel"),  
        recompensasFecharBtn: document.querySelector(".fechar-recompensas"),  
        recompensasLista: document.getElementById("listaRecompensas"),  
        historicoLista: document.getElementById("historicoRecompensas"),
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill")
    };

    // ============================================================
    // 4. RENDERIZAR PROMOÇÕES EM GRADE (VISUAL PREMIUM)
    // ============================================================
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
    // Expõe a função para o HTML
    window.addToCart = (nome, preco) => addCommonItem(nome, preco);
    renderPromocoesGrid();

    // ============================================================
    // 5. SISTEMA DE MODAIS (FECHAMENTO GLOBAL)
    // ============================================================
    if (!el.cartBackdrop) {
        const bd = document.createElement("div"); bd.id = "cart-backdrop";
        document.body.appendChild(bd); el.cartBackdrop = bd;
    }

    const Overlays = {
        closeAll() {
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach(e => e.classList.remove("show", "active"));
            el.cartBackdrop.classList.remove("active");
            document.body.classList.remove("no-scroll");
        },
        open(modalLike) {
            Overlays.closeAll();
            if(!modalLike) return;
            const isPanel = (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel");
            modalLike.classList.add(isPanel ? "active" : "show");
            el.cartBackdrop.classList.add("active");
            document.body.classList.add("no-scroll");
        }
    };

    // Fechar ao clicar no fundo escuro
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

    // Fechar ao clicar em qualquer elemento com classe de fechar (Delegação de Eventos)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .login-close, .promo-close, .dashboard-close')) {
            Overlays.closeAll();
        }
        // Fecha se clicar fora do conteúdo do modal (na área escura interna)
        if (e.target.classList.contains('modal')) {
            Overlays.closeAll();
        }
    });

    // ============================================================
    // 6. LÓGICA DE CARRINHO E PRODUTOS
    // ============================================================
    
    // --- COMBOS: LISTA COMPLETA ---
    const comboDrinkOptions = {
        casal: [
            { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
            { rotulo: "Coca-Cola 1L", delta: 3.0 },
            { rotulo: "Coca-Cola 1L Zero", delta: 3.0 }
        ],
        familia: [
            { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 },
            { rotulo: "Coca-Cola 2L", delta: 5.0 },
            { rotulo: "Coca-Cola 2L Zero", delta: 5.0 }
        ]
    };
    let _comboCtx = null;

    function addCommonItem(nome, preco) {
        const low = (nome||"").toLowerCase();
        // Detector de Combo
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(nome)) { 
             const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;
             
             if (grupo && comboDrinkOptions[grupo]) {
                 el.comboBody.innerHTML = comboDrinkOptions[grupo].map((o,i)=> 
                    `<label style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ddd;margin-bottom:5px;border-radius:8px;background:#fff;cursor:pointer;">
                        <div><span style="font-weight:bold">${o.rotulo}</span> <span style="color:#d32f2f;font-size:0.9rem;">(+${money(o.delta)})</span></div>
                        <input type="radio" name="combo-drink" value="${i}" ${i===0?'checked':''}>
                    </label>`
                 ).join("");
                 _comboCtx = { nome, preco, grupo };
                 
                 // Cria novo botão para remover listeners antigos
                 const btn = document.getElementById("combo-confirm");
                 const newBtn = btn.cloneNode(true);
                 btn.parentNode.replaceChild(newBtn, btn);
                 
                 newBtn.onclick = () => {
                     const sel = el.comboBody.querySelector('input:checked');
                     if(sel) {
                         const opt = comboDrinkOptions[grupo][sel.value];
                         cart.push({nome:`${nome} + ${opt.rotulo}`, preco:preco+opt.delta, qtd:1});
                         renderMiniCart(); popupAdd("Combo adicionado!"); Overlays.closeAll();
                     }
                 };
                 Overlays.open(el.comboModal);
                 return;
             }
        }
        // Item Normal
        const found = cart.find((i) => i.nome === nome && i.preco === preco);
        if(found) found.qtd++; else cart.push({nome, preco, qtd:1});
        renderMiniCart(); popupAdd(`${nome} adicionado!`);
    }

    // Listeners para botões estáticos
    document.querySelectorAll(".add-cart").forEach(btn => btn.addEventListener("click", e => {
        const c = e.currentTarget.closest(".card");
        if(c) addCommonItem(c.dataset.name, parseFloat(c.dataset.price));
    }));

    // Extras
    const extras = [ 
        {n:"Cebola",p:0.99}, {n:"Salada",p:1.99}, {n:"Ovo",p:1.99}, 
        {n:"Bacon",p:2.99}, {n:"Hambúrguer",p:2.99}, {n:"Cheddar",p:3.99}, {n:"Filé de Frango",p:5.99} 
    ];
    document.querySelectorAll(".extras-btn").forEach(btn => btn.addEventListener("click", e => {
        const c = e.currentTarget.closest(".card");
        const nome = c.dataset.name;
        const base = parseFloat(c.dataset.price);
        
        el.extrasList.innerHTML = extras.map((ex,i)=> `
            <label style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid #eee;cursor:pointer;align-items:center;">
                <span style="font-weight:500;">${ex.n} <b style="color:#d32f2f;">(+${money(ex.p)})</b></span>
                <input type="checkbox" value="${i}" style="transform:scale(1.3);">
            </label>`).join("");
            
        const btnConf = document.getElementById("extras-confirm");
        const newBtn = btnConf.cloneNode(true);
        btnConf.parentNode.replaceChild(newBtn, btnConf);
        
        newBtn.onclick = () => {
            const sels = [...el.extrasList.querySelectorAll("input:checked")];
            const totalExtras = sels.reduce((acc, el) => acc + extras[el.value].p, 0);
            const nomesExtras = sels.map(el => extras[el.value].n).join(", ");
            const finalName = nomesExtras ? `${nome} + ${nomesExtras}` : nome;
            cart.push({nome:finalName, preco: base+totalExtras, qtd:1});
            renderMiniCart(); popupAdd("Com adicionais!"); Overlays.closeAll();
        };
        Overlays.open(el.extrasModal);
    }));
/* =========================================================  
   🚀 DFL v7.0 MASTER — PARTE 3
   - Renderização do Carrinho e Cálculos
   - Endereço (Manual/CEP) e Frete
   - Lógica de Pedidos e Recompensas
========================================================= */  

    /* --- 7. RENDERIZAÇÃO DO CARRINHO --- */
    function renderMiniCart() {
        if (!el.miniList) return;
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
        if (el.cartCount) el.cartCount.textContent = totalItens;
        
        // Barra de Progresso Frete Grátis
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        const falta = LIMITE_FRETE_GRATIS - sub;
        const pct = Math.min(100, (sub/LIMITE_FRETE_GRATIS)*100);
        if(el.progressFill) el.progressFill.style.width = `${pct}%`;
        if(el.progressText) {
            el.progressText.innerHTML = sub >= LIMITE_FRETE_GRATIS 
                ? "🎉 <b>Frete Grátis Conquistado!</b>" 
                : `Faltam <b>${money(falta)}</b> para frete grátis`;
        }

        if (!cart.length) {
            el.miniList.innerHTML = '<p style="text-align:center;padding:30px;color:#999;font-size:1.1rem;">Seu carrinho está vazio 🛒</p>';
            if(el.miniFoot.querySelector(".cart-generated")) el.miniFoot.querySelector(".cart-generated").remove();
            return;
        }

        el.miniList.innerHTML = cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #f0f0f0;">
                <div style="flex:1; padding-right:10px;">
                    <div style="font-weight:700; font-size:0.95rem; color:#333;">${item.nome}</div>
                    <div style="color:#666; font-size:0.85rem; margin-top:4px;">${money(item.preco)} x ${item.qtd}</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button onclick="window.changeQtd(${idx},-1)" style="background:#ff4081;color:white;border:none;width:30px;height:30px;border-radius:6px;font-weight:bold;cursor:pointer;">-</button>
                    <span style="font-weight:600; font-size:1rem; min-width:20px; text-align:center;">${item.qtd}</span>
                    <button onclick="window.changeQtd(${idx},1)" style="background:#4caf50;color:white;border:none;width:30px;height:30px;border-radius:6px;font-weight:bold;cursor:pointer;">+</button>
                    <button onclick="window.removeItem(${idx})" style="background:#d32f2f;color:white;border:none;width:30px;height:30px;border-radius:6px;cursor:pointer;">🗑</button>
                </div>
            </div>
        `).join("");
        
        updateCartTotals();
    }
    
    // Funções Globais para o Carrinho
    window.changeQtd = (i, d) => { if(cart[i].qtd+d > 0) cart[i].qtd+=d; else cart.splice(i,1); renderMiniCart(); };
    window.removeItem = (i) => { cart.splice(i,1); renderMiniCart(); };

    async function updateCartTotals() {
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        let frete = DELIVERY_FEE_DEFAULT;
        
        // Verificação de Endereço para calcular frete
        const manual = document.getElementById("manualEndereco")?.value;
        const auto = document.getElementById("endereco-auto")?.value;
        const retirar = document.getElementById("retirar-local")?.checked;
        
        if (retirar || sub >= LIMITE_FRETE_GRATIS) frete = 0;
        else if (manual || auto) {
             // Aqui entraria a lógica de bairros se tivéssemos a lista completa.
             // Mantém padrão se não for grátis
        }

        const foot = el.miniFoot;
        if(foot.querySelector(".cart-generated")) foot.querySelector(".cart-generated").remove();
        
        const div = document.createElement("div");
        div.className = "cart-generated";
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-top:15px;border-top:2px dashed #eee;padding-top:15px;font-size:0.95rem;">
                <span>Subtotal:</span> <b>${money(sub)}</b>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:5px;font-size:0.95rem;">
                <span>Entrega:</span> <b>${frete===0?'Grátis':money(frete)}</b>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:1.3rem;margin:15px 0;color:#d32f2f;font-weight:800;">
                <span>Total:</span> <b>${money(sub+frete)}</b>
            </div>
            <button id="btn-finalizar" style="width:100%;background:#4caf50;color:white;padding:14px;border:none;border-radius:10px;font-weight:bold;font-size:1.1rem;cursor:pointer;box-shadow:0 4px 10px rgba(76,175,80,0.3);">Finalizar Pedido via WhatsApp 🛍️</button>
            <button id="btn-limpar" style="width:100%;background:transparent;color:#777;padding:10px;border:1px solid #ddd;border-radius:10px;font-weight:600;margin-top:10px;cursor:pointer;">Limpar Carrinho</button>
        `;
        foot.appendChild(div);
        
        document.getElementById("btn-finalizar").onclick = finalizarPedido;
        document.getElementById("btn-limpar").onclick = () => { 
            if(confirm("Tem certeza que deseja limpar o carrinho?")) { cart=[]; renderMiniCart(); } 
        };
    }

    /* --- 8. ENDEREÇO (MANUAL/CEP) --- */
    let modoManual = false;
    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/app/endereco/index.php"));
    
    document.getElementById("btnManual")?.addEventListener("click", () => { 
        modoManual=true; 
        document.querySelector('.frete-container').style.display='none'; 
        el.manualArea.style.display='block'; 
    });
    
    el.btnVoltarCEP?.addEventListener("click", () => { 
        modoManual=false; 
        document.querySelector('.frete-container').style.display='block'; 
        el.manualArea.style.display='none'; 
    });

    async function getDynamicDeliveryFee(end) {
        if (!end) return DELIVERY_FEE_DEFAULT;
        let bairro = ""; 
        try { bairro = end.split("-")[1]?.split("(")[0]?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ""; } catch(_){}
        return DELIVERY_FEE_DEFAULT; 
    }

    el.btnConfirmarEndereco?.addEventListener("click", async () => {
        if(!el.manualEndereco.value) return popupAdd("Preencha o endereço!");
        const t = await getDynamicDeliveryFee(el.manualEndereco.value);
        popupAdd(`Taxa de entrega: ${money(t)}`); 
        renderMiniCart();
    });
    
    document.getElementById('btn-calcular-frete')?.addEventListener('click', () => {
        const c = document.getElementById('cep-input').value.replace(/\D/g,'');
        if(c.length===8) {
            fetch(`https://viacep.com.br/ws/${c}/json/`)
            .then(r=>r.json())
            .then(d=>{ 
                if(d.erro) throw new Error(); 
                document.getElementById('endereco-auto').value = `${d.logradouro} - ${d.bairro}`; 
                renderMiniCart(); 
            })
            .catch(()=>popupAdd("CEP não encontrado."));
        } else {
            popupAdd("CEP inválido (8 dígitos).");
        }
    });

    /* --- 9. FINALIZAR PEDIDO --- */
    async function finalizarPedido() {
        if(!cart.length) return; 
        if(!currentUser) { alert("Por favor, faça login ou cadastre-se para enviar o pedido!"); Overlays.open(el.loginModal); return; }
        
        let endereco = "";
        if(document.getElementById("retirar-local").checked) {
            endereco = "RETIRADA NO LOCAL";
        } else {
            const man = document.getElementById("manualEndereco").value; 
            const num = document.getElementById("manualNumero").value;
            const auto = document.getElementById("endereco-auto").value; 
            const numAuto = document.getElementById("numero-input").value;
            const comp = document.getElementById("complemento-input")?.value || "";
            
            if(modoManual && man && num) endereco = `${man}, Nº ${num} (Manual)`;
            else if(!modoManual && auto && numAuto) endereco = `${auto}, Nº ${numAuto} ${comp ? '- '+comp : ''}`;
            else return alert("Por favor, preencha o endereço completo ou selecione 'Retirar no Local'.");
        }
        
        // Recalcula totais para segurança
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        let del = DELIVERY_FEE_DEFAULT;
        if (document.getElementById("retirar-local").checked || sub >= LIMITE_FRETE_GRATIS) del = 0;
        const total = sub + del;
        
        const itensTxt = cart.map(i => `• ${i.qtd}x ${i.nome}`).join("\n");
        const msg = `🍔 *PEDIDO DFL*\n👤 Cliente: ${currentUser.displayName || currentUser.email}\n\n${itensTxt}\n\n🚚 Frete: ${money(del)}\n💰 *TOTAL: ${money(total)}*\n📍 ${endereco}`;
        
        try {
            await db.collection("Pedidos").add({ 
                userId: currentUser.uid, 
                usuario: currentUser.email, 
                itens: itensTxt, 
                total: total, 
                data: new Date(), 
                endereco: endereco,
                status: 'Novo'
            });
            // Incrementa fidelidade
            db.collection("Usuarios").doc(currentUser.uid).set({ pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, {merge:true});
        } catch(e) { console.error("Erro ao salvar pedido no Firebase", e); }
        
        const link = `https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`;
        window.open(link, "_blank");
        
        cart=[]; 
        renderMiniCart(); 
        Overlays.closeAll();
        popupAdd("Pedido Enviado! ✅");
    }
/* =========================================================  
   🚀 DFL v7.0 MASTER — PARTE 4
   - Histórico de Pedidos e Recompensas (Lista Completa)
   - PAINEL ADMIN "MONSTRO" (Com Filtros e Gráficos)
   - Status da Loja, Timer e Inicialização
========================================================= */  

    /* --- 10. MEUS PEDIDOS E RECOMPENSAS --- */
    // Botões sempre ativos (pedem login se necessário)
    el.pedidosBtn?.addEventListener("click", () => { 
        if(currentUser){ Overlays.open(el.pedidosPanel); carregarPedidos(); } 
        else { alert("Faça Login para ver seus pedidos!"); Overlays.open(el.loginModal); } 
    });
    
    async function carregarPedidos() {
        el.pedidosLista.innerHTML = '<p style="text-align:center;padding:20px;">Carregando histórico...</p>';
        try {
            const s = await db.collection("Pedidos").where("userId","==",currentUser.uid).orderBy("data","desc").limit(20).get();
            if(s.empty) { el.pedidosLista.innerHTML = '<p class="empty-orders">Nenhum pedido encontrado.</p>'; return; }
            
            el.pedidosLista.innerHTML = s.docs.map(d => {
                const data = d.data();
                const date = new Date(data.data.seconds*1000).toLocaleDateString();
                const hora = new Date(data.data.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                return `
                <div style="background:white;padding:15px;border-radius:10px;border:1px solid #eee;margin-bottom:10px;box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;border-bottom:1px solid #f5f5f5;padding-bottom:5px;">
                        <span style="font-weight:600;color:#555;">📅 ${date} às ${hora}</span>
                        <span style="color:#2e7d32;font-weight:800;">${money(data.total)}</span>
                    </div>
                    <small style="color:#666;display:block;line-height:1.5;font-size:0.9rem;">${data.itens.replace(/\n/g,", ")}</small>
                    <div style="margin-top:8px;font-size:0.8rem;color:#888;">📍 ${data.endereco.substring(0, 30)}...</div>
                </div>`;
            }).join("");
        } catch(e) { el.pedidosLista.innerHTML = '<p style="color:red;text-align:center;">Erro ao carregar.</p>'; }
    }

    el.recompensasBtn?.addEventListener("click", () => { 
        if(currentUser){ Overlays.open(el.recompensasPanel); carregarRecompensas(); } 
        else { alert("Faça Login para ver suas recompensas!"); Overlays.open(el.loginModal); } 
    });
    
    async function carregarRecompensas() {
        const u = await db.collection("Usuarios").doc(currentUser.uid).get();
        const feitos = u.data()?.pedidosFeitos || 0;
        
        // LISTA COMPLETA DE RECOMPENSAS (TODOS OS NÍVEIS RESTAURADOS)
        const metas = [
            {limite:5, tipo:'brinde', valor:'Coca Lata 350ml'},
            {limite:10, tipo:'brinde', valor:'Burguer Simples (Bão)'},
            {limite:15, tipo:'cupom', valor:'Nível OURO 🥇'},
            {limite:30, tipo:'cupom', valor:'Nível PLATINA 💎'},
            {limite:50, tipo:'cupom', valor:'Nível DIAMANTE 👑'},
            {limite:70, tipo:'cupom', valor:'Nível SAFIRA 💠'},
            {limite:100, tipo:'cupom', valor:'Nível RUBI ♦️'},
            {limite:150, tipo:'cupom', valor:'Nível ESMERALDA ❇️'},
            {limite:200, tipo:'cupom', valor:'Nível ELITE ⚔️'},
            {limite:300, tipo:'cupom', valor:'Nível SUPREMO 🚀'},
            {limite:500, tipo:'cupom', valor:'Nível LENDA 🦁'},
            {limite:1000, tipo:'cupom', valor:'Nível MÍTICO 🦄'}
        ];
        
        let html = `<div style="text-align:center;margin-bottom:20px;background:#fff3e0;padding:15px;border-radius:10px;">
            <h3 style="margin:0;color:#d84315;">Pedidos Feitos: ${feitos}</h3>
            <small>Continue pedindo para subir de nível!</small>
        </div><div class="recompensa-lista">`;
        
        html += metas.map(m => {
            const liberado = feitos >= m.limite;
            const icon = getTierIcon(m.valor); 
            const bg = liberado ? '#e8f5e9' : '#fff';
            const border = liberado ? '#4caf50' : '#eee';
            const opacity = liberado ? '1' : '0.7';
            
            return `
            <div style="background:${bg}; border:1px solid ${border}; padding:15px; border-radius:12px; margin-bottom:10px; display:flex; align-items:center; opacity:${opacity}; transition:all 0.3s;">
                <div style="font-size:28px; margin-right:15px;">${icon}</div>
                <div style="flex:1;">
                    <div style="font-weight:800; color:${liberado ? '#2e7d32' : '#444'}; font-size:1rem;">${m.valor}</div>
                    <div style="font-size:0.85rem; color:#666;">Meta: <b>${m.limite}</b> pedidos</div>
                </div>
                <div style="font-size:1.4rem;">${liberado ? '✅' : '🔒'}</div>
            </div>`;
        }).join("");
        
        html += `</div>`;
        
        document.getElementById("contador-valor").innerText = feitos;
        // Barra de progresso baseada no próximo nível
        const proximaMeta = metas.find(m => m.limite > feitos) || metas[metas.length-1];
        const pct = Math.min(100, (feitos / proximaMeta.limite) * 100);
        
        document.getElementById("progresso-bar").style.width = `${pct}%`;
        document.getElementById("progresso-mensagem").innerText = `Faltam ${Math.max(0, proximaMeta.limite - feitos)} pedidos para: ${proximaMeta.valor}!`;
        el.recompensasLista.innerHTML = html;
    }

    /* --- 11. PAINEL ADMIN COMPLETO (COM CHART.JS) --- */
    const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(u) { return u && ADMINS.includes(u.email); }
    let chartP = null;
    
    function createDashboard() {
        if(document.getElementById("admin-dashboard")) return;
        const div = document.createElement("div"); 
        div.id = "admin-dashboard"; 
        div.className = "modal";
        
        // HTML do Dashboard
        div.innerHTML = `
        <div class="modal-content" style="max-width:900px;width:95%;max-height:90vh;overflow-y:auto;background:#f8f9fa;">
            <div class="modal-head" style="background:#ffb300;padding:15px 20px;display:flex;justify-content:space-between;align-items:center;color:#222;">
                <h3 style="margin:0;">📊 Painel Administrativo</h3>
                <button class="dashboard-close" style="background:transparent;border:none;font-size:24px;cursor:pointer;color:#222;">&times;</button>
            </div>
            <div style="padding:20px;">
                <div style="margin-bottom:20px;display:flex;gap:10px;align-items:center;">
                    <label style="font-weight:bold;">Período:</label>
                    <select id="admin-filter" style="padding:8px;border-radius:6px;border:1px solid #ccc;">
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="100">Últimos 100 pedidos</option>
                    </select>
                    <button id="admin-refresh" style="padding:8px 15px;background:#2196f3;color:white;border:none;border-radius:6px;cursor:pointer;">Atualizar</button>
                </div>

                <div style="display:flex;gap:15px;margin-bottom:30px;flex-wrap:wrap;">
                    <div class="admin-stat-card">
                        <div class="admin-stat-title">Faturamento Total</div>
                        <div id="val-fat" class="admin-stat-value">R$ 0,00</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-title">Pedidos Realizados</div>
                        <div id="val-ped" class="admin-stat-value">0</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-title">Ticket Médio</div>
                        <div id="val-med" class="admin-stat-value">R$ 0,00</div>
                    </div>
                </div>

                <div style="background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                    <h4 style="margin:0 0 15px 0;color:#444;">Desempenho de Vendas</h4>
                    <div style="height:300px;width:100%;"><canvas id="chart-vendas"></canvas></div>
                </div>
                
                <div style="margin-top:20px;text-align:right;">
                    <button onclick="alert('Função de exportar CSV em breve!')" style="background:#4caf50;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">Exportar Relatório</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(div);
        
        div.querySelector(".dashboard-close").onclick = Overlays.closeAll;
        document.getElementById("admin-refresh").onclick = () => carregarRelatorios(document.getElementById("admin-filter").value);
        document.getElementById("admin-filter").onchange = (e) => carregarRelatorios(e.target.value);
    }

    function ensureChartJS(cb) { 
        if(window.Chart) return cb(); 
        const s = document.createElement("script"); 
        s.src = "https://cdn.jsdelivr.net/npm/chart.js"; 
        s.onload = cb; 
        document.head.appendChild(s); 
    }

    async function carregarRelatorios(limit = 50) {
        const btn = document.getElementById("admin-refresh");
        if(btn) btn.textContent = "Carregando...";
        
        try {
            const snap = await db.collection("Pedidos").orderBy("data", "desc").limit(Number(limit)).get();
            const peds = snap.docs.map(d => d.data());
            
            const total = peds.reduce((acc,p)=>acc+(p.total||0),0);
            const qtd = peds.length;
            const medio = qtd > 0 ? total / qtd : 0;

            document.getElementById("val-fat").innerText = money(total);
            document.getElementById("val-ped").innerText = qtd;
            document.getElementById("val-med").innerText = money(medio);
            
            // Agrupamento por Data para o Gráfico
            const porDia = {};
            peds.forEach(p => {
                const d = new Date(p.data.seconds*1000).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
                porDia[d] = (porDia[d] || 0) + p.total;
            });
            
            // Ordenar datas
            const labels = Object.keys(porDia).reverse();
            const data = Object.values(porDia).reverse();
            
            const ctx = document.getElementById("chart-vendas").getContext("2d");
            if(chartP) chartP.destroy();
            
            chartP = new Chart(ctx, {
                type: 'line',
                data: { 
                    labels: labels, 
                    datasets: [{ 
                        label: 'Faturamento (R$)', 
                        data: data, 
                        backgroundColor: 'rgba(255, 202, 40, 0.2)',
                        borderColor: '#ffca28',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch(e) { console.error("Erro admin:", e); }
        if(btn) btn.textContent = "Atualizar";
    }

    function createAdminFab() {
        if(el.reportsBtn) { 
            el.reportsBtn.style.display = "block"; 
            el.reportsBtn.onclick = () => { 
                createDashboard(); 
                ensureChartJS(() => { Overlays.open(document.getElementById("admin-dashboard")); carregarRelatorios(30); });
            }; 
        } 
    }

    /* --- 12. INICIALIZAÇÃO E UTILITÁRIOS --- */
    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            firebase.initializeApp(firebaseConfig); auth = firebase.auth(); db = firebase.firestore(); isFirebaseInitialized = true;
            auth.onAuthStateChanged(u => {
                currentUser = u;
                el.userBtn.innerText = u ? `Olá, ${u.displayName?.split(" ")[0]||"Cliente"}` : "Entrar / Cadastrar";
                
                // Ativa Admin se for o caso
                if(u && isAdmin(u)) createAdminFab();
                
                // Garante visibilidade dos botões flutuantes
                if(el.pedidosContainer) el.pedidosContainer.style.display = 'block';
                if(el.recompensasContainer) el.recompensasContainer.style.display = 'block';
            });
        } catch (e) { console.error("Firebase Error", e); }
    }

    // Login e Timer
    el.loginForm.addEventListener("submit", e => { e.preventDefault(); inicializarFirebase(); auth.signInWithEmailAndPassword(document.getElementById("login-email").value, document.getElementById("login-senha").value).then(u=>{currentUser=u.user; popupAdd("Logado!"); Overlays.closeAll();}).catch(e=>alert(e.message)); });
    el.googleBtn.addEventListener("click", () => { inicializarFirebase(); auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(u=>{currentUser=u.user; popupAdd("Logado!"); Overlays.closeAll();}).catch(e=>alert(e.message)); });
    el.userBtn.addEventListener("click", () => Overlays.open(el.loginModal));
    el.cartIcon.addEventListener("click", () => { renderMiniCart(); Overlays.open(el.miniCart); });

    // Timer e Status Loja
    setInterval(() => { const h=new Date().getHours(); const ab=h>=18&&h<23; if(el.statusBanner){ el.statusBanner.textContent=ab?"🟢 Aberto — Faça seu pedido!":"🔴 Fechado — Voltamos às 18h"; el.statusBanner.className=`status-banner ${ab?'open':'closed'}`; }}, 60000);
    function timer() { const d=document.getElementById("promo-timer"); if(d) { const t=new Date(); t.setHours(23,59,59); let df=t-new Date(); if(df<0)df=0; d.innerText=new Date(df).toISOString().substr(11,8); } } setInterval(timer,1000);

    function popupAdd(msg) { let pop=document.querySelector(".popup-add"); if(!pop){ pop=document.createElement("div"); pop.className="popup-add"; document.body.appendChild(pop); } pop.textContent=msg; pop.classList.add("show"); setTimeout(()=>pop.classList.remove("show"),2000); }

    // Inicializa tudo
    inicializarFirebase();
    console.log("DFL v7.0 MASTER FULL Carregado 🚀");
}); // FIM DO DOMContentLoaded
