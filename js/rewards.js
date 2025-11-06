// Local: /js/rewards.js

import { el, money, safe, Overlays, db, currentUser, isFirebaseInitialized, configuracoesRecompensa, renderMiniCart, couponApplied } from './core.js';


// ------------------ Funções do Módulo Recompensas ------------------

// [Carregamento de Metas]
export async function carregarConfiguracoesDeRecompensas() {
    // ... (Lógica completa do carregarConfiguracoesDeRecompensas)
}

// [Exibição]
export async function carregarRecompensas(userId) {
    // ... (Lógica completa do carregarRecompensas)
}

function exibirRecompensas(pedidosFeitos, recompensasDisponiveis, cupomStatus, RECOMPENSAS_DATA) {
    // ... (Lógica completa do exibirRecompensas)
}

async function carregarHistoricoRecompensas(userId) {
    // ... (Lógica completa do carregarHistoricoRecompensas)
}

export function mostrarPopupRecompensa(msg) {
    // ... (Lógica completa do mostrarPopupRecompensa)
}

// ------------------ Setup do Módulo ------------------
export function setupRewards() {
    // Bindings de Abertura/Fechamento
    el.recompensasBtn?.addEventListener("click", () => {
        if (!currentUser) {
            alert("Faça login para ver suas recompensas.");
            Overlays.open(el.loginModal); 
            return;
        }
        // Garante o Firebase se for o primeiro acesso
        inicializarFirebase(); 
        Overlays.open(el.recompensasPanel);
        carregarRecompensas(currentUser.uid); 
    });
    
    el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());
}
