/* =========================================================  
   🚀 DFL v9.2 — SISTEMA UI BLINDADO + PIX ESTÁTICO
   - UIManager universal para controle de painéis
   - Anti-spam de cliques múltiplos
   - Atalhos do menu lateral funcionando perfeitamente
   - Todas funções originais preservadas
   - Novo: Modal PIX Estático integrado
========================================================= */  

document.addEventListener("DOMContentLoaded", () => {
    /* =========================================================
       🛡️ NOVO SISTEMA UIManager v9.1 — Blindagem de Painéis
       ========================================================= */
    let ui_lock = false;
    
    function lockUI(ms = 350) {
        ui_lock = true;
        setTimeout(() => ui_lock = false, ms);
    }

    const UIManager = {
        currentPanel: null,
        
        open(panelName, panelElement) {
            if (ui_lock) return;
            lockUI();
            
            if (panelElement) {
                this.currentPanel = panelName;
                
                if (panelElement.id === "mini-cart" || panelElement.id === "painelPedidos" || panelElement.id === "recompensas-panel" || panelElement.id === "pix-modal") {
                    panelElement.classList.add("active");
                } else {
                    panelElement.classList.add("show");
                }
                
                if (panelElement.id !== "side-menu") {
                    Backdrop.show();
                }
                
                // Fecha o menu lateral se estiver aberto
                this.closeSideMenu();
            }
        },
        
        close(panelName, panelElement) {
            if (panelElement) {
                panelElement.classList.remove("show", "active");
            }
            
            if (this.currentPanel === panelName) {
                this.currentPanel = null;
            }
        },
        
        closeAll() {
            document.querySelectorAll(".modal.show, #mini-cart.active, .pedidos-panel.active, .recompensas-panel.active, #admin-dashboard.show, #pix-modal.active").forEach(el => {
                el.classList.remove("show", "active");
            });
            
            this.closeSideMenu();
            Backdrop.hide();
            this.currentPanel = null;
        },
        
        closeSideMenu() {
            const sideMenu = document.getElementById("side-menu");
            const menuOverlay = document.getElementById("menu-overlay");
            
            if (sideMenu) sideMenu.classList.remove("active");
            if (menuOverlay) menuOverlay.classList.remove("active");
            document.body.style.overflow = "";
        },
        
        isOpen(panelName) {
            return this.currentPanel === panelName;
        },
        
        // Função especial para atalhos do menu lateral
        handleMenuAction(actionCallback) {
            if (ui_lock) return;
            lockUI(200);
            
            // Fecha o menu primeiro
            this.closeSideMenu();
            
            // Executa a ação após um pequeno delay para fluidez
            setTimeout(() => {
                if (typeof actionCallback === 'function') {
                    actionCallback();
                }
            }, 150);
        }
    };

    // ============================================================
    // 🍔 MENU HAMBÚRGUER - SISTEMA ATUALIZADO v9.1
    // ============================================================
    const hamburgerBtn = document.getElementById("hamburger-btn");
    const sideMenu = document.getElementById("side-menu");
    const menuOverlay = document.getElementById("menu-overlay");
    const menuClose = document.getElementById("menu-close");

    // Funções para abrir/fechar menu
    function openSideMenu() {
        if (ui_lock) return;
        lockUI();
        
        UIManager.closeAll();
        sideMenu.classList.add("active");
        menuOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeSideMenu() {
        UIManager.closeSideMenu();
    }

    // Event Listeners do Menu Hambúrguer
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", openSideMenu);
    }

    if (menuClose) {
        menuClose.addEventListener("click", closeSideMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener("click", closeSideMenu);
    }

    // ============================================================
    // 🎯 ATALHOS DO MENU LATERAL - SISTEMA BLINDADO
    // ============================================================
    
    // Atalho: Meus Pedidos
    document.querySelectorAll('.menu-link-action[onclick*="meus-pedidos-btn"]').forEach(link => {
        link.onclick = null; // Remove o onclick antigo
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UIManager.handleMenuAction(() => {
                const pedidosBtn = document.querySelector('.meus-pedidos-btn');
                if (pedidosBtn) pedidosBtn.click();
            });
        });
    });

    // Atalho: Minhas Recompensas
    document.querySelectorAll('.menu-link-action[onclick*="recompensas-btn"]').forEach(link => {
        link.onclick = null;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UIManager.handleMenuAction(() => {
                const recompensasBtn = document.querySelector('.recompensas-btn');
                if (recompensasBtn) recompensasBtn.click();
            });
        });
    });

    // Atalho: Meu Perfil / Entrar
    document.querySelectorAll('.menu-link-action[onclick*="user-btn"]').forEach(link => {
        link.onclick = null;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UIManager.handleMenuAction(() => {
                const userBtn = document.getElementById('user-btn');
                if (userBtn) userBtn.click();
            });
        });
    });

    // Atalho: Relatórios de Vendas (admin)
    document.querySelectorAll('.menu-link-action.admin-btn').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UIManager.handleMenuAction(() => {
                const reportsBtn = document.getElementById('reports-btn');
                if (reportsBtn) reportsBtn.click();
            });
        });
    });

    // Navegação por seções do cardápio (scroll suave)
    document.querySelectorAll('.menu-link[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            UIManager.handleMenuAction(() => {
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Scroll suave
                    targetSection.scrollIntoView({ 
                        behavior: "smooth",
                        block: "start"
                    });
                    
                    // Animação de destaque
                    targetSection.classList.add("highlight-section");
                    setTimeout(() => {
                        targetSection.classList.remove("highlight-section");
                    }, 1000);
                }
            });
        });
    });

    // Links sociais (WhatsApp, Instagram) - não precisam de JS especial
    document.querySelectorAll('.menu-link-social').forEach(link => {
        link.addEventListener('click', () => {
            UIManager.closeSideMenu();
        });
    });

    // ============================================================
    // 💰 NOVO: SISTEMA PIX ESTÁTICO v9.2 - CORRIGIDO!
    // ============================================================
    const pixModal = document.getElementById("pix-modal");
    const pixValor = document.getElementById("pix-valor");
    // ✅ CORREÇÃO: Remove pixCopiaCola, pois não existe esse ID no HTML fornecido, evitando erro.
    // const pixCopiaCola = document.getElementById("pix-copia-cola"); 
    // Usamos o pixKey para chave e deixamos a informação no HTML
    const pixBtnCopy = document.getElementById("btn-copy-pix"); 
    const pixBtnWhatsapp = document.getElementById("btn-finish-pix"); 
    const pixClose = document.querySelector(".pix-close");

    // Chave PIX estática
    const CHAVE_PIX = "34997178336";
    const INFO_PIX = "34997178336 (Stone) - Da Família / Kalebh";

    // Função para abrir modal PIX
    async function abrirModalPIX() {
        try {
            // Calcula o total usando a função existente
            const { total } = await calcTotals();
            
            // Preenche os dados no modal
            if (pixValor) pixValor.textContent = money(total);
            // ✅ CORREÇÃO: Removido preenchimento de pixCopiaCola, pois o texto da chave está direto no HTML via ID pix-key.
            
            // Abre o modal
            UIManager.open("pix", pixModal);
        } catch (error) {
            console.error("Erro ao abrir modal PIX:", error);
            // Fallback: continua com fluxo normal se der erro
            fecharPedidoOriginal();
        }
    }

    // Botão Copiar Código PIX
    if (pixBtnCopy) {
        pixBtnCopy.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(CHAVE_PIX);
                
                // Feedback visual
                const originalText = pixBtnCopy.textContent;
                pixBtnCopy.textContent = "Copiado! ✓";
                pixBtnCopy.style.background = "#4CAF50";
                
                setTimeout(() => {
                    pixBtnCopy.textContent = originalText;
                    pixBtnCopy.style.background = "";
                }, 2000);
                
            } catch (err) {
                // Fallback para navegadores mais antigos
                const textArea = document.createElement("textarea");
                textArea.value = CHAVE_PIX;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                
                const originalText = pixBtnCopy.textContent;
                pixBtnCopy.textContent = "Copiado! ✓";
                setTimeout(() => {
                    pixBtnCopy.textContent = originalText;
                }, 2000);
            }
        });
    }

    // Botão Enviar Comprovante WhatsApp
    if (pixBtnWhatsapp) {
        pixBtnWhatsapp.addEventListener("click", async () => {
            const { total } = await calcTotals();
            const mensagem = `💳 *COMPROVANTE PIX - Da Família Lanches*\n\n` +
                           `📦 *Pedido:* R$ ${Number(total).toFixed(2).replace(".", ",")}\n` +
                           `🏷️ *Chave PIX:* ${CHAVE_PIX}\n` +
                           `👤 *Beneficiário:* Da Família / Kalebh\n` +
                           `🏦 *Banco:* Stone\n\n` +
                           `📎 *Anexe o comprovante do pagamento*\n` +
                           `⏰ Pedido será liberado após confirmação do pagamento`;
            
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(mensagem)}`, "_blank");
        });
    }

    // Fechar Modal PIX
    if (pixClose) {
        pixClose.addEventListener("click", (e) => {
            e.preventDefault();
            UIManager.closeAll();
            // Continua fluxo normal após fechar
            setTimeout(() => fecharPedidoOriginal(), 300);
        });
    }

    // Fechar modal clicando fora
    if (pixModal) {
        pixModal.addEventListener("click", (e) => {
            if (e.target === pixModal) {
                UIManager.closeAll();
                // Continua fluxo normal após fechar
                setTimeout(() => fecharPedidoOriginal(), 300);
            }
        });
    }

    // ✅ CORREÇÃO 1 CRÍTICA: Renomeada a função original de fecharPedido para fecharPedidoOriginal
    // para que a nova window.fecharPedido possa ser a wrapper.

    // A função fecharPedidoOriginal é declarada mais abaixo no script.js.
    // Para garantir que ela esteja disponível para ser chamada na nova fecharPedido (linha 183),
    // a mantivemos inalterada (como você solicitou) e apenas a nova função é a que sobrescreve
    // o método global para iniciar o fluxo PIX.

    // ✅ CORREÇÃO 3 CRÍTICA: Nova função fecharPedido (o que é chamado pelo botão dinâmico)
    // para iniciar o fluxo PIX. A original agora é fecharPedidoOriginal (linha 1157).
    window.fecharPedido = async function() {
        if (!cart.length) return alert("Carrinho vazio!");
        if (!currentUser) { 
            alert("Faça login para enviar o pedido!"); 
            UIManager.open("login", el.loginModal); 
            return; 
        }
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;
        let finalAddressString = "";
        
        if (modoEnderecoManual) {
            const manualEndereco = document.getElementById('manualEndereco');
            const manualNumero = document.getElementById('manualNumero');
            const endereco = manualEndereco?.value?.trim() || '';
            const numero = manualNumero?.value?.trim() || '';
            
            if (endereco && numero) {
                finalAddressString = `${endereco}, N° ${numero} (MANUAL)`;
            }
        } else {
            const cepInput = document.getElementById('cep-input');
            const autoRuaBairro = document.getElementById("endereco-auto");
            const autoNumero = document.getElementById("numero-input");
            const autoComp = document.getElementById("complemento-input");
            
            const ruaBairroValue = autoRuaBairro ? autoRuaBairro.value.trim() : '';
            const numeroValue = autoNumero ? autoNumero.value.trim() : '';
            const compValue = autoComp ? autoComp.value.trim() : '';
            const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';
            
            if (ruaBairroValue && numeroValue) {
                finalAddressString = `${ruaBairroValue}, N° ${numeroValue}`;
                if (compValue) finalAddressString += `, Comp: ${compValue}`;
                if (cepValue.length === 8) finalAddressString += ` | CEP: ${cepValue}`;
            }
        }
        
        if (isRetirarLocal) finalAddressString = "CLIENTE IRÁ RETIRAR NO LOCAL";
        else if (!finalAddressString) { 
            alert("Preencha o endereço completo (via CEP ou manualmente), ou marque 'Retirar no Local'."); 
            return; 
        }

        // Validações passaram, agora abre modal PIX
        abrirModalPIX();
    };

    // ============================================================
    // 1. MÁSCARA DE CEP (MANTIDO ORIGINAL)
    // ============================================================
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

    /* ------------------ ⚙️ CONFIGURAÇÕES BASE ------------------ */  
    const sound = new Audio("click.wav");   
    let cart = [];  
    let currentUser = null;  
    let isFirebaseInitialized = false;   

    const DELIVERY_FEE_DEFAULT = 6.00;
    const LIMITE_FRETE_GRATIS = 80.00;
    let deliveryFeesCache = null;   

    // Formatador de Moeda
    const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;  
    
    // Função Segura (evita crash se der erro em listener)
    const safe = (fn) => (...a) => { 
        try { 
            fn(...a); 
        } catch (e) { 
            console.error(e); 
        } 
    };  

    // Ícones de Nível (Recompensas)
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

    /* ============================================================
       🔥 DADOS DAS PROMOÇÕES (REORDENADOS v7.6)
    ============================================================ */
    const PROMO_DATA = [  
        null,   
        { 
            id: 1, 
            nome: "2 UAI + 1 COCA 600ml (Especial 4 Anos)", 
            preco: 29.99, 
            precoAntigo: 35.00, 
            img: "promocoes/promo10.png", 
            descricao: "2 Burgers 'Uai' completinhos (com aquele molho verde!) + 1 Coca-Cola 600ml geladinha!" 
        },
        { 
            id: 2, 
            nome: "5 Uai + 1 Kuat 2L (Brinde)", 
            preco: 64.99, 
            precoAntigo: 75.00, 
            img: "promocoes/promo9.jpg", 
            descricao: "Compre 5 Burgers Uai e leve 1 Kuat 2L por nossa conta! 🎁" 
        },
        { 
            id: 3, 
            nome: "4 Armaria", 
            preco: 59.99, 
            precoAntigo: 72.00, 
            img: "promocoes/promo8.jpg", 
            descricao: "A queridinha da galera! 4 Armaria no super desconto." 
        },
        { 
            id: 4, 
            nome: "5 Burgers Uai", 
            preco: 54.00, 
            precoAntigo: 65.00, 
            img: "promocoes/promo6.jpg", 
            descricao: "Pra família toda! 5 Burgers UAI recheados no precinho!" 
        },
        { 
            id: 5, 
            nome: "4 Trem + 1 Fanta 1L", 
            preco: 49.99, 
            precoAntigo: 65.00, 
            img: "promocoes/promo5.jpg", 
            descricao: "O clássico da família! 4 Burgers Trem + Fanta 1L." 
        },  
        { 
            id: 6, 
            nome: "3 Trem + 1 Fanta 1L", 
            preco: 44.99, 
            precoAntigo: 51.00, 
            img: "promocoes/promo4.jpg", 
            descricao: "3 Burgers Trem com bacon, queijo e batata palha + 1 Fanta 1L." 
        },
        { 
            id: 7, 
            nome: "4 TremBão + 1 Fanta 1L", 
            preco: 59.99, 
            precoAntigo: 77.00, 
            img: "promocoes/promo7.jpg", 
            descricao: "O maior hot dog da casa! 4 TremBão com purê cremoso + Fanta 1L." 
        },
        { 
            id: 8, 
            nome: "2 Burgers Peleja", 
            preco: 39.99, 
            precoAntigo: 52.00, 
            img: "promocoes/promo3.jpg", 
            descricao: "Bora artesanar o bolso! Dois Burgers artesanais 'Peleja' no precinho!" 
        },
        { 
            id: 9, 
            nome: "3 Hot Dog Padaná", 
            preco: 37.99, 
            precoAntigo: 45.00, 
            img: "promocoes/promo2.jpg", 
            descricao: "3 Padaná completos, perfeitos pra dividir com a galera!" 
        },
        { 
            id: 10, 
            nome: "2 Purizin + 1 Fanta 1L", 
            preco: 34.99, 
            precoAntigo: 40.00, 
            img: "promocoes/promo1.jpg", 
            descricao: "2 Hot Dogs 'Purizin' com purê cremoso + 1 Fanta 1L geladinha!" 
        }
    ];
    /* ============================================================
       🎨 FUNÇÃO: RENDERIZAR PROMOÇÕES
    ============================================================ */
    function renderPromoCards() {
        const container = document.getElementById('promocoes-grid');
        if (!container) return;

        const html = PROMO_DATA.slice(1).map(promo => `
            <div class="card promo-card" data-promo-id="${promo.id}">
                <img src="${promo.img}" alt="${promo.nome}" loading="lazy">
                <h3>
                    ${promo.nome} 
                    <span class="badge economia"><span class="badge-icon">💸</span> Economia de ${money(promo.precoAntigo - promo.preco)}</span>
                </h3>
                <p class="price">De ${money(promo.precoAntigo)} por <b>${money(promo.preco)}</b></p>
                <p>${promo.descricao}</p>
                <div class="actions">
                    <button class="add-cart add-promo" data-promo-id="${promo.id}" type="button">Adicionar</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;

        container.querySelectorAll('.add-promo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const promoId = parseInt(e.currentTarget.dataset.promoId);
                const promo = PROMO_DATA[promoId];
                if (promo) {
                    addCommonItem(promo.nome, promo.preco);
                }
            });
        });
    }

    /* ============================================================
       🔍 BUSCA INTELIGENTE (COM ALIASES)
    ============================================================ */
    const searchInput = document.getElementById('search-input');
    
    const PRODUTOS_BUSCA = [
        { nome: "Bão", aliases: ["bao", "bon"] },
        { nome: "Uai", aliases: ["uai", "way"] },
        { nome: "Trem", aliases: ["trem", "tren"] },
        { nome: "Cadim", aliases: ["cadim", "kadim"] },
        { nome: "Armaria", aliases: ["armaria", "armário", "armario"] },
        { nome: "Bitela", aliases: ["bitela", "vitela"] },
        { nome: "Apruma", aliases: ["apruma", "apuma"] },
        { nome: "Peleja", aliases: ["peleja"] },
        { nome: "Tudibom", aliases: ["tudibom", "tudo bom", "tudobom"] },
        { nome: "Custoso", aliases: ["custoso"] },
        { nome: "Nigucim", aliases: ["nigucim", "ningucim"] },
        { nome: "Simprão", aliases: ["simprao", "simprão", "simples"] },
        { nome: "Nimin", aliases: ["nimin", "ninin"] },
        { nome: "Padaná", aliases: ["padana", "padaná"] },
        { nome: "Purizin", aliases: ["purizin", "purezin", "pure"] },
        { nome: "Trembão", aliases: ["trembao", "trembão", "trembaum"] }
    ];

    function normalizar(texto) {
        return texto.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function distanciaLevenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    function filtrarCards(query) {
        if (!query || query.length < 2) {
            document.querySelectorAll('.card').forEach(c => c.style.display = '');
            return;
        }

        const queryNorm = normalizar(query);
        
        document.querySelectorAll('.card').forEach(card => {
            const nome = card.dataset.name || card.querySelector('h3')?.textContent || '';
            const nomeNorm = normalizar(nome);

            let match = false;
            
            if (nomeNorm.includes(queryNorm)) {
                match = true;
            } else {
                for (const produto of PRODUTOS_BUSCA) {
                    const dist = distanciaLevenshtein(queryNorm, normalizar(produto.nome));
                    if (dist <= 2 && nomeNorm.includes(normalizar(produto.nome))) {
                        match = true;
                        break;
                    }
                    for (const alias of produto.aliases) {
                        if (normalizar(alias).includes(queryNorm) || queryNorm.includes(normalizar(alias))) {
                            if (nomeNorm.includes(normalizar(produto.nome))) {
                                match = true;
                                break;
                            }
                        }
                    }
                    if (match) break;
                }
            }
            card.style.display = match ? '' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filtrarCards(e.target.value);
        });
    }
    /* ============================================================
       🎯 MAPEAMENTO DE ELEMENTOS DO DOM
    ============================================================ */
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

        btnNaoSeiCEP: document.getElementById("btnNaoSeiCEP"),
        manualArea: document.getElementById("manualArea"),
        manualEndereco: document.getElementById("manualEndereco"),
        manualNumero: document.getElementById("manualNumero"),
        btnConfirmarEndereco: document.getElementById("btnConfirmarEndereco"),
        btnVoltarCEP: document.getElementById("btnVoltarCEP"),
        
        progressWrapper: document.getElementById("progressWrapper"),
        progressText: document.getElementById("progressText"),
        progressFill: document.getElementById("progressFill"),
        
        promoModal: document.getElementById("promo-modal"),
        promoImg: document.getElementById("promo-modal-img"),
        promoTitle: document.getElementById("promo-modal-title"),
        promoPrice: document.getElementById("promo-modal-price"),
        promoAddBtn: document.getElementById("promo-modal-add"),
        promoNavPrev: document.querySelector("#promo-modal .promo-nav.prev"),
        promoNavNext: document.querySelector("#promo-modal .promo-nav.next"),
        promoClose: document.querySelector("#promo-modal .promo-close"),
        
        cPrev: document.querySelector(".c-prev"),
        cNext: document.querySelector(".c-next"),
        slides: document.querySelector(".slides")
    };

    /* ------------------ 🌫️ BACKDROP & OVERLAYS (ATUALIZADO) ------------------ */  
    // ✅ CORREÇÃO 2: A verificação do backdrop é mantida, mas no index.html o div duplicado foi removido. 
    // O código abaixo garante que o backdrop dinâmico funcione se não houver um.
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

    // ✅ CORREÇÃO: Backdrop fecha tudo ao clicar
    el.cartBackdrop.addEventListener("click", () => UIManager.closeAll());

    // ✅ CORREÇÃO: Fechar modais clicando FORA do .modal-content
    const setupModalClickOutside = () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UIManager.closeAll();
                }
            });
        });
    };

    // ✅ CORREÇÃO: Fechar modais pelo botão X
    const setupCloseButtons = () => {
        document.querySelectorAll('.extras-close, .combo-close, .login-close, .fechar-pedidos, .fechar-recompensas, .dashboard-close, .promo-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                UIManager.closeAll();
            });
        });
    };

    // Inicializa listeners de fechamento
    setupModalClickOutside();
    setupCloseButtons();
    /* ------------------ 🎟️ CUPONS ------------------ */  
    const couponForm = document.getElementById("coupon-form");  
    let couponApplied = (localStorage.getItem("dflCoupon") || "").toUpperCase();  

    couponForm?.addEventListener("submit", (e) => {  
        e.preventDefault(); 
        const input = document.getElementById("coupon-input"); 
        const val = (input?.value || "").trim().toUpperCase();  
        if (!val) { 
            couponApplied = ""; 
            localStorage.removeItem("dflCoupon"); 
            popupAdd("Cupom removido."); 
            renderMiniCart(); 
            return; 
        }  
        couponApplied = val; 
        localStorage.setItem("dflCoupon", couponApplied); 
        renderMiniCart();   
    });

    /* ------------------ 💬 POPUPS & TOASTS ------------------ */  
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

    function mostrarPopupRecompensa(msg) {  
        let pop = document.getElementById("conquista-popup"); 
        if (!pop) { 
            pop = document.createElement("div"); 
            pop.id = "conquista-popup"; 
            pop.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%) scale(0);background:#4CAF50;color:white;padding:15px 25px;border-radius:12px;font-weight:bold;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:10001;opacity:0;transition:transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275),opacity 0.4s;`; 
            document.body.appendChild(pop); 
        }  
        pop.textContent = msg; 
        pop.style.opacity = '1'; 
        pop.style.transform = 'translateX(-50%) scale(1)'; 
        setTimeout(() => { 
            pop.style.transform = 'translateX(-50%) scale(0)'; 
            pop.style.opacity = '0'; 
        }, 6000);  
    }

    /* ------------------ 📊 BARRA DE PROGRESSO (FRETE GRÁTIS) ------------------ */
    function atualizarBarraProgresso() {
        const subtotal = getCartSubtotal();
        const progressText = document.getElementById("progressText");
        const progressFill = document.getElementById("progressFill");
        const progressWrapper = document.getElementById("progressWrapper");
        
        if (!progressText || !progressFill || !progressWrapper) return;

        const falta = LIMITE_FRETE_GRATIS - subtotal;
        const porcentagem = Math.min(100, (subtotal / LIMITE_FRETE_GRATIS) * 100);
        
        progressFill.style.width = `${porcentagem}%`;

        if (subtotal >= LIMITE_FRETE_GRATIS) {
            progressText.innerHTML = `🎉 <strong>Frete Grátis!</strong>`;
            progressFill.style.background = "linear-gradient(90deg, #4caf50, #2e7d32)";
            progressWrapper.style.background = "#e8f5e9";
            progressWrapper.style.borderColor = "#4caf50";
        } else {
            progressText.innerHTML = `Faltam <strong>${money(falta)}</strong> p/ Frete Grátis`;
            progressFill.style.background = "linear-gradient(90deg, #ffb300, #ff9800)";
            progressWrapper.style.background = "#fff8d6";
            progressWrapper.style.borderColor = "#ffca28";
        }
    }

    /* ------------------ 🛒 MINI-CARRINHO (RENDERIZAÇÃO) ------------------ */  
    function renderMiniCart() {  
        if (!el.miniList) return;   
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);  
        if (el.cartCount) el.cartCount.textContent = totalItens;  

        atualizarBarraProgresso();

        if (!cart.length) {  
            el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';  
            if(el.miniFoot) el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
            const couponMsg = document.getElementById("coupon-message");  
            const couponDiscountRow = document.getElementById("coupon-discount-row");  
            if (couponMsg) couponMsg.innerHTML = "";  
            if (couponDiscountRow) couponDiscountRow.style.display = "none";  
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
            if (cart[i]) { cart[i].qtd++; renderMiniCart(); } 
        }));  
        el.miniList.querySelectorAll(".cart-minus").forEach(b => b.addEventListener("click", e => { 
            const i = +e.currentTarget.dataset.idx; 
            if (cart[i]) { if (cart[i].qtd > 1) cart[i].qtd--; else cart.splice(i, 1); renderMiniCart(); } 
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
        enhanceMiniCartUI();  
    };

    const getCartSubtotal = () => cart.reduce((s, i) => s + (Number(i.preco) || 0) * (Number(i.qtd) || 0), 0);
    /* ------------------ 🔥 FIREBASE INIT ------------------ */  
    const firebaseConfig = {  
        apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",  
        authDomain: "da-familia-lanches.firebaseapp.com",  
        projectId: "da-familia-lanches",  
        storageBucket: "da-familia-lanches.appspot.com",  
        messagingSenderId: "106857147317",  
        appId: "1:106857147317:web:769c98aed26bb8fc9e87fc",  
    };  

    let auth, db;   

    function inicializarFirebase() {  
        if (isFirebaseInitialized) return;  
        try {  
            if (!window.firebase) throw new Error("Biblioteca principal do Firebase não carregou.");  
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);  
            auth = firebase.auth();  
            db = firebase.firestore();  
            isFirebaseInitialized = true;  
            setupAuthListener();   
        } catch (error) {  
            console.error("ERRO FATAL AO INICIAR FIREBASE:", error);  
            document.body.innerHTML = `<div style="padding:20px;text-align:center;font-size:1.2rem;color:red;font-family:sans-serif;margin-top:50px;"><b>Erro Crítico</b><br>Não foi possível conectar aos nossos serviços.<br><small>Verifique sua conexão e recarregue.</small></div>`;  
        }  
    }  

    function setupAuthListener() {  
        auth.onAuthStateChanged(user => {  
            currentUser = user;   
            if (user) {  
                el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0] || user.email.split("@")[0]}`;  
                if (el.pedidosBtn) el.pedidosBtn.style.display = 'block';
                if (el.recompensasBtn) el.recompensasBtn.style.display = 'block';
                
                // Mostrar botão de relatórios se for admin
                if (user && isAdmin(user)) {  
                    if (el.reportsBtn) {
                        el.reportsBtn.style.display = "block";
                        // Também mostrar no menu lateral
                        document.querySelectorAll('.menu-link-action.admin-btn').forEach(btn => {
                            btn.style.display = 'block';
                        });
                    }
                }
            } else {  
                el.userBtn.textContent = "Entrar / Cadastrar";  
                if (el.pedidosBtn) el.pedidosBtn.style.display = 'block';
                if (el.recompensasBtn) el.recompensasBtn.style.display = 'block';
                
                // Esconder relatórios se não estiver logado ou não for admin
                if (el.reportsBtn) el.reportsBtn.style.display = "none";
                document.querySelectorAll('.menu-link-action.admin-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
            }  
        });  
    }

    /* ------------------ ⚙️ LOGIN ------------------ */  
    const handleLoginSuccess = (user) => {  
        currentUser = user;  
        popupAdd("Login realizado com sucesso!");  
        UIManager.closeAll();  
    };  

    const handleLoginError = (err) => {  
        if (err.code === "auth/user-not-found") {  
            if (confirm("Conta não encontrada. Deseja criar uma nova?")) {  
                auth.createUserWithEmailAndPassword(
                    document.getElementById("login-email")?.value?.trim(),   
                    document.getElementById("login-senha")?.value?.trim()
                ).then((cred) => handleLoginSuccess(cred.user)).catch((e) => alert("Erro: " + e.message));  
            }  
        } else if (err.code === "auth/wrong-password") {  
            alert("Senha incorreta. Tente novamente.");  
        } else {  
            alert("Erro: ".concat(err.message));  
        }  
    };  

    el.loginForm?.addEventListener("submit", (e) => {  
        e.preventDefault();  
        inicializarFirebase();
        if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");  
        const email = document.getElementById("login-email")?.value?.trim();  
        const senha = document.getElementById("login-senha")?.value?.trim();  
        if (!email || !senha) return alert("Preencha e-mail e senha.");  
        auth.signInWithEmailAndPassword(email, senha)
            .then((cred) => handleLoginSuccess(cred.user))
            .catch(handleLoginError);  
    });  

    el.googleBtn?.addEventListener("click", () => {  
        inicializarFirebase();
        if (!isFirebaseInitialized) return alert("Erro ao conectar ao serviço de login.");  
        const provider = new firebase.auth.GoogleAuthProvider();  
        auth.signInWithPopup(provider)
            .then((res) => handleLoginSuccess(res.user))
            .catch((err) => alert("Erro: ".concat(err.message)));  
    });  

    // ✅ ATUALIZADO: Usar UIManager para abrir modais
    el.userBtn?.addEventListener("click", () => UIManager.open("login", el.loginModal));  
    
    el.cartIcon?.addEventListener("click", () => {
        renderMiniCart();
        UIManager.open("cart", el.miniCart);
    });
    
    /* ------------------ ➕ ADICIONAIS ------------------ */
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

    const openExtrasFor = safe((card) => {  
        if (!card || !el.extrasModal || !el.extrasList) return;  
        produtoExtras = card.dataset.name;  
        produtoPrecoBase = parseFloat(card.dataset.price) || 0;  
        el.extrasList.innerHTML = adicionais.map((a, i) => `  
      <label class="extra-line">  
        <span style="font-weight:600;color:#222;">${a.nome} — <b style="color:#d32f2f;">${money(a.preco)}</b></span>  
        <input type="checkbox" value="${i}" style="margin-left:10px;">  
      </label>`).join("");  
        UIManager.open("extras", el.extrasModal);  
    });  

    document.querySelectorAll(".extras-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => openExtrasFor(e.currentTarget.closest(".card")))
    );  

    el.extrasConfirm?.addEventListener("click", () => {  
        if (!produtoExtras) return UIManager.closeAll();  
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
        const existente = cart.find(i => i.nome === nomeCompleto);  
        if (existente) existente.qtd++;  
        else cart.push({ nome: nomeCompleto, preco: precoTotal, qtd: 1 });  
        renderMiniCart();  
        popupAdd("Adicionado ao carrinho!");  
        UIManager.closeAll();  
    });
    /* ------------------ 🥤 COMBOS ------------------ */
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
    const openComboModal = safe((nomeCombo, precoBase) => {  
        if (!el.comboModal || !el.comboBody) { addCommonItem(nomeCombo, precoBase); return; }  
        const low = (nomeCombo || "").toLowerCase();  
        const grupo = low.includes("casal") ? "casal" : (low.includes("família") || low.includes("familia")) ? "familia" : null;  
        if (!grupo) { addCommonItem(nomeCombo, precoBase); return; }  
        const opts = comboDrinkOptions[grupo];  
        el.comboBody.innerHTML = opts.map((o, i) => `  
      <label class="combo-option-line">  
        <span style="font-weight:600;color:#222;">${o.rotulo}</span>  
        <span style="font-weight:700;color:#d32f2f;">+ ${money(o.delta)}</span>  
        <input type="radio" name="combo-drink" value="${i}" ${i === 0 ? "checked" : ""} style="margin-left:10px;">  
      </label>`).join("");  
        _comboCtx = { nomeCombo, precoBase, grupo };  
        UIManager.open("combo", el.comboModal);  
    });  

    el.comboConfirm?.addEventListener("click", () => {  
        if (!_comboCtx) return UIManager.closeAll();  
        const sel = el.comboBody?.querySelector('input[name="combo-drink"]:checked');  
        if (!sel) return;  
        const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];  
        const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;  
        const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);  
        const existente = cart.find(i => i.nome === finalName);  
        if (existente) existente.qtd++;  
        else cart.push({ nome: finalName, preco: finalPrice, qtd: 1 });  
        popupAdd("Combo adicionado!");  
        renderMiniCart();  
        UIManager.closeAll();  
    });

    function addCommonItem(nome, preco) {  
        if (/^combo/i.test(nome) && !/^\s*Combo [0-9]/.test(nome)) { openComboModal(nome, preco); return; }  
        const found = cart.find((i) => i.nome === nome && i.preco === preco);  
        if (found) found.qtd++;  
        else cart.push({ nome, preco, qtd: 1 });  
        renderMiniCart();  
        popupAdd(`${nome} adicionado!`);  
    }  

    document.querySelectorAll(".add-cart").forEach((btn) =>
        btn.addEventListener("click", (e) => {  
            const card = e.currentTarget.closest(".card");  
            if (!card) return;  
            addCommonItem(card.dataset.name, parseFloat(card.dataset.price));  
        })
    );

    /* ------------------ 🚚 FRETE MANUAL ------------------ */
    let modoEnderecoManual = false;

    document.getElementById("btnNaoSeiCEP")?.addEventListener("click", () => {
        window.open("https://buscacepinter.correios.com.br/app/endereco/index.php", "_blank");
    });

    document.getElementById("btnManual")?.addEventListener("click", mostrarModoManual);

    function mostrarModoManual() {
        modoEnderecoManual = true;
        const freteContainer = document.querySelector('.frete-container');
        const manualArea = document.getElementById('manualArea');
        if (freteContainer) freteContainer.style.display = 'none';
        if (manualArea) manualArea.style.display = 'block';
        
        const cepInput = document.getElementById('cep-input');
        const enderecoAuto = document.getElementById('endereco-auto');
        const numeroInput = document.getElementById('numero-input');
        const complementoInput = document.getElementById('complemento-input');
        
        if (cepInput) cepInput.value = '';
        if (enderecoAuto) enderecoAuto.value = '';
        if (numeroInput) numeroInput.value = '';
        if (complementoInput) complementoInput.value = '';
    }

    document.getElementById("btnVoltarCEP")?.addEventListener("click", () => {
        modoEnderecoManual = false;
        const freteContainer = document.querySelector('.frete-container');
        const manualArea = document.getElementById('manualArea');
        if (freteContainer) freteContainer.style.display = 'block';
        if (manualArea) manualArea.style.display = 'none';
        const manualEndereco = document.getElementById('manualEndereco');
        const manualNumero = document.getElementById('manualNumero');
        if (manualEndereco) manualEndereco.value = '';
        if (manualNumero) manualNumero.value = '';
        renderMiniCart();
    });

    document.getElementById("btnConfirmarEndereco")?.addEventListener("click", async () => {
        const manualEndereco = document.getElementById('manualEndereco');
        const manualNumero = document.getElementById('manualNumero');
        const endereco = manualEndereco?.value?.trim() || '';
        const numero = manualNumero?.value?.trim() || '';
        
        if (!endereco) { popupAdd("Preencha o endereço completo!"); return; }
        if (!numero) { popupAdd("Preencha o número!"); return; }
        
        popupAdd("Verificando endereço...");
        const taxaCalculada = await getDynamicDeliveryFee(endereco);
        if (taxaCalculada === DELIVERY_FEE_DEFAULT) { 
            popupAdd(`Bairro não mapeado. Taxa padrão: ${money(DELIVERY_FEE_DEFAULT)}`); 
        } else { 
            popupAdd(`Taxa de entrega: ${money(taxaCalculada)} ✅`); 
        }
        renderMiniCart();
    });

    /* ============================================================
       🚨 BOTÃO BUSCAR CEP (CORRIGIDO - FUNCIONANDO!)
    ============================================================ */
    async function buscarCEP(cep) {  
        const freteContainer = document.querySelector('.frete-container');  
        const enderecoAuto = document.getElementById('endereco-auto');  
        const numeroInput = document.getElementById('numero-input');  
        const complementoInput = document.getElementById('complemento-input');  
        const retirarLocal = document.getElementById('retirar-local');  

        const toggleAddressState = (isDisabled) => {  
            if(enderecoAuto) enderecoAuto.disabled = isDisabled;  
            if(numeroInput) numeroInput.disabled = isDisabled;  
            if(complementoInput) complementoInput.disabled = isDisabled;  
            if(retirarLocal) retirarLocal.disabled = isDisabled;  
        };  
        const updateStatus = (msg, color) => { 
            if (freteContainer) freteContainer.querySelector('h4').innerHTML = `🚚 Entrega: <span style="color:${color}">${msg}</span>`; 
        };  
        const clearAndEnableManual = (msg) => {  
            if (enderecoAuto) enderecoAuto.value = msg;  
            if (numeroInput) numeroInput.value = '';  
            if (complementoInput) complementoInput.value = '';  
            toggleAddressState(false);  
            if (enderecoAuto) enderecoAuto.disabled = false;  
            updateStatus('Erro/Manual', 'var(--danger)');  
            renderMiniCart();  
        };  

        toggleAddressState(true);  
        updateStatus('Buscando endereço...', 'var(--botao)');  
        document.getElementById('cep-input').disabled = false;   

        try {  
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);  
            const data = await response.json();  
            if (data.erro || !response.ok) { 
                clearAndEnableManual('CEP não encontrado. Preencha manualmente.'); 
            } else {  
                const localidadeCompleta = `${data.localidade || 'Cidade'}/${data.uf || 'UF'}`;  
                const enderecoString = `${data.logradouro || 'Rua'} - ${data.bairro || 'Bairro'} (${localidadeCompleta})`;  
                enderecoAuto.value = enderecoString;  
                toggleAddressState(false);  
                if (enderecoAuto) enderecoAuto.disabled = true;  
                if (numeroInput) numeroInput.focus();   
                updateStatus('Endereço encontrado!', 'var(--success)');  
                renderMiniCart();   
            }  
        } catch (error) {  
            console.error("ViaCEP Error:", error);  
            popupAdd("Erro ao consultar CEP.");  
            clearAndEnableManual('Erro na consulta. Preencha manualmente.');  
        }  
    }

    // ✅ CORREÇÃO CRÍTICA: Botão Buscar CEP funcionando!
    document.getElementById('btn-calcular-frete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const cepInput = document.getElementById('cep-input');  
        const cep = cepInput.value.trim().replace(/\D/g, '');  
        if (cep.length === 8) {
            buscarCEP(cep);
        } else {
            popupAdd("CEP deve ter 8 dígitos.");
        }  
    });
    async function getDynamicDeliveryFee(enderecoCompleto) {
        if (!enderecoCompleto || typeof enderecoCompleto !== "string") {
            console.warn("FW: Endereço vazio, usando fallback.");
            return DELIVERY_FEE_DEFAULT;
        }
        let bairroExtraido = "";
        try {
            const partePrincipal = enderecoCompleto.split("(")[0].trim();
            const partes = partePrincipal.split(" - ");
            if (partes.length >= 2) bairroExtraido = partes[partes.length - 1].trim();
            else bairroExtraido = partePrincipal.trim();
        } catch (_) {
            console.warn("FW: Falha ao extrair bairro.");
            return DELIVERY_FEE_DEFAULT;
        }
        const bairroClean = bairroExtraido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        try {
            if (!db) { console.warn("FW: db não disponível."); return DELIVERY_FEE_DEFAULT; }
            if (!window.deliveryFeesCacheGlobal) {
                const snap = await db.collection("TaxasDeEntrega").doc("bairros").collection("lista").doc("tabela").get();
                if (!snap.exists) { console.warn("FW: Documento 'tabela' não encontrado."); return DELIVERY_FEE_DEFAULT; }
                const arr = snap.data()?.data || [];
                const cache = {};
                arr.forEach(item => {
                    if (!item || !item.nome) return;
                    const key = String(item.nome).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const valor = Number(item.taxa);
                    if (!isNaN(valor) && valor >= 0) cache[key] = valor;
                });
                window.deliveryFeesCacheGlobal = cache;
            }
        } catch (e) { console.warn("FW: Erro ao carregar taxas.", e); return DELIVERY_FEE_DEFAULT; }
        const cacheAtual = window.deliveryFeesCacheGlobal || {};
        if (!Object.keys(cacheAtual).length) return DELIVERY_FEE_DEFAULT;
        if (cacheAtual[bairroClean] !== undefined) { return cacheAtual[bairroClean]; }
        const palavras = bairroClean.split(" ");
        for (const palavra of palavras) {
            if (palavra.length < 4) continue;
            for (const key in cacheAtual) { if (key.includes(palavra)) return cacheAtual[key]; }
        }
        return DELIVERY_FEE_DEFAULT;
    }

    const _cupomCache = {};  
    function _cacheKey(codigo, subtotal) {  
        const faixa = Math.floor((subtotal || 0) / 5);  
        return `${(codigo||"").toUpperCase()}::${faixa}`;  
    }  

    async function validarCupomFirestore(codigo, subtotal) {  
        if (!isFirebaseInitialized) return { valido:false, discount:0, freeShipping:false, label:"", mensagem:"Erro de conexão." };  
        const code = (codigo || "").toUpperCase();  
        const invalido = { valido:false, discount:0, freeShipping:false, label:"", mensagem:"" };  
        if (!code) return invalido;  
        const userId = currentUser?.uid;  
        const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
        const key = _cacheKey(code, subtotal);  
        const now = Date.now();  
        const hit = _cupomCache[key];  
        if (hit && hit.ate > now) return hit.res;  

        let data = null;  
        let isPersonalizado = false;  

        try {  
            const snapGeral = await db.collection("Cupons").doc(code).get();  
            if (snapGeral.exists) { data = snapGeral.data(); }  
            else {  
                const recompensaEncontrada = RECOMPENSAS_DATA.find(r => r.valor === code && r.tipo === 'cupom');  
                if (userId && recompensaEncontrada) {  
                    const snapPessoal = await db.collection("CuponsUsuarios").doc(userId).get();  
                    const pessoalData = snapPessoal.data();  
                    if (snapPessoal.exists && pessoalData?.cupom === code && !pessoalData?.usado) {  
                        data = { tipo: pessoalData.tipo, valor: pessoalData.valor, ativo: true, expiraEm: pessoalData.expiraEm };  
                        isPersonalizado = true;  
                    } else if (snapPessoal.exists && pessoalData?.usado) {  
                        return { ...invalido, mensagem: "Este cupom já foi utilizado." };  
                    } else { return { ...invalido, mensagem: "Cupom inválido ou não liberado." }; }  
                } else {  
                    const res = { ...invalido, mensagem: "Cupom inválido." };  
                    _cupomCache[key] = { ate: now + 30000, res }; return res;  
                }  
            }  

            if (!data.ativo) { const res = { ...invalido, mensagem: "Este cupom não está mais ativo." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  
            if (data.expiraEm) {  
                let expiraDate = null;  
                if (typeof data.expiraEm?.toDate === "function") expiraDate = data.expiraEm.toDate();  
                else if (typeof data.expiraEm === "string") expiraDate = new Date(data.expiraEm);  
                if (expiraDate && expiraDate < new Date()) { const res = { ...invalido, mensagem: "Este cupom expirou." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  
            }  

            let discount = 0, freeShipping = false, label = "";  
            if (data.tipo === "percent") { discount = Math.max(0, subtotal * (Number(data.percent || data.valor) / 100)); label = `${Number(data.percent || data.valor)}% OFF`; }  
            else if (data.tipo === "value") { const val = Math.max(0, Number(data.valor) || 0); discount = Math.min(subtotal, val); label = `R$ ${val.toFixed(2).replace(".", ",")} OFF`; }  
            else if (data.tipo === "frete") { freeShipping = true; label = "Frete Grátis"; }  
            else { const res = { ...invalido, mensagem: "Tipo de cupom desconhecido." }; _cupomCache[key] = { ate: now + 30000, res }; return res; }  

            const res = { valido:true, discount, freeShipping, label, mensagem:"Cupom aplicado com sucesso!", isPersonalizado };  
            _cupomCache[key] = { ate: now + 30000, res }; return res;  
        } catch (err) { console.error("Erro ao validar cupom:", err); return { ...invalido, mensagem: "Erro ao processar cupom." }; }  
    }

    async function calcTotals() {  
        const subtotal = getCartSubtotal();  
        const d = await validarCupomFirestore(couponApplied, subtotal);   
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        
        let deliveryFee = DELIVERY_FEE_DEFAULT;   
        let enderecoParaCalculo = "";

        if (modoEnderecoManual) {
            const manualEndereco = document.getElementById('manualEndereco');
            enderecoParaCalculo = manualEndereco?.value?.trim() || "";
        } else {
            const cepInput = document.getElementById('cep-input');
            const enderecoAuto = document.getElementById('endereco-auto');
            const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';
            
            if (cepInput && cepValue.length === 8 && enderecoAuto && enderecoAuto.value) {
                enderecoParaCalculo = enderecoAuto.value.trim();
            }
        }

        if (isRetirarLocal || subtotal >= LIMITE_FRETE_GRATIS) {  
            deliveryFee = 0;  
        } else if (enderecoParaCalculo) {  
            try { deliveryFee = await getDynamicDeliveryFee(enderecoParaCalculo); }  
            catch(e) { console.error("Erro frete dinâmico:", e); deliveryFee = DELIVERY_FEE_DEFAULT; }  
        }  

        const delivery = d.freeShipping ? 0 : deliveryFee;  
        const total = Math.max(0, subtotal + delivery - d.discount);  
        return { subtotal, delivery, discount: d.discount, discountLabel: d.label, total, cupomInfo: d };  
    }

    async function enhanceMiniCartUI() {  
        if (!el.miniFoot) return;  
        const couponMsg = document.getElementById("coupon-message");  
        const couponDiscountRow = document.getElementById("coupon-discount-row");  
        const cartDiscount = document.getElementById("cart-discount");  
        el.miniFoot.querySelectorAll(".cart-summary-generated").forEach(e => e.remove());  
        if (cart.length === 0) { if (couponMsg) couponMsg.innerHTML = ""; if (couponDiscountRow) couponDiscountRow.style.display = "none"; return; }  

        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();
        const deliveryLabel = delivery === 0 ? "Grátis 🎉" : money(delivery);  

        if (couponMsg) {  
            couponMsg.textContent = cupomInfo.mensagem;  
            couponMsg.className = `coupon-message ${cupomInfo.valido ? 'success' : 'error'}`;  
            if (!cupomInfo.valido && couponApplied) {  
                couponApplied = ""; localStorage.removeItem("dflCoupon");  
                const couponInput = document.getElementById("coupon-input");  
                if (couponInput && document.activeElement !== couponInput) couponInput.value = "";  
            }  
        }  
        if (couponDiscountRow && cartDiscount) {  
            if (discount > 0 || cupomInfo.label) { cartDiscount.textContent = `- ${money(discount)} ${couponApplied ? `(${couponApplied})` : ""}`; couponDiscountRow.style.display = "flex"; }  
            else couponDiscountRow.style.display = "none";  
        }  

        const summaryDiv = document.createElement('div');  
        summaryDiv.className = 'cart-summary-generated';  
        // ✅ CORREÇÃO 2: O botão Finalizar Pedido Duplicado foi removido do HTML. 
        // A linha abaixo é a que o cria dinamicamente, e agora ele chama a NOVA função fecharPedido.
        summaryDiv.innerHTML = `  
      <div class="summary-row" style="margin-top:10px;border-top:1px solid #eee;padding-top:10px;"><span>Subtotal</span><b>${money(subtotal)}</b></div>  
      <div class="summary-row"><span>Entrega</span><b>${deliveryLabel}</b></div>  
      <div class="summary-row" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #eee;padding-top:10px;margin:10px 0;font-size:1.1rem;"><span><b>Total</b></span><span style="color:#e53935;font-weight:800;">${money(total)}</span></div>  
      <button id="finish-order" type="button" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:10px;padding:12px;font-weight:700;cursor:pointer;margin-bottom:8px">Finalizar Pedido 🛍️</button>  
      <button id="clear-cart" type="button" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Limpar Carrinho</button>`;  

        el.miniFoot.appendChild(summaryDiv);  
        document.getElementById('retirar-local')?.addEventListener('change', renderMiniCart);  
        document.getElementById('numero-input')?.addEventListener('input', renderMiniCart);  
        document.getElementById('complemento-input')?.addEventListener('input', renderMiniCart);  
        
        // Agora o botão dinâmico chama a NOVA função fecharPedido que inicia o fluxo PIX
        summaryDiv.querySelector("#finish-order")?.addEventListener("click", fecharPedido);  
        summaryDiv.querySelector("#clear-cart")?.addEventListener("click", () => {  
            if (confirm("Limpar todo o carrinho?")) { 
                cart = []; 
                couponApplied = ""; 
                localStorage.removeItem("dflCoupon"); 
                document.getElementById("coupon-input").value = ""; 
                renderMiniCart(); 
                popupAdd("Carrinho limpo!"); 
            }  
        });  
    }
    /* ============================================================
       🚨 FUNÇÃO FECHAR PEDIDO ORIGINAL (AGORA CHAMADA APÓS PIX)
    ============================================================ */
    async function fecharPedidoOriginal() {  
        if (!cart.length) return;  
        if (!currentUser) return;  
        
        const isRetirarLocal = document.getElementById('retirar-local')?.checked;  
        let finalAddressString = "";
        
        if (modoEnderecoManual) {
            const manualEndereco = document.getElementById('manualEndereco');
            const manualNumero = document.getElementById('manualNumero');
            const endereco = manualEndereco?.value?.trim() || '';
            const numero = manualNumero?.value?.trim() || '';
            
            if (endereco && numero) {
                finalAddressString = `${endereco}, N° ${numero} (MANUAL)`;
            }
        } else {
            const cepInput = document.getElementById('cep-input');
            const autoRuaBairro = document.getElementById("endereco-auto");
            const autoNumero = document.getElementById("numero-input");
            const autoComp = document.getElementById("complemento-input");
            
            const ruaBairroValue = autoRuaBairro ? autoRuaBairro.value.trim() : '';
            const numeroValue = autoNumero ? autoNumero.value.trim() : '';
            const compValue = autoComp ? autoComp.value.trim() : '';
            const cepValue = cepInput ? cepInput.value.trim().replace(/\D/g, '') : '';
            
            if (ruaBairroValue && numeroValue) {
                finalAddressString = `${ruaBairroValue}, N° ${numeroValue}`;
                if (compValue) finalAddressString += `, Comp: ${compValue}`;
                if (cepValue.length === 8) finalAddressString += ` | CEP: ${cepValue}`;
            }
        }
        
        if (isRetirarLocal) finalAddressString = "CLIENTE IRÁ RETIRAR NO LOCAL";  
        else if (!finalAddressString) { 
            popupAdd("Erro: Endereço incompleto.");
            return; 
        }  

        const addr = finalAddressString;  
        const { subtotal, delivery, discount, total, cupomInfo } = await calcTotals();  
        const pedido = { 
            usuario: currentUser.email, 
            userId: currentUser.uid, 
            nome: currentUser.displayName || currentUser.email.split("@")[0], 
            itens: cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
            itensObj: cart.map(i => ({ nome: i.nome, preco: i.preco, qtd: i.qtd })), 
            subtotal: Number(subtotal.toFixed(2)), 
            entrega: Number(delivery.toFixed(2)), 
            desconto: Number(discount.toFixed(2)), 
            cupom: couponApplied || "", 
            total: Number(total.toFixed(2)), 
            endereco: addr, 
            data: new Date().toISOString(), 
            thumb: '' 
        };  

        try {  
            const batch = db.batch(); 
            const userId = currentUser.uid; 
            const usuarioRef = db.collection("Usuarios").doc(userId);  
            
            if (cupomInfo.isPersonalizado && couponApplied) { 
                const cupomUserRef = db.collection("CuponsUsuarios").doc(userId); 
                batch.update(cupomUserRef, { 
                    usado: true, 
                    dataUso: firebase.firestore.FieldValue.serverTimestamp(), 
                    pedidoId: 'PENDENTE' 
                }); 
            }  
            
            const pedidoRef = db.collection("Pedidos").doc(); 
            batch.set(pedidoRef, pedido);  
            batch.set(usuarioRef, { 
                email: currentUser.email, 
                pedidosFeitos: firebase.firestore.FieldValue.increment(1) 
            }, { merge: true });  
            
            await batch.commit();  
            
            if (cupomInfo.isPersonalizado && couponApplied) {
                await db.collection("CuponsUsuarios").doc(userId).update({ pedidoId: pedidoRef.id });  
            }

            const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
            const doc = await usuarioRef.get(); 
            const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 }; 
            const feitos = data.pedidosFeitos; 
            const nivelAtual = data.recompensaNivel;  
            const recompensaAtingida = RECOMPENSAS_DATA.find(r => r.limite === feitos && (r.limite / (RECOMPENSAS_DATA[0]?.limite || 1)) > nivelAtual);  

            if (recompensaAtingida) {  
                const primeiroLimite = RECOMPENSAS_DATA[0]?.limite || 1; 
                const novoNivel = recompensaAtingida.limite / primeiroLimite;  
                const itemLiberado = { 
                    cupom: recompensaAtingida.valor, 
                    tipo: recompensaAtingida.tipo, 
                    valor: recompensaAtingida.valor, 
                    liberadoEm: firebase.firestore.FieldValue.serverTimestamp(), 
                    usado: false, 
                    pedidoLiberacao: pedidoRef.id, 
                    titulo: recompensaAtingida.titulo || `Recompensa Nível ${novoNivel}` 
                };  
                
                await usuarioRef.update({ 
                    recompensaNivel: novoNivel, 
                    ultimaRecompensa: recompensaAtingida.id 
                });  
                
                if (recompensaAtingida.tipo === 'cupom') {
                    await db.collection("CuponsUsuarios").doc(userId).set(itemLiberado, { merge: true });  
                }
                
                await db.collection("Usuarios").doc(userId).collection("RecompensasRecebidas").add(itemLiberado);  
                const nomeNivel = String(recompensaAtingida.titulo || recompensaAtingida.valor || '');  
                mostrarPopupRecompensa(`🎉 Parabéns! Você alcançou ${nomeNivel} ${getTierIcon(nomeNivel)} e ganhou: ${recompensaAtingida.valor}`);  
                configuracoesRecompensa = null;  
            }  

            popupAdd("Pedido salvo ✅"); 
            try { sound.currentTime = 0; sound.play(); } catch (_) {}  
            
            const linhas = [
                "🍔 *Pedido DFL*",
                cart.map((i) => `• ${i.nome} x${i.qtd}`).join("\n"), 
                "", 
                `Subtotal: *${money(subtotal)}*`, 
                `Entrega: *${money(delivery)}*${cupomInfo.freeShipping ? " _(Frete Grátis)_" : ""}`, 
                `Desconto${couponApplied ? ` (${couponApplied})` : ""}: *-${money(discount)}*`, 
                `*Total: ${money(total)}*`, 
                "", 
                `🏠 *Endereço:* ${addr}`
            ].join("\n");  
            
            window.open(`https://wa.me/5534997178336?text=${encodeURIComponent(linhas)}`, "_blank");  
            
            cart = []; 
            couponApplied = ""; 
            localStorage.removeItem("dflCoupon"); 
            document.getElementById("coupon-input").value = ""; 
            modoEnderecoManual = false; 
            renderMiniCart(); 
            UIManager.closeAll();  
            
        } catch (err) { 
            console.error("Erro fechar pedido:", err); 
            alert(`Erro: ${err.message}`); 
        }  
    }

   /* ------------------ 📦 MEUS PEDIDOS ------------------ */
async function carregarPedidos(userId) {  
    if (!el.pedidosLista) return; 
    el.pedidosLista.innerHTML = `<p class="empty-orders">Carregando pedidos...</p>`;  
    
    try { 
        const q = db.collection("Pedidos").where("userId", "==", userId).orderBy("data", "desc"); 
        const snapshot = await q.get();  
        
        if (snapshot.empty) { 
            el.pedidosLista.innerHTML = `<p class="empty-orders">Nenhum pedido encontrado 😢</p>`; 
            return; 
        }  
        
        const pedidos = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        exibirPedidos(pedidos);  
    } catch (err) { 
        console.error("Erro ao carregar pedidos:", err); 
        el.pedidosLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro ao buscar pedidos: ${err.message}</p>`; 
    }  
}  

function exibirPedidos(pedidos) {  
    if (!el.pedidosLista) return;  
    
    el.pedidosLista.innerHTML = pedidos.map(p => {  
        const thumbUrl = p.thumb || ''; 
        const dataFormatada = p.data ? 
            new Date(p.data?.seconds * 1000 || p.data).toLocaleString("pt-BR", { 
                day: "2-digit", 
                month: "2-digit", 
                year: "numeric", 
                hour: "2-digit", 
                minute: "2-digit" 
            }) : "—";  
        
        const podeRepetir = Array.isArray(p.itensObj) && p.itensObj.length > 0;  
        const itensParaExibir = (Array.isArray(p.itens) && p.itens.length > 0) ? 
            p.itens.join('<br>') : 
            (p.itensObj && p.itensObj.length > 0) ? 
                p.itensObj.map(i => `• ${i.nome} x${i.qtd}`).join('<br>') : 
                '• Sem itens';  
        
        return `
            <div class="pedido-card">
                <div class="pedido-thumb" style="background-image:url('${thumbUrl}');"></div>
                <h4>📅 ${dataFormatada}</h4>
                <p class="pedido-info">Total: ${money(p.total)}</p>
                <div class="pedido-itens">${itensParaExibir}</div>
                <button class="repetir-btn" data-id="${p.id}" ${podeRepetir ? '' : 'disabled style="background:grey;cursor:not-allowed;"'}>
                    🔁 Repetir Pedido
                </button>
            </div>
        `;  
    }).join('');  
}  

el.pedidosLista?.addEventListener('click', async (e) => { 
    if (e.target.classList.contains('repetir-btn') && !e.target.disabled) { 
        e.target.disabled = true; 
        e.target.textContent = "Carregando..."; 
        await repetirPedido(e.target.dataset.id); 
    } 
});  

async function repetirPedido(idPedido) {  
    try { 
        const docRef = db.collection("Pedidos").doc(idPedido); 
        const doc = await docRef.get();  
        
        if (!doc.exists) {
            popupAdd("Pedido não encontrado.");
            return;
        }  
        
        const itensParaRepetir = doc.data().itensObj;  
        
        if (!Array.isArray(itensParaRepetir) || itensParaRepetir.length === 0) {
            popupAdd("Não é possível repetir este pedido.");
            return;
        }  
        
        cart = []; 
        itensParaRepetir.forEach(item => { 
            if (item.nome && item.preco > 0 && item.qtd > 0) {
                cart.push({ 
                    nome: item.nome, 
                    preco: item.preco, 
                    qtd: item.qtd 
                }); 
            }
        });  
        
        couponApplied = ""; 
        localStorage.removeItem("dflCoupon"); 
        document.getElementById("coupon-input").value = "";  
        
        popupAdd("Pedido adicionado ao carrinho!"); 
        renderMiniCart(); 
        UIManager.closeAll(); 
        UIManager.open("cart", el.miniCart);  
        
    } catch (err) { 
        console.error("Erro ao repetir pedido:", err); 
        popupAdd("Erro ao processar pedido."); 
    }  
}

// ✅ ATUALIZADO: Usar UIManager para abrir painéis
el.pedidosBtn?.addEventListener("click", () => { 
    if (!currentUser) { 
        alert("Faça login para ver seus pedidos!"); 
        UIManager.open("login", el.loginModal); 
        return; 
    } 
    UIManager.open("pedidos", el.pedidosPanel); 
    carregarPedidos(currentUser.uid); 
});

el.recompensasBtn?.addEventListener("click", () => { 
    if (!currentUser) { 
        alert("Faça login para ver suas recompensas!"); 
        UIManager.open("login", el.loginModal); 
        return; 
    } 
    UIManager.open("recompensas", el.recompensasPanel); 
    carregarRecompensas(currentUser.uid); 
});
/* ------------------ 🎁 RECOMPENSAS (Continuação da Parte 8) ------------------ */
    let configuracoesRecompensa = null;   
    async function carregarConfiguracoesDeRecompensas() {  
        if (!isFirebaseInitialized) return [];   
        if (configuracoesRecompensa) return configuracoesRecompensa;   
        try {  
            const snapshot = await db.collection("RecompensasConfig").get();  
            const configs = [];  
            snapshot.forEach(doc => { 
                const data = doc.data(); 
                configs.push({ 
                    id: doc.id, 
                    limite: data.meta || data.limite, 
                    tipo: data.tipo, 
                    valor: data.valor || data.titulo, 
                    titulo: data.titulo || data.valor, 
                    ...data 
                }); 
            });  
            configuracoesRecompensa = configs.sort((a, b) => (a.limite || 0) - (b.limite || 0));  
            return configuracoesRecompensa;  
        } catch (e) { 
            console.error("Erro recompensas:", e); 
            return []; 
        }  
    }

    async function carregarRecompensas(userId) {  
        if (!isFirebaseInitialized) return;  
        const contadorValor = document.getElementById('contador-valor'); 
        const progressoBar = document.getElementById('progresso-bar'); 
        const progressoMsg = document.getElementById('progresso-mensagem');  
        if (!contadorValor || !progressoBar || !progressoMsg || !el.recompensasLista) return;  
        
        contadorValor.textContent = '...'; 
        progressoBar.style.width = '0%'; 
        progressoMsg.textContent = 'Carregando metas...';  
        el.recompensasLista.innerHTML = ''; 
        if(el.historicoLista) el.historicoLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#999;">Carregando...</p>`;  
        
        const RECOMPENSAS_DATA = await carregarConfiguracoesDeRecompensas();  
        if (RECOMPENSAS_DATA.length === 0) { 
            progressoMsg.textContent = 'Erro ao carregar metas.'; 
            el.recompensasLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:red;">Sistema offline.</p>`; 
            return; 
        }  
        const metaPrimeiroNivel = RECOMPENSAS_DATA[0]?.limite || 1;  

        db.collection('Usuarios').doc(userId).onSnapshot(async doc => {  
            el.recompensasLista.innerHTML = ''; 
            if(el.historicoLista) el.historicoLista.innerHTML = '';  
            const data = doc.data() || { pedidosFeitos: 0, recompensaNivel: 0 }; 
            const feitos = data.pedidosFeitos; 
            const nivelAtual = data.recompensaNivel;  
            
            let cupomStatus = null; 
            const recompensaAtual = RECOMPENSAS_DATA.find(r => r.limite === nivelAtual * metaPrimeiroNivel);  
            if (recompensaAtual && recompensaAtual.tipo === 'cupom') { 
                const cupomSnap = await db.collection('CuponsUsuarios').doc(userId).get(); 
                cupomStatus = cupomSnap.exists ? cupomSnap.data() : null; 
            }  
            
            const proximaRecompensa = RECOMPENSAS_DATA.find(r => r.limite > feitos);  
            const metaParaExibir = proximaRecompensa ? proximaRecompensa.limite : feitos;  
            const metaBaseCalculo = proximaRecompensa ? proximaRecompensa.limite : metaPrimeiroNivel;  
            const porcentagem = proximaRecompensa === undefined ? 100 : Math.min(100, (feitos / metaBaseCalculo) * 100);  
            
            contadorValor.textContent = feitos;  
            const elMeta = document.querySelector('.progress-container span:last-child'); 
            if(elMeta) elMeta.textContent = metaParaExibir;  
            progressoBar.style.width = `${porcentagem}%`;  
            
            if (proximaRecompensa) { 
                const faltam = proximaRecompensa.limite - feitos; 
                progressoMsg.textContent = `Faltam ${faltam} pedidos para: ${proximaRecompensa.titulo || proximaRecompensa.valor}!`; 
                progressoBar.style.background = 'linear-gradient(90deg, #ffb300, #ff7043)'; 
                const recompensasObtidas = RECOMPENSAS_DATA.filter(r => r.limite <= feitos); 
                exibirRecompensas(feitos, recompensasObtidas, cupomStatus, RECOMPENSAS_DATA); 
                if (recompensasObtidas.length === 0) el.recompensasLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#666;margin-top:20px;">Faça ${faltam} pedidos para desbloquear.</p>`; 
            } else { 
                progressoMsg.textContent = '🎉 Parabéns! Todas as metas completas!'; 
                progressoBar.style.background = 'linear-gradient(90deg, #4caf50, #43a047)'; 
                exibirRecompensas(feitos, RECOMPENSAS_DATA, cupomStatus, RECOMPENSAS_DATA); 
            }  
            await carregarHistoricoRecompensas(userId);  
        }, error => { 
            console.error("Erro contador:", error); 
            progressoMsg.textContent = 'Erro ao ler progresso.'; 
            contadorValor.textContent = '0'; 
        });  
    }  

    function exibirRecompensas(pedidosFeitos, recompensasDisponiveis, cupomStatus, RECOMPENSAS_DATA) {  
        if (!el.recompensasLista) return;  
        el.recompensasLista.innerHTML = (recompensasDisponiveis || []).map(r => {  
            const liberada = pedidosFeitos >= r.limite; 
            const cupomJaUsado = cupomStatus?.usado === true && cupomStatus?.cupom === r.valor;  
            const tituloRaw = String(r.titulo || r.valor || ''); 
            const titulo = r.titulo || `Recompensa: ${r.valor}`;  
            let acaoBtn = '', statusTag = '', cardStyle = '', codigoCupom = r.valor || 'BRINDE';  
            let icon = '🎁'; 
            const tituloLower = tituloRaw.toLowerCase();  
            
            if (tituloLower.includes('ouro') || tituloLower.includes('platina') || tituloLower.includes('diamante')) icon = getTierIcon(tituloRaw);  
            else if (r.tipo === 'cupom') icon = '🎟️'; 
            else if (r.tipo === 'brinde') icon = '🍔';  
            
            if (cupomJaUsado) { 
                statusTag = '<span style="color:#d32f2f;font-weight:bold;">(USADO)</span>'; 
                acaoBtn = `<button disabled style="background:#ccc;color:#666;border:none;border-radius:6px;padding:8px;cursor:not-allowed;margin-top:5px;">Usado</button>`; 
                cardStyle = 'opacity: 0.7;'; 
            } else if (liberada && r.tipo === 'cupom') { 
                statusTag = '<span style="color:#4caf50;font-weight:bold;">(DISPONÍVEL)</span>'; 
                acaoBtn = `<button class="recompensa-aplicar-btn" data-cupom="${codigoCupom}" style="background:#4caf50;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-weight:600;margin-top:5px;">Aplicar Cupom 🏷️</button>`; 
            } else if (liberada && r.tipo === 'brinde') { 
                statusTag = '<span style="color:#1976D2;font-weight:bold;">(LIBERADO)</span>'; 
                acaoBtn = `<button disabled style="background:#1976D2;color:#fff;border:none;border-radius:6px;padding:8px;cursor:default;margin-top:5px;">Peça no Balcão</button>`; 
            }  
            const mostrarCupom = (r.valor && !String(r.valor).includes('Nível'));  
            return `<div class="recompensa-card" style="display:flex;align-items:center;padding:15px;border-radius:10px;margin-bottom:10px;background:#f9f9f9;box-shadow:0 2px 5px rgba(0,0,0,0.1);${cardStyle}"><div style="font-size:2rem;margin-right:15px;">${icon}</div><div style="flex:1;"><h4 style="margin:0 0 5px 0;color:#333;">${titulo} ${statusTag}</h4><p style="margin:0;font-size:0.9rem;color:#666;">Meta: ${r.limite} Pedidos</p>${mostrarCupom ? `<b style="color:#4caf50;display:block;margin-top:4px;">CUPOM: ${codigoCupom}</b>` : ''}</div><div>${acaoBtn}</div></div>`;  
        }).join('');  
        el.recompensasLista.querySelectorAll('.recompensa-aplicar-btn').forEach(btn => { 
            btn.addEventListener('click', (e) => { 
                const codigo = e.currentTarget.dataset.cupom; 
                if (codigo) { 
                    couponApplied = codigo; 
                    localStorage.setItem("dflCoupon", couponApplied); 
                    document.getElementById("coupon-input").value = codigo; 
                    renderMiniCart(); 
                    UIManager.closeAll(); 
                    popupAdd(`Cupom ${codigo} aplicado! ✅`); 
                    UIManager.open("cart", el.miniCart); 
                } 
            }); 
        });  
    }  

    async function carregarHistoricoRecompensas(userId) {  
        if (!el.historicoLista) return; 
        el.historicoLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#999;">Carregando...</p>`;  
        try { 
            const q = db.collection("Usuarios").doc(userId).collection("RecompensasRecebidas").orderBy("liberadoEm", "desc"); 
            const snapshot = await q.get();  
            if (snapshot.empty) { 
                el.historicoLista.innerHTML = `<p class="empty-orders" style="text-align:center;color:#999;">Nenhuma recompensa no histórico.</p>`; 
                return; 
            }  
            el.historicoLista.innerHTML = snapshot.docs.map(doc => { 
                const log = doc.data(); 
                const dataRecebimento = log.liberadoEm ? log.liberadoEm.toDate().toLocaleDateString('pt-BR') : "—"; 
                let icon = '🎁'; 
                const tituloRaw = String(log.titulo || '').toLowerCase(); 
                if (tituloRaw.includes('ouro') || tituloRaw.includes('platina') || tituloRaw.includes('diamante')) icon = getTierIcon(log.titulo); 
                else if (log.tipo === 'cupom') icon = '🎟️'; 
                return `<div class="historico-card" style="display:flex;padding:10px 0;border-bottom:1px dashed #eee;align-items:center;justify-content:space-between;"><div style="flex:1;"><p style="font-weight:600;margin:0;color:#333;">${icon} ${log.titulo || log.valor}</p><small style="color:#999;">${dataRecebimento}</small></div><span style="font-weight:700;color:#4caf50;">Recebido</span></div>`; 
            }).join('');  
        } catch (err) { 
            console.error("Erro histórico:", err); 
            el.historicoLista.innerHTML = `<p class="empty-orders" style="color:red;">Erro.</p>`; 
        }  
    }  

    /* ------------------ 📊 ADMIN DASHBOARD ------------------ */
    const ADMINS = [ "alefejohsefe@gmail.com", "kalebhstanley650@gmail.com", "contato@dafamilialanches.com.br" ];  
    function isAdmin(user) { return user && user.email && ADMINS.includes(user.email.toLowerCase()); }  
    
    let chartPedidos = null; let chartProdutos = null;  
    
    function ensureChartJS(cb) { 
        if (window.Chart) return cb(); 
        const s = document.createElement("script"); 
        s.src = "https://cdn.jsdelivr.net/npm/chart.js"; 
        s.onload = cb; 
        document.head.appendChild(s); 
    }  
    
    function createDashboard() { 
        if (document.getElementById("admin-dashboard")) return; 
        const div = document.createElement("div"); 
        div.id = "admin-dashboard"; 
        div.className = "modal"; 
        div.innerHTML = `<div class="modal-content" style="max-width:1000px;width:95%;height:85vh;overflow:auto;background:#fff;border-radius:12px;"><div class="modal-head" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;"><h3>📊 Relatórios</h3><button class="dashboard-close">✖</button></div><div class="dashboard-body" style="padding:12px;"><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;"><div id="card-total" class="cardBox">Total: —</div><div id="card-pedidos" class="cardBox">Pedidos: —</div><div id="card-ticket" class="cardBox">Ticket Médio: —</div></div><div style="margin-bottom:10px;"><label>Período: </label><select id="filter-period"><option value="7">7 dias</option><option value="30">30 dias</option><option value="all">Todos</option></select></div><canvas id="chart-pedidos" style="width:100%;height:240px;"></canvas><canvas id="chart-produtos" style="width:100%;height:240px;margin-top:16px;"></canvas><div style="margin-top:12px;"><button id="export-csv" style="background:#4caf50;color:#fff;border:none;border-radius:8px;padding:10px;">Exportar CSV</button></div></div></div>`; 
        document.body.appendChild(div); 
        div.querySelector(".dashboard-close").addEventListener("click", () => UIManager.closeAll()); 
    }  
    
    function createAdminFab() { 
        if (el.reportsBtn) { 
            el.reportsBtn.style.display = "block"; 
            el.reportsBtn.addEventListener("click", () => { 
                createDashboard(); 
                ensureChartJS(() => carregarRelatorios("7")); 
                UIManager.open("admin", document.getElementById("admin-dashboard")); 
            }); 
        } 
    }  
    
    function gerarResumoECharts(pedidos) { 
        if (!window.Chart) return; 
        const ctxPedidos = document.getElementById('chart-pedidos')?.getContext('2d'); 
        const ctxProdutos = document.getElementById('chart-produtos')?.getContext('2d'); 
        if (!ctxPedidos || !ctxProdutos) return; 
        
        const pedidosPorDia = {}; 
        const produtosContagem = {}; 
        
        pedidos.forEach(p => { 
            const dia = (p.data?.toDate?.() || new Date(p.data)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); 
            pedidosPorDia[dia] = (pedidosPorDia[dia] || 0) + 1; 
            (Array.isArray(p.itens) ? p.itens : []).forEach(itemStr => { 
                const nome = itemStr.split(' x')[0]; 
                if (nome) produtosContagem[nome] = (produtosContagem[nome] || 0) + 1; 
            }); 
        }); 
        
        const labelsPedidos = Object.keys(pedidosPorDia).reverse(); 
        const dataPedidos = Object.values(pedidosPorDia).reverse(); 
        
        if (chartPedidos) chartPedidos.destroy(); 
        chartPedidos = new Chart(ctxPedidos, { 
            type: 'line', 
            data: { 
                labels: labelsPedidos, 
                datasets: [{ label: 'Pedidos', data: dataPedidos, borderColor: '#ffb300', tension: 0.1 }] 
            }, 
            options: { scales: { x: { ticks: { maxRotation: 45, minRotation: 45 } } } } 
        }); 
        
        const produtosOrdenados = Object.entries(produtosContagem).sort(([, a], [, b]) => b - a).slice(0, 10); 
        if (chartProdutos) chartProdutos.destroy(); 
        chartProdutos = new Chart(ctxProdutos, { 
            type: 'bar', 
            data: { 
                labels: produtosOrdenados.map(p=>p[0]), 
                datasets: [{ label: 'Mais Vendidos', data: produtosOrdenados.map(p=>p[1]), backgroundColor: '#ff7043' }] 
            }, 
            options: { indexAxis: 'y' } 
        }); 
    }  
    
    function carregarRelatorios(periodo = "7") { 
        const start = new Date(); 
        if (periodo !== "all") start.setDate(start.getDate() - Number(periodo)); 
        else start.setTime(0); 
        
        db.collection("Pedidos").orderBy("data", "desc").get().then(snap => { 
            const pedidos = snap.docs.map(d => { 
                const dataObjeto = d.data(); 
                const rawDate = dataObjeto.data; 
                let processedDate; 
                if (rawDate && typeof rawDate.toDate === 'function') processedDate = rawDate.toDate(); 
                else if (rawDate) processedDate = new Date(rawDate); 
                else processedDate = new Date(); 
                return { ...dataObjeto, id: d.id, data: processedDate }; 
            }); 
            const filtrados = pedidos.filter(p => p.data >= start); 
            gerarResumoECharts(filtrados); 
            document.getElementById("card-total").textContent = `Total: ${money(filtrados.reduce((s, p) => s + (Number(p.total) || 0), 0))}`; 
            document.getElementById("card-pedidos").textContent = `Pedidos: ${filtrados.length}`; 
            document.getElementById("card-ticket").textContent = `Ticket Médio: ${money(filtrados.length ? filtrados.reduce((s, p) => s + (Number(p.total) || 0), 0)/filtrados.length : 0)}`; 
            
            document.getElementById("export-csv").onclick = () => { 
                const csv = "Data;Nome;Total\n" + filtrados.map(p => `${p.data.toLocaleString()};${p.nome};${p.total}`).join("\n"); 
                const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }); 
                const link = document.createElement('a'); 
                link.href = URL.createObjectURL(blob); 
                link.download = "pedidos.csv"; 
                link.click(); 
            }; 
        }); 
        
        const sel = document.getElementById("filter-period"); 
        if(sel && !sel._bound) { 
            sel.addEventListener("change", e => carregarRelatorios(e.target.value)); 
            sel._bound = true; 
        } 
    }

    /* ------------------ 🚨 STATUS BANNER & TIMER ------------------ */
    const atualizarStatus = safe(() => {  
        const agora = new Date(); const h = agora.getHours();  
        const aberto = h >= 18 && h < 23;   
        if (el.statusBanner) { 
            el.statusBanner.textContent = aberto ? "🟢 Aberto — Faça seu pedido!" : "🔴 Fechado — Voltamos às 18h!"; 
            el.statusBanner.className = `status-banner ${aberto ? "open" : "closed"}`; 
        }  
    });  
    atualizarStatus(); setInterval(atualizarStatus, 60000);  

    const atualizarTimer = safe(() => {  
        const agora = new Date(); const fim = new Date(); fim.setHours(23, 59, 59, 999); const diff = fim - agora;  
        const elTimer = document.getElementById("promo-timer"); if (!elTimer) return;  
        if (diff <= 0) return (elTimer.textContent = "00:00:00");  
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0"); const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"); const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");  
        elTimer.textContent = `${h}:${m}:${s}`;  
    });  
    atualizarTimer(); setInterval(atualizarTimer, 1000);

    /* ------------------ 🍪 COOKIES ------------------ */
    const cookieBanner = document.getElementById("cookie-banner"); 
    const cookieAcceptBtn = document.getElementById("cookie-accept");  
    if (cookieBanner && cookieAcceptBtn) { 
        if (localStorage.getItem("dfl-cookies-accepted") === "true") {
            cookieBanner.style.display = "none"; 
            cookieBanner.classList.remove("show");
        } else { 
            cookieBanner.style.display = "flex";
            setTimeout(() => cookieBanner.classList.add("show"), 100);
        } 
        cookieAcceptBtn.addEventListener("click", () => { 
            localStorage.setItem("dfl-cookies-accepted", "true"); 
            cookieBanner.classList.remove("show"); 
            setTimeout(() => { cookieBanner.style.display = "none"; }, 500);
        }); 
    }

    /* ------------------ 🚀 INICIALIZAÇÃO FINAL ------------------ */
    console.log("%c🔥 DFL v9.2 — SISTEMA UI BLINDADO + PIX ESTÁTICO!", "background:#4CAF50;color:#fff;padding:5px;border-radius:5px;font-weight:bold;");  
    console.log("%c✅ UIManager implementado com anti-spam", "color:#4CAF50;");
    console.log("%c✅ Modal PIX integrado perfeitamente", "color:#4CAF50;");
    console.log("%c✅ Fluxo de pagamento preservado", "color:#4CAF50;");
    console.log("%c✅ Nenhuma função original removida", "color:#4CAF50;");
    console.log("%c✅ Firebase, ViaCEP, Cupons, Recompensas intactos", "color:#4CAF50;");
    
    renderPromoCards();
    inicializarFirebase();  

}); // ✅ FIM DO DOMContentLoaded
