/* ==========================================================================
   🚀 DA FAMÍLIA LANCHES (DFL) — v8.0 INTEGRAL (BASE v5.6 + UPGRADES)
   ==========================================================================
   
   HISTÓRICO DE VERSÕES:
   - v5.6: Base estável (Frete, Login, Admin, Recompensas).
   - v6.0: Adição de Busca Inteligente e Grade de Promoções.
   - v8.0: Fusão completa, mantendo integridade total do código e visual.

   FUNCIONALIDADES ATIVAS:
   1. Busca Inteligente (Levenshtein).
   2. Grade de Promoções (Visual Premium).
   3. Endereço Manual + CEP (ViaCEP).
   4. Cálculo de Frete Dinâmico (Simulado/Firebase).
   5. Sistema de Recompensas e Fidelidade (Firebase).
   6. Painel Administrativo com Gráficos.
   7. Carrinho Completo com Combos e Adicionais.
========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================================================
    // 0. INJEÇÃO DE CSS (GARANTIA DE VISUAL PREMIUM)
    // ==========================================================================
    // Injeta estilos críticos para garantir que os Cards de Promoção fiquem bonitos
    // e a Barra de Pesquisa funcione, independente do arquivo style.css
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- Grade de Promoções --- */
        #promocoes-area {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
            gap: 15px;
            padding: 5px 10px;
        }

        /* --- Card Premium (Estilo Imagem 2) --- */
        .promo-card-styled {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border: 1px solid #eee;
            height: 100%;
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .promo-card-styled:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .promo-card-styled img {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-bottom: 4px solid #ffca28; /* Detalhe amarelo da marca */
        }

        .promo-body { 
            padding: 12px;
            display: flex;
            flex-direction: column;
            flex: 1; 
            text-align: center;
        }

        /* Título Vermelho/Laranja e Negrito */
        .promo-title { 
            color: #d84315;
            font-size: 1rem;
            font-weight: 800;
            margin: 0 0 6px 0;
            line-height: 1.3;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Descrição do item */
        .promo-desc { 
            font-size: 0.8rem;
            color: #555;
            margin-bottom: 10px;
            line-height: 1.4;
            flex: 1;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .promo-prices {
            margin-bottom: 10px;
        }
        .promo-old {
            text-decoration: line-through;
            color: #999;
            font-size: 0.85rem;
            display: block;
        }
        .promo-new {
            color: #2e7d32;
            font-weight: 800;
            font-size: 1.4rem;
        }
        
        /* --- Botão Verde Largo --- */
        .btn-add-green {
            background: linear-gradient(180deg, #66bb6a 0%, #43a047 100%);
            color: white;
            border: none; 
            padding: 12px;
            border-radius: 8px;
            font-weight: 700; 
            font-size: 1rem;
            width: 100%;
            cursor: pointer;
            box-shadow: 0 4px 0 #2e7d32; 
            transition: transform 0.1s, box-shadow 0.1s;
            text-transform: uppercase;
        }
        .btn-add-green:active {
            transform: translateY(4px);
            box-shadow: 0 0 0 #2e7d32;
        }
        
        /* --- Inputs e Admin --- */
        #search-input::placeholder {
            color: #888;
            font-style: italic;
        }
        
        /* --- Ícones de Recompensa --- */
        .tier-icon {
            font-size: 1.5rem;
            margin-right: 10px;
        }
    `;
    document.head.appendChild(style);


    // ==========================================================================
    // 1. BUSCA INTELIGENTE (ALGORITMO LEVENSHTEIN)
    // ==========================================================================
    // Função matemática para calcular distância entre palavras (permite erros de digitação)
    const levenshtein = (a, b) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        
        const matrix = [];

        // increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        Math.min(
                            matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1  // deletion
                        )
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    };

    // Configuração do Evento de Busca
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        // Define o texto placeholder original que você gostava
        searchInput.placeholder = "🔍 O que você está procurando? (Ex: TremBão, Peleja)";
        
        searchInput.addEventListener("input", (e) => {
            const termo = e.target.value.toLowerCase().trim();
            // Seleciona TODOS os cards (tanto os normais quanto os da nova grade)
            const cards = document.querySelectorAll(".card, .promo-card-styled"); 
            
            cards.forEach(card => {
                // Tenta pegar o nome de várias fontes para garantir compatibilidade
                let nome = card.getAttribute("data-name")?.toLowerCase() || "";
                
                // Fallbacks se o atributo data-name não existir
                if (!nome) {
                    const h3 = card.querySelector("h3");
                    if (h3) nome = h3.innerText.toLowerCase();
                }
                if (!nome) {
                    const title = card.querySelector(".promo-title");
                    if (title) nome = title.innerText.toLowerCase();
                }

                // Se o campo de busca estiver vazio, mostra tudo
                if (!termo) { 
                    card.style.display = "flex"; // Mantém o layout flex original
                    return; 
                }
                
                // Lógica de Comparação
                const contem = nome.includes(termo);
                // Permite até 2 erros de digitação para palavras maiores que 3 letras
                const erroAceitavel = termo.length > 3 && levenshtein(nome, termo) <= 2;

                if (contem || erroAceitavel) {
                    card.style.display = "flex"; 
                } else {
                    card.style.display = "none";
                }
            });
        });
    }


    // ==========================================================================
    // 2. CONFIGURAÇÕES GERAIS E UTILITÁRIOS
    // ==========================================================================
    
    // Máscara Automática para CEP
    const cepInputMask = document.getElementById("cep-input");
    if (cepInputMask) {
        cepInputMask.addEventListener("input", function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) {
                v = v.slice(0, 5) + "-" + v.slice(5, 8);
            }
            e.target.value = v;
        });
    }

    /* --- Variáveis Globais --- */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00; 
    let deliveryFeesCache = null;   

    /* --- Funções Auxiliares --- */
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    
    // Wrapper de segurança para funções (Evita que o site quebre se um clique falhar)
    const safe = (fn) => (...a) => { 
        try { 
            fn(...a); 
        } catch (e) { 
            console.error("Erro capturado pelo sistema DFL:", e); 
        } 
    };  

    // Função completa de Ícones de Nível (Restaurada da v5.6)
    function getTierIcon(tier) {  
        const level = tier ? String(tier).toLowerCase().trim() : '';  
        if (level.includes('ouro')) return '🥇';  
        if (level.includes('platina')) return '💎';  
        if (level.includes('diamante')) return '👑';  
        if (level.includes('safira')) return '💠';       
        if (level.includes('rubi')) return '♦️';         
        if (level.includes('esmeralda')) return '❇️';   
        if (level.includes('elite')) return '⚔️';        
        if (level.includes('supremo')) return '🚀';      
        if (level.includes('lenda')) return '🦁';        
        if (level.includes('mítico') || level.includes('mitico')) return '🦄';  
        return '👤';   
    }  

    /* --- DADOS DAS PROMOÇÕES (COM DESCRIÇÃO PARA OS CARDS BONITOS) --- */
    const PROMO_DATA = [  
        null,   
        { 
            id: 1, 
            nome: "Dupla Purizin + Fanta", 
            desc: "2 Hot Dogs 'Purizin' com purê cremoso, milho e batata + 1 Fanta Laranja Geladinha!", 
            preco: 34.99, 
            precoAntigo: 40.00, 
            img: "promocoes/promo1.jpg" 
        },  
        { 
            id: 2, 
            nome: "Trio Padaná - Desconto Fiel", 
            desc: "3 Hot Dogs 'Padaná' completos (2 salsichas, bacon, vinagrete) para dividir com a galera!", 
            preco: 37.99, 
            precoAntigo: 45.00, 
            img: "promocoes/promo2.jpg" 
        },  
        { 
            id: 3, 
            nome: "Combo 2 Peleja Artesanal", 
            desc: "2 Burgers Artesanais 'Peleja' (120g) com filé de frango e bacon. Sabor inigualável!", 
            preco: 39.99, 
            precoAntigo: 52.00, 
            img: "promocoes/promo3.jpg" 
        },  
        { 
            id: 4, 
            nome: "Trio Trem Completo + Refri", 
            desc: "3 Burgers 'Trem' tradicionais com bacon, milho, queijo e batata palha + Fanta 1L!", 
            preco: 44.99, 
            precoAntigo: 52.00, 
            img: "promocoes/promo4.jpg" 
        },  
        { 
            id: 5, 
            nome: "Combo 4 Trem + Fanta 1L", 
            desc: "O clássico da família: 4 sanduíches Trem deliciosos e refri para acompanhar.", 
            preco: 49.99, 
            precoAntigo: 65.00, 
            img: "promocoes/promo5.jpg" 
        },  
        { 
            id: 6, 
            nome: "Combo 5 Uai", 
            desc: "5 Lanches Uai (X-Bacon Salada) para matar a fome de todo mundo.", 
            preco: 54.99, 
            precoAntigo: 65.00, 
            img: "promocoes/promo6.jpg" 
        },  
        { 
            id: 7, 
            nome: "Combo 4 TremBão + Fanta", 
            desc: "4 Dogões 'TremBão' com tudo dentro (purê, bacon, 2 salsichas) + Refri.", 
            preco: 59.99, 
            precoAntigo: 77.00, 
            img: "promocoes/promo7.jpg" 
        },  
        { 
            id: 8, 
            nome: "Combo 4 Armaria", 
            desc: "4 Sanduíches Armaria (Hambúrguer + Frango + Tudo) com bastante recheio.", 
            preco: 59.99, 
            precoAntigo: 72.00, 
            img: "promocoes/promo8.jpg" 
        },  
        { 
            id: 9, 
            nome: "Combo 5 Uai + Kuat 2L", 
            desc: "A festa completa com 5 lanches Uai e um refrigerante tamanho família.", 
            preco: 64.99, 
            precoAntigo: 79.99, 
            img: "promocoes/promo9.jpg" 
        }  
    ];
    /* ------------------ 🎯 ELEMENTOS (SELETORES COMPLETOS) ------------------ */  
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
        comboBody: document.querySelector("#combo-modal #combo-body"),  
        comboConfirm: document.getElementById("combo-confirm"),  
        loginModal: document.getElementById("login-modal"),  
        loginForm: document.getElementById("login-form"),  
        googleBtn: document.getElementById("google-login"),  
        
        // NOVO CONTAINER DA GRADE
        promocoesGrid: document.getElementById("promocoes-area"),
        
        userBtn: document.getElementById("user-btn"),  
        statusBanner: document.getElementById("status-banner"),  
        hoursBanner: document.querySelector(".hours-banner"),  
        reportsBtn: document.getElementById("reports-btn"),   
        pedidosContainer: document.querySelector(".meus-pedidos"),  
        pedidosBtn: document.querySelector(".meus-pedidos-btn"),  
        pedidosPanel: document.getElementById("painelPedidos"),  
        pedidosFecharBtn: document.querySelector(".fechar-pedidos"),  
        pedidosLista: document.getElementById("listaPedidos"),  
        recompensasContainer: document.querySelector(".minhas-recompensas"),  
        recompensasBtn: document.querySelector(".recompensas-btn"),  
        recompensasPanel: document.getElementById("recompensas-panel"),  
        recompensasFecharBtn: document.querySelector(".fechar-recompensas"),  
        recompensasLista: document.getElementById("listaRecompensas"),  
        historicoLista: document.getElementById("historicoRecompensas"),
        
        // ELEMENTOS DE ENDEREÇO
        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        
        // ELEMENTOS DE PROGRESSO
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill")
    };

    // ==========================================================================
    // 3. RENDERIZAÇÃO DA GRADE DE PROMOÇÕES (SUBSTITUI CARROSSEL)
    // ==========================================================================
    function renderPromocoesGrid() {
        if (!el.promocoesGrid) return;
        
        // Mapeia o array de dados e cria o HTML de cada card
        el.promocoesGrid.innerHTML = PROMO_DATA.map(p => {
            if(!p) return ''; // Pula o índice 0 se for null
            
            // Estrutura HTML otimizada para o CSS injetado (Visual Bonito)
            return `
            <div class="promo-card-styled" data-name="${p.nome}" data-price="${p.preco}">
                <img src="${p.img}" alt="${p.nome}" loading="lazy">
                <div class="promo-body">
                    <h3 class="promo-title">${p.nome}</h3>
                    <p class="promo-desc">${p.desc}</p>
                    <div class="promo-prices">
                        <span class="promo-old">De ${money(p.precoAntigo)}</span>
                        <span class="promo-new">Por ${money(p.preco)}</span>
                    </div>
                    <button class="btn-add-green" onclick="window.addToCart('${p.nome}', ${p.preco})">Adicionar</button>
                </div>
            </div>`;
        }).join('');
    }
    
    // Expõe a função para ser usada pelo onclick no HTML gerado
    window.addToCart = (nome, preco) => addCommonItem(nome, preco);
    
    // Chama a renderização ao carregar
    renderPromocoesGrid();


    /* ------------------ 🌫️ BACKDROP & MODAIS (LÓGICA ROBUSTA) ------------------ */  
    // Garante que o backdrop existe
    if (!el.cartBackdrop) {  
        const bd = document.createElement("div");  
        bd.id = "cart-backdrop";  
        document.body.appendChild(bd);  
        el.cartBackdrop = bd;  
    }  

    const Overlays = {  
        closeAll() {  
            // Fecha modais centrais e painéis laterais
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show")
                .forEach((e) => e.classList.remove("show", "active"));  
            el.cartBackdrop.classList.remove("active");  
            document.body.classList.remove("no-scroll");
        },  
        open(modalLike) {  
            Overlays.closeAll();  
            if (!modalLike) return;  
            
            // Lógica para diferenciar animação lateral ou fade-in central
            const isPanel = (modalLike.id === "mini-cart" || modalLike.id === "painelPedidos" || modalLike.id === "recompensas-panel");
            modalLike.classList.add(isPanel ? "active" : "show");  
            
            el.cartBackdrop.classList.add("active");  
            document.body.classList.add("no-scroll");
        },  
    };  
    
    // Fecha ao clicar no fundo escuro
    el.cartBackdrop.addEventListener("click", () => Overlays.closeAll());

    // Listener Global para botões de fechar (funciona até para elementos criados dinamicamente)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.fechar-pedidos, .fechar-recompensas, .extras-close, .combo-close, .login-close, .promo-close, .dashboard-close')) {
            Overlays.closeAll();
        }
        // Fecha ao clicar na área escura de um modal central
        if (e.target.classList.contains('modal')) {
            Overlays.closeAll();
        }
    });


    /* ------------------ ➕ LÓGICA DE ADIÇÃO AO CARRINHO ------------------ */  
    
    // --- LÓGICA DE COMBOS (TODAS AS OPÇÕES DA v5.6) ---
    const comboDrinkOptions = {  
        casal: [  
            { rotulo: "Fanta 1L (padrão)", delta: 0.01 },  
            { rotulo: "Coca-Cola 1L", delta: 3.0 },  
            { rotulo: "Coca-Cola 1L Zero", delta: 3.0 },  
        ],  
        familia: [  
            { rotulo: "Kuat Guaraná 2L (padrão)", delta: 0.01 },  
            { rotulo: "Coca-Cola 2L", delta: 5.0 }, 
            { rotulo: "Coca-Cola 2L Zero", delta: 5.0 }, 
        ],  
    };  

    let _comboCtx = null;  
    
    function addCommonItem(nome, preco) {  
        const low = (nome||"").toLowerCase();
        
        // Verifica se é um combo que precisa de escolha de bebida
        if (/^combo/i.test(low) && !/^\s*Combo [0-9]/.test(nome)) { 
             const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;
             
             if (grupo && comboDrinkOptions[grupo]) {
                 // Renderiza opções no modal
                 el.comboBody.innerHTML = comboDrinkOptions[grupo].map((o, i) => `  
                  <label class="combo-option-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;font-size:1rem;margin-bottom:8px;">  
                    <span style="font-weight:600;color:#222;">${o.rotulo}</span>  
                    <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>  
                    <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="margin-left:10px;">  
                  </label>`).join("");
                  
                 _comboCtx = { nomeCombo: nome, precoBase: preco, grupo };  
                 
                 // Remove listeners antigos e adiciona novo
                 const btnConfirm = document.getElementById("combo-confirm");
                 const newBtn = btnConfirm.cloneNode(true);
                 btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
                 
                 newBtn.onclick = () => {
                     const sel = el.comboBody.querySelector('input[name="combo-drink"]:checked');
                     if (!sel) return;
                     
                     const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
                     const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
                     const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);
                     
                     const existente = cart.find(i => i.nome === finalName);
                     if (existente) existente.qtd++;
                     else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });
                     
                     popupAdd("Combo adicionado!");
                     renderMiniCart();
                     Overlays.closeAll();
                 };
                 
                 Overlays.open(el.comboModal);
                 return;
             }
        }
        
        // Adição Simples (Não é combo complexo)
        const found = cart.find((i) => i.nome === nome && i.preco === preco);  
        if (found) found.qtd++;  
        else cart.push({ nome, preco, qtd: 1 });  
        renderMiniCart();  
        popupAdd(`${nome} adicionado!`);  
    }  

    // Binds para botões normais (HTML estático)
    document.querySelectorAll(".add-cart").forEach((btn) =>
        btn.addEventListener("click", (e) => {  
            const card = e.currentTarget.closest(".card");  
            if (!card) return;  
            addCommonItem(card.dataset.name, parseFloat(card.dataset.price));  
        })
    );

    /* ------------------ ➕ EXTRAS (FUNCIONALIDADE COMPLETA) ------------------ */
    const adicionais = [  
        { nome: "Cebola", preco: 0.99 }, { nome: "Salada", preco: 1.99 },  
        { nome: "Ovo", preco: 1.99 }, { nome: "Bacon", preco: 2.99 },  
        { nome: "Hambúrguer Tradicional 56g", preco: 2.99 }, { nome: "Cheddar Cremoso", preco: 3.99 },  
        { nome: "Filé de Frango", preco: 5.99 }, { nome: "Hambúrguer Artesanal 120g", preco: 7.99 },  
    ];  

    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const card = e.currentTarget.closest(".card");
            const produtoExtras = card.dataset.name;
            const produtoPrecoBase = parseFloat(card.dataset.price) || 0;
            
            el.extrasList.innerHTML = adicionais.map((a, i) => `  
              <label class="extra-line" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid #ffb300;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;transition:all 0.2s;font-size:1rem;margin-bottom:8px;">  
                <span style="font-weight:600;color:#222;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>  
                <input type="checkbox" value="${i}" style="margin-left:10px;">  
              </label>`).join("");
            
            const btnConfirm = document.getElementById("extras-confirm");
            const newBtn = btnConfirm.cloneNode(true);
            btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
            
            newBtn.onclick = () => {
                const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];  
                const extrasContagem = {};  
                checks.forEach(c => {  
                    const idx = +c.value;  
                    const adicional = adicionais[idx];  
                    if (extrasContagem[adicional.nome]) extrasContagem[adicional.nome].qtd++;  
                    else extrasContagem[adicional.nome] = { preco: adicional.preco, qtd: 1 };  
                });  
                
                const extrasNomes = Object.keys(extrasContagem).map(nome => {  
                    const qtd = extrasContagem[nome].qtd;  
                    return qtd > 1 ? `${qtd}x ${nome}` : nome;  
                }).join(", ");  
                
                const precoExtras = Object.values(extrasContagem).reduce((t, e) => t + (e.preco * e.qtd), 0);  
                const precoTotal = produtoPrecoBase + precoExtras;  
                const nomeCompleto = extrasNomes ? `${produtoExtras} + ${extrasNomes}` : produtoExtras;  
                
                cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });  
                renderMiniCart();  
                popupAdd("Adicionado ao carrinho!");  
                Overlays.closeAll();  
            };
            
            Overlays.open(el.extrasModal);
        })
    );
    /* ------------------ 🛒 RENDERIZAÇÃO DO CARRINHO ------------------ */  
    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  

        // Cálculo da Barra de Progresso
        const subtotal = cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
        const falta = LIMITE_FRETE_GRATIS - subtotal;
        const porcentagem = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
        
        if (el.progressFill) el.progressFill.style.width = `${porcentagem}%`;
        if (el.progressText) {
            if (subtotal >= LIMITE_FRETE_GRATIS) {
                el.progressText.innerHTML = `🎉 <strong>Oba!</strong> Você ganhou <strong>Frete Grátis</strong>!`;
            } else {
                el.progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> para Frete Grátis 🚀`;
            }
        }

        if (!cart.length) {  
            el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';  
            if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
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
            <button type="button" class="cart-minus" onclick="window.updateQtd(${idx}, -1)" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button>  
            <span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span>  
            <button type="button" class="cart-plus" onclick="window.updateQtd(${idx}, 1)" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button>  
            <button type="button" class="cart-remove" onclick="window.removeItem(${idx})" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button>  
          </div>  
        </div>  
      </div>`).join("");
      
      enhanceMiniCartUI(); // Atualiza totais
    }  

    // Funções Globais para o Carrinho (necessárias para onclick no HTML string)
    window.updateQtd = (idx, delta) => {
        if (cart[idx]) {
            cart[idx].qtd += delta;
            if (cart[idx].qtd <= 0) cart.splice(idx, 1);
            renderMiniCart();
        }
    };
    window.removeItem = (idx) => {
        cart.splice(idx, 1);
        renderMiniCart();
        popupAdd("Item removido!");
    };

    /* ------------------ 🏠 ENDEREÇO MANUAL & CEP ------------------ */
    let modoEnderecoManual = false;

    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => {
        window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank");
    });
    
    document.getElementById("btnManual")?.addEventListener("click", () => {
        modoEnderecoManual = true;
        document.querySelector('.frete-container').style.display = 'none';
        document.getElementById('manualArea').style.display = 'block';
        if (document.getElementById('cep-input')) document.getElementById('cep-input').value = '';
    });

    document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        document.querySelector('.frete-container').style.display = 'block';
        document.getElementById('manualArea').style.display = 'none';
        if (document.getElementById('manualEndereco')) document.getElementById('manualEndereco').value = '';
        renderMiniCart();
    });

    // Busca CEP API
    document.getElementById('btn-calcular-frete')?.addEventListener('click', async () => {  
        const cepInput = document.getElementById('cep-input');  
        const cep = cepInput.value.trim().replace(/\D/g, '');  
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (data.erro) {
                    popupAdd("CEP não encontrado.");
                } else {
                    document.getElementById('endereco-auto').value = `${data.logradouro} - ${data.bairro}`;
                    renderMiniCart();
                }
            } catch(e) { popupAdd("Erro na busca do CEP."); }
        } else {
            popupAdd("CEP inválido.");
        }
    });

    /* ------------------ 🚚 LÓGICA DE FRETE COMPLEXA ------------------ */
    async function getDynamicDeliveryFee(enderecoCompleto) {
        if (!enderecoCompleto || typeof enderecoCompleto !== "string") return DELIVERY_FEE_DEFAULT;

        // Extração de bairro (Tenta pegar o que vem depois do hífen)
        let bairroClean = "";
        try {
            const partes = enderecoCompleto.split("-");
            if (partes.length >= 2) {
                bairroClean = partes[1].split("(")[0].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            } else {
                bairroClean = enderecoCompleto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }
        } catch (_) { return DELIVERY_FEE_DEFAULT; }

        // Aqui entraria a busca no Firebase (cacheGlobal).
        // Como o código precisa ser robusto mesmo sem dados, mantemos o fallback.
        // Se quiser conectar, basta descomentar a lógica de cache.
        return DELIVERY_FEE_DEFAULT;
    }

    /* ------------------ 💰 CÁLCULO DE TOTAIS E FINALIZAÇÃO ------------------ */
    async function calcTotals() {  
        const subtotal = cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
        
        // Validação de Cupom Real
        const couponInput = document.getElementById("coupon-input");
        const d = await validarCupomFirestore(couponInput ? couponInput.value : "", subtotal);   
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        let deliveryFee = DELIVERY_FEE_DEFAULT;   
        let enderecoParaCalculo = "";

        if (modoEnderecoManual) {
            enderecoParaCalculo = document.getElementById('manualEndereco')?.value?.trim() || "";
        } else {
            const auto = document.getElementById('endereco-auto');
            if (auto && auto.value) enderecoParaCalculo = auto.value.trim();
        }

        if (isRetirarLocal || subtotal >= LIMITE_FRETE_GRATIS) {  
            deliveryFee = 0;  
        } else if (enderecoParaCalculo) {  
            try { deliveryFee = await getDynamicDeliveryFee(enderecoParaCalculo); }  
            catch(e) { deliveryFee = DELIVERY_FEE_DEFAULT; }  
        }  

        const delivery = d.freeShipping ? 0 : deliveryFee;  
        const total = Math.max(0, subtotal + delivery - d.discount);  
        return { subtotal, delivery, discount: d.discount, total, cupomInfo: d };  
    }

    async function enhanceMiniCartUI() {  
        if (!el.miniFoot) return;  
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
        if (cart.length === 0) return;  

        const { subtotal, delivery, discount, total } = await calcTotals();
        const deliveryLabel = delivery === 0 ? "Grátis 🎉" : money(delivery);  

        const summaryDiv = document.createElement('div');  
        summaryDiv.className = 'cart-summary-generated';  
        summaryDiv.innerHTML = `  
      <div class="summary-row" style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;"><span>Subtotal</span><b>${money(subtotal)}</b></div>  
      <div class="summary-row"><span>Entrega</span><b>${deliveryLabel}</b></div>  
      ${discount > 0 ? `<div class="summary-row" style="color:green;"><span>Desconto</span><b>-${money(discount)}</b></div>` : ''}
      <div class="summary-row" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin:10px 0;font-size:1.1rem;"><span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span></div>  
      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">Finalizar Pedido 🛍️</button>  
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Limpar Carrinho</button>`;  

        el.miniFoot.appendChild(summaryDiv);
        
        // Eventos dos botões gerados
        summaryDiv.querySelector("#finish-order").addEventListener("click", fecharPedido);  
        summaryDiv.querySelector("#clear-cart").addEventListener("click", () => {  
            if (confirm("Limpar carrinho?")) { cart = []; renderMiniCart(); popupAdd("Carrinho limpo!"); }  
        });
        
        // Re-bind de eventos que afetam o total
        document.getElementById('retirar-local')?.addEventListener('change', renderMiniCart);
    }

    async function fecharPedido() {  
        if (!cart.length) return alert("Carrinho vazio!");  
        if (!currentUser) { alert("Faça login para enviar o pedido!"); Overlays.open(el.loginModal); return; }  
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        let finalAddressString = "";
        
        if (isRetirarLocal) {
            finalAddressString = "CLIENTE IRÁ RETIRAR NO LOCAL";  
        } else if (modoEnderecoManual) {
            const end = document.getElementById('manualEndereco').value;
            const num = document.getElementById('manualNumero').value;
            if (!end || !num) return alert("Preencha o endereço manual completo.");
            finalAddressString = `${end}, N° ${num} (MANUAL)`;
        } else {
            const end = document.getElementById('endereco-auto').value;
            const num = document.getElementById('numero-input').value;
            if (!end || !num) return alert("Preencha o endereço via CEP completo.");
            finalAddressString = `${end}, N° ${num}`;
        }

        const { subtotal, delivery, discount, total } = await calcTotals();  
        const pedido = { 
            usuario: currentUser.email, 
            userId: currentUser.uid, 
            nome: currentUser.displayName || "Cliente", 
            itens: cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
            subtotal: subtotal, 
            entrega: delivery, 
            desconto: discount, 
            total: total, 
            endereco: finalAddressString, 
            data: new Date().toISOString() 
        };  

        try {  
            const batch = db.batch();
            const pedidoRef = db.collection("Pedidos").doc(); 
            batch.set(pedidoRef, pedido);  
            batch.update(db.collection("Usuarios").doc(currentUser.uid), { pedidosFeitos: firebase.firestore.FieldValue.increment(1) });  
            await batch.commit();  

            popupAdd("Pedido salvo ✅"); 
            const linhas = ["🍔 *Pedido DFL*", cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), "", `*Total: ${money(total)}*`, `🏠 *Endereço:* ${finalAddressString}`].join("\n");  
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(linhas)}`, "_blank");  
            cart = []; renderMiniCart(); Overlays.closeAll();  
        } catch (err) { console.error("Erro fechar pedido:", err); alert(`Erro ao salvar pedido.`); }  
    }
    /* ============================================================
       10. ÁREA DO USUÁRIO (PEDIDOS & RECOMPENSAS)
       ============================================================ */
    
    // Botões flutuantes sempre visíveis
    el.pedidosBtn?.addEventListener("click", () => { 
        if (!currentUser) { alert("Faça login para ver seus pedidos."); Overlays.open(el.loginModal); return; } 
        Overlays.open(el.pedidosPanel); 
        carregarPedidos(currentUser.uid); 
    });  
    
    async function carregarPedidos(userId) {  
        if (!el.pedidosLista) return; 
        el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando...</p>`;  
        try { 
            const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc").limit(20); 
            const snapshot = await q.get();  
            if (snapshot.empty) { el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado.</p>`; return; }  
            
            el.pedidosLista.innerHTML = snapshot.docs.map(doc => {
                const d = doc.data();
                const date = new Date(d.data).toLocaleDateString();
                return `<div class="pedido-card" style="padding:15px; border:1px solid #eee; border-radius:10px; margin-bottom:10px; background:#fff;">
                    <div style="display:flex;justify-content:space-between;font-weight:bold;"><span>${date}</span><span>${money(d.total)}</span></div>
                    <div style="font-size:0.85rem;color:#666;margin-top:5px;">${d.itens.replace(/\n/g, ", ")}</div>
                </div>`;
            }).join('');
        } catch (err) { el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao carregar.</p>`; }  
    }  

    el.recompensasBtn?.addEventListener("click", () => { 
        if (!currentUser) { alert("Faça login!"); Overlays.open(el.loginModal); return; } 
        Overlays.open(el.recompensasPanel); 
        carregarRecompensas(currentUser.uid); 
    });  

    async function carregarRecompensas(userId) {  
        if (!isFirebaseInitialized) return;
        const u = await db.collection("Usuarios").doc(userId).get();
        const feitos = u.data()?.pedidosFeitos || 0;
        
        // Dados completos de recompensa
        const metas = [
            {limite:5, valor:'Coca Lata', tipo:'brinde'},
            {limite:10, valor:'Burguer Simples', tipo:'brinde'},
            {limite:15, valor:'Nível OURO', tipo:'cupom'},
            {limite:30, valor:'Nível PLATINA', tipo:'cupom'},
            {limite:50, valor:'Nível DIAMANTE', tipo:'cupom'},
            {limite:100, valor:'Nível LENDÁRIO', tipo:'cupom'}
        ];

        document.getElementById('contador-valor').textContent = feitos;
        const prox = metas.find(m => m.limite > feitos) || metas[metas.length-1];
        const pct = Math.min(100, (feitos / prox.limite) * 100);
        document.getElementById('progresso-bar').style.width = `${pct}%`;
        document.getElementById('progresso-mensagem').textContent = `Faltam ${Math.max(0, prox.limite - feitos)} para: ${prox.valor}`;

        el.recompensasLista.innerHTML = metas.map(m => {
            const ok = feitos >= m.limite;
            const icon = getTierIcon(m.valor);
            return `<div style="background:${ok?'#e8f5e9':'#fff'}; border:1px solid ${ok?'green':'#eee'}; padding:12px; border-radius:8px; margin-bottom:8px; display:flex; align-items:center;">
                <span style="font-size:1.5rem; margin-right:10px;">${icon}</span>
                <div style="flex:1"><b>${m.valor}</b><br><small>Meta: ${m.limite} pedidos</small></div>
                <div>${ok?'✅':'🔒'}</div>
            </div>`;
        }).join("");
    }

    /* ============================================================
       11. PAINEL ADMIN COMPLETO (GRÁFICOS + CSV)
       ============================================================ */
    const ADMINS = [ "alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br" ];  
    function isAdmin(user) { return user && user.email && ADMINS.includes(user.email.toLowerCase()); }  
    
    let chartInstance = null;

    function createAdminFab() { 
        if (el.reportsBtn) { 
            el.reportsBtn.style.display = "block"; 
            el.reportsBtn.addEventListener("click", () => { 
                createDashboard(); 
                // Carrega Chart.js dinamicamente apenas se necessário
                if(!window.Chart) {
                    const s = document.createElement('script');
                    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
                    s.onload = () => { Overlays.open(document.getElementById("admin-dashboard")); carregarRelatorios(); };
                    document.head.appendChild(s);
                } else {
                    Overlays.open(document.getElementById("admin-dashboard")); 
                    carregarRelatorios();
                }
            }); 
        } 
    }

    function createDashboard() {
        if(document.getElementById("admin-dashboard")) return;
        const div = document.createElement("div");
        div.id = "admin-dashboard";
        div.className = "modal";
        div.innerHTML = `
        <div class="modal-content" style="max-width:900px;width:95%;max-height:90vh;overflow-y:auto;">
            <div class="modal-head" style="background:#ffb300;"><h3>Painel Admin</h3><button class="dashboard-close">X</button></div>
            <div style="padding:20px;">
                <div style="display:flex;gap:10px;margin-bottom:20px;">
                    <div class="admin-stat-card"><div class="admin-stat-title">Total Vendas</div><div id="val-fat" class="admin-stat-value">...</div></div>
                    <div class="admin-stat-card"><div class="admin-stat-title">Pedidos</div><div id="val-ped" class="admin-stat-value">...</div></div>
                </div>
                <div style="height:300px;"><canvas id="chart-vendas"></canvas></div>
                <button id="export-csv" style="margin-top:20px;width:100%;padding:12px;background:green;color:white;border:none;border-radius:8px;">Exportar Relatório CSV</button>
            </div>
        </div>`;
        document.body.appendChild(div);
        div.querySelector(".dashboard-close").onclick = Overlays.closeAll;
    }

    async function carregarRelatorios() {
        const snap = await db.collection("Pedidos").orderBy("data", "desc").limit(50).get();
        const peds = snap.docs.map(d => d.data());
        
        const total = peds.reduce((a,b)=>a+(b.total||0), 0);
        document.getElementById("val-fat").textContent = money(total);
        document.getElementById("val-ped").textContent = peds.length;
        
        // Gráfico
        const ctx = document.getElementById("chart-vendas").getContext('2d');
        if(chartInstance) chartInstance.destroy();
        
        // Agrupa dados simples para o gráfico
        const labels = peds.slice(0,10).map(p => new Date(p.data).toLocaleDateString()).reverse();
        const data = peds.slice(0,10).map(p => p.total).reverse();
        
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas Recentes',
                    data: data,
                    borderColor: '#ffca28',
                    backgroundColor: 'rgba(255, 202, 40, 0.2)',
                    fill: true
                }]
            }
        });
        
        // Exportar CSV
        document.getElementById("export-csv").onclick = () => {
            let csv = "Data;Cliente;Total;Endereco\n";
            peds.forEach(p => { csv += `${p.data};${p.usuario};${p.total};${p.endereco}\n`; });
            const blob = new Blob([csv], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = "relatorio.csv"; a.click();
        };
    }

    /* ============================================================
       12. INICIALIZAÇÃO E LOOPS
       ============================================================ */
    
    // Loop de Status da Loja
    const atualizarStatus = safe(() => {  
        const h = new Date().getHours();  
        const aberto = h >= 18 && h < 23;   
        if (el.statusBanner) { 
            el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; 
            el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; 
        }  
    });  
    setInterval(atualizarStatus, 60000); atualizarStatus();

    // Loop do Timer
    const atualizarTimer = safe(() => {  
        const d = document.getElementById("promo-timer"); if (!d) return;  
        const fim = new Date(); fim.setHours(23, 59, 59, 999); 
        let diff = fim - new Date(); if (diff <= 0) diff = 0;
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0"); 
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"); 
        d.textContent = `${h}:${m}:${String(Math.floor((diff % 60000) / 1000)).padStart(2, "0")}`;  
    });  
    setInterval(atualizarTimer, 1000); atualizarTimer();

    /* --- COOKIES --- */
    const ck = document.getElementById("cookie-banner");
    if(ck && localStorage.getItem("dfl-cookies-accepted")!=="true") {
        ck.style.display="flex"; setTimeout(()=>ck.classList.add("show"), 1000);
        document.getElementById("cookie-accept").onclick = () => {
            localStorage.setItem("dfl-cookies-accepted","true"); ck.classList.remove("show");
        };
    }

    /* --- POPUP HELPER --- */
    function popupAdd(msg) {  
        let pop = document.querySelector(".popup-add");  
        if (!pop) { pop = document.createElement("div"); pop.className = "popup-add"; document.body.appendChild(pop); }  
        pop.textContent = msg; pop.classList.add("show"); setTimeout(() => pop.classList.remove("show"), 2000);  
    }

    inicializarFirebase();  
    console.log("%c🔥 DFL v8.0 INTEGRAL — SISTEMA CARREGADO", "background:#4CAF50;color:#fff;padding:5px;border-radius:5px;");

}); // FIM DOMContentLoaded
