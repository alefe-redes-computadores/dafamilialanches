/* =========================================================
   DFL – Script estável revisado (20/10/2025)
   Corrigido: carrinho NaN, IDs corretos e extras duplicados
   ========================================================= */

const clickSfx = new Audio("click.wav");
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
  try { clickSfx.currentTime = 0; clickSfx.play(); } catch (_) {}
}

/* ---------------------------
   STATUS DE ABERTURA
--------------------------- */
function nowInMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function setStatusBanner() {
  const el = document.getElementById("status-banner");
  if (!el) return;
  const d = new Date();
  const dow = d.getDay();
  let openMins = null, closeMins = null, label = "";

  if (dow === 2) {
    el.textContent = "Fechado hoje (Terça) — voltamos amanhã!";
    return;
  }

  if (dow >= 1 && dow <= 4) {
    openMins = 18 * 60;
    closeMins = 23 * 60 + 15;
    label = "Aberto até 23h15";
  } else {
    openMins = 17 * 60 + 30;
    closeMins = 23 * 60 + 30;
    label = "Aberto até 23h30";
  }

  const now = nowInMinutes();
  if (now < openMins) {
    const h = Math.floor((openMins - now) / 60);
    const m = (openMins - now) % 60;
    el.textContent = `Abrimos às ${label.includes("23h15") ? "18h" : "17h30"} • falta ${h}h${m
      .toString()
      .padStart(2, "0")}m`;
  } else if (now >= openMins && now <= closeMins) {
    el.textContent = `🟢 ${label}`;
  } else {
    el.textContent = "Fechado agora — abrimos no próximo horário.";
  }
}

/* ---------------------------
   COUNTDOWN PROMO
--------------------------- */
function updateCountdown() {
  const box = document.getElementById("timer");
  if (!box) return;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end - new Date();
  if (diff <= 0) return (box.textContent = "00:00:00");
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  box.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
}

/* ---------------------------
   CARROSSEL
--------------------------- */
function initCarousel() {
  const rail = document.querySelector(".slides");
  if (!rail) return;
  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");
  const step = () => Math.min(rail.clientWidth * 0.9, 320);
  prev?.addEventListener("click", () =>
    rail.scrollBy({ left: -step(), behavior: "smooth" })
  );
  next?.addEventListener("click", () =>
    rail.scrollBy({ left: step(), behavior: "smooth" })
  );
  rail.querySelectorAll(".slide").forEach((img) => {
    img.addEventListener("click", () => {
      window.open(img.src, "_blank");
    });
  });
}

/* ---------------------------
   MINI CARRINHO
--------------------------- */
function openMiniCart() {
  renderMiniCart();
  document.getElementById("cart-backdrop").classList.add("show");
  document.getElementById("mini-cart").classList.add("active");
  document.body.classList.add("no-scroll");
}

function closeMiniCart() {
  document.getElementById("cart-backdrop").classList.remove("show");
  document.getElementById("mini-cart").classList.remove("active");
  document.body.classList.remove("no-scroll");
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
    li.querySelector(".qty-inc").onclick = () => {
      it.qtd++;
      saveCart();
      renderMiniCart();
    };
    li.querySelector(".qty-dec").onclick = () => {
      it.qtd = Math.max(1, it.qtd - 1);
      saveCart();
      renderMiniCart();
    };
    li.querySelector(".remove-item").onclick = () => {
      cart.splice(idx, 1);
      saveCart();
      renderMiniCart();
    };
    list.appendChild(li);
  });
}

/* ---------------------------
   ADICIONAR AO CARRINHO
--------------------------- */
function bindAddButtons() {
  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;
      const id = card.dataset.id || Math.random().toString(36).slice(2);
      const nome =
        card.dataset.name ||
        card.querySelector("h3")?.textContent?.trim() ||
        "Item";
      const preco = Number(card.dataset.price || 0);
      if (!nome || !preco) return;
      const found = cart.find((i) => i.id === id);
      if (found) found.qtd += 1;
      else cart.push({ id, nome, preco, qtd: 1 });
      saveCart();
      playClick();
      popup(`🍔 ${nome} adicionado!`);
    });
  });
}

/* ---------------------------
   ADICIONAIS
--------------------------- */
function bindExtrasButtons() {
  document.querySelectorAll(".extras-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = document.getElementById("extras-modal");
      if (modal) modal.classList.add("show");
    });
  });

  document.querySelectorAll(".extras-close").forEach((b) =>
    b.addEventListener("click", () =>
      document.getElementById("extras-modal")?.classList.remove("show")
    )
  );

  document.getElementById("extras-add")?.addEventListener("click", () => {
    const modal = document.getElementById("extras-modal");
    const checks = modal.querySelectorAll("input:checked");
    if (!checks.length) {
      modal.classList.remove("show");
      return;
    }
    let total = 0;
    const nomes = [];
    checks.forEach((c) => {
      total += Number(c.dataset.price);
      nomes.push(c.dataset.extra);
    });
    cart.push({
      id: `extra-${Date.now()}`,
      nome: `Adicionais: ${nomes.join(", ")}`,
      preco: total,
      qtd: 1,
    });
    saveCart();
    modal.classList.remove("show");
    popup("➕ Adicionais adicionados!");
  });
}

/* ---------------------------
   LOGIN (visual)
--------------------------- */
function setupLoginButton() {
  let userBtn = document.querySelector("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.textContent = "Entrar / Cadastro";
    document.querySelector(".header")?.appendChild(userBtn);
  }
  userBtn.onclick = () =>
    alert("Login visual ativo — autenticação será integrada futuramente.");
}

/* ---------------------------
   INICIALIZAÇÃO
--------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  setStatusBanner();
  setInterval(setStatusBanner, 60_000);
  updateCountdown();
  setInterval(updateCountdown, 1000);
  updateCartBadge();
  bindAddButtons();
  bindExtrasButtons();
  initCarousel();
  setupLoginButton();

  // Ícone carrinho
  document.getElementById("cart-icon")?.addEventListener("click", () => {
    playClick();
    openMiniCart();
  });

  document.querySelector(".mini-close")?.addEventListener("click", closeMiniCart);
  document.getElementById("cart-backdrop")?.addEventListener("click", closeMiniCart);

  document.getElementById("mini-clear")?.addEventListener("click", () => {
    cart = [];
    saveCart();
    renderMiniCart();
  });

  document.getElementById("mini-checkout")?.addEventListener("click", () => {
    if (!cart.length) return;
    const linhas = cart.map(
      (i) => `• ${i.nome} ${i.qtd > 1 ? `x${i.qtd}` : ""} — ${money(i.preco * i.qtd)}`
    );
    const total = cart.reduce((a, i) => a + i.preco * i.qtd, 0);
    const txt = `Olá! Quero finalizar meu pedido:%0A%0A${linhas.join(
      "%0A"
    )}%0A%0ATotal: ${money(total)}`;
    window.open(`https://wa.me/5534997178336?text=${txt}`, "_blank");
  });
});