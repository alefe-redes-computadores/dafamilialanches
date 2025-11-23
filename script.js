/* =========================================================  
   🚀 DFL v6.3 FINAL STABLE — PARTE 1
   - Busca Inteligente + Grade Premium
   - Carrinho, Combos e Extras
   - Modais Robustos
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {

    // --- 0. INJETOR DE ESTILO (GARANTE O VISUAL PREMIUM) ---
    const style = document.createElement('style');
    style.innerHTML = `
        #promocoes-area { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 15px; padding: 5px 10px; }
        .promo-card-styled { display: flex; flex-direction: column; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #eee; height: 100%; transition: transform 0.2s; }
        .promo-card-styled:hover { transform: translateY(-3px); }
        .promo-card-styled img { width: 100%; height: 150px; object-fit: cover; border-bottom: 4px solid #ffca28; }
        .promo-body { padding: 12px; display: flex; flex-direction: column; flex: 1; text-align: center; }
        .promo-title { color: #d84315; font-size: 1rem; font-weight: 800; margin: 0 0 6px 0; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.5px; }
        .promo-desc { font-size: 0.8rem; color: #555; margin-bottom: 10px; line-height: 1.4; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .promo-prices { margin-bottom: 10px; }
        .promo-old { text-decoration: line-through; color: #999; font-size: 0.85rem; display: block; }
        .promo-new { color: #2e7d32; font-weight: 800; font-size: 1.4rem; }
        .btn-add-green { background: linear-gradient(180deg, #66bb6a 0%, #43a047 100%); color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 1rem; width: 100%; cursor: pointer; box-shadow: 0 4px 0 #2e7d32; transition: transform 0.1s; text-transform: uppercase; }
        .btn-add-green:active { transform: translateY(4px); box-shadow: 0 0 0 #2e7d32; }
        #search-input::placeholder { color: #888; font-style: italic; }
    `;
    document.head.appendChild(style);

    // --- 1. BUSCA INTELIGENTE ---
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
        searchInput.placeholder = "🔍 O que você está procurando? (Ex: TremBão, Peleja)";
        searchInput.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".card, .promo-card-styled"); 
            cards.forEach(card => {
                let nome = card.getAttribute("data-name")?.toLowerCase() || "";
                if(!nome) nome = card.querySelector("h3")?.innerText.toLowerCase() || "";
                if (!termo) { card.style.display = "flex"; return; }
                const contem = nome.includes(termo);
                const erroAceitavel = termo.length > 3 && levenshtein(nome, termo) <= 2;
                card.style.display = (contem || erroAceitavel) ? "flex" : "none";
            });
        });
    }

    // --- VARIÁVEIS GLOBAIS ---
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   
    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } }; 
    function getTierIcon(tier) { const t=String(tier).toLowerCase(); if(t.includes('ouro')) return '🥇'; if(t.includes('platina')) return '💎'; if(t.includes('diamante')) return '👑'; return '👤'; }

    // --- DADOS ---
    const PROMO_DATA = [  
        null,   
        { id: 1, nome: "Dupla Purizin + Fanta", desc: "2 Hot Dogs 'Purizin' com purê cremoso, milho e batata + 1 Fanta Laranja Geladinha!", preco: 34.99, precoAntigo: 40.00, img: "promocoes/promo1.jpg" },  
        { id: 2, nome: "Trio Padaná - Desconto Fiel", desc: "3 Hot Dogs 'Padaná' completos (2 salsichas, bacon, vinagrete) para dividir com a galera!", preco: 37.99, precoAntigo: 45.00, img: "promocoes/promo2.jpg" },  
        { id: 3, nome: "Combo 2 Peleja Artesanal", desc: "2 Burgers Artesanais 'Peleja' (120g) com filé de frango e bacon. Sabor inigualável!", preco: 39.99, precoAntigo: 52.00, img: "promocoes/promo3.jpg" },  
        { id: 4, nome: "Trio Trem Completo + Refri", desc: "3 Burgers 'Trem' tradicionais com bacon, milho, queijo e batata palha + Fanta 1L!", preco: 44.99, precoAntigo: 52.00, img: "promocoes/promo4.jpg" },  
        { id: 5, nome: "Combo 4 Trem + Fanta 1L", desc: "O clássico da família: 4 sanduíches Trem deliciosos e refri para acompanhar.", preco: 49.99, precoAntigo: 65.00, img: "promocoes/promo5.jpg" },  
        { id: 6, nome: "Combo 5 Uai", desc: "5 Lanches Uai (X-Bacon Salada) para matar a fome de todo mundo.", preco: 54.99, precoAntigo: 65.00, img: "promocoes/promo6.jpg" },  
        { id: 7, nome: "Combo 4 TremBão + Fanta", desc: "4 Dogões 'TremBão' com tudo dentro (purê, bacon, 2 salsichas) + Refri.", preco: 59.99, precoAntigo: 77.00, img: "promocoes/promo7.jpg" },  
        { id: 8, nome: "Combo 4 Armaria", desc: "4 Sanduíches Armaria (Hambúrguer + Frango + Tudo) com bastante recheio.", preco: 59.99, precoAntigo: 72.00, img: "promocoes/promo8.jpg" },  
        { id: 9, nome: "Combo 5 Uai + Kuat 2L", desc: "A festa completa com 5 lanches Uai e um refrigerante tamanho família.", preco: 64.99, precoAntigo: 79.99, img: "promocoes/promo9.jpg" }  
    ];

    // --- ELEMENTOS DOM ---
    const el = {  
        cartIcon: document.getElementById("cart-icon"), cartCount: document.getElementById("cart-count"),  
        miniCart: document.getElementById("mini-cart"), miniList: document.querySelector(".mini-list"), miniFoot: document.querySelector(".mini-foot"),  
        cartBackdrop: document.getElementById("cart-backdrop"),  
        extrasModal: document.getElementById("extras-modal"), extrasList: document.querySelector("#extras-modal .extras-list"), extrasConfirm: document.getElementById("extras-confirm"),  
        comboModal: document.getElementById("combo-modal"), comboBody: document.querySelector("#combo-modal #combo-body"), comboConfirm: document.getElementById("combo-confirm"),  
        loginModal: document.getElementById("login-modal"), loginForm: document.getElementById("login-form"), googleBtn: document.getElementById("google-login"),  
        promocoesGrid: document.getElementById("promocoes-area"),  
        userBtn: document.getElementById("user-btn"), statusBanner: document.getElementById("status-banner"), hoursBanner: document.querySelector(".hours-banner"), reportsBtn: document.getElementById("reports-btn"),   
        pedidosContainer: document.querySelector(".meus-pedidos"), pedidosBtn: document.querySelector(".meus-pedidos-btn"), pedidosPanel: document.getElementById("painelPedidos"), pedidosFecharBtn: document.querySelector(".fechar-pedidos"), pedidosLista: document.getElementById("listaPedidos"),  
        recompensasContainer: document.querySelector(".minhas-recompensas"), recompensasBtn: document.querySelector(".recompensas-btn"), recompensasPanel: document.getElementById("recompensas-panel"), recompensasFecharBtn: document.querySelector(".fechar-recompensas"), recompensasLista: document.getElementById("listaRecompensas"), historicoLista: document.getElementById("historicoRecompensas"),
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"), manualArea: document.getElementById("manualArea"), manualEndereco: document.getElementById("manualEndereco"), manualNumero: document.getElementById("manualNumero"), btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"), btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        progressWrapper: document.getElementById("progressWrapper"), progressText: document.getElementById("progressText"), progressFill: document.getElementById("progressFill")
    };

    // --- RENDER GRADE ---
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
                    <div class="promo-prices"><span class="promo-old">De ${money(p.precoAntigo)}</span><span class="promo-new">Por ${money(p.preco)}</span></div>
                    <button class="btn-add-green" onclick="window.addToCart('${p.nome}', ${p.preco})">Adicionar</button>
                </div>
            </div>`;
        }).join('');
    }
    window.addToCart = (nome, preco) => addCommonItem(nome, preco);
    renderPromocoesGrid();

    // --- MODAIS ---
    if (!el.cartBackdrop) { const bd = document.createElement("div"); bd.id = "cart-backdrop"; document.body.appendChild(bd); el.cartBackdrop = bd; }
    const Overlays = {
        closeAll() { document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show").forEach(e => e.classList.remove("show", "active")); el.cartBackdrop.classList.remove("active"); document.body.classList.remove("no-scroll"); },
        open(modal) { Overlays.closeAll(); if(!modal) return; if(modal.id==="mini-cart"||modal.id.includes("panel")) modal.classList.add("active"); else modal.classList.add("show"); el.cartBackdrop.classList.add("active"); document.body.classList.add("no-scroll"); }
    };
    el.cartBackdrop.addEventListener("click", Overlays.closeAll);
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if(e.target===m) Overlays.closeAll(); }));
    document.addEventListener('click', e => { if(e.target.matches('.fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .login-close, .promo-close, .dashboard-close')) Overlays.closeAll(); });

    // --- CARRINHO & COMBOS ---
    function addCommonItem(nome, preco) {
        const low = (nome||"").toLowerCase();
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(nome)) { 
             const isCasal = low.includes("casal");
             const opts = isCasal ? [{l:"Fanta 1L",d:0.01},{l:"Coca 1L",d:3},{l:"Coca Zero 1L",d:3}] : [{l:"Kuat 2L",d:0.01},{l:"Coca 2L",d:5},{l:"Coca Zero 2L",d:5}];
             if(el.comboModal) {
                 el.comboBody.innerHTML = opts.map((o,i)=> `<label style="display:flex;justify-content:space-between;padding:12px;border:1px solid #ddd;margin-bottom:5px;border-radius:8px;background:#fff;"><span style="font-weight:bold">${o.l}</span><span style="color:#d32f2f;">+${money(o.d)}</span><input type="radio" name="cd" value="${i}" ${i===0?'checked':''}></label>`).join("");
                 document.getElementById("combo-confirm").onclick = () => {
                     const sel = el.comboBody.querySelector('input:checked');
                     if(sel) { cart.push({nome:`${nome} + ${opts[sel.value].l}`, preco:preco+opts[sel.value].d, qtd:1}); renderMiniCart(); popupAdd("Combo adicionado!"); Overlays.closeAll(); }
                 };
                 Overlays.open(el.comboModal);
             }
             return;
        }
        const f = cart.find(i => i.nome === nome && i.preco === preco); if(f) f.qtd++; else cart.push({nome, preco, qtd:1});
        renderMiniCart(); popupAdd(`${nome} adicionado!`);
    }
    document.querySelectorAll(".add-cart").forEach(btn => btn.addEventListener("click", e => { const c=e.currentTarget.closest(".card"); if(c) addCommonItem(c.dataset.name, parseFloat(c.dataset.price)); }));

    const extras = [ {n:"Cebola",p:0.99}, {n:"Salada",p:1.99}, {n:"Ovo",p:1.99}, {n:"Bacon",p:2.99}, {n:"Hambúrguer",p:2.99}, {n:"Cheddar",p:3.99} ];
    document.querySelectorAll(".extras-btn").forEach(btn => btn.addEventListener("click", e => {
        const c=e.currentTarget.closest(".card"); const nome=c.dataset.name; const base=parseFloat(c.dataset.price);
        el.extrasList.innerHTML = extras.map((ex,i)=> `<label style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee;"><span>${ex.n} (+${money(ex.p)})</span><input type="checkbox" value="${i}"></label>`).join("");
        document.getElementById("extras-confirm").onclick = () => {
            const sels = [...el.extrasList.querySelectorAll("input:checked")]; const total = sels.reduce((acc,el)=>acc+extras[el.value].p,0); const nExtra = sels.map(el=>extras[el.value].n).join(", ");
            cart.push({nome: nExtra ? `${nome} + ${nExtra}` : nome, preco: base+total, qtd:1}); renderMiniCart(); popupAdd("Com adicionais!"); Overlays.closeAll();
        };
        Overlays.open(el.extrasModal);
    }));

    function renderMiniCart() {
        if (!el.miniList) return;
        el.cartCount.textContent = cart.reduce((s,i)=>s+i.qtd,0);
        const sub = cart.reduce((s,i)=>s+(i.preco*i.qtd),0);
        const falta = LIMITE_FRETE_GRATIS - sub;
        const pct = Math.min(100, (sub/LIMITE_FRETE_GRATIS)*100);
        if(el.progressFill) el.progressFill.style.width = `${pct}%`;
        if(el.progressText) el.progressText.innerHTML = sub >= LIMITE_FRETE_GRATIS ? "🎉 <b>Frete Grátis!</b>" : `Faltam <b>${money(falta)}</b> para frete grátis`;

        if (!cart.length) { el.miniList.innerHTML='<p style="text-align:center;padding:20px;color:#999;">Carrinho vazio</p>'; if(el.miniFoot.querySelector(".cart-generated")) el.miniFoot.querySelector(".cart-generated").remove(); return; }
        el.miniList.innerHTML = cart.map((item,i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee;">
                <div style="flex:1"><div style="font-weight:bold;font-size:0.9rem;">${item.nome}</div><div style="color:#666;font-size:0.8rem;">${money(item.preco)} x ${item.qtd}</div></div>
                <div style="display:flex;gap:5px;"><button onclick="changeQtd(${i},-1)" style="background:#ff4081;color:white;border:none;width:25px;border-radius:4px;">-</button><span>${item.qtd}</span><button onclick="changeQtd(${i},1)" style="background:#4caf50;color:white;border:none;width:25px;border-radius:4px;">+</button><button onclick="removeItem(${i})" style="background:#d32f2f;color:white;border:none;width:25px;border-radius:4px;">x</button></div>
            </div>`).join("");
        updateCartTotals();
    }
    window.changeQtd = (i, d) => { if(cart[i].qtd+d > 0) cart[i].qtd+=d; else cart.splice(i,1); renderMiniCart(); };
    window.removeItem = (i) => { cart.splice(i,1); renderMiniCart(); };

    function popupAdd(msg) { let pop=document.querySelector(".popup-add"); if(!pop){ pop=document.createElement("div"); pop.className="popup-add"; document.body.appendChild(pop); } pop.textContent=msg; pop.classList.add("show"); setTimeout(()=>pop.classList.remove("show"),2000); }
/* =========================================================  
   🚀 DFL v6.3 FINAL STABLE — PARTE 2
   - Endereço (CEP/Manual) e Totais
   - ADMIN COMPLETO (Gráficos, Relatórios)
   - Status, Login e Firebase
========================================================= */  

    // --- ENDEREÇO E TOTAIS ---
    let modoManual = false;
    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => window.open("https://buscacepinter.correios.com.br/app/endereco/index.php"));
    document.getElementById("btnManual")?.addEventListener("click", () => { modoManual=true; document.querySelector('.frete-container').style.display='none'; el.manualArea.style.display='block'; });
    el.btnVoltarCEP?.addEventListener("click", () => { modoManual=false; document.querySelector('.frete-container').style.display='block'; el.manualArea.style.display='none'; });

    async function getDynamicDeliveryFee(end) {
        if (!end) return DELIVERY_FEE_DEFAULT;
        let bairro = ""; try { bairro = end.split("-")[1]?.split("(")[0]?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ""; } catch(_){}
        // Lógica de cache de bairros (simplificada para segurança, mas estrutura pronta)
        return DELIVERY_FEE_DEFAULT; 
    }

    el.btnConfirmarEndereco?.addEventListener("click", async () => {
        if(!el.manualEndereco.value) return popupAdd("Preencha endereço!");
        const t = await getDynamicDeliveryFee(el.manualEndereco.value);
        popupAdd(`Taxa: ${money(t)}`); renderMiniCart();
    });
    document.getElementById('btn-calcular-frete')?.addEventListener('click', () => {
        const c = document.getElementById('cep-input').value.replace(/\D/g,'');
        if(c.length===8) fetch(`https://viacep.com.br/ws/${c}/json/`).then(r=>r.json()).then(d=>{ if(d.erro) throw new Error(); document.getElementById('endereco-auto').value = `${d.logradouro} - ${d.bairro}`; renderMiniCart(); }).catch(()=>popupAdd("CEP Erro"));
    });

    async function calcTotals() {  
        const sub = cart.reduce((s, i) => s + (i.preco*i.qtd), 0);
        let del = DELIVERY_FEE_DEFAULT;
        const manual = document.getElementById("manualEndereco")?.value;
        const auto = document.getElementById("endereco-auto")?.value;
        if (document.getElementById("retirar-local")?.checked || sub >= LIMITE_FRETE_GRATIS) del = 0;
        else if (manual || auto) del = await getDynamicDeliveryFee(manual || auto);
        return { sub, del, total: sub+del };
    }

    async function updateCartTotals() {
        const { sub, del, total } = await calcTotals();
        const foot = el.miniFoot;
        if(foot.querySelector(".cart-generated")) foot.querySelector(".cart-generated").remove();
        const div = document.createElement("div"); div.className = "cart-generated";
        div.innerHTML = `<div style="display:flex;justify-content:space-between;margin-top:10px;border-top:1px solid #eee;padding-top:10px;"><span>Subtotal:</span><b>${money(sub)}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Entrega:</span><b>${del===0?'Grátis':money(del)}</b></div>
            <div style="display:flex;justify-content:space-between;font-size:1.2rem;margin:10px 0;color:#d32f2f;"><span>Total:</span><b>${money(total)}</b></div>
            <button id="btn-finalizar" style="width:100%;background:#4caf50;color:white;padding:12px;border:none;border-radius:8px;font-weight:bold;font-size:1rem;">Finalizar Pedido via WhatsApp</button>`;
        foot.appendChild(div);
        document.getElementById("btn-finalizar").onclick = finalizarPedido;
    }

    async function finalizarPedido() {
        if(!cart.length) return; if(!currentUser) { alert("Por favor, faça login!"); Overlays.open(el.loginModal); return; }
        let endereco = "";
        if(document.getElementById("retirar-local").checked) endereco = "RETIRADA NO LOCAL";
        else {
            const man = document.getElementById("manualEndereco").value; const num = document.getElementById("manualNumero").value;
            const auto = document.getElementById("endereco-auto").value; const numAuto = document.getElementById("numero-input").value;
            if(man && num) endereco = `${man}, Nº ${num} (Manual)`;
            else if(auto && numAuto) endereco = `${auto}, Nº ${numAuto}`;
            else return alert("Endereço incompleto.");
        }
        const { total, del } = await calcTotals();
        const itens = cart.map(i => `• ${i.qtd}x ${i.nome}`).join("\n");
        const msg = `🍔 *PEDIDO DFL*\n👤 ${currentUser.displayName}\n\n${itens}\n\n🚚 Frete: ${money(del)}\n💰 *TOTAL: ${money(total)}*\n📍 ${endereco}`;
        try {
            await db.collection("Pedidos").add({ userId: currentUser.uid, usuario: currentUser.email, itens, total, data: new Date(), endereco });
            db.collection("Usuarios").doc(currentUser.uid).set({ pedidosFeitos: firebase.firestore.FieldValue.increment(1) }, {merge:true});
        } catch(e) {}
        window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`);
        cart=[]; renderMiniCart(); Overlays.closeAll();
    }

    // --- PEDIDOS & RECOMPENSAS ---
    el.pedidosBtn?.addEventListener("click", () => { if(currentUser){ Overlays.open(el.pedidosPanel); carregarPedidos(); } else { alert("Faça Login!"); Overlays.open(el.loginModal); } });
    async function carregarPedidos() {
        el.pedidosLista.innerHTML = "Carregando...";
        const s = await db.collection("Pedidos").where("userId","==",currentUser.uid).orderBy("data","desc").get();
        el.pedidosLista.innerHTML = s.docs.map(d => `<div style="background:white;padding:10px;border-radius:8px;border:1px solid #ddd;margin-bottom:8px;"><b>${new Date(d.data().data.seconds*1000).toLocaleDateString()}</b> — ${money(d.data().total)}<br><small style="color:#666">${d.data().itens.replace(/\n/g,", ")}</small></div>`).join("") || "Sem pedidos.";
    }
    el.recompensasBtn?.addEventListener("click", () => { if(currentUser){ Overlays.open(el.recompensasPanel); carregarRecompensas(); } else { alert("Faça Login!"); Overlays.open(el.loginModal); } });
    async function carregarRecompensas() {
        const u = await db.collection("Usuarios").doc(currentUser.uid).get(); const f = u.data()?.pedidosFeitos || 0;
        document.getElementById("contador-valor").innerText = f;
        document.getElementById("progresso-bar").style.width = `${Math.min(100, (f/5)*100)}%`;
        document.getElementById("progresso-mensagem").innerText = `Faltam ${Math.max(0, 5-f)} para o prêmio!`;
    }

    // --- ADMIN COMPLETO (GRÁFICOS E RELATÓRIOS) ---
    const ADMINS = ["alefejohsefe@gmail.com", "contato@dafamilialanches.com.br"];
    function isAdmin(u) { return u && ADMINS.includes(u.email); }
    let chartP = null;
    
    function createDashboard() {
        if(document.getElementById("admin-dashboard")) return;
        const div = document.createElement("div"); div.id = "admin-dashboard"; div.className = "modal";
        div.innerHTML = `<div class="modal-content" style="max-width:900px;width:95%;"><div class="modal-head"><h3>📊 Painel Admin</h3><button class="dashboard-close">✖</button></div><div style="padding:20px;"><div style="display:flex;gap:10px;margin-bottom:20px;"><div id="card-fat" style="flex:1;padding:15px;background:#e8f5e9;border-radius:10px;"><b>Faturamento</b><br><span id="val-fat">...</span></div><div id="card-ped" style="flex:1;padding:15px;background:#e3f2fd;border-radius:10px;"><b>Pedidos</b><br><span id="val-ped">...</span></div></div><canvas id="chart-vendas" style="max-height:300px;"></canvas></div></div>`;
        document.body.appendChild(div);
        div.querySelector(".dashboard-close").onclick = Overlays.closeAll;
    }

    function ensureChartJS(cb) { if(window.Chart) return cb(); const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/chart.js"; s.onload = cb; document.head.appendChild(s); }

    async function carregarRelatorios() {
        const snap = await db.collection("Pedidos").orderBy("data", "desc").limit(50).get();
        const peds = snap.docs.map(d => d.data());
        const total = peds.reduce((acc,p)=>acc+(p.total||0),0);
        document.getElementById("val-fat").innerText = money(total);
        document.getElementById("val-ped").innerText = peds.length;
        
        // Gráfico Simples
        const ctx = document.getElementById("chart-vendas").getContext("2d");
        if(chartP) chartP.destroy();
        chartP = new Chart(ctx, {
            type: 'bar',
            data: { labels: peds.map(p=>new Date(p.data.seconds*1000).toLocaleDateString()).slice(0,10).reverse(), datasets: [{ label: 'Vendas (R$)', data: peds.map(p=>p.total).slice(0,10).reverse(), backgroundColor: '#4CAF50' }] }
        });
    }

    function createAdminFab() {
        if(el.reportsBtn) { 
            el.reportsBtn.style.display = "block"; 
            el.reportsBtn.onclick = () => { 
                createDashboard(); 
                ensureChartJS(() => { Overlays.open(document.getElementById("admin-dashboard")); carregarRelatorios(); });
            }; 
        } 
    }

    // --- INICIALIZAÇÃO ---
    function inicializarFirebase() {
        if (isFirebaseInitialized) return;
        try {
            firebase.initializeApp(firebaseConfig); auth = firebase.auth(); db = firebase.firestore(); isFirebaseInitialized = true;
            auth.onAuthStateChanged(u => {
                currentUser = u; el.userBtn.innerText = u ? `Olá, ${u.displayName?.split(" ")[0]||"Cliente"}` : "Entrar";
                if(u && isAdmin(u)) createAdminFab();
                el.pedidosContainer.style.display='block'; el.recompensasContainer.style.display='block';
            });
        } catch (e) { console.error(e); }
    }

    // Login & Timer
    el.loginForm.addEventListener("submit", e => { e.preventDefault(); inicializarFirebase(); auth.signInWithEmailAndPassword(document.getElementById("login-email").value, document.getElementById("login-senha").value).then(u=>{currentUser=u.user; popupAdd("Logado!"); Overlays.closeAll();}).catch(e=>alert(e.message)); });
    el.googleBtn.addEventListener("click", () => { inicializarFirebase(); auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(u=>{currentUser=u.user; popupAdd("Logado!"); Overlays.closeAll();}).catch(e=>alert(e.message)); });
    el.userBtn.addEventListener("click", () => Overlays.open(el.loginModal)); el.cartIcon.addEventListener("click", () => { renderMiniCart(); Overlays.open(el.miniCart); });

    setInterval(() => { const h=new Date().getHours(); const ab=h>=18&&h<23; if(el.statusBanner){ el.statusBanner.textContent=ab?"🟢 Aberto":"🔴 Fechado"; el.statusBanner.className=`status-banner ${ab?'open':'closed'}`; }}, 60000);
    function timer() { const d=document.getElementById("promo-timer"); if(d) { const t=new Date(); t.setHours(23,59,59); let df=t-new Date(); if(df<0)df=0; d.innerText=new Date(df).toISOString().substr(11,8); } } setInterval(timer,1000);

    inicializarFirebase();
    console.log("DFL v6.3 FINAL STABLE Carregado");
});
