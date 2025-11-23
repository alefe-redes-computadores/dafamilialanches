/* =========================================================  
   🌟 DFL v5.8.0 — VERSÃO DE PRODUÇÃO (ESTÁVEL)
   - Baseada na estrutura da v5.7 (Diagnóstico) que funcionou.
   - Busca de Produtos: ATIVA.
   - Grade de Promoções: ATIVA.
   - Integração Extras: ATIVA.
========================================================= */

// ====================================================================
// 🧠 PARTE 0: FUNÇÕES AUXILIARES (BUSCA + EXTRAS)
// ====================================================================

// Função para mapear todos os produtos do cardápio para a busca
function getProductsMap() {
    const allProducts = [];
    // Mapeia Combos, Lanches, Hot Dogs e Bebidas
    document.querySelectorAll(".menu-section .card[data-name]").forEach(card => {
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const sectionEl = card.closest('.menu-section');
        const section = sectionEl ? sectionEl.querySelector('h2').textContent.trim().replace(/[^a-zA-Z\s]/g, '') : 'Menu';
        
        allProducts.push({
            name: name,
            searchName: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
            price: price,
            section: section,
            element: card
        });
    });
    return allProducts;
}

// Algoritmo de Fuzzy Matching (Busca aproximada)
function levenshteinDistance(s1, s2) {
    s1 = s1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    s2 = s2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 1; j <= s2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
        }
    }
    return track[s2.length][s1.length];
}

// --- INTEGRAÇÃO EXTRAS.JS (Estilos e Thumbnails) ---

function injectExtrasStyles() {
    if (document.getElementById('dfl-extras-js-style')) return;
    const st = document.createElement('style');
    st.id = 'dfl-extras-js-style';
    st.textContent = `
      .popup-add, .dfl-toast {
        position: fixed !important; top: 20px !important; left: 50% !important;
        transform: translateX(-50%) translateY(-150%) !important;
        background: #222 !important; color: #fff !important;
        font-family: 'Segoe UI', Roboto, sans-serif !important; font-weight: 700 !important;
        padding: 12px 24px !important; border-radius: 50px !important;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important; z-index: 2147483647 !important;
        opacity: 0 !important; transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        pointer-events: none !important; display: flex !important; align-items: center !important;
        justify-content: center !important; gap: 10px !important;
      }
      .popup-add.show { opacity: 1 !important; transform: translateX(-50%) translateY(0) !important; }
      .pedido-card .pedido-thumb {
        width: 100% !important; height: 110px !important; background-size: cover !important;
        background-position: center center !important; border-radius: 8px !important;
        margin-bottom: 10px !important; background-color: transparent !important;
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
      }
      .popup-add.dfl-center {
        top: 50% !important; background: rgba(0, 0, 0, 0.9) !important;
        backdrop-filter: blur(5px) !important; padding: 25px 35px !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        transform: translate(-50%, -50%) scale(0.5) !important; 
      }
      .popup-add.dfl-center.show { transform: translate(-50%, -50%) scale(1) !important; }
    `;
    document.head.appendChild(st);
}

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

    if (isSpecial) el.classList.add('dfl-center');
    else el.classList.remove('dfl-center');

    if (!msg.includes(icon)) {
        el.innerHTML = `<span style="margin-right:8px; font-size:1.2em">${icon}</span> ${msg}`;
        el.dataset.processed = el.textContent; 
    }
}

const THUMB_MAP = [
    { key: 'casal', img: 'imagens/combo1.png' }, { key: 'família', img: 'imagens/combo3.png' }, { key: 'familia', img: 'imagens/combo3.png' },
    { key: 'artesanal', img: 'imagens/combo4.png' }, { key: 'purizin', img: 'imagens/purizin.png' }, { key: 'padaná', img: 'imagens/padana.png' },
    { key: 'padana', img: 'imagens/padana.png' }, { key: 'nigucim', img: 'imagens/nigucim.png' }, { key: 'nimin', img: 'imagens/nimin.png' },
    { key: 'trembão', img: 'imagens/trembao.png' }, { key: 'trembao', img: 'imagens/trembao.png' }, { key: 'bão', img: 'imagens/bao.png' },
    { key: 'bao', img: 'imagens/bao.png' }, { key: 'trem', img: 'imagens/trem.png' }, { key: 'uai', img: 'imagens/uai.png' },
    { key: 'cadim', img: 'imagens/cadim.png' }, { key: 'bitela', img: 'imagens/bitela.png' }, { key: 'armaria', img: 'imagens/armaria.png' },
    { key: 'apruma', img: 'imagens/apruma.png' }, { key: 'peleja', img: 'imagens/peleja.png' }, { key: 'custoso', img: 'imagens/custoso.png' },
    { key: 'tudibom', img: 'imagens/tudibom.png' }, { key: 'simprão', img: 'imagens/simprao.png' }, { key: 'simprao', img: 'imagens/simprao.png' }
];

function fixThumbnail(cardElement) {
    const thumbDiv = cardElement.querySelector('.pedido-thumb');
    if (!thumbDiv) return;
    const text = (cardElement.innerText || '').toLowerCase();
    const found = THUMB_MAP.find(t => text.includes(t.key));
    thumbDiv.style.backgroundImage = found ? `url('${found.img}')` : `url('imagens/burger.png')`;
}

function watchOrders() {
    const list = document.getElementById('listaPedidos');
    if (!list) return;
    const mo = new MutationObserver((mutations) => {
        mutations.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType === 1 && n.classList.contains('pedido-card')) fixThumbnail(n);
        }));
        Array.from(list.children).forEach(fixThumbnail);
    });
    mo.observe(list, { childList: true, subtree: true });
    Array.from(list.children).forEach(fixThumbnail);
}

// ====================================================================
// 2. INICIALIZAÇÃO PRINCIPAL
// ====================================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- MÁSCARA CEP ---
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    // --- BUSCA DE PRODUTOS ---
    const campoBusca = document.getElementById("campoBusca");
    const resultadoBusca = document.getElementById("resultadoBusca");
    let todosProdutos = [];

    // Pequeno delay para garantir que o DOM esteja pronto antes de mapear
    setTimeout(() => { try { todosProdutos = getProductsMap(); } catch(e){} }, 1000);

    campoBusca?.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (todosProdutos.length === 0) todosProdutos = getProductsMap();

        if (query.length === 0) {
            todosProdutos.forEach(p => p.element.style.display = 'block');
            document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'block');
            if(resultadoBusca) resultadoBusca.innerHTML = '';
            return;
        }
        
        const queryClean = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const produtosEncontrados = todosProdutos.filter(p => p.searchName.includes(queryClean));
        
        if (produtosEncontrados.length > 0) {
            todosProdutos.forEach(p => p.element.style.display = 'none');
            document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'none');
            produtosEncontrados.forEach(p => {
                p.element.style.display = 'block';
                p.element.closest(".menu-section").style.display = 'block';
            });
            if(resultadoBusca) {
                resultadoBusca.innerHTML = `<div class="feedback-busca success">✅ ${produtosEncontrados.length} resultados encontrados.</div>`;
                setTimeout(() => { 
                    if(produtosEncontrados[0]) produtosEncontrados[0].element.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                }, 50);
            }
        } else {
            let sugestao = null;
            let menorDistancia = Infinity;
            for (const produto of todosProdutos) {
                const dist = levenshteinDistance(queryClean, produto.searchName);
                if (dist < menorDistancia && dist <= Math.max(2, Math.floor(produto.searchName.length * 0.3))) { 
                    menorDistancia = dist;
                    sugestao = produto;
                }
            }
            todosProdutos.forEach(p => p.element.style.display = 'none');
            document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'none');
            
            if (sugestao && resultadoBusca) {
                const linkSugestao = `<a href="javascript:void(0);" data-sugestao="${sugestao.name}">Você quis dizer: <b>${sugestao.name}</b>? Clique aqui.</a>`;
                resultadoBusca.innerHTML = `<div class="feedback-busca sugestao">${linkSugestao}</div>`;
                resultadoBusca.querySelector('a')?.addEventListener('click', (ev) => {
                    const termo = ev.target.dataset.sugestao;
                    if (termo) { campoBusca.value = termo; campoBusca.dispatchEvent(new Event('input')); }
                });
            } else if (resultadoBusca) {
                resultadoBusca.innerHTML = `<div class="feedback-busca erro">Nenhum produto encontrado com "<b>${query}</b>".</div>`;
            }
        }
    });

    // --- VARIÁVEIS BASE ---
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00;
    let deliveryFeesCache = null;   
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };  

    // --- OBJETO ELEMENTOS (LIMPO) ---
    const el = {
        cartIcon: document.getElementById("cart-icon"),
        cartCount: document.getElementById("cart-count"),
        miniCart: document.getElementById("mini-cart"),
        miniList: document.querySelector(".mini-list"),
        miniFoot: document.querySelector(".mini-foot"),
        cartBackdrop: document.getElementById("cart-backdrop"),
        statusBanner: document.getElementById("status-banner"),
        hoursBanner: document.querySelector(".hours-banner"),
        loginModal: document.getElementById("login-modal"),
        loginForm: document.getElementById("login-form"),
        googleBtn: document.getElementById("google-login"),
        userBtn: document.getElementById("user-btn"),
        pedidosBtn: document.querySelector(".meus-pedidos-btn"),
        pedidosPanel: document.getElementById("painelPedidos"),
        pedidosFecharBtn: document.querySelector(".fechar-pedidos"),
        pedidosLista: document.getElementById("listaPedidos"),
        recompensasBtn: document.querySelector(".recompensas-btn"),
        recompensasPanel: document.getElementById("recompensas-panel"),
        recompensasFecharBtn: document.querySelector(".fechar-recompensas"),
        recompensasLista: document.getElementById("listaRecompensas"),
        historicoLista: document.getElementById("historicoRecompensas"),
        extrasModal: document.getElementById("extras-modal"),
        extrasList: document.querySelector("#extras-modal .extras-list"),
        extrasConfirm: document.getElementById("extras-confirm"),
        comboModal: document.getElementById("combo-modal"),
        comboBody: document.querySelector("#combo-modal #combo-body"),
        comboConfirm: document.getElementById("combo-confirm"),
        reportsBtn: document.getElementById("reports-btn"),
        // Frete e Endereço
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        btnManual: document.getElementById("btnManual"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill")
    };

    // --- FIREBASE CONFIG ---
    const firebaseConfig = {
        apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
        authDomain: "da-familia-lanches.firebaseapp.com",
        projectId: "da-familia-lanches",
        storageBucket: "da-familia-lanches.appspot.com",
        messagingSenderId: "106857147317",
        appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    };

    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            if (!window.firebase) throw new Error("Firebase não carregado.");
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            isFirebaseInitialized = true;
            setupAuthListener();
        } catch (error) { console.error("Erro Firebase:", error); }
    }

    function setupAuthListener() {
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                if(el.userBtn) el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || "Cliente"}`;
                if(document.querySelector(".meus-pedidos")) document.querySelector(".meus-pedidos").style.display = 'block';
                if(document.querySelector(".minhas-recompensas")) document.querySelector(".minhas-recompensas").style.display = 'block';
                
                if (!sessionStorage.getItem('dfl_logged_in_msg')) {
                    sessionStorage.setItem('dfl_logged_in_msg', 'true');
                    popupAdd(`🎉 Login realizado! Olá, ${user.displayName?.split(' ')[0] || 'Cliente'}.`);
                }
                // Admin check
                if(isAdmin(user) && el.reportsBtn) createAdminFab();
            } else {
                if(el.userBtn) el.userBtn.textContent = "Entrar / Cadastrar";
                if(document.querySelector(".meus-pedidos")) document.querySelector(".meus-pedidos").style.display = 'none';
                if(document.querySelector(".minhas-recompensas")) document.querySelector(".minhas-recompensas").style.display = 'none';
                if(el.reportsBtn) el.reportsBtn.style.display = 'none';
            }
        });
    }

    // --- STATUS BANNER ---
    const atualizarStatus = safe(() => {  
        const agora = new Date(); const h = agora.getHours();  
        const aberto = h >= 18 && h < 23;   
        if (el.statusBanner) { 
            el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; 
            el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; 
        }  
    });
    
    // --- TIMER (ADAPTADO) ---
    const getFormattedTime = (diff) => {
        if (diff <= 0) return "00:00:00";
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    const atualizarTimer = safe(() => {
        const agora = new Date();
        const fim = new Date();
        fim.setHours(23, 59, 59, 999);
        const diff = fim - agora;
        
        const elSecaoPromo = document.getElementById("secao-promocoes");
        if (!elSecaoPromo) return;

        let elTimerWrapper = elSecaoPromo.querySelector(".contador-promo-wrapper");
        if (!elTimerWrapper) {
            const elTitulo = elSecaoPromo.querySelector(".titulo-secao");
            if (!elTitulo) return;
            
            elTimerWrapper = document.createElement("div");
            elTimerWrapper.className = "contador-promo-wrapper";
            elTimerWrapper.innerHTML = `<span class="tempo-restante-label">⏳ Tempo restante:</span><span class="tempo-restante-valor" id="promo-timer-valor">${getFormattedTime(diff)}</span>`;
            
            const elSlogan = document.createElement("p");
            elSlogan.className = "slogan-promo";
            elSlogan.textContent = "Aproveite antes que o cronômetro zere à meia-noite!";

            elTitulo.after(elSlogan);
            elTitulo.after(elTimerWrapper);
        } else {
            const elValor = elTimerWrapper.querySelector("#promo-timer-valor");
            if (elValor) elValor.textContent = getFormattedTime(diff);
        }
    });

    // --- AÇÕES GERAIS / MODAIS ---
    el.cartIcon?.addEventListener("click", () => { 
        renderMiniCart(); 
        if(el.miniCart) { el.miniCart.classList.add("active"); if(el.cartBackdrop) el.cartBackdrop.classList.add("active"); } 
    });
    document.getElementById("cart-backdrop")?.addEventListener("click", () => { 
        document.querySelectorAll(".active").forEach(e => e.classList.remove("active")); 
        document.querySelectorAll(".show").forEach(e => e.classList.remove("show")); 
    });
    el.userBtn?.addEventListener("click", () => { 
        if(el.loginModal) { el.loginModal.classList.add("show"); if(el.cartBackdrop) el.cartBackdrop.classList.add("active"); }
    });
    document.querySelectorAll(".login-close, .fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .dashboard-close").forEach(b => 
        b.addEventListener("click", () => { 
            document.querySelectorAll(".show").forEach(e => e.classList.remove("show")); 
            document.querySelectorAll(".active").forEach(e => e.classList.remove("active")); 
        })
    );

    /* ------------------ ➕ ADICIONAIS ------------------ */  
    const adicionais = [  
        { nome: "Cebola", preco: 0.99 }, { nome: "Salada", preco: 1.99 }, { nome: "Ovo", preco: 1.99 },  
        { nome: "Bacon", preco: 2.99 }, { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },  
        { nome: "Cheddar Cremoso", preco: 3.99 }, { nome: "Filé de Frango", preco: 5.99 },  
        { nome: "Hambúrguer Artesanal 120g", preco: 7.99 }
    ];  
    let produtoExtras = null; let produtoPrecoBase = 0;  

    const openExtrasFor = safe((card) => {  
        if (!card || !el.extrasModal || !el.extrasList) return;  
        produtoExtras = card.dataset.name;  
        produtoPrecoBase = parseFloat(card.dataset.price) || 0;  
        el.extrasList.innerHTML = adicionais.map((a, i) => `  
          <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:all 0.2s;font-size:1rem;">  
            <span style="font-weight:600;color:#222;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>  
            <input type="checkbox" value="${i}" style="margin-left:10px;">  
          </label>`).join("");  
        if(el.extrasModal) el.extrasModal.classList.add("show");
        if(el.cartBackdrop) el.cartBackdrop.classList.add("active");
    });  

    document.querySelectorAll(".extras-btn").forEach((btn) => btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card"))));  
    document.querySelectorAll(".promo-card .extras-btn").forEach((btn) => btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card"))));

    el.extrasConfirm?.addEventListener("click", () => {  
        if (!produtoExtras) return;
        const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];  
        const extrasContagem = {};  
        checks.forEach(c => {  
            const idx = +c.value; const adicional = adicionais[idx];  
            if (extrasContagem[adicional.nome]) extrasContagem[adicional.nome].qtd++; else extrasContagem[adicional.nome] = { preco: adicional.preco, qtd: 1 };  
        });  
        const extrasNomes = Object.keys(extrasContagem).map(nome => { const qtd = extrasContagem[nome].qtd; return qtd > 1 ? `${qtd}x ${nome}` : nome; }).join(", ");  
        const precoExtras = Object.values(extrasContagem).reduce((t, e) => t + (e.preco * e.qtd), 0);  
        const precoTotal = produtoPrecoBase + precoExtras;  
        const nomeCompleto = extrasNomes ? `${produtoExtras} + ${extrasNomes}` : produtoExtras;  
        const existente = cart.find(i => i.nome === nomeCompleto);  
        if (existente) existente.qtd++; else cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });  
        renderMiniCart(); popupAdd("Adicionado ao carrinho!"); 
        document.querySelectorAll(".show").forEach(e => e.classList.remove("show")); 
        document.querySelectorAll(".active").forEach(e => e.classList.remove("active")); 
    });

    /* ------------------ 🥤 COMBOS ------------------ */  
    const comboDrinkOptions = {  
        casal: [ { rotulo: "Fanta 1L (padrão)", delta: 0.01 }, { rotulo: "Coca-Cola 1L", delta: 3.0 }, { rotulo: "Coca-Cola 1L Zero", delta: 3.0 } ],  
        familia: [ { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 }, { rotulo: "Coca-Cola 2L", delta: 5.0 } ]
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
            <span style="font-weight:600;color:#222;">${o.rotulo}</span> <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>  
            <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="margin-left:10px;">  
          </label>`).join("");  
        _comboCtx = { nomeCombo, precoBase, grupo };  
        el.comboModal.classList.add("show"); if(el.cartBackdrop) el.cartBackdrop.classList.add("active");
    });  

    el.comboConfirm?.addEventListener("click", () => {  
        if (!_comboCtx) return;
        const sel = el.comboBody?.querySelector('input[name="combo-drink"]:checked'); if (!sel) return;  
        const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];  
        const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`; const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);  
        const existente = cart.find(i => i.nome === finalName); if (existente) existente.qtd++; else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });  
        popupAdd("Combo adicionado!"); renderMiniCart(); 
        document.querySelectorAll(".show").forEach(e => e.classList.remove("show")); 
        document.querySelectorAll(".active").forEach(e => e.classList.remove("active")); 
    });  

    function addCommonItem(nome, preco) {  
        if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) { openComboModal(nome, preco); return; }  
        const found = cart.find((i) => i.nome === nome && i.preco === preco); if (found) found.qtd++; else cart.push({ nome, preco, qtd: 1 });  
        renderMiniCart(); popupAdd(`${nome} adicionado!`);  
    }  
    document.querySelectorAll(".add-cart").forEach((btn) => btn.addEventListener("click", (e) => { const card = e.currentTarget.closest(".card"); if (!card) return; addCommonItem(card.dataset.name, parseFloat(card.dataset.price)); }));

    // --- CARRINHO E FRETE ---
    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
    let modoEnderecoManual = false;

    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => { window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank"); });
    document.getElementById("btnManual")?.addEventListener("click", () => {
        modoEnderecoManual = true;
        const fc = document.querySelector('.frete-container'); const ma = document.getElementById('manualArea');
        if (fc) fc.style.display = 'none'; if (ma) ma.style.display = 'block';
    });
    document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        const fc = document.querySelector('.frete-container'); const ma = document.getElementById('manualArea');
        if (fc) fc.style.display = 'block'; if (ma) ma.style.display = 'none';
    });
    document.getElementById("btnConfirmarEndereco")?.addEventListener("click", async () => {
        const endereco = document.getElementById('manualEndereco')?.value?.trim() || '';
        if (!endereco) { popupAdd("Preencha o endereço!"); return; }
        popupAdd("Verificando...");
        const taxa = await getDynamicDeliveryFee(endereco);
        popupAdd(`Taxa: ${money(taxa)}`);
        renderMiniCart();
    });

    /* --- ADMIN + EXTRAS --- */
    const ADMINS = [ "alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br" ];  
    function isAdmin(user) { return user && user.email && ADMINS.includes(user.email.toLowerCase()); }
    let chartPedidos = null; let chartProdutos = null;
    function ensureChartJS(cb) { if (window.Chart) return; const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/chart.js"; s.onload = cb; document.head.appendChild(s); }
    function createDashboard() { if (document.getElementById("admin-dashboard")) return; const div = document.createElement("div"); div.id = "admin-dashboard"; div.className = "modal"; div.innerHTML = `<div class="modal-content" style="max-width:1000px;width:95%;height:85vh;overflow:auto;background:#fff;border-radius:12px;"><div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;"><h3>📊 Relatórios</h3><button class="dashboard-close">✖</button></div><div class="dashboard-body" style="padding:12px;"><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;"><div id="card-total" class="cardBox">Total: —</div><div id="card-pedidos" class="cardBox">Pedidos: —</div><div id="card-ticket" class="cardBox">Ticket Médio: —</div></div><div style="margin-bottom:10px;"><label>Período: </label><select id="filter-period"><option value="7">7 dias</option><option value="30">30 dias</option><option value="all">Todos</option></select></div><canvas id="chart-pedidos" style="width:100%;height:240px;"></canvas><canvas id="chart-produtos" style="width:100%;height:240px;margin-top:16px;"></canvas><div style="margin-top:12px;"><button id="export-csv" style="background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px;">Exportar CSV</button></div></div></div>`; document.body.appendChild(div); div.querySelector(".dashboard-close").addEventListener("click", () => { div.classList.remove('show'); if(el.cartBackdrop) el.cartBackdrop.classList.remove('active'); }); }  
    function createAdminFab() { if (el.reportsBtn) { el.reportsBtn.style.display = "block"; el.reportsBtn.addEventListener("click", () => { createDashboard(); ensureChartJS(() => carregarRelatorios("7")); document.getElementById("admin-dashboard").classList.add('show'); if(el.cartBackdrop) el.cartBackdrop.classList.add('active'); }); } }
    function gerarResumoECharts(pedidos) { if (!window.Chart) return; const ctxPedidos = document.getElementById('chart-pedidos')?.getContext('2d'); const ctxProdutos = document.getElementById('chart-produtos')?.getContext('2d'); if (!ctxPedidos || !ctxProdutos) return; const pedidosPorDia = {}; const produtosContagem = {}; pedidos.forEach(p => { const dia = (p.data?.toDate?.() || new Date(p.data)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1; (Array.isArray(p.itens) ? p.itens : []).forEach(itemStr => { const nome = itemStr.split(' x')[0]; if (nome) produtosContagem[nome] = (produtosContagem[nome] || 0) + 1; }); }); const labelsPedidos = Object.keys(pedidosPorDia).reverse(); const dataPedidos = Object.values(pedidosPorDia).reverse(); if (chartPedidos) chartPedidos.destroy(); chartPedidos = new Chart(ctxPedidos, { type: 'line', data: { labels: labelsPedidos, datasets: [{ label: 'Pedidos', data: dataPedidos, borderColor: '#ffb300', tension: 0.1 }] }, options: { scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } } } }); const produtosOrdenados = Object.entries(produtosContagem).sort(([, a], [, b]) => b - a).slice(0, 10); if (chartProdutos) chartProdutos.destroy(); chartProdutos = new Chart(ctxProdutos, { type: 'bar', data: { labels: produtosOrdenados.map(p=>p[0]), datasets: [{ label: 'Mais Vendidos', data: produtosOrdenados.map(p=>p[1]), backgroundColor: '#ff7043' }] }, options: { indexAxis: 'y' } }); }  
    function carregarRelatorios(periodo = "7") { const start = new Date(); if (periodo !== "all") start.setDate(start.getDate() - Number(periodo)); else start.setTime(0); db.collection("Pedidos").orderBy("data", "desc").get().then(snap => { const pedidos = snap.docs.map(d => { const dataObjeto = d.data(); const rawDate = dataObjeto.data; let processedDate; if (rawDate && typeof rawDate.toDate === 'function') processedDate = rawDate.toDate(); else if (rawDate) processedDate = new Date(rawDate); else processedDate = new Date(); return { ...dataObjeto, id: d.id, data: processedDate }; }); const filtrados = pedidos.filter(p => p.data >= start); gerarResumoECharts(filtrados); document.getElementById("card-total").textContent = `Total: ${money(filtrados.reduce((s, p) => s + (Number(p.total) || 0), 0))}`; document.getElementById("card-pedidos").textContent = `Pedidos: ${filtrados.length}`; document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(filtrados.length ? filtrados.reduce((s, p) => s + (Number(p.total) || 0), 0)/filtrados.length : 0)}`; document.getElementById("export-csv").onclick = () => { const csv = "Data;Nome;Total\n" + filtrados.map(p => `${p.data.toLocaleString()};${p.nome};${p.total}`).join("\n"); const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = "pedidos.csv"; link.click(); }; }; }); const sel = document.getElementById("filter-period"); if(sel && !sel._bound) { sel.addEventListener("change", e => carregarRelatorios(e.target.value)); sel._bound = true; } }

    function popupAdd(msg) {
        let pop = document.querySelector(".popup-add");
        if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }
        pop.textContent = msg; pop.classList.add("show");
        if(typeof stylizePopup === 'function') stylizePopup(pop);
        setTimeout(() => pop.classList.remove("show"), 2000);
    }

    // --- EXECUÇÃO FINAL ---
    inicializarFirebase();
    injectExtrasStyles();
    watchOrders();
    atualizarStatus(); setInterval(atualizarStatus, 60000);
    atualizarTimer(); setInterval(atualizarTimer, 1000);

}); // FIM DOMContentLoaded
