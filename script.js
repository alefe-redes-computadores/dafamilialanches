/* =========================================
   🧱 HOTFIX v1.4.8 – Carrinho e Modais
   (corrige travamento e sobreposição)
========================================= */
document.addEventListener("DOMContentLoaded", () => {

/* ---------- 1️⃣ Reposiciona carrinho ---------- */
const miniCart = document.getElementById("mini-cart");
const cartBackdrop = document.getElementById("cart-backdrop");
const ordersPanel = document.querySelector(".orders-panel");

// Corrige conflito de z-index entre carrinho e pedidos
if (miniCart) {
  miniCart.style.position = "fixed";
  miniCart.style.top = "auto";
  miniCart.style.bottom = "80px";
  miniCart.style.right = "15px";
  miniCart.style.left = "auto";
  miniCart.style.zIndex = "9999";
  miniCart.style.maxHeight = "80vh";
  miniCart.style.overflowY = "auto";
  miniCart.style.borderRadius = "14px";
  miniCart.style.boxShadow = "0 8px 24px rgba(0,0,0,.25)";
}

// Corrige backdrop
if (cartBackdrop) {
  cartBackdrop.style.position = "fixed";
  cartBackdrop.style.top = "0";
  cartBackdrop.style.left = "0";
  cartBackdrop.style.width = "100%";
  cartBackdrop.style.height = "100%";
  cartBackdrop.style.background = "rgba(0,0,0,0.4)";
  cartBackdrop.style.backdropFilter = "blur(2px)";
  cartBackdrop.style.zIndex = "9998";
  cartBackdrop.style.display = "none";
}

/* ---------- 2️⃣ Abre e fecha carrinho corretamente ---------- */
const toggleCart = () => {
  const ativo = miniCart.classList.toggle("active");
  cartBackdrop.style.display = ativo ? "block" : "none";
  miniCart.style.display = ativo ? "flex" : "none";
  if (ativo) {
    miniCart.scrollTop = 0;
    miniCart.focus();
  }
};

document.getElementById("cart-icon")?.addEventListener("click", toggleCart);
cartBackdrop?.addEventListener("click", () => {
  miniCart.classList.remove("active");
  miniCart.style.display = "none";
  cartBackdrop.style.display = "none";
});

// Fecha carrinho se “Meus Pedidos” abrir
if (ordersPanel) {
  const observer = new MutationObserver(() => {
    if (ordersPanel.classList.contains("active")) {
      miniCart.classList.remove("active");
      miniCart.style.display = "none";
      cartBackdrop.style.display = "none";
    }
  });
  observer.observe(ordersPanel, { attributes: true, attributeFilter: ["class"] });
}

/* ---------- 3️⃣ Habilita “fechar ao clicar fora” nos modais ---------- */
function enableOutsideClose(modalSelector) {
  const modal = document.querySelector(modalSelector);
  if (!modal) return;
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.classList.remove("show");
      document.body.classList.remove("no-scroll");
    }
  });
}
["#extras-modal", "#combo-modal", "#login-modal"].forEach(enableOutsideClose);

/* ---------- 4️⃣ Evita travar rolagem ao abrir modais ---------- */
document.querySelectorAll(".modal").forEach(m => {
  m.style.position = "fixed";
  m.style.top = "0";
  m.style.left = "0";
  m.style.zIndex = "10000";
});

/* ---------- 5️⃣ Feedback visual suave ---------- */
const style = document.createElement("style");
style.textContent = `
#mini-cart.active { animation: cartIn .3s ease forwards; }
@keyframes cartIn { from{transform:translateY(30px);opacity:0}
to{transform:translateY(0);opacity:1} }
`;
document.head.appendChild(style);

console.log("%c✅ HOTFIX v1.4.8 Parte 1 — Carrinho reposicionado e modais destravados", 
"background:#222;color:#0f0;padding:4px;border-radius:4px;");

}); // DOMContentLoaded
/* =========================================
   🧠 HOTFIX v1.4.8 — Parte 2 / 2
   Corrige lógica do modal de combos + extras
========================================= */
document.addEventListener("DOMContentLoaded", () => {

/* ---------- 1️⃣ Correção lógica do modal de combos ---------- */
const comboModal = document.getElementById("combo-modal");
const comboBody = document.getElementById("combo-body");
const comboConfirm = document.getElementById("combo-confirm");

let _comboCtx = null;

function openComboModal(nomeCombo, precoBase) {
  const lower = nomeCombo.toLowerCase();
  const grupo = lower.includes("casal")
    ? "casal"
    : lower.includes("família") || lower.includes("familia")
    ? "familia"
    : null;

  if (!grupo) {
    addCommonItem(nomeCombo, precoBase);
    return;
  }

  const opts = comboDrinkOptions[grupo];
  comboBody.innerHTML = opts
    .map(
      (o, i) => `
      <label>
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""}>
        <span>${o.rotulo} — + ${money(o.delta)}</span>
      </label>`
    )
    .join("");

  _comboCtx = { nomeCombo, precoBase, grupo };
  openModal(comboModal);
}

// Quando o cliente clica em Confirmar
comboConfirm?.addEventListener("click", () => {
  if (!_comboCtx) return;
  const sel = comboBody.querySelector("input[name='combo-drink']:checked");
  if (!sel) return;

  const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
  const precoFinal = _comboCtx.precoBase + opt.delta;
  cart.push({ nome: `${_comboCtx.nomeCombo} (${opt.rotulo})`, preco: precoFinal, qtd: 1 });

  renderMiniCart();
  popupAdd(`${_comboCtx.nomeCombo} adicionado!`);
  closeModal(comboModal);
  _comboCtx = null;
});

/* ---------- 2️⃣ Fechamento de adicionais com clique fora ---------- */
const extrasModal = document.getElementById("extras-modal");
if (extrasModal) {
  extrasModal.addEventListener("click", (e) => {
    if (e.target === extrasModal) {
      closeModal(extrasModal);
    }
  });
}

/* ---------- 3️⃣ Melhoria visual dos modais (transição) ---------- */
const style = document.createElement("style");
style.textContent = `
.modal.show {
  display:flex !important;
  opacity:1;
  transition:opacity .25s ease;
}
.modal {
  display:none;
  align-items:center;
  justify-content:center;
  opacity:0;
}
.modal label {
  display:flex;
  align-items:center;
  gap:8px;
  margin-bottom:8px;
}
`;
document.head.appendChild(style);

/* ---------- 4️⃣ Confirmações no console ---------- */
console.log("%c✅ HOTFIX v1.4.8 Parte 2 — Combos e Adicionais OK", 
"background:#000;color:#0ff;padding:4px;border-radius:4px;");

});