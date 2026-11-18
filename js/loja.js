// Vitrine, carrinho e pedidos da cliente.

(function () {
  const PRODUCTS_KEY = "bangtan-house-products";
  const CATEGORIES_KEY = "bangtan-house-categories";
  const SESSION_KEY = "bangtan-house-session";
  const SHOP_KEY = "bangtan-house-shop";
  const PIX_RECEIVER = "BANGTAN HOUSE";
  const PIX_CITY = "CRATEUS";
  const PIX_TTL_MS = 15 * 60 * 1000;

  const viewHome = document.getElementById("view-home");
  const greeting = document.getElementById("cliente-ola");
  const nameFilter = document.getElementById("filtro-nome");
  const minFilter = document.getElementById("filtro-min");
  const maxFilter = document.getElementById("filtro-max");
  const categoryFilters = document.getElementById("filtro-categorias");
  const productList = document.getElementById("vitrine-lista");
  const cartList = document.getElementById("lista-carrinho");
  const cartTotal = document.getElementById("carrinho-total");
  const cartNotice = document.getElementById("carrinho-aviso");
  const cartCount = document.getElementById("cart-count");
  const checkoutButton = document.getElementById("seguir-compra");
  const pixBox = document.getElementById("pix-box");
  const pixHelp = document.getElementById("pix-instrucao");
  const pixDeadline = document.getElementById("pix-expira");
  const pixCode = document.getElementById("pix-code");
  const pixCopy = document.getElementById("pix-copiar");
  const orderList = document.getElementById("lista-pedidos");
  const panels = {
    vitrine: document.getElementById("painel-vitrine"),
    carrinho: document.getElementById("painel-carrinho"),
    pedidos: document.getElementById("painel-pedidos")
  };
  const titles = {
    vitrine: "Bangtan House · Produtos",
    carrinho: "Bangtan House · Carrinho",
    pedidos: "Bangtan House · Pedidos"
  };

  let categoryFilter = "";
  let pixTimer = 0;
  let expirySignature = "";

  function readJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "");
      return parsed === undefined || parsed === null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function readSession() {
    const session = readJson(SESSION_KEY, null);
    if (!session || typeof session.email !== "string" || typeof session.name !== "string") return null;
    if (session.email === window.BangtanAdminEmail) return null;
    return session;
  }

  function isCustomerOpen() {
    return Boolean(readSession()) && viewHome && !viewHome.hidden;
  }

  function cartKey(email) {
    return `bangtan-house-cart:${email}`;
  }

  function orderKey(email) {
    return `bangtan-house-orders:${email}`;
  }

  function readCart() {
    const session = readSession();
    if (!session) return [];
    const cart = readJson(cartKey(session.email), []);
    return Array.isArray(cart) ? cart : [];
  }

  function writeCart(cart) {
    const session = readSession();
    if (!session) return;
    localStorage.setItem(cartKey(session.email), JSON.stringify(cart));
  }

  function readOrders() {
    const session = readSession();
    if (!session) return [];
    const orders = readJson(orderKey(session.email), []);
    return Array.isArray(orders) ? orders : [];
  }

  function writeOrders(orders) {
    const session = readSession();
    if (!session) return;
    localStorage.setItem(orderKey(session.email), JSON.stringify(orders));
  }

  function readProducts() {
    const products = readJson(PRODUCTS_KEY, []);
    return Array.isArray(products) ? products : [];
  }

  function readCategories() {
    const categories = readJson(CATEGORIES_KEY, []);
    return Array.isArray(categories) ? categories : [];
  }

  function formatPrice(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function maskMoney(value) {
    const digits = String(value).replace(/\D/g, "").slice(0, 8);
    if (!digits) return "";
    return (Number(digits) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function parseMoney(value) {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) return null;
    return Number(digits) / 100;
  }

  function money(value) {
    return Math.round(value * 100) / 100;
  }

  function showNotice(message, ok) {
    const success = Boolean(ok && message);
    cartNotice.hidden = !message;
    cartNotice.querySelector("span").textContent = message || "";
    cartNotice.classList.toggle("ok", success);
    cartNotice.querySelector(".banner-close").hidden = !success;
  }

  function showShop(name) {
    const current = panels[name] ? name : "vitrine";
    sessionStorage.setItem(SHOP_KEY, current);
    Object.entries(panels).forEach(([key, panel]) => {
      panel.hidden = key !== current;
    });
    document.querySelectorAll("[data-shop]").forEach((button) => {
      if (button.dataset.shop === current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (!viewHome.hidden) document.title = titles[current];
  }

  function renderFilters() {
    const categories = readCategories();
    categoryFilters.replaceChildren();
    const all = document.createElement("button");
    all.type = "button";
    all.className = "chip";
    all.textContent = "Todas";
    all.setAttribute("aria-pressed", String(!categoryFilter));
    all.addEventListener("click", () => {
      categoryFilter = "";
      renderFilters();
      renderProducts();
    });
    categoryFilters.append(all);
    categories.forEach((category) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = category.name;
      chip.setAttribute("aria-pressed", String(categoryFilter === category.id));
      chip.addEventListener("click", () => {
        categoryFilter = category.id;
        renderFilters();
        renderProducts();
      });
      categoryFilters.append(chip);
    });
  }

  function filteredProducts() {
    const min = parseMoney(minFilter.value);
    const max = parseMoney(maxFilter.value);
    const query = nameFilter.value.trim().toLocaleLowerCase("pt-BR");
    return readProducts().filter((product) => {
      if (categoryFilter && product.categoryId !== categoryFilter) return false;
      if (query && !product.name.toLocaleLowerCase("pt-BR").includes(query)) return false;
      if (min !== null && product.price < min) return false;
      if (max !== null && product.price > max) return false;
      return true;
    });
  }

  function renderProducts() {
    const products = filteredProducts();
    const categories = readCategories();
    productList.replaceChildren();
    if (!readProducts().length) {
      const empty = document.createElement("li");
      empty.className = "shop-empty";
      empty.textContent = "Nenhum produto cadastrado ainda.";
      productList.append(empty);
      return;
    }
    if (!products.length) {
      const empty = document.createElement("li");
      empty.className = "shop-empty";
      empty.textContent = "Nenhum produto encontrado com esses filtros.";
      productList.append(empty);
      return;
    }

    products.forEach((product) => {
      const card = document.createElement("li");
      card.className = "vitrine-card";
      card.dataset.productId = product.id;

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.name;

      const name = document.createElement("strong");
      name.textContent = product.name;

      const category = categories.find((item) => item.id === product.categoryId);
      const categoryName = document.createElement("span");
      categoryName.className = "vitrine-categoria";
      categoryName.textContent = category ? category.name : "Sem categoria";

      const price = document.createElement("span");
      price.className = "vitrine-valor";
      price.textContent = formatPrice(product.price);

      const description = document.createElement("p");
      description.className = "vitrine-descricao";
      description.textContent = product.description || "";

      const controls = document.createElement("div");
      controls.className = "qty add-qty";

      const down = document.createElement("button");
      down.type = "button";
      down.setAttribute("aria-label", `Diminuir quantidade de ${product.name}`);
      down.textContent = "−";

      const count = document.createElement("span");
      count.className = "add-qty-value";
      count.textContent = "1";

      const up = document.createElement("button");
      up.type = "button";
      up.setAttribute("aria-label", `Aumentar quantidade de ${product.name}`);
      up.textContent = "+";

      const add = document.createElement("button");
      add.type = "button";
      add.className = "button-primary";

      const feedback = document.createElement("p");
      feedback.className = "add-feedback";
      feedback.setAttribute("aria-live", "polite");

      function paintQty(next) {
        const value = Math.min(99, Math.max(1, next));
        count.textContent = String(value);
        add.textContent = value === 1
          ? "Adicionar 1 ao carrinho"
          : `Adicionar ${value} ao carrinho`;
      }

      function chosenQty() {
        return Number(count.textContent) || 1;
      }

      function showInCart(value) {
        const line = document.createElement("span");
        line.textContent = value === 1 ? "No carrinho: 1" : `No carrinho: ${value}`;
        feedback.replaceChildren(line);
      }

      down.addEventListener("click", () => {
        paintQty(chosenQty() - 1);
        if (readCart().some((item) => item.productId === product.id)) {
          const value = chosenQty();
          setCartQty(product, category ? category.name : "", value);
          showInCart(value);
        }
      });
      up.addEventListener("click", () => {
        paintQty(chosenQty() + 1);
        if (readCart().some((item) => item.productId === product.id)) {
          const value = chosenQty();
          setCartQty(product, category ? category.name : "", value);
          showInCart(value);
        }
      });
      add.addEventListener("click", () => {
        const value = chosenQty();
        setCartQty(product, category ? category.name : "", value);
        showInCart(value);
      });

      const saved = readCart().find((item) => item.productId === product.id);
      paintQty(saved ? saved.qty : 1);
      controls.append(down, count, up);
      card.append(image, name, categoryName, price, description, controls, add, feedback);
      productList.append(card);
    });
  }

  function applyCardQty(productId, qty) {
    const card = productList.querySelector(`[data-product-id="${productId}"]`);
    if (!card) return;
    const count = card.querySelector(".add-qty-value");
    const button = card.querySelector(".button-primary");
    if (!count || !button) return;
    const value = Math.min(99, Math.max(1, qty));
    count.textContent = String(value);
    button.textContent = value === 1
      ? "Adicionar 1 ao carrinho"
      : `Adicionar ${value} ao carrinho`;
  }

  function setCartQty(product, categoryName, qty) {
    if (!isCustomerOpen()) return;
    const amount = Math.min(99, Math.max(1, Number(qty) || 1));
    const cart = readCart();
    const current = cart.find((item) => item.productId === product.id);
    if (current) {
      current.qty = amount;
      current.name = product.name;
      current.price = product.price;
      current.image = product.image;
      current.categoryName = categoryName;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        categoryName,
        qty: amount
      });
    }
    writeCart(cart);
    pixBox.hidden = true;
    showNotice("");
    renderCart();
  }

  function changeQty(productId, delta) {
    const cart = readCart()
      .map((item) => (item.productId === productId ? { ...item, qty: item.qty + delta } : item))
      .filter((item) => item.qty > 0);
    writeCart(cart);
    pixBox.hidden = true;
    showNotice("");
    renderCart();
    if (!cart.some((item) => item.productId === productId)) applyCardQty(productId, 1);
  }

  function renderCart() {
    const cart = readCart();
    const units = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.hidden = units === 0;
    cartCount.textContent = String(units);
    cartList.replaceChildren();
    checkoutButton.disabled = cart.length === 0;
    checkoutButton.hidden = cart.length === 0;

    if (!cart.length) {
      const empty = document.createElement("li");
      empty.className = "shop-empty";
      empty.textContent = "Seu carrinho está vazio.";
      cartList.append(empty);
      cartTotal.hidden = true;
      return;
    }

    cart.forEach((item) => {
      const row = document.createElement("li");
      row.className = "cart-item";

      const image = document.createElement("img");
      image.src = item.image;
      image.alt = "";

      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = item.name;
      const meta = document.createElement("span");
      meta.textContent = `${item.categoryName || "Sem categoria"} · ${formatPrice(item.price)}`;
      info.append(name, meta);

      const qty = document.createElement("div");
      qty.className = "qty";
      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", `Diminuir ${item.name}`);
      minus.addEventListener("click", () => changeQty(item.productId, -1));
      const amount = document.createElement("span");
      amount.textContent = String(item.qty);
      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", `Aumentar ${item.name}`);
      plus.addEventListener("click", () => changeQty(item.productId, 1));
      qty.append(minus, amount, plus);

      const subtotal = document.createElement("strong");
      subtotal.className = "cart-subtotal";
      subtotal.textContent = formatPrice(money(item.price * item.qty));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-remove";
      remove.textContent = "Remover";
      remove.addEventListener("click", () => {
        writeCart(readCart().filter((entry) => entry.productId !== item.productId));
        pixBox.hidden = true;
        showNotice("");
        renderCart();
        applyCardQty(item.productId, 1);
      });

      row.append(image, info, qty, subtotal, remove);
      cartList.append(row);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartTotal.hidden = false;
    cartTotal.textContent = `Total ${formatPrice(money(total))}`;
    cart.forEach((item) => applyCardQty(item.productId, item.qty));
  }

  function emv(id, value) {
    const text = String(value);
    return id + String(text.length).padStart(2, "0") + text;
  }

  function crc16(payload) {
    let crc = 0xffff;
    for (let index = 0; index < payload.length; index += 1) {
      crc ^= payload.charCodeAt(index) << 8;
      for (let bit = 0; bit < 8; bit += 1) {
        if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
        else crc <<= 1;
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  function pixPayload(amount, txid) {
    const account = emv("26", emv("00", "br.gov.bcb.pix") + emv("01", window.BangtanAdminEmail));
    const extra = emv("62", emv("05", txid));
    const body = [
      emv("00", "01"),
      account,
      emv("52", "0000"),
      emv("53", "986"),
      emv("54", money(amount).toFixed(2)),
      emv("58", "BR"),
      emv("59", PIX_RECEIVER),
      emv("60", PIX_CITY),
      extra,
      "6304"
    ].join("");
    return body + crc16(body);
  }

  function orderExpiresAt(order) {
    if (order.expiresAt) return new Date(order.expiresAt).getTime();
    return new Date(order.createdAt).getTime() + PIX_TTL_MS;
  }

  function isPixExpired(order) {
    return Date.now() >= orderExpiresAt(order);
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function paintPixBox(order) {
    const left = orderExpiresAt(order) - Date.now();
    if (left <= 0) {
      pixHelp.hidden = true;
      pixCode.hidden = true;
      pixCode.textContent = "";
      pixCopy.hidden = true;
      pixDeadline.classList.add("is-expired");
      pixDeadline.textContent = "Este código Pix expirou.";
      return;
    }
    pixHelp.hidden = false;
    pixCode.hidden = false;
    pixCode.textContent = order.pixCode;
    pixCopy.hidden = false;
    pixDeadline.classList.remove("is-expired");
    pixDeadline.textContent = `Expira em ${formatCountdown(left)}`;
  }

  function tickPix() {
    if (!isCustomerOpen()) return;
    const shownId = pixBox.dataset.orderId;
    if (shownId && !pixBox.hidden) {
      const order = readOrders().find((item) => item.id === shownId);
      if (order) paintPixBox(order);
    }
    const signature = readOrders().map((order) => (isPixExpired(order) ? "1" : "0")).join("");
    if (signature === expirySignature) return;
    expirySignature = signature;
    renderOrders();
  }

  function startPixClock() {
    window.clearInterval(pixTimer);
    expirySignature = readOrders().map((order) => (isPixExpired(order) ? "1" : "0")).join("");
    pixTimer = window.setInterval(tickPix, 1000);
  }

  function stopPixClock() {
    window.clearInterval(pixTimer);
    pixTimer = 0;
  }

  function renderOrders() {
    const orders = readOrders();
    orderList.replaceChildren();
    if (!orders.length) {
      const empty = document.createElement("li");
      empty.className = "shop-empty";
      empty.textContent = "Você ainda não fez nenhum pedido.";
      orderList.append(empty);
      return;
    }

    orders.forEach((order) => {
      const item = document.createElement("li");
      item.className = "order-card";

      const title = document.createElement("strong");
      const when = new Date(order.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      title.textContent = `Pedido de ${when}`;

      const summary = document.createElement("p");
      summary.textContent = order.items.map((entry) => `${entry.qty}× ${entry.name}`).join(", ");

      const expired = isPixExpired(order);
      const until = new Date(orderExpiresAt(order)).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const total = document.createElement("span");
      total.className = "vitrine-valor";
      total.textContent = expired
        ? `${formatPrice(order.total)} · Pix · Expirado`
        : `${formatPrice(order.total)} · Pix · Aguardando pagamento até ${until}`;

      const code = document.createElement("p");
      code.className = expired ? "pix-expira is-expired" : "pix-code";
      code.textContent = expired ? "Código Pix expirado." : order.pixCode;

      item.append(title, summary, total, code);
      orderList.append(item);
    });
  }

  function checkout() {
    if (!isCustomerOpen() || checkoutButton.disabled) return;
    const cart = readCart();
    if (!cart.length) {
      showNotice("Adicione produtos antes de seguir para a compra.");
      return;
    }

    checkoutButton.disabled = true;
    const total = money(cart.reduce((sum, item) => sum + item.price * item.qty, 0));
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const txid = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);
    const code = pixPayload(total, txid);
    const order = {
      id,
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      })),
      total,
      payment: "pix",
      pixCode: code,
      expiresAt: new Date(Date.now() + PIX_TTL_MS).toISOString()
    };
    const orders = readOrders();
    orders.unshift(order);
    writeOrders(orders);
    writeCart([]);
    pixBox.dataset.orderId = order.id;
    pixBox.hidden = false;
    paintPixBox(order);
    showNotice("Pedido criado. O código Pix abaixo expira em 15 minutos.", true);
    renderCart();
    renderOrders();
  }

  function openShop() {
    if (!isCustomerOpen()) return;
    const session = readSession();
    greeting.textContent = `Olá, ${session.name}. Escolha os produtos e leve para o carrinho.`;
    pixBox.hidden = true;
    showNotice("");
    delete pixBox.dataset.orderId;
    renderFilters();
    renderProducts();
    renderCart();
    renderOrders();
    startPixClock();
    showShop(sessionStorage.getItem(SHOP_KEY));
  }

  function closeShop() {
    sessionStorage.setItem(SHOP_KEY, "vitrine");
    showShop("vitrine");
    pixBox.hidden = true;
    delete pixBox.dataset.orderId;
    showNotice("");
    stopPixClock();
    nameFilter.value = "";
    minFilter.value = "";
    maxFilter.value = "";
    categoryFilter = "";
  }

  nameFilter.addEventListener("input", renderProducts);
  [minFilter, maxFilter].forEach((input) => {
    input.addEventListener("input", () => {
      const masked = maskMoney(input.value);
      if (input.value !== masked) input.value = masked;
      renderProducts();
    });
  });

  document.querySelectorAll("[data-shop]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isCustomerOpen()) return;
      showShop(button.dataset.shop);
    });
  });

  checkoutButton.addEventListener("click", checkout);
  cartNotice.querySelector(".banner-close").addEventListener("click", () => showNotice(""));
  pixCopy.addEventListener("click", async () => {
    const code = pixCode.textContent;
    if (!code || pixCode.hidden) return;
    try {
      await navigator.clipboard.writeText(code);
      pixCopy.textContent = "Código copiado";
    } catch (error) {
      pixCopy.textContent = "Selecione o código e copie";
    }
    window.setTimeout(() => {
      pixCopy.textContent = "Copiar código";
    }, 1600);
  });

  document.addEventListener("bangtan-customer-open", openShop);
  document.addEventListener("bangtan-customer-close", closeShop);

  if (isCustomerOpen()) openShop();
})();
