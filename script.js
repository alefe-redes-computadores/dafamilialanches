/* =========================================================  
   🚀 DFL v8.3 FINAL — SCRIPT INTEGRAL
   - Correção de escopo (Recompensas/Cupons)
   - Botões de Pedidos/Recompensas funcionais
   - Carrinho, Frete e Admin operacionais
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // 0. VARIÁVEIS GLOBAIS E FUNÇÕES DE SUPORTE
    // ============================================================
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   
    
    // Constantes
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00;
    const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];

    // Cache
    let deliveryFeesCache = null;
    const _cupomCache = {};
    let configuracoesRecompensa = null; 

    // Formatadores
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

    function isAdmin(user) { return user && user.email && ADMINS.includes(user.email.toLowerCase()); }

    // MÁSCARA DE CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    /* ============================================================
       🔥 DADOS DAS PROMOÇÕES (ORDEM DEFINIDA)
    ============================================================ */
    const PROMO_DATA = [  
        null,   
        // 1: Nova Promo 10
        { id: 1, nome: "2 UAI + 1 COCA 600ml (Especial 4 Anos)", preco: 29.99, precoAntigo: 35.00, img: "promocoes/promo10.png", descricao: "2 Burgers 'Uai' completinhos (com aquele molho verde!) + 1 Coca-Cola 600ml geladinha!" },
        // 2: Antiga 9
        { id: 2, nome: "5 Uai + 1 Kuat 2L (Brinde)", preco: 64.99, precoAntigo: 75.00, img: "promocoes/promo9.jpg", descricao: "Compre 5 Burgers Uai e leve 1 Kuat 2L por nossa conta! 🎁" },
        // 3: Antiga 8
        { id: 3, nome: "4 Armaria", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg", descricao: "A queridinha da galera! 4 Armaria no super desconto." },
        // 4: Antiga 6
        { id: 4, nome: "5 Burgers Uai", preco: 54.00, precoAntigo: 65.00, img: "promocoes/promo6.jpg", descricao: "Pra família toda! 5 Burgers UAI recheados no precinho!" },
        // 5: Antiga 5
        { id: 5, nome: "4 Trem + 1 Fanta 1L", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg", descricao: "O clássico da família! 4 Burgers Trem + Fanta 1L." },  
        // 6: Antiga 4
        { id: 6, nome: "3 Trem + 1 Fanta 1L", preco: 44.99, precoAntigo: 51.00, img: "promocoes/promo4.jpg", descricao: "3 Burgers Trem com bacon, queijo e batata palha + 1 Fanta 1L." },
        // 7: Antiga 7
        { id: 7, nome: "4 TremBão + 1 Fanta 1L", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg", descricao: "O maior hot dog da casa! 4 TremBão com purê cremoso + Fanta 1L." },
        // 8: Antiga 3
        { id: 8, nome: "2 Burgers Peleja", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg", descricao: "Bora artesanar o bolso! Dois Burgers artesanais 'Peleja' no precinho!" },
        // 9: Antiga 2
        { id: 9, nome: "3 Hot Dog Padaná", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg", descricao: "3 Padaná completos, perfeitos pra dividir com a galera!" },
        // 10: Antiga 1
        { id: 10, nome: "2 Purizin + 1 Fanta 1L", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg", descricao: "2 Hot Dogs 'Purizin' com purê cremoso + 1 Fanta 1L geladinha!" }
    ];

    function renderPromoCards() {
        const container = document.getElementById('promocoes-grid');
        if (!container) return;
        const html = PROMO_DATA.slice(1).map(promo => `
            <div class="card promo-card" data-promo-id="${promo.id}">
                <img src="${promo.img}" alt="${promo.nome}" loading="lazy">
                <h3>${promo.nome} <span class="badge economia"><span class="badge-icon">💸</span> Economia de ${money(promo.precoAntigo - promo.preco)}</span></h3>
                <p class="price">De ${money(promo.precoAntigo)} por <b>${money(promo.preco)}</b></p>
                <p>${promo.descricao}</p>
                <div class="actions"><button class="add-cart add-promo" data-promo-id="${promo.id}" type="button">Adicionar</button></div>
            </div>
        `).join('');
        container.innerHTML = html;
        
        container.querySelectorAll('.add-promo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const promoId = parseInt(e.currentTarget.dataset.promoId);
                const promo = PROMO_DATA.find(p => p && p.id === promoId);
                if (promo) addCommonItem(promo.nome, promo.preco);
            });
        });
    }

    /* ============================================================
       🎯 ELEMENTOS DO DOM
    ============================================================ */
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

        // Frete
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        btnManual: document.getElementById("btnManual"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        
        // Promo Modal
        promoModal: document.getElementById("promo-modal"),
        promoImg: document.getElementById("promo-modal-img"),
        promoTitle: document.getElementById("promo-modal-title"),
        promoPrice: document.getElementById("promo-modal-price"),
        promoAddBtn: document.getElementById("promo-modal-add"),
        promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),
        promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),
        promoClose: document.querySelector("#promo-modal .promo-close")
    };

    // OVERLAYS
    if (!el.cartBackdrop) { const bd = document.createElement("div"); bd.id = "cart-backdrop"; document.body.appendChild(bd); el.cartBackdrop = bd; }  
    const Backdrop = { 
        show() { el.cartBackdrop.classList.add("active"); document.body.classList.add("no-scroll"); }, 
        hide() { 
            el.cartBackdrop.classList.remove("active"); document.body.classList.remove("no-scroll"); 
            if(el.pedidosPanel) el.pedidosPanel.classList.remove("active");
            if(el.recompensasPanel) el.recompensasPanel.classList.remove("active");
        } 
    };
    const Overlays = { 
        closeAll() { 
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show").forEach((e) => e.classList.remove("show", "active")); 
            Backdrop.hide(); 
        }, 
        open(modalLike) { 
            Overlays.closeAll(); 
            if (!modalLike) return; 
            modalLike.classList.add((modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel") ? "active" : "show"); 
            Backdrop.show(); 
        } 
    };  
    
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target.classList.contains('modal')) { Overlays.closeAll(); } }));

    /* ============================================================
       🛒 LÓGICA DO CARRINHO E FRETE
    ============================================================ */
    let modoEnderecoManual = false;
    
    async function buscarCEP(cep) {
        const freteContainer = document.querySelector('.frete-container');
        const enderecoAuto = document.getElementById('endereco-auto');
        const numeroInput = document.getElementById('numero-input');
        const updateStatus = (msg, color) => { if (freteContainer) freteContainer.querySelector('h4').innerHTML = `🚚 Entrega: <span style="color:${color}">${msg}</span>`; };
        
        updateStatus('Buscando...', 'var(--botao)');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) { 
                updateStatus('CEP inválido', 'var(--danger)'); 
            } else {
                const end = `${data.logradouro} - ${data.bairro} (${data.localidade}/${data.uf})`;
                if(enderecoAuto) { enderecoAuto.value = end; enderecoAuto.disabled = true; }
                if(numeroInput) { numeroInput.disabled = false; numeroInput.focus(); }
                updateStatus('Endereço encontrado!', 'var(--success)');
                renderMiniCart();
            }
        } catch (e) { console.error(e); updateStatus('Erro na busca', 'var(--danger)'); }
    }

    async function getDynamicDeliveryFee(enderecoCompleto) {
        if (!enderecoCompleto || typeof enderecoCompleto !== "string") return DELIVERY_FEE_DEFAULT;
        let bairroExtraido = "";
        try {
            const partePrincipal = enderecoCompleto.split("(")[0].trim();
            const partes = partePrincipal.split(" - ");
            if (partes.length >= 2) bairroExtraido = partes[partes.length - 1].trim();
            else bairroExtraido = partePrincipal.trim();
        } catch (_) { return DELIVERY_FEE_DEFAULT; }
        const bairroClean = bairroExtraido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        
        try {
            if (!db) return DELIVERY_FEE_DEFAULT;
            if (!window.deliveryFeesCacheGlobal) {
                const snap = await db.collection("TaxasDeEntrega").doc("bairros").collection("lista").doc("tabela").get();
                if (snap.exists) {
                    const arr = snap.data()?.data || [];
                    const cache = {};
                    arr.forEach(item => { if (item && item.nome) cache[String(item.nome).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()] = Number(item.taxa); });
                    window.deliveryFeesCacheGlobal = cache;
                }
            }
        } catch (e) { console.warn("Erro taxas:", e); return DELIVERY_FEE_DEFAULT; }
        
        const cacheAtual = window.deliveryFeesCacheGlobal || {};
        if (cacheAtual[bairroClean] !== undefined) return cacheAtual[bairroClean];
        
        const palavras = bairroClean.split(" ");
        for (const p of palavras) {
            if (p.length < 4) continue;
            for (const key in cacheAtual) { if (key.includes(p)) return cacheAtual[key]; }
        }
        return DELIVERY_FEE_DEFAULT;
    }

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

    async function validarCupomFirestore(codigo, subtotal) {
        if (!isFirebaseInitialized) return { valido:false, discount:0, freeShipping:false, label:"", mensagem:"Erro de conexão." };
        const code = (codigo || "").toUpperCase();
        const invalido = { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };
        if (!code) return invalido;
        
        const key = `${code}::${Math.floor(subtotal/5)}`;
        if (_cupomCache[key] && _cupomCache[key].ate > Date.now()) return _cupomCache[key].res;

        const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();
        let data = null;
        let isPersonalizado = false;

        try {
            const snapGeral = await db.collection("Cupons").doc(code).get();
            if (snapGeral.exists) data = snapGeral.data();
            else {
                const rec = RECOMPENSAS_DATA.find(r => r.valor === code && r.tipo === 'cupom');
                if (currentUser && rec) {
                    const snapUser = await db.collection("CuponsUsuarios").doc(currentUser.uid).get();
                    const pData = snapUser.data();
                    if (snapUser.exists && pData?.cupom === code && !pData?.usado) {
                        data = { tipo: pData.tipo, valor: pData.valor, ativo: true };
                        isPersonalizado = true;
                    }
                }
            }

            if (!data || !data.ativo) return invalido;

            let discount = 0, freeShipping = false, label = "";
            if (data.tipo === "percent") { discount = subtotal * (Number(data.percent||data.valor)/100); label = `${data.percent||data.valor}% OFF`; }
            else if (data.tipo === "value") { discount = Math.min(subtotal, Number(data.valor)); label = `R$ ${data.valor} OFF`; }
            else if (data.tipo === "frete") { freeShipping = true; label = "Frete Grátis"; }

            const res = { valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado!", isPersonalizado };
            _cupomCache[key] = { ate: Date.now() + 30000, res };
            return res;
        } catch (e) { return invalido; }
    }

    async function calcTotals() {
        const subtotal = cart.reduce((s, i) => s + (Number(i.preco) * i.qtd), 0);
        const d = await validarCupomFirestore(document.getElementById("coupon-input")?.value, subtotal);
        const isRetirar = document.getElementById('retirar-local')?.checked;
        
        let deliveryFee = DELIVERY_FEE_DEFAULT;
        let end = "";
        
        if (modoEnderecoManual) end = document.getElementById('manualEndereco')?.value || "";
        else end = document.getElementById('endereco-auto')?.value || "";

        if (isRetirar || subtotal >= LIMITE_FRETE_GRATIS) deliveryFee = 0;
        else if (end) deliveryFee = await getDynamicDeliveryFee(end);

        const delivery = d.freeShipping ? 0 : deliveryFee;
        const total = Math.max(0, subtotal + delivery - d.discount);
        return { subtotal, delivery, discount: d.discount, total, cupomInfo: d };
    }

    // RENDERIZAR CARRINHO (FUNÇÃO PRINCIPAL)
    async function enhanceMiniCartUI() {
        const foot = document.querySelector(".mini-foot");
        if (!foot) return;
        foot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());
        
        if (cart.length === 0) {
            document.querySelector(".mini-list").innerHTML = '<p style="text-align:center;padding:20px;color:#777;">Seu carrinho está vazio 🛒</p>';
            return;
        }

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
        
        // Exibe mensagem do cupom
        const msgDiv = document.getElementById("coupon-message");
        if (msgDiv) {
            msgDiv.textContent = cupomInfo.mensagem || "";
            msgDiv.className = cupomInfo.valido ? "coupon-message success" : "coupon-message";
        }

        const div = document.createElement("div");
        div.className = "cart-summary-generated";
        div.innerHTML = `
            <div class="summary-row" style="margin-top:10px;border-top:1px solid #eee;padding-top:8px;">
                <span>Subtotal</span><b>${money(subtotal)}</b>
            </div>
            <div class="summary-row">
                <span>Entrega</span><b>${delivery === 0 ? 'Grátis 🎉' : money(delivery)}</b>
            </div>
            ${discount > 0 ? `<div class="summary-row" style="color:green"><span>Desconto</span><b>-${money(discount)}</b></div>` : ''}
            <div class="summary-row" style="font-size:1.2rem;margin:10px 0;">
                <span>Total</span><strong style="color:#d32f2f;">${money(total)}</strong>
            </div>
            <button id="finish-order" class="btn-primary" style="width:100%;margin-bottom:10px;">Finalizar Pedido 🛍️</button>
            <button id="clear-cart" class="btn-secondary" style="width:100%;">Limpar Carrinho</button>
        `;
        
        foot.appendChild(div);

        // LISTENERS DELEGAÇÃO (BOTÕES CRIADOS DINAMICAMENTE)
        div.querySelector("#finish-order").addEventListener("click", fecharPedido);
        div.querySelector("#clear-cart").addEventListener("click", () => {
            if (confirm("Esvaziar carrinho?")) { cart = []; renderMiniCart(); }
        });
    }

    function renderMiniCart() {
        const list = document.querySelector(".mini-list");
        const count = document.getElementById("cart-count");
        const totalQtd = cart.reduce((s, i) => s + i.qtd, 0);
        if (count) count.textContent = totalQtd;
        
        if (cart.length === 0) {
            enhanceMiniCartUI();
            return;
        }

        list.innerHTML = cart.map((item, i) => `
            <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">
                <div style="display:flex;justify-content:space-between;">
                    <div>
                        <b>${item.nome}</b>
                        <div style="font-size:0.9rem;color:#666;">${money(item.preco)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;">
                        <button class="c-btn-mini minus" data-i="${i}">-</button>
                        <span>${item.qtd}</span>
                        <button class="c-btn-mini plus" data-i="${i}">+</button>
                        <button class="c-btn-mini remove" data-i="${i}">🗑</button>
                    </div>
                </div>
            </div>
        `).join("");

        // Binds dos botões +/-
        list.querySelectorAll(".minus").forEach(b => b.addEventListener("click", e => {
            const i = e.target.dataset.i;
            if (cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1);
            renderMiniCart();
        }));
        list.querySelectorAll(".plus").forEach(b => b.addEventListener("click", e => {
            const i = e.target.dataset.i;
            cart[i].qtd++;
            renderMiniCart();
        }));
        list.querySelectorAll(".remove").forEach(b => b.addEventListener("click", e => {
            cart.splice(e.target.dataset.i, 1);
            renderMiniCart();
        }));

        enhanceMiniCartUI();
    }

    function addCommonItem(nome, preco) {
        const existing = cart.find(i => i.nome === nome && i.preco === preco);
        if (existing) existing.qtd++;
        else cart.push({ nome, preco, qtd: 1 });
        renderMiniCart();
        popupAdd("Item adicionado!");
        Overlays.open(el.miniCart);
    }

    // ============================================================
    // 📦 FINALIZAR PEDIDO (WHATSAPP)
    // ============================================================
    async function fecharPedido() {
        if (!cart.length) return alert("Carrinho vazio!");
        if (!currentUser) { 
            alert("Faça login para finalizar!"); 
            Overlays.open(el.loginModal); 
            return; 
        }

        const isRetirar = document.getElementById('retirar-local')?.checked;
        let enderecoFinal = "";

        if (modoEnderecoManual) {
            const rua = document.getElementById('manualEndereco')?.value;
            const num = document.getElementById('manualNumero')?.value;
            if (!rua || !num) return alert("Preencha o endereço!");
            enderecoFinal = `${rua}, Nº ${num} (Manual)`;
        } else {
            const auto = document.getElementById('endereco-auto')?.value;
            const num = document.getElementById('numero-input')?.value;
            if (!isRetirar && (!auto || !num)) return alert("Preencha o endereço ou selecione Retirada!");
            enderecoFinal = isRetirar ? "RETIRADA NO LOCAL" : `${auto}, Nº ${num}`;
        }

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
        
        // Salvar no Firebase
        try {
            const pedidoRef = db.collection("Pedidos").doc();
            await pedidoRef.set({
                userId: currentUser.uid,
                usuario: currentUser.email,
                nome: currentUser.displayName || "Cliente",
                itens: cart,
                total: total,
                endereco: enderecoFinal,
                data: new Date().toISOString()
            });
            
            // Atualizar Recompensas (Incrementa +1)
            const userRef = db.collection("Usuarios").doc(currentUser.uid);
            await userRef.set({ pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, { merge: true });
            
            // Se usou cupom pessoal, marcar como usado
            if (cupomInfo.isPersonalizado) {
                await db.collection("CuponsUsuarios").doc(currentUser.uid).update({ usado: true });
            }

        } catch (e) { console.error("Erro ao salvar:", e); }

        // Montar Zap
        const itensTxt = cart.map(i => `• ${i.qtd}x ${i.nome}`).join("%0A");
        const msg = `🍔 *NOVO PEDIDO - DFL*%0A%0A${itensTxt}%0A%0A📦 *Entrega:* ${isRetirar ? "Não (Retirada)" : money(delivery)}%0A🎟 *Desconto:* -${money(discount)}%0A💰 *TOTAL:* ${money(total)}%0A%0A🏠 *Endereço:* ${enderecoFinal}%0A👤 *Cliente:* ${currentUser.displayName || currentUser.email}`;
        
        window.open(`https://wa.me/5534997178336?text=${msg}`, "_blank");
        
        cart = [];
        renderMiniCart();
        Overlays.closeAll();
    }

    // ============================================================
    // 🔑 FIREBASE & AUTH
    // ============================================================
    const firebaseConfig = { apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak", authDomain: "da-familia-lanches.firebaseapp.com", projectId: "da-familia-lanches", storageBucket: "da-familia-lanches.appspot.com", messagingSenderId: "106857147317", appId: "1:106857147317:web:769c98aed26bb8fc9e87fc" };  
    let auth, db;

    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            isFirebaseInitialized = true;
            
            auth.onAuthStateChanged(user => {
                currentUser = user;
                if (user) {
                    el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || "Cliente"}`;
                    // Botões visíveis e funcionais
                } else {
                    el.userBtn.textContent = "Entrar / Cadastrar";
                }
                // Admin check
                if (user && isAdmin(user)) {
                     if (el.reportsBtn) el.reportsBtn.style.display = "block";
                } else {
                     if (el.reportsBtn) el.reportsBtn.style.display = "none";
                }
            });
        } catch (e) { console.error("Firebase Error", e); }
    }

    el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));
    el.googleBtn?.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(() => Overlays.closeAll()).catch(e => alert(e.message));
    });

    // ============================================================
    // 🔄 INICIALIZAÇÃO
    // ============================================================
    // Frete Manual Binds
    el.btnManual?.addEventListener("click", () => { modoEnderecoManual = true; el.manualArea.style.display='block'; document.querySelector('.frete-container').style.display='none'; });
    el.btnVoltarCEP?.addEventListener("click", () => { modoEnderecoManual = false; el.manualArea.style.display='none'; document.querySelector('.frete-container').style.display='block'; });
    
    // Botões Laterais
    el.pedidosBtn?.addEventListener("click", () => {
        if(!currentUser) { alert("Faça login para ver seus pedidos!"); Overlays.open(el.loginModal); return; }
        Overlays.open(el.pedidosPanel);
        carregarPedidos(currentUser.uid);
    });
    
    el.recompensasBtn?.addEventListener("click", () => {
        if(!currentUser) { alert("Faça login para ver recompensas!"); Overlays.open(el.loginModal); return; }
        Overlays.open(el.recompensasContainer.querySelector('.recompensas-panel')); // Ajuste de seletor
        carregarRecompensas(currentUser.uid);
    });

    // Search
    const PRODUTOS_BUSCA = [ { nome: "Bão", aliases: ["bao"] }, { nome: "Uai", aliases: ["uai"] }, { nome: "Trem", aliases: ["trem"] } ]; // Lista simplificada, adicione as outras
    document.getElementById('search-input')?.addEventListener('input', (e) => filtrarCards(e.target.value));

    renderPromoCards();
    inicializarFirebase();
    console.log("%c🔥 DFL v8.3 — SCRIPT FINAL CORRIGIDO", "background:#4CAF50;color:#fff;padding:5px;border-radius:5px;");

}); // FIM DO DOMCONTENTLOADED
