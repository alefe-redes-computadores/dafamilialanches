/* =========================================================  
   🚀 DFL v6.5 CORRIGIDO — SCRIPT COMPLETO
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

    /* ------------------ ⚙️ BASE ------------------ */  
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
        if (level.includes('safira')) return '💠';       
        if (level.includes('rubi')) return '♦️';         
        if (level.includes('esmeralda')) return '❇️';   
        if (level.includes('elite')) return '⚔️';        
        if (level.includes('supremo')) return '🚀';      
        if (level.includes('lenda')) return '🦁';        
        if (level.includes('mítico') || level.includes('mitico')) return '🦄';  
        return '👤';   
    }  

    /* ============================================================
       🔥 DADOS DAS PROMOÇÕES (NOMES LIMPOS)
    ============================================================ */
    const PROMO_DATA = [  
        null,   
        { 
            id: 1, 
            nome: "2 Purizin + 1 Fanta 1L", 
            preco: 34.99, 
            precoAntigo: 40.00, 
            img: "promocoes/promo1.jpg",
            descricao: "2 Hot Dogs 'Purizin' com purê cremoso + 1 Fanta 1L geladinha!"
        },  
        { 
            id: 2, 
            nome: "3 Hot Dog Padaná", 
            preco: 37.99, 
            precoAntigo: 45.00, 
            img: "promocoes/promo2.jpg",
            descricao: "3 Padaná completos, perfeitos pra dividir com a galera!"
        },  
        { 
            id: 3, 
            nome: "2 Burgers Peleja", 
            preco: 39.99, 
            precoAntigo: 52.00, 
            img: "promocoes/promo3.jpg",
            descricao: "Bora artesanar o bolso! Dois Burgers artesanais 'Peleja' no precinho!"
        },  
        { 
            id: 4, 
            nome: "3 Trem + 1 Fanta 1L", 
            preco: 44.99, 
            precoAntigo: 51.00, 
            img: "promocoes/promo4.jpg",
            descricao: "3 Burgers Trem com bacon, queijo e batata palha + 1 Fanta 1L."
        },  
        { 
            id: 5, 
            nome: "4 Trem + 1 Fanta 1L", 
            preco: 49.99, 
            precoAntigo: 65.00, 
            img: "promocoes/promo5.jpg",
            descricao: "O clássico da família! 4 Burgers Trem + Fanta 1L."
        },  
        { 
            id: 6, 
            nome: "5 Burgers Uai", 
            preco: 54.00, 
            precoAntigo: 65.00, 
            img: "promocoes/promo6.jpg",
            descricao: "Pra família toda! 5 Burgers UAI recheados no precinho!"
        },  
        { 
            id: 7, 
            nome: "4 TremBão + 1 Fanta 1L", 
            preco: 59.99, 
            precoAntigo: 77.00, 
            img: "promocoes/promo7.jpg",
            descricao: "O maior hot dog da casa! 4 TremBão com purê cremoso + Fanta 1L."
        },  
        { 
            id: 8, 
            nome: "4 Armaria", 
            preco: 59.99, 
            precoAntigo: 72.00, 
            img: "promocoes/promo8.jpg",
            descricao: "A queridinha da galera! 4 Armaria no super desconto."
        },  
        { 
            id: 9, 
            nome: "5 Uai + 1 Kuat 2L (Brinde)", 
            preco: 64.99, 
            precoAntigo: 75.00, 
            img: "promocoes/promo9.jpg",
            descricao: "Compre 5 Burgers Uai e leve 1 Kuat 2L por nossa conta! 🎁"
        }
    ];

    /* ============================================================
       🎨 RENDERIZAR PROMOÇÕES COMO CARDS
    ============================================================ */
    function renderPromoCards() {
        const container = document.getElementById('promocoes-grid');
        if (!container) return;

        const html = PROMO_DATA.slice(1).map(promo => `
            <div class="card promo-card" data-promo-id="${promo.id}">
                <img src="${promo.img}" alt="${promo.nome}" loading="lazy">
                <h3>${promo.nome} <span class="badge economia"><span class="badge-icon">💸</span> Economia de ${money(promo.precoAntigo - promo.preco)}</span></h3>
                <p class="price">De ${money(promo.precoAntigo)} por <b>${money(promo.preco)}</b></p>
                <p>${promo.descricao}</p>
                <div class="actions">
                    <button class="add-cart add-promo" data-promo-id="${promo.id}" type="button">Adicionar</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;

        // Bind dos botões
        container.querySelectorAll('.add-promo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const promoId = parseInt(e.currentTarget.dataset.promoId);
                const promo = PROMO_DATA[promoId];
                if (promo) {
                    addCommonItem(promo.nome, promo.preco);
                }
            });
        });
    }

    /* ============================================================
       🔍 BUSCA INTELIGENTE
    ============================================================ */
    const searchInput = document.getElementById('search-input');
    
    const PRODUTOS_BUSCA = [
        { nome: "Bão", aliases: ["bao", "bon"] },
        { nome: "Uai", aliases: ["uai", "way"] },
        { nome: "Trem", aliases: ["trem", "tren"] },
        { nome: "Cadim", aliases: ["cadim", "kadim"] },
        { nome: "Armaria", aliases: ["armaria", "armário", "armario"] },
        { nome: "Bitela", aliases: ["bitela", "vitela"] },
        { nome: "Apruma", aliases: ["apruma", "apuma"] },
        { nome: "Peleja", aliases: ["peleja"] },
        { nome: "Tudibom", aliases: ["tudibom", "tudo bom", "tudobom"] },
        { nome: "Custoso", aliases: ["custoso"] },
        { nome: "Nigucim", aliases: ["nigucim", "ningucim"] },
        { nome: "Simprão", aliases: ["simprao", "simprão", "simples"] },
        { nome: "Nimin", aliases: ["nimin", "ninin"] },
        { nome: "Padaná", aliases: ["padana", "padaná"] },
        { nome: "Purizin", aliases: ["purizin", "purezin", "pure"] },
        { nome: "Trembão", aliases: ["trembao", "trembão", "trembaum"] }
    ];

    function normalizar(texto) {
        return texto.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function distanciaLevenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    function filtrarCards(query) {
        if (!query || query.length < 2) {
            document.querySelectorAll('.card').forEach(c => c.style.display = '');
            return;
        }

        const queryNorm = normalizar(query);
        
        document.querySelectorAll('.card').forEach(card => {
            const nome = card.dataset.name || card.querySelector('h3')?.textContent || '';
            const nomeNorm = normalizar(nome);

            let match = false;
            
            if (nomeNorm.includes(queryNorm)) {
                match = true;
            } else {
                for (const produto of PRODUTOS_BUSCA) {
                    const dist = distanciaLevenshtein(queryNorm, normalizar(produto.nome));
                    if (dist <= 2 && nomeNorm.includes(normalizar(produto.nome))) {
                        match = true;
                        break;
                    }
                    for (const alias of produto.aliases) {
                        if (normalizar(alias).includes(queryNorm) || queryNorm.includes(normalizar(alias))) {
                            if (nomeNorm.includes(normalizar(produto.nome))) {
                                match = true;
                                break;
                            }
                        }
                    }
                    if (match) break;
                }
            }

            card.style.display = match ? '' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filtrarCards(e.target.value);
        });
    }

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
            progressText.innerHTML = `🎉 <strong>Frete Grátis!</strong>`;
            progressFill.style.background = "linear-gradient(90deg, #4caf50, #2e7d32)";
            progressWrapper.style.background = "#e8f5e9";
            progressWrapper.style.borderColor = "#4caf50";
        } else {
            progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> p/ Frete Grátis`;
            progressFill.style.background = "linear-gradient(90deg, #ffb300, #ff9800)";
            progressWrapper.style.background = "#fff8d6";
            progressWrapper.style.borderColor = "#ffca28";
        }
    }

    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  

        atualizarBarraProgresso();

        if (!cart.length) {  
            el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';  
            if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
            const couponMsg = document.getElementById("coupon-message");  
            const couponDiscountRow = document.getElementById("coupon-discount-row");  
            if (couponMsg) couponMsg.innerHTML = "";  
            if (couponDiscountRow) couponDiscountRow.style.display = "none";  
            return;  
        }  

        el.miniList.innerHTML = cart.map((item, idx) => `  
      <div class="cart-item" style="border-bottom:1px solid #eee;padding:8px 0;">  
        <div style="display:flex;justify-content:space-between;align-items:center;">  
          <div style="flex:1;">  
            <p style="font-weight:600;margin-bottom:2px;">${item.nome}</p>  
            <p style="color:#666;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p>  
          </div>  
          <div style="display:flex;gap:8px;align-items:center;">  
            <button type="button" class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:24px;height:24px;cursor:pointer;">−</button>  
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>  
            <button type="button" class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:24px;height:24px;cursor:pointer;">+</button>  
            <button type="button" class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:24px;height:24px;cursor:pointer;">🗑</button>  
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

    const _renderMiniCartOrig = renderMiniCart;  
    renderMiniCart = function () {  
        _renderMiniCartOrig();   
        bindMiniCartButtons();   
        enhanceMiniCartUI();  
    };

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
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;  
                // ✅ BOTÕES VISÍVEIS SEMPRE - CLIQUE ABRE O MODAL SE NÃO LOGADO
            } else {  
                el.userBtn.textContent = "Entrar / Cadastrar";  
            }  
            if (user && isAdmin(user)) {  
                if (el.reportsBtn) createAdminFab();  
            } else {  
                if (el.reportsBtn) el.reportsBtn.style.display = "none";  
                document.getElementById("admin-dashboard")?.remove();  
            }  
        });  
    }

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

    el.googleBtn?.addEventListener("click", () => {  
        inicializarFirebase();
        if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");  
        const provider = new firebase.auth.GoogleAuthProvider();  
        auth.signInWithPopup(provider)
            .then((res) => handleLoginSuccess(res.user))
            .catch((err) => alert("Erro: ".concat(err.message)));  
    });  

    el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));  
    el.cartIcon?.addEventListener("click", () => {
        const pedidos = document.getElementById("painelPedidos");
        const recompensas = document.getElementById("recompensas-panel");
        if (pedidos) pedidos.classList.remove("active", "show");
        if (recompensas) recompensas.classList.remove("active", "show");
        renderMiniCart();
        Overlays.open(el.miniCart);
    });
    
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
      <label class="extra-line">  
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
      <label class="combo-option-line">  
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

    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

    let modoEnderecoManual = false;

    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => {
        window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank");
    });

    document.getElementById("btnManual")?.addEventListener("click", mostrarModoManual);

    function mostrarModoManual() {
        modoEnderecoManual = true;
        const freteContainer = document.querySelector('.frete-container');
        const manualArea = document.getElementById('manualArea');
        if (freteContainer) freteContainer.style.display = 'none';
        if (manualArea) manualArea.style.display = 'block';
        const cepInput = document.getElementById('cep-input');
        const enderecoAuto = document.getElementById('endereco-auto');
        const numeroInput = document.getElementById('numero-input');
        const complementoInput = document.getElementById('complemento-input');
        if (cepInput) cepInput.value = '';
        if (enderecoAuto) enderecoAuto.value = '';
        if (numeroInput) numeroInput.value = '';
        if (complementoInput) complementoInput.value = '';
    }

    document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        const freteContainer = document.querySelector('.frete-container');
        const manualArea = document.getElementById('manualArea');
        if (freteContainer) freteContainer.style.display = 'block';
        if (manualArea) manualArea.style.display = 'none';
        const manualEndereco = document.getElementById('manualEndereco');
        const manualNumero = document.getElementById('manualNumero');
        if (manualEndereco) manualEndereco.value = '';
        if (manualNumero) manualNumero.value = '';
        renderMiniCart();
    });

    document.getElementById("btnConfirmarEndereco")?.addEventListener("click", async () => {
        const manualEndereco = document.getElementById('manualEndereco');
        const manualNumero = document.getElementById('manualNumero');
        const endereco = manualEndereco?.value?.trim() || '';
        const numero = manualNumero?.value?.trim() || '';
        if (!endereco) { popupAdd("Preencha o endereço completo!"); return; }
        if (!numero) { popupAdd("Preencha o número!"); return; }
        popupAdd("Verificando endereço...");
        const taxaCalculada = await getDynamicDeliveryFee(endereco);
        if (taxaCalculada === DELIVERY_FEE_DEFAULT) { popupAdd(`Bairro não mapeado. Taxa padrão: ${money(DELIVERY_FEE_DEFAULT)}`); } else { popupAdd(`Taxa de entrega: ${money(taxaCalculada)} ✅`); }
        renderMiniCart();
    });

    async function buscarCEP(cep) {  
        const freteContainer = document.querySelector('.frete-container');  
        const enderecoAuto = document.getElementById('endereco-auto');  
        const numeroInput = document.getElementById('numero-input');  
        const complementoInput = document.getElementById('complemento-input');  
        const retirarLocal = document.getElementById('retirar-local');  

        const toggleAddressState = (isDisabled) => {  
            if(enderecoAuto) enderecoAuto.disabled = isDisabled;  
            if(numeroInput) numeroInput.disabled = isDisabled;  
            if(complementoInput) complementoInput.disabled = isDisabled;  
            if(retirarLocal) retirarLocal.disabled = isDisabled;  
        };  
        const updateStatus = (msg, color) => { if (freteContainer) freteContainer.querySelector('h4').innerHTML = `🚚 Entrega: <span style="color:${color}">${msg}</span>`; };  
        const clearAndEnableManual = (msg) => {  
            if (enderecoAuto) enderecoAuto.value = msg;  
            if (numeroInput) numeroInput.value = '';  
            if (complementoInput) complementoInput.value = '';  
            toggleAddressState(false);  
            if (enderecoAuto) enderecoAuto.disabled = false;  
            updateStatus('Erro/Manual', 'var(--danger)');  
            renderMiniCart();  
        };  

        toggleAddressState(true);  
        updateStatus('Buscando endereço...', 'var(--botao)');  
        document.getElementById('cep-input').disabled = false;   

        try {  
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);  
            const data = await response.json();  
            if (data.erro || !response.ok) { clearAndEnableManual('CEP não encontrado. Preencha manualmente.'); }  
            else {  
                const localidadeCompleta = `${data.localidade || 'Cidade'}/${data.uf || 'UF'}`;  
                const enderecoString = `${data.logradouro || 'Rua'} - ${data.bairro || 'Bairro'} (${localidadeCompleta})`;  
                enderecoAuto.value = enderecoString;  
                toggleAddressState(false);  
                if (enderecoAuto) enderecoAuto.disabled = true;  
                if (numeroInput) numeroInput.focus();   
                updateStatus('Endereço encontrado!', 'var(--success)');  
                renderMiniCart();   
            }  
        } catch (error) {  
            console.error("ViaCEP Error:", error);  
            popupAdd("Erro ao consultar CEP.");  
            clearAndEnableManual('Erro na consulta. Preencha manualmente.');  
        }  
    }

    // CORREÇÃO CRÍTICA: stopPropagation para não fechar o carrinho
    document.getElementById('btn-calcular-frete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const cepInput = document.getElementById('cep-input');  
        const cep = cepInput.value.trim().replace(/\D/g, '');  
        if (cep.length === 8) buscarCEP(cep);  
        else popupAdd("CEP deve ter 8 dígitos.");  
    });

    async function getDynamicDeliveryFee(enderecoCompleto) {
        if (!enderecoCompleto || typeof enderecoCompleto !== "string") {
            console.warn("FW: Endereço vazio, usando fallback.");
            return DELIVERY_FEE_DEFAULT;
        }
        let bairroExtraido = "";
        try {
            const partePrincipal = enderecoCompleto.split("(")[0].trim();
            const partes = partePrincipal.split(" - ");
            if (partes.length >= 2) bairroExtraido = partes[partes.length - 1].trim();
            else bairroExtraido = partePrincipal.trim();
        } catch (_) {
            console.warn("FW: Falha ao extrair bairro.");
            return DELIVERY_FEE_DEFAULT;
        }
        const bairroClean = bairroExtraido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        try {
            if (!db) { console.warn("FW: db não disponível."); return DELIVERY_FEE_DEFAULT; }
            if (!window.deliveryFeesCacheGlobal) {
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
            }
        } catch (e) { console.warn("FW: Erro ao carregar taxas.", e); return DELIVERY_FEE_DEFAULT; }
        const cacheAtual = window.deliveryFeesCacheGlobal || {};
        if (!Object.keys(cacheAtual).length) return DELIVERY_FEE_DEFAULT;
        if (cacheAtual[bairroClean] !== undefined) { return cacheAtual[bairroClean]; }
        const palavras = bairroClean.split(" ");
        for (const palavra of palavras) {
            if (palavra.length < 4) continue;
            for (const key in cacheAtual) { if (key.includes(palavra)) return cacheAtual[key]; }
        }
        return DELIVERY_FEE_DEFAULT;
    }

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

            if (!data.ativo) { const res = { ...invalido, mensagem: "Este cupom não está mais ativo." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  
            if (data.expiraEm) {  
                let expiraDate = null;  
                if (typeof data.expiraEm?.toDate === "function") expiraDate = data.expiraEm.toDate();  
                else if (typeof data.expiraEm === "string") expiraDate = new Date(data.expiraEm);  
                if (expiraDate && expiraDate < new Date()) { const res = { ...invalido, mensagem: "Este cupom expirou." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  
            }  

            let discount = 0, freeShipping = false, label = "";  
            if (data.tipo === "percent") { discount = Math.max(0, subtotal * (Number(data.percent || data.valor) / 100)); label = `${Number(data.percent || data.valor)}% OFF`; }  
            else if (data.tipo === "value") { const val = Math.max(0, Number(data.valor) || 0); discount = Math.min(subtotal, val); label = `R$ ${val.toFixed(2).replace(".", ",")} OFF`; }  
            else if (data.tipo === "frete") { freeShipping = true; label = "Frete Grátis"; }  
            else { const res = { ...invalido, mensagem: "Tipo de cupom desconhecido." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  

            const res = { valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado com sucesso!", isPersonalizado };  
            _cupomCache[key] = { ate: now + 30000, res }; return res;  
        } catch (err) { console.error("Erro ao validar cupom:", err); return { ...invalido, mensagem: "Erro ao processar cupom." }; }  
    }

    async function calcTotals() {  
        const subtotal = getCartSubtotal();  
        const d = await validarCupomFirestore(couponApplied, subtotal);   
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        
        let deliveryFee = DELIVERY_FEE_DEFAULT;   
        let enderecoParaCalculo = "";

        if (modoEnderecoManual) {
            const manualEndereco = document.getElementById('manualEndereco');
            enderecoParaCalculo = manualEndereco?.value?.trim() || "";
        } else {
            const cepInput = document.getElementById('cep-input');
            const enderecoAuto = document.getElementById('endereco-auto');
            const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';
            
            if (cepInput && cepValue.length === 8 && enderecoAuto && enderecoAuto.value) {
                enderecoParaCalculo = enderecoAuto.value.trim();
            }
        }

        if (isRetirarLocal || subtotal >= LIMITE_FRETE_GRATIS) {  
            deliveryFee = 0;  
        } else if (enderecoParaCalculo) {  
            try { deliveryFee = await getDynamicDeliveryFee(enderecoParaCalculo); }  
            catch(e) { console.error("Erro frete dinâmico:", e); deliveryFee = DELIVERY_FEE_DEFAULT; }  
        }  

        const delivery = d.freeShipping ? 0 : deliveryFee;  
        const total = Math.max(0, subtotal + delivery - d.discount);  
        return { subtotal, delivery, discount: d.discount, discountLabel: d.label, total, cupomInfo: d };  
    }

    async function enhanceMiniCartUI() {  
        if (!el.miniFoot) return;  
        const couponMsg = document.getElementById("coupon-message");  
        const couponDiscountRow = document.getElementById("coupon-discount-row");  
        const cartDiscount = document.getElementById("cart-discount");  
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
        if (cart.length === 0) { if (couponMsg) couponMsg.innerHTML = ""; if (couponDiscountRow) couponDiscountRow.style.display = "none"; return; }  

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
        const deliveryLabel = delivery === 0 ? "Grátis 🎉" : money(delivery);  

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

        const summaryDiv = document.createElement('div');  
        summaryDiv.className = 'cart-summary-generated';  
        summaryDiv.innerHTML = `  
      <div class="summary-row" style="margin-top:8px;border-top:1px solid #eee;padding-top:8px;"><span>Subtotal</span><b>${money(subtotal)}</b></div>  
      <div class="summary-row"><span>Entrega</span><b>${deliveryLabel}</b></div>  
      <div class="summary-row" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:8px;margin:8px 0;font-size:1rem;"><span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span></div>  
      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">Finalizar Pedido 🛍️</button>  
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Limpar Carrinho</button>`;  

        el.miniFoot.appendChild(summaryDiv);  
        document.getElementById('retirar-local')?.addEventListener('change', renderMiniCart);  
        document.getElementById('numero-input')?.addEventListener('input', renderMiniCart);  
        document.getElementById('complemento-input')?.addEventListener('input', renderMiniCart);  
        summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);  
        summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {  
            if (confirm("Limpar todo o carrinho?")) { cart = []; couponApplied = ""; localStorage.removeItem("dflCoupon"); document.getElementById("coupon-input").value = ""; renderMiniCart(); popupAdd("Carrinho limpo!"); }  
        });  
    }

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

    const atualizarStatus = safe(() => {  
        const agora = new Date(); const h = agora.getHours();  
        const aberto = h >= 18 && h < 23;   
        if (el.statusBanner) { el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; }  
    });  
    atualizarStatus(); setInterval(atualizarStatus, 60000);  

    const atualizarTimer = safe(() => {  
        const agora = new Date(); const fim = new Date(); fim.setHours(23, 59, 59, 999); const diff = fim - agora;  
        const elTimer = document.getElementById("promo-timer"); if (!elTimer) return;  
        if (diff <= 0) return (elTimer.textContent = "00:00:00");  
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0"); const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"); const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");  
        elTimer.textContent = `${h}:${m}:${s}`;  
    });  
    atualizarTimer(); setInterval(atualizarTimer, 1000);

    async function fecharPedido() {  
        if (!cart.length) return alert("Carrinho vazio!");  
        if (!currentUser) { alert("Faça login para enviar o pedido!"); Overlays.open(el.loginModal); return; }  
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        let finalAddressString = "";
        
        if (modoEnderecoManual) {
            const manualEndereco = document.getElementById('manualEndereco');
            const manualNumero = document.getElementById('manualNumero');
            const endereco = manualEndereco?.value?.trim() || '';
            const numero = manualNumero?.value?.trim() || '';
            
            if (endereco && numero) {
                finalAddressString = `${endereco}, N° ${numero} (MANUAL)`;
            }
        } else {
            const cepInput = document.getElementById('cep-input');
            const autoRuaBairro = document.getElementById("endereco-auto");
            const autoNumero = document.getElementById("numero-input");
            const autoComp = document.getElementById("complemento-input");
            
            const ruaBairroValue = autoRuaBairro ? autoRuaBairro.value.trim() : '';
            const numeroValue = autoNumero ? autoNumero.value.trim() : '';
            const compValue = autoComp ? autoComp.value.trim() : '';
            const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';
            
            if (ruaBairroValue && numeroValue) {
                finalAddressString = `${ruaBairroValue}, N° ${numeroValue}`;
                if (compValue) finalAddressString += `, Comp: ${compValue}`;
                if (cepValue.length === 8) finalAddressString += ` | CEP: ${cepValue}`;
            }
        }
        
        if (isRetirarLocal) finalAddressString = "CLIENTE IRÁ RETIRAR NO LOCAL";  
        else if (!finalAddressString) { alert("Preencha o endereço completo (via CEP ou manualmente), ou marque 'Retirar no Local'."); return; }  

        const addr = finalAddressString;  
        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();  
        const pedido = { usuario: currentUser.email, userId: currentUser.uid, nome: currentUser.displayName || currentUser.email.split("@")[0], itens: cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), itensObj: cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })), subtotal: Number(subtotal.toFixed(2)), entrega: Number(delivery.toFixed(2)), desconto: Number(discount.toFixed(2)), cupom: couponApplied || "", total: Number(total.toFixed(2)), endereco: addr, data: new Date().toISOString(), thumb: '' };  

        try {  
            const batch = db.batch(); const userId = currentUser.uid; const usuarioRef = db.collection("Usuarios").doc(userId);  
            if (cupomInfo.isPersonalizado && couponApplied) { const cupomUserRef = db.collection("CuponsUsuarios").doc(userId); batch.update(cupomUserRef, { usado: true, dataUso: firebase.firestore.FieldValue.serverTimestamp(), pedidoId: 'PENDENTE' }); }  
            const pedidoRef = db.collection("Pedidos").doc(); batch.set(pedidoRef, pedido);  
            batch.set(usuarioRef, { email: currentUser.email, pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, { merge: true });  
            await batch.commit();  
            if (cupomInfo.isPersonalizado && couponApplied) await db.collection("CuponsUsuarios").doc(userId).update({ pedidoId: pedidoRef.id });  

            const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
            const doc = await usuarioRef.get(); const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 }; const feitos = data.pedidosFeitos; const nivelAtual = data.recompensaNivel;  
            const recompensaAtingida = RECOMPENSAS_DATA.find(r => r.limite === feitos && (r.limite / (RECOMPENSAS_DATA[0]?.limite || 1)) > nivelAtual);  

            if (recompensaAtingida) {  
                const primeiroLimite = RECOMPENSAS_DATA[0]?.limite || 1; const novoNivel = recompensaAtingida.limite / primeiroLimite;  
                const itemLiberado = { cupom: recompensaAtingida.valor, tipo: recompensaAtingida.tipo, valor: recompensaAtingida.valor, liberadoEm: firebase.firestore.FieldValue.serverTimestamp(), usado: false, pedidoLiberacao: pedidoRef.id, titulo: recompensaAtingida.titulo || `Recompensa Nível ${novoNivel}` };  
                await usuarioRef.update({ recompensaNivel: novoNivel, ultimaRecompensa: recompensaAtingida.id });  
                if (recompensaAtingida.tipo === 'cupom') await db.collection("CuponsUsuarios").doc(userId).set(itemLiberado, { merge: true });  
                await db.collection("Usuarios").doc(userId).collection("RecompensasRecebidas").add(itemLiberado);  
                const nomeNivel = String(recompensaAtingida.titulo || recompensaAtingida.valor || '');  
                mostrarPopupRecompensa(`🎉 Parabéns! Você alcançou ${nomeNivel} ${getTierIcon(nomeNivel)} e ganhou: ${recompensaAtingida.valor}`);  
                configuracoesRecompensa = null;  
            }  

            popupAdd("Pedido salvo ✅"); try { sound.currentTime = 0; sound.play(); } catch (_) {}  
            const linhas = ["🍔 *Pedido DFL*", cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), "", `Subtotal: *${money(subtotal)}*`, `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`, `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`, `*Total: ${money(total)}*`, "", `🏠 *Endereço:* ${addr}`].join("\n");  
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(linhas)}`, "_blank");  
            cart = []; couponApplied = ""; localStorage.removeItem("dflCoupon"); document.getElementById("coupon-input").value = ""; modoEnderecoManual = false; renderMiniCart(); Overlays.closeAll();  
        } catch (err) { console.error("Erro fechar pedido:", err); alert(`Erro: ${err.message}`); }  
    }  
    
    renderMiniCart();

    el.pedidosBtn?.addEventListener("click", () => { if (!currentUser) { alert("Faça login para ver seus pedidos."); Overlays.open(el.loginModal); return; } Overlays.open(el.pedidosPanel); carregarPedidos(currentUser.uid); });  
    el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());  

    async function carregarPedidos(userId) {  
        if (!el.pedidosLista) return; el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;  
        try { const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc"); const snapshot = await q.get();  
            if (snapshot.empty) { el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`; return; }  
            exibirPedidos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));  
        } catch (err) { console.error("Erro pedidos:", err); el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar pedidos.</p>`; }  
    }  

    function exibirPedidos(pedidos) {  
        if (!el.pedidosLista) return;  
        el.pedidosLista.innerHTML = pedidos.map(p => {  
            const thumbUrl = p.thumb || ''; const dataFormatada = p.data ? new Date(p.data?.seconds * 1000 || p.data).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";  
            const podeRepetir = Array.isArray(p.itensObj) && p.itensObj.length > 0;  
            const itensParaExibir = (Array.isArray(p.itens) && p.itens.length > 0) ? p.itens.join('<br>') : (p.itensObj && p.itensObj.length > 0) ? p.itensObj.map(i => `• ${i.nome} x${i.qtd}`).join('<br>') : '• Sem itens';  
            return `<div class="pedido-card"><div class="pedido-thumb" style="background-image:url('${thumbUrl}');"></div><h4>📅 ${dataFormatada}</h4><p class="pedido-info">Total: ${money(p.total)}</p><div class="pedido-itens">${itensParaExibir}</div><button class="repetir-btn" data-id="${p.id}" ${podeRepetir ? '' : 'disabled style="background:grey;cursor:not-allowed;"'}>🔁 Repetir Pedido</button></div>`;  
        }).join('');  
    }  

    el.pedidosLista?.addEventListener('click', async (e) => { if (e.target.classList.contains('repetir-btn') && !e.target.disabled) { e.target.disabled = true; e.target.textContent = "Carregando..."; await repetirPedido(e.target.dataset.id); } });  

    async function repetirPedido(idPedido) {  
        try { const docRef = db.collection("Pedidos").doc(idPedido); const doc = await docRef.get();  
            if (!doc.exists) return alert("Pedido não encontrado.");  
            const itensParaRepetir = doc.data().itensObj;  
            if (!Array.isArray(itensParaRepetir) || itensParaRepetir.length === 0) return alert("Não é possível repetir este pedido.");  
            cart = []; itensParaRepetir.forEach(item => { if (item.nome && item.preco > 0 && item.qtd > 0) cart.push({ nome: item.nome, preco: item.preco, qtd: item.qtd }); });  
            couponApplied = ""; localStorage.removeItem("dflCoupon"); document.getElementById("coupon-input").value = "";  
            popupAdd("Pedido adicionado ao carrinho!"); renderMiniCart(); Overlays.closeAll(); Overlays.open(el.miniCart);  
        } catch (err) { console.error("Erro repetir:", err); alert("Erro ao processar."); }  
    }

    const cookieBanner = document.getElementById("cookie-banner"); const cookieAcceptBtn = document.getElementById("cookie-accept");  
    if (cookieBanner && cookieAcceptBtn) { if (localStorage.getItem("dfl-cookies-accepted") === "true") cookieBanner.style.display = "none"; else cookieBanner.classList.add("show"); cookieAcceptBtn.addEventListener("click", () => { localStorage.setItem("dfl-cookies-accepted", "true"); cookieBanner.classList.remove("show"); }); }

    console.log("%c🔥 DFL v6.4 — BOTÕES E FRETE CORRIGIDOS", "background:#4CAF50;color:#fff;padding:5px;border-radius:5px;");  
    
    renderPromoCards();
    inicializarFirebase();  

}); 

document.addEventListener('DOMContentLoaded', () => {  
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target.classList.contains('modal')) { m.classList.remove('show'); document.getElementById('cart-backdrop').classList.remove('active'); } }));  
    document.getElementById('cart-backdrop')?.addEventListener('click', () => { document.querySelectorAll('.active').forEach(e => e.classList.remove('active')); });  
});
