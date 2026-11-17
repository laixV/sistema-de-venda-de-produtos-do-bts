// Cadastro de produtos. Só roda de verdade na conta da administradora.

(function () {
  const PRODUCTS_KEY = "bangtan-house-products";
  const MENU_KEY = "bangtan-house-menu";
  const CATEGORIES_KEY = "bangtan-house-categories";
  const SESSION_KEY = "bangtan-house-session";
  const ADMIN_EMAIL = window.BangtanAdminEmail;
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

  const form = document.getElementById("form-produto");
  const banner = document.getElementById("produto-banner");
  const heading = document.getElementById("admin-heading");
  const lede = document.getElementById("produto-lede");
  const nameInput = document.getElementById("produto-nome");
  const categorySelect = document.getElementById("produto-categoria");
  const categoryField = categorySelect.closest(".select-field");
  const categoryButton = document.getElementById("categoria-botao");
  const categoryLabel = document.getElementById("categoria-rotulo");
  const categoryList = document.getElementById("categoria-lista");
  const descriptionInput = document.getElementById("produto-descricao");
  const priceInput = document.getElementById("produto-valor");
  const imageInput = document.getElementById("produto-imagem");
  const imageLabel = document.getElementById("produto-imagem-nome");
  const preview = document.getElementById("produto-preview");
  const cancelButton = document.getElementById("produto-cancelar");
  const list = document.getElementById("lista-produtos");
  const viewAdmin = document.getElementById("view-admin");
  const menuToggle = document.getElementById("menu-toggle");
  const painelProdutos = document.getElementById("painel-produtos");
  const painelCategorias = document.getElementById("painel-categorias");
  const painelEstoque = document.getElementById("painel-estoque");
  const panels = {
    produtos: painelProdutos,
    categorias: painelCategorias,
    estoque: painelEstoque
  };
  const menuTitles = {
    produtos: "Bangtan House · Produtos",
    categorias: "Bangtan House · Categorias",
    estoque: "Bangtan House · Estoque"
  };

  let chosenImage = "";
  let editingId = null;

  const confirmDialog = document.getElementById("confirm-dialog");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmText = document.getElementById("confirm-text");
  const confirmCancel = document.getElementById("confirm-cancel");
  const confirmAccept = document.getElementById("confirm-accept");

  let confirmOpen = false;

  window.BangtanConfirm = function ({ title, message }) {
    if (confirmOpen) return Promise.resolve(false);
    confirmOpen = true;
    const previous = document.activeElement;
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmDialog.hidden = false;
    confirmCancel.focus();

    return new Promise((resolve) => {

      function finish(accepted) {
        confirmOpen = false;
        confirmDialog.hidden = true;
        confirmAccept.removeEventListener("click", onAccept);
        confirmCancel.removeEventListener("click", onCancel);
        confirmDialog.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("bangtan-admin-close", onCancel);
        resolve(accepted);
        if (previous && previous.isConnected) previous.focus();
      }

      function onAccept() {
        finish(true);
      }

      function onCancel() {
        finish(false);
      }

      function onBackdrop(event) {
        if (event.target === confirmDialog) finish(false);
      }

      function onKey(event) {
        if (event.key === "Escape") finish(false);
      }

      confirmAccept.addEventListener("click", onAccept);
      confirmCancel.addEventListener("click", onCancel);
      confirmDialog.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKey);
      document.addEventListener("bangtan-admin-close", onCancel);
    });
  };

  function isAdminOpen() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return Boolean(session) && session.email === ADMIN_EMAIL && viewAdmin && !viewAdmin.hidden;
    } catch (error) {
      return false;
    }
  }

  function readProducts() {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  function readCategories() {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  function fillCategorySelect(selectedId) {
    const categories = readCategories();
    const current = selectedId === undefined ? categorySelect.value : selectedId;
    categorySelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = categories.length ? "Selecione a categoria" : "Cadastre uma categoria primeiro";
    categorySelect.append(placeholder);
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.append(option);
    });
    categorySelect.value = categories.some((category) => category.id === current) ? current : "";
    syncCategoryPicker();
  }

  function closeCategoryList() {
    categoryList.hidden = true;
    categoryField.classList.remove("is-open");
    categoryButton.setAttribute("aria-expanded", "false");
  }

  function syncCategoryPicker() {
    const selected = categorySelect.selectedOptions[0];
    const placeholder = !categorySelect.value;
    categoryLabel.textContent = selected ? selected.textContent : "Selecione a categoria";
    categoryButton.classList.toggle("is-placeholder", placeholder);
    categoryList.replaceChildren();
    Array.from(categorySelect.options).forEach((option) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "option");
      button.textContent = option.textContent;
      const chosen = option.value === categorySelect.value;
      button.setAttribute("aria-selected", String(chosen));
      button.classList.toggle("is-selected", chosen);
      button.addEventListener("click", () => {
        categorySelect.value = option.value;
        categorySelect.dispatchEvent(new Event("change"));
        syncCategoryPicker();
        closeCategoryList();
      });
      item.append(button);
      categoryList.append(item);
    });
  }

  function setFieldError(input, message) {
    const error = document.getElementById(`${input.id}-error`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (input === categorySelect) categoryButton.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  }

  function showBanner(message, ok) {
    const success = Boolean(ok && message);
    banner.hidden = !message;
    banner.querySelector("span").textContent = message || "";
    banner.classList.toggle("ok", success);
    banner.querySelector(".banner-close").hidden = !success;
  }

  function parsePrice(value) {
    const cleaned = value.trim().replace(/\s/g, "").replace(/^R\$/i, "");
    if (!cleaned) return null;
    const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
    const price = Number(normalized);
    if (!Number.isFinite(price) || price <= 0) return null;
    return Math.round(price * 100) / 100;
  }

  function formatPrice(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function maskMoney(value) {
    const digits = String(value).replace(/\D/g, "").slice(0, 8);
    if (!digits) return "";
    const amount = Number(digits) / 100;
    return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function priceToInput(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function clearFieldErrors() {
    [nameInput, categorySelect, descriptionInput, priceInput, imageInput].forEach((input) => setFieldError(input, ""));
  }

  function setFormMode(editing) {
    heading.textContent = editing ? "Editar produto" : "Cadastrar produto";
    lede.textContent = editing
      ? "Altere os dados e salve. A imagem só muda se você escolher outra."
      : "Nome, categoria, descrição, valor e foto do produto.";
    form.querySelector("[type='submit']").textContent = editing ? "Salvar alterações" : "Cadastrar produto";
    cancelButton.hidden = !editing;
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Escolha um arquivo de imagem."));
        image.onload = () => {
          const maxSide = 900;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function showImage(dataUrl, label) {
    chosenImage = dataUrl;
    preview.src = dataUrl;
    preview.hidden = false;
    imageLabel.textContent = label;
  }

  function clearPreview() {
    chosenImage = "";
    preview.hidden = true;
    preview.removeAttribute("src");
    imageLabel.textContent = editingId ? "Trocar imagem" : "Escolher imagem";
  }

  function keepOrClearImage() {
    if (!editingId) {
      clearPreview();
      return;
    }
    const current = readProducts().find((product) => product.id === editingId);
    imageInput.value = "";
    if (current && current.image) {
      showImage(current.image, "Trocar imagem");
      return;
    }
    clearPreview();
  }

  function render(products) {
    list.replaceChildren();
    if (!products.length) {
      const empty = document.createElement("li");
      empty.className = "produto-vazio";
      empty.textContent = "Nenhum produto cadastrado ainda.";
      list.append(empty);
      return;
    }

    products.forEach((product) => {
      const item = document.createElement("li");
      item.className = "produto";

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = "";

      if (product.id === editingId) item.classList.add("is-editing");

      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const price = document.createElement("span");
      price.className = "produto-valor";
      price.textContent = formatPrice(product.price);
      info.append(name, price);
      const category = readCategories().find((item) => item.id === product.categoryId);
      if (category) {
        const categoryName = document.createElement("span");
        categoryName.className = "produto-categoria";
        categoryName.textContent = category.name;
        info.append(categoryName);
      }
      if (product.description) {
        const description = document.createElement("p");
        description.className = "produto-descricao";
        description.textContent = product.description;
        info.append(description);
      }

      const actions = document.createElement("div");
      actions.className = "produto-acoes";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "text-edit";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => startEdit(product.id));

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "text-remove";
      removeButton.textContent = "Excluir";
      removeButton.addEventListener("click", () => removeProduct(product.id));

      actions.append(editButton, removeButton);
      item.append(image, info, actions);
      list.append(item);
    });
  }

  function resetForm() {
    editingId = null;
    form.reset();
    clearPreview();
    fillCategorySelect("");
    clearFieldErrors();
    setFormMode(false);
  }

  function startEdit(id) {
    if (!isAdminOpen()) return;
    const product = readProducts().find((item) => item.id === id);
    if (!product) return;

    editingId = product.id;
    nameInput.value = product.name;
    fillCategorySelect(product.categoryId || "");
    descriptionInput.value = product.description || "";
    priceInput.value = priceToInput(product.price);
    imageInput.value = "";
    showImage(product.image, "Trocar imagem");
    clearFieldErrors();
    showBanner("");
    setFormMode(true);
    render(readProducts());
    nameInput.focus();
  }

  async function removeProduct(id) {
    if (!isAdminOpen()) return;
    const product = readProducts().find((item) => item.id === id);
    if (!product) return;
    const confirmed = await window.BangtanConfirm({
      title: "Excluir produto",
      message: `O produto “${product.name}” será removido da lista.`
    });
    if (!confirmed || !isAdminOpen()) return;
    const products = readProducts().filter((item) => item.id !== id);
    writeProducts(products);
    if (editingId === id) resetForm();
    render(products);
  }

  function refresh() {
    if (!isAdminOpen()) return;
    fillCategorySelect(editingId ? categorySelect.value : "");
    render(readProducts());
  }

  imageInput.addEventListener("change", async () => {
    setFieldError(imageInput, "");
    const file = imageInput.files && imageInput.files[0];
    if (!file) {
      keepOrClearImage();
      return;
    }
    if (!file.type.startsWith("image/")) {
      keepOrClearImage();
      setFieldError(imageInput, "Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      keepOrClearImage();
      setFieldError(imageInput, "Escolha uma imagem de até 8 MB.");
      return;
    }
    try {
      showImage(await readImage(file), file.name);
    } catch (error) {
      keepOrClearImage();
      setFieldError(imageInput, "Não foi possível usar esta imagem.");
    }
  });

  cancelButton.addEventListener("click", () => {
    resetForm();
    showBanner("");
    render(readProducts());
  });

  banner.querySelector(".banner-close").addEventListener("click", () => showBanner(""));

  categorySelect.addEventListener("change", () => {
    setFieldError(categorySelect, "");
    showBanner("");
  });

  categoryButton.addEventListener("click", () => {
    const willOpen = categoryList.hidden;
    categoryList.hidden = !willOpen;
    categoryField.classList.toggle("is-open", willOpen);
    categoryButton.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", (event) => {
    if (!categoryField.contains(event.target)) closeCategoryList();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCategoryList();
  });

  form.addEventListener("reset", () => {
    setTimeout(syncCategoryPicker, 0);
  });

  priceInput.addEventListener("input", () => {
    const masked = maskMoney(priceInput.value);
    if (priceInput.value !== masked) priceInput.value = masked;
    setFieldError(priceInput, "");
    showBanner("");
  });

  [nameInput, descriptionInput].forEach((input) => {
    input.addEventListener("input", () => {
      setFieldError(input, "");
      showBanner("");
    });
  });

  function releaseSubmit(button) {
    window.setTimeout(() => {
      button.disabled = false;
    }, 450);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submit = form.querySelector("[type='submit']");
    if (!isAdminOpen() || submit.disabled) return;
    submit.disabled = true;

    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const description = descriptionInput.value.trim();
    const categoryId = categorySelect.value;
    const price = parsePrice(priceInput.value);
    let hasError = false;

    clearFieldErrors();
    showBanner("");

    if (name.length < 2) {
      setFieldError(nameInput, "Informe o nome do produto.");
      hasError = true;
    }
    if (!categoryId || !readCategories().some((category) => category.id === categoryId)) {
      setFieldError(categorySelect, readCategories().length ? "Selecione a categoria." : "Cadastre uma categoria antes de salvar o produto.");
      hasError = true;
    }
    if (description.length < 2) {
      setFieldError(descriptionInput, "Informe a descrição do produto.");
      hasError = true;
    }
    if (price === null) {
      setFieldError(priceInput, "Informe um valor maior que zero. Exemplo: R$ 59,90.");
      hasError = true;
    }
    if (!chosenImage) {
      setFieldError(imageInput, "Escolha a imagem do produto.");
      hasError = true;
    }
    if (hasError) {
      submit.disabled = false;
      const invalid = form.querySelector('[aria-invalid="true"]');
      if (invalid === categorySelect) categoryButton.focus();
      else if (invalid) invalid.focus();
      return;
    }

    try {
      const products = readProducts();
      if (editingId) {
        const index = products.findIndex((product) => product.id === editingId);
        if (index === -1) {
          resetForm();
          render(products);
          showBanner("Esse produto não está mais na lista.");
          return;
        }
        products[index] = {
          ...products[index],
          name,
          description,
          categoryId,
          price,
          image: chosenImage
        };
        writeProducts(products);
        resetForm();
        render(products);
        showBanner("Produto atualizado.", true);
      } else {
        products.unshift({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          name,
          description,
          categoryId,
          price,
          image: chosenImage,
          createdAt: new Date().toISOString()
        });
        writeProducts(products);
        form.reset();
        clearPreview();
        render(products);
        showBanner("Produto cadastrado.", true);
      }
    } catch (error) {
      showBanner("Não foi possível salvar. A imagem pode ter ficado grande demais para este navegador.");
    } finally {
      releaseSubmit(submit);
    }
  });

  function showMenu(name) {
    const current = panels[name] ? name : "produtos";
    sessionStorage.setItem(MENU_KEY, current);
    Object.entries(panels).forEach(([key, panel]) => {
      panel.hidden = key !== current;
    });
    document.querySelectorAll("[data-menu]").forEach((button) => {
      if (button.dataset.menu === current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (!viewAdmin.hidden) document.title = menuTitles[current];
  }

  function setMenuCollapsed(collapsed) {
    viewAdmin.classList.toggle("is-collapsed", collapsed);
    menuToggle.setAttribute("aria-expanded", String(!collapsed));
    menuToggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
    menuToggle.querySelector("span").textContent = collapsed ? "Expandir" : "Recolher";
  }

  menuToggle.addEventListener("click", () => {
    setMenuCollapsed(!viewAdmin.classList.contains("is-collapsed"));
  });

  document.querySelectorAll("[data-menu]").forEach((button) => {
    button.addEventListener("click", () => showMenu(button.dataset.menu));
  });

  document.addEventListener("bangtan-categories-changed", () => {
    fillCategorySelect(categorySelect.value);
    if (isAdminOpen()) render(readProducts());
  });
  document.addEventListener("bangtan-admin-open", refresh);
  document.addEventListener("bangtan-admin-close", () => {
    resetForm();
    showBanner("");
    list.replaceChildren();
    showMenu("produtos");
    setMenuCollapsed(false);
  });

  refresh();
  if (isAdminOpen()) {
    const saved = sessionStorage.getItem(MENU_KEY);
    showMenu(saved);
    if (saved && saved !== "produtos" && panels[saved]) {
      const heading = panels[saved].querySelector("h2");
      if (heading) heading.focus();
    }
  }
})();
