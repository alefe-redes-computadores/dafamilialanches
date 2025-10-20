/* ==================================================
   DFL v1.3.7 – Script principal
   Mantém visual atual + corrige: som, login (modal), extras
   ================================================== */

/* ------------ Firebase ------------ */
const firebaseConfig = {
  apiKey: "AIzaSyF-XXXXXX",
  authDomain: "dafamilia-lanches.firebaseapp.com",
  projectId: "dafamilia-lanches",
  storageBucket: "dafamilia-lanches.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "1:XXXXXX:web:XXXXXX"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

/* ------------ Estado global ------------ */
const clickSound = new Audio("click.wav"); // <= você pediu .wav
clickSound.volume = 0.35;

let cart = JSON.parse(localStorage.getItem("cart") || "[]");
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ------------ Util ------------ */
function updateCartCount() {
  const el = $("#cart-count");
  if (el) el.textContent = cart.length;
}
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function toast(msg) {
  const div = document.createElement("div");
  div.className = "popup-add";
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1500);
}

/* ------------ Carrinho: adicionar ------------ */
function wireAddToCart() {
  $$(".add-cart").forEach(btn => {
    btn.onclick = e => {
      const card = e.currentTarget.closest(".card");
      if (!card) return;

      const item = {
        id: card.dataset.id,
        name: card.dataset.name,
        price: parseFloat(card.dataset.price),
        quantidade: 1
      };

      cart.push(item);
      saveCart();

      try { clickSound.currentTime = 0; clickSound.play(); } catch {}
      toast(`🍔 ${item.name} adicionado!`);
    };
  });
}

/* ------------ Adicionais (igual fluxo anterior) ------------ */
function wireExtrasModal() {
  // cria container 1x só
  if (!$("#extras-modal")) {
    const m = document.createElement("div");
    m.id = "extras-modal";
    document.body.appendChild(m);
  }

  $$(".extras-btn").forEach(btn => {
    btn.onclick = () => {
      $("#extras-modal").innerHTML = `
        <div class="extras-head">
          <span>Escolha seus adicionais</span>
          <button onclick="document.getElementById('extras-modal').classList.remove('show')">✕</button>
        </div>
        <div class="extras-list">
          <label><span>Bacon</span><input type="checkbox" data-extra="Bacon" data-price="3"></label>
          <label><span>Cheddar</span><input type="checkbox" data-extra="Cheddar" data-price="2"></label>
          <label><span>Ovo</span><input type="checkbox" data-extra="Ovo" data-price="1.5"></label>
        </div>
        <div class="extras-foot">
          <button id="extras-add" class="btn-primario">Adicionar</button>
        </div>
      `;
      $("#extras-modal").classList.add("show");

      $("#extras-add").onclick = () => {
        const checks = $$("#extras-modal input:checked");
        if (!checks.length) return $("#extras-modal").classList.remove("show");

        let total = 0;
        const nomes = [];
        checks.forEach(c => { total += parseFloat(c.dataset.price); nomes.push(c.dataset.extra); });

        cart.push({
          id: "extra-" + Date.now(),
          name: "Adicionais: " + nomes.join(", "),
          price: total,
          quantidade: 1
        });
        saveCart();
        $("#extras-modal").classList.remove("show");
        toast("➕ Adicionais adicionados!");
      };
    };
  });
}

/* ------------ “Fechar pedido” (seu painel atual) ------------ */
function wireCloseOrder() {
  document.addEventListener("click", (e) => {
    if (e.target && e.target.matches(".close-cart")) {
      $("#cart-panel")?.classList.remove("active");
    }
  });
}

/* ------------ Contador promoção (00:00:00) ------------ */
function startPromoCountdown() {
  const el = $("#timer");
  if (!el) return;
  function tick() {
    const now = new Date();
    const end = new Date(); end.setHours(23,59,59,999);
    const diff = end - now;
    if (diff <= 0) { el.textContent = "00:00:00"; return; }
    const h = Math.floor(diff/3_600_000);
    const m = Math.floor((diff % 3_600_000)/60_000);
    const s = Math.floor((diff % 60_000)/1000);
    el.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ------------ Status “Aberto até …” ------------ */
function updateOpenStatus() {
  const el = $("#status-banner");
  if (!el) return;

  const now = new Date();
  const d = now.getDay(); // 0 dom, 1 seg...
  // Seg–Qui 18:00–23:15 | Sex–Dom 17:30–23:30 | Ter fechado
  const ranges = {
    2: null, // terça: fechado
    defaultWeek: { start: [18,0], end: [23,15] },   // seg(1), qua(3), qui(4)
    weekend: { start: [17,30], end: [23,30] }       // sex(5) a dom(0)
  };

  let openRange = null;
  if (d === 2) openRange = null;
  else if (d === 5 || d === 6 || d === 0) openRange = ranges.weekend;
  else openRange = ranges.defaultWeek;

  if (!openRange) {
    el.textContent = "Fechado hoje";
    el.style.background = "#444";
    el.style.color = "#fff";
    return;
  }

  const start = new Date(); start.setHours(openRange.start[0], openRange.start[1], 0, 0);
  const end   = new Date(); end.setHours(openRange.end[0],   openRange.end[1],   0, 0);

  if (now >= start && now <= end) {
    el.textContent = `Aberto até ${openRange.end[0]}h${String(openRange.end[1]).padStart(2,"0")}`;
    el.style.background = "#ffd34d";
    el.style.color = "#111";
  } else if (now < start) {
    el.textContent = `Abre às ${openRange.start[0]}h${String(openRange.start[1]).padStart(2,"0")}`;
    el.style.background = "#ffd34d";
    el.style.color = "#111";
  } else {
    el.textContent = "Fechado";
    el.style.background = "#444";
    el.style.color = "#fff";
  }
}

/* ------------ Carrossel (setas + clique imagem) ------------ */
function wireCarousel() {
  const wrapper = $("#promoCarousel .slides") || $(".slides");
  const prev = $(".c-prev");
  const next = $(".c-next");
  if (!wrapper) return;

  const step = 260;
  if (prev) prev.onclick = () => wrapper.scrollBy({ left: -step, behavior: "smooth" });
  if (next) next.onclick = () => wrapper.scrollBy({ left:  step, behavior: "smooth" });

  // clique na imagem -> se tiver data-wa, abre WhatsApp
  $$(".slide").forEach(img => {
    img.onclick = () => {
      const msg = img.dataset.wa;
      if (!msg) return;
      const url = `https://wa.me/5534997178336?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    };
  });
}

/* ------------ Login (modal interno, sem quebrar extras) ------------ */
function ensureLoginModalDOM() {
  if ($("#login-modal")) return;

  const html = `
    <div class="login-backdrop" data-close="1"></div>
    <div class="login-box">
      <button class="login-x" data-close="1">✕</button>
      <h3>Entrar / Cadastro</h3>
      <p>Use seu e-mail ou entre com Google</p>
      <div class="login-form">
        <input type="email" id="loginEmail" placeholder="E-mail" autocomplete="email" />
        <input type="password" id="loginPass" placeholder="Senha" autocomplete="current-password" />
        <button id="btnLoginEmail" class="btn-primario">Entrar</button>
      </div>
      <div class="divider">ou</div>
      <button id="btnGoogle" class="btn-google"><img src="google-icon.svg" alt=""> Entrar com Google</button>
    </div>
  `;
  const wrap = document.createElement("div");
  wrap.id = "login-modal";
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  wrap.addEventListener("click", (e) => {
    if (e.target.dataset.close === "1") wrap.classList.remove("show");
  });

  $("#btnGoogle").onclick = () => {
    const prov = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(prov)
      .then(() => wrap.classList.remove("show"))
      .catch(err => alert("Erro ao logar: " + err.message));
  };
  $("#btnLoginEmail").onclick = () => {
    const email = $("#loginEmail").value.trim();
    const pass = $("#loginPass").value;
    if (!email || !pass) return alert("Informe e-mail e senha.");
    auth.signInWithEmailAndPassword(email, pass)
      .then(() => wrap.classList.remove("show"))
      .catch(err => {
        if (err.code === "auth/user-not-found") {
          firebase.auth().createUserWithEmailAndPassword(email, pass)
            .then(() => alert("Conta criada! Você já está logado."))
            .catch(e => alert("Erro: " + e.message));
        } else {
          alert("Erro: " + err.message);
        }
      });
  };
}

function buildAuthUI() {
  const header = $(".header");
  let btn = $("#user-btn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "user-btn";
    btn.className = "user-button";
    header.appendChild(btn);
  }
  // diminui sem mudar seu tema (CSS final abaixo pode refinar)
  btn.style.fontSize = "14px";
  btn.style.padding = "8px 12px";
  btn.style.borderRadius = "999px";

  auth.onAuthStateChanged(user => {
    if (user) {
      btn.textContent = `Olá, ${user.displayName || user.email.split("@")[0]} (Sair)`;
      btn.onclick = () => auth.signOut();
    } else {
      btn.textContent = "Entrar / Cadastro";
      btn.onclick = () => { ensureLoginModalDOM(); $("#login-modal").classList.add("show"); };
    }
  });
}

/* ------------ Boot ------------ */
window.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  wireAddToCart();
  wireExtrasModal();
  wireCloseOrder();
  startPromoCountdown();
  updateOpenStatus();
  wireCarousel();
  buildAuthUI();
});