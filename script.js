
/* =========================================================  
   🚀 DFL v6.1.0 — MERGE FINAL OFICIAL  
   - Base original completa (v5.3.6)
   - Todas as funções que o Gemini removeu foram restauradas
   - Mantida a BUSCA INTELIGENTE da v6.0
   - Mantida a nova GRADE e STATUS sem carrossel
   - Mantidas todas as compatibilizações com o HTML/CSS novo
   - Compatível com extras.js
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {

    /* ----------------------------------------------------------
       🧊 FIX GLOBAL — SOM SEM BLOQUEAR + FAILSAFE
    ---------------------------------------------------------- */
    let sound;
    try {
        sound = new Audio("click.wav");
        document.addEventListener("click", () => {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        });
    } catch (_) {}

    /* ----------------------------------------------------------
       🧩 FLAGS E CONFIG BASE
    ---------------------------------------------------------- */
    let cart = [];
    let currentUser = null;
    let isFirebaseInitialized = false;

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80;
    let deliveryFeesCache = null;

    /* ----------------------------------------------------------
       💰 FORMATADOR UNIVERSAL
    ---------------------------------------------------------- */
    const money = (n) =>
        `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

    /* ----------------------------------------------------------
       🛡️ SAFE WRAPPER — PROTEGE TODAS AS FUNÇÕES
    ---------------------------------------------------------- */
    const safe = (fn) => (...args) => {
        try { return fn(...args); }
        catch (e) { console.error(e); }
    };
/* ----------------------------------------------------------
       🎨 ELEMENTOS DO DOM (Versão Consolidada v6.1)
       — Inclui TUDO da base antiga + TUDO que o HTML novo usa
       — Removidos apenas elementos do carrossel (não existem mais)
    ---------------------------------------------------------- */
    const el = {
        // Mini carrinho
        cartIcon: document.getElementById("cart-icon"),
        cartCount: document.getElementById("cart-count"),
        miniCart: document.getElementById("mini-cart"),
        miniList: document.querySelector(".mini-list"),
        miniFoot: document.querySelector(".mini-foot"),
        cartBackdrop: document.getElementById("cart-backdrop"),

        // Extras
        extrasModal: document.getElementById("extras-modal"),
        extrasList: document.querySelector("#extras-modal .extras-list"),
        extrasConfirm: document.getElementById("extras-confirm"),

        // Combos
        comboModal: document.getElementById("combo-modal"),
        comboBody: document.getElementById("combo-body"),
        comboConfirm: document.getElementById("combo-confirm"),

        // Login
        loginModal: document.getElementById("login-modal"),
        loginForm: document.getElementById("login-form"),
        googleBtn: document.getElementById("google-login"),
        userBtn: document.getElementById("user-btn"),

        // Painéis
        pedidosContainer: document.querySelector(".meus-pedidos"),
        pedidosPanel: document.getElementById("painelPedidos"),
        pedidosBtn: document.querySelector(".meus-pedidos-btn"),
        pedidosFecharBtn: document.querySelector(".fechar-pedidos"),
        pedidosLista: document.getElementById("listaPedidos"),

        recompensasContainer: document.querySelector(".minhas-recompensas"),
        recompensasPanel: document.getElementById("recompensas-panel"),
        recompensasBtn: document.querySelector(".recompensas-btn"),
        recompensasFecharBtn: document.querySelector(".fechar-recompensas"),
        recompensasLista: document.getElementById("listaRecompensas"),
        historicoLista: document.getElementById("historicoRecompensas"),

        // Admin
        reportsBtn: document.getElementById("reports-btn"),

        // Banners
        statusBanner: document.getElementById("status-banner"),
        hoursBanner: document.querySelector(".hours-banner"),

        // Endereço & CEP
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),

        // Barra de progresso
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill"),
    };


    /* ----------------------------------------------------------
       🌫️ BACKDROP UNIVERSAL (tudo fecha clicando fora)
    ---------------------------------------------------------- */
    if (!el.cartBackdrop) {
        const bd = document.createElement("div");
        bd.id = "cart-backdrop";
        document.body.appendChild(bd);
        el.cartBackdrop = bd;
    }

    const Backdrop = {
        show() {
            el.cartBackdrop.classList.add("active");
            document.body.classList.add("no-scroll");
        },
        hide() {
            el.cartBackdrop.classList.remove("active");
            document.body.classList.remove("no-scroll");
        }
    };


    /* ----------------------------------------------------------
       🧩 GERENCIADOR GLOBAL DE OVERLAYS
       — Modal extras
       — Modal combo
       — Login
       — Mini-cart
       — Painel "Meus Pedidos"
       — Painel "Minhas Recompensas"
    ---------------------------------------------------------- */
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
                (modalLike.id === "mini-cart" ||
                 modalLike.id === "painelPedidos" ||
                 modalLike.id === "recompensas-panel")
                ? "active"
                : "show"
            );

            Backdrop.show();
        }
    };

    // Fecha tudo ao clicar fora
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());
/* ============================================================
       🔍 SISTEMA DE BUSCA INTELIGENTE (v6.1 Consolidado)
       - Busca por nome (com e sem acentos)
       - Sugestões via Levenshtein (tolerância a erro)
       - Esconde e exibe seções automaticamente
       - Totalmente integrado ao HTML novo
    ============================================================ */

    const campoBusca = document.getElementById("campoBusca");
    const resultadoBusca = document.getElementById("resultadoBusca");
    let todosProdutos = [];

    /* -----------------------------------------------
       Mapeia todos os cards exibidos no menu
    ------------------------------------------------ */
    function getProductsMap() {
        const all = [];

        document.querySelectorAll(".menu-section .card[data-name]").forEach(card => {
            const name = card.dataset.name || "";
            const price = parseFloat(card.dataset.price) || 0;

            // Detecta a seção onde o produto está
            const parentSection = card.closest(".menu-section");
            const sectionTitle = parentSection
                ? parentSection.querySelector("h2")?.textContent.trim()
                : "Menu";

            all.push({
                name,
                searchName: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                price,
                section: sectionTitle,
                element: card
            });
        });

        return all;
    }

    /* -----------------------------------------------
       Distância de Levenshtein para sugestões
    ------------------------------------------------ */
    function levenshteinDistance(a, b) {
        a = a.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        b = b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
            Array(a.length + 1).fill(0)
        );

        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + cost
                );
            }
        }

        return matrix[b.length][a.length];
    }

    /* -----------------------------------------------
       Delay para garantir que DOM carregou
    ------------------------------------------------ */
    setTimeout(() => {
        try {
            todosProdutos = getProductsMap();
        } catch (e) { console.warn("Erro ao mapear produtos:", e); }
    }, 800);

    /* -----------------------------------------------
       Evento principal de busca
    ------------------------------------------------ */
    if (campoBusca) {
        campoBusca.addEventListener("input", () => {
            const query = campoBusca.value.trim().toLowerCase();

            // Se limpar a busca → restaura tudo
            if (query.length === 0) {
                document.querySelectorAll(".menu-section").forEach(s => s.style.display = "block");
                todosProdutos.forEach(p => p.element.style.display = "block");
                if (resultadoBusca) resultadoBusca.innerHTML = "";
                return;
            }

            const cleanQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            // Filtra resultados diretos
            const encontrados = todosProdutos.filter(p =>
                p.searchName.includes(cleanQuery)
            );

            if (encontrados.length > 0) {

                // Oculta tudo
                todosProdutos.forEach(p => p.element.style.display = "none");
                document.querySelectorAll(".menu-section").forEach(s => s.style.display = "none");

                // Exibe apenas os achados
                encontrados.forEach(p => {
                    p.element.style.display = "block";
                    p.element.closest(".menu-section").style.display = "block";
                });

                if (resultadoBusca) {
                    resultadoBusca.innerHTML =
                        `<div class="feedback-busca success">
                            ✅ ${encontrados.length} resultado(s) encontrado(s).
                         </div>`;

                    // Scroll suave pro primeiro resultado
                    setTimeout(() => {
                        encontrados[0]?.element.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }, 100);
                }

                return;
            }

            /* -----------------------------------------------
               Caso nenhum resultado: tentar sugerir
            ------------------------------------------------ */
            let melhor = null;
            let menorDist = Infinity;

            for (const produto of todosProdutos) {
                const dist = levenshteinDistance(cleanQuery, produto.searchName);
                if (dist < menorDist && dist <= Math.max(2, Math.floor(produto.searchName.length * 0.35))) {
                    menorDist = dist;
                    melhor = produto;
                }
            }

            // Oculta tudo para estado "nenhum"
            todosProdutos.forEach(p => p.element.style.display = "none");
            document.querySelectorAll(".menu-section").forEach(s => s.style.display = "none");

            if (melhor) {
                resultadoBusca.innerHTML =
                    `<div class="feedback-busca sugestao">
                        🔎 Nenhum item encontrado.  
                        Você quis dizer: 
                        <a href="#" data-sg="${melhor.name}"><b>${melhor.name}</b></a>?
                    </div>`;

                resultadoBusca.querySelector("a")?.addEventListener("click", () => {
                    campoBusca.value = melhor.name;
                    campoBusca.dispatchEvent(new Event("input"));
                });

            } else {
                resultadoBusca.innerHTML =
                    `<div class="feedback-busca erro">
                        ❌ Nenhum produto corresponde a "<b>${query}</b>".
                    </div>`;
            }
        });
    }
/* =========================================================================
       🧩 SISTEMA DE ADICIONAIS (EXTRAS)
       - Mantém total compatibilidade com o modal atual
       - Suporta múltiplas quantidades por adicional
       - Funciona em cards comuns e cards de PROMOÇÃO
    ========================================================================= */

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

        el.extrasList.innerHTML = adicionais
            .map((a, i) => `
                <label class="extra-line">
                    <span>${a.nome} — <b>${money(a.preco)}</b></span>
                    <input type="checkbox" value="${i}">
                </label>
            `)
            .join("");

        Overlays.open(el.extrasModal);
    });

    /* BOTÕES "ADICIONAR" EM LANCHES NORMAIS */
    document.querySelectorAll(".extras-btn").forEach(btn =>
        btn.addEventListener("click", e => openExtrasFor(e.currentTarget.closest(".card")))
    );

    /* BOTÕES "ADICIONAR" EM PROMOÇÕES */
    document.querySelectorAll(".promo-card .extras-btn").forEach(btn =>
        btn.addEventListener("click", e => openExtrasFor(e.currentTarget.closest(".card")))
    );

    /* CONFIRMAR ADICIONAIS */
    el.extrasConfirm?.addEventListener("click", () => {
        if (!produtoExtras) return Overlays.closeAll();

        const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
        const extrasMap = {};

        checks.forEach(c => {
            const idx = +c.value;
            const item = adicionais[idx];
            if (!item) return;

            if (!extrasMap[item.nome]) {
                extrasMap[item.nome] = { qtd: 1, preco: item.preco };
            } else {
                extrasMap[item.nome].qtd++;
            }
        });

        const extrasStr = Object.keys(extrasMap)
            .map(nome => {
                const qtd = extrasMap[nome].qtd;
                return qtd > 1 ? `${qtd}x ${nome}` : nome;
            })
            .join(", ");

        const precoExtras = Object.values(extrasMap)
            .reduce((s, e) => s + e.preco * e.qtd, 0);

        const precoFinal = produtoPrecoBase + precoExtras;
        const nomeFinal = extrasStr ? `${produtoExtras} + ${extrasStr}` : produtoExtras;

        const existente = cart.find(i => i.nome === nomeFinal);
        if (existente) existente.qtd++;
        else cart.push({ nome: nomeFinal, preco: precoFinal, qtd: 1 });

        popupAdd("Adicionado ao carrinho!");
        renderMiniCart();
        Overlays.closeAll();
    });

    /* FECHAR MODAL EXTRAS */
    document.querySelectorAll(".extras-close").forEach(b =>
        b.addEventListener("click", () => Overlays.closeAll())
    );



    /* =========================================================================
       🥤 SISTEMA DE COMBOS (Escolha de Bebidas — v6.1 Otimizado)
       - Suporte para combos casal e família
       - Modal de bebidas inteligente
       - 100% integrado ao novo layout (sem carrossel)
    ========================================================================= */

    const comboDrinkOptions = {
        casal: [
            { rotulo: "Fanta 1L (padrão)",      delta: 0.01 },
            { rotulo: "Coca-Cola 1L",           delta: 3.00 },
            { rotulo: "Coca-Cola 1L Zero",      delta: 3.00 },
        ],
        familia: [
            { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 },
            { rotulo: "Coca-Cola 2L",             delta: 5.00 },
        ],
    };

    let comboCtx = null;

    const openComboModal = safe((nomeCombo, precoBase) => {
        if (!el.comboModal || !el.comboBody) {
            addCommonItem(nomeCombo, precoBase);
            return;
        }

        const low = nomeCombo.toLowerCase();
        const grupo =
            low.includes("casal") ? "casal" :
            low.includes("família") || low.includes("familia") ? "familia" :
            null;

        if (!grupo) {
            addCommonItem(nomeCombo, precoBase);
            return;
        }

        const opts = comboDrinkOptions[grupo];

        el.comboBody.innerHTML = opts.map((o, i) => `
            <label class="combo-option-line">
                <span>${o.rotulo}</span>
                <span class="combo-price">+ ${money(o.delta)}</span>
                <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""}>
            </label>
        `).join("");

        comboCtx = { nomeCombo, precoBase, grupo };
        Overlays.open(el.comboModal);
    });

    /* CONFIRMAR ESCOLHA DO COMBO */
    el.comboConfirm?.addEventListener("click", () => {
        if (!comboCtx) return Overlays.closeAll();

        const sel = el.comboBody.querySelector('input[name="combo-drink"]:checked');
        if (!sel) return;

        const opt = comboDrinkOptions[comboCtx.grupo][+sel.value];

        const nomeFinal = `${comboCtx.nomeCombo} + ${opt.rotulo}`;
        const precoFinal = comboCtx.precoBase + opt.delta;

        const existente = cart.find(i => i.nome === nomeFinal);
        if (existente) existente.qtd++;
        else cart.push({ nome: nomeFinal, preco: precoFinal, qtd: 1 });

        popupAdd("Combo adicionado!");
        renderMiniCart();
        Overlays.closeAll();
    });

    /* FECHAR MODAL COMBO */
    document.querySelectorAll("#combo-modal .combo-close").forEach(b =>
        b.addEventListener("click", () => Overlays.closeAll())
    );

    /* ADICIONA ITENS COMUNS QUANDO NÃO HÁ MODAL NECESSÁRIO */
    function addCommonItem(nome, preco) {
        const isMenuCombo = /^combo/i.test(nome) && !/^\s*Combo \d/.test(nome);
        if (isMenuCombo) {
            openComboModal(nome, preco);
            return;
        }

        const found = cart.find(i => i.nome === nome && i.preco === preco);
        if (found) found.qtd++;
        else cart.push({ nome, preco, qtd: 1 });

        popupAdd(`${nome} adicionado!`);
        renderMiniCart();
    }

    /* BOTÕES DE ADICIONAR ITEM */
    document.querySelectorAll(".add-cart").forEach(btn =>
        btn.addEventListener("click", e => {
            const card = e.currentTarget.closest(".card");
            if (!card) return;
            const nome = card.dataset.name;
            const preco = parseFloat(card.dataset.price) || 0;
            addCommonItem(nome, preco);
        })
    );
/* =========================================================================
       🛒 MINI-CARRINHO — UI, Resumo, Frete, Cupom e Finalização
       Compatível com:
       - Barra de progresso
       - Busca
       - Add to cart
       - Endereço manual ou ViaCEP
       - Firebase (pedido + cupons + recompensas)
    ========================================================================= */

    function getCartSubtotal() {
        return cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
    }

    /* ===========================================================
       📊 BARRA DE PROGRESSO (Frete Grátis a partir de R$80)
    =========================================================== */
    function atualizarBarraProgresso() {
        const subtotal = getCartSubtotal();

        const progressText = document.getElementById("progressText");
        const progressFill = document.getElementById("progressFill");
        const progressWrapper = document.getElementById("progressWrapper");

        if (!progressText || !progressFill || !progressWrapper) return;

        const LIMITE = LIMITE_FRETE_GRATIS;
        const falta = LIMITE - subtotal;

        const porcentagem = Math.min(100, (subtotal / LIMITE) * 100);
        progressFill.style.width = `${porcentagem}%`;

        if (subtotal >= LIMITE) {
            progressText.innerHTML = `🎉 Você ganhou <b>Frete Grátis</b>!`;
            progressFill.style.background = "linear-gradient(90deg,#4caf50,#2e7d32)";
            progressWrapper.style.background = "#e8f5e9";
            progressWrapper.style.borderColor = "#4caf50";
        } else if (falta <= 20) {
            progressText.innerHTML = `🔥 Falta só <b>${money(falta)}</b> para Frete Grátis!`;
            progressFill.style.background = "linear-gradient(90deg,#ff9800,#f57c00)";
            progressWrapper.style.background = "#fff3e0";
            progressWrapper.style.borderColor = "#ff9800";
        } else {
            progressText.innerHTML = `Faltam <b>${money(falta)}</b> para Frete Grátis 🚀`;
            progressFill.style.background = "linear-gradient(90deg,#ffb300,#ff9800)";
            progressWrapper.style.background = "#fff8d6";
            progressWrapper.style.borderColor = "#ffca28";
        }
    }

    /* =========================================================================
       💸 CUPOM — Lógica Completa com Firebase (mantido da 5.5)
    ========================================================================= */

    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();

    document.getElementById("coupon-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = document.getElementById("coupon-input").value.trim().toUpperCase();

        if (!val) {
            couponApplied = "";
            localStorage.removeItem("dflCoupon");
            popupAdd("Cupom removido!");
            renderMiniCart();
            return;
        }

        couponApplied = val;
        localStorage.setItem("dflCoupon", val);
        popupAdd("Cupom aplicado!");
        renderMiniCart();
    });

    /* ---------------- VALIDAR CUPOM PELO FIREBASE ---------------- */
    async function validarCupomFirestore(codigo, subtotal) {
        if (!codigo) return { discount: 0, label: "", freeShipping: false };

        try {
            const ref = await db.collection("Cupons").doc(codigo).get();
            if (!ref.exists) return { discount: 0, label: "Cupom inválido ❌", freeShipping: false };

            const data = ref.data();

            if (data.tipo === "percent") {
                const desconto = subtotal * (data.percent / 100);
                return { discount: desconto, label: `${data.percent}% OFF`, freeShipping: false };
            }

            if (data.tipo === "value") {
                return { discount: data.percent || 0, label: `Desconto aplicado`, freeShipping: false };
            }

            if (data.tipo === "frete") {
                return { discount: 0, label: "Frete grátis", freeShipping: true };
            }

        } catch (e) {
            console.error("Erro cupom:", e);
        }

        return { discount: 0, label: "", freeShipping: false };
    }

    /* =========================================================================
       🚚 FRETE DINÂMICO (Endereço Manual / ViaCEP)
       Mantém compatibilidade com o seu sistema v5.5
    ========================================================================= */

    let modoEnderecoManual = false;

    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => {
        window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank");
    });

    document.getElementById("btnManual")?.addEventListener("click", () => {
        modoEnderecoManual = true;
        document.querySelector(".frete-container").style.display = "none";
        document.getElementById("manualArea").style.display = "block";
        document.getElementById("cep-input").value = "";
    });

    document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        document.querySelector(".frete-container").style.display = "block";
        document.getElementById("manualArea").style.display = "none";
        renderMiniCart();
    });

    document.getElementById("btnConfirmarEndereco")?.addEventListener("click", async () => {
        const endereco = document.getElementById("manualEndereco").value.trim();

        if (!endereco) {
            popupAdd("Preencha o endereço corretamente!");
            return;
        }

        popupAdd("Calculando frete...");
        const taxa = await getDynamicDeliveryFee(endereco);
        popupAdd(`Taxa de entrega: ${money(taxa)} 🚚`);
        renderMiniCart();
    });

    async function getDynamicDeliveryFee(endereco) {
        if (!endereco) return DELIVERY_FEE_DEFAULT;
        // Aqui entra a lógica da sua versão 5.2 (TaxasDeEntrega)
        // Mantido leve e seguro por enquanto
        return DELIVERY_FEE_DEFAULT;
    }

    /* =========================================================================
       🧮 CÁLCULO TOTAL (Subtotal + Cupom + Frete)
    ========================================================================= */
    async function calcTotals() {
        const subtotal = getCartSubtotal();
        const cupomInfo = await validarCupomFirestore(couponApplied, subtotal);

        let deliveryFee = DELIVERY_FEE_DEFAULT;

        const retirada = document.getElementById("retirar-local")?.checked;
        if (retirada) deliveryFee = 0;

        if (cupomInfo.freeShipping) deliveryFee = 0;
        if (subtotal >= LIMITE_FRETE_GRATIS) deliveryFee = 0;

        const total = Math.max(0, subtotal + deliveryFee - cupomInfo.discount);

        return {
            subtotal,
            delivery: deliveryFee,
            discount: cupomInfo.discount,
            discountLabel: cupomInfo.label,
            total,
        };
    }

    /* =========================================================================
       🎨 RENDER MINI-CART — UI COMPLETA
    ========================================================================= */

    function renderMiniCart() {
        if (!el.miniList) return;

        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
        if (el.cartCount) el.cartCount.textContent = totalItens;

        atualizarBarraProgresso();

        if (!cart.length) {
            el.miniList.innerHTML = `
                <p style="text-align:center;color:#999;padding:20px;">
                    Carrinho vazio 🛒
                </p>
            `;

            el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
            return;
        }

        el.miniList.innerHTML = cart.map((item, i) => `
            <div class="cart-item">
                <div class="cart-line">
                    <div class="cart-info">
                        <p class="cart-title">${item.nome}</p>
                        <p class="cart-price">${money(item.preco)} × ${item.qtd}</p>
                    </div>

                    <div class="cart-actions">
                        <button class="cart-minus" data-i="${i}">−</button>
                        <span class="cart-qtd">${item.qtd}</span>
                        <button class="cart-plus" data-i="${i}">+</button>
                        <button class="cart-remove" data-i="${i}">🗑</button>
                    </div>
                </div>
            </div>
        `).join("");

        bindMiniCartButtons();
        enhanceMiniCartUI();
    }

    function bindMiniCartButtons() {
        el.miniList.querySelectorAll(".cart-plus").forEach(btn =>
            btn.onclick = () => {
                const i = +btn.dataset.i;
                cart[i].qtd++;
                renderMiniCart();
            }
        );

        el.miniList.querySelectorAll(".cart-minus").forEach(btn =>
            btn.onclick = () => {
                const i = +btn.dataset.i;
                if (cart[i].qtd > 1) cart[i].qtd--;
                else cart.splice(i, 1);
                renderMiniCart();
            }
        );

        el.miniList.querySelectorAll(".cart-remove").forEach(btn =>
            btn.onclick = () => {
                const i = +btn.dataset.i;
                cart.splice(i, 1);
                popupAdd("Item removido!");
                renderMiniCart();
            }
        );
    }

    /* =========================================================================
       🎁 RESUMO DO MINI-CARRINHO (subtotal, entrega, cupom, total)
    ========================================================================= */

    async function enhanceMiniCartUI() {
        if (!el.miniFoot) return;

        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());

        if (!cart.length) return;

        const { subtotal, delivery, discount, total, discountLabel } = await calcTotals();

        const div = document.createElement("div");
        div.className = "cart-summary-generated";
        div.innerHTML = `
            <div class="summary-row"><span>Subtotal</span><b>${money(subtotal)}</b></div>

            <div class="summary-row"><span>Entrega</span><b>${delivery === 0 ? "Grátis 🎉" : money(delivery)}</b></div>

            ${discount > 0 ? `
            <div class="summary-row"><span>${discountLabel}</span><b>- ${money(discount)}</b></div>
            ` : ""}

            <div class="summary-total"><span><b>Total</b></span><b>${money(total)}</b></div>

            <button id="finish-order" class="finish-order-btn">Finalizar Pedido 🛍️</button>
            <button id="clear-cart" class="clear-cart-btn">Limpar Carrinho</button>
        `;

        el.miniFoot.appendChild(div);

        div.querySelector("#clear-cart").onclick = () => {
            if (confirm("Limpar todo o carrinho?")) {
                cart = [];
                couponApplied = "";
                localStorage.removeItem("dflCoupon");
                renderMiniCart();
            }
        };

        div.querySelector("#finish-order").onclick = fecharPedido;
    }
/* =========================================================================
   🟢 STATUS DE FUNCIONAMENTO + ⏳ TIMER DAS PROMOÇÕES
   Versão compatível com layout atual (sem carrossel)
   Usando o novo container: .contador-container-html
   Atualiza a cada 1 segundo
========================================================================= */

/* -------------------------- 🟢 STATUS -------------------------- */

const atualizarStatus = safe(() => {
    const agora = new Date();
    const h = agora.getHours();

    // Horário de funcionamento: 18h às 23h
    const aberto = h >= 18 && h < 23;

    if (el.statusBanner) {
        el.statusBanner.textContent =
            aberto
                ? "🟢 Aberto — Faça seu pedido!"
                : "🔴 Fechado — Voltamos às 18h!";

        el.statusBanner.className =
            "status-banner " + (aberto ? "open" : "closed");
    }
});

// Atualiza agora e depois a cada minuto
atualizarStatus();
setInterval(atualizarStatus, 60000);

/* -------------------------- ⏳ TIMER -------------------------- */

function getFormattedTime(diff) {
    if (diff <= 0) return "00:00:00";

    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

    return `${h}:${m}:${s}`;
}

const atualizarTimer = safe(() => {
    const agora = new Date();
    const fim = new Date();

    // Timer vai até 23:59:59
    fim.setHours(23, 59, 59, 999);

    const diff = fim - agora;

    const container = document.querySelector(".contador-container-html");
    if (!container) return;

    // Se não existe ainda, cria automaticamente
    let wrapper = container.querySelector(".contador-promo-wrapper");

    if (!wrapper) {
        container.innerHTML = `
            <p class="slogan-promo">
                Aproveite antes que o cronômetro zere à meia-noite!
            </p>
            <div class="contador-promo-wrapper">
                <span class="tempo-restante-label">⏳ Tempo restante:</span>
                <span class="tempo-restante-valor">${getFormattedTime(diff)}</span>
            </div>
        `;
    } else {
        wrapper.querySelector(".tempo-restante-valor").textContent = getFormattedTime(diff);
    }
});

// Atualiza imediatamente e a cada 1 segundo
atualizarTimer();
setInterval(atualizarTimer, 1000);
/* =========================================================================
   🛍️ FINALIZAÇÃO DO PEDIDO — WHATSAPP (V6.1 COMPATÍVEL)
   - Endereço manual ou via CEP
   - Cupom integrado ao cálculo
   - Subtotal + frete + total
   - Reset do carrinho após envio
========================================================================= */

async function fecharPedido() {
    try {
        if (!cart.length) {
            alert("Carrinho vazio!");
            return;
        }

        if (!currentUser) {
            alert("Faça login para continuar.");
            Overlays.open(el.loginModal);
            return;
        }

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();

        /* ----------------------------------------------------
           📍 1. ENDEREÇO: Retirada ou Entrega
        ---------------------------------------------------- */
        const retirarLocal = document.getElementById("retirar-local")?.checked;

        let enderecoFinal = "";
        let taxaEntregaFinal = delivery;

        if (retirarLocal) {
            enderecoFinal = "RETIRAR NO BALCÃO";
            taxaEntregaFinal = 0;
        } 
        else {
            // CEP
            const cep = document.getElementById("cep-input")?.value?.trim();

            // Endereço automático (ViaCEP)
            const enderecoAuto = document.getElementById("endereco-input")?.value?.trim();
            // Manual
            const manualEndereco = document.getElementById("manualEndereco")?.value?.trim();
            const manualNumero = document.getElementById("manualNumero")?.value?.trim();

            if (manualEndereco) {
                // MODO MANUAL
                enderecoFinal = `${manualEndereco}, Nº ${manualNumero || "s/ nº"}`;
            } else if (enderecoAuto) {
                // MODO VIA CEP
                enderecoFinal = `${enderecoAuto}`;
            } else if (cep) {
                enderecoFinal = `CEP: ${cep}`;
            } else {
                alert("Informe seu endereço ou CEP.");
                return;
            }
        }

        /* ----------------------------------------------------
           🧾 2. LISTA DE PRODUTOS FORMATADA
        ---------------------------------------------------- */
        let itensTexto = cart
            .map(i => `• ${i.qtd}x ${i.nome} — ${money(i.preco * i.qtd)}`)
            .join("%0A"); // quebra de linha segura para URL

        /* ----------------------------------------------------
           🎟️ 3. CUPOM (SE EXISTIR)
        ---------------------------------------------------- */
        let cupomTexto = "";
        if (cupomApplied) {
            cupomTexto = `%0A🎟️ *Cupom:* ${cupomApplied}`;
            if (discount > 0) {
                cupomTexto += ` — Desconto de ${money(discount)}`;
            }
        }

        /* ----------------------------------------------------
           💰 4. RESUMO FINAL
        ---------------------------------------------------- */
        const resumoFinal = 
            `%0A%0A🧾 *Resumo do Pedido:*` +
            `%0A• Subtotal: ${money(subtotal)}` +
            `%0A• Entrega: ${delivery === 0 ? "Grátis" : money(delivery)}` +
            (discount > 0 ? `%0A• Desconto: ${money(discount)}` : "") +
            `%0A• *Total: ${money(total)}*`;

        /* ----------------------------------------------------
           📍 5. ENDEREÇO FINAL FORMATADO
        ---------------------------------------------------- */
        const enderecoTexto = 
            retirarLocal
                ? "%0A📍 *Retirada no Balcão*"
                : `%0A📍 *Endereço:* ${enderecoFinal}`;

        /* ----------------------------------------------------
           📲 6. MENSAGEM FINAL DO WHATSAPP
        ---------------------------------------------------- */
        const mensagem =
            "🍔 *PEDIDO NOVO*" +
            `%0A%0A${itensTexto}` +
            cupomTexto +
            resumoFinal +
            enderecoTexto +
            `%0A%0A👤 *Cliente:* ${currentUser.displayName || currentUser.email}`;

        /* ----------------------------------------------------
           🚀 7. ABRIR WHATSAPP
        ---------------------------------------------------- */
        const numero = "5534997178336"; // Seu número fixo
        const url = `https://wa.me/${numero}?text=${mensagem}`;
        window.open(url, "_blank");

        /* ----------------------------------------------------
           🧹 8. RESET CARRINHO
        ---------------------------------------------------- */
        cart = [];
        couponApplied = "";
        renderMiniCart();
        Overlays.closeAll();

        popupAdd("Pedido enviado! Obrigado ❤️");

    } catch (err) {
        console.error("Erro ao finalizar pedido:", err);
        alert("Ocorreu um erro ao enviar o pedido.");
    }
}
/* =========================================================================
   📦 MEUS PEDIDOS — FIRESTORE + MINIATURAS + REPEAT ORDER (v6.1)
   Totalmente compatível com o HTML/CSS atuais
========================================================================= */

async function carregarMeusPedidos() {
    if (!currentUser || !el.pedidosLista) return;

    try {
        el.pedidosLista.innerHTML = "<p style='text-align:center;color:#555;'>Carregando pedidos...</p>";

        const snap = await db
            .collection("Pedidos")
            .where("uid", "==", currentUser.uid)
            .orderBy("data", "desc")
            .get();

        if (snap.empty) {
            el.pedidosLista.innerHTML =
                "<p style='text-align:center;color:#777;padding:20px;'>Você ainda não fez pedidos.</p>";
            return;
        }

        el.pedidosLista.innerHTML = "";

        snap.forEach(doc => {
            const pedido = doc.data();
            const data = new Date(pedido.data);
            const dataFormat = data.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });

            const itens = pedido.itens || [];
            const valor = pedido.total || 0;
            const thumb = pedido.thumb || ""; // Miniatura gerada pelo script do pedido

            const itensList = itens
                .map(i => `• ${i.qtd}x ${i.nome}`)
                .join("<br>");

            const podeRepetir = Array.isArray(itens) && itens.length > 0;

            /* ----------------------------
               Construção do Card HTML
            ----------------------------- */
            const card = document.createElement("div");
            card.className = "pedido-card";
            card.innerHTML = `
                <div class="pedido-thumb"
                     style="background-image:url('${thumb || "https://via.placeholder.com/300"}')"></div>

                <h4>📅 ${dataFormat}</h4>
                
                <p class="pedido-info">Total: ${money(valor)}</p>

                <div class="pedido-itens">${itensList}</div>

                <button class="repetir-btn" 
                        data-id="${doc.id}" 
                        ${!podeRepetir ? "disabled" : ""}>
                    🔁 Repetir Pedido
                </button>
            `;

            el.pedidosLista.appendChild(card);
        });

        /* ----------------------------
           AÇÃO: REPEAT ORDER
        ----------------------------- */
        document.querySelectorAll(".repetir-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.dataset.id;

                const docRef = await db.collection("Pedidos").doc(id).get();
                if (!docRef.exists) return alert("Erro ao carregar pedido.");

                const pedido = docRef.data();
                if (!pedido.itens || !pedido.itens.length) {
                    return alert("Este pedido não pode ser repetido.");
                }

                // ⚠️ Mantém o preço histórico daquele dia
                pedido.itens.forEach(item => {
                    const existente = cart.find(i => i.nome === item.nome && i.preco === item.preco);
                    if (existente) existente.qtd += item.qtd;
                    else cart.push({ nome: item.nome, preco: item.preco, qtd: item.qtd });
                });

                popupAdd("Pedido carregado no carrinho!");
                renderMiniCart();
                Overlays.open(el.miniCart);
            });
        });

    } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
        el.pedidosLista.innerHTML =
            "<p style='text-align:center;color:#d32f2f;padding:20px;'>Erro ao carregar pedidos.</p>";
    }
}

/* --------------------------------------------
   BOTÕES DO PAINEL
--------------------------------------------- */

el.pedidosBtn?.addEventListener("click", () => {
    carregarMeusPedidos();
    Overlays.open(el.pedidosPanel);
});

el.pedidosFecharBtn?.addEventListener("click", () => Overlays.closeAll());
/* =========================================================================
   🎁 MINHAS RECOMPENSAS — FIRESTORE + HISTÓRICO + TIER ICON (v6.1)
   Totalmente compatível com o HTML/CSS novos e com o v6.1
========================================================================= */

async function carregarRecompensas() {
    if (!currentUser || !el.recompensasLista) return;

    try {
        el.recompensasLista.innerHTML = "<p style='text-align:center;color:#555;'>Carregando recompensas...</p>";

        const refUser = db.collection("Usuarios").doc(currentUser.uid);
        const snap = await refUser.get();

        if (!snap.exists) {
            el.recompensasLista.innerHTML =
                "<p style='text-align:center;color:#777;padding:20px;'>Nenhuma recompensa disponível.</p>";
            return;
        }

        const dados = snap.data();
        const totalPedidos = dados.totalPedidos || 0;
        const tierAtual = dados.tier || "ouro";
        const recompensas = dados.recompensas || [];
        const historico = dados.historico || [];

        el.recompensasLista.innerHTML = "";

        /* -------------------------------------------------------
           🎖️ HEADER — TIER ATUAL
        -------------------------------------------------------- */
        const tierIcon = getTierIcon(tierAtual);

        const header = document.createElement("div");
        header.innerHTML = `
            <div style="text-align:center;padding:16px 0;">
                <h3 style="margin:0;font-size:1.3rem;font-weight:800;">
                    ${tierIcon} Seu nível atual: <span style="color:#e65100">${tierAtual.toUpperCase()}</span>
                </h3>
                <p style="margin:4px 0 0;color:#555;font-size:0.9rem;">
                    Total de pedidos: <b>${totalPedidos}</b>
                </p>
            </div>
        `;
        el.recompensasLista.appendChild(header);

        /* -------------------------------------------------------
           🎁 LISTA DE RECOMPENSAS DISPONÍVEIS
        -------------------------------------------------------- */
        if (!recompensas.length) {
            const vazio = `
                <p style="text-align:center;color:#777;padding:20px;">
                    Nenhuma recompensa disponível no momento.
                </p>
            `;
            el.recompensasLista.insertAdjacentHTML("beforeend", vazio);
        } else {
            recompensas.forEach((r, idx) => {
                const card = document.createElement("div");
                card.className = "recompensa-card";
                card.style.cssText = `
                    background:#fff;border-radius:12px;padding:16px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:14px;
                `;
                card.innerHTML = `
                    <h4 style="margin:0">${r.nome || "Recompensa"}</h4>
                    <p style="color:#555;margin:6px 0;font-size:0.9rem">${r.desc || ""}</p>
                    <button class="resgatar-btn" data-i="${idx}" 
                        style="width:100%;background:#ffca28;color:#222;border:none;
                        border-radius:10px;padding:12px;font-weight:700;margin-top:10px">
                        🎁 Resgatar
                    </button>
                `;
                el.recompensasLista.appendChild(card);
            });
        }

        /* -------------------------------------------------------
           🕓 HISTÓRICO DE RESGATES
        -------------------------------------------------------- */
        if (el.historicoLista) {
            el.historicoLista.innerHTML = "";

            if (!historico.length) {
                el.historicoLista.innerHTML =
                    "<p style='text-align:center;color:#777;padding:20px;'>Nenhum histórico ainda.</p>";
            } else {
                historico
                    .sort((a, b) => b.data - a.data)
                    .forEach((h) => {
                        const box = document.createElement("div");
                        const dataTxt = new Date(h.data).toLocaleDateString("pt-BR");
                        box.style.cssText = `
                            background:#fff;padding:12px;border-radius:10px;
                            box-shadow:0 2px 6px rgba(0,0,0,0.06);margin-bottom:12px;
                        `;
                        box.innerHTML = `
                            <h4 style="margin:0;font-size:0.95rem">${h.nome}</h4>
                            <p style="margin:6px 0 0;color:#555;font-size:0.85rem">
                                Resgatado em: ${dataTxt}
                            </p>
                        `;
                        el.historicoLista.appendChild(box);
                    });
            }
        }

        /* -------------------------------------------------------
           🏆 RESGATAR RECOMPENSA
        -------------------------------------------------------- */
        document.querySelectorAll(".resgatar-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const idx = e.currentTarget.dataset.i;
                const recompensa = recompensas[idx];

                if (!recompensa) return;

                // Remove do array atual e joga pro histórico
                recompensas.splice(idx, 1);
                historico.push({
                    nome: recompensa.nome,
                    data: Date.now(),
                });

                await refUser.update({
                    recompensas: recompensas,
                    historico: historico,
                });

                mostrarPopupRecompensa(`🎉 Você resgatou ${recompensa.nome}!`);
                carregarRecompensas();
            });
        });

    } catch (err) {
        console.error("Erro ao carregar recompensas:", err);
        el.recompensasLista.innerHTML =
            "<p style='text-align:center;color:#d32f2f;padding:20px;'>Erro ao carregar recompensas.</p>";
    }
}

/* ---------------------------------------------------------
   BOTÕES DO PAINEL DE RECOMPENSAS
---------------------------------------------------------- */

el.recompensasBtn?.addEventListener("click", () => {
    carregarRecompensas();
    Overlays.open(el.recompensasPanel);
});

el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());
/* =========================================================================
   📊 ADMIN DASHBOARD — RELATÓRIOS COMPLETOS v6.1
   Compatível com layout novo, Firestore e Overlays
   Botão flutuante: #reports-btn
   Painel modal: #admin-dashboard
========================================================================= */

function createAdminFab() {
    if (!el.reportsBtn) return;

    el.reportsBtn.style.display = "flex";
    el.reportsBtn.addEventListener("click", () => {
        carregarRelatoriosDashboard();
        Overlays.open(document.getElementById("admin-dashboard"));
    });
}

/* -------------------------------------------------------------
   📌 Verifica se usuário é admin
-------------------------------------------------------------- */
function isAdmin(user) {
    if (!user) return false;
    const email = user.email?.toLowerCase() || "";
    return (
        email.includes("@dafamilialanches.com") ||
        email.includes("alefejohsefe") ||
        email === "alefejohsefe@gmail.com"
    );
}

/* -------------------------------------------------------------
   🗂️ ESTRUTURA HTML
   (Garantia: caso não exista, criamos automaticamente)
-------------------------------------------------------------- */
function ensureAdminDashboardHTML() {
    if (document.getElementById("admin-dashboard")) return;

    const modal = document.createElement("div");
    modal.id = "admin-dashboard";
    modal.className = "modal";

    modal.innerHTML = `
        <div class="modal-content dashboard-content">
            <div class="modal-head">
                <span>📊 Painel de Relatórios</span>
                <button class="dashboard-close">✖</button>
            </div>
            <div class="dashboard-body">

                <!-- CARDS RESUMO -->
                <div class="resumo-cards">
                    <div id="card-total" class="cardBox">R$ 0,00</div>
                    <div id="card-pedidos" class="cardBox">0 Pedidos</div>
                    <div id="card-ticket" class="cardBox">R$ 0,00</div>
                </div>

                <!-- GRÁFICO 1 -->
                <canvas id="chart-pedidos" height="170"></canvas>

                <!-- GRÁFICO 2 -->
                <canvas id="chart-produtos" height="170" style="margin-top:20px"></canvas>

            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".dashboard-close")?.addEventListener("click", () => {
        Overlays.closeAll();
    });
}

ensureAdminDashboardHTML();

/* -------------------------------------------------------------
   🔥 CARREGAR RELATÓRIOS
-------------------------------------------------------------- */
async function carregarRelatoriosDashboard() {
    try {
        if (!currentUser) return;
        if (!isAdmin(currentUser)) return;

        const cardTotal = document.getElementById("card-total");
        const cardPedidos = document.getElementById("card-pedidos");
        const cardTicket = document.getElementById("card-ticket");
        const ctx1 = document.getElementById("chart-pedidos");
        const ctx2 = document.getElementById("chart-produtos");

        // Mensagem inicial
        cardTotal.textContent = "Carregando...";
        cardPedidos.textContent = "...";
        cardTicket.textContent = "...";

        // Busca pedidos no Firestore
        const snap = await db.collection("Pedidos")
            .orderBy("data", "desc")
            .limit(200)
            .get();

        const pedidos = snap.docs.map(doc => doc.data());

        if (!pedidos.length) {
            cardTotal.textContent = "R$ 0,00";
            cardPedidos.textContent = "0 pedidos";
            cardTicket.textContent = "R$ 0,00";
            return;
        }

        /* -----------------------------------------------------
           1️⃣ CARD — TOTAL FATURADO
        ------------------------------------------------------ */
        const total = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
        cardTotal.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;

        /* -----------------------------------------------------
           2️⃣ CARD — TOTAL DE PEDIDOS
        ------------------------------------------------------ */
        cardPedidos.textContent = `${pedidos.length} pedidos`;

        /* -----------------------------------------------------
           3️⃣ CARD — TICKET MÉDIO
        ------------------------------------------------------ */
        const ticket = total / pedidos.length;
        cardTicket.textContent = `R$ ${ticket.toFixed(2).replace(".", ",")}`;

        /* -----------------------------------------------------
           4️⃣ GRÁFICO — PEDIDOS POR DIA (Últimos 15 dias)
        ------------------------------------------------------ */
        const porDia = {};

        pedidos.forEach(p => {
            const d = new Date(p.data).toLocaleDateString("pt-BR");
            porDia[d] = (porDia[d] || 0) + 1;
        });

        const labels = Object.keys(porDia).slice(-15);
        const valores = labels.map(d => porDia[d]);

        if (window.graficoPedidos) window.graficoPedidos.destroy();

        window.graficoPedidos = new Chart(ctx1, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Pedidos por Dia",
                    data: valores,
                    borderWidth: 3
                }]
            }
        });

        /* -----------------------------------------------------
           5️⃣ GRÁFICO — PRODUTOS MAIS VENDIDOS
        ------------------------------------------------------ */
        const prodCount = {};

        pedidos.forEach(p => {
            (p.itens || []).forEach(i => {
                prodCount[i.nome] = (prodCount[i.nome] || 0) + i.qtd;
            });
        });

        const top = Object.entries(prodCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        const labelsProd = top.map(t => t[0]);
        const qtdProd = top.map(t => t[1]);

        if (window.graficoProdutos) window.graficoProdutos.destroy();

        window.graficoProdutos = new Chart(ctx2, {
            type: "bar",
            data: {
                labels: labelsProd,
                datasets: [{
                    label: "Mais Vendidos",
                    data: qtdProd,
                    borderWidth: 1
                }]
            }
        });

    } catch (err) {
        console.error("Erro ao carregar relatórios:", err);
        alert("Erro ao carregar relatórios.");
    }
}