// Local: /js/rewards.js

import { el, Overlays, inicializarFirebase } from './core.js';

// NOVO: Funções de Recompensas (carregarRecompensas, exibirRecompensas, etc.)
export function setupRewards() {
    
    // 1. Lógica de abrir/fechar o novo painel
    el.recompensasBtn?.addEventListener("click", () => {
        // Requer login, assim como "Meus Pedidos"
        // ... (Lógica de checagem de login) ...
        
        inicializarFirebase(); // Garante o Firebase se for o primeiro acesso
        Overlays.open(el.recompensasPanel);
        
        // carregarRecompensas(currentUser.uid); // Dependente do Firebase
    });

    // 2. Lógica de fechar o painel
    el.recompensasFecharBtn?.addEventListener("click", () => Overlays.closeAll());

}

// ... (Outras Funções de Recompensa, como carregarRecompensas, exibirRecompensas, carregarHistoricoRecompensas)
