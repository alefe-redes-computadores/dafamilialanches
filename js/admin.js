// DFL v3.6.7 — Admin.js (compatível com mobile)

const ADMINS = [
  "alefejohsefe@gmail.com",
  "kalebhstanley650@gmail.com",
  "contato@dafamilialanches.com.br"
];

let chartPedidos = null;
let chartProdutos = null;

// Verifica se o usuário é admin
function isAdmin(user) {
  return user && user.email && ADMINS.includes(user.email.toLowerCase());
}

// Garante que o Chart.js esteja carregado
function ensureChartJS(callback) {
  if (window.Chart) return callback();

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js";
  script.onload = callback;
  document.head.appendChild(script);
}

// Cria o dashboard básico
function createDashboard() {
  if (document.getElementById("admin-dashboard")) {
    document.getElementById("admin-dashboard").classList.add("show");
    return;
  }

  const dash = document.createElement("div");
  dash.id = "admin-dashboard";
  dash.className = "modal show";
  dash.innerHTML = `
    <div class="modal-content admin-box">
      <div class="modal-head">
        <h3>📊 Painel Administrativo</h3>
        <button id="close-dashboard" class="btn-secondary">✖</button>
      </div>
      <div class="admin-body">
        <div class="admin-filtros">
          <label>Período:</label>
          <select id="admin-periodo">
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
        <div class="charts">
          <canvas id="chartPedidos" height="220"></canvas>
          <canvas id="chartProdutos" height="220"></canvas>
        </div>
        <div id="adminResumo" class="admin-resumo"></div>
      </div>
    </div>
  `;
  document.body.appendChild(dash);

  document.getElementById("close-dashboard").addEventListener("click", () => {
    dash.classList.remove("show");
    document.body.classList.remove("no-scroll");
  });

  document.getElementById("admin-periodo").addEventListener("change", (e) => {
    carregarRelatorios(e.target.value);
  });
}

// Carrega relatórios de pedidos
async function carregarRelatorios(periodo = "7") {
  if (typeof db === "undefined" || !isFirebaseInitialized) {
    console.warn("Firestore não inicializado.");
    return;
  }

  const adminResumo = document.getElementById("adminResumo");
  adminResumo.innerHTML = `<p>⏳ Carregando relatórios...</p>`;

  const dias = parseInt(periodo, 10);
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - dias);

  try {
    const snapshot = await db
      .collection("pedidos")
      .where("data", ">=", dataInicio.toISOString())
      .get();

    const pedidos = snapshot.docs.map((d) => d.data());
    gerarResumoECharts(pedidos);
  } catch (e) {
    adminResumo.innerHTML = `<p style="color:red;">Erro ao carregar relatórios.</p>`;
    console.error("Erro Firestore:", e);
  }
}

// Gera resumo e gráficos
function gerarResumoECharts(pedidos) {
  const resumo = document.getElementById("adminResumo");
  if (!pedidos || pedidos.length === 0) {
    resumo.innerHTML = `<p>📭 Nenhum pedido encontrado neste período.</p>`;
    return;
  }

  // Totais
  const totalPedidos = pedidos.length;
  const totalValor = pedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  resumo.innerHTML = `
    <p><b>Total de pedidos:</b> ${totalPedidos}</p>
    <p><b>Faturamento:</b> R$ ${totalValor.toFixed(2).replace(".", ",")}</p>
  `;

  // Gráfico de pedidos por dia
  const dias = {};
  pedidos.forEach((p) => {
    const d = new Date(p.data).toLocaleDateString("pt-BR");
    dias[d] = (dias[d] || 0) + 1;
  });

  const ctx1 = document.getElementById("chartPedidos").getContext("2d");
  if (chartPedidos) chartPedidos.destroy();
  chartPedidos = new Chart(ctx1, {
    type: "line",
    data: {
      labels: Object.keys(dias),
      datasets: [
        {
          label: "Pedidos por Dia",
          data: Object.values(dias),
          borderColor: "#ff9800",
          backgroundColor: "rgba(255,152,0,0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
    },
  });

  // Gráfico de produtos mais pedidos
  const produtos = {};
  pedidos.forEach((p) => {
    if (p.itens && Array.isArray(p.itens)) {
      p.itens.forEach((i) => {
        produtos[i.nome] = (produtos[i.nome] || 0) + i.quantidade;
      });
    }
  });

  const ctx2 = document.getElementById("chartProdutos").getContext("2d");
  if (chartProdutos) chartProdutos.destroy();
  chartProdutos = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: Object.keys(produtos),
      datasets: [
        {
          label: "Top Produtos",
          data: Object.values(produtos),
          backgroundColor: "#4caf50",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// Setup do módulo Admin
function setupAdmin() {
  const reportsBtn = document.getElementById("reports-btn");
  if (reportsBtn && isAdmin(currentUser)) {
    reportsBtn.style.display = "block";
    reportsBtn.addEventListener("click", () => {
      if (typeof inicializarFirebase === "function") inicializarFirebase();
      createDashboard();
      ensureChartJS(() => carregarRelatorios("7"));
      document.body.classList.add("no-scroll");
    });
  }
}

// Inicialização automática
document.addEventListener("DOMContentLoaded", setupAdmin);