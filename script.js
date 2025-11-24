/* =========================================================
   🚀 DFL v10.0 FINAL — BASE v5.6 + UPGRADES v6.0
   - Dados atualizados conforme prints
   - Busca Inteligente e Grade de Promoções
   - Firebase, Login, Carrinho, Frete e Admin MANTIDOS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    // MÁSCARA AUTOMÁTICA DO CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    /* ------------------ ⚙️ VARIÁVEIS E DADOS ------------------ */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   

    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };  
    const getEl = (id) => document.getElementById(id);

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
        if (level.includes('brinde')) return '🎁';
        if (level.includes('coca')) return '🥤';  
        return '👤';   
    }  

    /* --- DADOS ATUALIZADOS (CONFORME SEUS PRINTS) --- */
    const PROMO_DATA = [
        null,
        { 
            id: 1, nome: "Promo 1 — 2 Purizin + 1 Fanta 1L", 
            desc: "2 Hot Dogs 'Purizin' com purê cremoso + 1 Fanta 1L geladinha!", 
            ingredientes: "Pão, molho, purê de batata cremoso, 1 salsicha, milho, batata palha, ketchup e maionese.",
            preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" 
        },
        { 
            id: 2, nome: "Promo 2 — 3 Hot Dog Padaná", 
            desc: "3 Padaná completos, perfeitos pra dividir com a galera!", 
            ingredientes: "Pão, molho, 2 salsichas, milho, batata palha, bacon, vinagrete, mussarela, ketchup e maionese.",
            preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" 
        },
        { 
            id: 3, nome: "Promo 3 — 2 Burgers Peleja", 
            desc: "Bora artesanar o bolso! Dois Burgers artesanais 'Peleja' no precinho!", 
            ingredientes: "Pão, hambúrguer artesanal, filé de frango, bacon, milho, batata palha, presunto, mussarela, alface e tomate.",
            preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" 
        },
        { 
            id: 4, nome: "Promo 4 — 3 Trem + 1 Fanta 1L", 
            desc: "3 Burgers Trem com bacon, queijo e batata palha + 1 Fanta 1L.", 
            ingredientes: "Pão, hambúrguer, salsicha, bacon, milho, alface, tomate, presunto e mussarela.",
            preco: 44.99, precoAntigo: 51.00, img: "promocoes/promo4.jpg" 
        },
        { 
            id: 5, nome: "Promo 5 — 4 Trem + 1 Fanta 1L", 
            desc: "O clássico da família! 4 Burgers Trem + Fanta 1L.", 
            ingredientes: "Pão, hambúrguer, salsicha, bacon, milho, alface, tomate, presunto e mussarela.",
            preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" 
        },
        { 
            id: 6, nome: "Promo 6 — 5 Burgers Uai", 
            desc: "Pra família toda! 5 Burgers UAI recheados no precinho.", 
            ingredientes: "Pão, hambúrguer, milho, bacon, alface, tomate, presunto e mussarela.",
            preco: 54.00, precoAntigo: 65.00, img: "promocoes/promo6.jpg" 
        },
        { 
            id: 7, nome: "Promo 7 — 4 TremBão + 1 Fanta 1L", 
            desc: "O maior hot dog da casa! 4 TremBão com purê cremoso + Fanta 1L.", 
            ingredientes: "Pão, molho, purê cremoso, 2 salsichas, bacon crocante, mussarela, batata palha, vinagrete, ketchup e maionese.",
            preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" 
        },
        { 
            id: 8, nome: "Promo 8 — 4 Armaria", 
            desc: "A queridinha da galera! 4 Armaria no super desconto.", 
            ingredientes: "Pão, hambúrguer, filé de frango, bacon, milho, batata palha, alface, tomate, salsicha, presunto e mussarela.",
            preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" 
        },
        { 
            id: 9, nome: "Promo 9 — 5 Uai + 1 Kuat 2L (Brinde)", 
            desc: "Compre 5 Burgers Uai e leve 1 Kuat 2L por nossa conta! 🍹", 
            ingredientes: "Pão, hambúrguer, milho, bacon, alface, tomate, presunto e mussarela.",
            preco: 64.99, precoAntigo: 75.00, img: "promocoes/promo9.jpg" 
        }
    ];

    /* ------------------ 🎯 ELEMENTOS (MANTIDO DA v5.6) ------------------ */  
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
        
        // NOVOS ELEMENTOS (v6.0)
        promocoesGrid: document.getElementById("promocoes-area"),
        searchInput: document.getElementById("search-input"),
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

    /* ------------------ 🌫️ BACKDROP & OVERLAYS (MANTIDO) ------------------ */  
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

    /* ------------------ 🖼️ GRADE DE PROMOÇÕES (NOVO v6.0) ------------------ */
    function renderPromocoesGrid() {
        if (!el.promocoesGrid) return;
        
        el.promocoesGrid.innerHTML = PROMO_DATA.map(p => {
            if(!p) return ''; 
            
            return `
            <div class="card promo-card-styled" data-name="${p.nome}" data-price="${p.preco}">
                <img src="${p.img}" alt="${p.nome}" onerror="this.src='logo.png'">
                <div class="card-content promo-body">
                    <h3 class="promo-title">${p.nome}</h3>
                    <div class="promo-ingredientes" style="font-size:0.75rem; color:#666; margin-bottom:5px; line-height:1.3;">
                        ${p.desc}
                    </div>
                    <div class="promo-prices">
                        <span class="promo-old">De ${money(p.precoAntigo)}</span>
                        <span class="promo-new">Por ${money(p.preco)}</span>
                    </div>
                    <button class="add-cart btn-add-green">ADICIONAR</button>
                </div>
            </div>`;
        }).join('');
    }
    renderPromocoesGrid();

    /* ------------------ 🔍 BUSCA INTELIGENTE (NOVO v6.0) ------------------ */
    const levenshtein = (a, b) => {
        if(!a.length) return b.length; if(!b.length) return a.length;
        const m = []; for(let i=0;i<=b.length;i++) m[i]=[i]; for(let j=0;j<=a.length;j++) m[0][j]=j;
        for(let i=1;i<=b.length;i++) for(let j=1;j<=a.length;j++) m[i][j] = b.charAt(i-1)==a.charAt(j-1)?m[i-1][j-1]:Math.min(m[i-1][j-1]+1,Math.min(m[i][j-1]+1,m[i-1][j]+1));
        return m[b.length][a.length];
    };

    if (el.searchInput) {
        el.searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".card, .promo-card-styled");
            
            cards.forEach(card => {
                let nome = card.getAttribute("data-name") || "";
                if (!nome) nome = card.querySelector("h3")?.innerText || "";
                nome = nome.toLowerCase();

                if (!term) {
                    card.style.display = "flex";
                } else {
                    const match = nome.includes(term) || (term.length > 3 && levenshtein(nome, term) <= 2);
                    card.style.display = match ? "flex" : "none";
                }
            });
        });
    }

    /* ------------------ 🔥 FIREBASE SETUP (MANTIDO) ------------------ */  
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
            // Ativa persistência para não deslogar
            db.enablePersistence().catch(()=>{});
            setupAuthListener();   
        } catch (error) {  
            console.error("ERRO FATAL AO INICIAR FIREBASE:", error);  
        }  
    }  

    function setupAuthListener() {  
        auth.onAuthStateChanged(user => {  
            currentUser = user;   
            if (user) {  
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;  
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';  
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';  
            } else {  
                el.userBtn.textContent = "Entrar / Cadastrar";  
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';  
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'none';  
            }  
            if (user && isAdmin(user)) {  
                if (el.reportsBtn) createAdminFab();  
            } else {  
                if (el.reportsBtn) el.reportsBtn.style.display = "none";  
                document.getElementById("admin-dashboard")?.remove();  
            }  
        });  
    }
    /* --- 🎟️ CUPOM FORM --- */  
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

    /* --- 💬 POPUP --- */  
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

    /* --- 🛒 LÓGICA DO CARRINHO E CLIQUES --- */
    // Listener global para funcionar nos cards dinâmicos
    document.body.addEventListener('click', function(e) {
        // Adicionar Item
        if (e.target.matches('.add-cart, .btn-add-green')) {
            const card = e.target.closest('.card, .promo-card-styled');
            if (card) {
                const nome = card.getAttribute('data-name');
                const preco = parseFloat(card.getAttribute('data-price'));
                addCommonItem(nome, preco);
            }
        }
        // Botões de Fechar
        if (e.target.matches('.extras-close, .combo-close, .login-close, .fechar-pedidos, .fechar-recompensas')) {
            Overlays.closeAll();
        }
    });

    el.cartIcon?.addEventListener("click", () => { inicializarFirebase(); renderMiniCart(); Overlays.open(el.miniCart); });

    function addCommonItem(nome, preco) {  
        const low = (nome||"").toLowerCase();
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(low)) { 
             openComboModal(nome, preco); 
             return; 
        }  
        const found = cart.find((i) => i.nome === nome && i.preco === preco);  
        if (found) found.qtd++;  
        else cart.push({ nome, preco, qtd: 1 });  
        renderMiniCart();  
        popupAdd(`${nome} adicionado!`);  
    }

    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  

        // BARRA DE PROGRESSO
        const subtotal = cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
        if (el.progressFill) {
            const pct = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
            el.progressFill.style.width = `${pct}%`;
            el.progressText.innerHTML = subtotal >= LIMITE_FRETE_GRATIS ? 
                "🎉 <strong>Oba!</strong> Frete Grátis garantido!" : 
                `Faltam <strong>${money(LIMITE_FRETE_GRATIS - subtotal)}</strong> para Frete Grátis 🚀`;
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
              </div>  
            </div>  
          </div>  
        `).join("");
        
        enhanceMiniCartUI();
    }  

    window.updateQtd = (i, d) => {
        if(cart[i]) {
            cart[i].qtd += d;
            if(cart[i].qtd <= 0) cart.splice(i, 1);
            renderMiniCart();
        }
    };

    /* --- LOGIN --- */  
    el.loginForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        inicializarFirebase();
        const email = document.getElementById("login-email")?.value?.trim();  
        const senha = document.getElementById("login-senha")?.value?.trim();  
        auth.signInWithEmailAndPassword(email, senha)
            .then((cred) => { currentUser = cred.user; popupAdd("Logado!"); Overlays.closeAll(); })
            .catch((err) => alert("Erro: " + err.message));  
    });  

    el.googleBtn?.addEventListener("click", () => {  
        inicializarFirebase();
        const provider = new firebase.auth.GoogleAuthProvider();  
        auth.signInWithPopup(provider)
            .then((res) => { currentUser = res.user; popupAdd("Logado!"); Overlays.closeAll(); })
            .catch((err) => alert("Erro: ".concat(err.message)));  
    });  
    el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));  

    /* --- EXTRAS E COMBOS (MANTIDO) --- */  
    const adicionais = [  
        { nome: "Cebola", preco: 0.99 }, { nome: "Salada", preco: 1.99 }, { nome: "Ovo", preco: 1.99 }, { nome: "Bacon", preco: 2.99 },  
        { nome: "Hambúrguer Tradicional", preco: 2.99 }, { nome: "Cheddar Cremoso", preco: 3.99 }, { nome: "Filé de Frango", preco: 5.99 }, { nome: "Burger Artesanal", preco: 7.99 }  
    ];  
    let produtoExtras = null; let produtoPrecoBase = 0;  

    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const card = e.currentTarget.closest(".card");
            produtoExtras = card.dataset.name;
            produtoPrecoBase = parseFloat(card.dataset.price) || 0;
            el.extrasList.innerHTML = adicionais.map((a, i) => `  
              <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px;">  
                <span>${a.nome} — <b>${money(a.preco)}</b></span>  
                <input type="checkbox" value="${i}">  
              </label>`).join("");
            Overlays.open(el.extrasModal);
        })
    );  

    el.extrasConfirm?.addEventListener("click", () => {  
        if (!produtoExtras) return Overlays.closeAll();  
        const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];  
        let precoTotal = produtoPrecoBase;
        let nomes = [];
        checks.forEach(c => {  
            const ad = adicionais[+c.value];  
            precoTotal += ad.preco;
            nomes.push(ad.nome);
        });  
        const nomeFinal = nomes.length ? `${produtoExtras} + ${nomes.join(", ")}` : produtoExtras;
        
        const found = cart.find(i => i.nome === nomeFinal);
        if(found) found.qtd++;
        else cart.push({ nome: nomeFinal, preco: precoTotal, qtd: 1 });
        
        renderMiniCart(); popupAdd("Adicionado!"); Overlays.closeAll();  
    });  

    // COMBOS
    const comboDrinkOptions = {
    casal: [ 
        { rotulo: "Fanta 1L", delta: 0.01 },
        { rotulo: "Coca 1L", delta: 3.0 },
        { rotulo: "Coca-Cola 1L Zero", delta: 3.0 } 
    ],
    familia: [ 
        { rotulo: "Kuat 2L", delta: 0.01 }, 
        { rotulo: "Coca 2L", delta: 5.0 } 
    ]
};

    let _comboCtx = null;  
    
    function openComboModal(nome, preco) {
        const low = nome.toLowerCase();
        const grupo = low.includes("casal") ? "casal" : "familia";
        if(!comboDrinkOptions[grupo]) return addCommonItem(nome, preco); // Fallback
        
        el.comboBody.innerHTML = comboDrinkOptions[grupo].map((o, i) => `  
          <label class="combo-option-line" style="display:flex;justify-content:space-between;padding:10px;border:1px solid #ddd;margin-bottom:8px;">  
            <span>${o.rotulo}</span><span>+ ${money(o.delta)}</span>  
            <input type="radio" name="combo-drink" value="${i}" ${i===0?'checked':''}>  
          </label>`).join("");
        _comboCtx = { nome, preco, grupo };
        Overlays.open(el.comboModal);
    }

    el.comboConfirm?.addEventListener("click", () => {
        const sel = document.querySelector('input[name="combo-drink"]:checked');
        if(!sel) return;
        const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
        const finalName = `${_comboCtx.nome} + ${opt.rotulo}`;
        const finalPrice = Number(_comboCtx.preco) + opt.delta;
        
        const found = cart.find(i => i.nome === finalName);
        if(found) found.qtd++;
        else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
        
        renderMiniCart(); popupAdd("Combo Adicionado!"); Overlays.closeAll();
    });

    /* --- 🏠 FRETE MANUAL E DINÂMICO (MANTIDO) --- */
    let modoEnderecoManual = false;
    getEl("btnNaoSeiCEP")?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank"));
    getEl("btnManual")?.addEventListener("click", () => {
        modoEnderecoManual = true;
        getEl("manualArea").style.display = 'block';
        document.querySelector('.frete-container').style.display = 'none';
    });
    getEl("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        getEl("manualArea").style.display = 'none';
        document.querySelector('.frete-container').style.display = 'block';
    });

    getEl("btnConfirmarEndereco")?.addEventListener("click", async () => {
        const end = getEl("manualEndereco").value;
        if(!end) return popupAdd("Preencha o endereço!");
        popupAdd("Verificando...");
        const taxa = await getDynamicDeliveryFee(end);
        popupAdd(`Taxa: ${money(taxa)}`);
        renderMiniCart();
    });

    async function getDynamicDeliveryFee(endereco) {
        if (getEl('retirar-local')?.checked) return 0;
        // Lógica simples de bairro (pode ser expandida com Firebase)
        let bairro = endereco.split("-")[1] || endereco;
        bairro = bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        
        try {
            if(!deliveryFeesCache && db) {
                const snap = await db.collection("TaxasDeEntrega").doc("bairros").collection("lista").doc("tabela").get();
                if(snap.exists) deliveryFeesCache = snap.data().data;
            }
            if(deliveryFeesCache) {
                const found = deliveryFeesCache.find(b => bairro.includes(b.nome.toLowerCase()));
                if(found) return Number(found.taxa);
            }
        } catch(e) {}
        return DELIVERY_FEE_DEFAULT;
    }

    document.getElementById('btn-calcular-frete')?.addEventListener('click', async () => {
        const cep = document.getElementById('cep-input').value.replace(/\D/g, '');
        if(cep.length !== 8) return popupAdd("CEP inválido");
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if(data.erro) return popupAdd("CEP não encontrado");
            getEl("endereco-auto").value = `${data.logradouro} - ${data.bairro}`;
            renderMiniCart();
        } catch(e) { popupAdd("Erro ao buscar CEP"); }
    });
    /* --- 💰 CÁLCULO E FINALIZAÇÃO --- */
    const _cupomCache = {};
    async function validarCupomFirestore(codigo, subtotal) {
        if(!isFirebaseInitialized) return {valido:false, discount:0};
        const code = codigo.toUpperCase();
        if(!code) return {valido:false, discount:0};
        
        // Cache simples
        const key = `${code}-${Math.floor(subtotal/10)}`;
        if(_cupomCache[key]) return _cupomCache[key];

        try {
            const snap = await db.collection("Cupons").doc(code).get();
            if(snap.exists) {
                const d = snap.data();
                if(d.ativo && (!d.minimo || subtotal >= d.minimo)) {
                    let disc = 0;
                    if(d.tipo === 'percent') disc = subtotal * (d.valor/100);
                    else disc = d.valor;
                    const res = { valido: true, discount: disc, freeShipping: d.freteGratis, msg: "Cupom Aplicado!" };
                    _cupomCache[key] = res; return res;
                }
            }
        } catch(e) {}
        return { valido: false, discount: 0, msg: "Cupom inválido" };
    }

    async function calcTotals() {
        const subtotal = cart.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
        const cupomData = await validarCupomFirestore(couponApplied, subtotal);
        
        let deliveryFee = DELIVERY_FEE_DEFAULT;
        let endereco = "";
        if (modoEnderecoManual) endereco = getEl("manualEndereco")?.value;
        else endereco = getEl("endereco-auto")?.value;

        if(endereco) deliveryFee = await getDynamicDeliveryFee(endereco);
        if(subtotal >= LIMITE_FRETE_GRATIS || cupomData.freeShipping || getEl('retirar-local')?.checked) deliveryFee = 0;

        const total = Math.max(0, subtotal + deliveryFee - cupomData.discount);
        return { subtotal, deliveryFee, discount: cupomData.discount, total, msg: cupomData.msg };
    }

    async function enhanceMiniCartUI() {
        const { subtotal, deliveryFee, discount, total, msg } = await calcTotals();
        
        if(getEl("coupon-message")) getEl("coupon-message").textContent = msg || "";
        
        const foot = document.querySelector(".mini-foot");
        let sum = foot.querySelector(".cart-summary-generated");
        if(!sum) { sum = document.createElement("div"); sum.className = "cart-summary-generated"; foot.appendChild(sum); }
        
        sum.innerHTML = `
            <div style="padding:10px; background:#f9f9f9; margin-top:10px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span> <b>${money(subtotal)}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Entrega:</span> <b>${deliveryFee===0?'Grátis':money(deliveryFee)}</b></div>
                ${discount > 0 ? `<div style="display:flex; justify-content:space-between; color:green;"><span>Desconto:</span> <b>-${money(discount)}</b></div>` : ''}
                <div style="display:flex; justify-content:space-between; font-size:1.2rem; margin-top:5px; color:#d32f2f;"><span>Total:</span> <b>${money(total)}</b></div>
            </div>
            <button id="btn-finish" style="width:100%; background:#4caf50; color:white; padding:15px; border:none; border-radius:8px; font-weight:bold; margin-top:10px;">FINALIZAR PEDIDO</button>
            <button id="btn-clear" style="width:100%; background:#ff4081; color:white; padding:10px; border:none; border-radius:8px; margin-top:5px;">Limpar Carrinho</button>
        `;
        
        sum.querySelector("#btn-finish").onclick = () => fecharPedido(total, deliveryFee, discount);
        sum.querySelector("#btn-clear").onclick = () => { cart = []; renderMiniCart(); };
        
        // Listeners para recalcular se mudar opção
        getEl('retirar-local')?.addEventListener('change', renderMiniCart);
    }

    async function fecharPedido(total, delivery, discount) {
        if(cart.length === 0) return alert("Carrinho vazio!");
        if(!currentUser) { alert("Faça Login!"); Overlays.open(el.loginModal); return; }

        let end = "";
        if(getEl('retirar-local')?.checked) end = "RETIRADA NO LOCAL";
        else if(modoEnderecoManual) end = `${getEl("manualEndereco").value}, ${getEl("manualNumero").value} (Manual)`;
        else end = `${getEl("endereco-auto").value}, ${getEl("numero-input").value}`;

        if(end.length < 5) return alert("Endereço inválido.");

        const pedido = {
            uid: currentUser.uid,
            cliente: currentUser.displayName || "Cliente",
            itens: cart.map(i => `• ${i.nome} (${i.qtd}x)`).join("\n"),
            subtotal: cart.reduce((acc,i)=>acc+(i.preco*i.qtd),0),
            total, entrega: delivery, desconto: discount,
            endereco: end,
            data: new Date().toISOString()
        };

        try {
            const batch = db.batch();
            batch.set(db.collection("Pedidos").doc(), pedido);
            batch.update(db.collection("Usuarios").doc(currentUser.uid), { pedidosFeitos: firebase.firestore.FieldValue.increment(1) });
            await batch.commit();

            const msg = `🍔 *Pedido DFL*\nCliente: ${pedido.cliente}\n\n${pedido.itens}\n\n📍 ${end}\n💰 *Total: ${money(total)}*`;
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, '_blank');
            
            cart = []; renderMiniCart(); Overlays.closeAll();
        } catch(e) {
            console.error(e);
            alert("Erro ao salvar. Tente novamente.");
        }
    }

    /* --- 📊 ÁREA DO USUÁRIO & ADMIN (MANTIDO) --- */
    getEl("pedidosBtn")?.addEventListener("click", () => {
        if(!currentUser) { Overlays.open(el.loginModal); return; }
        Overlays.open(el.pedidosPanel);
        getEl("listaPedidos").innerHTML = "Carregando...";
        db.collection("Pedidos").where("uid", "==", currentUser.uid).orderBy("data", "desc").limit(10).get()
            .then(snap => {
                getEl("listaPedidos").innerHTML = snap.docs.map(d => {
                    const p = d.data();
                    return `<div class="pedido-card" style="padding:10px; border:1px solid #eee; margin-bottom:10px;"><b>${new Date(p.data).toLocaleDateString()}</b> - ${money(p.total)}<br><small>${p.itens.replace(/\n/g, ", ")}</small></div>`;
                }).join('');
            });
    });

    getEl("recompensasBtn")?.addEventListener("click", async () => {
        if(!currentUser) { Overlays.open(el.loginModal); return; }
        Overlays.open(el.recompensasPanel);
        const u = await db.collection("Usuarios").doc(currentUser.uid).get();
        const feitos = u.data()?.pedidosFeitos || 0;
        getEl("contador-valor").textContent = feitos;
        
        const metas = [{l:5, v:"Coca Lata"}, {l:10, v:"Burguer Simples"}, {l:15, v:"Nível OURO"}];
        getEl("listaRecompensas").innerHTML = metas.map(m => `
            <div class="recompensa-item ${feitos>=m.l?'conquistado':''}" style="padding:10px; border:1px solid #eee; margin-bottom:5px; display:flex; align-items:center; ${feitos>=m.l?'background:#e8f5e9':''}">
                <span style="font-size:1.5rem; margin-right:10px;">${getTierIcon(m.v)}</span>
                <div style="flex:1"><b>${m.v}</b><br><small>Meta: ${m.l}</small></div>
                <div>${feitos>=m.l?'✅':'🔒'}</div>
            </div>
        `).join('');
    });

    // ADMIN DASHBOARD
    const ADMINS = ["alefejohsefe@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(u) { return u && ADMINS.includes(u.email); }
    
    function createAdminFab() {
        const btn = getEl("reports-btn");
        if(btn) {
            btn.style.display = "block";
            btn.onclick = () => {
                if(!getEl("admin-dashboard")) createDashboardHTML();
                Overlays.open(getEl("admin-dashboard"));
                carregarDadosAdmin();
            };
        }
    }

    function createDashboardHTML() {
        const d = document.createElement("div"); d.id = "admin-dashboard"; d.className = "modal";
        d.innerHTML = `<div class="modal-content" style="max-width:800px;"><div class="modal-head"><h3>Admin</h3><button class="dashboard-close">✖</button></div><div style="padding:20px;"><canvas id="chart-vendas"></canvas><div id="adm-lista" style="margin-top:20px;"></div></div></div>`;
        document.body.appendChild(d);
        d.querySelector(".dashboard-close").onclick = () => Overlays.closeAll();
    }

    async function carregarDadosAdmin() {
        const s = await db.collection("Pedidos").orderBy("data", "desc").limit(20).get();
        const peds = s.docs.map(d => d.data());
        const ctx = getEl("chart-vendas").getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: peds.map(p => new Date(p.data).toLocaleDateString()),
                datasets: [{ label: 'Vendas', data: peds.map(p => p.total), backgroundColor: '#ffb300' }]
            }
        });
        getEl("adm-lista").innerHTML = peds.map(p => `<div>${p.cliente} - ${money(p.total)}</div>`).join('');
    }

    // BANNER LOOP
    setInterval(() => {
        const h = new Date().getHours();
        const aberto = h >= 18 && h < 23;
        const b = getEl("status-banner");
        if(b) {
            b.textContent = aberto ? "🟢 ABERTO AGORA" : "🔴 FECHADO (Abre às 18h)";
            b.className = `status-banner ${aberto ? "open" : "closed"}`;
        }
    }, 60000);

    console.log("🔥 DFL v10.0 COMPLETO CARREGADO");

}); // FIM DO SCRIPT
