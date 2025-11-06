// Local: /js/admin.js

import { el, money, safe, db, isFirebaseInitialized, Overlays } from './core.js';

// Variáveis e Constantes de Admin
const ADMINS = ["alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br"];
let chartPedidos = null;
let chartProdutos = null;

export const isAdmin = (user) => user && user.email && ADMINS.includes(user.email.toLowerCase());

function ensureChartJS(cb) {
    // ... (Lógica do ensureChartJS)
}

function createDashboard() {
    // ... (Lógica do createDashboard)
}

function carregarRelatorios(periodo = "7") {
    // ... (Lógica do carregarRelatorios)
}

function gerarResumoECharts(pedidos) {
    // ... (Lógica do gerarResumoECharts)
}

// ------------------ Setup do Módulo ------------------
export function setupAdmin() {
    // Função chamada pelo setupAuthListener (no core) quando um admin loga
    if (el.reportsBtn && isAdmin(currentUser)) {
        el.reportsBtn.style.display = "block";
        el.reportsBtn.addEventListener("click", () => {
            if (!isFirebaseInitialized) inicializarFirebase(); // Garante o Firebase
            createDashboard();
            ensureChartJS(() => carregarRelatorios("7"));
            Overlays.open(document.getElementById("admin-dashboard"));
        });
    }
}
