/* =========================================================  
   🚀 DFL v6.0 — LÓGICA COMPLETA
   - Busca Inteligente (Levenshtein)
   - Promoções em Grade (Visual Premium)
   - Modais e Botões Corrigidos
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {

    /* --- 1. BUSCA INTELIGENTE --- */
    const levenshtein = (a, b) => {
        if(!a || !b) return (a || b).length;
        const matrix = [];
        for(let i=0; i<=b.length; i++){ matrix[i] = [i]; }
        for(let j=0; j<=a.length; j++){ matrix[0][j] = j; }
        for(let i=1; i<=b.length; i++){
            for(let j=1; j<=a.length; j++){
                if(b.charAt(i-1) == a.charAt(j-1)){ matrix[i][j] = matrix[i-1][j-1]; }
                else { matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1)); }
            }
        }
        return matrix[b.length][a.length];
    };

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".card, .promo-card-styled"); // Busca em ambos tipos de card
            
            cards.forEach(card => {
                let nome = card.getAttribute("data-name")?.toLowerCase() || "";
                if(!nome) nome = card.querySelector("h3")?.innerText.toLowerCase() || "";

                if (!termo) { card.style.display = "flex"; return; }
                
                const contem = nome.includes(termo);
                const erroAceitavel = termo.length > 3 && levenshtein(nome, termo) <= 2;

                if (contem || erroAceitavel) card.style.display = "flex"; 
                else card.style.display = "none";
            });
        });
    }

    /* --- MÁSCARA CEP --- */
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
        return '👤';   
    }  

    /* --- DADOS PROMOÇÃO (Com Descrição) --- */
    const PROMO_DATA = [  
        null,   
        { id: 1, nome: "Dupla Purizin + Fanta", desc: "2 Hot Dogs 'Purizin' com Purê Cremoso, milho e batata + 1 Fanta Laranja Geladinha!", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" },  
        { id: 2, nome: "Trio Padaná - Desconto Fiel", desc: "3 Hot Dogs 'Padaná' completos para dividir com a galera!", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" },  
        { id: 3, nome: "Combo 2 Peleja Artesanal", desc: "2 Burgers Artesanais 'Peleja' com muito sabor e qualidade.", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" },  
        { id: 4, nome: "Trio Trem Completo + Refri", desc: "3 Burgers 'Trem' com bacon, queijo e batata palha + Fanta 1L!", preco: 44.99, precoAntigo: 52.00, img: "promocoes/promo4.jpg" },  
        { id: 5, nome: "Combo 4 Trem + Fanta 1L", desc: "O clássico da família: 4 sanduíches deliciosos e bebida.", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" },  
        { id: 6, nome: "Combo 5 Uai", desc: "5 Lanches Uai para matar a fome de todo mundo.", preco: 54.99, precoAntigo: 65.00, img: "promocoes/promo6.jpg" },  
        { id: 7, nome: "Combo 4 TremBão + Fanta", desc: "4 Dogões com tudo dentro + Refri.", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" },  
        { id: 8, nome: "Combo 4 Armaria", desc: "4 Sanduíches Armaria com bastante recheio.", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" },  
        { id: 9, nome: "Combo 5 Uai + Kuat 2L", desc: "A festa completa com 5 lanches e refri grande.", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" }  
    ];

    /* ------------------ 🎯 ELEMENTOS DOM ------------------ */  
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
        promocoesGrid: document.getElementById("promocoes-area"),
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

    /* --- 2. RENDERIZAR PROMOÇÕES EM GRADE (VISUAL PREMIUM) --- */
    function renderPromocoesGrid() {
        if (!el.promocoesGrid) return;
        
        el.promocoesGrid.innerHTML = PROMO_DATA.map(p => {
            if(!p) return '';
            return `
            <div class="promo-card-styled" data-name="${p.nome}" data-price="${p.preco}">
                <img src="${p.img}" alt="${p.nome}" loading="lazy">
                <div class="promo-body">
                    <h3 class="promo-title">${p.nome}</h3>
                    <p class="promo-desc">${p.desc}</p>
                    <div class="promo-prices">
                        <span class="promo-old">De ${money(p.precoAntigo)}</span>
                        <span class="promo-new">Por ${money(p.preco)}</span>
                    </div>
                    <button class="btn-add-green" onclick="window.addToCart('${p.nome}', ${p.preco})">Adicionar</button>
                </div>
            </div>`;
        }).join('');
    }
    window.addToCart = (nome, preco) => addCommonItem(nome, preco);
    renderPromocoesGrid();

    /* --- 3. TIMER --- */
    function iniciarTimer() {
        const display = document.getElementById("promo-timer");
        if (!display) return;
        const update = () => {
            const now = new Date(); const target = new Date();
            target.setHours(23, 59, 59); 
            let diff = target - now; if (diff < 0) diff = 0;
            const h = Math.floor(diff/3600000);
            const m = Math.floor((diff/60000)%60);
            const s = Math.floor((diff/1000)%60);
            display.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        };
        setInterval(update, 1000); update();
    }
    iniciarTimer();

    /* --- 4. MODAIS (FECHAMENTO ROBUSTO) --- */
    if (!el.cartBackdrop) {
        const bd = document.createElement("div"); bd.id = "cart-backdrop";
        document.body.appendChild(bd); el.cartBackdrop = bd;
    }

    const Overlays = {
        closeAll() {
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach((e) => e.classList.remove("show", "active"));
            el.cartBackdrop.classList.remove("active");
            document.body.classList.remove("no-scroll");
        },
        open(modal) {
            Overlays.closeAll();
            if(!modal) return;
            if(modal.id === "mini-cart" || modal.id.includes("panel")) modal.classList.add("active");
            else modal.classList.add("show");
            el.cartBackdrop.classList.add("active");
            document.body.classList.add("no-scroll");
        }
    };

    el.cartBackdrop.addEventListener("click", Overlays.closeAll);
    
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => { if(e.target === m) Overlays.closeAll(); });
    });

    document.addEventListener('click', (e) => {
        if(e.target.matches('.fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .login-close, .promo-close, .dashboard-close')) {
            Overlays.closeAll();
        }
    });

    /* ------------------ 5. LÓGICA DE COMPRA -------------- */
    function addCommonItem(nome, preco) {
        const low = (nome||"").toLowerCase();
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(nome)) { 
             const isCasal = low.includes("casal");
             const opts = isCasal 
                ? [{l:"Fanta 1L",d:0.01}, {l:"Coca 1L",d:3}, {l:"Coca Zero 1L",d:3}]
                : [{l:"Kuat 2L",d:0.01}, {l:"Coca 2L",d:5}, {l:"Coca Zero 2L",d:5}];
             
             const modal = document.getElementById("combo-modal");
             const body = document.getElementById("combo-body");
             if(modal && body) {
                 body.innerHTML = opts.map((o,i)=> `<label style="display:flex;justify-content:space-between;padding:12px;border:1px solid #ddd;margin-bottom:5px;border-radius:8px;background:#fff;"><span style="font-weight:bold">${o.l}</span> <span style="color:#d32f2f;">+${money(o.d)}</span> <input type="radio" name="cd" value="${i}" ${i===0?'checked':''}></label>`).join("");
                 const btn = document.getElementById("combo-confirm");
                 btn.onclick = () => {
                     const sel = body.querySelector('input:checked');
                     if(sel) {
                         const opt = opts[sel.value];
                         cart.push({nome:`${nome} + ${opt.l}`, preco:preco+opt.d, qtd:1});
                         renderMiniCart(); popupAdd("Combo adicionado!"); Overlays.closeAll();
                     }
                 };
                 Overlays.open(modal);
             }
             return;
        }
        const found = cart.find((i) => i.nome === nome && i.preco === preco);
        if(found) found.qtd++; else cart.push({nome, preco, qtd:1});
        renderMiniCart(); popupAdd(`${nome} adicionado!`);
    }

    // Binds
    document.querySelectorAll(".add-cart").forEach(btn => btn.addEventListener("click", e => {
        const c = e.currentTarget.closest(".card");
        if(c) addCommonItem(c.dataset.name, parseFloat(c.dataset.price));
    }));

    // Extras
    const extras = [ {n:"Cebola",p:0.99}, {n:"Salada",p:1.99}, {n:"Ovo",p:1.99}, {n:"Bacon",p:2.99}, {n:"Hambúrguer",p:2.99}, {n:"Cheddar",p:3.99} ];
    document.querySelectorAll(".extras-btn").forEach(btn => btn.addEventListener("click", e => {
        const c = e.currentTarget.closest(".card");
        const nome = c.dataset.name;
        const base = parseFloat(c.dataset.price);
        const modal = document.getElementById("extras-modal");
        const list = modal.querySelector(".extras-list");
        list.innerHTML = extras.map((ex,i)=> `<label style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;"><span>${ex.n} (+${money(ex.p)})</span><input type="checkbox" value="${i}"></label>`).join("");
        document.getElementById("extras-confirm").onclick = () => {
            const sels = [...list.querySelectorAll("input:checked")];
            const totalExtras = sels.reduce((acc, el) => acc + extras[el.value].p, 0);
            const nomesExtras = sels.map(el => extras[el.value].n).join(", ");
            const finalName = nomesExtras ? `${nome} + ${nomesExtras}` : nome;
            cart.push({nome:finalName, preco: base+totalExtras, qtd:1});
            renderMiniCart(); popupAdd("Com adicionais!"); Overlays.closeAll();
        };
        Overlays.open(modal);
    }));

    /* --- 6. CARRINHO UI --- */
    function renderMiniCart() {
        if (!el.miniList) return;
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
        if (el.cartCount) el.cartCount.textContent = totalItens;
        
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        const falta = LIMITE_FRETE_GRATIS - sub;
        const pct = Math.min(100, (sub/LIMITE_FRETE_GRATIS)*100);
        if(el.progressFill) el.progressFill.style.width = `${pct}%`;
        if(el.progressText) el.progressText.innerHTML = sub >= LIMITE_FRETE_GRATIS ? "🎉 <b>Frete Grátis Conquistado!</b>" : `Faltam <b>${money(falta)}</b> para frete grátis`;

        if (!cart.length) {
            el.miniList.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">Carrinho vazio</p>';
            if(el.miniFoot.querySelector(".cart-generated")) el.miniFoot.querySelector(".cart-generated").remove();
            return;
        }

        el.miniList.innerHTML = cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
                <div style="flex:1">
                    <div style="font-weight:bold; font-size:0.9rem;">${item.nome}</div>
                    <div style="color:#666; font-size:0.8rem;">${money(item.preco)} x ${item.qtd}</div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button onclick="changeQtd(${idx},-1)" style="background:#ff4081;color:white;border:none;width:28px;height:28px;border-radius:4px;">-</button>
                    <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
                    <button onclick="changeQtd(${idx},1)" style="background:#4caf50;color:white;border:none;width:28px;height:28px;border-radius:4px;">+</button>
                    <button onclick="removeItem(${idx})" style="background:#d32f2f;color:white;border:none;width:28px;height:28px;border-radius:4px;">🗑</button>
                </div>
            </div>
        `).join("");
        
        updateCartTotals();
    }
    
    window.changeQtd = (i, d) => { if(cart[i].qtd+d > 0) cart[i].qtd+=d; else cart.splice(i,1); renderMiniCart(); };
    window.removeItem = (i) => { cart.splice(i,1); renderMiniCart(); };

    async function updateCartTotals() {
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        let frete = DELIVERY_FEE_DEFAULT;
        const manual = document.getElementById("manualEndereco")?.value;
        const auto = document.getElementById("endereco-auto")?.value;
        const retirar = document.getElementById("retirar-local")?.checked;
        
        if (retirar || sub >= LIMITE_FRETE_GRATIS) frete = 0;
        else if (manual || auto) {
             if(window.deliveryFeesCacheGlobal) { /* lógica de frete dinâmico simplificada */ }
        }

        const foot = el.miniFoot;
        if(foot.querySelector(".cart-generated")) foot.querySelector(".cart-generated").remove();
        
        const div = document.createElement("div");
        div.className = "cart-generated";
        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-top:10px;border-top:1px solid #eee;padding-top:10px;"><span>Subtotal:</span> <b>${money(sub)}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Entrega:</span> <b>${frete===0?'Grátis':money(frete)}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:1.2rem;margin:10px 0;color:#d32f2f;"><span>Total:</span> <b>${money(sub+frete)}</b></div>
            <button id="btn-finalizar" style="width:100%;background:#4caf50;color:white;padding:12px;border:none;border-radius:8px;font-weight:bold;font-size:1rem;">Finalizar Pedido via WhatsApp</button>
        `;
        foot.appendChild(div);
        document.getElementById("btn-finalizar").onclick = finalizarPedido;
    }

    /* --- 7. FINALIZAR --- */
    async function finalizarPedido() {
        if(!currentUser) { alert("Por favor, faça login!"); Overlays.open(el.loginModal); return; }
        const retirar = document.getElementById("retirar-local").checked;
        let endereco = "";
        
        if(retirar) endereco = "RETIRADA NO LOCAL";
        else {
            const man = document.getElementById("manualEndereco").value;
            const numMan = document.getElementById("manualNumero").value;
            const auto = document.getElementById("endereco-auto").value;
            const numAuto = document.getElementById("numero-input").value;
            if(man && numMan) endereco = `${man}, Nº ${numMan} (Manual)`;
            else if(auto && numAuto) endereco = `${auto}, Nº ${numAuto}`;
            else return alert("Preencha o endereço ou selecione Retirar no Local.");
        }
        
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        const frete = (retirar || sub >= LIMITE_FRETE_GRATIS) ? 0 : DELIVERY_FEE_DEFAULT;
        const total = sub + frete;
        
        const itensTxt = cart.map(i => `• ${i.qtd}x ${i.nome}`).join("\n");
        const msg = `🍔 *PEDIDO DFL*\n👤 Cliente: ${currentUser.displayName || currentUser.email}\n\n${itensTxt}\n\n🚚 Frete: ${money(frete)}\n💰 *TOTAL: ${money(total)}*\n📍 ${endereco}`;
        
        try {
            await db.collection("Pedidos").add({ userId: currentUser.uid, usuario: currentUser.email, itens: itensTxt, total: total, data: new Date(), endereco: endereco });
            db.collection("Usuarios").doc(currentUser.uid).set({ pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, {merge:true});
        } catch(e) { console.error(e); }
        
        window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`, "_blank");
        cart = []; renderMiniCart(); Overlays.closeAll();
    }

    /* --- 8. AUTH & BOTÕES FIXOS --- */
    document.querySelector(".meus-pedidos-btn").addEventListener("click", () => {
        if(currentUser) { Overlays.open(document.getElementById("painelPedidos")); carregarPedidos(); }
        else { alert("Faça Login para ver seus pedidos!"); Overlays.open(el.loginModal); }
    });
    document.querySelector(".recompensas-btn").addEventListener("click", () => {
        if(currentUser) { Overlays.open(document.getElementById("recompensas-panel")); carregarRecompensas(); }
        else { alert("Faça Login para ver suas recompensas!"); Overlays.open(el.loginModal); }
    });

    async function carregarPedidos() {
        const div = document.getElementById("listaPedidos");
        div.innerHTML = "Carregando...";
        const snap = await db.collection("Pedidos").where("userId", "==", currentUser.uid).orderBy("data", "desc").get();
        div.innerHTML = snap.docs.map(d => `
            <div style="background:white;padding:10px;border-radius:8px;border:1px solid #ddd;margin-bottom:8px;">
                <b>${new Date(d.data().data.seconds*1000).toLocaleDateString()}</b> — ${money(d.data().total)}<br>
                <small style="color:#666">${d.data().itens.replace(/\n/g, ", ")}</small>
            </div>
        `).join("") || "Nenhum pedido encontrado.";
    }

    async function carregarRecompensas() {
        const div = document.getElementById("listaRecompensas");
        const u = await db.collection("Usuarios").doc(currentUser.uid).get();
        const feitos = u.data()?.pedidosFeitos || 0;
        document.getElementById("contador-valor").innerText = feitos;
        document.getElementById("progresso-bar").style.width = `${Math.min(100, (feitos/5)*100)}%`;
        document.getElementById("progresso-mensagem").innerText = `Faltam ${Math.max(0, 5-feitos)} para a próxima meta!`;
    }

    // Login
    el.loginForm.addEventListener("submit", e => {
        e.preventDefault(); inicializarFirebase();
        auth.signInWithEmailAndPassword(document.getElementById("login-email").value, document.getElementById("login-senha").value)
            .then(u => { currentUser=u.user; popupAdd("Logado!"); Overlays.closeAll(); })
            .catch(e => alert(e.message));
    });
    el.googleBtn.addEventListener("click", () => {
        inicializarFirebase();
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
            .then(u => { currentUser=u.user; popupAdd("Logado!"); Overlays.closeAll(); })
            .catch(e => alert(e.message));
    });
    el.userBtn.addEventListener("click", () => Overlays.open(el.loginModal));
    el.cartIcon.addEventListener("click", () => { renderMiniCart(); Overlays.open(el.miniCart); });

    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            if (!window.firebase) throw new Error("Erro Firebase lib");
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth(); db = firebase.firestore();
            isFirebaseInitialized = true;
            auth.onAuthStateChanged(u => {
                currentUser = u;
                el.userBtn.innerText = u ? `Olá, ${u.displayName?.split(" ")[0]||"Cliente"}` : "Entrar / Cadastrar";
                // Garante botões visíveis
                if(el.pedidosContainer) el.pedidosContainer.style.display = 'block';
                if(el.recompensasContainer) el.recompensasContainer.style.display = 'block';
            });
        } catch (e) { console.error(e); }
    }
    
    /* ENDEREÇO MANUAL TOGGLE */
    document.getElementById("btnManual").onclick = () => { document.querySelector(".frete-container").style.display="none"; document.getElementById("manualArea").style.display="block"; };
    document.getElementById("btnVoltarCEP").onclick = () => { document.querySelector(".frete-container").style.display="block"; document.getElementById("manualArea").style.display="none"; };

    /* STATUS + TIMER */  
    const atualizarStatus = safe(() => {  
        const agora = new Date(); const h = agora.getHours();  
        const aberto = h >= 18 && h < 23;   
        if (el.statusBanner) { el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; }  
    });  
    atualizarStatus(); setInterval(atualizarStatus, 60000);  

    /* ------------------ 🎟️ CUPOM ------------------ */  
    const couponForm = document.getElementById("coupon-form");  
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();  
    couponForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        const input = document.getElementById("coupon-input");  
        const val = (input?.value || "").trim().toUpperCase();  
        if (!val) {  
            couponApplied = ""; localStorage.removeItem("dflCoupon");  
            popupAdd("Cupom removido."); renderMiniCart(); return;  
        }  
        couponApplied = val; localStorage.setItem("dflCoupon", couponApplied);  
        renderMiniCart();   
    });

    function popupAdd(msg) {  
        let pop = document.querySelector(".popup-add");  
        if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }  
        pop.textContent = msg; pop.classList.add("show");  
        setTimeout(() => pop.classList.remove("show"), 2000);  
    }

    inicializarFirebase();
    console.log("DFL v6.0 FINAL Carregado");
});
