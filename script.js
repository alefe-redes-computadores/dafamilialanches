/* =========================================================
   DFL v5.5 — SCRIPT (PARTE 1)
   ========================================================= */

// ------------------------------------
// Firebase Config
// ------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyDXXXXXXXXXXXXX",
    authDomain: "dafamilialanches.firebaseapp.com",
    projectId: "dafamilialanches",
    storageBucket: "dafamilialanches.appspot.com",
    messagingSenderId: "1135338XXXXXX",
    appId: "1:1135338XXXXXX:web:XXXXXXXX"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let cart = [];

// ------------------------------------
// Helpers
// ------------------------------------
const money = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

const safe = (fn) => (...a) => {
    try { return fn(...a); }
    catch (e) { console.error(e); }
};

// ------------------------------------
// Login
// ------------------------------------
auth.onAuthStateChanged((user) => {
    currentUser = user;
});

// Google login
document.getElementById("googleLoginBtn").addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => closeLoginModal())
        .catch(err => console.error(err));
});

// E-mail login (placeholder)
document.getElementById("emailLoginBtn").addEventListener("click", () => {
    alert("Login por e-mail ainda não implementado.");
});

// ------------------------------------
// Carregar CARDÁPIO DO FIRESTORE
// ------------------------------------
async function loadMenu() {
    const list = document.getElementById("menuList");
    list.innerHTML = "Carregando...";

    const snap = await db.collection("Produtos")
        .orderBy("ordem", "asc")
        .get();

    list.innerHTML = "";

    snap.forEach((doc) => {
        const p = doc.data();
        const item = document.createElement("div");
        item.className = "menu-item";

        item.innerHTML = `
            <img src="${p.img}" class="item-img">
            <div class="item-info">
                <h3>${p.nome}</h3>
                <p>${p.descricao || ""}</p>
                <strong>${money(p.preco)}</strong>
            </div>
            <button class="add-btn" data-id="${doc.id}">+</button>
        `;

        list.appendChild(item);
    });

    document.querySelectorAll(".add-btn").forEach(btn =>
        btn.addEventListener("click", safe(addToCart))
    );
}

loadMenu();

// ------------------------------------
// Carrinho
// ------------------------------------
function addToCart(ev) {
    const id = ev.target.dataset.id;

    const ref = db.collection("Produtos").doc(id);
    ref.get().then(doc => {
        if (!doc.exists) return;

        const data = doc.data();
        cart.push({
            id,
            nome: data.nome,
            preco: data.preco,
            obs: "",
            adicionais: []
        });

        updateMiniCart();
        openMiniCart();
    });
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateMiniCart();
}

document.getElementById("openCartBtn").addEventListener("click", openMiniCart);
document.getElementById("closeMiniCartBtn").addEventListener("click", closeMiniCart);

function openMiniCart() {
    document.getElementById("miniCart").classList.add("show");
}

function closeMiniCart() {
    document.getElementById("miniCart").classList.remove("show");
}

// ------------------------------------
// Atualizar Mini-carrinho
// ------------------------------------
function updateMiniCart() {
    const list = document.getElementById("miniCartList");
    const subtotalSpan = document.getElementById("miniSubtotal");

    list.innerHTML = "";

    let subtotal = 0;

    cart.forEach((item, i) => {
        subtotal += Number(item.preco);

        const div = document.createElement("div");
        div.className = "mini-cart-item";

        div.innerHTML = `
            <div class="mini-item-left">
                <h4>${item.nome}</h4>
                <strong>${money(item.preco)}</strong>
            </div>

            <button class="remove-item" data-index="${i}">✖</button>
        `;

        list.appendChild(div);
    });

    subtotalSpan.textContent = money(subtotal);

    // A taxa é atualizada no BLOCO 6 (onde fica o frete dinâmico + CEP manual)
    updateDeliveryFee(subtotal);

    // Barra de progresso do frete (parte final fica no BLOCO 6)
    updateFreteProgress(subtotal);
}

document.addEventListener("click", (ev) => {
    if (ev.target.classList.contains("remove-item")) {
        const index = ev.target.dataset.index;
        removeFromCart(index);
    }
});

// ------------------------------------
// EXTRAS / ADICIONAIS
// ------------------------------------
document.getElementById("closeExtrasModal").addEventListener("click", () => {
    document.getElementById("extrasModal").classList.add("hidden");
});

function openExtrasModal() {
    document.getElementById("extrasModal").classList.remove("hidden");
}

// ------------------------------------
// ENDEREÇO / VIA CEP (modo automático)
// ------------------------------------
document.getElementById("buscarCEPBtn").addEventListener("click", safe(buscarCEP));

async function buscarCEP() {
    const cep = document.getElementById("cepInput").value.replace(/\D/g, "");

    if (cep.length !== 8) {
        alert("CEP inválido.");
        return;
    }

    const url = `https://viacep.com.br/ws/${cep}/json/`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.erro) {
            alert("CEP não encontrado.");
            return;
        }

        const endereco = `${data.logradouro} - ${data.bairro} (${data.localidade}/${data.uf})`;

        document.getElementById("addressFull").value = endereco;

        // atualizar mini-carrinho
        updateMiniCart();

    } catch (e) {
        console.error("Erro no ViaCEP", e);
    }
}

// ------------------------------------
// ABRIR MODAL ENDEREÇO
// ------------------------------------
document.getElementById("openProfileBtn").addEventListener("click", () => {
    document.getElementById("addressModal").classList.remove("hidden");
});
document.getElementById("closeAddressModal").addEventListener("click", () => {
    document.getElementById("addressModal").classList.add("hidden");
});

// ------------------------------------
// MODO MANUAL — inicia no BLOCO 6
// ------------------------------------
document.getElementById("openCepManual").addEventListener("click", () => {
    document.getElementById("manualAddressArea").classList.remove("hidden");
});
/* =========================================================
   DFL v5.5 — SCRIPT (PARTE 2 / FINAL)
   ========================================================= */

/* ---------------------------------------------------------
   MODO MANUAL — Confirma endereço manual
--------------------------------------------------------- */
document.getElementById("usarManualBtn").addEventListener("click", () => {
    const rua = document.getElementById("manualRua").value.trim();
    const bairro = document.getElementById("manualBairro").value.trim();
    const cidade = document.getElementById("manualCidade").value.trim();
    const estado = document.getElementById("manualEstado").value.trim();

    if (!rua || !bairro) {
        alert("Por favor, preencha ao menos rua e bairro.");
        return;
    }

    const endereco = `${rua} - ${bairro} (${cidade}/${estado})`;

    document.getElementById("addressFull").value = endereco;

    // fecha modal
    document.getElementById("addressModal").classList.add("hidden");

    updateMiniCart();
});

/* ---------------------------------------------------------
   NORMALIZAÇÃO PARA BUSCAR O BAIRRO (super estável)
--------------------------------------------------------- */
function norm(v) {
    return v
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

/* ---------------------------------------------------------
   EXTRAI BAIRRO DE: "Rua X - Bairro (Cidade/UF)"
--------------------------------------------------------- */
function extractBairro(full) {
    if (!full) return "";

    // Caso manual
    if (full.includes("(") && full.includes("-")) {
        const part = full.split("-")[1] || "";
        return part.split("(")[0].trim();
    }

    return full.trim();
}

/* ---------------------------------------------------------
   FRETE DINÂMICO — consulta Firebase
--------------------------------------------------------- */
async function getDynamicDeliveryFee(bairroCliente) {
    if (!bairroCliente) return 6;

    const clean = norm(bairroCliente);

    try {
        const tabelaDoc = await db
            .collection("TaxasDeEntrega")
            .doc("bairros")
            .collection("lista")
            .doc("tabela")
            .get();

        if (!tabelaDoc.exists) return 6;

        const array = tabelaDoc.data().data;
        if (!Array.isArray(array)) return 6;

        let found = null;

        // busca EXATA
        found = array.find(x => norm(x.nome) === clean);

        // busca por substring (parcial)
        if (!found) {
            found = array.find(x => norm(x.nome).includes(clean));
        }

        // busca invertida (cliente inclui bairro reduzido)
        if (!found) {
            found = array.find(x => clean.includes(norm(x.nome)));
        }

        return found ? Number(found.taxa) : 6;

    } catch (e) {
        console.error("Erro frete dinâmico:", e);
        return 6;
    }
}

/* ---------------------------------------------------------
   ATUALIZA TAXA DE ENTREGA
--------------------------------------------------------- */
async function updateDeliveryFee(subtotal) {
    const address = document.getElementById("addressFull").value.trim();
    const deliverySpan = document.getElementById("miniDeliveryFee");
    const totalSpan = document.getElementById("miniTotal");

    if (!address) {
        deliverySpan.textContent = "R$ 0,00";
        totalSpan.textContent = money(subtotal);
        return;
    }

    const bairro = extractBairro(address);
    let taxa = await getDynamicDeliveryFee(bairro);

    // frete grátis acima de 80
    if (subtotal >= 80) {
        taxa = 0;
        deliverySpan.textContent = "Grátis";
    } else {
        deliverySpan.textContent = money(taxa);
    }

    const total = subtotal + taxa;
    totalSpan.textContent = money(total);
}

/* ---------------------------------------------------------
   BARRA DE PROGRESSO DO FRETE (mini-carrinho)
--------------------------------------------------------- */
function updateFreteProgress(subtotal) {
    const bar = document.getElementById("frete-progress-bar");
    const text = document.getElementById("frete-progress-text");

    const minFree = 80;

    if (subtotal >= minFree) {
        bar.style.setProperty("--p", "100%");
        bar.className = "fill-3";
        bar.style.setProperty("--p", "100%");
        text.textContent = "🎉 Você ganhou frete grátis!";
        return;
    }

    const porcentagem = Math.min(100, (subtotal / minFree) * 100);
    bar.style.setProperty("--p", `${porcentagem}%`);
    bar.querySelector("::after");

    if (porcentagem < 50) {
        bar.className = "fill-1";
    } else if (porcentagem < 100) {
        bar.className = "fill-2";
    }

    const falta = minFree - subtotal;
    text.textContent = `Faltam ${money(falta)} para frete grátis`;
}

/* ---------------------------------------------------------
   BARRA DE PROGRESSO DO TOPO (Opção B – Ícones)
--------------------------------------------------------- */
function updateTopProgress(step) {
    // step = 1,2,3,4

    const icons = {
        1: document.getElementById("stepCart"),
        2: document.getElementById("stepAddress"),
        3: document.getElementById("stepPayment"),
        4: document.getElementById("stepFinish")
    };

    Object.values(icons).forEach(icon => {
        icon.classList.remove("active", "done");
    });

    for (let i = 1; i <= 4; i++) {
        if (i < step) icons[i].classList.add("done");
        if (i === step) icons[i].classList.add("active");
    }

    const bar = document.getElementById("mainProgressBar");
    const porcentagem = (step - 1) * 33.33;

    bar.style.width = `${porcentagem}%`;

    if (step === 4) {
        bar.classList.add("success");
    } else {
        bar.classList.remove("success");
    }
}

// Passo inicial
updateTopProgress(1);

/* ---------------------------------------------------------
   FINAL — AÇÃO AO FINALIZAR PEDIDO
--------------------------------------------------------- */
document.getElementById("finishOrderBtn").addEventListener("click", () => {
    updateTopProgress(4);

    alert("Pedido finalizado com sucesso! 🎉");
});