/* =========================================================
   DFL – Script estável (sem Firebase)
   Funciona: clique com som, carrinho + fechar pedido,
   extras, carrossel, countdown e status “Aberto/Fechado”.
   ========================================================= */

/* ---------------------------
   UTIL / ESTADO
--------------------------- */
const clickSfx = new Audio("click.wav"); // <<< importante: .wav
clickSfx.volume = 0.35;

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = cart.reduce((a, i) => a + (i.qtd || 1), 0);
}
function money(n) {
  return `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
}
function popup(msg) {
  const el = document.createElement("div");
  el.className = "popup-add";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}
function playClick() {
  try { clickSfx.currentTime = 0; clickSfx.play(); } catch(_) {}
}

/* ---------------------------
   BANNER DE STATUS (ABERTO)
   Seg–Qui 18–23:15 | Sex–Dom 17:30–23:30 | Ter fechado
--------------------------- */
function nowInMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function setStatusBanner() {
  const el = document.getElementById("status-banner");
  if (!el) return;

  const d = new Date();
  const dow = d.getDay(); // 0=Dom ... 2=Ter
  let openMins = null, closeMins = null, label = "";

  if (dow === 2) {
    el.textContent = "Fechado hoje (Terça) — voltamos amanhã!";
    return;
  }

  if (dow >= 1 && dow <= 4) {         // Seg(1) a Qui(4)
    openMins  = 18*60;
    closeMins = 23*60 + 15;
    label = "Aberto até 23h15";
  } else {                            // Sex(5) a Dom(0)
    openMins  = 17*60 + 30;
    closeMins = 23*60 + 30;
    label = "Aberto até 23h30";
  }

  const now = nowInMinutes();
  if (now < openMins) {
    const h = Math.floor((openMins - now)/60);
    const m = (openMins - now) % 60;
    el.textContent = `Abrimos às ${label.includes("23h15") ? "18h" : "17h30"} • falta ${h}h${m.toString().padStart(2,"0")}m`;
  } else if (now >= openMins && now <= closeMins) {
    el.textContent = `🟢 ${label}`;
  } else {
    el.textContent = "Fechado agora — abrimos no próximo horário.";
  }
}

/* ---------------------------
   COUNTDOWN PROMO DO DIA
--------------------------- */
function updateCountdown() {
  const box = document.getElementById("timer");
  if (!box) return;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end - new Date();
  if (diff <= 0) {
    box.textContent = "00:00:00";
    return;
  }
  const h = Math.floor(diff/3_600_000);
  const m = Math.floor((diff%3_600_000)/60_000);
  const s = Math.floor((diff%60_000)/1000);
  box.textContent =
    `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* ---------------------------
   CARROSSEL (setas + clique)
--------------------------- */
function initCarousel() {
  const rail = document.querySelector(".slides");
  if (!rail) return;

  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");

  const step = () => Math.min(rail.clientWidth * 0.9, 320);

  prev?.addEventListener("click", () => rail.scrollBy({left: -step(), behavior:"smooth"}));
  next?.addEventListener("click", () => rail.scrollBy({left:  step(), behavior:"smooth"}));

  rail.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      const wa = img.getAttribute("data-wa");
      if (wa) {
        // se você usa CTA pro WhatsApp na promo
        window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(wa)}`, "_blank");
      } else {
        // fallback: abre a imagem
        window.open(img.src, "_blank");
      }
    });
  });
}

/* ---------------------------
   MINI-CARRINHO (UI dinâmico)
--------------------------- */
function ensureMiniCart() {
  if (document.getElementById("mini-cart")) return;

  const backdrop = document.createElement("div");
  backdrop.id = "cart-backdrop";

  const panel = document.createElement("aside");
  panel.id = "mini-cart";
  panel.className = "mini-cart";
  panel.innerHTML = `
    <div class="mini-head">
      <h3>Seu Pedido</h3>
      <button class="mini-close" aria-label="Fechar">✕</button>
    </div>
    <div id="mini-list" class="mini-list"></div>
    <div class="mini-foot">
      <button id="btnClearCart" class="btn-secondary">Limpar</button>
      <button id="btnCloseOrder" class="btn-primary">Fechar pedido</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  // Fechar
  const closeAll = () => {
    panel.classList.remove("active");
    backdrop.classList.remove("show");
    document.body.classList.remove("no-scroll");
  };
  backdrop.addEventListener("click", closeAll);
  panel.querySelector(".mini-close").addEventListener("click", closeAll);

  // Limpar
  document.getElementById("btnClearCart").addEventListener("click", () => {
    cart = [];
    saveCart();
    renderMiniCart();
  });

  // Fechar pedido -> WhatsApp
  document.getElementById("btnCloseOrder").addEventListener("click", () => {
    if (!cart.length) return;
    const linhas = cart.map(i => `• ${i.nome} ${i.qtd>1?`x${i.qtd}`:""} — ${money(i.preco*i.qtd)}`);
    const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
    const txt = `Olá! Quero finalizar meu pedido:%0A%0A${linhas.join("%0A")}%0A%0ATotal: ${money(total)}`;
    window.open(`https://wa.me/5534997178336?text=${txt}`,"_blank");
  });
}

function openMiniCart() {
  ensureMiniCart();
  renderMiniCart();
  document.getElementById("cart-backdrop").classList.add("show");
  document.getElementById("mini-cart").classList.add("active");
  document.body.classList.add("no-scroll");
}

function renderMiniCart() {
  const list = document.getElementById("mini-list");
  if (!list) return;

  if (!cart.length) {
    list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`;
    return;
  }

  list.innerHTML = "";
  cart.forEach((it, idx) => {
    const li = document.createElement("div");
    li.className = "cart-item";
    li.innerHTML = `
      <div style="flex:1;min-width:0">
        <span>${it.nome}</span><br>
        <small>${money(it.preco)}</small>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="qty-dec">−</button>
        <span>${it.qtd}</span>
        <button class="qty-inc">+</button>
        <strong>${money(it.preco * it.qtd)}</strong>
        <button class="remove-item" title="Remover">x</button>
      </div>
    `;
    li.querySelector(".qty-inc").addEventListener("click", () => {
      it.qtd++; saveCart(); renderMiniCart();
    });
    li.querySelector(".qty-dec").addEventListener("click", () => {
      it.qtd = Math.max(1, it.qtd - 1); saveCart(); renderMiniCart();
    });
    li.querySelector(".remove-item").addEventListener("click", () => {
      cart.splice(idx,1); saveCart(); renderMiniCart();
    });
    list.appendChild(li);
  });
}

/* ---------------------------
   ADICIONAR AO CARRINHO
--------------------------- */
function bindAddButtons() {
  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      const id    = card.dataset.id || card.dataset.name || Math.random().toString(36).slice(2);
      const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");

      // Se já existe no carrinho, só soma quantidade
      const found = cart.find(i => i.id === id && i.preco === preco);
      if (found) found.qtd += 1;
      else cart.push({ id, nome, preco, qtd: 1 });

      saveCart();
      playClick();
      popup(`🍔 ${nome} adicionado!`);
    });
  });
}

/* ---------------------------
   ADICIONAIS (modal simples)
--------------------------- */
let extrasModal;
function ensureExtrasModal() {
  if (extrasModal) return extrasModal;
  extrasModal = document.createElement("div");
  extrasModal.id = "extras-modal";
  extrasModal.innerHTML = `
    <div class="extras-head">
      <span>Escolha seus adicionais</span>
      <button class="extras-close" aria-label="Fechar">✕</button>
    </div>
    <div class="extras-list">
      <label><span>🧀 Cheddar cremoso</span><input type="checkbox" data-extra="Cheddar" data-price="2"></label>
      <label><span🥓>🥓 Bacon crocante</span><input type="checkbox" data-extra="Bacon" data-price="3"></label>
      <label><span>🍳 Ovo</span><input type="checkbox" data-extra="Ovo" data-price="1.5"></label>
      <label><span>🧅 Cebola crispy</span><input type="checkbox" data-extra="Cebola crispy" data-price="2"></label>
    </div>
    <div class="extras-foot">
      <button class="btn-secondary extras-close">Cancelar</button>
      <button id="extras-add" class="btn-primary">Adicionar</button>
    </div>
  `;
  document.body.appendChild(extrasModal);

  extrasModal.querySelectorAll(".extras-close").forEach(b =>
    b.addEventListener("click", () => extrasModal.classList.remove("show"))
  );

  document.getElementById("extras-add").addEventListener("click", () => {
    const checks = extrasModal.querySelectorAll("input:checked");
    if (!checks.length) { extrasModal.classList.remove("show"); return; }

    let total = 0; const nomes = [];
    checks.forEach(c => { total += parseFloat(c.dataset.price); nomes.push(c.dataset.extra); });

    cart.push({ id:`extra-${Date.now()}`, nome:`Adicionais: ${nomes.join(", ")}`, preco: total, qtd: 1 });
    saveCart();
    extrasModal.classList.remove("show");
    popup("➕ Adicionais adicionados!");
  });

  return extrasModal;
}

function bindExtrasButtons() {
  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      ensureExtrasModal().classList.add("show");
    });
  });
}

/* ---------------------------
   LOGIN (apenas UI estável)
--------------------------- */
function setupLoginButton() {
  // Botão é criado dinamicamente caso não exista
  let userBtn = document.querySelector("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.textContent = "Entrar / Cadastro";
    document.querySelector(".header")?.appendChild(userBtn);
  }

  userBtn.addEventListener("click", () => {
    const modal = document.getElementById("login-modal");
    if (modal) {
      modal.classList.add("show");
      const close = modal.querySelector(".login-x");
      close?.addEventListener("click", () => modal.classList.remove("show"));
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("show");
      });
      // Se houver botão Google no seu HTML, só previnimos a navegação vazia.
      const googleBtn = modal.querySelector(".btn-google");
      googleBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        alert("Login pelo Google será ativado depois que finalizarmos a parte visual. 😉");
      });
    } else {
      alert("Área de login em breve (mantivemos estável para não quebrar o site).");
    }
  });
}

/* ---------------------------
   ENGANCHOS GERAIS
--------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  // Status e countdown
  setStatusBanner();
  setInterval(setStatusBanner, 60_000);
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Carrinho
  updateCartBadge();
  ensureMiniCart();
  bindAddButtons();
  bindExtrasButtons();

  // Ícone do carrinho
  document.getElementById("cart-icon")?.addEventListener("click", () => {
    playClick();
    openMiniCart();
  });

  // Carrossel
  initCarousel();

  // Login (UI apenas)
  setupLoginButton();
});