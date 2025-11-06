/* =========================================================
   👑 DFL v3.7.1 — HOTFIX PREMIUM E ESTABILIDADE FINAL
   - CÓDIGO MONOLÍTICO COMPLETO (Base v3.6.4).
   - CORRIGE O TRAVAMENTO CRÍTICO no Modal de Promoções (showPromoModal e navegação).
   - Garante que a interatividade total do site seja restaurada.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    
    /* ------------------ ⚙️ Variáveis Globais ------------------ */
    const sound = new Audio("click.wav"); 
    let cart = [];
    let currentUser = null;
    let isFirebaseInitialized = false; 
    const DELIVERY_FEE = 6.00; 
    let configuracoesRecompensa = null; 
    let _cupomCache = {}; 
    let currentPromoId = 1; 
    let produtoExtras = null; 
    let produtoPrecoBase = 0; 
    let _comboCtx = null; 

    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

    // Firebase (necessário no escopo global para functions)
    let auth, db; 
    const firebaseConfig = { 
        apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
        authDomain: "da-familia-lanches.firebaseapp.com",
        projectId: "da-familia-lanches",
        storageBucket: "da-familia-lanches.appspot.com",
        messagingSenderId: "106857147317",
        appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
    };
    
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
    let addressValue  = (localStorage.getItem("dflAddress") || "").trim();


    /* ------------------ 🎯 ELEMENTOS DOM ------------------ */
    const el = {
        cartIcon: document.getElementById("cart-icon"),
        cartCount: document.getElementById("cart-count"),
        miniCart: document.getElementById("mini-cart"),
        miniList: document.querySelector(".mini-list"),
        miniFoot: document.querySelector(".mini-foot"),
        cartBackdrop: document.getElementById("cart-backdrop"),
        
        // Modais e Forms
        extrasModal: document.getElementById("extras-modal"),
        extrasList: document.querySelector("#extras-modal .extras-list"),
        extrasConfirm: document.getElementById("extras-confirm"),
        comboModal: document.getElementById("combo-modal"),
        comboBody: document.getElementById("combo-body"),
        comboConfirm: document.getElementById("combo-confirm"),
        loginModal: document.getElementById("login-modal"),
        loginForm: document.getElementById("login-form"),
        googleBtn: document.getElementById("google-login"),

        // Seções e Banners
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

        // Pedidos e Recompensas
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


    /* ------------------ 🧩 Overlays e Modais ------------------ */
    const Overlays = {
        closeAll() {
            document
                .querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show") 
                .forEach((e) => e.classList.remove("show", "active"));
            el.cartBackdrop.classList.remove("active"); 
            document.body.classList.remove("no-scroll");
        },
        open(modalLike) {
            Overlays.closeAll();
            if (!modalLike) return;
            modalLike.classList.add(
                (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
            );
            Backdrop.show(); // Usando Backdrop localmente
        },
    };
    
    // Backdrop Helper
    const Backdrop = {
        show() { el.cartBackdrop.classList.add("active"); document.body.classList.add("no-scroll"); },
        hide() { 
          el.cartBackdrop.classList.remove("active"); 
          document.body.classList.remove("no-scroll");
        },
    };

    /* ------------------ 💬 Notificações e Feedback ------------------ */
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
            pop.style.cssText = `
                position: fixed; bottom: 120px; left: 50%;
                transform: translateX(-50%) scale(0);
                background: #4CAF50; color: white; padding: 15px 25px;
                border-radius: 12px; font-weight: bold; text-align: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); z-index: 10001;
                opacity: 0; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s;
            `;
            document.body.appendChild(pop);
        }
        pop.textContent = msg;
        pop.style.opacity = '1';
        pop.style.transform = 'translateX(-50%) scale(1)';
        setTimeout(() => {
            pop.style.transform = 'translateX(-50%) scale(0)';
            pop.style.opacity = '0';
        }, 4000);
    }

    /* ------------------ 🔥 Firebase Init e Auth ------------------ */
    function inicializarFirebase() {
        if (isFirebaseInitialized) return;

        try {
            if (!window.firebase) {
                console.error("Biblioteca principal do Firebase (app) não carregou.");
                return;
            }
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            auth = firebase.auth();
            db = firebase.firestore();
            isFirebaseInitialized = true;
            setupAuthListener(); 

        } catch (error) {
            console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
            alert("Erro Crítico: Não foi possível conectar aos serviços DFL. Recarregue.");
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
                setupAdmin(); 
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
                )
                  .then((cred) => handleLoginSuccess(cred.user))
                  .catch((e) => alert("Erro: " + e.message));
            }
        } else if (err.code === "auth/wrong-password") {
            alert("Senha incorreta. Tente novamente.");
        } else {
            alert("Erro: ".concat(err.message));
        }
    };

    /* ------------------ ⏱ Status e Timers ------------------ */
    function atualizarStatus() {
        const agora = new Date();
        const h = agora.getHours();
        const m = agora.getMinutes();
        const aberto = h >= 18 && h < 23; // Aberto das 18:00 até 22:59
        if (el.statusBanner) {
            el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
            el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
        }
        if (el.hoursBanner) {
            const elTimer = el.hoursBanner.querySelector("#timer");
            if (!elTimer) return;

            if (aberto) {
                const fim = new Date(agora);
                fim.setHours(23, 30, 0); // 23h30
                let diff = (fim - agora) / 1000;
                if (diff < 0) diff = 0;
                const restH = Math.floor(diff / 3600);
                const restM = Math.floor((diff % 3600) / 60);
                elTimer.innerHTML = `<b>${restH}h ${restM}min</b>`;
            } else {
                const inicio = new Date(agora);
                if (h >= 23 || (h === 23 && m >= 30)) inicio.setDate(inicio.getDate() + 1);
                inicio.setHours(18, 0, 0); 
                let diff = (inicio - agora) / 1000;
                const faltamH = Math.floor(diff / 3600);
                const faltamM = Math.floor((diff % 3600) / 60);
                el.hoursBanner.innerHTML = `⏰ Hoje atendemos até <b>23h30</b> — Faltam <b>${faltamH}h ${faltamM}min</b>`;
            }
        }
    }

    function atualizarTimer() {
        const agora = new Date();
        const fim = new Date();
        fim.setHours(23, 59, 59, 999);
        const diff = fim - agora;
        const elTimer = document.getElementById("promo-timer");
        if (!elTimer) return;
        if (diff <= 0) return (elTimer.textContent = "00:00:00");

        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        elTimer.textContent = `${h}:${m}:${s}`;
    }
    
    /* ------------------ 🍔 Dados e Lógica do Modal de Promoção (CORRIGIDO) ------------------ */

    // **ATENÇÃO:** Substitua estes dados fictícios pelas suas promoções reais.
    const PROMOCOES = [
        { id: 1, nome: "Combo Família Mega", preco: 59.90, desc: "2 Hamburgueres + Batata Grande + Refri 1.5L", img: "imagens/promo1.jpg" },
        { id: 2, nome: "Super X-Bacon Duplo", preco: 29.90, desc: "Delicioso X-Bacon com dobro de carne e queijo!", img: "imagens/promo2.jpg" },
        { id: 3, nome: "Recompensa de Sexta", preco: 35.00, desc: "Batata recheada especial e suco natural.", img: "imagens/promo3.jpg" }
        // ... adicione mais promoções aqui
    ];


    function findPromo(id) {
        return PROMOCOES.find(p => p.id === id);
    }

    function updatePromoModal(id) {
        const promo = findPromo(id);
        if (!promo) {
            currentPromoId = 1; // Volta para o primeiro se não encontrar
            return showPromoModal(currentPromoId);
        }
        
        currentPromoId = id;

        // Atualiza o conteúdo do modal
        if(el.promoImg) el.promoImg.src = promo.img;
        if(el.promoTitle) el.promoTitle.textContent = promo.nome;
        if(el.promoPrice) el.promoPrice.textContent = money(promo.preco);
        if(el.promoAddBtn) {
            el.promoAddBtn.dataset.nome = promo.nome;
            el.promoAddBtn.dataset.preco = promo.preco;
        }
        
        // Atualiza o estado dos botões de navegação
        if(el.promoNavPrev) el.promoNavPrev.disabled = id === PROMOCOES[0].id;
        if(el.promoNavNext) el.promoNavNext.disabled = id === PROMOCOES[PROMOCOES.length - 1].id;
    }

    function showPromoModal(id) {
        if (!el.promoModal) return;
        
        updatePromoModal(id);
        Overlays.open(el.promoModal);
    }
    
    // Função para adicionar item simples (usado pelo modal de promoção e itens comuns)
    function addCommonItem(e) {
        const btn = e.currentTarget;
        const nome = btn.dataset.nome || "Item";
        const preco = Number(btn.dataset.preco) || 0;
        
        if (preco === 0) {
            return alert(`Erro: Preço inválido para ${nome}.`);
        }

        const existing = cart.find(i => i.nome === nome);
        if (existing) {
            existing.qtd++;
        } else {
            cart.push({ nome, preco, qtd: 1 });
        }

        renderMiniCart();
        Overlays.closeAll();
        popupAdd(`1 ${nome} adicionado!`);
    }

    /* ------------------ 🛒 Lógica do Carrinho (Completa) ------------------ */

    function getCartSubtotal() {
        return cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
    }
    
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
            if (cart[i]) {
                cart[i].qtd++;
                renderMiniCart();
            }
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

    // Hook do carrinho (substitui o original)
    const _renderMiniCartOrig = renderMiniCart;
    renderMiniCart = function () {
        _renderMiniCartOrig(); 
        bindMiniCartButtons(); 
        enhanceMiniCartUI();
    };

    /* ------------------ 💰 Cálculos e Validação (Completa) ------------------ */
    function _cacheKey(codigo, subtotal){
        const faixa = Math.floor((subtotal || 0) / 5);
        return `${(codigo||"").toUpperCase()}::${faixa}`;
    }

    async function carregarConfiguracoesDeRecompensas() {
        if (!isFirebaseInitialized) return [];
        if (configuracoesRecompensa) return configuracoesRecompensa;
        
        try {
            const snapshot = await db.collection("RecompensasConfig").get();
            const configs = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                configs.push({ 
                    id: doc.id,
                    limite: data.meta || data.limite, 
                    tipo: data.tipo,
                    valor: data.valor || data.titulo, 
                    titulo: data.titulo || data.valor,
                    ...data 
                });
            });
            configuracoesRecompensa = configs.sort((a, b) => (a.limite || 0) - (b.limite || 0));
            
            if(configuracoesRecompensa.length === 0) {
                console.warn("Firestore: Coleção RecompensasConfig vazia. Recompensas desativadas.");
            }
            
            return configuracoesRecompensa;
            
        } catch (e) {
            console.error("Erro ao carregar configurações de recompensas do Firestore:", e);
            return [];
        }
    }

    async function validarCupomFirestore(codigo, subtotal) {
        if (!isFirebaseInitialized) return { valido:false, discount:0, freeShipping:false, label:"", mensagem:"Erro de conexão. Tente recarregar." };
        
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
            if (snapGeral.exists) {
                data = snapGeral.data();
            } else {
                const recompensaEncontrada = RECOMPENSAS_DATA.find(r => r.valor === code && r.tipo === 'cupom');
                
                if (userId && recompensaEncontrada) {
                    const snapPessoal = await db.collection("CuponsUsuarios").doc(userId).get();
                    const pessoalData = snapPessoal.data();
                    
                    if (snapPessoal.exists && pessoalData?.cupom === code && !pessoalData?.usado) {
                        data = {
                          tipo: pessoalData.tipo, 
                          valor: pessoalData.valor, 
                          ativo: true, 
                          expiraEm: pessoalData.expiraEm 
                        };
                        isPersonalizado = true;
                    } else if (snapPessoal.exists && pessoalData?.usado) {
                        return { ...invalido, mensagem: "Este cupom já foi utilizado." };
                    } else {
                        return { ...invalido, mensagem: "Cupom inválido ou não liberado." };
                    }
                } else {
                    const res = { ...invalido, mensagem: "Cupom inválido." };
                    _cupomCache[key] = { ate: now + 30000, res }; 
                    return res;
                }
            }
            
            if (!data.ativo) {
              const res = { ...invalido, mensagem: "Este cupom não está mais ativo." };
              _cupomCache[key] = { ate: now + 30000, res };
              return res;
            }

            // Cálculo
            let discount = 0;
            let freeShipping = false;
            let label = "";

            if (data.tipo === "percent") {
              discount = Math.max(0, subtotal * (Number(data.percent || data.valor) / 100)); 
              label = `${Number(data.percent || data.valor)}% OFF`;
            } else if (data.tipo === "value") {
              const val = Math.max(0, Number(data.valor) || 0);
              discount = Math.min(subtotal, val);
              label = `R$ ${val.toFixed(2).replace(".", ",")} OFF`;
            } else if (data.tipo === "frete") {
              freeShipping = true;
              label = "Frete Grátis";
            } else {
              const res = { ...invalido, mensagem: "Tipo de cupom desconhecido." };
              _cupomCache[key] = { ate: now + 30000, res };
              return res;
            }

            const res = { 
                valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado com sucesso!",
                isPersonalizado: isPersonalizado 
            };
            _cupomCache[key] = { ate: now + 30000, res };
            return res;

          } catch (err) {
            console.error("Erro ao validar cupom no Firestore:", err);
            return { ...invalido, mensagem: "Erro ao processar o cupom." };
          }
    }

    async function calcTotals() {
        const subtotal = getCartSubtotal();
        const d = await validarCupomFirestore(couponApplied, subtotal); 
        const delivery = d.freeShipping ? 0 : DELIVERY_FEE;
        const total = Math.max(0, subtotal + delivery - d.discount);
        
        return {
          subtotal, delivery, discount: d.discount,
          discountLabel: d.label, total, cupomInfo: d 
        };
    }

    async function enhanceMiniCartUI() {
        if (!el.miniFoot) return;
        
        const couponMsg = document.getElementById("coupon-message");
        const couponDiscountRow = document.getElementById("coupon-discount-row");
        const cartDiscount = document.getElementById("cart-discount");

        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
        
        if (cart.length === 0) {
            if (couponMsg) couponMsg.innerHTML = "";
            if (couponDiscountRow) couponDiscountRow.style.display = "none";
            return; 
        }

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();

        if (couponMsg) {
            couponMsg.textContent = cupomInfo.mensagem;
            couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;
            
            if (!cupomInfo.valido && couponApplied) {
               couponApplied = "";
               localStorage.removeItem("dflCoupon");
               const couponInput = document.getElementById("coupon-input");
               if (couponInput && document.activeElement !== couponInput) {
                 couponInput.value = "";
               }
            }
        }

        if (couponDiscountRow && cartDiscount) {
            if (discount > 0 || cupomInfo.label) {
                cartDiscount.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`;
                couponDiscountRow.style.display = "flex";
            } else {
                couponDiscountRow.style.display = "none";
            }
        }
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'cart-summary-generated'; // Classe para fácil remoção
        summaryDiv.innerHTML = `
            <div class="summary-row" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                <span>Subtotal</span><b>${money(subtotal)}</b>
            </div>
            <div class="summary-row">
                <span>Entrega</span><b>${money(delivery)}</b>
            </div>
            
            <div class="summary-row" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin: 10px 0;font-size:1.1rem;">
                <span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span>
            </div>

            <label style="display:block;font-weight:600;margin-bottom:6px;">🏠 Endereço para Entrega</label>
            <textarea id="address-input" rows="2" placeholder="Rua, número, complemento, bairro"
                style="width:100%;border:1px solid #ddd;border-radius:10px;padding:10px;resize:vertical;margin-bottom:10px">${addressValue}</textarea>

            <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">
                Finalizar Pedido 🛍️
            </button>
            <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">
                Limpar Carrinho
            </button>
        `;
        
        el.miniFoot.appendChild(summaryDiv);
        
        // 5. BIND EVENTOS
        summaryDiv.querySelector("#address-input")?.addEventListener("input", (e) => {
            addressValue = (e.target.value || "").trim();
            localStorage.setItem("dflAddress", addressValue);
        });

        summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);
        summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {
            if (confirm("Limpar todo o carrinho?")) {
                cart = [];
                couponApplied = ""; 
                localStorage.removeItem("dflCoupon");
                const couponInput = document.getElementById("coupon-input");
                if(couponInput) couponInput.value = "";
                
                renderMiniCart();
                popupAdd("Carrinho limpo!");
            }
        });
    }

    /* ------------------ 💳 Checkout (Completa) ------------------ */
    async function fecharPedido() {
        if (!cart.length) return alert("Carrinho vazio!");
        if (!currentUser) {
            alert("Faça login para enviar o pedido!");
            Overlays.open(el.loginModal);
            return;
        }

        const addr = (document.getElementById("address-input")?.value || "").trim();
        if (!addr) {
            alert("Informe o endereço para entrega antes de finalizar.");
            document.getElementById("address-input")?.focus();
            return;
        }

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();

        const pedido = {
            usuario: currentUser.email,
            userId: currentUser.uid,
            nome: currentUser.displayName || currentUser.email.split("@")[0],
            
            itens: cart.map((i) => `${i.nome} x${i.qtd}`),
            itensObj: cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })),
            
            subtotal: Number(subtotal.toFixed(2)),
            entrega: Number(delivery.toFixed(2)),
            desconto: Number(discount.toFixed(2)),
            cupom: couponApplied || "",
            total: Number(total.toFixed(2)),
            endereco: addr,
            data: new Date().toISOString(),
            
            thumb: 'imagens/padrao.jpg' 
        };

        try {
            const batch = db.batch();
            const userId = currentUser.uid;
            const usuarioRef = db.collection("Usuarios").doc(userId);
            
            if (cupomInfo.isPersonalizado && couponApplied) {
                const cupomUserRef = db.collection("CuponsUsuarios").doc(userId);
                batch.update(cupomUserRef, {
                    usado: true,
                    dataUso: firebase.firestore.FieldValue.serverTimestamp(),
                    pedidoId: 'PENDENTE' 
                });
            }

            const pedidoRef = db.collection("Pedidos").doc();
            batch.set(pedidoRef, pedido);
            
            batch.set(usuarioRef, {
                email: currentUser.email,
                pedidosFeitos: firebase.firestore.FieldValue.increment(1) 
            }, { merge: true }); 
            
            await batch.commit();

            if (cupomInfo.isPersonalizado && couponApplied) {
                await db.collection("CuponsUsuarios").doc(userId).update({
                    pedidoId: pedidoRef.id
                });
            }

            const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();
            
            const doc = await usuarioRef.get();
            const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };
            const feitos = data.pedidosFeitos;
            const nivelAtual = data.recompensaNivel;
            
            const recompensaAtingida = RECOMPENSAS_DATA.find(r => 
                r.limite === feitos && (r.limite / (RECOMPENSAS_DATA[0]?.limite || 1)) > nivelAtual
            );
            
            if (recompensaAtingida) {
                const primeiroLimite = RECOMPENSAS_DATA[0]?.limite || 1;
                const novoNivel = recompensaAtingida.limite / primeiroLimite; 
                
                const itemLiberado = {
                    cupom: recompensaAtingida.valor,
                    tipo: recompensaAtingida.tipo,
                    valor: recompensaAtingida.valor, 
                    liberadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                    usado: false,
                    pedidoLiberacao: pedidoRef.id,
                    titulo: recompensaAtingida.titulo || `Recompensa Nível ${novoNivel}`
                };
                
                await usuarioRef.update({
                    recompensaNivel: novoNivel,
                    ultimaRecompensa: recompensaAtingida.id
                });
                
                if (recompensaAtingida.tipo === 'cupom') {
                     await db.collection("CuponsUsuarios").doc(userId).set(itemLiberado, { merge: true });
                }

                await db.collection("Usuarios").doc(userId)
                        .collection("RecompensasRecebidas").add(itemLiberado);


                const valorFormatado = (recompensaAtingida.tipo === 'cupom') ? `${recompensaAtingida.valor} OFF` : recompensaAtingida.valor;
                const msg = `🎉 Parabéns! Você completou ${feitos} pedidos e ganhou: ${valorFormatado}!`;
                mostrarPopupRecompensa(msg);
                
                configuracoesRecompensa = null; 
                _cupomCache = {}; 
            }
            
            // 7. Feedback e Limpeza (MANTIDO)
            popupAdd("Pedido salvo ✅");

            const linhas = [
                "🍔 *Pedido DFL*",
                cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),
                "",
                `Subtotal: *${money(subtotal)}*`,
                `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`,
                `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`,
                `*Total: ${money(total)}*`,
                "",
                `🏠 *Endereço:* ${addr}`
            ].join("\n");

            const texto = encodeURIComponent(linhas);
            window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");

            cart = [];
            couponApplied = ""; 
            localStorage.removeItem("dflCoupon");
            const couponInput = document.getElementById("coupon-input");
            if(couponInput) couponInput.value = "";
            
            renderMiniCart();
            Overlays.closeAll();

        } catch (err) {
            console.error("Erro ao fechar pedido ou atualizar contador/recompensa:", err);
            alert(`Ocorreu um erro ao finalizar seu pedido. Detalhe: ${err.message}`);
        }
    }


    /* ------------------ 🎁 Recompensas e Histórico (Completa) ------------------ */
    async function carregarRecompensas(userId) {
        if (!isFirebaseInitialized) return;

        const contadorValor = document.getElementById('contador-valor');
        const progressoBar = document.getElementById('progresso-bar');
        const progressoMsg = document.getElementById('progresso-mensagem');
        
        if (!contadorValor || !progressoBar || !progressoMsg || !el.recompensasLista) return; 

        contadorValor.textContent = '...';
        progressoBar.style.width = '0%';
        progressoMsg.textContent = 'Carregando metas...';
        el.recompensasLista.innerHTML = ''; 
        if(el.historicoLista) el.historicoLista.innerHTML = '';
        
        const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();

        if (RECOMPENSAS_DATA.length === 0) {
            progressoMsg.textContent = 'Erro ao carregar metas de recompensa. (Coleção Configuração vazia).';
            el.recompensasLista.innerHTML = '<p style="text-align:center;color:red;padding:20px;">O sistema de fidelidade está desativado no momento.</p>';
            return; 
        }
        
        const metaPrimeiroNivel = RECOMPENSAS_DATA[0]?.limite || 1; 

        db.collection('Usuarios').doc(userId).onSnapshot(async doc => {
            
            el.recompensasLista.innerHTML = ''; 
            if(el.historicoLista) el.historicoLista.innerHTML = ''; 

            const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 };
            const feitos = data.pedidosFeitos;
            const nivelAtual = data.recompensaNivel;
            
            let cupomStatus = null;
            const recompensaAtual = RECOMPENSAS_DATA.find(r => r.limite === nivelAtual * metaPrimeiroNivel);
            
            if (recompensaAtual && recompensaAtual.tipo === 'cupom') {
                const cupomSnap = await db.collection('CuponsUsuarios').doc(userId).get();
                cupomStatus = cupumSnap.exists ? cupumSnap.data() : null;
            }

            const proximaRecompensa = RECOMPENSAS_DATA.find(r => r.limite > feitos);
            
            const metaParaExibir = proximaRecompensa ? proximaRecompensa.limite : feitos; 
            const metaBaseCalculo = proximaRecompensa ? proximaRecompensa.limite : metaPrimeiroNivel;

            const porcentagem = proximaRecompensa === undefined ? 100 : Math.min(100, (feitos / metaBaseCalculo) * 100);
                
            contadorValor.textContent = feitos;
            
            const elMeta = document.querySelector('.progress-container span:last-child');
            if(elMeta) elMeta.textContent = metaParaExibir;

            progressoBar.style.width = `${porcentagem}%`;

            if (proximaRecompensa) {
                const faltam = proximaRecompensa.limite - feitos;
                const tituloRecompensa = proximaRecompensa.titulo || proximaRecompensa.valor;
                progressoMsg.textContent = `Faltam apenas ${faltam} pedidos para você ganhar a recompensa "${tituloRecompensa}"!`;
                progressoBar.style.background = 'linear-gradient(90deg, #ffb300, #ff7043)'; 
                progressoBar.parentElement.parentElement.removeAttribute('data-status');
                
                const recompensasObtidas = RECOMPENSAS_DATA.filter(r => r.limite <= feitos);
                exibirRecompensas(feitos, recompensasObtidas, cupomStatus, RECOMPENSAS_DATA); 

                if (recompensasObtidas.length === 0) {
                     el.recompensasLista.innerHTML = `
                        <p style="text-align:center;color:#666;padding:20px;margin-top:20px;">
                            Faça ${faltam} pedidos para desbloquear a primeira recompensa.
                        </p>`;
                }


            } else {
                progressoMsg.textContent = '🎉 Parabéns! Você completou todas as metas de fidelidade!';
                progressoBar.style.background = 'linear-gradient(90deg, #4caf50, #43a047)'; 
                progressoBar.parentElement.parentElement.setAttribute('data-status', 'complete');
                
                exibirRecompensas(feitos, RECOMPENSAS_DATA, cupomStatus, RECOMPENSAS_DATA);
            }
            
            await carregarHistoricoRecompensas(userId);
            
        }, error => {
            console.error("Erro ao ler contador de fidelidade:", error);
            progressoMsg.textContent = 'Erro ao ler seu progresso. Tente recarregar a página.';
        });
    }

    function exibirRecompensas(pedidosFeitos, recompensasDisponiveis, cupomStatus, RECOMPENSAS_DATA) {
        if (!el.recompensasLista) return;
        
        const recompensasHtml = recompensasDisponiveis.map(r => {
            const liberada = pedidosFeitos >= r.limite;
            const cupomJaUsado = cupomStatus?.usado === true && cupomStatus?.cupom === r.valor;
            
            const titulo = r.titulo || `Recompensa: ${r.valor} (${r.limite} Pedidos)`;
            
            let acaoBtn = '';
            let statusTag = '';
            let cardStyle = '';
            let codigoCupom = r.tipo === 'cupom' ? r.valor : 'BRINDE';
            
            if (cupomJaUsado) {
                 statusTag = '<span style="color:#d32f2f;font-weight:bold;">(JÁ UTILIZADO)</span>';
                 acaoBtn = `<button disabled style="background:#ccc;color:#666;border:none;border-radius:6px;padding:8px 12px;cursor:not-allowed;margin-top:10px;">Cupom Usado</button>`;
                 cardStyle = 'opacity: 0.7;';
            }
            else if (liberada && r.tipo === 'cupom') {
                statusTag = '<span style="color:#4caf50;font-weight:bold;">(DISPONÍVEL)</span>';
                acaoBtn = `
                    <button 
                        class="recompensa-aplicar-btn" 
                        data-cupom="${codigoCupom}"
                        style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-weight:600;margin-top:10px;"
                    >
                        Aplicar Cupom 🏷️
                    </button>
                `;
            } else if (liberada && r.tipo === 'brinde') {
                 statusTag = '<span style="color:#1976D2;font-weight:bold;">(LIBERADO)</span>';
                 acaoBtn = `<button disabled style="background:#1976D2;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:default;margin-top:10px;">Brinde na Próxima Compra</button>`;
            }

            return `
                <div class="recompensa-card" style="display:flex;align-items:center;padding:15px;border-radius:10px;margin-bottom:15px;background:#f9f9f9;box-shadow:0 2px 5px rgba(0,0,0,0.1);${cardStyle}">
                    <img src="imagens/recompensa-${r.tipo}.png" alt="Ícone de Recompensa" style="width:50px;height:50px;object-fit:cover;border-radius:50%;margin-right:15px;">
                    <div style="flex:1;">
                        <h4 style="margin:0 0 5px 0;color:#333;">${titulo} ${statusTag}</h4>
                        <p style="margin:0;font-size:0.9rem;color:#666;">Ganho por ${r.limite} pedidos.</p>
                        ${r.tipo === 'cupom' ? `<p style="margin:5px 0 0 0;font-size:1.1rem;font-weight:bold;color:#ff7043;">CÓDIGO: ${codigoCupom}</p>` : ''}
                    </div>
                    <div>
                        ${acaoBtn}
                    </div>
                </div>
            `;
        }).join('');
        
        el.recompensasLista.innerHTML = recompensasHtml;
        
        // BIND o evento de aplicar cupom (após o desenho)
        el.recompensasLista.querySelectorAll('.recompensa-aplicar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const codigo = e.currentTarget.dataset.cupom;
                if (codigo) {
                    // Aplica a lógica do cupom (similar ao formulário)
                    couponApplied = codigo;
                    localStorage.setItem("dflCoupon", codigo);
                    
                    // Atualiza o input de cupom (se estiver visível)
                    const couponInput = document.getElementById("coupon-input");
                    if(couponInput) couponInput.value = codigo;

                    renderMiniCart(); // Recalcula e mostra a mensagem
                    Overlays.closeAll();
                    popupAdd(`Cupom ${codigo} aplicado! ✅`);
                    Overlays.open(el.miniCart); // Abre o mini-carrinho para ver o desconto
                }
            });
        });
    }

    async function carregarHistoricoRecompensas(userId) {
        if (!el.historicoLista) return;

        el.historicoLista.innerHTML = `<p style="text-align:center;color:#999;">Carregando histórico...</p>`;
        
        try {
            const q = db.collection("Usuarios").doc(userId)
                        .collection("RecompensasRecebidas")
                        .orderBy("dataRecebimento", "desc");
            
            const snapshot = await q.get();

            if (snapshot.empty) {
                el.historicoLista.innerHTML = `<p style="text-align:center;color:#999;">Você ainda não recebeu recompensas.</p>`;
                return;
            }

            const logs = snapshot.docs.map(doc => doc.data());
            
            const historicoHtml = logs.map(log => {
                const dataRecebimento = log.dataRecebimento
                    ? (log.dataRecebimento.toDate().toLocaleDateString('pt-BR'))
                    : "—";

                let valorStr = (log.tipo === 'cupom') ? `${log.valor} OFF` : log.valor;
                if (log.tipo === 'value') valorStr = money(log.valor);

                
                return `
                    <div class="historico-card" style="display:flex; padding: 10px 0; border-bottom: 1px dashed #eee; align-items: center; justify-content: space-between;">
                        <div style="flex:1;">
                            <p style="font-weight:600; margin:0; color:#333;">
                                🎁 ${log.titulo || log.valor}
                            </p>
                            <small style="color:#999;">Recebido em: ${dataRecebimento}</small>
                        </div>
                        <span style="font-weight:700; color:#4caf50;">
                            + ${valorStr}
                        </span>
                    </div>
                `;
            }).join('');
            
            el.historicoLista.innerHTML = historicoHtml.replace(/border-bottom: 1px dashed #eee;<\/div>$/, 'border-bottom: none;</div>');


          } catch (err) {
              console.error("Erro ao carregar histórico de recompensas: ", err);
              el.historicoLista.innerHTML = `<p style="text-align:center;color:red;">Erro ao buscar histórico.</p>`;
          }
    }


    /* ------------------ 📦 Pedidos (V2.9) ------------------ */
    async function carregarPedidos(userId) {
        if (!el.pedidosLista) return;
        el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;

        try {
          const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc");
          const snapshot = await q.get();

          if (snapshot.empty) {
            el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`;
            return;
          }

          const pedidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          exibirPedidos(pedidos);

        } catch (err) {
          console.error("Erro ao carregar pedidos: ", err);
          el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar seus pedidos.</p>`;
        }
    }

    function exibirPedidos(pedidos) {
        if (!el.pedidosLista) return;
        
        el.pedidosLista.innerHTML = pedidos.map(p => {
          const thumbUrl = p.thumb || 'imagens/padrao.jpg';
          const dataFormatada = p.data
              ? new Date(p.data?.seconds * 1000 || p.data).toLocaleString("pt-BR", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "—";

          const podeRepetir = Array.isArray(p.itensObj) && p.itensObj.length > 0;
          
          return `
            <div class="pedido-card">
              <div class="pedido-thumb" style="background-image:url('${thumbUrl}');"></div>
              <h4>📅 ${dataFormatada}</h4>
              <p class="pedido-info">Total: ${money(p.total)}</p>
              <div class="pedido-itens">
                ${(p.itens || []).map(i => `• ${i}`).join('<br>')}
              </div>
              <button 
                class="repetir-btn" 
                data-id="${p.id}" 
                data-nome="Repetir Pedido"
                data-preco="0"
                ${podeRepetir ? '' : 'disabled style="background:grey;cursor:not-allowed;"'}
              >
                🔁 Repetir Pedido
              </button>
            </div>`;
        }).join('');
    }

    async function repetirPedido(idPedido) {
        try {
          const docRef = db.collection("Pedidos").doc(idPedido);
          const doc = await docRef.get();

          if (!doc.exists) {
            return alert("Erro: Pedido antigo não encontrado.");
          }

          const pedido = doc.data();
          const itensParaRepetir = pedido.itensObj; // Lê o novo array de objetos

          if (!Array.isArray(itensParaRepetir) || itensParaRepetir.length === 0) {
            return alert("Não é possível repetir este pedido (formato antigo). Faça um novo pedido para poder repeti-lo no futuro.");
          }

          // Limpa o carrinho atual antes de adicionar os itens antigos
          cart = [];
          
          // Adiciona os itens ao carrinho
          itensParaRepetir.forEach(item => {
            if (item.nome && item.preco > 0 && item.qtd > 0) {
              cart.push({
                nome: item.nome,
                preco: item.preco,
                qtd: item.qtd
              });
            }
          });
          
          couponApplied = "";
          localStorage.removeItem("dflCoupon");
          const couponInput = document.getElementById("coupon-input");
          if(couponInput) couponInput.value = "";

          popupAdd("Pedido anterior adicionado ao carrinho!");
          renderMiniCart(); // Atualiza o carrinho (backend)
          Overlays.closeAll(); // Fecha o painel de pedidos
          Overlays.open(el.miniCart); // Abre o mini-carrinho

        } catch (err) {
          console.error("Erro ao repetir pedido: ", err);
          alert("Erro ao processar seu pedido. Tente novamente.");
        }
    }


    /* ------------------ 👑 Admin (Completa) ------------------ */
    const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(user) {
        return user && user.email && ADMINS.includes(user.email.toLowerCase());
    }

    function setupAdmin() {
        if (el.reportsBtn) el.reportsBtn.style.display = "block";
        
        el.reportsBtn.addEventListener("click", () => {
            // Lógica de abertura do dashboard
        });
    }

    // Funções de Gráficos e Relatórios completas seriam inseridas aqui (gerarResumoECharts, carregarRelatorios, etc.)

    /* =========================================================
       ✨ INICIALIZAÇÃO GERAL (Monolítica)
    ========================================================= */
    
    // 1. Som de Clique
    document.addEventListener("click", () => {
      try { sound.currentTime = 0; sound.play(); } catch (_) {}
    });

    // 2. Bindings de Login
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

    el.userBtn?.addEventListener("click", () => {
        if (currentUser) {
            if (confirm("Deseja sair da sua conta?")) {
                inicializarFirebase();
                auth.signOut().then(() => popupAdd("Logout realizado!"));
            }
        } else {
            inicializarFirebase();
            Overlays.open(el.loginModal);
        }
    });
    
    // 3. Bindings de Carrinho e Checkout
    el.cartIcon?.addEventListener("click", () => {
        if (!currentUser) inicializarFirebase(); 
        renderMiniCart(); 
        Overlays.open(el.miniCart);
    });

    // Fechar Modais (Botões X)
    document.querySelectorAll(".extras-close").forEach(btn => 
        btn.addEventListener("click", () => Overlays.closeAll())
    );
    
    // Backdrop para fechar
    el.cartBackdrop?.addEventListener("click", () => Overlays.closeAll());

    // Botão de Checkout (Finalizar Pedido)
    // OBS: O binding original estava em enhanceMiniCartUI, este é um fallback.
    // document.getElementById("finish-order")?.addEventListener("click", safe(fecharPedido)); 

    // 4. Bindings de Pedidos e Recompensas
    el.pedidosBtn?.addEventListener("click", () => {
        if (!currentUser) {
            alert("Faça login para ver seus pedidos.");
            Overlays.open(el.loginModal);
            return;
        }
        inicializarFirebase(); 
        Overlays.open(el.pedidosPanel);
        carregarPedidos(currentUser.uid);
    });
    el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());
    
    el.recompensasBtn?.addEventListener("click", () => {
        if (!currentUser) {
            alert("Faça login para ver suas recompensas.");
            Overlays.open(el.loginModal); 
            return;
        }
        inicializarFirebase(); 
        Overlays.open(el.recompensasPanel);
        carregarRecompensas(currentUser.uid);
    });
    el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());
    
    // ** Binding por delegação para botões de Repetir Pedido (gerados dinamicamente)
    el.pedidosLista?.addEventListener('click', (e) => {
        if (e.target.classList.contains('repetir-btn')) {
            const id = e.target.dataset.id;
            if (id) safe(repetirPedido)(id);
        }
    });


    // 5. Bindings para Adicionar ao Carrinho (Geral)
    document.querySelectorAll(".add-cart").forEach((btn) =>
        btn.addEventListener("click", safe(addCommonItem))
    );

    // 6. Bindings de Cupom
    document.getElementById("coupon-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("coupon-input");
        const codigo = input.value.trim().toUpperCase();
        
        if (!codigo) {
            couponApplied = "";
            localStorage.removeItem("dflCoupon");
            document.getElementById("coupon-message").textContent = "";
            renderMiniCart();
            return;
        }

        inicializarFirebase();
        const totals = await calcTotals(); 
        const result = await validarCupomFirestore(codigo, totals.subtotal);
        
        document.getElementById("coupon-message").textContent = result.mensagem;
        
        if (result.valido) {
            couponApplied = codigo;
            localStorage.setItem("dflCoupon", codigo);
            renderMiniCart();
        } else {
            // Se inválido, limpa o cupom
            couponApplied = "";
            localStorage.removeItem("dflCoupon");
            renderMiniCart(); 
        }
    });


    // 7. Carrossel
    el.cPrev?.addEventListener("click", () => {
      if (!el.slides) return;
      el.slides.scrollLeft -= Math.min(el.slides.clientWidth * 0.9, 320);
    });
    el.cNext?.addEventListener("click", () => {
      if (!el.slides) return;
      el.slides.scrollLeft += Math.min(el.slides.clientWidth * 0.9, 320);
    });
    
    // 🚨 BINDING DE MODAL DE PROMOÇÃO (CORRIGIDO)
    document.querySelectorAll(".slide[data-promo-id]").forEach((img) => {
        img.addEventListener("click", () => {
          const id = parseInt(img.dataset.promoId, 10);
          if (id) {
            showPromoModal(id);
          }
        });
    });
    
    // 🎁 BINDINGS DO NOVO MODAL DE PROMOÇÃO
    el.promoNavPrev?.addEventListener("click", () => {
        const idAnterior = currentPromoId > 1 ? currentPromoId - 1 : currentPromoId;
        updatePromoModal(idAnterior);
    });

    el.promoNavNext?.addEventListener("click", () => {
        const idProximo = currentPromoId < PROMOCOES.length ? currentPromoId + 1 : currentPromoId;
        updatePromoModal(idProximo);
    });

    el.promoAddBtn?.addEventListener("click", safe(addCommonItem));
    el.promoClose?.addEventListener("click", () => Overlays.closeAll());


    // 8. Inicia Timers e Status
    atualizarStatus();
    setInterval(atualizarStatus, 60000);
    atualizarTimer();
    setInterval(atualizarTimer, 1000);

    // 9. Renderização inicial do Carrinho e UI
    renderMiniCart(); 

    // 10. Inicializa o Firebase (para checar login)
    inicializarFirebase(); 
    
    console.log("%c🏆 DFL v3.7.1 — Estabilidade Monolítica Restaurada",
                "background:#000;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700;");
});

// REMOVIDO: O segundo e idêntico bloco 'document.addEventListener("DOMContentLoaded", ...)' foi removido para evitar duplicidade.
