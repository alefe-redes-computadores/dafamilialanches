// Local: /js/cart.js

import { el, money, safe, Overlays, cart, couponApplied, addressValue, db, auth, isFirebaseInitialized, currentUser, inicializarFirebase, configuracoesRecompensa } from './core.js';
import { mostrarPopupRecompensa, carregarConfiguracoesDeRecompensas } from './rewards.js';


// ------------------ Funções do Módulo Carrinho ------------------

// [Adicionar item comum e Extras]
const adicionais = [
    { nome: "Cebola", preco: 0.99 },
    { nome: "Salada", preco: 1.99 },
    { nome: "Ovo", preco: 1.99 },
    { nome: "Bacon", preco: 2.99 },
    { nome: "Hambúrguer Tradicional 56g", preco: 2.99 },
    { nome: "Cheddar Cremoso", preco: 3.99 },
    { nome: "Filé de Frango", preco: 5.99 },
    { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },
];
let produtoExtras = null;
let produtoPrecoBase = 0;

export function openExtrasFor(card) {
    // ... (Lógica do openExtrasFor)
}
// ... (Lógica do ExtrasConfirm) ...

// [Combos]
const comboDrinkOptions = {
    casal: [
        { rotulo: "Fanta 1L (padrão)", delta: 0.01 },
        { rotulo: "Coca-Cola 1L", delta: 3.0 },
        { rotulo: "Coca-Cola 1L Zero", delta: 3.0 },
    ],
    familia: [
        { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 },
        { rotulo: "Coca-Cola 2L", delta: 5.0 },
    ],
};
let _comboCtx = null;
export function openComboModal(nomeCombo, precoBase) {
    // ... (Lógica do openComboModal)
}
// ... (Lógica do ComboConfirm) ...

export function addCommonItem(nome, preco) {
    // ... (Lógica do addCommonItem)
}


// [Renderização e Botões do Carrinho]
export function renderMiniCart() {
    // ... (Lógica do renderMiniCart e bindMiniCartButtons)
}


// [Lógica de Cupons e Totais]
const DELIVERY_FEE = 6.00;
const _cupomCache = {};

export async function validarCupomFirestore(codigo, subtotal) {
    // ... (Lógica completa do validarCupomFirestore, checando se isFirebaseInitialized é true)
}

export async function calcTotals() {
    // ... (Lógica completa do calcTotals)
}

export async function enhanceMiniCartUI() {
    // ... (Lógica completa do enhanceMiniCartUI)
}


// [Checkout]
export async function fecharPedido() {
    // ... (Lógica completa do fecharPedido, incluindo lógica de recompensa)
}

// ------------------ Setup do Módulo ------------------
export function setupCart() {
    // Bindings de Adicionais e Combos
    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
    );
    // ... (Adicionar outros bindings do carrinho e modais)

    // Chama o renderMiniCart uma vez no início (para carregar o rodapé inicial)
    renderMiniCart();
}
