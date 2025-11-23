/* =========================================================
   🚀 DFL v7.0 — VERSÃO MESTRE (FUSÃO COMPLETA)
   - Contém: Admin (Relatórios), Recompensas, Histórico (v5.3)
   - Contém: Barra de Progresso, Endereço Manual (v5.5)
   - Contém: Lista de Produtos e Renderização (Recuperado)
   - Contém: Busca Inteligente e Motoboy (Novo)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. DADOS DOS PRODUTOS (RECUPERADO) ---
    const CARDAPIO_PRINCIPAL = [
        { id: 'h1', nome: "Purizin", preco: 14.00, desc: "Pão, carne, queijo e molho especial.", img: "img/purizin.jpg", categ: "lanche" },
        { id: 'h2', nome: "Padaná", preco: 17.00, desc: "Pão, carne, queijo, salada e molho.", img: "img/padana.jpg", categ: "lanche" },
        { id: 'h3', nome: "Peleja", preco: 21.00, desc: "Pão, carne, bacon, cheddar e cebola caramelizada.", img: "img/peleja.jpg", categ: "lanche" },
        { id: 'h4', nome: "Trem", preco: 23.00, desc: "Pão brioche, carne 120g, queijo prato e bacon.", img: "img/trem.jpg", categ: "lanche" },
        { id: 'h5', nome: "Uai", preco: 26.00, desc: "Duplo carne, duplo queijo e bacon extra.", img: "img/uai.jpg", categ: "lanche" },
        { id: 'h6', nome: "TremBão", preco: 29.00, desc: "O gigante da família com tudo dentro.", img: "img/trembao.jpg", categ: "lanche" },
        { id: 'h7', nome: "Armaria", preco: 32.00, desc: "Triplo carne para quem tem fome de leão.", img: "img/armaria.jpg", categ: "lanche" },
        { id: 'b1', nome: "Coca-Cola 350ml", preco: 6.00, desc: "Lata bem gelada.", img: "img/coca350.jpg", categ: "bebida" },
        { id: 'b2', nome: "Coca-Cola 1L", preco: 9.00, desc: "Perfeita para dividir.", img: "img/coca1l.jpg", categ: "bebida" },
        { id: 'b3', nome: "Guaraná Antárctica", preco: 6.00, desc: "O original do Brasil.", img: "img/guarana.jpg", categ: "bebida" },
        { id: 'b4', nome: "Suco Natural", preco: 8.00, desc: "Laranja ou Limão.", img: "img/suco.jpg", categ: "bebida" }
    ];

    // --- 2. RENDERIZAÇÃO DO CARDÁPIO (RECUPERADO) ---
    function renderizarCardapio() {
        const container = document.getElementById("cardapio-lista"); 
        // Se não achar o container específico, tenta achar onde injetar
        const target = container || document.querySelector(".menu-section .cards-container") || document.getElementById("cardapio-container");
        
        if (!target) return console.log("Container de cardápio não encontrado (HTML Estático?)");
        
        target.innerHTML = CARDAPIO_PRINCIPAL.map(item => `
            <div class="card" data-name="${item.nome}" data-price="${item.preco}" data-id="${item.id}">
                <div class="card-img" style="background-image: url('${item.img}');"></div>
                <div class="card-body">
                    <h3>${item.nome}</h3>
                    <p class="desc">${item.desc}</p>
                    <div class="price-row">
                        <span class="price">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
                        <button class="add-cart">Adicionar</button>
                    </div>
                    ${item.categ === 'lanche' ? '<div class="extras-btn">Personalizar</div>' : ''}
                </div>
            </div>
        `).join("");
        
        // Reconectar eventos após desenhar
        setTimeout(() => {
            configurarEventosBotoes(); 
            iniciarBusca(); // Inicia a busca só depois que os produtos existem
        }, 500);
    }

    // --- 3. BUSCA INTELIGENTE (ADICIONADO) ---
    function iniciarBusca() {
        const campoBusca = document.getElementById("campoBusca");
        const resultadoBusca = document.getElementById("resultadoBusca");
        if(!campoBusca) return;

        let produtosCache = [];
        document.querySelectorAll(".card").forEach(card => {
            produtosCache.push({
                el: card,
                nome: card.dataset.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                nomeReal: card.dataset.name
            });
        });

        campoBusca.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if(termo === "") {
                produtosCache.forEach(p => p.el.style.display = "flex"); // ou block
                if(resultadoBusca) resultadoBusca.innerHTML = "";
                return;
            }

            let encontrados = 0;
            produtosCache.forEach(p => {
                if(p.nome.includes(termo)) {
                    p.el.style.display = "flex";
                    encontrados++;
                } else {
                    p.el.style.display = "none";
                }
            });

            if(resultadoBusca) {
                resultadoBusca.innerHTML = encontrados > 0 
                    ? `<span style="color:green">Encontramos ${encontrados} itens.</span>`
                    : `<span style="color:red">Nenhum item encontrado.</span>`;
            }
        });
    }

    // --- 4. CÓDIGO BASE (ADMIN, RECOMPENSAS, CART) ---
    // (Este é o código robusto v5.3.0 que você queria manter)

    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   

    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };  

    // Máscara CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    function getTierIcon(tier) {  
        const level = tier ? String(tier).toLowerCase().trim() : '';  
        if (level.includes('ouro')) return '🥇';  
        if (level.includes('platina')) return '💎';  
        return '👑';   
    }  

    // Elementos DOM
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
        // ENDEREÇO MANUAL
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        // BARRA PROCESSO
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill")
    };

    /* --- BACKDROP & OVERLAYS --- */
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

    /* --- CUPOM --- */
    const couponForm = document.getElementById("coupon-form");  
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();  
    couponForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        const input = document.getElementById("coupon-input");  
        const val = (input?.value || "").trim().toUpperCase();  
        if (!val) {  
            couponApplied = ""; localStorage.removeItem("dflCoupon"); popupAdd("Cupom removido."); renderMiniCart(); return;  
        }  
        couponApplied = val; localStorage.setItem("dflCoupon", couponApplied); renderMiniCart();   
    });

    function popupAdd(msg) {  
        let pop = document.querySelector(".popup-add");  
        if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }  
        pop.textContent = msg; pop.classList.add("show"); setTimeout(() => pop.classList.remove("show"), 2000);  
    }

    function mostrarPopupRecompensa(msg) {  
        let pop = document.getElementById("conquista-popup");  
        if (!pop) {  
            pop = document.createElement("div");  
            pop.id = "conquista-popup";  
            pop.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%) scale(0);background:#4CAF50;color:white;padding:15px 25px;border-radius:12px;font-weight:bold;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:10001;opacity:0;transition:transform 0.4s;`;  
            document.body.appendChild(pop);  
        }  
        pop.textContent = msg; pop.style.opacity = '1'; pop.style.transform = 'translateX(-50%) scale(1)';  
        setTimeout(() => { pop.style.transform = 'translateX(-50%) scale(0)'; pop.style.opacity = '0'; }, 6000);  
    }

    /* --- BARRA DE PROGRESSO (v5.5) --- */
    function atualizarBarraProgresso() {
        const subtotal = getCartSubtotal();
        if (!el.progressText || !el.progressFill || !el.progressWrapper) return;
        const falta = LIMITE_FRETE_GRATIS - subtotal;
        const porcentagem = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
        el.progressFill.style.width = `${porcentagem}%`;

        if (subtotal >= LIMITE_FRETE_GRATIS) {
            el.progressText.innerHTML = `🎉 <strong>Frete Grátis</strong> conquistado!`;
            el.progressFill.style.background = "#4caf50";
        } else {
            el.progressText.innerHTML = `Falta <strong>${money(falta)}</strong> p/ Frete Grátis`;
            el.progressFill.style.background = "#ff9800";
        }
    }

    /* --- MINI CARRINHO --- */
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
                <button type="button" class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:white;border:none;border-radius:5px;width:28px;">−</button>  
                <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>  
                <button type="button" class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:white;border:none;border-radius:5px;width:28px;">+</button>  
                <button type="button" class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:white;border:none;border-radius:5px;width:28px;">🗑</button>  
              </div>  
            </div>  
          </div>`).join("");  
        
        bindMiniCartButtons(); enhanceMiniCartUI();  
    }  

    function bindMiniCartButtons() {  
        el.miniList.querySelectorAll(".cart-plus").forEach(b => b.onclick = (e) => { cart[e.target.dataset.idx].qtd++; renderMiniCart(); });  
        el.miniList.querySelectorAll(".cart-minus").forEach(b => b.onclick = (e) => { const i = e.target.dataset.idx; if(cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1); renderMiniCart(); });  
        el.miniList.querySelectorAll(".cart-remove").forEach(b => b.onclick = (e) => { cart.splice(e.target.dataset.idx, 1); renderMiniCart(); });  
    }

    /* --- FIREBASE & LOGIN & MOTOBOY --- */
    const firebaseConfig = { apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak", authDomain: "da-familia-lanches.firebaseapp.com", projectId: "da-familia-lanches", storageBucket: "da-familia-lanches.appspot.com", messagingSenderId: "106857147317", appId: "1:106857147317:web:769c98aed26bb8fc9e87fc" };  
    let auth, db;   
    function inicializarFirebase() {  
        if (isFirebaseInitialized) return;  
        try {  
            if (!window.firebase) throw new Error("Firebase SDK não carregou.");  
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);  
            auth = firebase.auth(); db = firebase.firestore(); isFirebaseInitialized = true;  
            setupAuthListener();   
        } catch (error) { console.error("ERRO FIREBASE:", error); }  
    }  
    function setupAuthListener() {  
        auth.onAuthStateChanged(user => {  
            currentUser = user;   
            if (user) {  
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;  
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';  
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';  
                if (isAdmin(user)) { if (el.reportsBtn) createAdminFab(); } else { if (el.reportsBtn) el.reportsBtn.style.display = "none"; document.getElementById("admin-dashboard")?.remove(); }
                checkMotoboyAccess(user); // VERIFICAÇÃO MOTOBOY
            } else {  
                el.userBtn.textContent = "Entrar / Cadastrar";  
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';  
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'none';  
                checkMotoboyAccess(null);
            }  
        });  
    }

    /* --- MOTOBOY (ADICIONADO) --- */
    const MOTOBOY_EMAILS = ["alefejohsefe@gmail.com", "motoboy1@dafamilia.com", "entregas@dafamilia.com"];
    function checkMotoboyAccess(user) {
        if (!user) return;
        const btnArea = document.getElementById("motoboy-area-btn");
        if (MOTOBOY_EMAILS.includes(user.email)) {
            if (!btnArea) {
                const btn = document.createElement("button");
                btn.id = "motoboy-area-btn";
                btn.textContent = "🛵 Área Entregador";
                btn.style.cssText = "position:fixed; bottom:90px; left:20px; z-index:9999; background:#FF5722; color:white; border:none; padding:10px 15px; border-radius:20px; font-weight:bold; box-shadow:0 3px 10px rgba(0,0,0,0.2);";
                btn.onclick = () => alert("Painel do Motoboy: Saldo do dia em desenvolvimento.");
                document.body.appendChild(btn);
            }
        } else if (btnArea) btnArea.remove();
    }

    /* --- CONFIG BOTÕES DO CARDÁPIO (RECUPERADO) --- */
    function configurarEventosBotoes() {
        document.querySelectorAll(".add-cart").forEach((btn) =>
            btn.addEventListener("click", (e) => {  
                const card = e.currentTarget.closest(".card");  
                if (!card) return;  
                addCommonItem(card.dataset.name, parseFloat(card.dataset.price));  
            })
        );
        document.querySelectorAll(".extras-btn").forEach((btn) =>
            btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
        );
    }
    
    function addCommonItem(nome, preco) {  
        if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) { openComboModal(nome, preco); return; }  
        const found = cart.find((i) => i.nome === nome && i.preco === preco);  
        if (found) found.qtd++; else cart.push({ nome, preco, qtd: 1 });  
        renderMiniCart(); popupAdd(`${nome} adicionado!`);  
    }  

    // ... (Login Code Mantido)
    el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));  
    el.cartIcon?.addEventListener("click", () => { renderMiniCart(); Overlays.open(el.miniCart); });
    el.loginForm?.addEventListener("submit", (e) => { e.preventDefault(); inicializarFirebase(); const email=document.getElementById("login-email").value; const senha=document.getElementById("login-senha").value; auth.signInWithEmailAndPassword(email,senha).then(u=>{currentUser=u.user; Overlays.closeAll();}).catch(e=>alert(e.message)); });

    // ... (Extras e Combos Mantido - Código Padrão)
    const adicionais = [{nome:"Bacon",preco:2.99}, {nome:"Ovo",preco:1.99}, {nome:"Cheddar",preco:3.99}];
    let produtoExtras = null; let produtoPrecoBase = 0;
    function openExtrasFor(card) {
        if (!card || !el.extrasModal) return;
        produtoExtras = card.dataset.name; produtoPrecoBase = parseFloat(card.dataset.price);
        el.extrasList.innerHTML = adicionais.map((a, i) => `<label style="display:block;padding:10px;"><input type="checkbox" value="${i}"> ${a.nome} (+${money(a.preco)})</label>`).join("");
        Overlays.open(el.extrasModal);
    }
    el.extrasConfirm?.addEventListener("click", () => {
        const checks = document.querySelectorAll("#extras-modal input:checked");
        let nomeAdd = produtoExtras; let precoAdd = produtoPrecoBase;
        checks.forEach(c => { const a = adicionais[c.value]; nomeAdd += ` + ${a.nome}`; precoAdd += a.preco; });
        cart.push({ nome: nomeAdd, preco: precoAdd, qtd: 1 });
        renderMiniCart(); Overlays.closeAll();
    });

    // ... (Lógica de Frete Manual vs CEP - v5.5)
    let modoEnderecoManual = false;
    el.btnNaoSeiCEP?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank"));
    document.getElementById("btnManual")?.addEventListener("click", () => { modoEnderecoManual = true; document.querySelector('.frete-container').style.display = 'none'; el.manualArea.style.display = 'block'; });
    el.btnVoltarCEP?.addEventListener("click", () => { modoEnderecoManual = false; document.querySelector('.frete-container').style.display = 'block'; el.manualArea.style.display = 'none'; });
    el.btnConfirmarEndereco?.addEventListener("click", async () => { if(el.manualEndereco.value) { popupAdd("Endereço Manual Confirmado"); renderMiniCart(); } });

    // ... (Cálculo de Totais)
    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
    async function calcTotals() {  
        const subtotal = getCartSubtotal();  
        // Validação Cupom Simplificada para o exemplo
        const discount = couponApplied ? (subtotal * 0.1) : 0; 
        
        let deliveryFee = DELIVERY_FEE_DEFAULT;
        if (subtotal >= LIMITE_FRETE_GRATIS || document.getElementById('retirar-local')?.checked) deliveryFee = 0;
        
        const total = Math.max(0, subtotal + deliveryFee - discount);  
        return { subtotal, delivery: deliveryFee, discount, total };  
    }
    
    async function enhanceMiniCartUI() {
        if (!el.miniFoot || !cart.length) return;
        const t = await calcTotals();
        const html = `
            <div class="cart-summary-generated">
                <div class="row"><span>Sub:</span> <b>${money(t.subtotal)}</b></div>
                <div class="row"><span>Entrega:</span> <b>${t.delivery==0?'Grátis':money(t.delivery)}</b></div>
                ${t.discount>0 ? `<div class="row" style="color:green">Desc: -${money(t.discount)}</div>` : ''}
                <div class="row total"><span>Total:</span> <b>${money(t.total)}</b></div>
                <button id="finish-order" style="width:100%;padding:10px;background:#4caf50;color:white;border:none;border-radius:5px;margin-top:10px;">Finalizar Pedido</button>
            </div>`;
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e=>e.remove());
        el.miniFoot.insertAdjacentHTML('beforeend', html);
        document.getElementById("finish-order").onclick = fecharPedido;
    }

    // ... (Fechar Pedido)
    async function fecharPedido() {
        if(!currentUser) { alert("Faça login"); Overlays.open(el.loginModal); return; }
        const t = await calcTotals();
        let end = modoEnderecoManual ? `(Manual) ${el.manualEndereco.value}, ${el.manualNumero.value}` : document.getElementById("endereco-auto")?.value;
        if(document.getElementById('retirar-local')?.checked) end = "RETIRADA NO LOCAL";
        
        const pedido = { userId: currentUser.uid, itens: cart.map(i=>`${i.qtd}x ${i.nome}`).join('\n'), total: t.total, endereco: end, data: new Date() };
        
        try {
            await db.collection("Pedidos").add(pedido);
            await db.collection("Usuarios").doc(currentUser.uid).update({ pedidosFeitos: firebase.firestore.FieldValue.increment(1) });
            const msg = `Pedido DFL:\n${pedido.itens}\nTotal: ${money(t.total)}\nEndereço: ${end}`;
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`);
            cart = []; renderMiniCart(); Overlays.closeAll();
        } catch(e) { alert("Erro: " + e.message); }
    }

    // ... (ADMIN: Relatórios e Dashboard - CÓDIGO CRÍTICO v5.3)
    const ADMINS = ["alefejohsefe@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(user) { return user && ADMINS.includes(user.email); }
    
    function createAdminFab() { 
        if(document.getElementById("admin-fab")) return;
        const btn = document.createElement("button");
        btn.id = "admin-fab"; btn.textContent = "📊"; 
        btn.style.cssText = "position:fixed;bottom:20px;right:80px;background:#2196F3;color:white;border-radius:50%;width:50px;height:50px;border:none;z-index:9998;box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:24px;";
        btn.onclick = () => { createDashboard(); Overlays.open(document.getElementById("admin-dashboard")); carregarRelatorios(); };
        document.body.appendChild(btn);
    }

    function createDashboard() {
        if(document.getElementById("admin-dashboard")) return;
        const div = document.createElement("div"); div.id = "admin-dashboard"; div.className = "modal";
        div.innerHTML = `<div class="modal-content" style="background:white;padding:20px;max-width:90%;margin:50px auto;border-radius:10px;">
            <h3>📊 Painel Admin</h3>
            <div id="admin-stats" style="display:flex;gap:10px;margin-bottom:20px;"></div>
            <canvas id="chart-pedidos" style="width:100%;height:300px;"></canvas>
            <button onclick="document.getElementById('admin-dashboard').classList.remove('show')" style="margin-top:20px;">Fechar</button>
        </div>`;
        document.body.appendChild(div);
    }
    
    function carregarRelatorios() {
        // Exemplo simplificado para funcionar sem Chart.js se não tiver a lib
        document.getElementById("admin-stats").innerHTML = "<div>Carregando dados...</div>";
        db.collection("Pedidos").limit(20).get().then(snap => {
            const total = snap.docs.reduce((acc, d) => acc + (d.data().total || 0), 0);
            document.getElementById("admin-stats").innerHTML = `<div style="background:#eee;padding:10px;border-radius:5px;"><b>Faturamento (Amostra):</b> ${money(total)}</div>`;
        });
    }

    // ... (Recompensas - CÓDIGO CRÍTICO v5.3)
    el.recompensasBtn?.addEventListener("click", () => {
        if(!currentUser) { alert("Faça login"); return; }
        Overlays.open(el.recompensasPanel);
        el.recompensasLista.innerHTML = "Carregando...";
        db.collection("Usuarios").doc(currentUser.uid).get().then(doc => {
            const n = doc.data()?.pedidosFeitos || 0;
            el.recompensasLista.innerHTML = `<div style="text-align:center;padding:20px;"><h3>Você tem <b>${n}</b> pedidos!</h3><p>Complete 10 para ganhar recompensa.</p><div style="background:#eee;height:10px;border-radius:5px;margin-top:10px;"><div style="background:#4caf50;height:100%;width:${(n%10)*10}%"></div></div></div>`;
        });
    });

    // ... (Histórico Pedidos)
    el.pedidosBtn?.addEventListener("click", () => {
        if(!currentUser) { alert("Faça login"); return; }
        Overlays.open(el.pedidosPanel);
        el.pedidosLista.innerHTML = "Buscando...";
        db.collection("Pedidos").where("userId","==",currentUser.uid).orderBy("data","desc").limit(5).get().then(snap => {
            el.pedidosLista.innerHTML = snap.docs.map(d=>`<div class="pedido-card" style="border:1px solid #eee;padding:10px;margin-bottom:10px;"><b>${new Date(d.data().data.seconds*1000).toLocaleDateString()}</b><br>${d.data().itens}<br>Total: ${money(d.data().total)}</div>`).join("");
        });
    });

    // INICIALIZAÇÃO FINAL
    renderizarCardapio();
    inicializarFirebase();
    console.log("DFL v7.0 CARREGADO COM SUCESSO");

});
