/* =========================================================
   🚀 DFL v5.4 — SCRIPT PRINCIPAL (Base estável do servidor)
   ---------------------------------------------------------
   - Carrinho
   - Autenticação
   - ViaCEP
   - Frete Dinâmico (Firebase)
   - Endereço manual liberado
   - Correções visuais e funcionais
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* ------------------ ⚙️ BASE ------------------ */
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
    const toast = (msg) => showToast(msg);
    let cart = [];
    let currentUser = null;

    /* FIREBASE */
    let db = firebase.firestore();

    /* ================================
       🔊 SOM DE CLIQUE (global)
    ================================= */
    const sound = new Audio("click.wav");
    document.addEventListener("click", () => {
        try {
            sound.currentTime = 0;
            sound.play();
        } catch (_) {}
    });

    /* ================================
       📌 VALOR PARA FRETE GRÁTIS
       (ajustado para R$ 80.00)
    ================================= */
    const FRETE_GRATIS_VALOR = 80;

    /* ================================
       🛒 MINI-CARRINHO (extras.js)
    ================================= */
    enhanceMiniCartUI();

    /* ================================
       📦 CARREGA PRODUTOS
    ================================= */
    loadProducts();

    /* ================================
       🔐 LOGIN / LOGOUT
    ================================= */
    initAuthSystem();

    /* ================================
       📍 VIA CEP + ENDEREÇO MANUAL
    ================================= */

    const cepInput = document.getElementById("cep-input");
    const enderecoAuto = document.getElementById("endereco-auto");
    const buscarCepBtn = document.getElementById("buscar-cep");

    const manualBtn = document.getElementById("manual-endereco");
    const naoSeiCepBtn = document.getElementById("nao-sei-cep");

    const numeroInput = document.getElementById("numero-input");
    const complementoInput = document.getElementById("complemento-input");

    /* ---- Aplicar hífen no CEP ---- */
    cepInput.addEventListener("input", () => {
        let v = cepInput.value.replace(/\D/g, "");
        if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
        cepInput.value = v;
    });

    /* ---- Busca do CEP ---- */
    buscarCepBtn.addEventListener("click", () => {
        const cep = cepInput.value.replace(/\D/g, "");
        if (cep.length !== 8) return toast("CEP inválido");

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(r => r.json())
            .then(data => {
                if (data.erro) return toast("CEP não encontrado");

                enderecoAuto.readOnly = true;
                enderecoAuto.value = `${data.logradouro} - ${data.bairro} (${data.localidade}/${data.uf})`;
                atualizarFrete();
            })
            .catch(() => toast("Erro ao consultar CEP"));
    });

    /* ---- NÃO SEI MEU CEP ---- */
    naoSeiCepBtn.addEventListener("click", () => {
        window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank");
    });

    /* ---- MODO MANUAL ---- */
    manualBtn.addEventListener("click", () => {
        enderecoAuto.readOnly = false;
        enderecoAuto.value = "";
        enderecoAuto.placeholder = "Digite seu endereço completo...";
        toast("Modo manual ativado");
    });

    /* ---- Recalcular frete ao editar manual ---- */
    enderecoAuto.addEventListener("blur", atualizarFrete);

    /* ================================
       🚚 FRETE DINÂMICO — FIREBASE
    ================================= */

    let deliveryFeesCache = null;

    async function loadDeliveryFees() {
        if (deliveryFeesCache) return deliveryFeesCache;

        try {
            const snap = await db
                .collection("TaxasDeEntrega")
                .doc("bairros")
                .collection("lista")
                .doc("tabela")
                .get();

            if (snap.exists) {
                deliveryFeesCache = snap.data().data || [];
                return deliveryFeesCache;
            }
        } catch (e) {
            console.error("Erro ao carregar taxas:", e);
        }

        return [];
    }

    /* ---- Normalização ---- */
    function normalize(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/-/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /* ---- Extrair bairro ---- */
    function extrairBairro(endereco) {
        try {
            let temp = endereco.split(" - ");
            if (temp.length < 2) return null;

            let bairroParte = temp[1];
            let bairroFinal = bairroParte.split("(")[0].trim();

            return normalize(bairroFinal);

        } catch {
            return null;
        }
    }

    /* ---- Busca taxa dinâmica ---- */
    async function getDynamicDeliveryFee(endereco) {
        if (!endereco) return 6;

        const bairroNormalizado = extrairBairro(endereco);
        if (!bairroNormalizado) return 6;

        const lista = await loadDeliveryFees();
        let taxaEncontrada = null;

        for (const item of lista) {
            const nomeClean = normalize(item.nome);
            if (nomeClean === bairroNormalizado) {
                taxaEncontrada = item.taxa;
                break;
            }
        }

        if (!taxaEncontrada) {
            for (const item of lista) {
                const nomeClean = normalize(item.nome);
                if (bairroNormalizado.includes(nomeClean) || nomeClean.includes(bairroNormalizado)) {
                    taxaEncontrada = item.taxa;
                    break;
                }
            }
        }

        return taxaEncontrada ?? 6;
    }
/* ================================
       🔄 Atualizar Frete
    ================================= */
    async function atualizarFrete() {
        const endereco = enderecoAuto.value;
        const subtotalAtual = calcularSubtotal();

        let taxa = await getDynamicDeliveryFee(endereco);

        if (subtotalAtual >= FRETE_GRATIS_VALOR) {
            taxa = 0;
        }

        document.getElementById("frete-total").textContent = money(taxa);
        document.getElementById("cart-final-total").textContent = money(subtotalAtual + taxa);
    }

    /* ================================
       🛒 CARRINHO
    ================================= */

    function calcularSubtotal() {
        return cart.reduce((total, item) => total + item.price * item.qty, 0);
    }

    function atualizarCarrinho() {
        const cartItems = document.getElementById("cart-items");
        cartItems.innerHTML = "";

        cart.forEach((item, index) => {
            const div = document.createElement("div");
            div.classList.add("cart-item");

            div.innerHTML = `
                <p><strong>${item.name}</strong></p>
                <p>Qtd: ${item.qty}</p>
                <p>${money(item.price * item.qty)}</p>
                <button class="btn small" onclick="removerItem(${index})">Remover</button>
            `;

            cartItems.appendChild(div);
        });

        atualizarFrete();
    }

    window.removerItem = function(index) {
        cart.splice(index, 1);
        atualizarCarrinho();
        enhanceMiniCartUI();
    };

    /* ================================
       ➕ ADICIONAR AO CARRINHO
    ================================= */
    window.addToCart = function(produto) {
        const existe = cart.find(item => item.id === produto.id);

        if (existe) {
            existe.qty++;
        } else {
            cart.push({ ...produto, qty: 1 });
        }

        atualizarCarrinho();
        enhanceMiniCartUI();
        toast("Item adicionado");
    };

    /* ================================
       📦 FINALIZAR PEDIDO
    ================================= */

    document.getElementById("finalizar-pedido").addEventListener("click", async () => {
        if (!currentUser) return toast("Faça login para finalizar");

        if (!enderecoAuto.value.trim()) return toast("Informe seu endereço");

        if (!numeroInput.value.trim()) return toast("Informe o número");

        const subtotal = calcularSubtotal();
        let taxa = await getDynamicDeliveryFee(enderecoAuto.value);

        if (subtotal >= FRETE_GRATIS_VALOR) {
            taxa = 0;
        }

        const pedido = {
            itens: cart,
            subtotal,
            entrega: taxa,
            total: subtotal + taxa,
            endereco: enderecoAuto.value,
            numero: numeroInput.value,
            complemento: complementoInput.value || "",
            data: new Date().toISOString(),
            uid: currentUser.uid
        };

        try {
            await db.collection("Pedidos").add(pedido);
            cart = [];
            atualizarCarrinho();
            toast("Pedido enviado com sucesso!");
            closeAllModals();
        } catch (e) {
            toast("Erro ao enviar pedido");
            console.error(e);
        }
    });

    /* ================================
       📦 MEUS PEDIDOS
    ================================= */
    function carregarPedidos() {
        if (!currentUser) return;

        db.collection("Pedidos")
            .where("uid", "==", currentUser.uid)
            .orderBy("data", "desc")
            .onSnapshot(snapshot => {
                const list = document.getElementById("orders-list");
                list.innerHTML = "";

                snapshot.forEach(doc => {
                    const p = doc.data();

                    const div = document.createElement("div");
                    div.classList.add("order-card");

                    div.innerHTML = `
                        <p><strong>Total:</strong> ${money(p.total)}</p>
                        <p><strong>Entrega:</strong> ${money(p.entrega)}</p>
                        <p><strong>Endereço:</strong> ${p.endereco}, ${p.numero}</p>
                        <p><small>${new Date(p.data).toLocaleString()}</small></p>
                    `;

                    list.appendChild(div);
                });
            });
    }

    /* ================================
       🧑 LOGIN
    ================================= */
    function initAuthSystem() {

        firebase.auth().onAuthStateChanged(user => {
            currentUser = user;

            if (user) {
                carregarPedidos();
            }
        });

        document.getElementById("login-google").addEventListener("click", () => {
            firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
        });

        document.getElementById("login-email-btn").addEventListener("click", () => {
            const email = document.getElementById("login-email").value;
            const senha = document.getElementById("login-password").value;

            firebase.auth().signInWithEmailAndPassword(email, senha)
                .catch(() => toast("Erro ao entrar"));
        });
    }
/* ================================
       🔐 LOGOUT
    ================================= */
    window.logout = function() {
        firebase.auth().signOut();
        toast("Você saiu da conta");
    };

    /* ================================
       📦 ABRIR / FECHAR MODAIS
    ================================= */
    const modais = document.querySelectorAll(".modal");

    function closeAllModals() {
        modais.forEach(m => m.classList.add("hidden"));
    }

    document.querySelectorAll(".close-modal").forEach(btn => {
        btn.addEventListener("click", closeAllModals);
    });

    // Fechar modal clicando fora
    modais.forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    /* ================================
       ⭐ CARREGAR PRODUTOS (Firestore)
    ================================= */
    function loadProducts() {
        const container = document.getElementById("products-container");

        db.collection("Produtos")
            .orderBy("ordem", "asc")
            .onSnapshot(snapshot => {
                container.innerHTML = "";

                snapshot.forEach(doc => {
                    const p = doc.data();
                    const card = document.createElement("div");
                    card.classList.add("product-card");

                    card.innerHTML = `
                        <img src="${p.img}" alt="${p.nome}">
                        <h3>${p.nome}</h3>
                        <p>${p.desc}</p>
                        <strong>${money(p.preco)}</strong>
                        <button class="btn small" onclick='addToCart(${JSON.stringify(p)})'>
                            Adicionar
                        </button>
                    `;

                    container.appendChild(card);
                });
            });
    }

    /* ================================
       FINAL DO DOMContentLoaded
    ================================= */
}); // fim do DOMContentLoaded