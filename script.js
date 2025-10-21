/* =========================================================
   DFL – Script estável (Firebase + Carrinho + Extras + UI)
   ========================================================= */

/* ---------------------------
   ÁUDIO DE CLIQUE
--------------------------- */
const clickSfx = new Audio("click.wav");
clickSfx.volume = 0.35;
function playClick() {
  try { clickSfx.currentTime = 0; clickSfx.play(); } catch (_) {}
}

/* ---------------------------
   ESTADO DO CARRINHO
--------------------------- */
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// Migra itens antigos (name/price → nome/preco)
cart = cart.map(it => {
  const nome = it.nome ?? it.name ?? "Item";
  const precoNum = typeof it.preco === "number"
    ? it.preco
    : (typeof it.price === "number" ? it.price : parseFloat(it.preco ?? it.price ?? "0"));
  const preco = Number.isFinite(precoNum) ? precoNum : 0;
  const qtd = Math.max(1, parseInt(it.qtd ?? it.quantidade ?? 1, 10) || 1);
  const id = it.id ?? nome.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2,7);
  return { id, nome, preco, qtd };
});

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  const totalQtd = cart.reduce((acc, i) => acc + (i.qtd || 1), 0);
  el.textContent = totalQtd;
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

/* ---------------------------
   ABERTO/FECHADO + COUNTDOWN
--------------------------- */
function nowInMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function setStatusBanner() {
  const el = document.getElementById("status-banner");
  if (!el) return;

  const d = new Date();
  const dow = d.getDay(); // 0 Dom … 6 Sáb

  if (dow === 2) { // Terça
    el.textContent = "Fechado hoje (Terça) — voltamos amanhã!";
    return;
  }

  let openMins, closeMins, label;
  if (dow >= 1 && dow <= 4) { // Seg–Qui
    openMins = 18 * 60;
    closeMins = 23 * 60 + 15;
    label = "Aberto até 23h15";
  } else { // Sex–Dom
    openMins = 17 * 60 + 30;
    closeMins = 23 * 60 + 30;
    label = "Aberto até 23h30";
  }

  const now = nowInMinutes();
  if (now < openMins) {
    const mins = openMins - now;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    el.textContent = `Abre às ${openMins === 18*60 ? "18h" : "17h30"} • falta ${h}h${String(m).padStart(2,"0")}m`;
  } else if (now <= closeMins) {
    el.textContent = `🟢 ${label}`;
  } else {
    el.textContent = "Fechado agora — abrimos no próximo horário.";
  }
}

function updateCountdown() {
  const box = document.getElementById("timer");
  if (!box) return;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end - new Date();
  if (diff <= 0) { box.textContent = "00:00:00"; return; }
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  box.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
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

  prev?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
  next?.addEventListener("click", () => rail.scrollBy({ left:  step(), behavior: "smooth" }));

  // Agora sempre manda para o WhatsApp (usa o alt como nome da oferta)
  rail.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      const oferta = img.alt?.trim() || "Promoção DFL";
      const txt = `Olá! Vi a oferta "${oferta}" no site e quero saber mais.`;
      window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(txt)}`, "_blank");
    });
  });
}

/* ---------------------------
   MINI-CARRINHO
--------------------------- */
function openMiniCart() {
  document.getElementById("cart-backdrop")?.classList.add("show");
  document.getElementById("mini-cart")?.classList.add("active");
  document.body.classList.add("no-scroll");
}

function closeMiniCart() {
  document.getElementById("cart-backdrop")?.classList.remove("show");
  document.getElementById("mini-cart")?.classList.remove("active");
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
    const precoLinha = Number.isFinite(it.preco) ? it.preco : 0;
    const subtotal = precoLinha * (it.qtd || 1);

    li.innerHTML = `
      <div style="flex:1;min-width:0">
        <span>${it.nome || "Item"}</span><br>
        <small>${money(precoLinha)}</small>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="qty-dec" aria-label="Diminuir">−</button>
        <span>${it.qtd}</span>
        <button class="qty-inc" aria-label="Aumentar">+</button>
        <strong>${money(subtotal)}</strong>
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
      cart.splice(idx, 1); saveCart(); renderMiniCart();
    });

    list.appendChild(li);
  });
}

/* ---------------------------
   BOTÕES “ADICIONAR”
--------------------------- */
function bindAddButtons() {
  document.querySelectorAll(".add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      if (!card) return;

      const id    = card.dataset.id || card.querySelector("h3")?.textContent?.trim() || Math.random().toString(36).slice(2);
      const nome  = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "Item";
      const preco = parseFloat(card.dataset.price || "0");
      const precoVal = Number.isFinite(preco) ? preco : 0;

      const found = cart.find(i => i.id === id && i.preco === precoVal);
      if (found) found.qtd += 1;
      else cart.push({ id, nome, preco: precoVal, qtd: 1 });

      saveCart();
      renderMiniCart();
      playClick();
      popup(`🍔 ${nome} adicionado!`);
    });
  });
}

/* ---------------------------
   ADICIONAIS (Lista correta)
--------------------------- */
const EXTRAS = [
  { nome: "Cheddar cremoso", preco: 2.00, emoji: "🧀" },
  { nome: "Bacon crocante",  preco: 3.00, emoji: "🥓" },
  { nome: "Ovo",             preco: 1.50, emoji: "🍳" },
  { nome: "Cebola crispy",   preco: 2.00, emoji: "🧅" }
];

function populateExtrasList() {
  const list = document.getElementById("extras-list");
  if (!list) return;
  list.innerHTML = EXTRAS.map(ex =>
    `<label>
       <span>${ex.emoji} ${ex.nome}</span>
       <input type="checkbox" data-extra="${ex.nome}" data-price="${ex.preco}">
     </label>`
  ).join("");
}

function bindExtras() {
  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      populateExtrasList();
      document.getElementById("extras-modal")?.classList.add("show");
    });
  });

  document.querySelector(".extras-close")?.addEventListener("click", () =>
    document.getElementById("extras-modal")?.classList.remove("show")
  );
  document.getElementById("extras-cancel")?.addEventListener("click", () =>
    document.getElementById("extras-modal")?.classList.remove("show")
  );

  document.getElementById("extras-add")?.addEventListener("click", () => {
    const checks = document.querySelectorAll("#extras-list input:checked");
    if (!checks.length) { document.getElementById("extras-modal")?.classList.remove("show"); return; }

    let total = 0; const nomes = [];
    checks.forEach(c => { total += parseFloat(c.dataset.price || "0"); nomes.push(c.dataset.extra); });

    cart.push({ id: "extra-" + Date.now(), nome: "Adicionais: " + nomes.join(", "), preco: total, qtd: 1 });
    saveCart();
    renderMiniCart();
    document.getElementById("extras-modal")?.classList.remove("show");
    popup("➕ Adicionais adicionados!");
  });
}

/* ---------------------------
   LOGIN (Modal + Google)
--------------------------- */
function ensureLoginModal() {
  if (document.getElementById("login-modal")) return;

  const modal = document.createElement("div");
  modal.id = "login-modal";
  modal.className = "";
  modal.innerHTML = `
    <div class="login-backdrop"></div>
    <div class="login-box">
      <button class="login-x" aria-label="Fechar">✕</button>
      <h3>Entrar / Cadastro</h3>
      <p>Acesse sua conta para acompanhar pedidos.</p>
      <div class="divider">ou</div>
      <button id="btn-google" class="btn-google">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt=""> Entrar com Google
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

function setupLogin() {
  // Botão no header
  let userBtn = document.querySelector("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.textContent = "Entrar / Cadastro";
    document.querySelector(".header")?.appendChild(userBtn);
  }

  // Garante que exista um modal
  ensureLoginModal();

  // Abrir/fechar modal
  userBtn.addEventListener("click", () => {
    document.getElementById("login-modal")?.classList.add("show");
  });
  document.querySelector(".login-x")?.addEventListener("click", () =>
    document.getElementById("login-modal")?.classList.remove("show")
  );
  document.getElementById("login-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "login-modal" || e.target.classList.contains("login-backdrop")) {
      e.currentTarget.classList.remove("show");
    }
  });

  // Firebase (usa os scripts v8 do HTML)
  try {
    if (!firebase.apps.length) {
      const firebaseConfig = {
        // === SUBSTITUA PELO SEU CONFIG REAL ===
        apiKey: "AIzaSyF-XXXXXX",
        authDomain: "dafamilia-lanches.firebaseapp.com",
        projectId: "dafamilia-lanches",
        storageBucket: "dafamilia-lanches.appspot.com",
        messagingSenderId: "XXXXXX",
        appId: "1:XXXXXX:web:XXXXXX"
      };
      firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();

    // Botão Google (classe ou id)
    const bindGoogle = () => {
      const gbtn = document.querySelector("#btn-google") || document.querySelector(".btn-google");
      if (!gbtn) return;
      gbtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          await auth.signInWithPopup(provider);
          document.getElementById("login-modal")?.classList.remove("show");
        } catch (err) {
          alert("Falha ao autenticar com o Google:\n" + (err?.message || err));
        }
      });
    };
    bindGoogle();

    auth.onAuthStateChanged((user) => {
      if (user) {
        const nome = user.displayName || (user.email ? user.email.split("@")[0] : "Cliente");
        userBtn.textContent = `Olá, ${nome} (Sair)`;
        userBtn.onclick = () => auth.signOut();
      } else {
        userBtn.textContent = "Entrar / Cadastro";
        userBtn.onclick = () => document.getElementById("login-modal")?.classList.add("show");
      }
    });
  } catch (e) {
    console.warn("Firebase indisponível. Mantendo login apenas visual.", e);
  }
}

/* ---------------------------
   INICIALIZAÇÃO GERAL
--------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  // Badge inicial + salva migração
  saveCart();

  // Status e countdown
  setStatusBanner();
  setInterval(setStatusBanner, 60_000);
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Carrossel
  initCarousel();

  // Botões adicionar
  bindAddButtons();

  // Extras
  bindExtras();

  // Mini-cart
  document.getElementById("cart-icon")?.addEventListener("click", () => { playClick(); renderMiniCart(); openMiniCart(); });
  document.getElementById("mini-clear")?.addEventListener("click", () => { cart = []; saveCart(); renderMiniCart(); });
  document.querySelector(".mini-close")?.addEventListener("click", closeMiniCart);
  document.getElementById("cart-backdrop")?.addEventListener("click", closeMiniCart);

  document.getElementById("mini-checkout")?.addEventListener("click", () => {
    if (!cart.length) return;
    const linhas = cart.map(i => `• ${i.nome}${i.qtd>1?` x${i.qtd}`:""} — ${money(i.preco*i.qtd)}`);
    const total = cart.reduce((a,i)=>a+i.preco*i.qtd,0);
    const txt = `Olá! Quero finalizar meu pedido:%0A%0A${linhas.join("%0A")}%0A%0ATotal: ${money(total)}`;
    window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(txt)}`, "_blank");
  });

  // Login
  setupLogin();
});