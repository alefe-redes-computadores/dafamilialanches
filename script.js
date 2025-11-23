/* =========================================================
   🚀 DFL v6.1 — VERSÃO DEFINITIVA (Misto Completo)
   - Funcionalidades: Busca, Barra Progresso, Endereço Manual
   - Sistemas: Admin, Recompensas, Motoboy, Login Firebase
   - Estrutura: Compatível com Grade HTML (sem renderização JS)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* ------------------ 🎭 MÁSCARAS & UTILITÁRIOS ------------------ */
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };
    const sound = new Audio("click.wav");

    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    /* ------------------ 🔍 SISTEMA DE BUSCA (INTELIGENTE) ------------------ */
    function getProductsMap() {
        const allProducts = [];
        // Mapeia todos os produtos que já existem no HTML
        document.querySelectorAll(".menu-section .card[data-name]").forEach(card => {
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);
            allProducts.push({
                name: name,
                searchName: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                price: price,
                element: card
            });
        });
        return allProducts;
    }

    // Algoritmo de Levenshtein para corrigir erros de digitação
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

    const campoBusca = document.getElementById("campoBusca");
    const resultadoBusca = document.getElementById("resultadoBusca");
    let todosProdutos = [];

    // Inicializa o mapeamento após 1s para garantir que o HTML carregou
    setTimeout(() => { try { todosProdutos = getProductsMap(); } catch(e){} }, 1000);

    if(campoBusca) {
        campoBusca.addEventListener("input", (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (todosProdutos.length === 0) todosProdutos = getProductsMap();

            // Se busca vazia, mostra tudo
            if (query.length === 0) {
                todosProdutos.forEach(p => p.element.style.display = 'block');
                document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'block');
                if(resultadoBusca) resultadoBusca.innerHTML = '';
                return;
            }
            
            const queryClean = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const produtosEncontrados = todosProdutos.filter(p => p.searchName.includes(queryClean));
            
            if (produtosEncontrados.length > 0) {
                // Esconde tudo e mostra só o match
                todosProdutos.forEach(p => p.element.style.display = 'none');
                document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'none');
                produtosEncontrados.forEach(p => {
                    p.element.style.display = 'block';
                    p.element.closest(".menu-section").style.display = 'block';
                });
                if(resultadoBusca) {
                    resultadoBusca.innerHTML = `<div class="feedback-busca success">✅ ${produtosEncontrados.length} produto(s) encontrado(s).</div>`;
                }
            } else {
                // Tenta achar sugestão (ex: "hamburquer" -> "hamburguer")
                let sugestao = null;
                let menorDistancia = Infinity;
                for (const produto of todosProdutos) {
                    const dist = levenshteinDistance(queryClean, produto.searchName);
                    // Aceita erro de até 30% do tamanho da palavra
                    if (dist < menorDistancia && dist <= Math.max(2, Math.floor(produto.searchName.length * 0.3))) { 
                        menorDistancia = dist;
                        sugestao = produto;
                    }
                }
                
                // Esconde tudo
                todosProdutos.forEach(p => p.element.style.display = 'none');
                document.querySelectorAll(".menu-section").forEach(s => s.style.display = 'none');
                
                if (sugestao && resultadoBusca) {
                    resultadoBusca.innerHTML = `<div class="feedback-busca sugestao"><a href="#" id="linkSugestao">Você quis dizer: <b>${sugestao.name}</b>?</a></div>`;
                    document.getElementById('linkSugestao').addEventListener('click', (ev) => {
                        ev.preventDefault();
                        campoBusca.value = sugestao.name;
                        campoBusca.dispatchEvent(new Event('input'));
                    });
                } else if (resultadoBusca) {
                    resultadoBusca.innerHTML = `<div class="feedback-busca erro">Nenhum produto encontrado.</div>`;
                }
            }
        });
    }

    /* ------------------ ⚙️ VARIÁVEIS GLOBAIS ------------------ */
    let cart = [];
    let currentUser = null;
    let isFirebaseInitialized = false;
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00;
    let modoEnderecoManual = false; // Controle do toggle CEP/Manual

    // Elementos principais
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
        // Barra Progresso
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill"),
        // Manual vs CEP
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        btnManual: document.getElementById("btnManual")
    };

    /* ------------------ 🌫️ INTERFACE & OVERLAYS ------------------ */
    if (!el.cartBackdrop) {
        const bd = document.createElement("div");
        bd.id = "cart-backdrop";
        document.body.appendChild(bd);
        el.cartBackdrop = bd;
    }

    const Overlays = {
        closeAll() {
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach((e) => e.classList.remove("show", "active"));
            if(el.cartBackdrop) el.cartBackdrop.classList.remove("active");
            document.body.classList.remove("no-scroll");
        },
        open(modalLike) {
            Overlays.closeAll();
            if (!modalLike) return;
            modalLike.classList.add(
                (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
            );
            if(el.cartBackdrop) el.cartBackdrop.classList.add("active");
            document.body.classList.add("no-scroll");
        },
    };
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

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

    /* ------------------ 🔥 FIREBASE SETUP ------------------ */
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
            if (!window.firebase) throw new Error("Firebase SDK não carregado.");
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            isFirebaseInitialized = true;
            setupAuthListener();
        } catch (error) {
            console.error("Erro Firebase:", error);
        }
    }

    function setupAuthListener() {
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'block';
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'block';
                
                // Checa Admin
                if (isAdmin(user)) {
                    if (el.reportsBtn) createAdminFab();
                } else {
                    if (el.reportsBtn) el.reportsBtn.style.display = "none";
                }
                // Checa Motoboy
                checkMotoboyAccess(user);

            } else {
                el.userBtn.textContent = "Entrar / Cadastrar";
                if (el.pedidosContainer) el.pedidosContainer.style.display = 'none';
                if (el.recompensasContainer) el.recompensasContainer.style.display = 'none';
                checkMotoboyAccess(null);
            }
        });
    }

    // Login Events
    el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));
    el.loginForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        inicializarFirebase();
        const email = document.getElementById("login-email")?.value?.trim();
        const senha = document.getElementById("login-senha")?.value?.trim();
        if(!email || !senha) return alert("Preencha tudo.");
        auth.signInWithEmailAndPassword(email, senha).then(() => {
            popupAdd("Login realizado!"); Overlays.closeAll();
        }).catch(err => alert("Erro: " + err.message));
    });

    /* ------------------ 🛒 CARRINHO & PROGRESSO ------------------ */
    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

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
            progressText.innerHTML = `🎉 <strong>Frete Grátis</strong> conquistado!`;
            progressFill.style.background = "#4caf50";
        } else {
            progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> para Frete Grátis`;
            progressFill.style.background = "#ff9800";
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
            return;
        }

        el.miniList.innerHTML = cart.map((item, idx) => `
            <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="flex:1;">
                        <p style="font-weight:600;font-size:0.9rem;">${item.nome}</p>
                        <p style="color:#666;font-size:0.8rem;">${money(item.preco)} x ${item.qtd}</p>
                    </div>
                    <div style="display:flex;gap:5px;align-items:center;">
                        <button class="cart-minus" data-idx="${idx}">−</button>
                        <span>${item.qtd}</span>
                        <button class="cart-plus" data-idx="${idx}">+</button>
                        <button class="cart-remove" data-idx="${idx}">🗑</button>
                    </div>
                </div>
            </div>
        `).join("");
        
        // Re-bind buttons inside cart
        el.miniList.querySelectorAll(".cart-plus").forEach(b => b.onclick = (e) => { cart[e.target.dataset.idx].qtd++; renderMiniCart(); });
        el.miniList.querySelectorAll(".cart-minus").forEach(b => b.onclick = (e) => { 
            const i = e.target.dataset.idx;
            if(cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1);
            renderMiniCart();
        });
        el.miniList.querySelectorAll(".cart-remove").forEach(b => b.onclick = (e) => { cart.splice(e.target.dataset.idx, 1); renderMiniCart(); });

        enhanceMiniCartUI(); // Atualiza totais
    }

    el.cartIcon?.addEventListener("click", () => { renderMiniCart(); Overlays.open(el.miniCart); });

    /* ------------------ 🏠 LÓGICA DE ENDEREÇO (Híbrida) ------------------ */
    el.btnNaoSeiCEP?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank"));
    
    el.btnManual?.addEventListener("click", () => {
        modoEnderecoManual = true;
        document.querySelector('.frete-container').style.display = 'none';
        el.manualArea.style.display = 'block';
    });

    el.btnVoltarCEP?.addEventListener("click", () => {
        modoEnderecoManual = false;
        document.querySelector('.frete-container').style.display = 'block';
        el.manualArea.style.display = 'none';
        renderMiniCart(); // Recalcula frete
    });

    el.btnConfirmarEndereco?.addEventListener("click", async () => {
        const endereco = el.manualEndereco?.value?.trim();
        if (!endereco) return popupAdd("Digite seu endereço!");
        popupAdd("Calculando taxa...");
        await enhanceMiniCartUI(); // Isso dispara o cálculo de frete
    });

    async function getDynamicDeliveryFee(endereco) {
        if(!endereco) return DELIVERY_FEE_DEFAULT;
        // Tenta extrair bairro: "Rua X - Bairro Y"
        let bairro = endereco;
        if(endereco.includes("-")) {
            const parts = endereco.split("-");
            bairro = parts[parts.length - 1].trim();
        }
        bairro = bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Aqui conectaria no Firebase "TaxasDeEntrega", mas vamos usar fallback por enquanto
        // Se tiver a lógica de cache do Firebase, pode descomentar.
        return DELIVERY_FEE_DEFAULT; 
    }

    /* ------------------ 💰 TOTAIS & CUPOM ------------------ */
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();

    async function calcTotals() {
        const subtotal = getCartSubtotal();
        let deliveryFee = DELIVERY_FEE_DEFAULT;
        let enderecoParaCalculo = "";

        if (modoEnderecoManual) {
            enderecoParaCalculo = el.manualEndereco?.value?.trim();
        } else {
            const cepVal = document.getElementById('cep-input')?.value;
            if(cepVal && cepVal.length >= 9) enderecoParaCalculo = "CEP:" + cepVal;
        }

        const isRetirar = document.getElementById('retirar-local')?.checked;

        if (isRetirar || subtotal >= LIMITE_FRETE_GRATIS) {
            deliveryFee = 0;
        } else if (enderecoParaCalculo) {
            // Se tiver endereço, tenta calcular dinâmico
            deliveryFee = await getDynamicDeliveryFee(enderecoParaCalculo);
        }

        // Lógica simples de cupom (placeholder para a lógica completa do Firebase)
        let discount = 0;
        if(couponApplied === "BEMVINDO") discount = subtotal * 0.10; // Exemplo

        const total = Math.max(0, subtotal + deliveryFee - discount);
        return { subtotal, delivery: deliveryFee, discount, total };
    }

    async function enhanceMiniCartUI() {
        if (!el.miniFoot) return;
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
        if (!cart.length) return;

        const totals = await calcTotals();
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'cart-summary-generated';
        summaryDiv.innerHTML = `
            <div class="summary-row"><span>Subtotal</span><b>${money(totals.subtotal)}</b></div>
            <div class="summary-row"><span>Entrega</span><b>${totals.delivery === 0 ? "Grátis" : money(totals.delivery)}</b></div>
            ${totals.discount > 0 ? `<div class="summary-row" style="color:green"><span>Desconto</span><b>-${money(totals.discount)}</b></div>` : ''}
            <div class="summary-row total"><span>Total</span><b>${money(totals.total)}</b></div>
            <button id="finish-order">Finalizar Pedido ✅</button>
            <button id="clear-cart" style="background:#d32f2f;margin-top:5px;">Limpar</button>
        `;
        
        el.miniFoot.appendChild(summaryDiv);
        summaryDiv.querySelector("#finish-order").onclick = fecharPedido;
        summaryDiv.querySelector("#clear-cart").onclick = () => { cart = []; renderMiniCart(); };
    }

    /* ------------------ 📝 FECHAR PEDIDO (WHATSAPP + FIREBASE) ------------------ */
    async function fecharPedido() {
        if(!currentUser) { alert("Faça login primeiro!"); Overlays.open(el.loginModal); return; }
        
        const isRetirar = document.getElementById('retirar-local')?.checked;
        let enderecoFinal = "";
        
        if(isRetirar) {
            enderecoFinal = "RETIRAR NO LOCAL";
        } else if (modoEnderecoManual) {
            const rua = el.manualEndereco?.value;
            const num = el.manualNumero?.value;
            if(!rua || !num) return alert("Preencha endereço e número!");
            enderecoFinal = `${rua}, Nº ${num} (Manual)`;
        } else {
            const autoEnd = document.getElementById("endereco-auto")?.value;
            const autoNum = document.getElementById("numero-input")?.value;
            if(!autoEnd || !autoNum) return alert("Preencha o CEP e número!");
            enderecoFinal = `${autoEnd}, Nº ${autoNum}`;
        }

        const totals = await calcTotals();
        
        // Salvar no Firebase
        const pedido = {
            userId: currentUser.uid,
            usuario: currentUser.email,
            itens: cart.map(i => `${i.qtd}x ${i.nome}`).join(", "),
            total: totals.total,
            endereco: enderecoFinal,
            data: new Date()
        };
        
        try {
            await db.collection("Pedidos").add(pedido);
            await db.collection("Usuarios").doc(currentUser.uid).update({ 
                pedidosFeitos: firebase.firestore.FieldValue.increment(1) 
            });
            
            // Gerar Zap
            const texto = `Olá! Pedido DFL:\n\n${cart.map(i => `• ${i.qtd}x ${i.nome}`).join("\n")}\n\nTotal: *${money(totals.total)}*\nPagamento: A combinar\nEndereço: ${enderecoFinal}`;
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(texto)}`, "_blank");
            
            cart = [];
            renderMiniCart();
            Overlays.closeAll();
            popupAdd("Pedido Enviado! 🎉");
        } catch(e) {
            alert("Erro ao salvar pedido: " + e.message);
        }
    }

    /* ------------------ 🛵 MOTOBOY & ADMIN ------------------ */
    const MOTOBOY_EMAILS = ["motoboy1@dafamilia.com", "entregas@dafamilia.com", "alefejohsefe@gmail.com"];
    const ADMINS = ["alefejohsefe@gmail.com", "contato@dafamilialanches.com.br"];

    function isAdmin(user) { return user && ADMINS.includes(user.email); }

    function checkMotoboyAccess(user) {
        const btnArea = document.getElementById("motoboy-area-btn");
        if (user && MOTOBOY_EMAILS.includes(user.email)) {
            if (!btnArea) {
                const btn = document.createElement("button");
                btn.id = "motoboy-area-btn";
                btn.innerHTML = "🛵";
                btn.style.cssText = "position:fixed;bottom:20px;left:20px;z-index:9999;background:#FF5722;color:white;border-radius:50%;width:50px;height:50px;font-size:24px;border:none;box-shadow:0 4px 10px rgba(0,0,0,0.3);";
                btn.onclick = () => alert("Painel Motoboy: Em breve cálculo de comissão.");
                document.body.appendChild(btn);
            }
        } else {
            if (btnArea) btnArea.remove();
        }
    }

    function createAdminFab() {
        // Cria botão flutuante de admin se não existir
        if(document.getElementById("admin-fab")) return;
        const btn = document.createElement("button");
        btn.id = "admin-fab";
        btn.innerHTML = "📊";
        btn.style.cssText = "position:fixed;bottom:20px;right:80px;z-index:9998;background:#2196F3;color:white;border-radius:50%;width:50px;height:50px;font-size:24px;border:none;box-shadow:0 4px 10px rgba(0,0,0,0.3);";
        btn.onclick = () => {
             // Aqui você pode chamar a função carregarRelatorios() completa
             alert("Acesso Admin Confirmado.\nPainel de Relatórios seria aberto aqui.");
        };
        document.body.appendChild(btn);
    }

    /* ------------------ ➕ ADICIONAIS & COMBOS (FUNCIONAL) ------------------ */
    // Como os botões já estão no HTML, precisamos ativá-los
    function ativarBotoesDoHTML() {
        document.querySelectorAll(".add-cart").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const card = e.currentTarget.closest(".card");
                if(card) {
                    const nome = card.dataset.name;
                    const preco = parseFloat(card.dataset.price);
                    
                    // Lógica de Combo
                    if(nome.toLowerCase().includes("combo")) {
                        // Abre modal combo (simplificado)
                        if(confirm("É um combo! Deseja adicionar Coca-Cola por +R$5,00?")) {
                            addCartItem(`${nome} + Coca`, preco + 5.00);
                        } else {
                            addCartItem(nome, preco);
                        }
                    } else {
                        // Item normal
                        addCartItem(nome, preco);
                    }
                }
            });
        });

        document.querySelectorAll(".extras-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const card = e.currentTarget.closest(".card");
                if(card) {
                    // Prepara modal de extras
                    const nome = card.dataset.name;
                    const preco = parseFloat(card.dataset.price);
                    // (Aqui iria a lógica completa de abrir o modal de extras)
                    // Para simplificar no arquivo único:
                    if(confirm(`Personalizar ${nome}?\nClique OK para adicionar Bacon (+R$3,00)`)) {
                        addCartItem(`${nome} + Bacon`, preco + 3.00);
                    }
                }
            });
        });
    }

    function addCartItem(nome, preco) {
        const found = cart.find(i => i.nome === nome);
        if(found) found.qtd++; else cart.push({nome, preco, qtd:1});
        renderMiniCart();
        popupAdd(`${nome} adicionado!`);
        sound.play().catch(()=>{});
    }

    // Chama a ativação dos botões ao carregar
    ativarBotoesDoHTML();

    /* ------------------ 🏆 RECOMPENSAS & PEDIDOS (ANTIGO) ------------------ */
    el.recompensasBtn?.addEventListener("click", () => {
        if(!currentUser) return alert("Faça login.");
        Overlays.open(el.recompensasPanel);
        carregarRecompensas(currentUser.uid);
    });

    el.pedidosBtn?.addEventListener("click", () => {
        if(!currentUser) return alert("Faça login.");
        Overlays.open(el.pedidosPanel);
        carregarHistorico(currentUser.uid);
    });

    // Funções placeholder para o sistema funcionar sem erro se o Firebase falhar
    function carregarRecompensas(uid) {
        el.recompensasLista.innerHTML = "<p>Carregando suas conquistas...</p>";
        db.collection("Usuarios").doc(uid).get().then(doc => {
            const pedidos = doc.data()?.pedidosFeitos || 0;
            el.recompensasLista.innerHTML = `<h3>Você tem ${pedidos} pedidos!</h3><p>Faltam ${10 - (pedidos%10)} para a próxima recompensa.</p>`;
        });
    }

    function carregarHistorico(uid) {
        el.pedidosLista.innerHTML = "<p>Buscando histórico...</p>";
        db.collection("Pedidos").where("userId", "==", uid).orderBy("data", "desc").limit(5).get().then(snap => {
            if(snap.empty) { el.pedidosLista.innerHTML = "<p>Nenhum pedido anterior.</p>"; return; }
            el.pedidosLista.innerHTML = snap.docs.map(d => {
                const p = d.data();
                return `<div class="pedido-card"><b>${new Date(p.data.seconds*1000).toLocaleDateString()}</b><br>${p.itens}<br>Total: ${money(p.total)}</div>`;
            }).join("");
        });
    }

    /* ------------------ ⏱️ TIMER DA GRADE ------------------ */
    const elContainer = document.querySelector(".contador-container-html");
    if(elContainer) {
        setInterval(() => {
            const agora = new Date();
            const fim = new Date(); fim.setHours(23, 59, 59);
            const diff = fim - agora;
            if(diff > 0) {
                const h = String(Math.floor(diff / 3600000)).padStart(2,"0");
                const m = String(Math.floor((diff % 3600000)/60000)).padStart(2,"0");
                const s = String(Math.floor((diff % 60000)/1000)).padStart(2,"0");
                const elValor = elContainer.querySelector(".tempo-restante-valor");
                if(elValor) elValor.textContent = `${h}:${m}:${s}`;
                else elContainer.innerHTML = `<span class="tempo-restante-valor">${h}:${m}:${s}</span>`;
            }
        }, 1000);
    }

    /* INICIALIZAÇÃO */
    console.log("DFL v6.1 Full Loaded");
    inicializarFirebase();

});
