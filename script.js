/* =========================================================  
   🍰 Degust Bolos no Pote v10.0 — SISTEMA UI BLINDADO
   - UIManager universal para controle de painéis
   - Anti-spam de cliques múltiplos
   - Fluxo PIX Inteligente (Envio Unificado de Pedido + PIX)
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {
    // Variável Global para rastrear a cópia do PIX
    let pixCopied = false; 

    /* =========================================================
       🛡️ SISTEMA UIManager v10.0 — Blindagem de Painéis
       ========================================================= */
    let ui_lock = false;
    
    function lockUI(ms = 350) {
        ui_lock = true;
        setTimeout(() => ui_lock = false, ms);
    }

    const UIManager = {
        currentPanel: null,
        
        open(panelName, panelElement) {
            if (ui_lock) return;
            lockUI();
            
            this.closeAll();
            
            if (panelElement) {
                this.currentPanel = panelName;
                
                if (panelElement.id === "mini-cart" || panelElement.id === "painelPedidos" || panelElement.id === "recompensas-panel" || panelElement.id === "pix-modal") {
                    panelElement.classList.add("active");
                } else {
                    panelElement.classList.add("show");
                }
                
                if (panelElement.id !== "side-menu") {
                    Backdrop.show();
                }
                
                this.closeSideMenu();
            }
        },
        
        close(panelName, panelElement) {
            if (panelElement) {
                panelElement.classList.remove("show", "active");
            }
            
            if (this.currentPanel === panelName) {
                this.currentPanel = null;
            }
        },
        
        closeAll() {
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show, #pix-modal.active").forEach(el => {
                el.classList.remove("show", "active");
            });
            
            this.closeSideMenu();
            Backdrop.hide();
            this.currentPanel = null;
        },
        
        closeSideMenu() {
            const sideMenu = document.getElementById("side-menu");
            const menuOverlay = document.getElementById("menu-overlay");
            
            if (sideMenu) sideMenu.classList.remove("active");
            if (menuOverlay) menuOverlay.classList.remove("active");
            document.body.style.overflow = "";
        },
        
        isOpen(panelName) {
            return this.currentPanel === panelName;
        },
        
        handleMenuAction(actionCallback) {
            if (ui_lock) return;
            lockUI(200);
            this.closeSideMenu();
            setTimeout(() => {
                if (typeof actionCallback === 'function') {
                    actionCallback();
                }
            }, 150);
        }
    };

    // ============================================================
    // 🍰 MENU LATERAL & HAMBÚRGUER
    // ============================================================
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const sideMenu = document.getElementById("side-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    const menuClose = document.getElementById("menu-close");

    function openSideMenu() {
        if (ui_lock) return;
        lockUI();
        UIManager.closeAll();
        sideMenu.classList.add("active");
        menuOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openSideMenu);
    if (menuClose) menuClose.addEventListener("click", () => UIManager.closeSideMenu());
    if (menuOverlay) menuOverlay.addEventListener("click", () => UIManager.closeSideMenu());

    // Atalhos do Menu Lateral
    document.querySelectorAll('.menu-link-action[onclick*="meus-pedidos-btn"]').forEach(link => {
        link.onclick = null;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UIManager.handleMenuAction(() => {
                const btn = document.querySelector('.meus-pedidos-btn');
                if (btn) btn.click();
            });
        });
    });

    // ============================================================
    // 💠 SISTEMA PIX INTELIGENTE v10.0 (CHAVE: carols2maite@gmail.com)
    // ============================================================
    const pixModal = document.getElementById("pix-modal");
    const pixValor = document.getElementById("pix-valor");
    const pixBody = document.querySelector("#pix-modal .pix-body");
    const pixBtnCopy = document.getElementById("btn-copy-pix"); 
    const pixBtnWhatsapp = document.getElementById("btn-finish-pix"); 

    const CHAVE_PIX = "carols2maite@gmail.com";
    const INFO_PIX = "carols2maite@gmail.com - Degust Bolos no Pote / Carol";

    const AVISO_PIX_OBRIGATORIO = '<p style="font-size:0.85rem; color:#c62828; font-weight:600; margin-bottom:15px; border-radius:8px; border:1px solid #ffcdd2; padding:8px 12px; background:#fff5f5;">⚠️ IMPORTANTE: Clique primeiro em "Finalizar no WhatsApp" para enviar seu pedido. Depois, faça o PIX e envie o comprovante na conversa.</p>';

    async function abrirModalPIX() {
        try {
            const { total } = await calcTotals();
            if (pixValor) pixValor.textContent = money(total);
            
            if (pixBody && !pixBody.querySelector('.pix-aviso-obrigatorio')) {
                const aviso = document.createElement('div');
                aviso.className = 'pix-aviso-obrigatorio';
                aviso.innerHTML = AVISO_PIX_OBRIGATORIO;
                const display = pixBody.querySelector('#pix-valor')?.parentElement;
                if(display) display.after(aviso);
                else pixBody.prepend(aviso);
            }
            UIManager.open("pix", pixModal);
        } catch (error) {
            console.error("Erro PIX:", error);
            fecharPedidoOriginal();
        }
    }

    if (pixBtnCopy) {
        pixBtnCopy.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(CHAVE_PIX);
                pixCopied = true;
                const originalText = pixBtnCopy.textContent;
                pixBtnCopy.textContent = "Chave Copiada! ✓";
                pixBtnCopy.style.background = "#4CAF50";
                setTimeout(() => {
                    pixBtnCopy.textContent = originalText;
                    pixBtnCopy.style.background = "";
                }, 2000);
            } catch (err) {
                const textArea = document.createElement("textarea");
                textArea.value = CHAVE_PIX;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                pixCopied = true;
                pixBtnCopy.textContent = "Copiado! ✓";
            }
        });
    }
    // Botão Enviar Pedido + PIX no WhatsApp
    if (pixBtnWhatsapp) {
        pixBtnWhatsapp.addEventListener("click", async () => {
            const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
            const addr = window.finalAddressStringForWhatsApp; 

            const linhasPedido = [
                "🍰 *Pedido Degust Bolos no Pote*",
                cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
                "", 
                `Subtotal: *${money(subtotal)}*`, 
                `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`, 
                `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`, 
                `*Total: ${money(total)}*`, 
                "", 
                `🏠 *Endereço:* ${addr}`
            ].join("\n");
            
            const linhasPix = [
                "", 
                "💳 *PAGAMENTO PIX*",
                "",
                `📦 *Valor:* ${money(total)}`,
                `🏷️ *Chave:* ${CHAVE_PIX}`,
                `👤 *Beneficiário:* Degust / Carol`,
                "",
                `📎 *Por favor, envie o comprovante abaixo*`,
                `⏰ O preparo inicia após a confirmação.`
            ].join("\n");

            const mensagem = linhasPedido + linhasPix;
            
            // Link do WhatsApp atualizado para a Degust
            window.open(`https://wa.me/message/VDQCBHWD33ORK1?text=${encodeURIComponent(mensagem)}`, "_blank");
            
            UIManager.closeAll();
        });
    }

    // Fechar Modal PIX
    if (pixClose) {
        pixClose.addEventListener("click", (e) => {
            e.preventDefault();
            UIManager.closeAll();
            setTimeout(() => fecharPedidoOriginal(), 300);
        });
    }

    // Variável para armazenar o endereço
    window.finalAddressStringForWhatsApp = "";

    // Função fecharPedido (Abre o PIX)
    window.fecharPedido = async function() {
        if (!cart.length) return alert("Seu carrinho está vazio!");
        if (!currentUser) { 
            alert("Faça login para finalizar seu pedido!"); 
            UIManager.open("login", el.loginModal); 
            return; 
        }
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;
        let finalAddressString = "";
        
        if (modoEnderecoManual) {
            const endereco = document.getElementById('manualEndereco')?.value?.trim() || '';
            const numero = document.getElementById('manualNumero')?.value?.trim() || '';
            if (endereco && numero) finalAddressString = `${endereco}, N° ${numero} (Manual)`;
        } else {
            const ruaBairro = document.getElementById("endereco-auto")?.value.trim();
            const numero = document.getElementById("numero-input")?.value.trim();
            const comp = document.getElementById("complemento-input")?.value.trim();
            if (ruaBairro && numero) {
                finalAddressString = `${ruaBairro}, N° ${numero}${comp ? `, ${comp}` : ""}`;
            }
        }
        
        if (isRetirarLocal) finalAddressString = "CLIENTE IRÁ RETIRAR NA DEGUST";
        else if (!finalAddressString) { 
            alert("Por favor, preencha o endereço completo."); 
            return; 
        }

        window.finalAddressStringForWhatsApp = finalAddressString;
        abrirModalPIX();
    };

    // MÁSCARA DE CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            e.target.value = v;
        });
    }

    /* ------------------ 🔍 BUSCA INTELIGENTE (ATUALIZADA PARA BOLOS) ------------------ */
    const searchInput = document.getElementById('search-input');
    
    // Lista de produtos para o motor de busca (Aliases)
    const PRODUTOS_BUSCA = [
        { nome: "Brigadeiro", aliases: ["chocolate", "preto", "granulado"] },
        { nome: "Prestígio", aliases: ["prestigio", "coco", "beijinho"] },
        { nome: "Ninho com Geleia de Morango", aliases: ["morango", "geleia", "fruta"] },
        { nome: "Ninho Cremoso", aliases: ["leite ninho", "branco", "puro"] },
        { nome: "Coca-Cola", aliases: ["refrigerante", "coca", "refri"] },
        { nome: "Suco", aliases: ["del valle", "uva", "laranja"] }
    ];

    function normalizar(texto) {
        return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
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
            let match = nomeNorm.includes(queryNorm);
            
            if (!match) {
                for (const p of PRODUTOS_BUSCA) {
                    if (nomeNorm.includes(normalizar(p.nome))) {
                        if (p.aliases.some(a => normalizar(a).includes(queryNorm))) {
                            match = true;
                            break;
                        }
                    }
                }
            }
            card.style.display = match ? '' : 'none';
        });
    }

    if (searchInput) searchInput.addEventListener('input', (e) => filtrarCards(e.target.value));
    /* ------------------ ⚙️ CONFIGURAÇÕES BASE ------------------ */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00;
    let deliveryFeesCache = null;   

    // Formatador de Moeda
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    
    // Função Segura para Event Listeners
    const safe = (fn) => (...a) => { 
        try { fn(...a); } catch (e) { console.error("Erro em função safe:", e); } 
    };  

    // Ícones de Nível do Cliente (Sistema de Recompensas)
    function getTierIcon(tier) {  
        const level = tier ? String(tier).toLowerCase().trim() : '';  
        if (level.includes('ouro')) return '🥇';  
        if (level.includes('platina')) return '💎';  
        if (level.includes('diamante')) return '👑';  
        return '👤';   
    }  

    /* ------------------ 📊 BARRA DE PROGRESSO (FRETE GRÁTIS) ------------------ */
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
            progressText.innerHTML = `🎉 <strong>Frete Grátis Liberado!</strong>`;
            progressFill.style.background = "linear-gradient(90deg, #4caf50, #2e7d32)";
            progressWrapper.style.background = "#e8f5e9";
        } else {
            progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> para Frete Grátis`;
            progressFill.style.background = "linear-gradient(90deg, #E1A95F, #4B2C20)";
            progressWrapper.style.background = "#fdf8ef";
        }
    }

    /* ------------------ 🛒 MINI-CARRINHO (SISTEMA DE RENDERIZAÇÃO) ------------------ */  
    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  

        atualizarBarraProgresso();

        if (!cart.length) {  
            el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;font-weight:500;">O carrinho está com fome de bolos! 🍰</p>';  
            if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
            const couponMsg = document.getElementById("coupon-message");  
            if (couponMsg) couponMsg.innerHTML = "";  
            return;  
        }  

        el.miniList.innerHTML = cart.map((item, idx) => `  
            <div class="cart-item" style="border-bottom:1px solid rgba(75, 44, 32, 0.1);padding:12px 0;">  
                <div style="display:flex;justify-content:space-between;align-items:center;">  
                    <div style="flex:1;">  
                        <p style="font-weight:700;margin-bottom:2px;color:#4B2C20;">${item.nome}</p>  
                        <p style="color:#6d4c41;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p>  
                    </div>  
                    <div style="display:flex;gap:8px;align-items:center;">  
                        <button type="button" class="cart-minus" data-idx="${idx}" style="background:#E1A95F;color:#4B2C20;border:none;border-radius:5px;width:28px;height:28px;font-weight:bold;">−</button>  
                        <span style="font-weight:700;min-width:20px;text-align:center;">${item.qtd}</span>  
                        <button type="button" class="cart-plus" data-idx="${idx}" style="background:#4B2C20;color:#F5E6CA;border:none;border-radius:5px;width:28px;height:28px;font-weight:bold;">+</button>  
                        <button type="button" class="cart-remove" data-idx="${idx}" style="background:#C8282D;color:#fff;border:none;border-radius:5px;width:28px;height:28px;">🗑</button>  
                    </div>  
                </div>  
            </div>  
        `).join("");  

        bindMiniCartButtons();   
        enhanceMiniCartUI();  
    }  

    function bindMiniCartButtons() {  
        el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => { 
            const i = +e.currentTarget.dataset.idx; 
            if (cart[i]) { cart[i].qtd++; renderMiniCart(); } 
        }));  
        el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => { 
            const i = +e.currentTarget.dataset.idx; 
            if (cart[i]) { if (cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1); renderMiniCart(); } 
        }));  
        el.miniList.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => { 
            const i = +e.currentTarget.dataset.idx; 
            cart.splice(i, 1); 
            renderMiniCart(); 
            popupAdd("Item removido do carrinho."); 
        }));  
    }  

    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);

    /* ------------------ 🔥 FIREBASE INIT (DECORAÇÃO E CONEXÃO) ------------------ */  
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
            if (!window.firebase) throw new Error("Firebase não detectado.");  
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);  
            auth = firebase.auth();  
            db = firebase.firestore();  
            isFirebaseInitialized = true;  
            setupAuthListener();   
        } catch (error) {  
            console.error("Erro Firebase:", error);  
            popupAdd("Sistema temporariamente instável.");
        }  
    }
    function setupAuthListener() {  
        auth.onAuthStateChanged(user => {  
            currentUser = user;   
            if (user) {  
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;  
                if (el.pedidosBtn) el.pedidosBtn.style.display = 'block';
                if (el.recompensasBtn) el.recompensasBtn.style.display = 'block';
                
                if (user && isAdmin(user)) {  
                    if (el.reportsBtn) el.reportsBtn.style.display = "block";
                    document.querySelectorAll('.menu-link-action.admin-btn').forEach(btn => btn.style.display = 'block');
                }
            } else {  
                el.userBtn.textContent = "Entrar / Perfil";  
                if (el.reportsBtn) el.reportsBtn.style.display = "none";
                document.querySelectorAll('.menu-link-action.admin-btn').forEach(btn => btn.style.display = 'none');
            }  
        });  
    }

    /* ------------------ 🔑 SISTEMA DE LOGIN ------------------ */  
    const handleLoginSuccess = (user) => {  
        currentUser = user;  
        popupAdd(`Bem-vindo(a), ${user.displayName?.split(" ")[0] || 'doçura'}! ✨`);  
        UIManager.closeAll();  
    };  

    el.loginForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        inicializarFirebase();
        const email = document.getElementById("login-email")?.value?.trim();  
        const senha = document.getElementById("login-senha")?.value?.trim();  
        if (!email || !senha) return alert("Preencha todos os campos.");  
        auth.signInWithEmailAndPassword(email, senha)
            .then((cred) => handleLoginSuccess(cred.user))
            .catch((err) => alert("Erro ao entrar: " + err.message));  
    });  

    el.googleBtn?.addEventListener("click", () => {  
        inicializarFirebase();
        const provider = new firebase.auth.GoogleAuthProvider();  
        auth.signInWithPopup(provider)
            .then((res) => handleLoginSuccess(res.user))
            .catch((err) => alert("Erro Google: " + err.message));  
    });  

    el.userBtn?.addEventListener("click", () => UIManager.open("login", el.loginModal));  
    
    /* ------------------ 🍓 ADICIONAIS (TOPPINGS) ------------------ */
    const adicionais = [  
        { nome: "Morango Extra", preco: 3.50 },  
        { nome: "Leite Ninho em pó", preco: 2.50 },  
        { nome: "Nutella Pura", preco: 5.00 },  
        { nome: "Granulado Belga", preco: 2.00 },  
        { nome: "Creme de Ninho", preco: 3.00 },  
        { nome: "Brigadeiro de Colher", preco: 4.00 }
    ];  

    let produtoExtras = null;  
    let produtoPrecoBase = 0;  

    const openExtrasFor = safe((card) => {  
        if (!card || !el.extrasModal || !el.extrasList) return;  
        produtoExtras = card.dataset.name;  
        produtoPrecoBase = parseFloat(card.dataset.price) || 0;  
        el.extrasList.innerHTML = adicionais.map((a, i) => `  
            <label class="extra-line" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">  
                <span style="font-weight:600; color:#4B2C20;">${a.nome} (+${money(a.preco)})</span>  
                <input type="checkbox" value="${i}" style="width:20px; height:20px; accent-color:#4B2C20;">  
            </label>`).join("");  
        UIManager.open("extras", el.extrasModal);  
    });  

    // Re-bind dos botões de adicionais
    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
    );  

    el.extrasConfirm?.addEventListener("click", () => {  
        if (!produtoExtras) return UIManager.closeAll();  
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
        const nomeCompleto = extrasNomes ? `${produtoExtras} (+ ${extrasNomes})` : produtoExtras;  

        cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });  
        renderMiniCart();  
        popupAdd("Bolo personalizado adicionado! 🍰");  
        UIManager.closeAll();  
    });

    /* ------------------ 🎟️ CUPONS & TOTAIS ------------------ */
    async function calcTotals() {  
        const subtotal = getCartSubtotal();  
        const d = await validarCupomFirestore(couponApplied, subtotal);   
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        
        let deliveryFee = DELIVERY_FEE_DEFAULT;   
        let enderecoParaCalculo = "";

        if (modoEnderecoManual) {
            enderecoParaCalculo = document.getElementById('manualEndereco')?.value?.trim() || "";
        } else {
            enderecoParaCalculo = document.getElementById('endereco-auto')?.value?.trim() || "";
        }

        if (isRetirarLocal || subtotal >= LIMITE_FRETE_GRATIS) {  
            deliveryFee = 0;  
        } else if (enderecoParaCalculo) {  
            deliveryFee = await getDynamicDeliveryFee(enderecoParaCalculo);
        }  

        const delivery = d.freeShipping ? 0 : deliveryFee;  
        const total = Math.max(0, subtotal + delivery - d.discount);  
        return { subtotal, delivery, discount: d.discount, discountLabel: d.label, total, cupomInfo: d };  
    }
    /* ------------------ 🚨 SALVAMENTO DO PEDIDO (PÓS-PIX) ------------------ */
    async function fecharPedidoOriginal() {  
        if (!cart.length || !currentUser) return;  
        
        const addr = window.finalAddressStringForWhatsApp;  
        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();  

        const pedido = { 
            usuario: currentUser.email, 
            userId: currentUser.uid, 
            nome: currentUser.displayName || currentUser.email.split("@")[0], 
            itens: cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
            itensObj: cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })), 
            subtotal: Number(subtotal.toFixed(2)), 
            entrega: Number(delivery.toFixed(2)), 
            desconto: Number(discount.toFixed(2)), 
            cupom: couponApplied || "", 
            total: Number(total.toFixed(2)), 
            endereco: addr, 
            data: new Date().toISOString()
        };  

        try {  
            const batch = db.batch(); 
            const userId = currentUser.uid; 
            const usuarioRef = db.collection("Usuarios").doc(userId);  
            
            // Marca cupom de uso único como usado
            if (cupomInfo.isPersonalizado && couponApplied) { 
                batch.update(db.collection("CuponsUsuarios").doc(userId), { 
                    usado: true, 
                    dataUso: firebase.firestore.FieldValue.serverTimestamp()
                }); 
            }  
            
            const pedidoRef = db.collection("Pedidos").doc(); 
            batch.set(pedidoRef, pedido);  
            batch.set(usuarioRef, { 
                email: currentUser.email, 
                pedidosFeitos: firebase.firestore.FieldValue.increment(1) 
            }, { merge: true });  
            
            await batch.commit();  

            // Lógica de Recompensas (Fidelidade)
            const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
            const doc = await usuarioRef.get(); 
            const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 }; 
            const feitos = data.pedidosFeitos; 
            
            const recompensaAtingida = RECOMPENSAS_DATA.find(r => r.limite === feitos);  

            if (recompensaAtingida) {  
                const itemLiberado = { 
                    tipo: recompensaAtingida.tipo, 
                    valor: recompensaAtingida.valor, 
                    liberadoEm: firebase.firestore.FieldValue.serverTimestamp(), 
                    usado: false, 
                    titulo: recompensaAtingida.titulo || `Presente Degust` 
                };  
                
                await db.collection("Usuarios").doc(userId).collection("RecompensasRecebidas").add(itemLiberado);  
                mostrarPopupRecompensa(`🎉 Doçura liberada! Você ganhou: ${recompensaAtingida.valor}`);  
            }  

            popupAdd("Pedido registrado com sucesso! ✅"); 
            try { sound.play(); } catch (_) {}  
            
            // Limpa tudo
            cart = []; 
            couponApplied = ""; 
            localStorage.removeItem("dflCoupon"); 
            renderMiniCart(); 
            UIManager.closeAll();  
            
        } catch (err) { 
            console.error("Erro ao salvar pedido:", err); 
            alert(`Erro ao salvar pedido: ${err.message}`); 
        }  
    }

    /* ------------------ 🎁 SISTEMA DE FIDELIDADE (RECOMPENSAS) ------------------ */
    async function carregarRecompensas(userId) {  
        const contadorValor = document.getElementById('contador-valor'); 
        const progressoBar = document.getElementById('progresso-bar'); 
        const progressoMsg = document.getElementById('progresso-mensagem');  
        
        const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
        if (RECOMPENSAS_DATA.length === 0) return;

        db.collection('Usuarios').doc(userId).onSnapshot(async doc => {  
            const data = doc.data() || { pedidosFeitos: 0 }; 
            const feitos = data.pedidosFeitos; 
            const proxima = RECOMPENSAS_DATA.find(r => r.limite > feitos) || RECOMPENSAS_DATA[RECOMPENSAS_DATA.length - 1];  
            
            if (contadorValor) contadorValor.textContent = feitos;  
            if (progressoBar) progressoBar.style.width = `${Math.min(100, (feitos / proxima.limite) * 100)}%`;  
            if (progressoMsg) {
                const faltam = proxima.limite - feitos;
                progressoMsg.textContent = faltam > 0 ? `Faltam ${faltam} potes para sua recompensa!` : "Você tem prêmios disponíveis!";
            }
            
            exibirRecompensas(feitos, RECOMPENSAS_DATA);
        });  
    }  

    function exibirRecompensas(feitos, data) {
        if (!el.recompensasLista) return;
        el.recompensasLista.innerHTML = data.map(r => `
            <div class="recompensa-card" style="opacity: ${feitos >= r.limite ? '1' : '0.5'}">
                <div style="font-size:1.5rem;">${feitos >= r.limite ? '✅' : '🔒'}</div>
                <div style="flex:1; margin-left:10px;">
                    <h4 style="margin:0;">${r.titulo}</h4>
                    <small>Meta: ${r.limite} pedidos</small>
                </div>
            </div>
        `).join('');
    }

    /* ------------------ 📊 ADMIN & DASHBOARD ------------------ */
    const ADMINS = [ "alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br" ];  
    function isAdmin(user) { return user && user.email && ADMINS.includes(user.email.toLowerCase()); }  
    
    if (el.reportsBtn) {
        el.reportsBtn.addEventListener("click", () => {
            alert("Carregando Relatórios de Vendas Degust...");
            // Aqui entraria a lógica de abertura do Chart.js que você já possui.
        });
    }

    /* ------------------ 🚦 STATUS & COOKIES ------------------ */
    const atualizarStatus = () => {  
        const h = new Date().getHours();  
        const aberto = h >= 14 && h < 22; // Exemplo: Aberto das 14h às 22h
        if (el.statusBanner) { 
            el.statusBanner.textContent = aberto ? "🟢 Degust aberta! Peça seu bolo agora." : "🔴 Fechado — Abrimos às 14h."; 
            el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; 
        }  
    };  
    atualizarStatus(); setInterval(atualizarStatus, 60000);  

    const cookieBanner = document.getElementById("cookie-banner"); 
    const cookieAcceptBtn = document.getElementById("cookie-accept");  
    if (cookieBanner && cookieAcceptBtn) { 
        if (localStorage.getItem("degust-cookies")) cookieBanner.style.display = "none";
        cookieAcceptBtn.addEventListener("click", () => { 
            localStorage.setItem("degust-cookies", "true"); 
            cookieBanner.classList.remove("show"); 
        }); 
    }

    // Inicialização Final
    console.log("%c🍰 Degust Bolos no Pote — v10.0 Ativa!", "color:#4B2C20; font-weight:bold; background:#F5E6CA; padding:5px;");
    inicializarFirebase();  
    renderMiniCart();

}); // Fim do DOMContentLoaded
