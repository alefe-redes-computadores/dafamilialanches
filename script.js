/* =========================================================  
   🚀 DFL v5.9 FINAL — CÓDIGO MESTRE COMPLETO
   - Busca Inteligente + Promoções em Grade (Visual Corrigido)
   - Modais de Login/Carrinho fecham corretamente
   - Lista de Combos com todas as bebidas
   - Botões de Pedidos/Recompensas sempre visíveis
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {
    
    /* --- 🔍 1. BUSCA INTELIGENTE (FUZZY SEARCH) --- */
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
        searchInput.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".card"); 
            
            cards.forEach(card => {
                const nome = card.getAttribute("data-name")?.toLowerCase() || "";
                if (!termo) { card.style.display = "flex"; return; }
                
                const contem = nome.includes(termo);
                // Aceita erros leves se a palavra tiver mais de 3 letras
                const erroAceitavel = termo.length > 3 && levenshtein(nome, termo) <= 2;

                if (contem || erroAceitavel) card.style.display = "flex"; 
                else card.style.display = "none";
            });
        });
    }

    /* --- MÁSCARA CEP --- */
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    /* ------------------ ⚙️ BASE & UTILITÁRIOS ------------------ */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   

    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };  

    function getTierIcon(tier) {  
        const level = tier ? String(tier).toLowerCase().trim() : '';  
        if (level.includes('ouro')) return '🥇';  
        if (level.includes('platina')) return '💎';  
        if (level.includes('diamante')) return '👑';  
        return '👤';   
    }  

    /* --- DADOS DAS PROMOÇÕES --- */
    const PROMO_DATA = [  
        null,   
        { id: 1, nome: "Combo 2 Purizin + Fanta 1L", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" },  
        { id: 2, nome: "Combo 3 Padaná", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" },  
        { id: 3, nome: "Combo 2 Peleja", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" },  
        { id: 4, nome: "Combo 3 Trem + Fanta 1L", preco: 44.99, precoAntigo: 52.00, img: "promocoes/promo4.jpg" },  
        { id: 5, nome: "Combo 4 Trem + Fanta 1L", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" },  
        { id: 6, nome: "Combo 5 Uai", preco: 54.99, precoAntigo: 65.00, img: "promocoes/promo6.jpg" },  
        { id: 7, nome: "Combo 4 TremBão + Fanta 1L", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" },  
        { id: 8, nome: "Combo 4 Armaria", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" },  
        { id: 9, nome: "Combo 5 Uai + Kuat 2L", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" }  
    ];  

    /* ------------------ 🎯 ELEMENTOS DOM ------------------ */  
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
        // Gera HTML com tag <img> para garantir que o CSS estilize igual aos lanches
        el.promocoesGrid.innerHTML = PROMO_DATA.map(p => {
            if(!p) return '';
            return `
            <div class="card" data-name="${p.nome}" data-price="${p.preco}">
                <img src="${p.img}" alt="${p.nome}" loading="lazy">
                <h3>${p.nome}</h3>
                <p class="price">
                    <span class="old-price" style="text-decoration:line-through; color:#999; margin-right:5px;">De ${money(p.precoAntigo)}</span>
                    <span class="new-price" style="color:green; font-weight:bold;">Por ${money(p.preco)}</span>
                </p>
                <div class="actions">
                    <button class="add-cart" onclick="window.addToCart('${p.nome}', ${p.preco})">Adicionar</button>
                </div>
            </div>`;
        }).join('');
    }
    // Função global para o botão 'Adicionar' funcionar no HTML gerado dinamicamente
    window.addToCart = (nome, preco) => addCommonItem(nome, preco);
    renderPromocoesGrid();

    /* ------------------ 🌫️ BACKDROP & FECHAMENTO GLOBAL DE MODAIS ------------------ */  
    if (!el.cartBackdrop) {  
        const bd = document.createElement("div");  
        bd.id = "cart-backdrop";  
        document.body.appendChild(bd);  
        el.cartBackdrop = bd;  
    }  
    const Backdrop = {  
        show() { el.cartBackdrop.classList.add("active"); document.body.classList.add("no-scroll"); },  
        hide() { el.cartBackdrop.classList.remove("active"); document.body.classList.remove("no-scroll"); },  
    };

    const Overlays = {  
        closeAll() {  
            // Fecha modais padrão (login, extras) e painéis laterais (carrinho, pedidos)
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach((e) => e.classList.remove("show", "active"));  
            Backdrop.hide();  
        },  
        open(modalLike) {  
            Overlays.closeAll();  
            if (!modalLike) return;  
            const isPanel = (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel");
            modalLike.classList.add(isPanel ? "active" : "show");  
            Backdrop.show();  
        },  
    };  
    
    // 1. Fechar ao clicar no fundo escuro
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

    // 2. Fechar ao clicar nos botões 'X' (Usando delegação de eventos para pegar todos)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .login-close, .promo-close, .dashboard-close')) {
            Overlays.closeAll();
        }
        // 3. Fechar ao clicar fora do conteúdo do modal (na área cinza)
        if (e.target.classList.contains('modal')) {
            Overlays.closeAll();
        }
    });

    /* ------------------ 🎟️ CUPOM ------------------ */  
    const couponForm = document.getElementById("coupon-form");  
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();  
    couponForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        const input = document.getElementById("coupon-input");  
        const val = (input?.value || "").trim().toUpperCase();  
        if (!val) {  
            couponApplied = ""; localStorage.removeItem("dflCoupon");  
            popupAdd("Cupom removido."); renderMiniCart(); return;  
        }  
        couponApplied = val; localStorage.setItem("dflCoupon", couponApplied);  
        renderMiniCart();   
    });

    function popupAdd(msg) {  
        let pop = document.querySelector(".popup-add");  
        if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }  
        pop.textContent = msg; pop.classList.add("show");  
        setTimeout(() => pop.classList.remove("show"), 2000);  
    }

    function mostrarPopupRecompensa(msg) {  
        let pop = document.getElementById("conquista-popup");  
        if (!pop) { pop = document.createElement("div"); pop.id = "conquista-popup"; pop.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%) scale(0);background:#4CAF50;color:white;padding:15px 25px;border-radius:12px;font-weight:bold;z-index:10001;opacity:0;transition:0.4s;`; document.body.appendChild(pop); }  
        pop.textContent = msg; pop.style.opacity = '1'; pop.style.transform = 'translateX(-50%) scale(1)';  
        setTimeout(() => { pop.style.transform = 'translateX(-50%) scale(0)'; pop.style.opacity = '0'; }, 6000);  
    }

    /* ------------------ 📊 BARRA DE PROGRESSO ------------------ */
    function atualizarBarraProgresso() {
        const subtotal = getCartSubtotal();
        const progressText = document.getElementById("progressText");
        const progressFill = document.getElementById("progressFill");
        const progressWrapper = document.getElementById("progressWrapper");
        if (!progressText || !progressFill || !progressWrapper) return;

        const falta = LIMITE_FRETE_GRATIS - subtotal;
        const porcentagem = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
        progressFill.style.width = `${porcentagem}%`;

        if (subtotal >= LIMITE_FRETE_GRATIS) {
            progressText.innerHTML = `🎉 <strong>Oba!</strong> Você ganhou <strong>Frete Grátis</strong>!`;
            progressFill.style.background = "#4caf50";
        } else {
            progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> para Frete Grátis 🚀`;
            progressFill.style.background = "#ffb300";
        }
    }

    /* ------------------ 🛒 MINI-CARRINHO ------------------ */  
    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  
        atualizarBarraProgresso();

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
            <button class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;">−</button>  
            <span style="font-weight:600;">${item.qtd}</span>  
            <button class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;">+</button>  
            <button class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;">🗑</button>  
          </div>  
        </div>  
      </div>`).join("");  
    }  

    function bindMiniCartButtons() {  
        el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => { cart[+e.currentTarget.dataset.idx].qtd++; renderMiniCart(); }));  
        el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => { const i = +e.currentTarget.dataset.idx; if (cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1); renderMiniCart(); }));  
        el.miniList.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => { cart.splice(+e.currentTarget.dataset.idx, 1); renderMiniCart(); popupAdd("Item removido!"); }));  
    }  

    const _renderMiniCartOrig = renderMiniCart;  
    renderMiniCart = function () { _renderMiniCartOrig(); bindMiniCartButtons(); enhanceMiniCartUI(); };

    /* ------------------ 🔥 FIREBASE ------------------ */  
    const firebaseConfig = { apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak", authDomain: "da-familia-lanches.firebaseapp.com", projectId: "da-familia-lanches", storageBucket: "da-familia-lanches.appspot.com", messagingSenderId: "106857147317", appId: "1:106857147317:web:769c98aed26bb8fc9e87fc" };  
    let auth, db;   

    function inicializarFirebase() {  
        if (isFirebaseInitialized) return;  
        try {  
            if (!window.firebase) throw new Error("Firebase Erro.");  
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);  
            auth = firebase.auth(); db = firebase.firestore(); isFirebaseInitialized = true;  
            setupAuthListener();   
        } catch (error) { console.error("Firebase Falhou:", error); }  
    }  

    function setupAuthListener() {  
        auth.onAuthStateChanged(user => {  
            currentUser = user;   
            if (user) {  
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || "Cliente"}`;  
                if(isAdmin(user)) createAdminFab();
            } else {  
                el.userBtn.textContent = "Entrar / Cadastrar";  
            }
            // GARANTE QUE OS BOTÕES ESTEJAM SEMPRE VISÍVEIS
            if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';
            if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';
        });  
    }

    /* ------------------ ⚙️ LOGIN ------------------ */  
    const handleLoginSuccess = (user) => { currentUser = user; popupAdd("Login com sucesso!"); Overlays.closeAll(); };  
    el.loginForm?.addEventListener("submit", (e) => {  
        e.preventDefault(); inicializarFirebase();  
        auth.signInWithEmailAndPassword(document.getElementById("login-email").value, document.getElementById("login-senha").value)
            .then((cred) => handleLoginSuccess(cred.user)).catch(e => alert(e.message));  
    });  
    el.googleBtn?.addEventListener("click", () => {  
        inicializarFirebase(); const p = new firebase.auth.GoogleAuthProvider();  
        auth.signInWithPopup(p).then((res) => handleLoginSuccess(res.user)).catch(e => alert(e.message));  
    });  
    el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));  
    el.cartIcon?.addEventListener("click", () => { renderMiniCart(); Overlays.open(el.miniCart); });

    /* ------------------ ➕ ADICIONAIS ------------------ */  
    const adicionais = [ {nome:"Cebola",preco:0.99}, {nome:"Salada",preco:1.99}, {nome:"Ovo",preco:1.99}, {nome:"Bacon",preco:2.99}, {nome:"Hambúrguer",preco:2.99}, {nome:"Cheddar",preco:3.99}, {nome:"Filé Frango",preco:5.99} ];  
    let produtoExtras=null, produtoPrecoBase=0;  

    const openExtrasFor = safe((card) => {  
        produtoExtras = card.dataset.name; produtoPrecoBase = parseFloat(card.dataset.price)||0;  
        el.extrasList.innerHTML = adicionais.map((a, i) => `<label class="extra-line" style="display:flex;justify-content:space-between;padding:12px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px;"><span>${a.nome} (${money(a.preco)})</span><input type="checkbox" value="${i}"></label>`).join("");  
        Overlays.open(el.extrasModal);  
    });  
    document.querySelectorAll(".extras-btn").forEach(btn => btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card"))));  
    
    el.extrasConfirm?.addEventListener("click", () => {  
        if(!produtoExtras) return; 
        const checks=[...document.querySelectorAll("#extras-modal input:checked")];  
        const total=checks.reduce((acc,c)=>acc+adicionais[+c.value].preco,0);  
        const nomes=checks.map(c=>adicionais[+c.value].nome).join(", ");  
        const nomeFinal = nomes ? `${produtoExtras} + ${nomes}` : produtoExtras;  
        const exists = cart.find(i=>i.nome===nomeFinal);  
        if(exists) exists.qtd++; else cart.push({nome:nomeFinal, preco:produtoPrecoBase+total, qtd:1});  
        renderMiniCart(); popupAdd("Adicionado!"); Overlays.closeAll();  
    });
    
    /* ------------------ 🥤 COMBOS (LISTA COMPLETA) ------------------ */
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
        // Verifica se é combo e de qual tipo
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(nome)) { 
             const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;
             
             if (grupo && comboDrinkOptions[grupo]) {
                 // Gera o HTML do modal com todas as opções disponíveis
                 el.comboBody.innerHTML = comboDrinkOptions[grupo].map((o,i)=> 
                    `<label style="display:block;padding:10px;border:1px solid #ddd;margin-bottom:5px;border-radius:8px;">
                        <input type="radio" name="cd" value="${i}" ${i===0?'checked':''}> 
                        ${o.rotulo} <span style="color:red;font-weight:bold;">(+${money(o.delta)})</span>
                    </label>`
                 ).join("");
                 _comboCtx = { nome, preco, grupo };
                 Overlays.open(el.comboModal);
                 return;
             }
        }
        // Adiciona item normal se não for combo
        const found = cart.find((i) => i.nome === nome && i.preco === preco);
        if(found) found.qtd++; else cart.push({nome, preco, qtd:1});
        renderMiniCart(); popupAdd("Adicionado!");
    }
    
    el.comboConfirm?.addEventListener("click", () => {
        if(!_comboCtx) return;
        const sel = el.comboBody.querySelector('input[name="cd"]:checked');
        if(!sel) return;
        const opt = comboDrinkOptions[_comboCtx.grupo][sel.value];
        const finalName = `${_comboCtx.nome} + ${opt.rotulo}`;
        const finalPrice = Number(_comboCtx.preco) + (opt.delta || 0);
        
        const exists = cart.find(i => i.nome === finalName);
        if(exists) exists.qtd++; else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
        
        renderMiniCart(); Overlays.closeAll();
    });

    document.querySelectorAll(".add-cart").forEach((btn) =>
        btn.addEventListener("click", (e) => {  
            const card = e.currentTarget.closest(".card");  
            if (!card) return;  
            addCommonItem(card.dataset.name, parseFloat(card.dataset.price));  
        })
    );

    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

    /* --- ENDEREÇO & FRETE --- */
    let modoManual = false;
    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/app/endereco/index.php"));
    document.getElementById("btnManual")?.addEventListener("click", () => { modoManual=true; document.querySelector('.frete-container').style.display='none'; el.manualArea.style.display='block'; });
    el.btnVoltarCEP?.addEventListener("click", () => { modoManual=false; document.querySelector('.frete-container').style.display='block'; el.manualArea.style.display='none'; });
    
    async function getDynamicDeliveryFee(end) {
        if (!end) return DELIVERY_FEE_DEFAULT;
        let bairro = ""; try { bairro = end.split("-")[1]?.split("(")[0]?.trim() || end; } catch(_){}
        const clean = bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        try {
            if(!window.deliveryFeesCacheGlobal && db) {
                const snap = await db.collection("TaxasDeEntrega").doc("bairros").collection("lista").doc("tabela").get();
                window.deliveryFeesCacheGlobal = snap.exists ? snap.data().data : [];
            }
            const match = (window.deliveryFeesCacheGlobal||[]).find(i => clean.includes(i.nome.toLowerCase()));
            return match ? Number(match.taxa) : DELIVERY_FEE_DEFAULT;
        } catch(e) { return DELIVERY_FEE_DEFAULT; }
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

    async function calcTotals() {  
        const sub = getCartSubtotal();
        let del = DELIVERY_FEE_DEFAULT;
        const end = modoManual ? el.manualEndereco?.value : document.getElementById('endereco-auto')?.value;
        if(document.getElementById('retirar-local')?.checked || sub >= LIMITE_FRETE_GRATIS) del = 0;
        else if(end) del = await getDynamicDeliveryFee(end);
        return { sub, del, total: sub+del };
    }

    async function enhanceMiniCartUI() {  
        if (!el.miniFoot) return;
        const { sub, del, total } = await calcTotals();
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
        if(!cart.length) return;

        const div = document.createElement('div');
        div.className = 'cart-summary-generated';
        div.innerHTML = `
            <div style="border-top:1px solid #eee;margin-top:10px;padding-top:10px;">Subtotal: <b>${money(sub)}</b></div>
            <div>Entrega: <b>${del===0 ? 'Grátis' : money(del)}</b></div>
            <div style="font-size:1.2em;font-weight:bold;margin:10px 0;color:#d32f2f;">Total: ${money(total)}</div>
            <button id="finish-order" style="width:100%;background:#4caf50;color:#fff;padding:12px;border:none;border-radius:8px;font-weight:bold;">Finalizar Pedido</button>
            <button id="clear-cart" style="width:100%;background:#ff4081;color:#fff;padding:10px;border:none;border-radius:8px;font-weight:bold;margin-top:5px;">Limpar</button>
        `;
        el.miniFoot.appendChild(div);
        div.querySelector("#finish-order").addEventListener("click", fecharPedido);
        div.querySelector("#clear-cart").addEventListener("click", () => { cart=[]; renderMiniCart(); });
    }

    async function fecharPedido() {
        if(!cart.length) return;
        if(!currentUser) { alert("Faça login!"); Overlays.open(el.loginModal); return; }
        let endFinal = "";
        if(document.getElementById('retirar-local')?.checked) endFinal="RETIRADA";
        else if(modoManual) endFinal = `${el.manualEndereco.value}, Nº ${el.manualNumero.value}`;
        else endFinal = `${document.getElementById("endereco-auto").value}, Nº ${document.getElementById("numero-input").value}`;
        
        if(!endFinal || endFinal.includes("undefined")) return alert("Endereço inválido!");
        
        const { total, del } = await calcTotals();
        const itens = cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n");
        const msg = `🍔 *PEDIDO DFL*\n👤 ${currentUser.displayName}\n\n${itens}\n\n🚚 Frete: ${money(del)}\n💰 Total: ${money(total)}\n📍 ${endFinal}`;
        
        try {
            await db.collection("Pedidos").add({
                userId: currentUser.uid, usuario: currentUser.email, itens, total, data: new Date(), endereco: endFinal
            });
            await db.collection("Usuarios").doc(currentUser.uid).set({ pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, {merge:true});
        } catch(e){}
        window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`);
        cart=[]; renderMiniCart(); Overlays.closeAll();
    }

    /* MEUS PEDIDOS E RECOMPENSAS (LÓGICA ATIVADA) */
    el.pedidosBtn?.addEventListener("click", () => { 
        if(currentUser){ Overlays.open(el.pedidosPanel); carregarPedidos(); } 
        else { alert("Faça Login para ver seus pedidos!"); Overlays.open(el.loginModal); } 
    });
    
    async function carregarPedidos() {
        el.pedidosLista.innerHTML = "Carregando...";
        const s = await db.collection("Pedidos").where("userId","==",currentUser.uid).orderBy("data","desc").get();
        el.pedidosLista.innerHTML = s.docs.map(d=> `<div style="border:1px solid #ddd;padding:10px;margin-bottom:5px;">${new Date(d.data().data.seconds*1000).toLocaleDateString()} - ${money(d.data().total)}</div>`).join("") || "Sem pedidos.";
    }

    el.recompensasBtn?.addEventListener("click", () => { 
        if(currentUser){ Overlays.open(el.recompensasPanel); carregarRecompensas(); } 
        else { alert("Faça Login para ver suas recompensas!"); Overlays.open(el.loginModal); } 
    });
    
    async function carregarRecompensas() {
        el.recompensasLista.innerHTML = "Carregando...";
        const u = await db.collection("Usuarios").doc(currentUser.uid).get();
        const f = u.data()?.pedidosFeitos || 0;
        el.recompensasLista.innerHTML = `<h3>Pedidos: ${f}</h3><p>Complete 5 para ganhar Coca, 10 para Burger!</p>`;
    }

    /* ADMIN */
    const ADMINS = ["alefejohsefe@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(u) { return u && ADMINS.includes(u.email); }
    function createAdminFab() { if(el.reportsBtn) { el.reportsBtn.style.display="block"; el.reportsBtn.onclick = () => alert("Painel Admin"); } }

    /* STATUS LOJA */
    setInterval(() => {
        const h = new Date().getHours(); const aberto = h>=18 && h<23;
        if(el.statusBanner) { el.statusBanner.textContent = aberto?"🟢 Aberto":"🔴 Fechado"; el.statusBanner.className=`status-banner ${aberto?'open':'closed'}`; }
    }, 60000);

    inicializarFirebase();
    console.log("DFL v5.9 FINAL Carregado 🚀");
});
