// Cadastro de categorias. Os nomes entram no select do produto.

(function () {
  const CATEGORIES_KEY = "bangtan-house-categories";
  const PRODUCTS_KEY = "bangtan-house-products";
  const SESSION_KEY = "bangtan-house-session";
  const ADMIN_EMAIL = window.BangtanAdminEmail;

  const form = document.getElementById("form-categoria");
  const banner = document.getElementById("categoria-banner");
  const heading = document.getElementById("categoria-heading");
  const lede = document.getElementById("categoria-lede");
  const nameInput = document.getElementById("categoria-nome");
  const cancelButton = document.getElementById("categoria-cancelar");
  const list = document.getElementById("lista-categorias");
  const viewAdmin = document.getElementById("view-admin");

  let editingId = null;

  function isAdminOpen() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return Boolean(session) && session.email === ADMIN_EMAIL && viewAdmin && !viewAdmin.hidden;
    } catch (error) {
      return false;
    }
  }

  function readCategories() {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeCategories(categories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    document.dispatchEvent(new CustomEvent("bangtan-categories-changed"));
  }

  function setFieldError(message) {
    const error = document.getElementById("categoria-nome-error");
    nameInput.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  }

  function showBanner(message, ok) {
    const success = Boolean(ok && message);
    banner.hidden = !message;
    banner.querySelector("span").textContent = message || "";
    banner.classList.toggle("ok", success);
    banner.querySelector(".banner-close").hidden = !success;
  }

  function setFormMode(editing) {
    heading.textContent = editing ? "Editar categoria" : "Cadastrar categoria";
    lede.textContent = editing
      ? "Altere o nome e salve. O cadastro de produto passa a mostrar o nome novo."
      : "O nome aparece na lista e no cadastro de produto.";
    form.querySelector("[type='submit']").textContent = editing ? "Salvar alterações" : "Cadastrar categoria";
    cancelButton.hidden = !editing;
  }

  function resetForm() {
    editingId = null;
    form.reset();
    setFieldError("");
    setFormMode(false);
  }

  function render(categories) {
    list.replaceChildren();
    if (!categories.length) {
      const empty = document.createElement("li");
      empty.className = "produto-vazio";
      empty.textContent = "Nenhuma categoria cadastrada ainda.";
      list.append(empty);
      return;
    }

    categories.forEach((category) => {
      const item = document.createElement("li");
      item.className = "categoria";
      if (category.id === editingId) item.classList.add("is-editing");

      const name = document.createElement("strong");
      name.textContent = category.name;

      const actions = document.createElement("div");
      actions.className = "produto-acoes";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "text-edit";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => startEdit(category.id));

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "text-remove";
      removeButton.textContent = "Excluir";
      removeButton.addEventListener("click", () => removeCategory(category.id));

      actions.append(editButton, removeButton);
      item.append(name, actions);
      list.append(item);
    });
  }

  function startEdit(id) {
    if (!isAdminOpen()) return;
    const category = readCategories().find((item) => item.id === id);
    if (!category) return;
    editingId = category.id;
    nameInput.value = category.name;
    setFieldError("");
    showBanner("");
    setFormMode(true);
    render(readCategories());
    nameInput.focus();
  }

  function categoryInUse(id) {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return false;
    const products = JSON.parse(raw);
    return Array.isArray(products) && products.some((product) => product.categoryId === id);
  }

  async function removeCategory(id) {
    if (!isAdminOpen()) return;
    const category = readCategories().find((item) => item.id === id);
    if (!category) return;
    if (categoryInUse(id)) {
      showBanner("Essa categoria está em um produto. Troque a categoria do produto antes de excluir.");
      return;
    }
    const confirmed = await window.BangtanConfirm({
      title: "Excluir categoria",
      message: `A categoria “${category.name}” será removida.`
    });
    if (!confirmed || !isAdminOpen()) return;
    if (categoryInUse(id)) {
      showBanner("Essa categoria está em um produto. Troque a categoria do produto antes de excluir.");
      return;
    }
    const categories = readCategories().filter((item) => item.id !== id);
    writeCategories(categories);
    if (editingId === id) resetForm();
    render(categories);
  }

  function refresh() {
    if (!isAdminOpen()) return;
    render(readCategories());
  }

  banner.querySelector(".banner-close").addEventListener("click", () => showBanner(""));

  nameInput.addEventListener("input", () => {
    setFieldError("");
    showBanner("");
  });

  cancelButton.addEventListener("click", () => {
    resetForm();
    showBanner("");
    render(readCategories());
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
    const categories = readCategories();
    const duplicated = categories.some((category) => {
      return category.id !== editingId && category.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR");
    });

    setFieldError("");
    showBanner("");

    if (name.length < 2) {
      submit.disabled = false;
      setFieldError("Informe o nome da categoria.");
      nameInput.focus();
      return;
    }
    if (duplicated) {
      submit.disabled = false;
      setFieldError("Já existe uma categoria com esse nome.");
      nameInput.focus();
      return;
    }

    try {
      if (editingId) {
        const index = categories.findIndex((category) => category.id === editingId);
        if (index === -1) {
          resetForm();
          render(categories);
          showBanner("Essa categoria não está mais na lista.");
          return;
        }
        categories[index] = { ...categories[index], name };
        writeCategories(categories);
        resetForm();
        render(categories);
        showBanner("Categoria atualizada.", true);
      } else {
        categories.unshift({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          name,
          createdAt: new Date().toISOString()
        });
        writeCategories(categories);
        form.reset();
        render(categories);
        showBanner("Categoria cadastrada.", true);
      }
    } catch (error) {
      showBanner("Não foi possível salvar a categoria.");
    } finally {
      releaseSubmit(submit);
    }
  });

  document.addEventListener("bangtan-admin-open", refresh);
  document.addEventListener("bangtan-admin-close", () => {
    resetForm();
    showBanner("");
    list.replaceChildren();
  });

  refresh();
})();
