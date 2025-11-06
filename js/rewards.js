// DFL v3.6.7 — Rewards.js (compatível com mobile)

let recompensasPanel = document.getElementById("recompensas-panel");
let recompensasBtn = document.querySelector(".recompensas-btn");
let recompensasFecharBtn = document.querySelector(".fechar-recompensas");
let recompensasLista = document.getElementById("listaRecompensas");
let historicoLista = document.getElementById("historicoRecompensas");
let contadorValor = document.getElementById("contador-valor");
let progressoBar = document.getElementById("progresso-bar");
let progressoMsg = document.getElementById("progresso-mensagem");

// Configurações padrão (caso o Firestore não retorne)
let configuracoesRecompensa = {
  metaPedidos: 5,
  cupomPremio: "FAMILIA5",
  premioValor: "R$ 10,00"
};

// Carrega configurações globais das recompensas
async function carregarConfiguracoesDeRecompensas() {
  if (typeof db === "undefined" || !isFirebaseInitialized) return configuracoesRecompensa;

  try {
    const docRef = await db.collection("configuracoes").doc("recompensas").get();
    if (docRef.exists) {
      configuracoesRecompensa = docRef.data();
    }
  } catch (e) {
    console.warn("Falha ao carregar config de recompensas:", e);
  }

  return configuracoesRecompensa;
}

// Carrega recompensas específicas do usuário
async function carregarRecompensas(userId) {
  if (!userId || typeof db === "undefined") return;

  recompensasLista.innerHTML = `<p>⏳ Carregando recompensas...</p>`;

  try {
    const docUser = await db.collection("usuarios").doc(userId).get();
    let pedidosFeitos = 0;
    let cupomStatus = null;

    if (docUser.exists) {
      const data = docUser.data();
      pedidosFeitos = data.pedidosFeitos || 0;
      cupomStatus = data.cupomPremio || null;
    }

    const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();
    exibirRecompensas(pedidosFeitos, RECOMPENSAS_DATA.metaPedidos, cupomStatus, RECOMPENSAS_DATA);
    carregarHistoricoRecompensas(userId);

  } catch (e) {
    recompensasLista.innerHTML = `<p style="color:red;">Erro ao carregar recompensas.</p>`;
    console.error("Erro em carregarRecompensas:", e);
  }
}

// Exibe recompensas e progresso
function exibirRecompensas(pedidosFeitos, meta, cupomStatus, cfg) {
  if (!contadorValor) return;

  contadorValor.textContent = pedidosFeitos;
  const progresso = Math.min((pedidosFeitos / meta) * 100, 100);
  progressoBar.style.width = `${progresso}%`;
  progressoBar.style.background = progresso >= 100 ? "#4caf50" : "#ff7043";

  if (pedidosFeitos >= meta && !cupomStatus) {
    recompensasLista.innerHTML = `
      <div class="recompensa-disp">
        <p>🏆 Parabéns! Você completou ${meta} pedidos!</p>
        <button id="btnResgatar" class="btn-primary">Resgatar ${cfg.premioValor}</button>
      </div>
    `;
    progressoMsg.textContent = "Meta concluída! Resgate seu prêmio 🎁";
    document.getElementById("btnResgatar")?.addEventListener("click", async () => {
      try {
        const uid = currentUser?.uid;
        if (!uid) return alert("Faça login para resgatar.");
        await db.collection("usuarios").doc(uid).update({
          cupomPremio: cfg.cupomPremio,
          dataResgate: new Date().toISOString(),
        });
        mostrarPopupRecompensa(`Cupom ${cfg.cupomPremio} adicionado!`);
        carregarRecompensas(uid);
      } catch (e) {
        alert("Erro ao resgatar recompensa.");
        console.error(e);
      }
    });
  } else if (cupomStatus) {
    recompensasLista.innerHTML = `
      <div class="recompensa-ok">
        <p>🎉 Você já resgatou sua recompensa!</p>
        <p><b>Cupom:</b> ${cupomStatus}</p>
      </div>
    `;
    progressoMsg.textContent = "Cupom já resgatado. Aproveite!";
  } else {
    recompensasLista.innerHTML = `<p>🛍 Continue pedindo! Falta pouco para sua próxima recompensa.</p>`;
    const faltam = Math.max(meta - pedidosFeitos, 0);
    progressoMsg.textContent = `Faltam ${faltam} pedidos para o próximo prêmio.`;
  }
}

// Carrega histórico do usuário
async function carregarHistoricoRecompensas(userId) {
  if (!userId || typeof db === "undefined") return;

  try {
    const snapshot = await db.collection("usuarios").doc(userId).collection("recompensas").get();

    if (snapshot.empty) {
      historicoLista.innerHTML = `<p class="empty-rewards">Você ainda não recebeu recompensas.</p>`;
      return;
    }

    let html = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      html += `
        <div class="historico-item">
          <p><b>${data.titulo}</b><br><small>${data.data || "Sem data"}</small></p>
        </div>
      `;
    });
    historicoLista.innerHTML = html;
  } catch (e) {
    console.warn("Erro ao carregar histórico:", e);
  }
}

// Mostra popup visual
function mostrarPopupRecompensa(msg = "🎁 Recompensa adicionada!") {
  const popup = document.createElement("div");
  popup.className = "toast-recompensa";
  popup.textContent = msg;
  Object.assign(popup.style, {
    position: "fixed",
    left: "50%",
    bottom: "30px",
    transform: "translateX(-50%)",
    background: "#43a047",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    zIndex: 9999,
    fontWeight: "600",
    boxShadow: "0 2px 6px rgba(0,0,0,.2)"
  });
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2500);
}

// Inicializa os eventos
function setupRewards() {
  if (!recompensasBtn) return;

  recompensasBtn.addEventListener("click", () => {
    if (!currentUser) {
      alert("Faça login para ver suas recompensas.");
      Overlays?.open?.(document.getElementById("login-modal"));
      return;
    }

    if (typeof inicializarFirebase === "function") inicializarFirebase();
    recompensasPanel.classList.add("active");
    document.body.classList.add("no-scroll");
    carregarRecompensas(currentUser.uid);
  });

  recompensasFecharBtn?.addEventListener("click", () => {
    recompensasPanel.classList.remove("active");
    document.body.classList.remove("no-scroll");
  });
}

// Inicialização automática
document.addEventListener("DOMContentLoaded", setupRewards);