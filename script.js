/* ============================================================
   🚀 DFL v6.0.0 — SCRIPT PRINCIPAL
   - Totalmente reescrito e compatível com o NOVO HTML + NOVO CSS
   - Mantém todos os sistemas antigos (Recompensas, Pedidos, Admin)
   - Repara clique, banners, modais e mini-carrinho
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ------------------ 🔊 SOM OPCIONAL ------------------ */
    let sound = null;
    try {
        sound = new Audio("click.wav");
        document.addEventListener("click", () => {
            if (!sound) return;
            sound.currentTime = 0;
            sound.play().catch(() => {});
        });
    } catch (_) {}

    /* ------------------ 🛒 ESTADO GLOBAL ------------------ */
    let cart = [];
    let currentUser = null;
    let isFirebaseReady = false;

    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
    const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

    /* ============================================================
       🔥 FIREBASE — CONFIGURAÇÃO COMPLETA
    ============================================================ */

    const firebaseConfig = {
        apiKey: "SUA_APIKEY",
        authDomain: "SEU_DOMAIN",
        projectId: "SEU_PROJECT",
        storageBucket: "SEU_BUCKET",
        messagingSenderId: "SEU_ID",
        appId: "SEU_APP"
    };

    // Inicializa só uma vez
    function initFirebase() {
        if (isFirebaseReady) return;

        firebase.initializeApp(firebaseConfig);
        isFirebaseReady = true;

        firebase.auth().onAuthStateChanged(user => {
            currentUser = user;
            atualizarLoginUI();
        });
    }

    // Inicializa Firebase apenas quando necessário
    document.addEventListener("click", () => initFirebase(), { once: true });

    function atualizarLoginUI() {
        const btn = document.querySelector("#user-login-btn");
        if (!btn) return;

        if (currentUser) {
            btn.textContent = "Minha Conta";
        } else {
            btn.textContent = "Entrar";
        }
    }

    /* ============================================================
       🟢 MINI-CART — ABRIR / FECHAR
    ============================================================ */

    const cartPanel = document.querySelector(".mini-cart");
    const cartBackdrop = document.querySelector("#cart-backdrop");

    function abrirCarrinho() {
        cartPanel.classList.add("active");
        cartBackdrop.classList.add("active");
        renderMiniCart();
    }

    function fecharCarrinho() {
        cartPanel.classList.remove("active");
        cartBackdrop.classList.remove("active");
    }

    safe(() => {
        document.querySelector("#cart-icon").onclick = abrirCarrinho;
        cartBackdrop.onclick = fecharCarrinho;
    })();

    /* ============================================================
       🛍️ SISTEMA DO CARRINHO (ITENS + RENDER)
    ============================================================ */

    function addToCart(item) {
        cart.push(item);
        renderMiniCart();
        abrirCarrinho();
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        renderMiniCart();
    }

    function renderMiniCart() {
        const list = document.querySelector(".mini-list");
        const foot = document.querySelector(".mini-foot");

        if (!list || !foot) return;

        if (cart.length === 0) {
            list.innerHTML = `
                <div class="cart-empty-msg">
                    <div>🧺 Seu carrinho está vazio</div>
                    <div>Adicione algum item para continuar.</div>
                </div>
            `;
            foot.innerHTML = "";
            return;
        }

        let total = 0;

        list.innerHTML = cart.map((p, i) => {
            total += p.preco;

            return `
                <div class="mini-item">
                    <div><b>${p.nome}</b></div>
                    <div>${money(p.preco)}</div>
                    <button class="remove-item" data-i="${i}">remover</button>
                </div>
            `;
        }).join("");

        foot.innerHTML = `
            <div style="font-size:1.1rem;font-weight:700;margin-bottom:10px">
                Total: ${money(total)}
            </div>
            <button class="btn-primary" id="fecharPedidoBtn">Fechar Pedido</button>
        `;

        // remover item
        document.querySelectorAll(".remove-item").forEach(btn => {
            btn.onclick = () => removeFromCart(btn.dataset.i);
        });

        // fechar pedido
        document.querySelector("#fecharPedidoBtn").onclick = finalizarPedido;
    }

    /* ============================================================
       🧾 FINALIZAR PEDIDO (COM FIRESTORE)
    ============================================================ */

    async function finalizarPedido() {
        if (!currentUser) {
            abrirLogin();
            return;
        }

        if (cart.length === 0) return;

        try {
            const db = firebase.firestore();
            const batch = db.batch();

            const pedidoRef = db.collection("Pedidos").doc();
            batch.set(pedidoRef, {
                userId: currentUser.uid,
                itens: cart,
                total: cart.reduce((acc, p) => acc + p.preco, 0),
                data: new Date().toISOString()
            });

            const userRef = db.collection("Usuarios").doc(currentUser.uid);
            batch.set(userRef, { pedidos: firebase.firestore.FieldValue.increment(1) }, { merge: true });

            await batch.commit();

            mostrarToast("Pedido realizado com sucesso! 🎉");

            cart = [];
            fecharCarrinho();
            renderMiniCart();
        } catch (e) {
            console.error(e);
            mostrarToast("Erro ao finalizar pedido.");
        }
    }

    /* ============================================================
       🔐 LOGIN MODAL
    ============================================================ */

    const loginModal = document.querySelector("#login-modal");
    const loginCloseBtn = document.querySelector(".login-close");

    function abrirLogin() {
        loginModal.classList.add("show");
    }

    function fecharLogin() {
        loginModal.classList.remove("show");
    }

    if (loginCloseBtn) loginCloseBtn.onclick = fecharLogin;

    document.querySelector("#user-login-btn").onclick = abrirLogin;

    /* Google Login */
    safe(() => {
        document.querySelector("#loginGoogle").onclick = async () => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                await firebase.auth().signInWithPopup(provider);
                fecharLogin();
                mostrarToast("Login realizado!");
            } catch (e) {
                console.error(e);
                mostrarToast("Erro ao fazer login.");
            }
        };
    })();

    /* ============================================================
       🔥 TOAST SIMPLES
    ============================================================ */

    function mostrarToast(msg) {
        const t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        Object.assign(t.style, {
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "#000",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "10px",
            zIndex: 9999,
            opacity: 0,
            transition: ".3s"
        });
        document.body.appendChild(t);

        setTimeout(() => (t.style.opacity = 1), 30);
        setTimeout(() => {
            t.style.opacity = 0;
            setTimeout(() => t.remove(), 300);
        }, 2000);
    }
/* ============================================================
       🛒 BOTÕES DE ADICIONAR PRODUTO
    ============================================================ */

    function bindAddButtons() {
        document.querySelectorAll(".add-cart").forEach(btn => {
            btn.onclick = () => {
                try {
                    const card = btn.closest(".card");
                    if (!card) return;

                    const nome = card.dataset.name;
                    const preco = parseFloat(card.dataset.price);

                    if (!nome || isNaN(preco)) {
                        console.warn("Card inválido:", card);
                        return;
                    }

                    addToCart({ nome, preco });
                    mostrarToast(`${nome} adicionado!`);
                } catch (e) {
                    console.error("Erro ao adicionar item:", e);
                }
            };
        });
    }

    bindAddButtons();
/* ============================================================
       🛒 CARRINHO — ESTRUTURA PRINCIPAL
    ============================================================ */

    let cart = [];

    function addToCart(item) {
        const existente = cart.find(i => i.nome === item.nome);

        if (existente) {
            existente.qtd++;
        } else {
            cart.push({
                nome: item.nome,
                preco: item.preco,
                qtd: 1
            });
        }

        salvarCart();
        renderCart();
        atualizarCarrinhoIcone();
        atualizarProgressBar();
    }

    function removerItem(index) {
        if (cart[index]) {
            cart[index].qtd--;

            if (cart[index].qtd <= 0) {
                cart.splice(index, 1);
            }
        }

        salvarCart();
        renderCart();
        atualizarCarrinhoIcone();
        atualizarProgressBar();
    }

    function salvarCart() {
        try {
            localStorage.setItem("DFL_CART", JSON.stringify(cart));
        } catch (_) {}
    }

    function carregarCart() {
        try {
            const salvo = JSON.parse(localStorage.getItem("DFL_CART"));
            if (Array.isArray(salvo)) cart = salvo;
        } catch (_) {}
    }

    carregarCart();
    function renderCart() {
        const lista = document.querySelector(".mini-list");
        if (!lista) return;

        lista.innerHTML = "";

        if (cart.length === 0) {
            lista.innerHTML = `
                <p style="padding:20px;text-align:center;color:#999;">
                    Carrinho vazio 😢
                </p>`;
            return;
        }

        cart.forEach((item, idx) => {
            const div = document.createElement("div");
            div.className = "mini-item";
            div.innerHTML = `
                <div class="mini-info">
                    <strong>${item.nome}</strong>
                    <span>Qtd: ${item.qtd}</span>
                    <span>${money(item.preco * item.qtd)}</span>
                </div>

                <button class="remove-item" data-index="${idx}">
                    Remover
                </button>
            `;
            lista.appendChild(div);
        });

        bindRemoveButtons();
    }
    function bindRemoveButtons() {
        document.querySelectorAll(".remove-item").forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                if (!isNaN(index)) removerItem(index);
            };
        });
    }
    function atualizarCarrinhoIcone() {
        const el = document.getElementById("cart-count");
        if (!el) return;

        const total = cart.reduce((s, i) => s + i.qtd, 0);
        el.textContent = total;
    }

    atualizarCarrinhoIcone();
    renderCart();
/* ============================================================
       🪟 MODAIS — ABERTURA, FECHAMENTO E BACKDROP
    ============================================================ */

    const backdrop = document.getElementById("cart-backdrop");
    const miniCart = document.getElementById("mini-cart");

    function abrirMiniCart() {
        miniCart.setAttribute("aria-hidden", "false");
        backdrop.style.display = "block";
    }

    function fecharMiniCart() {
        miniCart.setAttribute("aria-hidden", "true");
        backdrop.style.display = "none";
    }

    document.getElementById("cart-icon")?.addEventListener("click", abrirMiniCart);

    document.querySelectorAll(".extras-close").forEach(btn =>
        btn.addEventListener("click", fecharMiniCart)
    );

    backdrop?.addEventListener("click", fecharMiniCart);
    const extrasModal = document.getElementById("extras-modal");
    const extrasList = document.querySelector(".extras-list");

    let extrasTemp = [];

    function abrirExtrasModal(produto) {
        extrasTemp = [];
        extrasList.innerHTML = `
            <label><input type="checkbox" data-extra="Bacon" data-preco="2"> Bacon (+R$ 2,00)</label>
            <label><input type="checkbox" data-extra="Mussarela" data-preco="2"> Mussarela (+R$ 2,00)</label>
            <label><input type="checkbox" data-extra="Frango" data-preco="3"> Filé de Frango (+R$ 3,00)</label>
        `;
        extrasModal.setAttribute("aria-hidden", "false");
        backdrop.style.display = "block";

        document.getElementById("extras-confirm").onclick = () => {
            extrasList.querySelectorAll("input:checked").forEach(c => {
                extrasTemp.push({
                    nome: c.dataset.extra,
                    preco: Number(c.dataset.preco)
                });
            });

            addExtrasToProduct(produto);
            fecharExtrasModal();
        };
    }

    function fecharExtrasModal() {
        extrasModal.setAttribute("aria-hidden", "true");
        backdrop.style.display = "none";
    }

    document.querySelectorAll(".extras-btn").forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest(".card");
            const nome = card.dataset.name;
            const preco = Number(card.dataset.price);

            abrirExtrasModal({ nome, preco });
        };
    });
    const comboModal = document.getElementById("combo-modal");
    const comboBody  = document.getElementById("combo-body");

    let comboSelecionado = null;

    function abrirComboModal(item) {
        comboSelecionado = item;

        comboBody.innerHTML = `
            <label><input type="radio" name="refri" value="Coca-Cola 1L"> Coca-Cola 1L</label>
            <label><input type="radio" name="refri" value="Fanta 1L"> Fanta Laranja 1L</label>
            <label><input type="radio" name="refri" value="Kuat 2L"> Kuat 2L</label>
        `;

        comboModal.setAttribute("aria-hidden", "false");
        backdrop.style.display = "block";
    }

    function fecharComboModal() {
        comboModal.setAttribute("aria-hidden", "true");
        backdrop.style.display = "none";
    }

    document.getElementById("combo-confirm").onclick = () => {
        const refri = document.querySelector("input[name='refri']:checked");
        if (!refri) return toast("Selecione um refrigerante!");

        addToCart({
            nome: `${comboSelecionado.nome} + ${refri.value}`,
            preco: comboSelecionado.preco
        });

        fecharComboModal();
    };

    document.querySelectorAll(".combo-close").forEach(btn => btn.onclick = fecharComboModal);
    const loginModal = document.getElementById("login-modal");

    function abrirLogin() {
        loginModal.setAttribute("aria-hidden", "false");
        backdrop.style.display = "block";
    }

    function fecharLogin() {
        loginModal.setAttribute("aria-hidden", "true");
        backdrop.style.display = "none";
    }

    document.getElementById("user-btn")?.addEventListener("click", abrirLogin);

    document.querySelectorAll(".login-close").forEach(btn =>
        btn.addEventListener("click", fecharLogin)
    );
    const recompensasBtn = document.querySelector(".recompensas-btn");
    const recompensasPanel = document.getElementById("recompensas-panel");

    recompensasBtn?.addEventListener("click", () => {
        recompensasPanel.setAttribute("aria-hidden", "false");
    });

    document.querySelector(".fechar-recompensas")?.addEventListener("click", () => {
        recompensasPanel.setAttribute("aria-hidden", "true");
    });
    const pedidosBtn = document.querySelector(".meus-pedidos-btn");
    const painelPedidos = document.getElementById("painelPedidos");

    pedidosBtn?.addEventListener("click", () => {
        painelPedidos.setAttribute("aria-hidden", "false");
    });

    document.querySelector(".fechar-pedidos")?.addEventListener("click", () => {
        painelPedidos.setAttribute("aria-hidden", "true");
    });
    const cookieBanner = document.getElementById("cookie-banner");

    if (!localStorage.getItem("COOKIE_OK")) {
        cookieBanner.style.display = "flex";
    }

    document.getElementById("cookie-accept")?.addEventListener("click", () => {
        localStorage.setItem("COOKIE_OK", "1");
        cookieBanner.style.display = "none";
    });
/* ============================================================
       🔍 BUSCA DE PRODUTOS
    ============================================================ */

    const campoBusca = document.getElementById("campoBusca");
    const resultadoBusca = document.getElementById("resultadoBusca");

    function normalizar(str) {
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    campoBusca?.addEventListener("input", () => {
        const termo = normalizar(campoBusca.value.trim());
        const cards = document.querySelectorAll(".card, .promo-card");

        if (termo.length === 0) {
            resultadoBusca.innerHTML = "";
            cards.forEach(c => c.style.display = "");
            return;
        }

        let encontrados = [];

        cards.forEach(card => {
            const nome = normalizar(card.dataset.name || "");
            const texto = normalizar(card.innerText || "");

            if (nome.includes(termo) || texto.includes(termo)) {
                card.style.display = "";
                encontrados.push(card.dataset.name);
            } else {
                card.style.display = "none";
            }
        });

        if (encontrados.length === 0) {
            resultadoBusca.innerHTML = `
                <p style="text-align:center;color:#c00;font-weight:600;">
                    ❌ Nenhum item encontrado. Tente outro termo.
                </p>`;
        } else {
            resultadoBusca.innerHTML = `
                <p style="text-align:center;color:#333;margin-top:5px;">
                    🔎 Resultados: <b>${encontrados.length}</b> itens
                </p>`;
        }
    });    
    <div id="status-banner" class="status-banner"></div>
    /* ============================================================
       📢 STATUS ABERTO / FECHADO
    ============================================================ */

    const statusBanner = document.getElementById("status-banner");

    function atualizarStatus() {
        const agora = new Date();
        const horas = agora.getHours();

        let aberto = horas >= 18 || horas === 0; 
        // Se quiser alterar horário de abrir/fechar, me avise.

        if (aberto) {
            statusBanner.textContent = "🟢 Estamos abertos! Faça seu pedido 😋";
            statusBanner.style.background = "linear-gradient(90deg,#4caf50,#2e7d32)";
        } else {
            statusBanner.textContent = "🔴 Estamos fechados no momento";
            statusBanner.style.background = "linear-gradient(90deg,#d32f2f,#b71c1c)";
        }
    }

    atualizarStatus();
    setInterval(atualizarStatus, 60000); // Atualiza a cada 1 minuto
    document.addEventListener("click", () => {
        if (campoBusca.value.trim().length === 0) {
            resultadoBusca.innerHTML = "";
        }
    });
    <div id="cookie-banner" role="region" aria-label="Aviso de Cookies">
    <p>Usamos cookies para garantir que você tenha a melhor experiência...</p>
    <button id="cookie-accept" type="button">Aceitar</button>
</div>
/* ============================================================
       🍪 AVISO DE COOKIES
    ============================================================ */

    const cookieBanner = document.getElementById("cookie-banner");
    const cookieAccept = document.getElementById("cookie-accept");

    function verificarCookie() {
        const aceito = localStorage.getItem("dfl_cookie_accepted");
        if (aceito === "true") {
            cookieBanner.style.display = "none";
        } else {
            cookieBanner.style.display = "flex";
        }
    }

    cookieAccept?.addEventListener("click", () => {
        localStorage.setItem("dfl_cookie_accepted", "true");
        cookieBanner.style.opacity = "0";
        setTimeout(() => (cookieBanner.style.display = "none"), 300);
    });

    verificarCookie();
    <audio id="checkout-sound" src="click.wav"></audio>
/* ============================================================
       🔊 SOM GLOBAL (CLIQUE SUAVE)
    ============================================================ */

    const clickSound = document.getElementById("checkout-sound");

    document.addEventListener("click", () => {
        try {
            clickSound.currentTime = 0;
            clickSound.play();
        } catch (e) {
            // Som não é essencial — falhou silenciosamente.
        }
    });
/* ============================================================
       🧭 SCROLL SUAVE PARA O TOPO
    ============================================================ */

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.addEventListener("scroll", () => {
        if (campoBusca?.value.trim() === "") {
            resultadoBusca.innerHTML = "";
        }
    });
/* ============================================================
   🍪 AVISO DE COOKIES
============================================================ */

const cookieBanner = document.getElementById("cookie-banner");
const cookieAccept = document.getElementById("cookie-accept");

function verificarCookie() {
    const aceito = localStorage.getItem("dfl_cookie_accepted");
    if (aceito === "true") {
        cookieBanner.style.display = "none";
    } else {
        cookieBanner.style.display = "flex";
    }
}

cookieAccept?.addEventListener("click", () => {
    localStorage.setItem("dfl_cookie_accepted", "true");
    cookieBanner.style.opacity = "0";
    setTimeout(() => {
        cookieBanner.style.display = "none";
    }, 300);
});

verificarCookie();


/* ============================================================
   🔊 SOM GLOBAL (CLIQUE SUAVE)
============================================================ */

const clickSound = document.getElementById("checkout-sound");

document.addEventListener("click", () => {
    try {
        clickSound.currentTime = 0;
        clickSound.play();
    } catch (e) {
        // falha silenciosa – som não é obrigatório
    }
});


/* ============================================================
   🧭 SCROLL SUAVE PARA O TOPO
============================================================ */

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ============================================================
   🧹 LIMPEZA AUTOMÁTICA DO RESULTADO DE BUSCA NO SCROLL
============================================================ */

window.addEventListener("scroll", () => {
    if (campoBusca?.value.trim() === "") {
        resultadoBusca.innerHTML = "";
    }
});
/* ============================================================
   🎁 SISTEMA DE RECOMPENSAS (LOYALTY / FIREBASE)
============================================================ */

/* Elements */
const recompensasBtn = document.querySelector(".recompensas-btn");
const recompensasPanel = document.getElementById("recompensas-panel");
const fecharRecompensas = document.querySelector(".fechar-recompensas");

const contadorValor = document.getElementById("contador-valor");
const progressoBar = document.getElementById("progresso-bar");
const progressoMensagem = document.getElementById("progresso-mensagem");

const listaRecompensas = document.getElementById("listaRecompensas");
const historicoRecompensas = document.getElementById("historicoRecompensas");

/* Controle */
let contadorPedidosUsuario = 0;
let limiteTier = 5;

/* Abre/Fecha painel */
recompensasBtn?.addEventListener("click", () => {
    recompensasPanel.setAttribute("aria-hidden", "false");
    recompensasPanel.classList.add("open");
    carregarRecompensas();
});

fecharRecompensas?.addEventListener("click", () => {
    recompensasPanel.setAttribute("aria-hidden", "true");
    recompensasPanel.classList.remove("open");
});

/* Função para carregar contador e recompensas */
async function carregarRecompensas() {
    if (!currentUser) {
        contadorValor.textContent = "0";
        progressoBar.style.width = "0%";
        progressoMensagem.textContent = "Faça login para acompanhar seu progresso.";
        listaRecompensas.innerHTML = `<p class="empty-rewards">Nenhuma recompensa disponível.</p>`;
        historicoRecompensas.innerHTML = `<p class="empty-rewards">Você ainda não recebeu recompensas.</p>`;
        return;
    }

    try {
        const userRef = db.collection("usuarios").doc(currentUser.uid);
        const snap = await userRef.get();

        if (!snap.exists) return;

        const data = snap.data();

        contadorPedidosUsuario = Number(data.contadorPedidos || 0);
        const recompensas = data.recompensas || [];
        const historico = data.historicoRecompensas || [];

        /* Atualiza contador visual */
        contadorValor.textContent = contadorPedidosUsuario;

        const porcentagem = Math.min((contadorPedidosUsuario / limiteTier) * 100, 100);
        progressoBar.style.width = porcentagem + "%";

        if (contadorPedidosUsuario >= limiteTier) {
            progressoMensagem.textContent = "🎉 Você desbloqueou uma recompensa!";
        } else {
            progressoMensagem.textContent = `Faltam ${limiteTier - contadorPedidosUsuario} pedidos para a próxima recompensa.`;
        }

        /* -----------------------------------------------
           🏆 RECOMPENSAS DESBLOQUEADAS
        ------------------------------------------------ */
        if (recompensas.length === 0) {
            listaRecompensas.innerHTML = `<p class="empty-rewards">Nenhuma recompensa disponível.</p>`;
        } else {
            listaRecompensas.innerHTML = recompensas.map(r => `
                <div class="reward-item">
                    <h4>${r.titulo}</h4>
                    <p>${r.descricao}</p>
                    <span class="reward-data">${new Date(r.data).toLocaleDateString("pt-BR")}</span>
                </div>
            `).join("");
        }

        /* -----------------------------------------------
           📜 HISTÓRICO DE RECOMPENSAS
        ------------------------------------------------ */
        if (historico.length === 0) {
            historicoRecompensas.innerHTML = `<p class="empty-rewards">Você ainda não recebeu recompensas.</p>`;
        } else {
            historicoRecompensas.innerHTML = historico.map(h => `
                <div class="reward-history">
                    <h4>${h.titulo}</h4>
                    <p>${h.descricao}</p>
                    <span class="reward-data">${new Date(h.data).toLocaleDateString("pt-BR")}</span>
                </div>
            `).join("");
        }

    } catch (e) {
        console.error("Erro ao carregar recompensas:", e);
    }
}

/* ============================================================
   🎁 FUNÇÃO: REGISTRAR RECOMPENSA NOVA NO FIRESTORE
============================================================ */
async function registrarRecompensa(titulo, descricao) {
    if (!currentUser) return;

    try {
        const userRef = db.collection("usuarios").doc(currentUser.uid);

        await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(userRef);
            if (!snap.exists) return;

            const data = snap.data();

            const nova = {
                titulo,
                descricao,
                data: new Date().toISOString()
            };

            const historico = data.historicoRecompensas || [];
            historico.push(nova);

            const recompensas = data.recompensas || [];
            recompensas.push(nova);

            transaction.update(userRef, {
                recompensas,
                historicoRecompensas: historico
            });
        });

        carregarRecompensas();
    } catch (e) {
        console.error("Erro ao registrar recompensa:", e);
    }
}

/* ============================================================
   🎁 RESETA RECOMPENSAS QUANDO USADAS
============================================================ */

async function consumirRecompensa(index) {
    if (!currentUser) return;

    try {
        const userRef = db.collection("usuarios").doc(currentUser.uid);

        await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(userRef);
            const data = snap.data();

            const recompensas = data.recompensas || [];
            if (!recompensas[index]) return;

            recompensas.splice(index, 1);

            transaction.update(userRef, { recompensas });
        });

        carregarRecompensas();
    } catch (e) {
        console.error("Erro ao consumir recompensa:", e);
    }
}
/* ============================================================
   📦 MEUS PEDIDOS — Painel, Histórico, Miniaturas, Repetir
============================================================ */

// Elementos base do painel
const pedidosBtn = document.querySelector(".meus-pedidos-btn");
const painelPedidos = document.getElementById("painelPedidos");
const fecharPedidos = document.querySelector(".fechar-pedidos");
const listaPedidos = document.getElementById("listaPedidos");

/* Abrir/Fechar painel */
pedidosBtn?.addEventListener("click", () => {
    painelPedidos.setAttribute("aria-hidden", "false");
    painelPedidos.classList.add("open");
    carregarPedidosUsuario();
});

fecharPedidos?.addEventListener("click", () => {
    painelPedidos.classList.remove("open");
    painelPedidos.setAttribute("aria-hidden", "true");
});

/* ============================================================
   🔥 FUNÇÃO PRINCIPAL — Carregar pedidos do usuário
============================================================ */

async function carregarPedidosUsuario() {
    if (!currentUser) {
        listaPedidos.innerHTML = `<p class="empty-orders">Faça login para ver seus pedidos.</p>`;
        return;
    }

    try {
        const pedidosRef = db.collection("pedidos")
            .where("userId", "==", currentUser.uid)
            .orderBy("timestamp", "desc");

        const snap = await pedidosRef.get();

        if (snap.empty) {
            listaPedidos.innerHTML = `<p class="empty-orders">Você ainda não fez pedidos.</p>`;
            return;
        }

        let html = "";

        snap.forEach(doc => {
            const pedido = doc.data();

            const data = new Date(pedido.timestamp).toLocaleString("pt-BR");

            // Lista com miniaturas
            const itensHTML = pedido.itens.map(item => `
                <div class="pedido-item">
                    <img src="${item.img || "imagens/placeholder.png"}" alt="${item.name}" class="pedido-img" />
                    <div class="pedido-info">
                        <p class="pedido-titulo">${item.name}</p>
                        <p class="pedido-quant">Qtd: ${item.qty}</p>
                        <p class="pedido-preco">R$ ${item.price.toFixed(2).replace(".", ",")}</p>
                    </div>
                </div>
            `).join("");

            html += `
                <div class="pedido-card">
                    <div class="pedido-header">
                        <span class="pedido-id">#${doc.id.slice(-6)}</span>
                        <span class="pedido-data">${data}</span>
                    </div>

                    <div class="pedido-items">
                        ${itensHTML}
                    </div>

                    <div class="pedido-total">
                        Total: <b>R$ ${pedido.total.toFixed(2).replace(".", ",")}</b>
                    </div>

                    <button class="btn-repetir"
                        onclick="repetirPedido('${doc.id}')">
                        🔁 Repetir Pedido
                    </button>
                </div>
            `;
        });

        listaPedidos.innerHTML = html;

    } catch (e) {
        console.error("Erro ao carregar pedidos:", e);
        listaPedidos.innerHTML = `<p class="empty-orders">Erro ao carregar pedidos.</p>`;
    }
}

/* ============================================================
   🔁 REPEAT ORDER — Repetir Pedido
============================================================ */

async function repetirPedido(idPedido) {
    try {
        const doc = await db.collection("pedidos").doc(idPedido).get();
        if (!doc.exists) return;

        const pedido = doc.data();

        if (!pedido.itens || pedido.itens.length === 0) {
            toast("Pedido vazio. Não é possível repetir.");
            return;
        }

        cart = []; // limpa carrinho atual

        pedido.itens.forEach(item => {
            cart.push({
                name: item.name,
                price: item.price,
                qty: item.qty,
                img: item.img || "",
                extras: item.extras || []
            });
        });

        salvarCarrinhoLocal();
        renderMiniCart();
        abrirCarrinho();
        toast("Pedido carregado no carrinho! 🛒");

    } catch (e) {
        console.error("Erro ao repetir pedido:", e);
    }
}

/* ============================================================
   🔄 Recarrega lista automaticamente após novo pedido
============================================================ */
async function atualizarListaPedidosAposFecharPedido() {
    if (painelPedidos.classList.contains("open")) {
        await carregarPedidosUsuario();
    }
}

/* Vincula ao fluxo de fecharPedido */
const fecharPedidoOriginal = typeof fecharPedido === "function" ? fecharPedido : null;

async function fecharPedido(...args) {
    if (fecharPedidoOriginal) await fecharPedidoOriginal(...args);
    atualizarListaPedidosAposFecharPedido();
}
/* ============================================================
   🎁 RECOMPENSAS — Fidelidade, Tiers, Histórico
============================================================ */

const recompensasBtn = document.querySelector(".recompensas-btn");
const painelRecompensas = document.getElementById("recompensas-panel");
const fecharRecompensas = document.querySelector(".fechar-recompensas");
const contadorValor = document.getElementById("contador-valor");
const progressoBar = document.getElementById("progresso-bar");
const progressoMensagem = document.getElementById("progresso-mensagem");
const listaRecompensas = document.getElementById("listaRecompensas");
const historicoRecompensas = document.getElementById("historicoRecompensas");

/* Metas padrão — v5.6 / v6.0 */
const META_ATUAL = 5;

/* Abrir painel */
recompensasBtn?.addEventListener("click", () => {
    painelRecompensas.setAttribute("aria-hidden", "false");
    painelRecompensas.classList.add("open");
    carregarRecompensas();
});

/* Fechar painel */
fecharRecompensas?.addEventListener("click", () => {
    painelRecompensas.classList.remove("open");
    painelRecompensas.setAttribute("aria-hidden", "true");
});

/* ============================================================
   🔥 CARREGAR RECOMPENSAS & PROGRESSO
============================================================ */

async function carregarRecompensas() {
    if (!currentUser) {
        contadorValor.textContent = "...";
        progressoMensagem.textContent = "Faça login para ver suas recompensas.";
        listaRecompensas.innerHTML = "";
        historicoRecompensas.innerHTML = `<p class="empty-rewards">Faça login para ver histórico.</p>`;
        return;
    }

    try {
        const ref = db.collection("usuarios").doc(currentUser.uid);
        const snap = await ref.get();

        let dados = snap.exists ? snap.data() : { contadorPedidos: 0, recompensas: [], historico: [] };

        const feitos = dados.contadorPedidos || 0;
        const porcentagem = Math.min(100, Math.round((feitos / META_ATUAL) * 100));

        contadorValor.textContent = feitos;
        progressoBar.style.width = porcentagem + "%";

        if (feitos >= META_ATUAL) {
            progressoMensagem.innerHTML = `🎉 Você desbloqueou uma recompensa!`;
        } else {
            const faltam = META_ATUAL - feitos;
            progressoMensagem.innerHTML = `Faltam <b>${faltam}</b> pedidos para a próxima recompensa.`;
        }

        renderizarRecompensas(dados.recompensas || []);
        renderizarHistorico(dados.historico || []);

    } catch (e) {
        console.error("Erro ao carregar recompensas:", e);
    }
}

/* ============================================================
   🏅 RENDERIZAR LISTA DE RECOMPENSAS
============================================================ */

function renderizarRecompensas(lista) {
    if (!lista || lista.length === 0) {
        listaRecompensas.innerHTML = `<p class="empty-rewards">Nenhuma recompensa desbloqueada ainda.</p>`;
        return;
    }

    listaRecompensas.innerHTML = lista.map((r, i) => `
        <div class="reward-card">
            <div class="reward-header">
                <span class="reward-title">🎁 ${r.titulo}</span>
                <span class="reward-tag">${r.tipo}</span>
            </div>
            <p class="reward-desc">${r.descricao}</p>
            <button class="btn-primary" onclick="usarRecompensa(${i})">Usar</button>
        </div>
    `).join("");
}

/* ============================================================
   📜 HISTÓRICO DE RECOMPENSAS
============================================================ */

function renderizarHistorico(hist) {
    if (!hist || hist.length === 0) {
        historicoRecompensas.innerHTML = `<p class="empty-rewards">Você ainda não recebeu recompensas.</p>`;
        return;
    }

    historicoRecompensas.innerHTML = hist.map(h => `
        <div class="hist-item">
            <span class="hist-title">🎁 ${h.titulo}</span>
            <span class="hist-date">${new Date(h.data).toLocaleString("pt-BR")}</span>
        </div>
    `).join("");
}

/* ============================================================
   🎯 USAR RECOMPENSA
============================================================ */

async function usarRecompensa(index) {
    if (!currentUser) return;

    try {
        const ref = db.collection("usuarios").doc(currentUser.uid);
        const snap = await ref.get();
        const dados = snap.data();

        const recompensa = dados.recompensas[index];

        if (!recompensa) return;

        // Aplica cupom automaticamente no input de cupom
        const cupomInput = document.getElementById("coupon-input");
        cupomInput.value = recompensa.codigo;

        toast("Cupom aplicado automaticamente 🎁");
        dados.recompensas.splice(index, 1);

        dados.historico.push({
            titulo: recompensa.titulo,
            data: Date.now()
        });

        await ref.update({
            recompensas: dados.recompensas,
            historico: dados.historico
        });

        carregarRecompensas();
    } catch (e) {
        console.error("Erro ao usar recompensa:", e);
    }
}

/* ============================================================
   🔄 Integrar ao fluxo de pedidos — adicionar 1 ponto
============================================================ */

const fecharPedidoOriginalRewards =
    typeof fecharPedido === "function" ? fecharPedido : null;

async function fecharPedido(...args) {
    if (fecharPedidoOriginalRewards) await fecharPedidoOriginalRewards(...args);

    if (!currentUser) return;

    try {
        const ref = db.collection("usuarios").doc(currentUser.uid);
        const snap = await ref.get();
        const dados = snap.data() || {};

        const feitos = (dados.contadorPedidos || 0) + 1;

        const atualizado = { contadorPedidos: feitos };

        // Desbloqueia recompensa automaticamente ao bater meta
        if (feitos >= META_ATUAL) {
            atualizado.recompensas = [
                ...(dados.recompensas || []),
                {
                    titulo: "Cupom Fidelidade",
                    descricao: "Cupom especial por atingir a meta de 5 pedidos!",
                    codigo: "FIDELIDADE5",
                    tipo: "Cupom",
                    data: Date.now()
                }
            ];
            atualizado.contadorPedidos = 0;
        }

        await ref.set({ ...dados, ...atualizado });

        carregarRecompensas();

    } catch (e) {
        console.error("Erro ao atualizar recompensas:", e);
    }
}
/* ============================================================
   🔎 BUSCA GLOBAL — v6.0 (Produtos, Combos, Promoções)
   Compatível com cards normais + promo-card
============================================================ */

const campoBusca = document.getElementById("campoBusca");
const resultadoBusca = document.getElementById("resultadoBusca");

/* Limpar resultados */
function limparBusca() {
    resultadoBusca.innerHTML = "";
}

/* Função principal de busca */
function executarBusca(termo) {
    termo = termo.trim().toLowerCase();

    if (!termo) {
        limparBusca();
        return;
    }

    const cards = document.querySelectorAll(".card, .promo-card");
    let resultados = [];

    cards.forEach(card => {
        const nome = (card.querySelector("h3")?.textContent || "").toLowerCase();
        const desc = (card.querySelector("p")?.textContent || "").toLowerCase();

        if (nome.includes(termo) || desc.includes(termo)) {
            resultados.push(card);
        }
    });

    if (resultados.length === 0) {
        resultadoBusca.innerHTML = `
            <div class="resultado-vazio">
                ❌ Nenhum item encontrado para "<b>${termo}</b>".
            </div>
        `;
        return;
    }

    resultadoBusca.innerHTML = `
        <div class="resultado-titulo">🔍 Resultados para "<b>${termo}</b>":</div>
    `;

    resultados.forEach(card => {
        const clone = card.cloneNode(true);

        clone.style.border = "2px solid var(--botao)";
        clone.style.padding = "12px";
        clone.style.borderRadius = "12px";
        clone.style.background = "#fff";
        clone.style.marginBottom = "12px";

        resultadoBusca.appendChild(clone);
    });
}

/* Evento: digitando */
campoBusca?.addEventListener("input", e => {
    const termo = e.target.value;

    if (termo.length <= 1) {
        limparBusca();
        return;
    }

    executarBusca(termo);
});

/* Evento: pressionou Enter */
campoBusca?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        executarBusca(campoBusca.value);
    }
});