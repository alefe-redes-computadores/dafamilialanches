/* =========================================================
   DFL – Script v1.2 (com Login Google + Carrinho + Som)
   Totalmente compatível com o HTML e CSS atuais.
   ========================================================= */

// ✅ SOM DO CLIQUE
const clickSfx = new Audio("click.wav");
clickSfx.volume = 0.35;
function playClick() {
  try { clickSfx.currentTime = 0; clickSfx.play(); } catch (_) {}
}

// ✅ ESTADO GERAL DO CARRINHO
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = cart.reduce((a, i) => a + (i.qtd || 1), 0);
}
function money(n) { return `R$ ${Number(n).toFixed(2).replace(".", ",")}`; }
function popup(msg) {
  const el = document.createElement("div");
  el.className = "popup-add";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/* =========================================================
   🔹 STATUS E COUNTDOWN
========================================================= */
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
  if (dow === 2) { el.textContent = "Fechado hoje (Terça) — voltamos amanhã!"; return; }
  if (dow >= 1 && dow <= 4) {
    openMins = 18 * 60; closeMins = 23 * 60 + 15; label = "Aberto até 23h15";
  } else { openMins = 17 * 60 + 30; closeMins = 23 * 60 + 30; label = "Aberto até 23h30"; }
  const now = nowInMinutes();
  if (now < openMins) {
    const h = Math.floor((openMins - now) / 60);
    const m = (openMins - now) % 60;
    el.textContent = `Abrimos às ${label.includes("23h15") ? "18h" : "17h30"} • falta ${h}h${m.toString().padStart(2, "0")}m`;
  } else if (now >= openMins && now <= closeMins) {
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
  box.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =========================================================
   🔹 CARROSSEL
========================================================= */
function initCarousel() {
  const rail = document.querySelector(".slides");
  if (!rail) return;
  const prev = document.querySelector(".c-prev");
  const next = document.querySelector(".c-next");
  const step = () => Math.min(rail.clientWidth * 0.9, 320);
  prev?.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
  next?.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));

  rail.querySelectorAll(".slide").forEach(img => {
    img.addEventListener("click", () => {
      playClick();
      const wa = img.getAttribute("data-wa");
      if (wa)
        window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(wa)}`, "_blank");
      else
        window.open(img.src, "_blank");
    });
  });
}

/* =========================================================
   🔹 MINI CARRINHO
========================================================= */
function ensureMiniCart() {
  const backdrop = document.getElementById("cart-backdrop");
  const panel = document.getElementById("mini-cart");
  if (!backdrop || !panel) return;

  const closeAll = () => {
    panel.classList.remove("active");
    backdrop.classList.remove("show");
    document.body.classList.remove("no-scroll");
  };
  backdrop.addEventListener("click", closeAll);
  panel.querySelector(".mini-close")?.addEventListener("click", closeAll);

  document.getElementById("mini-clear")?.addEventListener("click", () => {
    cart = []; saveCart(); renderMiniCart();
  });

  document.getElementById("mini-checkout")?.addEventListener("click", () => {
    if (!cart.length) return;
    const linhas = cart.map(i => `• ${i.nome} ${i.qtd > 1 ? `x${i.qtd}` : ""} — ${money(i.preco * i.qtd)}`);
    const total = cart.reduce((a, i) => a + i.preco * i.qtd, 0);
    const txt = `Olá! Quero finalizar meu pedido:%0A%0A${linhas.join("%0A")}%0A%0ATotal: ${money(total)}`;
    window.open(`https://wa.me/5534997178336?text=${txt}`, "_blank");
  });
}

function openMiniCart() {
  renderMiniCart();
  document.getElementById("cart-backdrop").classList.add("show");
  document.getElementById("mini-cart").classList.add("active");
  document.body.classList.add("no-scroll");
}

function renderMiniCart() {
  const list = document.getElementById("mini-list");
  if (!list) return;
  if (!cart.length) { list.innerHTML = `<p class="empty-cart">Seu carrinho está vazio.</p>`; return; }
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
    li.querySelector(".qty-inc").addEventListener("click", () => { it.qtd++; saveCart(); renderMiniCart(); });
    li.querySelector(".qty-dec").addEventListener("click", () => { it.qtd = Math.max(1, it.qtd - 1); saveCart(); renderMiniCart(); });
    li.querySelector(".remove-item").addEventListener("click", () => { cart.splice(idx, 1); saveCart(); renderMiniCart(); });
    list.appendChild(li);
  });
}
/* =========================================================
   DFL – Script v1.2 (Parte 2/2)
   - Login Google real (Firebase v8)
   - Adicionais com ícones (usando #extras-modal do seu HTML)
   - Ajustes finais de binds e UI
   ========================================================= */

/* ---------------------------------------------------------
   🔁 OVERRIDE: ensureExtrasModal (usa o SEU #extras-modal)
--------------------------------------------------------- */
function ensureExtrasModal() {
  const modal = document.getElementById("extras-modal");
  const backdrop = document.getElementById("extras-backdrop");
  const list = document.getElementById("extras-list");
  const btnAdd = document.getElementById("extras-add");
  const btnCancel = document.getElementById("extras-cancel");
  const x = modal?.querySelector(".extras-close");

  if (!modal || !backdrop || !list || !btnAdd) return modal;

  // Itens bonitos com ícones (restaurado)
  list.innerHTML = `
    <label><span>🧀 Cheddar cremoso</span><input type="checkbox" data-extra="Cheddar" data-price="2"></label>
    <label><span>🥓 Bacon crocante</span><input type="checkbox" data-extra="Bacon" data-price="3"></label>
    <label><span>🍳 Ovo</span><input type="checkbox" data-extra="Ovo" data-price="1.5"></label>
    <label><span>🧅 Cebola crispy</span><input type="checkbox" data-extra="Cebola crispy" data-price="2"></label>
  `;

  const close = () => { modal.classList.remove("show"); backdrop.classList.remove("show"); document.body.classList.remove("no-scroll"); };
  x?.addEventListener("click", close);
  btnCancel?.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  btnAdd.addEventListener("click", () => {
    const checks = modal.querySelectorAll("input:checked");
    if (!checks.length) return close();

    let total = 0; const nomes = [];
    checks.forEach(c => { total += parseFloat(c.dataset.price || "0"); nomes.push(c.dataset.extra); });

    cart.push({ id:`extra-${Date.now()}`, nome:`Adicionais: ${nomes.join(", ")}`, preco: total, qtd: 1 });
    saveCart(); popup("➕ Adicionais adicionados!");
    close();
  });

  return modal;
}

/* ---------------------------------------------------------
   📎 Re-bind do botão “Adicionais” para usar esse modal
--------------------------------------------------------- */
function bindExtrasButtons() {
  const modal = ensureExtrasModal();
  const backdrop = document.getElementById("extras-backdrop");
  document.querySelectorAll(".extras-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!modal) return;
      modal.classList.add("show");
      backdrop?.classList.add("show");
      document.body.classList.add("no-scroll");
      playClick();
    });
  });
}

/* =========================================================
   🔐 LOGIN GOOGLE (Firebase v8)
   - Usa os scripts que já estão no seu HTML
   - Mostra modal de login simples (com botão Google)
   - Troca o botão do header para “Sair” quando logado
========================================================= */

// 👉 COLE AQUI O MESMO CONFIG QUE VOCÊ JÁ UTILIZAVA (o seu, real):
// Se já estiver inicializado, não reinicializa.
(function initFirebaseOnce() {
  if (window.firebase && !firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyF-XXXXXX",
      authDomain: "dafamilia-lanches.firebaseapp.com",
      projectId: "dafamilia-lanches",
      storageBucket: "dafamilia-lanches.appspot.com",
      messagingSenderId: "XXXXXX",
      appId: "1:XXXXXX:web:XXXXXX"
    };
    try { firebase.initializeApp(firebaseConfig); } catch(_) {}
  }
})();

function ensureLoginModal() {
  // Se já existe no HTML, apenas complementa com o botão Google.
  let modal = document.getElementById("login-modal");
  if (!modal) {
    // Cria modal compatível com seu CSS
    modal = document.createElement("div");
    modal.id = "login-modal";
    modal.innerHTML = `
      <div class="login-backdrop"></div>
      <div class="login-box">
        <button class="login-x" aria-label="Fechar">✕</button>
        <h3>Entrar / Cadastro</h3>
        <p>Acesse sua conta para acompanhar pedidos.</p>
        <div class="divider">ou</div>
        <button class="btn-google" id="btn-google">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Entrar com Google
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    // Garante que exista o botão Google
    const hasBtn = modal.querySelector("#btn-google");
    if (!hasBtn) {
      const box = modal.querySelector(".login-box") || modal;
      const div = document.createElement("div");
      div.innerHTML = `
        <div class="divider">ou</div>
        <button class="btn-google" id="btn-google">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Entrar com Google
        </button>
      `;
      box.appendChild(div);
    }
  }

  // Fechar modal
  const backdrop = modal.querySelector(".login-backdrop");
  const closeBtn = modal.querySelector(".login-x");
  const close = () => modal.classList.remove("show");
  backdrop?.addEventListener("click", close);
  closeBtn?.addEventListener("click", close);

  // Botão Google
  const gBtn = modal.querySelector("#btn-google");
  gBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      // Força seleção de conta se quiser:
      provider.setCustomParameters({ prompt: "select_account" });
      await firebase.auth().signInWithPopup(provider);
      popup("✅ Login realizado!");
      close();
    } catch (err) {
      console.error("Auth error:", err);
      alert("Não foi possível fazer login. Verifique o bloqueio de pop-up e as credenciais do Firebase.");
    }
  });

  return modal;
}

function setupLoginButton() {
  let userBtn = document.querySelector("#user-btn");
  if (!userBtn) {
    userBtn = document.createElement("button");
    userBtn.id = "user-btn";
    userBtn.className = "user-button";
    userBtn.textContent = "Entrar / Cadastro";
    document.querySelector(".header")?.appendChild(userBtn);
  }

  // Abre modal ao clicar
  userBtn.addEventListener("click", () => {
    const modal = ensureLoginModal();
    modal.classList.add("show");
    playClick();
  });

  // Observa estado do usuário
  if (window.firebase?.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const nome = user.displayName || (user.email ? user.email.split("@")[0] : "Usuário");
        userBtn.textContent = `Olá, ${nome} (Sair)`;
        userBtn.onclick = async () => {
          playClick();
          await firebase.auth().signOut();
          popup("Você saiu.");
          // volta a abrir modal no próximo clique
          userBtn.textContent = "Entrar / Cadastro";
          userBtn.onclick = () => {
            const modal = ensureLoginModal();
            modal.classList.add("show");
            playClick();
          };
        };
      } else {
        userBtn.textContent = "Entrar / Cadastro";
        userBtn.onclick = () => {
          const modal = ensureLoginModal();
          modal.classList.add("show");
          playClick();
        };
      }
    });
  }
}

/* =========================================================
   🚀 BOOT FINAL (segundo listener, é tranquilo)
========================================================= */
window.addEventListener("DOMContentLoaded", () => {
  // Reforça binds com as versões corrigidas desta parte
  ensureExtrasModal();
  bindExtrasButtons();
  ensureLoginModal();
  setupLoginButton();

  // Garante badge correta na primeira carga
  updateCartBadge();

  // Ícone do carrinho abre painel (já definido na Parte 1, aqui só reforço)
  document.getElementById("cart-icon")?.addEventListener("click", () => {
    playClick();
    openMiniCart();
  });
});