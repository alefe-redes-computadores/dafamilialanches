document.addEventListener("DOMContentLoaded", () => {
    const sound = new Audio("click.wav");
    let cart = [],
        currentUser = null;
    const TAXA_ENTREGA = 6,
        CUPONS = {
            FAMILIA10: {
                tipo: "percentual",
                valor: 10
            },
            PRIMEIRO: {
                tipo: "fixo",
                valor: 5
            },
            FRETEGRATIS: {
                tipo: "frete",
                valor: 0
            }
        };
    let cupomAplicado = null,
        enderecoCliente = "";
    const money = n => `R$ ${Number(n||0).toFixed(2).replace(".",",")}`,
        safe = fn => (...a) => {
            try {
                fn(...a)
            } catch (e) {
                console.error(e)
            }
        };
    document.addEventListener("click", () => {
        try {
            sound.currentTime = 0;
            sound.play()
        } catch (_) {}
    });
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
        hoursBanner: document.querySelector(".hours-banner")
    };
    if (!el.cartBackdrop) {
        const bd = document.createElement("div");
        bd.id = "cart-backdrop";
        bd.onclick = () => Overlays.closeAll();
        document.body.appendChild(bd);
        el.cartBackdrop = bd
    }
    const Backdrop = {
            show() {
                el.cartBackdrop.style.display = "block";
                document.body.style.overflow = "hidden"
            },
            hide() {
                el.cartBackdrop.style.display = "none";
                document.body.style.overflow = ""
            }
        },
        Overlays = {
            closeAll() {
                document.querySelectorAll(".modal.show, #mini-cart.active, .orders-panel.active").forEach(e => e.classList.remove("show", "active"));
                Backdrop.hide()
            },
            open(modalLike) {
                Overlays.closeAll();
                if (!modalLike) return;
                modalLike.classList.add(modalLike.id === "mini-cart" ? "active" : "show");
                Backdrop.show()
            }
        };

    function popupAdd(msg) {
        let pop = document.querySelector(".popup-add");
        if (!pop) {
            pop = document.createElement("div");
            pop.className = "popup-add";
            document.body.appendChild(pop)
        }
        pop.textContent = msg;
        pop.classList.add("show");
        setTimeout(() => pop.classList.remove("show"), 2e3)
    }

    function renderMiniCart() {
        if (!el.miniList || !el.miniFoot) return;
        const totalItens = cart.reduce((s, i) => s + i.qtd, 0);
        if (el.cartCount) el.cartCount.textContent = totalItens;
        if (!cart.length) {
            el.miniList.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Carrinho vazio 🛒</p>';
            el.miniFoot.innerHTML = "";
            return
        }
        el.miniList.innerHTML = cart.map((item, idx) => `<div style="border-bottom:1px solid #eee;padding:10px 0;"><div style="display:flex;justify-content:space-between;align-items:center;"><div style="flex:1;"><p style="font-weight:600;margin-bottom:4px;">${item.nome}</p><p style="color:#666;font-size:0.85rem;">${money(item.preco)} × ${item.qtd}</p></div><div style="display:flex;gap:8px;align-items:center;"><button class="cart-minus" data-idx="${idx}" style="background:#ff4081;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">−</button><span style="font-weight:600;min-width:20px;text-align:center;">${item.qtd}</span><button class="cart-plus" data-idx="${idx}" style="background:#4caf50;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">+</button><button class="cart-remove" data-idx="${idx}" style="background:#d32f2f;color:#fff;border:none;border-radius:5px;width:28px;height:28px;cursor:pointer;">🗑</button></div></div></div>`).join("");
        let subtotal = cart.reduce((s, i) => s + i.preco * i.qtd, 0),
            desconto = 0,
            taxaEntrega = TAXA_ENTREGA;
        if (cupomAplicado && CUPONS[cupomAplicado]) {
            const c = CUPONS[cupomAplicado];
            if (c.tipo === "percentual") desconto = subtotal * (c.valor / 100);
            else if (c.tipo === "fixo") desconto = c.valor;
            else if (c.tipo === "frete") taxaEntrega = 0
        }
        const total = subtotal + taxaEntrega - desconto;
        el.miniFoot.innerHTML = `<div style="padding:15px;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>Subtotal:</span><span>${money(subtotal)}</span></div><div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>🚚 Entrega:</span><span>${money(taxaEntrega)}</span></div>${desconto>0?`<div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#4caf50;"><span>Desconto:</span><span>-${money(desconto)}</span></div>`:""}<<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:1.2rem;font-weight:700;border-top:1px solid #ddd;padding-top:10px;"><span>Total:</span><span style="color:#e53935;">${money(total)}</span></div><div style="margin-top:15px;"><label style="font-weight:600;display:block;margin-bottom:5px;">📍 Endereço:</label><textarea id="endereco-input" placeholder="Rua, número, bairro..." style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;resize:vertical;min-height:60px;">${enderecoCliente}</textarea></div><div style="margin-top:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🎟️ Cupom:</label><div style="display:flex;gap:6px;"><input id="cupom-input" type="text" placeholder="Digite o cupom" style="flex:1;padding:10px;border:1px solid #ccc;border-radius:8px;text-transform:uppercase;" value="${cupomAplicado||""}"><button id="apply-cupom" style="background:#ffb300;color:#000;border:none;border-radius:8px;padding:10px 14px;font-weight:600;cursor:pointer;">Aplicar</button></div></div><button id="finish-order" style="width:100%;background:#4caf50;color:#fff;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;margin-top:12px;">Finalizar 🛍️</button><button id="clear-cart" style="width:100%;background:#ff4081;color:#fff;border:none;border-radius:8px;padding:10px;font-weight:600;cursor:pointer;margin-top:8px;">Limpar</button></div>`;
        document.querySelectorAll(".cart-plus").forEach(b => b.onclick = e => {
            cart[+e.currentTarget.dataset.idx].qtd++;
            renderMiniCart()
        });
        document.querySelectorAll(".cart-minus").forEach(b => b.onclick = e => {
            const i = +e.currentTarget.dataset.idx;
            if (cart[i].qtd > 1) cart[i].qtd--;
            else cart.splice(i, 1);
            renderMiniCart()
        });
        document.querySelectorAll(".cart-remove").forEach(b => b.onclick = e => {
            cart.splice(+e.currentTarget.dataset.idx, 1);
            renderMiniCart();
            popupAdd("Removido!")
        });
        document.getElementById("apply-cupom").onclick = () => {
            const val = document.getElementById("cupom-input").value.trim().toUpperCase();
            if (!val) {
                cupomAplicado = null;
                popupAdd("Cupom removido")
            } else if (!CUPONS[val]) {
                popupAdd("Cupom inválido ❌");
                cupomAplicado = null
            } else {
                cupomAplicado = val;
                popupAdd(`Cupom ${val} aplicado! 🎉`)
            }
            renderMiniCart()
        };
        document.getElementById("endereco-input").oninput = e => enderecoCliente = e.target.value;
        document.getElementById("finish-order").onclick = fecharPedido;
        document.getElementById("clear-cart").onclick = () => {
            if (confirm("Limpar?")) {
                cart = [];
                renderMiniCart();
                popupAdd("Limpo!")
            }
        }
    }
    el.cartIcon.onclick = () => Overlays.open(el.miniCart);
    document.querySelectorAll("#mini-cart .extras-close").forEach(b => b.onclick = () => Overlays.closeAll());
    const adicionais = [{
        nome: "Cebola",
        preco: .99
    }, {
        nome: "Salada",
        preco: 1.99
    }, {
        nome: "Ovo",
        preco: 1.99
    }, {
        nome: "Bacon",
        preco: 2.99
    }, {
        nome: "Hambúrguer Tradicional 56g",
        preco: 2.99
    }, {
        nome: "Cheddar Cremoso",
        preco: 3.99
    }, {
        nome: "Filé de Frango",
        preco: 5.99
    }, {
        nome: "Hambúrguer Artesanal 120g",
        preco: 7.99
    }];
    let produtoExtras = null,
        produtoPrecoBase = 0;
    const openExtrasFor = safe(card => {
        if (!card || !el.extrasModal || !el.extrasList) return;
        produtoExtras = card.dataset.name;
        produtoPrecoBase = parseFloat(card.dataset.price) || 0;
        el.extrasList.innerHTML = adicionais.map((a, i) => `<label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;cursor:pointer;"><span>${a.nome} — <b>${money(a.preco)}</b></span><input type="checkbox" value="${i}" style="width:20px;height:20px;cursor:pointer;"></label>`).join("");
        Overlays.open(el.extrasModal)
    });
    document.querySelectorAll(".extras-btn").forEach(btn => btn.onclick = e => openExtrasFor(e.currentTarget.closest(".card")));
    el.extrasConfirm.onclick = () => {
        if (!produtoExtras) return Overlays.closeAll();
        const checks = [...document.querySelectorAll("#extras-modal .extras-list input:checked")];
        if (!checks.length) return alert("Selecione ao menos um!");
        const extrasContagem = {};
        checks.forEach(c => {
            const a = adicionais[+c.value];
            if (extrasContagem[a.nome]) extrasContagem[a.nome].qtd++;
            else extrasContagem[a.nome] = {
                preco: a.preco,
                qtd: 1
            }
        });
        const extrasNomes = Object.keys(extrasContagem).map(n => {
            const q = extrasContagem[n].qtd;
            return q > 1 ? `${q}x ${n}` : n
        }).join(", ");
        const precoExtras = Object.values(extrasContagem).reduce((t, e) => t + e.preco * e.qtd, 0);
        const precoTotal = produtoPrecoBase + precoExtras;
        const nomeCompleto = `${produtoExtras} + ${extrasNomes}`;
        const existente = cart.find(i => i.nome === nomeCompleto);
        if (existente) existente.qtd++;
        else cart.push({
            nome: nomeCompleto,
            preco: precoTotal,
            qtd: 1
        });
        renderMiniCart();
        popupAdd("Adicionado!");
        Overlays.closeAll()
    };
    document.querySelectorAll("#extras-modal .extras-close").forEach(b => b.onclick = () => Overlays.closeAll());
    const comboDrinkOptions = {
        casal: [{
            rotulo: "Fanta 1L (padrão)",
            delta: .01
        }, {
            rotulo: "Coca-Cola 1L",
            delta: 3
        }, {
            rotulo: "Coca-Cola 1L Zero",
            delta: 3
        }],
        familia: [{
            rotulo: "Kuat Guaraná 2L (padrão)",
            delta: .01
        }, {
            rotulo: "Coca-Cola 2L",
            delta: 5
        }]
    };
    let _comboCtx = null;
    const openComboModal = safe((nomeCombo, precoBase) => {
        if (!el.comboModal || !el.comboBody) {
            addCommonItem(nomeCombo, precoBase);
            return
        }
        const low = (nomeCombo || "").toLowerCase();
        const grupo = low.includes("casal") ? "casal" : low.includes("família") || low.includes("familia") ? "familia" : null;
        if (!grupo) {
            addCommonItem(nomeCombo, precoBase);
            return
        }
        const opts = comboDrinkOptions[grupo];
        el.comboBody.innerHTML = opts.map((o, i) => `<label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;cursor:pointer;"><span>${o.rotulo} — + ${money(o.delta)}</span><input type="radio" name="combo-drink" value="${i}" ${i===0?"checked":""} style="width:20px;height:20px;cursor:pointer;"></label>`).join("");
        _comboCtx = {
            nomeCombo,
            precoBase,
            grupo
        };
        Overlays.open(el.comboModal)
    });
    el.comboConfirm.onclick = () => {
        if (!_comboCtx) return Overlays.closeAll();
        const sel = el.comboBody.querySelector('input[name="combo-drink"]:checked');
        if (!sel) return;
        const opt = comboDrinkOptions[_comboCtx.grupo][+sel.value];
        const finalName = `${_comboCtx.nomeCombo} + ${opt.rotulo}`;
        const finalPrice = Number(_comboCtx.precoBase) + (opt.delta || 0);
        const existente = cart.find(i => i.nome === finalName);
        if (existente) existente.qtd++;
        else cart.push({
            nome: finalName,
            preco: finalPrice,
            qtd: 1
        });
        popupAdd("Combo adicionado!");
        renderMiniCart();
        Overlays.closeAll()
    };
    document.querySelectorAll("#combo-modal .combo-close").forEach(b => b.onclick = () => Overlays.closeAll());

    function addCommonItem(nome, preco) {
        if (/^combo/i.test(nome)) {
            openComboModal(nome, preco);
            return
        }
        const found = cart.find(i => i.nome === nome && i.preco === preco);
        if (found) found.qtd++;
        else cart.push({
            nome,
            preco,
            qtd: 1
        });
        renderMiniCart();
        popupAdd(`${nome} adicionado!`)
    }
    document.querySelectorAll(".add-cart").forEach(btn => btn.onclick = e => {
        const card = e.currentTarget.closest(".card");
        if (!card) return;
        addCommonItem(card.dataset.name, parseFloat(card.dataset.price))
    });
    el.cPrev.onclick = () => {
        if (el.slides) el.slides.scrollLeft -= 320
    };
    el.cNext.onclick = () => {
        if (el.slides) el.slides.scrollLeft += 320
    };
    const firebaseConfig = {
        apiKey: "AIzaSyATQBcbYuzKpKlSwNlbpRiAM1XyHqhGeak",
        authDomain: "da-familia-lanches.firebaseapp.com",
        projectId: "da-familia-lanches",
        storageBucket: "da-familia-lanches.appspot.com",
        messagingSenderId: "106857147317",
        appId: "1:106857147317:web:769c98aed26bb8fc9e87fc"
    };
    if (window.firebase && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth(),
        db = firebase.firestore();
    el.userBtn.onclick = () => Overlays.open(el.loginModal);
    document.querySelectorAll("#login-modal .login-close").forEach(b => b.onclick = () => Overlays.closeAll());
    el.loginForm.onsubmit = e => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const senha = document.getElementById("login-senha").value.trim();
        if (!email || !senha) return alert("Preencha e-mail e senha");
        auth.signInWithEmailAndPassword(email, senha).then(c => {
            currentUser = c.user;
            el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0]||currentUser.email.split("@")[0]}`;
            Overlays.closeAll();
            showOrdersFabIfLogged();
            popupAdd("Login OK!")
        }).catch(() => {
            auth.createUserWithEmailAndPassword(email, senha).then(c => {
                currentUser = c.user;
                el.userBtn.textContent = `Olá, ${currentUser.email.split("@")[0]}`;
                Overlays.closeAll();
                popupAdd("Conta criada! 🎉");
                showOrdersFabIfLogged()
            }).catch(err => alert("Erro: " + err.message))
        })
    };
    el.googleBtn.onclick = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(res => {
            currentUser = res.user;
            el.userBtn.textContent = `Olá, ${currentUser.displayName?.split(" ")[0]||"Cliente"}`;
            Overlays.closeAll();
            showOrdersFabIfLogged();
            popupAdd("Login Google OK!")
        }).catch(err => alert("Erro: " + err.message))
    };
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            el.userBtn.textContent = `Olá, ${user.displayName?.split(" ")[0]||user.email.split("@")[0]}`
        } else {
            currentUser = null;
            el.userBtn.textContent = "Entrar / Cadastrar"
        }
        showOrdersFabIfLogged()
    });

    function fecharPedido() {
        if (!cart.length) return alert("Carrinho vazio!");
        if (!currentUser) {
            alert("Faça login!");
            Overlays.open(el.loginModal);
            return
        }
        const addr = (document.getElementById("endereco-input") ? .value || "").trim();
        if (!addr) return alert("Informe o endereço!");
        let subtotal = cart.reduce((s, i) => s + i.preco * i.qtd, 0),
            desconto = 0,
            taxaEntrega = TAXA_ENTREGA;
        if (cupomAplicado && CUPONS[cupomAplicado]) {
            const c = CUPONS[cupomAplicado];
            if (c.tipo === "percentual") desconto = subtotal * (c.valor / 100);
            else if (c.tipo === "fixo") desconto = c.valor;
            else if (c.tipo === "frete") taxaEntrega = 0
        }
        const total = subtotal + taxaEntrega - desconto;
        const pedido = {
            usuario: currentUser.email,
            userId: currentUser.uid,
            nome: currentUser.displayName || currentUser.email.split("@")[0],
            itens: cart.map(i => `${i.nome} x${i.qtd}`),
            subtotal: Number(subtotal.toFixed(2)),
            entrega: Number(taxaEntrega.toFixed(2)),
            desconto: Number(desconto.toFixed(2)),
            cupom: cupomAplicado || "",
            total: Number(total.toFixed(2)),
            endereco: addr,
            data: new Date().toISOString()
        };
        db.collection("Pedidos").add(pedido).then(() => {
            popupAdd("Pedido salvo ✅");
            const linhas = ["🍔 *Pedido DFL*", "", cart.map(i => `• ${i.nome} x${i.qtd}`).join("\n"), "", `Subtotal: ${money(subtotal)}`, `Entrega: ${money(taxaEntrega)}`, desconto > 0 ? `Desconto (${cupomAplicado}): -${money(desconto)}` : "", `*Total: ${money(total)}*`, "", `📍 *Endereço:* ${addr}`].filter(l => l).join("\n");
            const texto = encodeURIComponent(linhas);
            window.open(`https://wa.me/5534997178336?text=${texto}`, "_blank");
            cart = [];
            cupomAplicado = null;
            enderecoCliente = "";
            renderMiniCart();
            Overlays.closeAll()
        }).catch(err => alert("Erro: " + err.message))
    }
    let ordersFab = document.getElementById("orders-fab");
    if (!ordersFab) {
        ordersFab = document.createElement("button");
        ordersFab.id = "orders-fab";
        ordersFab.innerHTML = "📦 Meus Pedidos";
        document.body.appendChild(ordersFab)
    }
    let ordersPanel = document.querySelector(".orders-panel");
    if (!ordersPanel) {
        ordersPanel = document.createElement("div");
        ordersPanel.className = "orders-panel";
        ordersPanel.innerHTML = '<div class="orders-head"><span>📦 Meus Pedidos</span><button class="orders-close">✖</button></div><div class="orders-content" id="orders-content"><p class="empty-orders">Faça login.</p></div>';
        document.body.appendChild(ordersPanel)
    }
    ordersFab.onclick = () => {
        if (!currentUser) return alert("Faça login!");
        Overlays.open(ordersPanel);
        carregarPedidos()
    };
    ordersPanel.querySelector(".orders-close").onclick = () => Overlays.closeAll();

    function showOrdersFabIfLogged() {
        if (currentUser) ordersFab.classList.add("show");
        else ordersFab.classList.remove("show")
    }

    function carregarPedidos() {
        const container = document.getElementById("orders-content");
        if (!container) return;
        container.innerHTML = '<p class="empty-orders">Carregando...</p>';
        if (!currentUser) {
            container.innerHTML = '<p class="empty-orders">Faça login.</p>';
            return
        }
        db.collection("Pedidos").where("usuario", "==", currentUser.email).get().then(snap => {
            if (snap.empty) {
                container.innerHTML = '<p class="empty-orders">Nenhum pedido 😢</p>';
                return
            }
            const pedidos = [];
            snap.forEach(doc => pedidos.push({
                id: doc.id,
                ...doc.data()
            }));
            pedidos.sort((a, b) => new Date(b.data) - new Date(a.data));
            container.innerHTML = "";
            pedidos.forEach(p => {
                const itens = Array.isArray(p.itens) ? p.itens.join("<br>• ") : p.itens || "";
                const dataFormatada = new Date(p.data).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
                const box = document.createElement("div");
                box.className = "order-item";
                box.innerHTML = `<h4>📅 ${dataFormatada}</h4><p style="margin:8px 0;"><b>Itens:</b><br>• ${itens}</p>${p.endereco?`<p style="margin:6px 0;"><b>📍:</b> ${p.endereco}</p>`:""}${p.cupom?`<p style="margin:6px 0;color:#4caf50;"><b>🎟️:</b> ${p.cupom}</p>`:""}<div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;"><p><b>Subtotal:</b> ${money(p.subtotal||0)}</p><p><b>Entrega:</b> ${money(p.entrega||0)}</p>${p.desconto>0?`<p style="color:#4caf50;"><b>Desconto:</b> -${money(p.desconto)}</p>`:""}<p style="font-size:1.1rem;color:#4caf50;font-weight:700;margin-top:6px;"><b>Total:</b> ${money(p.total)}</p></div>`;
                container.appendChild(box)
            })
        }).catch(err => {
            container.innerHTML = `<p class="empty-orders" style="color:#d32f2f;">Erro: ${err.message}</p>`
        })
    }
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") Overlays.closeAll()
    });
    renderMiniCart();
    console.log("%c🔥 DFL v2.7 FUNCIONAL!", "color:#fff;background:#4caf50;padding:8px;border-radius:8px;font-weight:700")
});
