/* =========================================================  
   🌟 DFL v5.5.2 — CORREÇÃO COMPLETA DE REFERÊNCIAS
   - Corrige todas as referências quebradas do objeto 'el'
   - Remove dependências de elementos inexistentes
   - Garante inicialização segura
========================================================= */

// PARTE 1: FUNÇÕES AUXILIARES E MAPEAMENTO DE PRODUTOS

// Função para mapear todos os produtos do cardápio
function getProductsMap() {
    const allProducts = [];
    
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

// Distância de Levenshtein para Fuzzy Matching
function levenshteinDistance(s1, s2) {
    s1 = s1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    s2 = s2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const track = Array(s2.length + 1).fill(null).map(() =>
        Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }
    return track[s2.length][s1.length];
}

// Utilitários
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

// Popup de notificação
function popupAdd(msg) {
    let pop = document.querySelector(".popup-add");
    if (!pop) {
        pop = document.createElement("div");
        pop.className = "popup-add";
        pop.style.cssText = "position:fixed;top:100px;right:20px;background:#4CAF50;color:#fff;padding:12px 20px;border-radius:8px;font-weight:600;box-shadow:0 4px 10px rgba(0,0,0,0.3);z-index:10000;opacity:0;transition:opacity 0.3s;";
        document.body.appendChild(pop);
    }
    pop.textContent = msg;
    pop.style.opacity = '1';
    setTimeout(() => pop.style.opacity = '0', 2000);
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
/* PARTE 2: INICIALIZAÇÃO E VARIÁVEIS GLOBAIS */

document.addEventListener("DOMContentLoaded", () => {
    
    // CONSTANTES
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00;
    const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
    
    // VARIÁVEIS DE ESTADO
    let cart = [];
    let currentUser = null;
    let isFirebaseInitialized = false;
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
    let modoEnderecoManual = false;
    let configuracoesRecompensa = null;
    let todosProdutos = [];
    
    // SONS
    const sound = new Audio("click.wav");
    
    // MÁSCARA DE CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    // ELEMENTOS DO DOM - INICIALIZAÇÃO SEGURA
    const getElement = (id) => {
        const elem = document.getElementById(id);
        if (!elem) console.warn(`Elemento não encontrado: ${id}`);
        return elem;
    };
    
    const getElementSafe = (selector) => {
        const elem = document.querySelector(selector);
        if (!elem) console.warn(`Seletor não encontrado: ${selector}`);
        return elem;
    };

    const el = {
        cartIcon: getElement("cart-icon"),
        cartCount: getElement("cart-count"),
        miniCart: getElement("mini-cart"),
        miniList: getElementSafe(".mini-list"),
        miniFoot: getElementSafe(".mini-foot"),
        cartBackdrop: getElement("cart-backdrop"),
        extrasModal: getElement("extras-modal"),
        extrasList: getElementSafe("#extras-modal .extras-list"),
        extrasConfirm: getElement("extras-confirm"),
        loginModal: getElement("login-modal"),
        loginForm: getElement("login-form"),
        googleBtn: getElement("google-login"),
        userBtn: getElement("user-btn"),
        statusBanner: getElement("status-banner"),
        reportsBtn: getElement("reports-btn"),
        pedidosPanel: getElement("orders-panel"),
        pedidosLista: getElementSafe(".orders-list"),
        recompensasPanel: getElement("rewards-panel"),
        recompensasLista: getElementSafe(".rewards-list"),
        btnNaoSeiCEP: getElement("btnNaoSeiCEP"),
        manualArea: getElement("manualArea"),
        manualEndereco: getElement("manualEndereco"),
        manualNumero: getElement("manualNumero"),
        btnConfirmarEndereco: getElement("btnConfirmarEndereco"),
        btnVoltarCEP: getElement("btnVoltarCEP"),
        progressWrapper: getElement("progressWrapper"),
        progressText: getElement("progressText"),
        progressFill: getElement("progressFill"),
        cepInput: getElement("cep-input"),
        enderecoAuto: getElement("endereco-auto"),
        numeroInput: getElement("numero-input"),
        complementoInput: getElement("complemento-input"),
        retirarLocal: getElement("retirar-local")
    };

    // CRIAR BACKDROP SE NÃO EXISTIR
    if (!el.cartBackdrop) {
        const bd = document.createElement("div");
        bd.id = "cart-backdrop";
        bd.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.45);opacity:0;pointer-events:none;transition:opacity 0.25s ease;z-index:980;";
        document.body.appendChild(bd);
        el.cartBackdrop = bd;
    }

    // BACKDROP CONTROLLER
    const Backdrop = {
        show() {
            if (el.cartBackdrop) {
                el.cartBackdrop.classList.add("active");
                el.cartBackdrop.style.opacity = '1';
                el.cartBackdrop.style.pointerEvents = 'auto';
            }
            document.body.style.overflow = 'hidden';
        },
        hide() {
            if (el.cartBackdrop) {
                el.cartBackdrop.classList.remove("active");
                el.cartBackdrop.style.opacity = '0';
                el.cartBackdrop.style.pointerEvents = 'none';
            }
            document.body.style.overflow = '';
        }
    };

    // OVERLAYS CONTROLLER
    const Overlays = {
        closeAll() {
            document.querySelectorAll(".modal.show, #mini-cart.active, .side-panel.active")
                .forEach((e) => e.classList.remove("show", "active"));
            Backdrop.hide();
        },
        open(modalLike) {
            Overlays.closeAll();
            if (!modalLike) return;
            const className = (modalLike.id === "mini-cart" || modalLike.classList.contains("side-panel")) ? "active" : "show";
            modalLike.classList.add(className);
            Backdrop.show();
        }
    };

    // EVENT LISTENER PARA BACKDROP
    if (el.cartBackdrop) {
        el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());
    }
/* PARTE 3: BUSCA DE PRODUTOS */

    // Captura a lista de produtos após o DOM estar pronto
    setTimeout(() => {
        todosProdutos = getProductsMap();
        console.log(`📦 ${todosProdutos.length} produtos mapeados para busca`);
    }, 500);

    // CAMPO DE BUSCA
    const campoBusca = document.getElementById("campoBusca");
    const resultadoBusca = document.getElementById("resultadoBusca");

    if (campoBusca && resultadoBusca) {
        campoBusca.addEventListener("input", (e) => {
            const query = e.target.value.trim().toLowerCase();
            
            // Exibe todos os produtos se a busca estiver vazia
            if (query.length === 0) {
                todosProdutos.forEach(p => p.element.style.display = 'block');
                document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'block');
                resultadoBusca.innerHTML = '';
                return;
            }
            
            // FILTRAGEM
            const queryClean = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const produtosEncontrados = todosProdutos.filter(p => p.searchName.includes(queryClean));
            
            if (produtosEncontrados.length > 0) {
                // Esconde todos e mostra apenas encontrados
                todosProdutos.forEach(p => p.element.style.display = 'none');
                document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'none');
                
                produtosEncontrados.forEach(p => {
                    p.element.style.display = 'block';
                    const section = p.element.closest(".menu-section");
                    if (section) section.style.display = 'block';
                });
                
                resultadoBusca.innerHTML = `<div style="background:#e8f5e9;color:#2e7d32;padding:10px;border-radius:8px;margin:10px 0;text-align:center;font-weight:600;">✅ ${produtosEncontrados.length} resultado(s) encontrado(s)</div>`;
                
                setTimeout(() => {
                    produtosEncontrados[0].element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            } else {
                // FUZZY MATCHING
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
                
                if (sugestao) {
                    const linkSugestao = `<a href="javascript:void(0);" style="color:#1976d2;text-decoration:underline;cursor:pointer;" data-sugestao="${sugestao.name}">Você quis dizer: <b>${sugestao.name}</b>? Clique aqui.</a>`;
                    
                    resultadoBusca.innerHTML = `<div style="background:#fff3e0;color:#e65100;padding:12px;border-radius:8px;margin:10px 0;text-align:center;">${linkSugestao}</div>`;
                    
                    resultadoBusca.querySelector('a')?.addEventListener('click', (ev) => {
                        const termo = ev.currentTarget.dataset.sugestao;
                        if (termo) {
                            campoBusca.value = termo;
                            campoBusca.dispatchEvent(new Event('input'));
                        }
                    });
                } else {
                    resultadoBusca.innerHTML = `<div style="background:#ffebee;color:#c62828;padding:12px;border-radius:8px;margin:10px 0;text-align:center;font-weight:600;">❌ Nenhum produto encontrado com "<b>${query}</b>"</div>`;
                }
            }
        });
    }
/* PARTE 4: CARRINHO E BARRA DE PROGRESSO */

    // SUBTOTAL DO CARRINHO
    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

    // BARRA DE PROGRESSO
    function atualizarBarraProgresso() {
        const subtotal = getCartSubtotal();
        
        if (!el.progressText || !el.progressFill || !el.progressWrapper) return;

        const falta = LIMITE_FRETE_GRATIS - subtotal;
        const porcentagem = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
        
        el.progressFill.style.width = `${porcentagem}%`;

        if (subtotal >= LIMITE_FRETE_GRATIS) {
            el.progressText.innerHTML = `🎉 <strong>Oba!</strong> Você ganhou <strong>Frete Grátis</strong> nessa compra!`;
            el.progressFill.style.background = "linear-gradient(90deg, #4caf50, #2e7d32)";
            el.progressWrapper.style.background = "#e8f5e9";
            el.progressWrapper.style.borderColor = "#4caf50";
        } else if (falta <= 20) {
            el.progressText.innerHTML = `🔥 <strong>Quase lá!</strong> Falta apenas <strong>${money(falta)}</strong> para Frete Grátis!`;
            el.progressFill.style.background = "linear-gradient(90deg, #ff9800, #f57c00)";
            el.progressWrapper.style.background = "#fff3e0";
            el.progressWrapper.style.borderColor = "#ff9800";
        } else {
            el.progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> para Frete Grátis 🚀`;
            el.progressFill.style.background = "linear-gradient(90deg, #ffb300, #ff9800)";
            el.progressWrapper.style.background = "#fff8d6";
            el.progressWrapper.style.borderColor = "#ffca28";
        }
    }

    // RENDER MINI CART
    function renderMiniCart() {
        if (!el.miniList) return;
        
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
        if (el.cartCount) el.cartCount.textContent = totalItens;

        atualizarBarraProgresso();

        if (!cart.length) {
            el.miniList.innerHTML = `
                <div class="cart-empty-msg">
                    <div>🛒 Seu carrinho está vazio</div>
                    <div>Adicione itens para começar seu pedido</div>
                </div>`;
            
            if (el.miniFoot) {
                el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
            }
            
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

        bindMiniCartButtons();
        enhanceMiniCartUI();
    }

    // BOTÕES DO MINI CART
    function bindMiniCartButtons() {
        if (!el.miniList) return;
        
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

    // CART ICON CLICK
    if (el.cartIcon) {
        el.cartIcon.addEventListener("click", () => {
            renderMiniCart();
            Overlays.open(el.miniCart);
        });
    }

    // CLOSE BUTTONS
    document.querySelectorAll(".extras-close, .close-panel").forEach(btn => {
        btn.addEventListener("click", () => Overlays.closeAll());
    });
/* PARTE 5: FIREBASE E AUTENTICAÇÃO */

    // FIREBASE CONFIG
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
            if (!window.firebase) throw new Error("Firebase não carregado");
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            isFirebaseInitialized = true;
            setupAuthListener();
            console.log("✅ Firebase inicializado com sucesso");
        } catch (error) {
            console.error("❌ ERRO AO INICIAR FIREBASE:", error);
            popupAdd("Erro de conexão. Recarregue a página.");
        }
    }

    function setupAuthListener() {
        if (!auth) return;
        
        auth.onAuthStateChanged(user => {
            currentUser = user;
            
            if (el.userBtn) {
                if (user) {
                    el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
                } else {
                    el.userBtn.textContent = "Entrar / Cadastrar";
                }
            }
            
            // Botões de pedidos e recompensas
            const pedidosContainer = document.querySelector(".meus-pedidos");
            const recompensasContainer = document.querySelector(".minhas-recompensas");
            
            if (pedidosContainer) pedidosContainer.style.display = user ? 'block' : 'none';
            if (recompensasContainer) recompensasContainer.style.display = user ? 'block' : 'none';
            
            // Admin
            if (user && isAdmin(user)) {
                createAdminFab();
            } else {
                if (el.reportsBtn) el.reportsBtn.style.display = "none";
                document.getElementById("admin-dashboard")?.remove();
            }
        });
    }

    // LOGIN
    const handleLoginSuccess = (user) => {
        currentUser = user;
        popupAdd("Login realizado com sucesso!");
        Overlays.closeAll();
    };

    const handleLoginError = (err) => {
        if (err.code === "auth/user-not-found") {
            if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
                const email = document.getElementById("login-email")?.value?.trim();
                const senha = document.getElementById("login-password")?.value?.trim();
                
                auth.createUserWithEmailAndPassword(email, senha)
                    .then((cred) => handleLoginSuccess(cred.user))
                    .catch((e) => alert("Erro: " + e.message));
            }
        } else if (err.code === "auth/wrong-password") {
            alert("Senha incorreta. Tente novamente.");
        } else {
            alert("Erro: " + err.message);
        }
    };

    // LOGIN EMAIL
    const loginEmailBtn = document.getElementById("login-email-btn");
    if (loginEmailBtn) {
        loginEmailBtn.addEventListener("click", () => {
            inicializarFirebase();
            if (!isFirebaseInitialized) return alert("Erro ao conectar.");
            
            const email = document.getElementById("login-email")?.value?.trim();
            const senha = document.getElementById("login-password")?.value?.trim();
            
            if (!email || !senha) return alert("Preencha e-mail e senha.");
            
            auth.signInWithEmailAndPassword(email, senha)
                .then((cred) => handleLoginSuccess(cred.user))
                .catch(handleLoginError);
        });
    }

    // LOGIN GOOGLE
    if (el.googleBtn) {
        el.googleBtn.addEventListener("click", () => {
            inicializarFirebase();
            if (!isFirebaseInitialized) return alert("Erro ao conectar.");
            
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((res) => handleLoginSuccess(res.user))
                .catch((err) => alert("Erro: " + err.message));
        });
    }

    // USER BUTTON
    if (el.userBtn) {
        el.userBtn.addEventListener("click", () => Overlays.open(el.loginModal));
    }

    // ADMIN CHECK
    function isAdmin(user) {
        return user && user.email && ADMINS.includes(user.email.toLowerCase());
    }

    function createAdminFab() {
        if (!el.reportsBtn) return;
        el.reportsBtn.style.display = "block";
        el.reportsBtn.addEventListener("click", () => {
            popupAdd("Função de relatórios em desenvolvimento");
        });
    }

    // INICIALIZAR FIREBASE AO CARREGAR
    inicializarFirebase();

    // CUPOM FORM
    const couponForm = document.getElementById("coupon-form");
    if (couponForm) {
        couponForm.addEventListener("submit", (e) => {
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
    }
/* PARTE 6: ADICIONAIS, ENDEREÇOS E FINALIZAÇÃO */

    // ADICIONAIS
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
            <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;margin-bottom:8px;cursor:pointer;">
                <span style="font-weight:600;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>
                <input type="checkbox" value="${i}">
            </label>
        `).join("");
        
        Overlays.open(el.extrasModal);
    });

    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
    );

    if (el.extrasConfirm) {
        el.extrasConfirm.addEventListener("click", () => {
            if (!produtoExtras) return Overlays.closeAll();
            
            const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
            const extrasContagem = {};
            
            checks.forEach(c => {
                const idx = +c.value;
                const adicional = adicionais[idx];
                if (extrasContagem[adicional.nome]) {
                    extrasContagem[adicional.nome].qtd++;
                } else {
                    extrasContagem[adicional.nome] = { preco: adicional.preco, qtd: 1 };
                }
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
    }

    // ADD CART DIRETO
    function addCommonItem(nome, preco) {
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

    // ENDEREÇO MANUAL
    if (el.btnNaoSeiCEP) {
        el.btnNaoSeiCEP.addEventListener("click", () => {
            window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank");
        });
    }

    if (el.btnVoltarCEP) {
        el.btnVoltarCEP.addEventListener("click", () => {
            modoEnderecoManual = false;
            const freteContainer = document.querySelector('.frete-container');
            if (freteContainer) freteContainer.style.display = 'block';
            if (el.manualArea) el.manualArea.style.display = 'none';
            renderMiniCart();
        });
    }

    // BUSCAR CEP VIA VIACEP
    async function buscarCEP(cep) {
        const freteContainer = document.querySelector('.frete-container');
        
        try {
            popupAdd("Buscando endereço...");
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro || !response.ok) {
                popupAdd("CEP não encontrado");
                if (el.enderecoAuto) el.enderecoAuto.value = "CEP não encontrado. Preencha manualmente.";
            } else {
                const localidade = `${data.localidade || 'Cidade'}/${data.uf || 'UF'}`;
                const endereco = `${data.logradouro || 'Rua'} - ${data.bairro || 'Bairro'} (${localidade})`;
                
                if (el.enderecoAuto) {
                    el.enderecoAuto.value = endereco;
                    el.enderecoAuto.disabled = true;
                }
                
                if (el.numeroInput) {
                    el.numeroInput.disabled = false;
                    el.numeroInput.focus();
                }
                if (el.complementoInput) el.complementoInput.disabled = false;
                if (el.retirarLocal) el.retirarLocal.disabled = false;
                
                popupAdd("Endereço encontrado! ✅");
                renderMiniCart();
            }
        } catch (error) {
            console.error("ViaCEP Error:", error);
            popupAdd("Erro ao consultar CEP");
        }
    }

    const btnCalcularFrete = document.getElementById('btn-calcular-frete');
    if (btnCalcularFrete) {
        btnCalcularFrete.addEventListener('click', () => {
            const cep = el.cepInput?.value.trim().replace(/\D/g, '') || '';
            if (cep.length === 8) buscarCEP(cep);
            else popupAdd("CEP deve ter 8 dígitos");
        });
    }

    // FRETE DINÂMICO
    async function getDynamicDeliveryFee(enderecoCompleto) {
        if (!enderecoCompleto) return DELIVERY_FEE_DEFAULT;
        return DELIVERY_FEE_DEFAULT; // Simplificado para evitar erros
    }

    // CÁLCULO DE TOTAIS
    async function calcTotals() {
        const subtotal = getCartSubtotal();
        const isRetirarLocal = el.retirarLocal?.checked || false;
        
        let deliveryFee = DELIVERY_FEE_DEFAULT;
        
        if (isRetirarLocal || subtotal >= LIMITE_FRETE_GRATIS) {
            deliveryFee = 0;
        }
        
        const delivery = deliveryFee;
        const discount = 0; // Simplificado
        const total = Math.max(0, subtotal + delivery - discount);
        
        return { subtotal, delivery, discount, total };
    }

    // UI DO MINI CART
    async function enhanceMiniCartUI() {
        if (!el.miniFoot || cart.length === 0) return;
        
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
        
        const { subtotal, delivery, discount, total } = await calcTotals();
        const deliveryLabel = delivery === 0 ? "Grátis 🎉" : money(delivery);
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'cart-summary-generated';
        summaryDiv.innerHTML = `
            <div style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                    <span>Subtotal</span><b>${money(subtotal)}</b>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                    <span>Entrega</span><b>${deliveryLabel}</b>
                </div>
                <div style="display:flex;justify-content:space-between;border-top:1px solid #eee;padding-top:10px;font-size:1.1rem;margin-bottom:10px;">
                    <span><b>Total</b></span>
                    <span style="color:#e53935;font-weight:800;">${money(total)}</span>
                </div>
            </div>
            <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px;">Finalizar Pedido 🛍️</button>
            <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer;">Limpar Carrinho</button>
        `;
        
        el.miniFoot.appendChild(summaryDiv);
        
        summaryDiv.querySelector("#finish-order")?.addEventListener("click", () => {
            if (!cart.length) return alert("Carrinho vazio!");
            if (!currentUser) {
                alert("Faça login para continuar!");
                Overlays.open(el.loginModal);
                return;
            }
            
            const linhas = [
                "🍔 *Pedido DFL*",
                cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"),
                "",
                `*Total: ${money(total)}*`
            ].join("\n");
            
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(linhas)}`, "_blank");
            
            cart = [];
            renderMiniCart();
            Overlays.closeAll();
            popupAdd("Pedido enviado! ✅");
        });
        
        summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {
            if (confirm("Limpar todo o carrinho?")) {
                cart = [];
                renderMiniCart();
                popupAdd("Carrinho limpo!");
            }
        });
    }

    // STATUS BANNER
    const atualizarStatus = () => {
        const agora = new Date();
        const h = agora.getHours();
        const aberto = h >= 18 && h < 23;
        
        if (el.statusBanner) {
            el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!";
            el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`;
        }
    };
    
    atualizarStatus();
    setInterval(atualizarStatus, 60000);

    // COOKIES BANNER
    const cookieBanner = document.getElementById("cookie-banner");
    const cookieAcceptBtn = document.getElementById("cookie-accept");
    
    if (cookieBanner && cookieAcceptBtn) {
        if (localStorage.getItem("dfl-cookies-accepted") === "true") {
            cookieBanner.style.display = "none";
        } else {
            cookieBanner.classList.add("show");
        }
        
        cookieAcceptBtn.addEventListener("click", () => {
            localStorage.setItem("dfl-cookies-accepted", "true");
            cookieBanner.classList.remove("show");
        });
    }

    // RENDER INICIAL
    renderMiniCart();
    
    console.log("%c✅ DFL v5.5.2 — Sistema Carregado com Sucesso!", "background:#4CAF50;color:#fff;padding:8px;border-radius:5px;font-size:14px;font-weight:bold;");

}); // FIM DOMContentLoaded