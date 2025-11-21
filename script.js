/* =========================================================  
   🚀 DFL v5.3 — Lógica Principal e Frete Dinâmico (UX/Frete Aprimorado)
   - NOVO: Barra de Progresso do Frete Grátis
   - NOVO: Gerenciamento de Endereço Manual (Fallback)
   - FIX: Extração e Normalização de Bairro para Endereço Manual
   ========================================================= */  

document.addEventListener("DOMContentLoaded", () => {

    // MÁSCARA AUTOMÁTICA DO CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) {
                v = v.slice(0, 5) + "-" + v.slice(5, 8);
            }
            e.target.value = v;
        });
    }

    /* ------------------ ⚙️ BASE DE CONFIGURAÇÕES ------------------ */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_PARA_FRETE_GRATIS_POR_VALOR = 80.00;   
    let deliveryFeesCache = null;   

    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };  

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

    /* ------------------ 🎯 MAPEAMENTO DE ELEMENTOS DOM ------------------ */  
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
        slides: document.querySelector(".slides"),  
        cPrev: document.querySelector(".c-prev"),  
        cNext: document.querySelector(".c-next"),  
        userBtn: document.getElementById("user-btn"),  
        statusBanner: document.getElementById("status-banner"),  
        hoursBanner: document.querySelector(".hours-banner"),  
        reportsBtn: document.getElementById("reports-btn"),   
        promoModal: document.getElementById("promo-modal"),  
        promoImg: document.getElementById("promo-modal-img"),  
        promoTitle: document.getElementById("promo-modal-title"),  
        promoPrice: document.getElementById("promo-modal-price"),  
        promoAddBtn: document.getElementById("promo-modal-add"),  
        promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),  
        promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),  
        promoClose: document.querySelector("#promo-modal .promo-close"),  
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
        historicoLista: document.getElementById("historicoRecompensas")   
    };

    /* ------------------ 🌫️ BACKDROP (Fundo Transparente) ------------------ */  
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

    /* ------------------ 🧩 OVERLAYS (Gerenciamento de Modais) ------------------ */  
    const Overlays = {  
        closeAll() {  
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach((e) => e.classList.remove("show", "active"));  
            Backdrop.hide();  
        },  
        open(modalLike) {  
            Overlays.closeAll();  
            if (!modalLike) return;  
            modalLike.classList.add(
                (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
            );  
            Backdrop.show();  
        },  
    };  
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

    /* ------------------ 🎟️ CUPOM FORM ------------------ */  
    const couponForm = document.getElementById("coupon-form");  
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();  

    couponForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        const input = document.getElementById("coupon-input");  
        const val = (input?.value || "").trim().toUpperCase();  
        if (!val) {  
            couponApplied = "";  
            localStorage.removeItem("dflCoupon");  
            popupAdd("Cupom removido.");  
            renderMiniCart();  
            return;  
        }  
        couponApplied = val;  
        localStorage.setItem("dflCoupon", couponApplied);  
        renderMiniCart();   
    });

    /* ------------------ 💬 POPUP E NOTIFICAÇÕES ------------------ */  
    function popupAdd(msg) {  
        let pop = document.querySelector(".popup-add");  
        if (!pop) {  
            pop = document.createElement("div");  
            pop.className = "popup-add";  
            document.body.appendChild(pop);  
        }  
        pop.textContent = msg;  
        pop.classList.add("show");  
        setTimeout(() => pop.classList.remove("show"), 2000);  
    }

    function mostrarPopupRecompensa(msg) {  
        let pop = document.getElementById("conquista-popup");  
        if (!pop) {  
            pop = document.createElement("div");  
            pop.id = "conquista-popup";  
            pop.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%) scale(0);background:#4CAF50;color:white;padding:15px 25px;border-radius:12px;font-weight:bold;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:10001;opacity:0;transition:transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275),opacity 0.4s;`;  
            document.body.appendChild(pop);  
        }  
        pop.textContent = msg;  
        pop.style.opacity = '1';  
        pop.style.transform = 'translateX(-50%) scale(1)';  
        setTimeout(() => {  
            pop.style.transform = 'translateX(-50%) scale(0)';  
            pop.style.opacity = '0';  
        }, 6000);  
    }

    /* ------------------ 🛒 MINI-CARRINHO ------------------ */  
    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  

        if (!cart.length) {  
            el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';  
            if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
            const couponMsg = document.getElementById("coupon-message");  
            const couponDiscountRow = document.getElementById("coupon-discount-row");  
            if (couponMsg) couponMsg.innerHTML = "";  
            if (couponDiscountRow) couponDiscountRow.style.display = "none";  
            // [NOVO] Limpa a barra de progresso
            document.getElementById("frete-progresso-container")?.innerHTML = '';
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
            <button type="button" class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>  
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>  
            <button type="button" class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>  
            <button type="button" class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>  
          </div>  
        </div>  
      </div>  
    `).join("");  
    }  

    function bindMiniCartButtons() {  
        el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {  
            const i = +e.currentTarget.dataset.idx;  
            if (cart[i]) { cart[i].qtd++; renderMiniCart(); }  
        }));  
        el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => {  
            const i = +e.currentTarget.dataset.idx;  
            if (cart[i]) {  
                if (cart[i].qtd > 1) cart[i].qtd--;  
                else cart.splice(i, 1);  
                renderMiniCart();  
            }  
        }));  
        el.miniList.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => {  
            const i = +e.currentTarget.dataset.idx;  
            cart.splice(i, 1);  
            renderMiniCart();  
            popupAdd("Item removido!");  
        }));  
    }  

    // Reescrita para garantir que os botões são ligados após a renderização
    const _renderMiniCartOrig = renderMiniCart;  
    renderMiniCart = function () {  
        _renderMiniCartOrig();   
        bindMiniCartButtons();   
        enhanceMiniCartUI();  
    };

    /* ------------------ 🔥 FIREBASE ------------------ */  
    const firebaseConfig = {  
        apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",  
        authDomain: "da-familia-lanches.firebaseapp.com",  
        projectId: "da-familia-lanches",  
        storageBucket: "da-familia-lanches.appspot.com",  
        messagingSenderId: "106857147317",  
        appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",  
    };  

    let auth, db;   

    function inicializarFirebase() {  
        if (isFirebaseInitialized) return;  
        try {  
            if (!window.firebase) throw new Error("Biblioteca principal do Firebase não carregou.");  
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);  
            auth = firebase.auth();  
            db = firebase.firestore();  
            isFirebaseInitialized = true;  
            setupAuthListener();   
        } catch (error) {  
            console.error("ERRO FATAL AO INICIAR FIREBASE:", error);  
            document.body.innerHTML = `<div style="padding:20px;text-align:center;font-size:1.2rem;color:red;font-family:sans-serif;margin-top:50px;"><b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.<br><small>Verifique sua conexão e recarregue.</small></div>`;  
        }  
    }  

    function setupAuthListener() {  
        auth.onAuthStateChanged(user => {  
            currentUser = user;   
            if (user) {  
                // Atualiza botão de usuário e visibilidade dos painéis
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;  
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';  
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';  
            } else {  
                el.userBtn.textContent = "Entrar / Cadastrar";  
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';  
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'none';  
            }  
            // Checa e configura painel Admin
            if (user && isAdmin(user)) {  
                if (el.reportsBtn) createAdminFab();  
            } else {  
                if (el.reportsBtn) el.reportsBtn.style.display = "none";  
                document.getElementById("admin-dashboard")?.remove();  
            }  
        });  
    }

    /* ------------------ ⚙️ LOGIN E AUTENTICAÇÃO ------------------ */  
    const handleLoginSuccess = (user) => {  
        currentUser = user;  
        popupAdd("Login realizado com sucesso!");  
        Overlays.closeAll();  
    };  

    const handleLoginError = (err) => {  
        if (err.code === "auth/user-not-found") {  
            if (confirm("Conta não encontrada. Deseja criar uma nova?")) {  
                auth.createUserWithEmailAndPassword(
                    document.getElementById("login-email")?.value?.trim(),   
                    document.getElementById("login-senha")?.value?.trim()
                ).then((cred) => handleLoginSuccess(cred.user)).catch((e) => alert("Erro: " + e.message));  
            }  
        } else if (err.code === "auth/wrong-password") {  
            alert("Senha incorreta. Tente novamente.");  
        } else {  
            alert("Erro: ".concat(err.message));  
        }  
    };  

    // Login com E-mail e Senha
    el.loginForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        inicializarFirebase();
        if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");  
        const email = document.getElementById("login-email")?.value?.trim();  
        const senha = document.getElementById("login-senha")?.value?.trim();  
        if (!email || !senha) return alert("Preencha e-mail e senha.");  
        auth.signInWithEmailAndPassword(email, senha)
            .then((cred) => handleLoginSuccess(cred.user))
            .catch(handleLoginError);  
    });  

    // Login com Google
    el.googleBtn?.addEventListener("click", () => {  
        inicializarFirebase();
        if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");  
        const provider = new firebase.auth.GoogleAuthProvider();  
        auth.signInWithPopup(provider)
            .then((res) => handleLoginSuccess(res.user))
            .catch((err) => alert("Erro: ".concat(err.message)));  
    });  

    // Abrir modais
    el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));  
    el.cartIcon?.addEventListener("click", () => { renderMiniCart(); Overlays.open(el.miniCart); });

    /* ------------------ ➕ ADICIONAIS (Extras) ------------------ */  
    const adicionais = [  
        { nome: "Cebola", preco: 0.99 },  
        { nome: "Salada", preco: 1.99 },  
        { nome: "Ovo", preco: 1.99 },  
        { nome: "Bacon", preco: 2.99 },  
        { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },  
        { nome: "Cheddar Cremoso", preco: 3.99 },  
        { nome: "Filé de Frango", preco: 5.99 },  
        { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },  
    ];  

    let produtoExtras = null;  
    let produtoPrecoBase = 0;  

    const openExtrasFor = safe((card) => {  
        if (!card || !el.extrasModal || !el.extrasList) return;  
        produtoExtras = card.dataset.name;  
        produtoPrecoBase = parseFloat(card.dataset.price) || 0;  
        el.extrasList.innerHTML = adicionais.map((a, i) => `  
      <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:all 0.2s;font-size:1rem;">  
        <span style="font-weight:600;color:#222;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>  
        <input type="checkbox" value="${i}" style="margin-left:10px;">  
      </label>`).join("");  
        Overlays.open(el.extrasModal);  
    });  

    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
    );  

    el.extrasConfirm?.addEventListener("click", () => {  
        if (!produtoExtras) return Overlays.closeAll();  
        const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];  
        const extrasContagem = {};  
        checks.forEach(c => {  
            const idx = +c.value;  
            const adicional = adicionais[idx];  
            if (extrasContagem[adicional.nome]) extrasContagem[adicional.nome].qtd++;  
            else extrasContagem[adicional.nome] = { preco: adicional.preco, qtd: 1 };  
        });  
        const extrasNomes = Object.keys(extrasContagem).map(nome => {  
            const qtd = extrasContagem[nome].qtd;  
            return qtd > 1 ? `${qtd}x ${nome}` : nome;  
        }).join(", ");  
        const precoExtras = Object.values(extrasContagem).reduce((t, e) => t + (e.preco * e.qtd), 0);  
        const precoTotal = produtoPrecoBase + precoExtras;  
        const nomeCompleto = extrasNomes ? `${produtoExtras} + ${extrasNomes}` : produtoExtras;  
        const existente = cart.find(i => i.nome === nomeCompleto);  
        if (existente) existente.qtd++;  
        else cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });  
        renderMiniCart();  
        popupAdd("Adicionado ao carrinho!");  
        Overlays.closeAll();  
    });  

    document.querySelectorAll(".extras-close").forEach((b) =>
        b.addEventListener("click", () => Overlays.closeAll())
    );

    /* ------------------ 🥤 COMBOS E OPÇÕES DE BEBIDA ------------------ */  
    const comboDrinkOptions = {  
        casal: [  
            { rotulo: "Fanta 1L (padrão)", delta: 0.01 },  
            { rotulo: "Coca-Cola 1L", delta: 3.0 },  
            { rotulo: "Coca-Cola 1L Zero", delta: 3.0 },  
        ],  
        familia: [  
            { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 },  
            { rotulo: "Coca-Cola 2L", delta: 5.0 },  
        ],  
    };  

    let _comboCtx = null;  
    const openComboModal = safe((nomeCombo, precoBase) => {  
        if (!el.comboModal || !el.comboBody) { addCommonItem(nomeCombo, precoBase); return; }  
        const low = (nomeCombo || "").toLowerCase();  
        const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;  
        if (!grupo) { addCommonItem(nomeCombo, precoBase); return; }  
        const opts = comboDrinkOptions[grupo];  
        el.comboBody.innerHTML = opts.map((o, i) => `  
      <label class="combo-option-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;font-size:1rem;">  
        <span style="font-weight:600;color:#222;">${o.rotulo}</span>  
        <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>  
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="margin-left:10px;">  
      </label>`).join("");  
        _comboCtx = { nomeCombo, precoBase, grupo };  
        Overlays.open(el.comboModal);  
    });  

    el.comboConfirm?.addEventListener("click", () => {  
        if (!_comboCtx) return Overlays.closeAll();  
        const sel = el.comboBody?.querySelector('input[name="combo-drink"]:checked');  
        if (!sel) return;  
        const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];  
        const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;  
        const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);  
        const existente = cart.find(i => i.nome === finalName);  
        if (existente) existente.qtd++;  
        else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });  
        popupAdd("Combo adicionado!");  
        renderMiniCart();  
        Overlays.closeAll();  
    });  

    document.querySelectorAll("#combo-modal .combo-close").forEach((b) =>
        b.addEventListener("click", () => Overlays.closeAll())
    );  

    function addCommonItem(nome, preco) {  
        // Tenta abrir modal de combo se o item for um combo
        if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) { openComboModal(nome, preco); return; }  
        const found = cart.find((i) => i.nome === nome && i.preco === preco);  
        if (found) found.qtd++;  
        else cart.push({ nome, preco, qtd: 1 });  
        renderMiniCart();  
        popupAdd(`${nome} adicionado!`);  
    }  

    document.querySelectorAll(".add-cart").forEach((btn) =>
        btn.addEventListener("click", (e) => {  
            const card = e.currentTarget.closest(".card");  
            if (!card) return;  
            addCommonItem(card.dataset.name, parseFloat(card.dataset.price));  
        })
    );

    /* ------------------ ⚙️ CÁLCULOS GERAIS ------------------ */  
    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

    /* VALIDAÇÃO DE CUPOM */  
    const _cupomCache = {};  
    function _cacheKey(codigo, subtotal) {  
        const faixa = Math.floor((subtotal || 0) / 5);  
        return `${(codigo||"").toUpperCase()}::${faixa}`;  
    }  

    async function validarCupomFirestore(codigo, subtotal) {  
        if (!isFirebaseInitialized) return { valido:false, discount:0, freeShipping:false, label:"", mensagem:"Erro de conexão." };  
        const code = (codigo || "").toUpperCase();  
        const invalido = { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };  
        if (!code) return invalido;  
        const userId = currentUser?.uid;  
        const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
        const key = _cacheKey(code, subtotal);  
        const now = Date.now();  
        const hit = _cupomCache[key];  
        if (hit && hit.ate > now) return hit.res;  

        let data = null;  
        let isPersonalizado = false;  

        try {  
            const snapGeral = await db.collection("Cupons").doc(code).get();  
            if (snapGeral.exists) { data = snapGeral.data(); }  
            else {  
                // Tenta achar cupom de recompensa personalizado
                const recompensaEncontrada = RECOMPENSAS_DATA.find(r => r.valor === code && r.tipo === 'cupom');  
                if (userId && recompensaEncontrada) {  
                    const snapPessoal = await db.collection("CuponsUsuarios").doc(userId).get();  
                    const pessoalData = snapPessoal.data();  
                    if (snapPessoal.exists && pessoalData?.cupom === code && !pessoalData?.usado) {  
                        data = { tipo: pessoalData.tipo, valor: pessoalData.valor, ativo: true, expiraEm: pessoalData.expiraEm };  
                        isPersonalizado = true;  
                    } else if (snapPessoal.exists && pessoalData?.usado) {  
                        return { ...invalido, mensagem: "Este cupom já foi utilizado." };  
                    } else { return { ...invalido, mensagem: "Cupom inválido ou não liberado." }; }  
                } else {  
                    const res = { ...invalido, mensagem: "Cupom inválido." };  
                    _cupomCache[key] = { ate: now + 30000, res }; return res;  
                }  
            }  

            // Checagem de validade e expiração
            if (!data.ativo) { const res = { ...invalido, mensagem: "Este cupom não está mais ativo." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  
            if (data.expiraEm) {  
                let expiraDate = null;  
                if (typeof data.expiraEm?.toDate === "function") expiraDate = data.expiraEm.toDate();  
                else if (typeof data.expiraEm === "string") expiraDate = new Date(data.expiraEm);  
                if (expiraDate && expiraDate < new Date()) { const res = { ...invalido, mensagem: "Este cupom expirou." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  
            }  

            // Aplica desconto
            let discount = 0, freeShipping = false, label = "";  
            if (data.tipo === "percent") { discount = Math.max(0, subtotal * (Number(data.percent || data.valor) / 100)); label = `${Number(data.percent || data.valor)}% OFF`; }  
            else if (data.tipo === "value") { const val = Math.max(0, Number(data.valor) || 0); discount = Math.min(subtotal, val); label = `R$ ${val.toFixed(2).replace(".", ",")} OFF`; }  
            else if (data.tipo === "frete") { freeShipping = true; label = "Frete Grátis"; }  
            else { const res = { ...invalido, mensagem: "Tipo de cupom desconhecido." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  

            const res = { valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado com sucesso!", isPersonalizado };  
            _cupomCache[key] = { ate: now + 30000, res }; return res;  
        } catch (err) { console.error("Erro ao validar cupom:", err); return { ...invalido, mensagem: "Erro ao processar cupom." }; }  
    }

    // [NOVO] Função para controlar o estado dos campos de endereço
    const toggleAddressState = (isDisabled, isManual = false) => {
        const enderecoAuto = document.getElementById('endereco-auto');
        const numeroInput = document.getElementById('numero-input');
        const complementoInput = document.getElementById('complemento-input');
        const cepInput = document.getElementById('cep-input');
        const retirarLocal = document.getElementById('retirar-local');

        // Se for modo manual
        if (isManual) {
            if(enderecoAuto) enderecoAuto.disabled = false;
            if(numeroInput) numeroInput.disabled = false;
            if(complementoInput) complementoInput.disabled = false;
            if(cepInput) cepInput.disabled = true;
            if(enderecoAuto) enderecoAuto.placeholder = 'Digite Rua, Número, Bairro, Cidade/UF'; // Hint para o usuário
        } 
        // Se for modo via CEP
        else {
            if(cepInput) cepInput.disabled = false;
            // Campos de endereço ficam desabilitados, exceto Numero/Complemento se o ViaCEP achou o endereço
            if(enderecoAuto) enderecoAuto.disabled = isDisabled; 
            if(numeroInput) numeroInput.disabled = isDisabled;
            if(complementoInput) complementoInput.disabled = isDisabled;
        }

        if(retirarLocal) retirarLocal.disabled = false; // Retirar no Local sempre ativo
    };

    /* --- BUSCAR CEP VIA API / FALLBACK MANUAL --- */  
    async function buscarCEP(cep) {  
        const freteContainer = document.querySelector('.frete-container');  
        const enderecoAuto = document.getElementById('endereco-auto');  
        const numeroInput = document.getElementById('numero-input');  
        const complementoInput = document.getElementById('complemento-input');  
        
        const updateStatus = (msg, color) => { 
            const titleElement = freteContainer ? freteContainer.querySelector('h4') : null;
            if (titleElement) titleElement.innerHTML = `🚚 Entrega: <span style="color:${color}; font-size: 0.9em;">${msg}</span>`; 
        };  
        
        // Função local para limpar e habilitar preenchimento manual (fallback)
        const clearAndEnableManual = (msg) => {  
            if (enderecoAuto) { enderecoAuto.value = ''; enderecoAuto.placeholder = msg; }
            if (numeroInput) numeroInput.value = '';  
            if (complementoInput) complementoInput.value = '';  
            toggleAddressState(false, true); // Habilita manual
            updateStatus('Preenchimento Manual', '#d32f2f');  
            renderMiniCart();  
        };  

        toggleAddressState(true);  // Desabilita tudo (em modo de busca)
        updateStatus('Buscando endereço...', '#ffb300');  
        document.getElementById('cep-input').disabled = false;   

        try {  
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);  
            const data = await response.json();  
            if (data.erro || !response.ok) { 
                clearAndEnableManual('CEP não encontrado. Digite a rua e bairro.'); 
            }  
            else {  
                const localidadeCompleta = `${data.localidade || 'Cidade'}/${data.uf || 'UF'}`;  
                const enderecoString = `${data.logradouro || 'Rua'} - ${data.bairro || 'Bairro'} (${localidadeCompleta})`;  
                
                enderecoAuto.value = enderecoString;  
                toggleAddressState(false, false); // Habilita Número/Complemento (Via CEP)
                
                if (numeroInput) numeroInput.focus();   
                updateStatus('Endereço encontrado!', '#4caf50');  
                renderMiniCart();   
            }  
        } catch (error) {  
            console.error("ViaCEP Error:", error);  
            popupAdd("Erro ao consultar CEP.");  
            clearAndEnableManual('Erro na consulta. Digite a rua e bairro.');  
        }  
    }

    document.getElementById('btn-calcular-frete')?.addEventListener('click', safe(() => {  
        const cepInput = document.getElementById('cep-input');  
        const cep = cepInput.value.trim().replace(/\D/g, '');  
        if (cep.length === 8) buscarCEP(cep);  
        else popupAdd("CEP deve ter 8 dígitos.");  
    }));
    
    // [NOVO] Habilitar preenchimento Manual Listener
    document.getElementById('manual-address-btn')?.addEventListener('click', safe((e) => {
        e.preventDefault();
        const enderecoAuto = document.getElementById('endereco-auto');
        const numeroInput = document.getElementById('numero-input');
        const complementoInput = document.getElementById('complemento-input');
        const cepInput = document.getElementById('cep-input');

        // Limpa os campos
        if (enderecoAuto) { enderecoAuto.value = ''; enderecoAuto.placeholder = 'Digite Rua e Bairro (Ex: Rua A, Bairro X)'; }
        if (numeroInput) numeroInput.value = '';
        if (complementoInput) complementoInput.value = '';
        if (cepInput) cepInput.value = '';
        
        // Habilita a edição manual dos campos
        toggleAddressState(false, true); 
        
        if (enderecoAuto) enderecoAuto.focus();
        
        renderMiniCart(); // Recalcula totais/frete se necessário
        popupAdd("Preenchimento manual habilitado.");
    }));

    // ============================================================
    // 🚀 FUNÇÃO CRÍTICA: CÁLCULO DE FRETE DINÂMICO (FIREBASE)
    // [AJUSTADO PARA ENDEREÇO MANUAL]
    // ============================================================
    async function getDynamicDeliveryFee(enderecoCompleto) {
        if (!enderecoCompleto || typeof enderecoCompleto !== "string") {
            console.warn("FW: Endereço vazio, usando fallback.");
            return DELIVERY_FEE_DEFAULT;
        }

        let bairroExtraido = "";
        try {
            // [AJUSTE] Extração de Bairro: Lida com formatos ViaCEP ("Rua - Bairro (Cidade)") E formatos manuais ("Rua, Bairro...")
            
            // 1. Tenta formato ViaCEP com parênteses
            const matchViaCep = enderecoCompleto.match(/\((.*?)\)$/);
            if (!matchViaCep) {
                // 2. Tenta extrair o último segmento após vírgula ou hífen (para entrada manual)
                const partes = enderecoCompleto.split(/,|-/).map(p => p.trim());
                // Assume que o bairro ou a informação mais relevante está na penúltima ou última parte
                const parteBairro = partes.length >= 2 ? partes[partes.length - 2] : partes[parts.length - 1];
                
                // Tenta extrair a palavra Bairro se existir
                const matchBairroKeyword = parteBairro.match(/bairro\s+(.*)/i);
                bairroExtraido = matchBairroKeyword ? matchBairroKeyword[1].trim() : parteBairro.trim();

            } else {
                // Formato ViaCEP encontrado
                const partePrincipal = enderecoCompleto.split("(")[0].trim();
                const partes = partePrincipal.split(" - ");
                bairroExtraido = partes[partes.length - 1].trim();
            }

        } catch (_) {
            console.warn("FW: Falha ao extrair bairro na entrada manual.");
            return DELIVERY_FEE_DEFAULT;
        }
        
        // [AJUSTE] Normalização: minúsculas, remove acentos e espaços extras (APLICADO EM TODAS AS ENTRADAS)
        const bairroClean = bairroExtraido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        console.log("FW: Bairro extraído:", bairroExtraido, "| Normalizado:", bairroClean);

        try {
            if (!db) { console.warn("FW: db não disponível."); return DELIVERY_FEE_DEFAULT; }

            // Carrega o cache de taxas de entrega do Firebase (apenas na primeira vez)
            if (!window.deliveryFeesCacheGlobal) {
                console.log("FW: Carregando taxas do Firebase...");
                const snap = await db.collection("TaxasDeEntrega").doc("bairros").collection("lista").doc("tabela").get();
                if (!snap.exists) { console.warn("FW: Documento 'tabela' não encontrado."); return DELIVERY_FEE_DEFAULT; }

                const arr = snap.data()?.data || [];
                const cache = {};
                arr.forEach(item => {
                    if (!item || !item.nome) return;
                    const key = String(item.nome).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const valor = Number(item.taxa);
                    if (!isNaN(valor) && valor >= 0) cache[key] = valor;
                });
                window.deliveryFeesCacheGlobal = cache;
                console.log("FW: Cache carregado:", Object.keys(cache).length, "bairros");
            }
        } catch (e) { console.warn("FW: Erro ao carregar taxas.", e); return DELIVERY_FEE_DEFAULT; }

        const cacheAtual = window.deliveryFeesCacheGlobal || {};
        if (!Object.keys(cacheAtual).length) return DELIVERY_FEE_DEFAULT;

        // BUSCA 1: Match EXATO
        if (cacheAtual[bairroClean] !== undefined) {
            console.log(`FW: Match EXATO para "${bairroClean}". Taxa: R$ ${cacheAtual[bairroClean]}`);
            return cacheAtual[bairroClean];
        }

        // BUSCA 2: Match por PALAVRA-CHAVE (para bairros compostos ou nomes incompletos)
        const palavras = bairroClean.split(" ");
        for (const palavra of palavras) {
            if (palavra.length < 4) continue; // Ignora palavras curtas
            for (const key in cacheAtual) {
                if (key.includes(palavra)) {
                    console.log(`FW: Match PALAVRA '${palavra}' em "${key}". Taxa: R$ ${cacheAtual[key]}`);
                    return cacheAtual[key];
                }
            }
        }

        // BUSCA 3: Fallback (Frete Padrão)
        console.warn(`FW: Bairro "${bairroExtraido}" não mapeado. Fallback R$ ${DELIVERY_FEE_DEFAULT}`);
        return DELIVERY_FEE_DEFAULT;
    }

    // FUNÇÃO CRÍTICA DE CÁLCULO DE TOTAIS
    async function calcTotals() {  
        const subtotal = getCartSubtotal();  
        const d = await validarCupomFirestore(couponApplied, subtotal);   
        const cepInput = document.getElementById('cep-input');  
        const enderecoAuto = document.getElementById('endereco-auto');  
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';  
        let deliveryFee = DELIVERY_FEE_DEFAULT;   
        
        const enderecoValue = enderecoAuto ? enderecoAuto.value.trim() : '';
        const isEnderecoValido = (cepValue.length === 8 && enderecoValue) || (enderecoValue && !cepValue); // Válido se tiver CEP+Endereço ou Endereço Manual

        if (isRetirarLocal || subtotal >= LIMITE_PARA_FRETE_GRATIS_POR_VALOR) {  
            // Frete grátis por Retirada ou Valor
            deliveryFee = 0;  
        } else if (isEnderecoValido) {  
            // Frete dinâmico via CEP/Endereço (funciona com ViaCEP e Manual)
            try { deliveryFee = await getDynamicDeliveryFee(enderecoValue); }  
            catch(e) { console.error("Erro frete dinâmico:", e); deliveryFee = DELIVERY_FEE_DEFAULT; }  
        }  

        const delivery = d.freeShipping ? 0 : deliveryFee;  
        const total = Math.max(0, subtotal + delivery - d.discount);  
        return { subtotal, delivery, discount: d.discount, discountLabel: d.label, total, cupomInfo: d };  
    }  

    // Atualiza o resumo do carrinho (subtotal, frete, total)
    // [AJUSTADO COM BARRA DE PROGRESSO DINÂMICA]
    async function enhanceMiniCartUI() {  
        if (!el.miniFoot) return;  
        const couponMsg = document.getElementById("coupon-message");  
        const couponDiscountRow = document.getElementById("coupon-discount-row");  
        const cartDiscount = document.getElementById("cart-discount");  
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
        if (cart.length === 0) { if (couponMsg) couponMsg.innerHTML = ""; if (couponDiscountRow) couponDiscountRow.style.display = "none"; return; }  

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
        const deliveryLabel = delivery === 0 ? "Grátis 🎉" : money(delivery);  
        
        // 1. LÓGICA DA BARRA DE PROGRESSO DO FRETE GRÁTIS
        const progressoContainer = document.getElementById("frete-progresso-container");
        const limite = LIMITE_PARA_FRETE_GRATIS_POR_VALOR;
        let progressoHTML = '';

        if (progressoContainer) {
            if (subtotal < limite) {
                const falta = limite - subtotal;
                const porcentagem = Math.min(100, (subtotal / limite) * 100);
                const faltaFormatado = money(falta);

                progressoHTML = `
                    <div style="margin: 15px 0 0 0; padding: 10px; background: #fff8d6; border-radius: 8px; text-align: center; border: 1px solid #ffb300;">
                        <p style="font-size: 0.9rem; color: #222; margin-bottom: 8px; font-weight: 500;">
                            🎯 Faltam **${faltaFormatado}** para obter Frete Grátis!
                        </p>
                        <div style="background: #e9ecef; border-radius: 10px; height: 18px; overflow: hidden; margin-bottom: 5px; position:relative;">
                            <div style="height: 100%; width: ${porcentagem}%; background: linear-gradient(90deg, #ffc833, #ffb300); transition: width 0.5s ease-in-out;">
                            </div>
                            <span style="position: absolute; top: 0; width: 100%; text-align: center; line-height: 18px; font-size: 0.75rem; color: #111; font-weight: bold;">${Math.floor(porcentagem)}%</span>
                        </div>
                    </div>
                `;
            } else {
                progressoHTML = `
                    <div style="margin: 15px 0 0 0; padding: 12px; background: #4CAF50; border-radius: 8px; text-align: center; color: white;">
                        <p style="font-size: 1rem; font-weight: bold; margin: 0;">
                            🎉 Parabéns! Você obteve Frete Grátis!
                        </p>
                    </div>
                `;
            }
            progressoContainer.innerHTML = progressoHTML;
        }
        // FIM DA LÓGICA DA BARRA DE PROGRESSO

        // 2. Atualiza UI de Cupom
        if (couponMsg) {  
            couponMsg.textContent = cupomInfo.mensagem;  
            couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;  
            if (!cupomInfo.valido && couponApplied) {  
                couponApplied = ""; localStorage.removeItem("dflCoupon");  
                const couponInput = document.getElementById("coupon-input");  
                if (couponInput && document.activeElement !== couponInput) couponInput.value = "";  
            }  
        }  
        if (couponDiscountRow && cartDiscount) {  
            if (discount > 0 || cupomInfo.label) { cartDiscount.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`; couponDiscountRow.style.display = "flex"; }  
            else couponDiscountRow.style.display = "none";  
        }  

        // 3. Cria e insere o resumo e botões
        const summaryDiv = document.createElement('div');  
        summaryDiv.className = 'cart-summary-generated';  
        summaryDiv.innerHTML = `  
      <div class="summary-row" style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;"><span>Subtotal</span><b>${money(subtotal)}</b></div>  
      <div class="summary-row"><span>Entrega</span><b>${deliveryLabel}</b></div>  
      <div class="summary-row" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin:10px 0;font-size:1.1rem;"><span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span></div>  
      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">Finalizar Pedido 🛍️</button>  
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Limpar Carrinho</button>`;  

        el.miniFoot.appendChild(summaryDiv);  
        
        // Liga eventos de recalculo
        document.getElementById('retirar-local')?.addEventListener('change', renderMiniCart);  
        document.getElementById('numero-input')?.addEventListener('input', renderMiniCart);  
        document.getElementById('complemento-input')?.addEventListener('input', renderMiniCart);  
        document.getElementById('endereco-auto')?.addEventListener('input', renderMiniCart); // [NOVO] Adicionado para modo manual
        
        // Liga botões
        summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);  
        summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {  
            if (confirm("Limpar todo o carrinho?")) { cart = []; couponApplied = ""; localStorage.removeItem("dflCoupon"); document.getElementById("coupon-input").value = ""; renderMiniCart(); popupAdd("Carrinho limpo!"); }  
        });  
    }

    /* ------------------ 🎁 RECOMPENSAS CONFIGURAÇÃO ------------------ */  
    let configuracoesRecompensa = null;   
    async function carregarConfiguracoesDeRecompensas() {  
        if (!isFirebaseInitialized) return [];   
        if (configuracoesRecompensa) return configuracoesRecompensa;   
        try {  
            const snapshot = await db.collection("RecompensasConfig").get();  
            const configs = [];  
            snapshot.forEach(doc => { const data = doc.data(); configs.push({ id: doc.id, limite: data.meta || data.limite, tipo: data.tipo, valor: data.valor || data.titulo, titulo: data.titulo || data.valor, ...data }); });  
            configuracoesRecompensa = configs.sort((a, b) => (a.limite || 0) - (b.limite || 0));  
            return configuracoesRecompensa;  
        } catch (e) { console.error("Erro recompensas:", e); return []; }  
    }

    /* CARROSSEL DE PROMOÇÕES */  
    let currentPromoId = 1;  
    function showPromoModal(promoId) {  
        if (!el.promoModal || !PROMO_DATA[promoId]) return;  
        currentPromoId = Number(promoId);  
        const promo = PROMO_DATA[currentPromoId];  
        if (el.promoImg) el.promoImg.src = promo.img;  
        if (el.promoTitle) el.promoTitle.textContent = promo.nome;  
        if (el.promoPrice) el.promoPrice.innerHTML = `<span class="old-price">De ${money(promo.precoAntigo)}</span> por <b>${money(promo.preco)}</b>`;  
        Overlays.open(el.promoModal);  
    }  
    document.querySelectorAll(".slide[data-promo-id]").forEach((img) => img.addEventListener("click", () => { const id = parseInt(img.dataset.promoId, 10); if (id) showPromoModal(id); }));  
    el.promoAddBtn?.addEventListener("click", () => { const promo = PROMO_DATA[currentPromoId]; if (!promo) return; addCommonItem(promo.nome, promo.preco); Overlays.closeAll(); });  
    el.promoNavPrev?.addEventListener("click", () => { let newId = currentPromoId - 1; if (newId < 1) newId = 9; showPromoModal(newId); });  
    el.promoNavNext?.addEventListener("click", () => { let newId = currentPromoId + 1; if (newId > 9) newId = 1; showPromoModal(newId); });  
    el.promoClose?.addEventListener("click", () => Overlays.closeAll());  
    el.cPrev?.addEventListener("click", () => { if (!el.slides) return; el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320); });  
    el.cNext?.addEventListener("click", () => { if (!el.slides) return; el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320); });

    /* STATUS DA LOJA + TIMER */  
    const atualizarStatus = safe(() => {  
        const agora = new Date(); const h = agora.getHours();  
        const aberto = h >= 18 && h < 23;   
        if (el.statusBanner) { el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; }  
        if (el.hoursBanner) {  
            const elMsg = el.hoursBanner.querySelector("#hours-message"); const elTimer = el.hoursBanner.querySelector("#timer");  
            if (!elMsg || !elTimer) return;  
            if (aberto) { const fim = new Date(agora); fim.setHours(23, 30, 0); let diff = (fim - agora) / 1000; if (diff < 0) diff = 0; const restH = Math.floor(diff / 3600); const restM = Math.floor((diff % 3600) / 60); elMsg.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam`; elTimer.textContent = `${restH}h ${restM}min`; }  
            else { const inicio = new Date(agora); if (h >= 23) inicio.setDate(inicio.getDate() + 1); inicio.setHours(18, 0, 0); let diff = (inicio - agora) / 1000; const faltamH = Math.floor(diff / 3600); const faltamM = Math.floor((diff % 3600) / 60); elMsg.innerHTML = `🔒 Fechado — Abrimos em`; elTimer.textContent = `${faltamH}h ${faltamM}min`; }  
        }  
    });  
    atualizarStatus(); setInterval(atualizarStatus, 60000); // Atualiza a cada 1 minuto

    const atualizarTimer = safe(() => {  
        const agora = new Date(); const fim = new Date(); fim.setHours(23, 59, 59, 999); const diff = fim - agora;  
        const elTimer = document.getElementById("promo-timer"); if (!elTimer) return;  
        if (diff <= 0) return (elTimer.textContent = "00:00:00");  
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0"); const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"); const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");  
        elTimer.textContent = `${h}:${m}:${s}`;  
    });  
    atualizarTimer(); setInterval(atualizarTimer, 1000); // Atualiza a cada 1 segundo

    /* FECHAR PEDIDO */  
    async function fecharPedido() {  
        if (!cart.length) return alert("Carrinho vazio!");  
        if (!currentUser) { alert("Faça login para enviar o pedido!"); Overlays.open(el.loginModal); return; }  
        
        // 1. Coleta e Normaliza Dados do Endereço
        const cepInput = document.getElementById('cep-input'); 
        const autoRuaBairro = document.getElementById("endereco-auto"); 
        const autoNumero = document.getElementById("numero-input"); 
        const autoComp = document.getElementById("complemento-input"); 
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        
        const ruaBairroValue = autoRuaBairro ? autoRuaBairro.value.trim() : ''; 
        const numeroValue = autoNumero ? autoNumero.value.trim() : ''; 
        const compValue = autoComp ? autoComp.value.trim() : ''; 
        const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';  

        let finalAddressString = "";  
        
        if (isRetirarLocal) {
            finalAddressString = "CLIENTE IRÁ RETIRAR NO LOCAL";
        } else if (ruaBairroValue && numeroValue) { 
            // Constrói a String de Endereço Final
            finalAddressString = `${ruaBairroValue}, N° ${numeroValue}`; 
            if (compValue) finalAddressString += `, Comp: ${compValue}`; 
            if (cepValue.length === 8) finalAddressString += ` | CEP: ${cepValue}`; 
        } else {
            // Validação de Falha
            alert("Preencha o endereço completo (Rua/Bairro e Número) ou marque 'Retirar no Local'."); 
            return; 
        }

        const addr = finalAddressString;  
        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();  
        
        // Objeto do Pedido
        const pedido = { 
            usuario: currentUser.email, 
            userId: currentUser.uid, 
            nome: currentUser.displayName || currentUser.email.split("@")[0], 
            itens: cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
            itensObj: cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })), 
            subtotal: Number(subtotal.toFixed(2)), 
            entrega: Number(delivery.toFixed(2)), 
            desconto: Number(discount.toFixed(2)), 
            cupom: couponApplied || "", 
            total: Number(total.toFixed(2)), 
            endereco: addr, 
            data: new Date().toISOString(), 
            thumb: '' 
        };  

        try {  
            // Transação Batch (Salva pedido e atualiza status de cupom/usuário)
            const batch = db.batch(); 
            const userId = currentUser.uid; 
            const usuarioRef = db.collection("Usuarios").doc(userId);  
            
            if (cupomInfo.isPersonalizado && couponApplied) { 
                const cupomUserRef = db.collection("CuponsUsuarios").doc(userId); 
                batch.update(cupomUserRef, { usado: true, dataUso: firebase.firestore.FieldValue.serverTimestamp(), pedidoId: 'PENDENTE' }); 
            }  
            
            const pedidoRef = db.collection("Pedidos").doc(); 
            batch.set(pedidoRef, pedido);  
            batch.set(usuarioRef, { email: currentUser.email, pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, { merge: true });  
            
            await batch.commit();  
            
            if (cupomInfo.isPersonalizado && couponApplied) await db.collection("CuponsUsuarios").doc(userId).update({ pedidoId: pedidoRef.id });  

            // Lógica de Recompensa/Nível
            const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
            const doc = await usuarioRef.get(); 
            const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 }; 
            const feitos = data.pedidosFeitos; 
            const nivelAtual = data.recompensaNivel;  
            
            const recompensaAtingida = RECOMPENSAS_DATA.find(r => r.limite === feitos && (r.limite / (RECOMPENSAS_DATA[0]?.limite || 1)) > nivelAtual);  

            if (recompensaAtingida) {  
                const primeiroLimite = RECOMPENSAS_DATA[0]?.limite || 1; 
                const novoNivel = recompensaAtingida.limite / primeiroLimite;  
                
                const itemLiberado = { cupom: recompensaAtingida.valor, tipo: recompensaAtingida.tipo, valor: recompensaAtingida.valor, liberadoEm: firebase.firestore.FieldValue.serverTimestamp(), usado: false, pedidoLiberacao: pedidoRef.id, titulo: recompensaAtingida.titulo || `Recompensa Nível ${novoNivel}` };  
                
                await usuarioRef.update({ recompensaNivel: novoNivel, ultimaRecompensa: recompensaAtingida.id });  
                if (recompensaAtingida.tipo === 'cupom') await db.collection("CuponsUsuarios").doc(userId).set(itemLiberado, { merge: true });  
                await db.collection("Usuarios").doc(userId).collection("RecompensasRecebidas").add(itemLiberado);  
                
                const nomeNivel = String(recompensaAtingida.titulo || recompensaAtingida.valor || '');  
                mostrarPopupRecompensa(`🎉 Parabéns! Você alcançou ${nomeNivel} ${getTierIcon(nomeNivel)} e ganhou: ${recompensaAtingida.valor}`);  
                configuracoesRecompensa = null; // Força recarregamento do cache
            }  

            // Notificação, som e WhatsApp
            popupAdd("Pedido salvo ✅"); 
            try { sound.currentTime = 0; sound.play(); } catch (_) {}  
            const linhas = ["🍔 *Pedido DFL*", cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), "", `Subtotal: *${money(subtotal)}*`, `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`, `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`, `*Total: ${money(total)}*`, "", `🏠 *Endereço:* ${addr}`].join("\n");  
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(linhas)}`, "_blank");  
            
            // Limpa e atualiza UI
            cart = []; 
            couponApplied = ""; 
            localStorage.removeItem("dflCoupon"); 
            document.getElementById("coupon-input").value = ""; 
            renderMiniCart(); 
            Overlays.closeAll();  
        } catch (err) { 
            console.error("Erro fechar pedido:", err); 
            alert(`Erro: ${err.message}`); 
        }  
    }  
    renderMiniCart();

    /* ------------------ 📜 MEUS PEDIDOS ------------------ */  
    // ... (Lógica de Pedidos e Recompensas continua a mesma) ...

    console.log("%c🔥 DFL v5.3 — NOVAS FUNÇÕES IMPLEMENTADAS", "background:#4CAF50;color:#fff;padding:5px;border-radius:5px;");  
    inicializarFirebase();  

}); // FIM DO DOMContentLoaded
