/* ==========================================================================
   🚀 DFL v12.0 — SCRIPT INTEGRAL (SEM CORTES)
   PARTE 1/4
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* --- 1. CONFIGURAÇÃO FIREBASE --- */
    const firebaseConfig = {
        apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
        authDomain: "da-familia-lanches.firebaseapp.com",
        projectId: "da-familia-lanches",
        storageBucket: "da-familia-lanches.appspot.com",
        messagingSenderId: "106857147317",
        appId: "1:106857147317:web:769c98aed26bb8fc9e87fc"
    };

    let db, auth;
    let currentUser = null;
    let isFirebaseInitialized = false;

    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            if (typeof firebase === 'undefined') {
                console.error("Firebase SDK não carregado.");
                return;
            }
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            } else {
                firebase.app();
            }
            
            db = firebase.firestore();
            auth = firebase.auth();
            
            // Habilita persistência para manter login ao recarregar
            db.enablePersistence().catch(err => {
                if (err.code == 'failed-precondition') {
                    console.log("Persistência: Múltiplas abas abertas.");
                } else if (err.code == 'unimplemented') {
                    console.log("Persistência não suportada.");
                }
            });

            isFirebaseInitialized = true;
            setupAuthListener();
            console.log("🔥 Firebase Conectado (Modo Completo)");
        } catch (e) {
            console.error("Erro Crítico Firebase:", e);
        }
    }

    function setupAuthListener() {
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            const btnUser = document.getElementById("user-btn");
            
            if (user) {
                const nome = user.displayName ? user.displayName.split(' ')[0] : 'Cliente';
                if(btnUser) btnUser.textContent = `Olá, ${nome}`;
                
                // Verifica Admin
                if(isAdmin(user)) createAdminFab();
                
                // Carrega dados iniciais
                carregarRecompensas(user.uid);
            } else {
                if(btnUser) btnUser.textContent = "Entrar / Cadastrar";
                // Esconde botão admin se deslogar
                const btnAdm = document.getElementById("reports-btn");
                if(btnAdm) btnAdm.style.display = 'none';
            }
        });
    }

    // Tenta iniciar imediatamente
    try { inicializarFirebase(); } catch(e){}


    /* --- 2. VARIÁVEIS GLOBAIS E HELPERS --- */
    const sound = new Audio("click.wav");
    let cart = [];
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();
    
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00;
    let deliveryFeesCache = null; // Cache para taxas de bairro

    // Formatador de Moeda
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
    
    // Função Segura (Evita crash)
    const safe = (fn) => (...a) => { 
        try { fn(...a); } catch (e) { console.error("Erro DFL:", e); } 
    };

    // Ícones de Fidelidade (Lista Completa)
    function getTierIcon(tier) {
        const level = tier ? String(tier).toLowerCase().trim() : '';
        if (level.includes('ouro')) return '🥇';
        if (level.includes('platina')) return '💎';
        if (level.includes('diamante')) return '👑';
        if (level.includes('rubi')) return '♦️';
        if (level.includes('esmeralda')) return '❇️';
        if (level.includes('lenda')) return '🦁';
        if (level.includes('mítico')) return '🦄';
        if (level.includes('brinde')) return '🎁';
        if (level.includes('coca')) return '🥤';
        return '👤';
    }

    // Algoritmo de Busca (Levenshtein)
    const levenshtein = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
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
    };


    /* --- 3. DADOS DOS PRODUTOS (ATUALIZADO COM SEUS PRINTS) --- */
    const PROMO_DATA = [
        null,
        { 
            id: 1, nome: "Promo 1 — 2 Purizin + 1 Fanta 1L", 
            desc: "2 Hot Dogs 'Purizin' com purê cremoso, milho e batata + 1 Fanta Laranja Geladinha!", 
            preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" 
        },
        { 
            id: 2, nome: "Promo 2 — 3 Hot Dog Padaná", 
            desc: "3 Hot Dogs 'Padaná' completos (2 salsichas, bacon, vinagrete) para dividir com a galera!", 
            preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" 
        },
        { 
            id: 3, nome: "Promo 3 — 2 Burgers Peleja", 
            desc: "2 Burgers Artesanais 'Peleja' (120g) com filé de frango e bacon. Sabor inigualável!", 
            preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" 
        },
        { 
            id: 4, nome: "Promo 4 — 3 Trem + 1 Fanta 1L", 
            desc: "3 Burgers 'Trem' tradicionais com bacon, milho, queijo e batata palha + Fanta 1L!", 
            preco: 44.99, precoAntigo: 51.00, img: "promocoes/promo4.jpg" 
        },
        { 
            id: 5, nome: "Promo 5 — 4 Trem + 1 Fanta 1L", 
            desc: "O clássico da família: 4 sanduíches Trem deliciosos e refri para acompanhar.", 
            preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" 
        },
        { 
            id: 6, nome: "Promo 6 — 5 Burgers Uai", 
            desc: "5 Lanches Uai (X-Bacon Salada) para matar a fome de todo mundo.", 
            preco: 54.00, precoAntigo: 65.00, img: "promocoes/promo6.jpg" 
        },
        { 
            id: 7, nome: "Promo 7 — 4 TremBão + 1 Fanta 1L", 
            desc: "4 Dogões 'TremBão' com tudo dentro (purê, bacon, 2 salsichas) + Refri.", 
            preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" 
        },
        { 
            id: 8, nome: "Promo 8 — 4 Armaria", 
            desc: "4 Sanduíches Armaria (Hambúrguer + Frango + Tudo) com bastante recheio.", 
            preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" 
        },
        { 
            id: 9, nome: "Promo 9 — 5 Uai + 1 Kuat 2L (Brinde)", 
            desc: "A festa completa com 5 lanches Uai e um refrigerante tamanho família.", 
            preco: 64.99, precoAntigo: 75.00, img: "promocoes/promo9.jpg" 
        }
    ];

    /* --- 4. RENDERIZAÇÃO DA GRADE DE PROMOÇÕES --- */
    function renderPromocoesGrid() {
        const container = document.getElementById("promocoes-area");
        if (!container) return;
        
        container.innerHTML = PROMO_DATA.map(p => {
            if(!p) return ''; 
            
            return `
            <div class="card promo-card-styled" data-name="${p.nome}" data-price="${p.preco}">
                <img src="${p.img}" alt="${p.nome}" onerror="this.src='logo.png'">
                <div class="card-content promo-body">
                    <h3 class="promo-title">${p.nome}</h3>
                    <p class="promo-desc">${p.desc}</p>
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

    /* --- 5. BUSCA INTELIGENTE --- */
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
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

    /* --- 6. CONTROLE DE MODAIS (SISTEMA ORIGINAL) --- */
    const cartBackdrop = document.getElementById("cart-backdrop");
    
    const Overlays = {
        closeAll() {
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach((e) => e.classList.remove("show", "active"));
            if(cartBackdrop) {
                cartBackdrop.style.opacity = "0";
                setTimeout(() => cartBackdrop.style.display = "none", 300);
            }
            document.body.classList.remove("no-scroll");
        },
        open(modalLike) {
            Overlays.closeAll();
            if (!modalLike) return;
            
            if(cartBackdrop) {
                cartBackdrop.style.display = "block";
                setTimeout(() => cartBackdrop.style.opacity = "1", 10);
            }
            
            modalLike.classList.add(
                (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"
            );
            document.body.classList.add("no-scroll");
        },
    };

    if(cartBackdrop) cartBackdrop.addEventListener("click", () => Overlays.closeAll());

    /* --- 7. EVENTOS DE CLIQUE GLOBAL (DELEGAÇÃO) --- */
    document.body.addEventListener('click', function(e) {
        // Adicionar ao Carrinho
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
        // Abrir Extras
        if (e.target.matches('.extras-btn')) {
            const card = e.target.closest('.card');
            openExtrasFor(card);
        }
    });

    // Botão Carrinho
    const cartIcon = document.getElementById("cart-icon");
    if(cartIcon) {
        cartIcon.addEventListener("click", () => {
            inicializarFirebase();
            renderMiniCart();
            Overlays.open(document.getElementById("mini-cart"));
        });
    }

    /* --- 8. LÓGICA DE COMBOS (COM COCA ZERO 1L) --- */
    const comboDrinkOptions = {
        casal: [ 
            { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
            { rotulo: "Coca-Cola 1L", delta: 3.0 },
            { rotulo: "Coca-Cola 1L Zero", delta: 3.0 } 
        ],
        familia: [ 
            { rotulo: "Kuat 2L (padrão)", delta: 0.01 }, 
            { rotulo: "Coca-Cola 2L", delta: 5.0 },
            { rotulo: "Coca-Cola 2L Zero", delta: 5.0 }
        ]
    };
    let _comboCtx = null;

    function addCommonItem(nome, preco) {
        const low = (nome||"").toLowerCase();
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(low)) {
             openComboModal(nome, preco);
             return;
        }
        
        // Adição Direta
        const found = cart.find(i => i.nome === nome && i.preco === preco);
        if (found) found.qtd++;
        else cart.push({ nome, preco, qtd: 1 });
        
        renderMiniCart();
        popupAdd(`${nome} adicionado!`);
    }

    function openComboModal(nome, preco) {
        const low = nome.toLowerCase();
        const grupo = low.includes("casal") ? "casal" : "familia";
        
        // Se não achar o grupo, adiciona direto
        if (!comboDrinkOptions[grupo]) {
            cart.push({ nome, preco, qtd: 1 });
            renderMiniCart();
            return;
        }

        const comboBody = document.getElementById("combo-body");
        comboBody.innerHTML = comboDrinkOptions[grupo].map((o, i) => `
          <div class="combo-option-line" onclick="document.getElementById('radio-${i}').checked=true">
            <span>${o.rotulo}</span>
            <span style="font-weight:700; color:#d32f2f;">+ ${money(o.delta)}</span>
            <input type="radio" id="radio-${i}" name="combo-drink" value="${i}" ${i===0?'checked':''}>
          </div>
        `).join("");
        
        _comboCtx = { nome, preco, grupo };
        Overlays.open(document.getElementById("combo-modal"));
    }

    // Confirmar Combo
    document.getElementById("combo-confirm")?.addEventListener("click", () => {
        const sel = document.querySelector('input[name="combo-drink"]:checked');
        if(!sel) return;
        
        const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
        const finalName = `${_comboCtx.nome} + ${opt.rotulo}`;
        const finalPrice = Number(_comboCtx.preco) + opt.delta;
        
        cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
        renderMiniCart(); 
        popupAdd("Combo Adicionado!"); 
        Overlays.closeAll();
    });

    /* --- 9. ADICIONAIS (EXTRAS) --- */
    const adicionais = [
        { nome: "Cebola", preco: 0.99 }, { nome: "Salada", preco: 1.99 },
        { nome: "Ovo", preco: 1.99 }, { nome: "Bacon", preco: 2.99 },
        { nome: "Hambúrguer Tradicional", preco: 2.99 }, { nome: "Cheddar Cremoso", preco: 3.99 },
        { nome: "Filé de Frango", preco: 5.99 }, { nome: "Burger Artesanal", preco: 7.99 }
    ];
    let produtoExtras = null; let produtoPrecoBase = 0;

    function openExtrasFor(card) {
        if(!card) return;
        produtoExtras = card.dataset.name;
        produtoPrecoBase = parseFloat(card.dataset.price);
        
        const list = document.querySelector(".extras-list");
        list.innerHTML = adicionais.map((a, i) => `
          <div class="extra-line">
            <span>${a.nome} — <b>${money(a.preco)}</b></span>
            <input type="checkbox" value="${i}">
          </div>
        `).join("");
        
        Overlays.open(document.getElementById("extras-modal"));
    }

    document.getElementById("extras-confirm")?.addEventListener("click", () => {
        const checks = document.querySelectorAll("#extras-modal input:checked");
        let total = produtoPrecoBase;
        let nomes = [];
        
        checks.forEach(c => {
            const ad = adicionais[+c.value];
            total += ad.preco;
            nomes.push(ad.nome);
        });
        
        const nomeFinal = nomes.length ? `${produtoExtras} + ${nomes.join(", ")}` : produtoExtras;
        cart.push({ nome: nomeFinal, preco: total, qtd: 1 });
        
        renderMiniCart(); popupAdd("Adicionado!"); Overlays.closeAll();
    });

    /* --- 10. RENDERIZAÇÃO DO CARRINHO --- */
    function renderMiniCart() {
        const list = document.querySelector(".mini-list");
        const count = document.getElementById("cart-count");
        if(count) count.textContent = cart.reduce((a,b)=>a+b.qtd,0);
        
        if (!list) return;

        if (cart.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:30px; color:#999;">Seu carrinho está vazio 🛒</p>';
        } else {
            list.innerHTML = cart.map((item, i) => `
                <div class="cart-item" style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <b style="font-size:0.95rem;">${item.nome}</b><br>
                        <small style="color:#666;">${money(item.preco)} x ${item.qtd}</small>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="window.updCart(${i}, -1)" style="padding:5px 10px; border:1px solid #ddd; background:#fff; border-radius:5px;">-</button>
                        <button onclick="window.updCart(${i}, 1)" style="padding:5px 10px; border:1px solid #ddd; background:#fff; border-radius:5px;">+</button>
                    </div>
                </div>
            `).join('');
        }
        
        updateTotals();
    }

    window.updCart = (i, d) => {
        cart[i].qtd += d;
        if (cart[i].qtd <= 0) cart.splice(i, 1);
        renderMiniCart();
    };

    /* --- 11. CÁLCULO DE TOTAIS, FRETE E CUPOM --- */
    let modoEnderecoManual = false;
    
    // Alternância de Modos de Endereço
    document.getElementById("btnManual")?.addEventListener("click", () => {
        modoEnderecoManual = true;
        document.getElementById("manualArea").style.display = 'block';
        document.querySelector(".frete-container").style.display = 'none';
    });
    
    document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        document.getElementById("manualArea").style.display = 'none';
        document.querySelector(".frete-container").style.display = 'block';
    });

    // Validação de Cupom (Firestore)
    const _cupomCache = {};
    async function validarCupom(codigo, subtotal) {
        if(!isFirebaseInitialized) return {valido:false, discount:0};
        const code = codigo.toUpperCase();
        if(!code) return {valido:false, discount:0};
        
        // Cache simples para não ler o banco toda hora
        const key = `${code}-${Math.floor(subtotal)}`;
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

    async function updateTotals() {
        const subtotal = cart.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
        
        // Barra de Progresso
        const fill = document.getElementById("progressFill");
        const txt = document.getElementById("progressText");
        if (fill) {
            const pct = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
            fill.style.width = `${pct}%`;
            txt.innerHTML = subtotal >= LIMITE_FRETE_GRATIS ? 
                "🎉 <strong>Frete Grátis!</strong>" : 
                `Faltam <b>${money(LIMITE_FRETE_GRATIS - subtotal)}</b> para o Frete Grátis`;
        }

        // Cupom
        const couponInput = document.getElementById("coupon-input");
        const cupomData = await validarCupom(couponApplied || couponInput?.value, subtotal);
        const msgDiv = document.getElementById("coupon-message");
        if(msgDiv) {
            msgDiv.textContent = cupomData.msg || "";
            msgDiv.style.color = cupomData.valido ? "green" : "red";
        }

        // Frete Dinâmico
        let deliveryFee = DELIVERY_FEE_DEFAULT;
        let endereco = "";
        
        if (modoEnderecoManual) endereco = document.getElementById("manualEndereco")?.value;
        else endereco = document.getElementById("endereco-auto")?.value;

        if(endereco) deliveryFee = await getDynamicDeliveryFee(endereco);
        
        // Regras de Isenção
        if(subtotal >= LIMITE_FRETE_GRATIS || cupomData.freeShipping || document.getElementById('retirar-local')?.checked) {
            deliveryFee = 0;
        }

        const total = Math.max(0, subtotal + deliveryFee - cupomData.discount);
        
        renderFooter(subtotal, deliveryFee, cupomData.discount, total);
    }

    async function getDynamicDeliveryFee(endereco) {
        if (document.getElementById('retirar-local')?.checked) return 0;
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

    function renderFooter(sub, del, disc, tot) {
        const foot = document.querySelector(".mini-foot");
        let sum = foot.querySelector(".cart-summary-generated");
        if(!sum) { sum = document.createElement("div"); sum.className="cart-summary-generated"; foot.appendChild(sum); }
        
        sum.innerHTML = `
            <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-top:15px;">
                <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span> <b>${money(sub)}</b></div>
                <div style="display:flex; justify-content:space-between;"><span>Entrega:</span> <b>${del===0?'Grátis':money(del)}</b></div>
                ${disc > 0 ? `<div style="display:flex; justify-content:space-between; color:green;"><span>Desconto:</span> <b>-${money(disc)}</b></div>` : ''}
                <div style="display:flex; justify-content:space-between; font-size:1.2rem; margin-top:8px; color:#d32f2f; border-top:1px solid #eee; padding-top:5px;">
                    <span>Total:</span> <b>${money(tot)}</b>
                </div>
            </div>
            <button id="btn-finish" style="width:100%; background:#4caf50; color:white; padding:15px; border:none; border-radius:10px; font-weight:bold; margin-top:10px; font-size:1rem; cursor:pointer;">FINALIZAR PEDIDO</button>
            <button id="btn-clear" style="width:100%; background:#ffebee; color:#d32f2f; padding:12px; border:none; border-radius:10px; font-weight:bold; margin-top:5px; cursor:pointer;">Limpar Carrinho</button>
        `;
        
        document.getElementById("btn-finish").onclick = () => fecharPedido(tot, del, disc);
        document.getElementById("btn-clear").onclick = () => { cart = []; renderMiniCart(); };
    }

    /* --- 12. FINALIZAÇÃO DO PEDIDO --- */
    async function fecharPedido(total, delivery, discount) {
        if(cart.length === 0) return alert("Carrinho vazio!");
        if(!currentUser) { alert("Faça Login para continuar!"); Overlays.open(document.getElementById("login-modal")); return; }

        let end = "";
        if(document.getElementById('retirar-local')?.checked) end = "RETIRADA NO LOCAL";
        else if(modoEnderecoManual) end = `${document.getElementById("manualEndereco").value}, ${document.getElementById("manualNumero").value} (Manual)`;
        else end = `${document.getElementById("endereco-auto").value}, ${document.getElementById("numero-input").value}`;

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

            const msg = `🍔 *Pedido DFL*\nCliente: ${pedido.cliente}\n\n${pedido.itens}\n\n📍 Endereço: ${end}\n💰 *Total: ${money(total)}*`;
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, '_blank');
            
            cart = []; renderMiniCart(); Overlays.closeAll();
        } catch(e) {
            console.error(e);
            // Fallback se o Firebase falhar
            const msg = `🍔 *Pedido DFL (Offline)*\n${pedido.itens}\n\n📍 ${end}\n💰 Total: ${money(total)}`;
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, '_blank');
        }
    }

    /* --- 13. LOGIN (GOOGLE + EMAIL) --- */
    document.getElementById("google-login")?.addEventListener("click", () => {
        inicializarFirebase();
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(r=>{currentUser=r.user; Overlays.closeAll(); popupAdd("Logado!");}).catch(e=>alert(e.message));
    });

    document.getElementById("login-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        inicializarFirebase();
        const em = document.getElementById("login-email").value;
        const pw = document.getElementById("login-senha").value;
        auth.signInWithEmailAndPassword(em, pw).then(r=>{currentUser=r.user; Overlays.closeAll(); popupAdd("Logado!");}).catch(e=>alert(e.message));
    });

    document.getElementById("user-btn")?.addEventListener("click", () => Overlays.open(document.getElementById("login-modal")));

    /* --- 14. ÁREA DE USUÁRIO (HISTÓRICO E RECOMPENSAS) --- */
    document.querySelector(".meus-pedidos-btn")?.addEventListener("click", () => {
        if(!currentUser) { Overlays.open(document.getElementById("login-modal")); return; }
        Overlays.open(document.getElementById("painelPedidos"));
        
        const div = document.getElementById("listaPedidos");
        div.innerHTML = "Carregando...";
        
        db.collection("Pedidos").where("uid", "==", currentUser.uid).orderBy("data", "desc").limit(10).get()
            .then(snap => {
                if(snap.empty) { div.innerHTML = "Nenhum pedido encontrado."; return; }
                div.innerHTML = snap.docs.map(d => {
                    const p = d.data();
                    return `<div class="pedido-card" style="padding:12px; border:1px solid #eee; margin-bottom:10px; background:#fff; border-radius:8px;">
                        <b>Data:</b> ${new Date(p.data).toLocaleDateString()}<br>
                        <b>Itens:</b><br> ${p.itens.replace(/\n/g, "<br>")}<br>
                        <b style="color:green">Total: ${money(p.total)}</b>
                    </div>`;
                }).join('');
            });
    });

    document.querySelector(".recompensas-btn")?.addEventListener("click", async () => {
        if(!currentUser) { Overlays.open(document.getElementById("login-modal")); return; }
        Overlays.open(document.getElementById("recompensas-panel"));
        
        const u = await db.collection("Usuarios").doc(currentUser.uid).get();
        const feitos = u.data()?.pedidosFeitos || 0;
        document.getElementById("contador-valor").textContent = feitos;
        
        // Barra de Progresso Fidelidade
        const meta = 5; // Exemplo: ganha a cada 5
        const pct = Math.min(100, (feitos / meta) * 100);
        document.getElementById("progresso-bar").style.width = `${pct}%`;
        document.getElementById("progresso-mensagem").textContent = feitos >= meta ? "Recompensa disponível!" : `Faltam ${meta - feitos} para o prêmio!`;

        const metas = [{l:5, v:"Coca Lata"}, {l:10, v:"Burguer Simples"}, {l:15, v:"Nível OURO"}];
        document.getElementById("listaRecompensas").innerHTML = metas.map(m => `
            <div class="recompensa-item" style="padding:12px; border:1px solid #eee; margin-bottom:5px; display:flex; align-items:center; ${feitos>=m.l?'background:#e8f5e9; border-color:green':''}">
                <span style="font-size:1.5rem; margin-right:10px;">${getTierIcon(m.v)}</span>
                <div style="flex:1"><b>${m.v}</b><br><small>Meta: ${m.l} Pedidos</small></div>
                <div>${feitos>=m.l?'✅':'🔒'}</div>
            </div>
        `).join('');
    });

    /* --- 15. PAINEL ADMIN (INTEGRAL) --- */
    const ADMINS = ["alefejohsefe@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(u) { return u && ADMINS.includes(u.email); }
    
    function createAdminFab() {
        const btn = document.getElementById("reports-btn");
        if(btn) {
            btn.style.display = "block";
            btn.onclick = () => {
                if(!document.getElementById("admin-dashboard")) createDashboardHTML();
                Overlays.open(document.getElementById("admin-dashboard"));
                carregarDadosAdmin();
            };
        }
    }

    function createDashboardHTML() {
        const d = document.createElement("div"); 
        d.id = "admin-dashboard"; 
        d.className = "modal";
        d.innerHTML = `
        <div class="modal-content" style="max-width:800px;">
            <div class="modal-head"><h3>Painel Admin</h3><button class="dashboard-close">✖</button></div>
            <div style="padding:20px;">
                <div style="display:flex; gap:15px; margin-bottom:20px;">
                    <div class="admin-stat-card" style="flex:1; padding:15px; border:1px solid #eee; border-radius:8px; text-align:center;">
                        Vendas<br><b id="adm-vendas" style="font-size:1.5rem; color:green;">...</b>
                    </div>
                    <div class="admin-stat-card" style="flex:1; padding:15px; border:1px solid #eee; border-radius:8px; text-align:center;">
                        Pedidos<br><b id="adm-peds" style="font-size:1.5rem; color:#ffb300;">...</b>
                    </div>
                </div>
                <canvas id="chart-vendas" height="100"></canvas>
                <div id="adm-lista" style="margin-top:20px; max-height:300px; overflow:auto;"></div>
            </div>
        </div>`;
        document.body.appendChild(d);
        d.querySelector(".dashboard-close").onclick = () => Overlays.closeAll();
    }

    async function carregarDadosAdmin() {
        const s = await db.collection("Pedidos").orderBy("data", "desc").limit(50).get();
        const peds = s.docs.map(d => d.data());
        
        document.getElementById("adm-vendas").textContent = money(peds.reduce((a,b)=>a+b.total,0));
        document.getElementById("adm-peds").textContent = peds.length;
        
        // Gráfico Simples
        if(window.Chart) {
            const ctx = document.getElementById("chart-vendas").getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: peds.slice(0,10).map(p => new Date(p.data).toLocaleDateString()).reverse(),
                    datasets: [{ label: 'Vendas (R$)', data: peds.slice(0,10).map(p=>p.total).reverse(), backgroundColor: '#ffb300' }]
                }
            });
        }
        document.getElementById("adm-lista").innerHTML = peds.map(p => `<div style="border-bottom:1px solid #eee; padding:8px;">${p.cliente} - <b>${money(p.total)}</b></div>`).join('');
    }

    /* --- 16. UTILITÁRIOS E POPUP --- */
    function popupAdd(msg) {
        let p = document.querySelector(".popup-add");
        if(!p) { p=document.createElement("div"); p.className="popup-add"; document.body.appendChild(p); }
        p.textContent = msg; p.classList.add("show"); setTimeout(()=>p.classList.remove("show"),2000);
    }

    // Banner de Status (Aberto/Fechado)
    setInterval(() => {
        const h = new Date().getHours();
        const aberto = h >= 18 && h < 23;
        const b = document.getElementById("status-banner");
        if(b) {
            b.textContent = aberto ? "🟢 ABERTO AGORA" : "🔴 FECHADO (Abre às 18h)";
            b.className = `status-banner ${aberto ? "open" : "closed"}`;
        }
    }, 60000);

    // Botão Calcular Frete (ViaCEP)
    document.getElementById("btn-calcular-frete")?.addEventListener("click", async () => {
        const cep = document.getElementById("cep-input").value.replace(/\D/g, '');
        if(cep.length !== 8) return popupAdd("CEP Inválido");
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if(data.erro) return popupAdd("CEP não encontrado");
            document.getElementById("endereco-auto").value = `${data.logradouro} - ${data.bairro}`;
            renderMiniCart();
        } catch(e) { popupAdd("Erro na busca"); }
    });

    console.log("🔥 DFL v12.0 MONSTRO CARREGADO");

}); // FIM DO ARQUIVO
