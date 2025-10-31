/* =========================================================
   🍔 DFL v2.7 — Promoções Expansíveis + UX Refinada
   PARTE 1 — Inicialização, Funções Base e Overlays
   Base v2.6 Estável (mantida 100%)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------ ⚙️ BASE ------------------ */
  const sound = new Audio("click.wav");
  let cart = [];
  let currentUser = null;

  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { console.error(e); } };

  // 🔊 Clique com som suave (não bloqueia o site se falhar)
  document.addEventListener("click", () => {
    try { sound.currentTime = 0; sound.play(); } catch (_) {}
  });

  /* ------------------ 🎯 ELEMENTOS ------------------ */
  const el = {
    cartIcon: document.getElementById("cart-icon"),
    cartCount: document.getElementById("cart-count"),
    miniCart: document.getElementById("mini-cart"),
    miniList: document.querySelector(".mini-list"),
    miniFoot: document.querySelector(".mini-foot"),
    cartBackdrop: document.getElementById("cart-backdrop"),
    extrasModal: document.getElementById("extras-modal"),
    extrasList: document.querySelector("#extras-modal .extras-list"),
    extrasConfirm: document.getElementById("extras-confirm"),
    comboModal: document.getElementById("combo-modal"),
    comboBody: document.getElementById("combo-body"),
    comboConfirm: document.getElementById("combo-confirm"),
    loginModal: document.getElementById("login-modal"),
    loginForm: document.getElementById("login-form"),
    googleBtn: document.getElementById("google-login"),
    slides: document.querySelector(".slides"),
    cPrev: document.querySelector(".c-prev"),
    cNext: document.querySelector(".c-next"),
    userBtn: document.getElementById("user-btn"),
    statusBanner: document.getElementById("status-banner"),
    hoursBanner: document.querySelector(".hours-banner"),
    reportsBtn: document.getElementById("reports-btn"),
    myOrdersBtn: document.getElementById("orders-fab"),

    // 🆕 Novo Modal de Promoções (v2.7)
    promoModal: document.getElementById("promo-modal"),
    promoImg: document.getElementById("promo-image"),
    promoOld: document.getElementById("promo-old"),
    promoNew: document.getElementById("promo-new"),
    promoAddBtn: document.getElementById("promo-add"),
    promoClose: document.querySelector("#promo-modal .close-btn"),
  };

  /* ------------------ 🌫️ BACKDROP ------------------ */
  if (!el.cartBackdrop) {
    const bd = document.createElement("div");
    bd.id = "cart-backdrop";
    document.body.appendChild(bd);
    el.cartBackdrop = bd;
  }

  const Backdrop = {
    show() {
      el.cartBackdrop.classList.add("active");
      document.body.classList.add("no-scroll");
    },
    hide() {
      el.cartBackdrop.classList.remove("active");
      document.body.classList.remove("no-scroll");
    },
  };

  /* ------------------ 🧩 OVERLAYS ------------------ */
  const Overlays = {
    closeAll() {
      document
        .querySelectorAll(".modal.show, #mini-cart.active, .orders-panel.active, #admin-dashboard.show")
        .forEach((e) => e.classList.remove("show", "active"));
      Backdrop.hide();
    },
    open(modalLike) {
      Overlays.closeAll();
      if (!modalLike) return;
      modalLike.classList.add(modalLike.id === "mini-cart" ? "active" : "show");
      Backdrop.show();
    },
  };
  el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

  /* ------------------ 💬 POPUP ------------------ */
  function popupAdd(msg) {
    let pop = document.querySelector(".popup-add");
    if (!pop) {
      pop = document.createElement("div");
      pop.className = "popup-add";
      document.body.appendChild(pop);
    }
    pop.textContent = msg;
    pop.classList.add("show");
    setTimeout(() => pop.classList.remove("show"), 2000);
  }

  // 🧠 Mantém a função acessível globalmente
  window.popupAdd = popupAdd;
/* ------------------ 🛒 MINI-CARRINHO ------------------ */
  function renderMiniCart() {
    if (!el.miniList) return;

    const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
    if (el.cartCount) el.cartCount.textContent = totalItens;

    if (!cart.length) {
      el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
      if (el.miniFoot) el.miniFoot.innerHTML = "";
      return;
    }

    el.miniList.innerHTML = cart.map((item, idx) => `
      <div class="cart-item" style="border-bottom:1px solid #eee;padding:10px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="flex:1;">
            <p style="font-weight:600;margin-bottom:4px;">${item.nome}</p>
            <p style="color:#666;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>
            <button type="button" class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>
            <button type="button" class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  function bindMiniCartButtons() {
    el.miniList.querySelectorAll(".cart-plus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      if (cart[i]) {
        cart[i].qtd++;
        renderMiniCart();
      }
    }));

    el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      if (cart[i]) {
        if (cart[i].qtd > 1) cart[i].qtd--;
        else cart.splice(i, 1);
        renderMiniCart();
      }
    }));

    el.miniList.querySelectorAll(".cart-remove").forEach(b => b.addEventListener("click", e => {
      const i = +e.currentTarget.dataset.idx;
      cart.splice(i, 1);
      renderMiniCart();
      popupAdd("Item removido!");
    }));
  }

  const _renderMiniCartOrig = renderMiniCart;
  renderMiniCart = function () {
    _renderMiniCartOrig();
    bindMiniCartButtons();
  };

  /* ------------------ 🔥 FIREBASE ------------------ */
  const firebaseConfig = {
    apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
    authDomain: "da-familia-lanches.firebaseapp.com",
    projectId: "da-familia-lanches",
    storageBucket: "da-familia-lanches.appspot.com",
    messagingSenderId: "106857147317",
    appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",
  };

  let auth, db;

  try {
    if (!window.firebase) throw new Error("Firebase não carregou corretamente.");
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
  } catch (error) {
    console.error("ERRO FATAL AO INICIAR FIREBASE:", error);
    document.body.innerHTML = `
      <div style="padding:20px;text-align:center;font-size:1.1rem;color:red;">
        <b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.<br>
        <small>Verifique sua internet e recarregue a página.</small>
      </div>`;
    return;
  }

  /* ------------------ ⚙️ LOGIN ------------------ */
  el.userBtn?.addEventListener("click", () => Overlays.open(el.loginModal));
  document.querySelectorAll("#login-modal .login-close").forEach(btn =>
    btn.addEventListener("click", () => Overlays.closeAll())
  );

  el.loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value?.trim();
    if (!email || !senha) return alert("Preencha e-mail e senha.");

    auth.signInWithEmailAndPassword(email, senha)
      .then((cred) => {
        currentUser = cred.user;
        popupAdd("Login realizado com sucesso!");
        Overlays.closeAll();
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          if (confirm("Conta não encontrada. Deseja criar uma nova?")) {
            auth.createUserWithEmailAndPassword(email, senha)
              .then((cred) => {
                currentUser = cred.user;
                popupAdd("Conta criada com sucesso! 🎉");
                Overlays.closeAll();
              })
              .catch((e) => alert("Erro: " + e.message));
          }
        } else if (err.code === "auth/wrong-password") {
          alert("Senha incorreta. Tente novamente.");
        } else {
          alert("Erro: ".concat(err.message));
        }
      });
  });

  el.googleBtn?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((res) => {
        currentUser = res.user;
        popupAdd("Login com Google realizado! ✅");
        Overlays.closeAll();
      })
      .catch((err) => alert("Erro: ".concat(err.message)));
  });
/* ------------------ 🍟 ADICIONAIS ------------------ */
  function openExtrasFor(productName, basePrice) {
    if (!el.extrasList) return;
    el.extrasList.innerHTML = `
      <label class="extra-line">
        <span>+ Bacon crocante (+ R$ 4,00)</span>
        <input type="checkbox" value="4">
      </label>
      <label class="extra-line">
        <span>+ Queijo cheddar (+ R$ 3,00)</span>
        <input type="checkbox" value="3">
      </label>
      <label class="extra-line">
        <span>+ Ovo (+ R$ 2,00)</span>
        <input type="checkbox" value="2">
      </label>
    `;
    el.extrasConfirm.onclick = () => {
      const extras = Array.from(el.extrasList.querySelectorAll("input:checked"))
        .map((i) => Number(i.value));
      const totalExtras = extras.reduce((a, b) => a + b, 0);
      const total = basePrice + totalExtras;
      addToCart(productName + " + extras", total);
      Overlays.closeAll();
      popupAdd("Adicionado com extras!");
    };
    Overlays.open(el.extrasModal);
  }

  /* ------------------ 🍔 COMBOS ------------------ */
  function openComboSelection() {
    if (!el.comboBody) return;
    el.comboBody.innerHTML = `
      <label class="extra-line">
        <span>Combo Família Tradicional (R$ 59,99)</span>
        <input type="radio" name="combo" value="59.99">
      </label>
      <label class="extra-line">
        <span>Combo Família Artesanal (R$ 79,99)</span>
        <input type="radio" name="combo" value="79.99">
      </label>
      <label class="extra-line">
        <span>Combo Casal Trem + Fanta 1L (R$ 34,99)</span>
        <input type="radio" name="combo" value="34.99">
      </label>
      <label class="extra-line">
        <span>Combo Casal Artesanal (R$ 54,99)</span>
        <input type="radio" name="combo" value="54.99">
      </label>
    `;
    el.comboConfirm.onclick = () => {
      const opt = el.comboBody.querySelector("input:checked");
      if (!opt) return alert("Selecione um combo.");
      addToCart("Combo Especial", Number(opt.value));
      Overlays.closeAll();
      popupAdd("Combo adicionado!");
    };
    Overlays.open(el.comboModal);
  }

  /* ------------------ 🛍️ ADICIONAR AO CARRINHO ------------------ */
  function addToCart(nome, preco) {
    const existente = cart.find(i => i.nome === nome);
    if (existente) {
      existente.qtd++;
    } else {
      cart.push({ nome, preco, qtd: 1 });
    }
    renderMiniCart();
    popupAdd("Item adicionado!");
  }

  // Atribui função globalmente
  window.addToCart = addToCart;

  /* ------------------ 🧾 FORM DE ENTREGA / RESUMO ------------------ */
  function enhanceMiniCartUI() {
    if (!el.miniFoot) return;
    const total = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    el.miniFoot.innerHTML = `
      <input type="text" class="cart-input" id="endereco" placeholder="Endereço para entrega">
      <div class="cart-summary">
        <p><span>Subtotal:</span><span>${money(total)}</span></p>
        <p><span>Taxa de Entrega:</span><span>R$ 5,00</span></p>
        <p class="total"><span>Total:</span><span>${money(total + 5)}</span></p>
      </div>
      <button id="finalizar-btn" class="cart-row" style="background:#4caf50;color:#fff;font-weight:700;border:none;border-radius:10px;padding:14px 0;cursor:pointer;margin-top:10px;">Finalizar Pedido</button>
    `;

    const btn = document.getElementById("finalizar-btn");
    btn.addEventListener("click", () => {
      const end = document.getElementById("endereco")?.value.trim();
      if (!end) return alert("Informe seu endereço para entrega.");

      const resumo = cart.map(i => `${i.nome} (${i.qtd}x) - ${money(i.preco * i.qtd)}`).join("%0A");
      const totalFinal = money(cart.reduce((s, i) => s + i.preco * i.qtd, 5));

      const msg = `📦 *Novo Pedido - Da Família Lanches*%0A${resumo}%0A🚗 Endereço: ${end}%0A💰 Total: ${totalFinal}`;
      const url = `https://wa.me/5561984261633?text=${msg}`;
      window.open(url, "_blank");
    });
  }

  // Re-render automático do mini-cart
  const _renderMiniCart = renderMiniCart;
  renderMiniCart = function() {
    _renderMiniCart();
    bindMiniCartButtons();
    enhanceMiniCartUI();
  };
/* ------------------ 🕐 STATUS DE FUNCIONAMENTO ------------------ */
  function atualizarStatus() {
    const agora = new Date();
    const hora = agora.getHours();
    const minuto = agora.getMinutes();

    // Define o horário de funcionamento: 18h às 23h59
    const aberto = (hora >= 18 && hora < 24);

    if (el.statusBanner) {
      el.statusBanner.textContent = aberto ? "Aberto 🍔" : "Fechado 😴";
      el.statusBanner.className = "status-banner " + (aberto ? "open" : "closed");
    }

    if (el.hoursBanner) {
      el.hoursBanner.textContent = aberto
        ? "Estamos atendendo agora! Faça seu pedido 🍟"
        : "Atendimento de 18h às 23h59 ⏰";
    }

    // Atualiza a cada 60 segundos
    setTimeout(atualizarStatus, 60000);
  }

  safe(atualizarStatus)();

  /* ------------------ ⏱️ TIMER PROMOCIONAL ------------------ */
  function atualizarTimer() {
    const tickers = document.querySelectorAll(".countdown-ticker");
    tickers.forEach((el) => {
      const agora = new Date();
      const fim = new Date();
      fim.setHours(23, 59, 59);
      const diff = fim - agora;

      if (diff <= 0) {
        el.textContent = "Encerrando promoções...";
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    });
    setTimeout(atualizarTimer, 1000);
  }

  safe(atualizarTimer)();

  /* ------------------ 📦 MEUS PEDIDOS ------------------ */
  const pedidosPainel = document.querySelector(".orders-panel");
  const pedidosBtn = document.getElementById("orders-fab");
  const pedidosClose = document.querySelector(".orders-close");

  function carregarMeusPedidos() {
    if (!db || !currentUser) return;

    const lista = document.querySelector(".orders-content");
    lista.innerHTML = `<p style="text-align:center;color:#999;">Carregando pedidos...</p>`;

    db.collection("pedidos")
      .where("uid", "==", currentUser.uid)
      .orderBy("data", "desc")
      .limit(10)
      .get()
      .then((snap) => {
        if (snap.empty) {
          lista.innerHTML = `<p style="text-align:center;color:#999;">Nenhum pedido encontrado ainda.</p>`;
          return;
        }

        lista.innerHTML = snap.docs
          .map((doc) => {
            const p = doc.data();
            const total = money(p.total);
            const dataFmt = p.dataPedido || p.data || "—";
            const itens = (p.itens || [])
              .map((i) => `<li>${i.nome} (${i.qtd}x)</li>`)
              .join("");
            return `
              <div class="order-item">
                <h4>Pedido #${doc.id.slice(-5)}</h4>
                <p><b>Total:</b> ${total}</p>
                <p><b>Data:</b> ${dataFmt}</p>
                <ul>${itens}</ul>
              </div>
            `;
          })
          .join("");
      })
      .catch((err) => {
        console.error("Erro ao carregar pedidos:", err);
        lista.innerHTML = `<p style="text-align:center;color:#d32f2f;">Erro ao carregar seus pedidos.</p>`;
      });
  }

  pedidosBtn?.addEventListener("click", () => {
    if (!currentUser) {
      popupAdd("Faça login para ver seus pedidos!");
      return Overlays.open(el.loginModal);
    }
    carregarMeusPedidos();
    Overlays.open(pedidosPainel);
  });

  pedidosClose?.addEventListener("click", () => Overlays.closeAll());
/* ------------------ 🎯 PROMOÇÕES EXPANSÍVEIS ------------------ */
  const promocoes = [
    { nome: "Promo 1", precoAntigo: 40.00, precoNovo: 34.99, img: "promo1.jpg" },
    { nome: "Promo 2", precoAntigo: 45.00, precoNovo: 37.99, img: "promo2.jpg" },
    { nome: "Promo 3", precoAntigo: 52.00, precoNovo: 39.99, img: "promo3.jpg" },
    { nome: "Promo 4", precoAntigo: 52.00, precoNovo: 44.99, img: "promo4.jpg" },
    { nome: "Promo 5", precoAntigo: 65.00, precoNovo: 49.99, img: "promo5.jpg" },
    { nome: "Promo 6", precoAntigo: 65.00, precoNovo: 44.99, img: "promo6.jpg" },
    { nome: "Promo 7", precoAntigo: 77.00, precoNovo: 59.99, img: "promo7.jpg" },
    { nome: "Promo 8", precoAntigo: 72.00, precoNovo: 59.99, img: "promo8.jpg" },
    { nome: "Promo 9", precoAntigo: 79.99, precoNovo: 64.99, img: "promo9.jpg" }
  ];

  let idxPromoAtual = 0;
  let modalPromo = null;

  // Cria o modal das promoções se ainda não existir
  function criarModalPromocao() {
    if (document.getElementById("promo-modal")) return;
    const div = document.createElement("div");
    div.id = "promo-modal";
    div.className = "modal promo-modal";
    div.innerHTML = `
      <div class="promo-content">
        <button id="promo-close" class="promo-close">✖️</button>
        <button id="promo-prev" class="promo-nav prev">⬅️</button>
        <div class="promo-body">
          <img id="promo-img" src="" alt="Promoção" class="promo-img">
          <div class="promo-info">
            <h2 id="promo-nome"></h2>
            <p id="promo-preco">
              <span class="old"></span>
              <span class="new"></span>
            </p>
            <button id="promo-add" class="promo-add">Adicionar ao Carrinho 🛒</button>
          </div>
        </div>
        <button id="promo-next" class="promo-nav next">➡️</button>
      </div>
    `;
    document.body.appendChild(div);
  }

  // Atualiza o conteúdo do modal conforme a promoção
  function renderPromocao() {
    const p = promocoes[idxPromoAtual];
    if (!p) return;

    const nome = document.getElementById("promo-nome");
    const img = document.getElementById("promo-img");
    const precoAntigo = document.querySelector("#promo-preco .old");
    const precoNovo = document.querySelector("#promo-preco .new");

    nome.textContent = p.nome;
    img.src = `./img/promos/${p.img}`;
    precoAntigo.textContent = `R$ ${p.precoAntigo.toFixed(2).replace('.', ',')}`;
    precoNovo.textContent = `R$ ${p.precoNovo.toFixed(2).replace('.', ',')}`;
  }

  // Abre o modal com a promoção clicada
  function abrirPromocao(idx) {
    criarModalPromocao();
    idxPromoAtual = idx;
    renderPromocao();

    const modal = document.getElementById("promo-modal");
    modal.classList.add("show");
    Overlays.closeAll();
    Backdrop.show();

    // Botões dentro do modal
    document.getElementById("promo-close").onclick = () => {
      modal.classList.remove("show");
      Backdrop.hide();
    };

    document.getElementById("promo-prev").onclick = () => {
      idxPromoAtual = (idxPromoAtual - 1 + promocoes.length) % promocoes.length;
      renderPromocao();
    };

    document.getElementById("promo-next").onclick = () => {
      idxPromoAtual = (idxPromoAtual + 1) % promocoes.length;
      renderPromocao();
    };

    document.getElementById("promo-add").onclick = () => {
      const promo = promocoes[idxPromoAtual];
      addToCart(promo.nome, promo.precoNovo);
      popupAdd(`${promo.nome} adicionado!`);
      modal.classList.remove("show");
      Backdrop.hide();
    };
  }

  /* 🔗 Substitui a ação padrão do carrossel */
  document.querySelectorAll(".slide").forEach((slide, i) => {
    slide.addEventListener("click", (e) => {
      e.preventDefault();
      abrirPromocao(i);
    });
  });
/* ------------------ 🍪 BANNER DE COOKIES ------------------ */
  const cookieBanner = document.getElementById("cookie-banner");
  const cookieBtn = document.getElementById("cookie-accept");

  if (cookieBanner && cookieBtn) {
    if (localStorage.getItem("dfl-cookies-ok") === "true") {
      cookieBanner.style.display = "none";
    } else {
      cookieBanner.classList.add("show");
    }

    cookieBtn.addEventListener("click", () => {
      localStorage.setItem("dfl-cookies-ok", "true");
      cookieBanner.classList.remove("show");
      setTimeout(() => (cookieBanner.style.display = "none"), 400);
    });
  }

  /* ------------------ ⚠️ MONITORAMENTO DE ERROS ------------------ */
  window.addEventListener("error", (e) => {
    const msg = String(e.message || "").toLowerCase();
    if (msg.includes("firebase") || msg.includes("split")) {
      popupAdd("⚠️ Erro leve detectado. Atualize a página se persistir.");
    }
    console.warn("⚠️ Erro capturado:", e.message);
  });

  /* ------------------ 🔁 RECUPERAÇÃO DE CACHE ------------------ */
  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) {
      console.log("↻ Página reaberta do cache, recarregando...");
      location.reload();
    }
  });

  /* ------------------ 🧩 FINALIZAÇÃO SEGURA ------------------ */
  console.log(
    "%c🔥 DFL v2.7 — Promos Expansíveis + UX Refinado + Base Estável v2.6",
    "background:#000;color:#ffeb3b;font-weight:700;padding:6px 10px;border-radius:6px;"
  );

}); // 🔚 Fim do DOMContentLoaded principal