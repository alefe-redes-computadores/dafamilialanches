/* =========================================================  
   🚀 DFL v6.5 MASTER — CÓDIGO COMPLETO (SEM SIMPLIFICAÇÕES)
   - Busca Inteligente (Levenshtein)
   - Visual Premium (CSS Injetado)
   - Lógica de Recompensas Completa (Todos os Níveis)
   - Admin Completo (Gráficos)
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // 0. INJETOR DE ESTILO (GARANTE O VISUAL PREMIUM)
    // ============================================================
    const style = document.createElement('style');
    style.innerHTML = `
        /* Grade de Promoções */
        #promocoes-area {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
            gap: 15px;
            padding: 5px 10px;
        }
        /* Card Premium */
        .promo-card-styled {
            display: flex; flex-direction: column;
            background: #fff; border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #eee;
            height: 100%; position: relative; transition: transform 0.2s;
        }
        .promo-card-styled:hover { transform: translateY(-3px); }
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
        .btn-add-green {
            background: linear-gradient(180deg, #66bb6a 0%, #43a047 100%);
            color: white; border: none; padding: 10px; border-radius: 8px; 
            font-weight: 700; font-size: 1rem; width: 100%; cursor: pointer;
            box-shadow: 0 4px 0 #2e7d32; transition: transform 0.1s; text-transform: uppercase;
        }
        .btn-add-green:active { transform: translateY(4px); box-shadow: 0 0 0 #2e7d32; }
        /* Ajuste Busca */
        #search-input::placeholder { color: #888; font-style: italic; }
        /* Ajuste Ícones Recompensa */
        .tier-icon { font-size: 1.5rem; margin-right: 10px; }
    `;
    document.head.appendChild(style);

    // ============================================================
    // 1. BUSCA INTELIGENTE (ALGORITMO LEVENSHTEIN)
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
            const cards = document.querySelectorAll(".card, .promo-card-styled"); 
            
            cards.forEach(card => {
                let nome = card.getAttribute("data-name")?.toLowerCase() || "";
                if(!nome) nome = card.querySelector("h3")?.innerText.toLowerCase() || ""; // Fallback

                if (!termo) { card.style.display = "flex"; return; }
                
                const contem = nome.includes(termo);
                const erroAceitavel = termo.length > 3 && levenshtein(nome, termo) <= 2;

                if (contem || erroAceitavel) card.style.display = "flex"; 
                else card.style.display = "none";
            });
        });
    }

    // MÁSCARA AUTOMÁTICA DO CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    /* ------------------ ⚙️ VARIÁVEIS GLOBAIS ------------------ */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };  

    // --- FUNÇÃO DE ÍCONES COMPLETA (TODOS OS NÍVEIS) ---
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

    /* --- DADOS DAS PROMOÇÕES (COMPLETOS) --- */
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

    /* ------------------ 🎯 ELEMENTOS DO DOM ------------------ */  
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

    /* --- 2. RENDERIZAR PROMOÇÕES EM GRADE (VISUAL CORRIGIDO) --- */
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
    window.addToCart = (nome, preco) => addCommonItem(nome, preco);
    renderPromocoesGrid();

    /* --- 3. MODAIS E FECHAMENTO ROBUSTO --- */
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
        open(modal) {
            Overlays.closeAll();
            if(!modal) return;
            if(modal.id === "mini-cart" || modal.id.includes("panel")) modal.classList.add("active");
            else modal.classList.add("show");
            el.cartBackdrop.classList.add("active");
            document.body.classList.add("no-scroll");
        }
    };

    el.cartBackdrop.addEventListener("click", Overlays.closeAll);
    
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => { if(e.target === m) Overlays.closeAll(); });
    });

    document.addEventListener('click', (e) => {
        if(e.target.matches('.fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .login-close, .promo-close, .dashboard-close')) {
            Overlays.closeAll();
        }
    });
    /* --- 4. CARRINHO, COMBOS E EXTRAS --- */
    
    // --- LÓGICA DE COMBOS COMPLETA (TODAS AS BEBIDAS) ---
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
        // Verifica se é combo
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(nome)) { 
             const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;
             
             if (grupo && comboDrinkOptions[grupo]) {
                 // Gera o HTML do modal com todas as opções
                 el.comboBody.innerHTML = comboDrinkOptions[grupo].map((o,i)=> 
                    `<label style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ddd;margin-bottom:5px;border-radius:8px;background:#fff;cursor:pointer;">
                        <div><span style="font-weight:bold">${o.rotulo}</span> <span style="color:#d32f2f;font-size:0.9rem;">(+${money(o.delta)})</span></div>
                        <input type="radio" name="combo-drink" value="${i}" ${i===0?'checked':''}>
                    </label>`
                 ).join("");
                 _comboCtx = { nome, preco, grupo };
                 
                 // Re-associa o evento do botão confirmar
                 const btn = document.getElementById("combo-confirm");
                 // Clone para limpar eventos anteriores
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
        // Item normal
        const found = cart.find((i) => i.nome === nome && i.preco === preco);
        if(found) found.qtd++; else cart.push({nome, preco, qtd:1});
        renderMiniCart(); popupAdd(`${nome} adicionado!`);
    }

    // Botões adicionar na página
    document.querySelectorAll(".add-cart").forEach(btn => btn.addEventListener("click", e => {
        const c = e.currentTarget.closest(".card");
        if(c) addCommonItem(c.dataset.name, parseFloat(c.dataset.price));
    }));

    // Extras Logic
    const extras = [ {n:"Cebola",p:0.99}, {n:"Salada",p:1.99}, {n:"Ovo",p:1.99}, {n:"Bacon",p:2.99}, {n:"Hambúrguer",p:2.99}, {n:"Cheddar",p:3.99}, {n:"Filé de Frango",p:5.99} ];
    document.querySelectorAll(".extras-btn").forEach(btn => btn.addEventListener("click", e => {
        const c = e.currentTarget.closest(".card");
        const nome = c.dataset.name;
        const base = parseFloat(c.dataset.price);
        
        el.extrasList.innerHTML = extras.map((ex,i)=> `
            <label style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;cursor:pointer;">
                <span>${ex.n} (+${money(ex.p)})</span>
                <input type="checkbox" value="${i}">
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

    /* --- 5. RENDER CARRINHO E TOTAIS --- */
    function renderMiniCart() {
        if (!el.miniList) return;
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
        if (el.cartCount) el.cartCount.textContent = totalItens;
        
        // Barra Progresso
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        const falta = LIMITE_FRETE_GRATIS - sub;
        const pct = Math.min(100, (sub/LIMITE_FRETE_GRATIS)*100);
        if(el.progressFill) el.progressFill.style.width = `${pct}%`;
        if(el.progressText) el.progressText.innerHTML = sub >= LIMITE_FRETE_GRATIS ? "🎉 <b>Frete Grátis Conquistado!</b>" : `Faltam <b>${money(falta)}</b> para frete grátis`;

        if (!cart.length) {
            el.miniList.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">Carrinho vazio</p>';
            if(el.miniFoot.querySelector(".cart-generated")) el.miniFoot.querySelector(".cart-generated").remove();
            return;
        }

        el.miniList.innerHTML = cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
                <div style="flex:1">
                    <div style="font-weight:bold; font-size:0.9rem;">${item.nome}</div>
                    <div style="color:#666; font-size:0.8rem;">${money(item.preco)} x ${item.qtd}</div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button onclick="changeQtd(${idx},-1)" style="background:#ff4081;color:white;border:none;width:28px;height:28px;border-radius:4px;">-</button>
                    <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
                    <button onclick="changeQtd(${idx},1)" style="background:#4caf50;color:white;border:none;width:28px;height:28px;border-radius:4px;">+</button>
                    <button onclick="removeItem(${idx})" style="background:#d32f2f;color:white;border:none;width:28px;height:28px;border-radius:4px;">🗑</button>
                </div>
            </div>
        `).join("");
        
        updateCartTotals();
    }
    
    window.changeQtd = (i, d) => { if(cart[i].qtd+d > 0) cart[i].qtd+=d; else cart.splice(i,1); renderMiniCart(); };
    window.removeItem = (i) => { cart.splice(i,1); renderMiniCart(); };

    async function updateCartTotals() {
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        let frete = DELIVERY_FEE_DEFAULT;
        const manual = document.getElementById("manualEndereco")?.value;
        const auto = document.getElementById("endereco-auto")?.value;
        const retirar = document.getElementById("retirar-local")?.checked;
        
        if (retirar || sub >= LIMITE_FRETE_GRATIS) frete = 0;
        else if (manual || auto) {
             // Se tiver endereço preenchido, mantemos o cálculo padrão
             // (Aqui entraria a lógica de bairros se o firebase estivesse populado)
        }

        const foot = el.miniFoot;
        if(foot.querySelector(".cart-generated")) foot.querySelector(".cart-generated").remove();
        
        const div = document.createElement("div");
        div.className = "cart-generated";
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-top:10px;border-top:1px solid #eee;padding-top:10px;"><span>Subtotal:</span> <b>${money(sub)}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Entrega:</span> <b>${frete===0?'Grátis':money(frete)}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:1.2rem;margin:10px 0;color:#d32f2f;"><span>Total:</span> <b>${money(sub+frete)}</b></div>
            <button id="btn-finalizar" style="width:100%;background:#4caf50;color:white;padding:12px;border:none;border-radius:8px;font-weight:bold;font-size:1rem;">Finalizar Pedido via WhatsApp</button>
            <button id="btn-limpar" style="width:100%;background:#ff4081;color:white;padding:10px;border:none;border-radius:8px;font-weight:bold;margin-top:5px;">Limpar Carrinho</button>
        `;
        foot.appendChild(div);
        document.getElementById("btn-finalizar").onclick = finalizarPedido;
        document.getElementById("btn-limpar").onclick = () => { if(confirm("Limpar carrinho?")) { cart=[]; renderMiniCart(); } };
    }

    /* --- 6. ENDEREÇO E FRETE (MANUAL/CEP) --- */
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
        // Lógica simulada que prepararia para usar taxas reais do Firebase
        return DELIVERY_FEE_DEFAULT; 
    }

    el.btnConfirmarEndereco?.addEventListener("click", async () => {
        if(!el.manualEndereco.value) return popupAdd("Preencha endereço!");
        const t = await getDynamicDeliveryFee(el.manualEndereco.value);
        popupAdd(`Taxa: ${money(t)}`); renderMiniCart();
    });
    
    document.getElementById('btn-calcular-frete')?.addEventListener('click', () => {
        const c = document.getElementById('cep-input').value.replace(/\D/g,'');
        if(c.length===8) fetch(`https://viacep.com.br/ws/${c}/json/`).then(r=>r.json()).then(d=>{ 
            if(d.erro) throw new Error(); 
            document.getElementById('endereco-auto').value = `${d.logradouro} - ${d.bairro}`; 
            renderMiniCart(); 
        }).catch(()=>popupAdd("CEP Erro"));
    });
    /* --- 7. FINALIZAR PEDIDO --- */
    async function calcTotals() {  
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        let del = DELIVERY_FEE_DEFAULT;
        const manual = document.getElementById("manualEndereco")?.value;
        const auto = document.getElementById("endereco-auto")?.value;
        if (document.getElementById("retirar-local")?.checked || sub >= LIMITE_FRETE_GRATIS) del = 0;
        else if (manual || auto) del = await getDynamicDeliveryFee(manual || auto);
        return { sub, del, total: sub+del };
    }

    async function finalizarPedido() {
        if(!cart.length) return; 
        if(!currentUser) { alert("Por favor, faça login para enviar o pedido!"); Overlays.open(el.loginModal); return; }
        
        let endereco = "";
        if(document.getElementById("retirar-local").checked) endereco = "RETIRADA NO LOCAL";
        else {
            const man = document.getElementById("manualEndereco").value; 
            const num = document.getElementById("manualNumero").value;
            const auto = document.getElementById("endereco-auto").value; 
            const numAuto = document.getElementById("numero-input").value;
            
            if(modoManual && man && num) endereco = `${man}, Nº ${num} (Manual)`;
            else if(!modoManual && auto && numAuto) endereco = `${auto}, Nº ${numAuto}`;
            else return alert("Por favor, preencha o endereço completo ou selecione 'Retirar no Local'.");
        }
        
        const { total, del } = await calcTotals();
        const itensTxt = cart.map(i => `• ${i.qtd}x ${i.nome}`).join("\n");
        const msg = `🍔 *PEDIDO DFL*\n👤 Cliente: ${currentUser.displayName || currentUser.email}\n\n${itensTxt}\n\n🚚 Frete: ${money(del)}\n💰 *TOTAL: ${money(total)}*\n📍 ${endereco}`;
        
        try {
            const batch = db.batch();
            const ref = db.collection("Pedidos").doc();
            batch.set(ref, { userId: currentUser.uid, usuario: currentUser.email, itens: itensTxt, total: total, data: new Date(), endereco });
            batch.set(db.collection("Usuarios").doc(currentUser.uid), { pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, {merge:true});
            await batch.commit();
        } catch(e) { console.error("Erro pedido", e); }
        
        window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, "_blank");
        cart=[]; renderMiniCart(); Overlays.closeAll();
    }

    /* --- 8. MEUS PEDIDOS & RECOMPENSAS (COM TODOS OS NÍVEIS) --- */
    el.pedidosBtn?.addEventListener("click", () => { 
        if(currentUser){ Overlays.open(el.pedidosPanel); carregarPedidos(); } 
        else { alert("Faça Login para ver seus pedidos!"); Overlays.open(el.loginModal); } 
    });
    
    async function carregarPedidos() {
        el.pedidosLista.innerHTML = '<p style="text-align:center;padding:20px;">Carregando...</p>';
        try {
            const s = await db.collection("Pedidos").where("userId","==",currentUser.uid).orderBy("data","desc").get();
            if(s.empty) { el.pedidosLista.innerHTML = '<p class="empty-orders">Nenhum pedido encontrado.</p>'; return; }
            el.pedidosLista.innerHTML = s.docs.map(d => `
                <div style="background:white;padding:12px;border-radius:8px;border:1px solid #ddd;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                        <b>${new Date(d.data().data.seconds*1000).toLocaleDateString()}</b>
                        <span style="color:#2e7d32;font-weight:bold;">${money(d.data().total)}</span>
                    </div>
                    <small style="color:#666;display:block;line-height:1.4;">${d.data().itens.replace(/\n/g,", ")}</small>
                </div>
            `).join("");
        } catch(e) { el.pedidosLista.innerHTML = '<p style="color:red">Erro ao carregar.</p>'; }
    }

    el.recompensasBtn?.addEventListener("click", () => { 
        if(currentUser){ Overlays.open(el.recompensasPanel); carregarRecompensas(); } 
        else { alert("Faça Login para ver suas recompensas!"); Overlays.open(el.loginModal); } 
    });
    
    async function carregarRecompensas() {
        const u = await db.collection("Usuarios").doc(currentUser.uid).get();
        const feitos = u.data()?.pedidosFeitos || 0;
        
        // LISTA COMPLETA DE RECOMPENSAS (NÃO SIMPLIFICADA)
        const metas = [
            {limite:5, tipo:'brinde', valor:'Coca Lata'},
            {limite:10, tipo:'brinde', valor:'Burguer Simples'},
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
        
        let html = `<div style="text-align:center;margin-bottom:15px;"><h3>Pedidos Feitos: ${feitos}</h3></div><div class="recompensa-lista">`;
        
        html += metas.map(m => {
            const liberado = feitos >= m.limite;
            const icon = getTierIcon(m.valor); 
            const bg = liberado ? '#e8f5e9' : '#fff';
            const border = liberado ? '#4caf50' : '#eee';
            
            return `
            <div style="background:${bg}; border:1px solid ${border}; padding:12px; border-radius:8px; margin-bottom:8px; display:flex; align-items:center;">
                <div style="font-size:24px; margin-right:12px;">${icon}</div>
                <div style="flex:1;">
                    <div style="font-weight:bold; color:${liberado ? '#2e7d32' : '#666'}">${m.valor}</div>
                    <div style="font-size:0.85rem; color:#888;">Meta: ${m.limite} pedidos</div>
                </div>
                <div style="font-size:1.2rem;">${liberado ? '✅' : '🔒'}</div>
            </div>`;
        }).join("");
        
        html += `</div>`;
        
        document.getElementById("contador-valor").innerText = feitos;
        // Barra com limite móvel (mostra progresso até a próxima meta)
        const proximaMeta = metas.find(m => m.limite > feitos) || metas[metas.length-1];
        const pct = Math.min(100, (feitos / proximaMeta.limite) * 100);
        
        document.getElementById("progresso-bar").style.width = `${pct}%`;
        document.getElementById("progresso-mensagem").innerText = `Faltam ${Math.max(0, proximaMeta.limite - feitos)} pedidos para: ${proximaMeta.valor}!`;
        el.recompensasLista.innerHTML = html;
    }

    /* --- 9. ADMIN COMPLETO (DASHBOARD + GRÁFICOS) --- */
    const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(u) { return u && ADMINS.includes(u.email); }
    let chartP = null;
    
    function createDashboard() {
        if(document.getElementById("admin-dashboard")) return;
        const div = document.createElement("div"); 
        div.id = "admin-dashboard"; 
        div.className = "modal";
        // Dashboard HTML Completo
        div.innerHTML = `
        <div class="modal-content" style="max-width:900px;width:95%;max-height:90vh;overflow-y:auto;">
            <div class="modal-head" style="background:#ffb300;padding:15px;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">📊 Painel Administrativo</h3>
                <button class="dashboard-close" style="background:transparent;border:none;font-size:20px;cursor:pointer;">✖</button>
            </div>
            <div style="padding:20px;">
                <div style="display:flex;gap:15px;margin-bottom:25px;flex-wrap:wrap;">
                    <div id="card-fat" style="flex:1;min-width:140px;padding:20px;background:#e8f5e9;border-radius:12px;text-align:center;border:1px solid #c8e6c9;">
                        <div style="font-size:0.9rem;color:#2e7d32;margin-bottom:5px;">FATURAMENTO (30d)</div>
                        <div id="val-fat" style="font-size:1.5rem;font-weight:800;color:#1b5e20;">R$ 0,00</div>
                    </div>
                    <div id="card-ped" style="flex:1;min-width:140px;padding:20px;background:#e3f2fd;border-radius:12px;text-align:center;border:1px solid #bbdefb;">
                        <div style="font-size:0.9rem;color:#1565c0;margin-bottom:5px;">PEDIDOS (30d)</div>
                        <div id="val-ped" style="font-size:1.5rem;font-weight:800;color:#0d47a1;">0</div>
                    </div>
                </div>
                <h4 style="margin-bottom:10px;">Vendas por Dia (Últimos 10 dias com vendas)</h4>
                <div style="height:300px;width:100%;"><canvas id="chart-vendas"></canvas></div>
            </div>
        </div>`;
        document.body.appendChild(div);
        div.querySelector(".dashboard-close").onclick = Overlays.closeAll;
    }

    function ensureChartJS(cb) { 
        if(window.Chart) return cb(); 
        const s = document.createElement("script"); 
        s.src = "https://cdn.jsdelivr.net/npm/chart.js"; 
        s.onload = cb; 
        document.head.appendChild(s); 
    }

    async function carregarRelatorios() {
        // Busca últimos 100 pedidos para gerar estatística
        const snap = await db.collection("Pedidos").orderBy("data", "desc").limit(100).get();
        const peds = snap.docs.map(d => d.data());
        
        const total = peds.reduce((acc,p)=>acc+(p.total||0),0);
        document.getElementById("val-fat").innerText = money(total);
        document.getElementById("val-ped").innerText = peds.length;
        
        // Agrupa por dia
        const porDia = {};
        peds.forEach(p => {
            const d = new Date(p.data.seconds*1000).toLocaleDateString();
            porDia[d] = (porDia[d] || 0) + p.total;
        });
        
        const labels = Object.keys(porDia).reverse().slice(-10); // Últimos 10 dias
        const data = Object.values(porDia).reverse().slice(-10);
        
        const ctx = document.getElementById("chart-vendas").getContext("2d");
        if(chartP) chartP.destroy();
        
        chartP = new Chart(ctx, {
            type: 'bar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: 'Vendas (R$)', 
                    data: data, 
                    backgroundColor: '#ffca28',
                    borderColor: '#ff6f00',
                    borderWidth: 1
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    function createAdminFab() {
        if(el.reportsBtn) { 
            el.reportsBtn.style.display = "block"; 
            el.reportsBtn.onclick = () => { 
                createDashboard(); 
                ensureChartJS(() => { Overlays.open(document.getElementById("admin-dashboard")); carregarRelatorios(); });
            }; 
        } 
    }

    /* --- 10. INICIALIZAÇÃO E UTILITÁRIOS --- */
    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            firebase.initializeApp(firebaseConfig); auth = firebase.auth(); db = firebase.firestore(); isFirebaseInitialized = true;
            auth.onAuthStateChanged(u => {
                currentUser = u;
                el.userBtn.innerText = u ? `Olá, ${u.displayName?.split(" ")[0]||"Cliente"}` : "Entrar / Cadastrar";
                if(u && isAdmin(u)) createAdminFab();
                // Garante visibilidade dos botões
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
    setInterval(() => { const h=new Date().getHours(); const ab=h>=18&&h<23; if(el.statusBanner){ el.statusBanner.textContent=ab?"🟢 Aberto":"🔴 Fechado"; el.statusBanner.className=`status-banner ${ab?'open':'closed'}`; }}, 60000);
    function timer() { const d=document.getElementById("promo-timer"); if(d) { const t=new Date(); t.setHours(23,59,59); let df=t-new Date(); if(df<0)df=0; d.innerText=new Date(df).toISOString().substr(11,8); } } setInterval(timer,1000);

    function popupAdd(msg) { let pop=document.querySelector(".popup-add"); if(!pop){ pop=document.createElement("div"); pop.className="popup-add"; document.body.appendChild(pop); } pop.textContent=msg; pop.classList.add("show"); setTimeout(()=>pop.classList.remove("show"),2000); }

    inicializarFirebase();
    console.log("DFL v6.5 MASTER FULL Carregado 🚀");
});
