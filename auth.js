(function () {
  const USERS_KEY = "bangtan-house-users";
  const SESSION_KEY = "bangtan-house-session";
  const ADMIN_EMAIL = "lalarwuare@gmail.com";
  const ADMIN_PASSWORD = "123456";
  window.BangtanAdminEmail = ADMIN_EMAIL;

  const COPY = {
    login: {
      title: "Entre para continuar",
      lede: "A vitrine de álbuns e colecionáveis abre depois do acesso.",
      documentTitle: "Bangtan House · Entrar"
    },
    register: {
      title: "Crie sua conta",
      lede: "O cadastro fica salvo só neste navegador, neste computador.",
      documentTitle: "Bangtan House · Criar conta"
    }
  };

  const stage = document.querySelector(".stage");
  const viewAuth = document.getElementById("view-auth");
  const viewHome = document.getElementById("view-home");
  const viewAdmin = document.getElementById("view-admin");
  const adminHeading = document.getElementById("admin-heading");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const authTitle = document.getElementById("auth-title");
  const authLede = document.getElementById("auth-lede");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");
  const loginBanner = document.getElementById("login-banner");
  const registerBanner = document.getElementById("register-banner");

  function byId(id) {
    return document.getElementById(id);
  }

  function hashBytes(bytes) {
    function rotr(value, bits) {
      return (value >>> bits) | (value << (32 - bits));
    }

    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);

    const bitLength = bytes.length * 8;
    const totalBytes = (Math.ceil((bitLength + 65) / 512) * 512) / 8;
    const buffer = new Uint8Array(totalBytes);
    buffer.set(bytes);
    buffer[bytes.length] = 0x80;

    const view = new DataView(buffer.buffer);
    view.setUint32(totalBytes - 4, bitLength, false);

    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;
    const w = new Uint32Array(64);

    for (let offset = 0; offset < totalBytes; offset += 64) {
      for (let index = 0; index < 16; index += 1) {
        w[index] = view.getUint32(offset + index * 4, false);
      }
      for (let index = 16; index < 64; index += 1) {
        const s0 = rotr(w[index - 15], 7) ^ rotr(w[index - 15], 18) ^ (w[index - 15] >>> 3);
        const s1 = rotr(w[index - 2], 17) ^ rotr(w[index - 2], 19) ^ (w[index - 2] >>> 10);
        w[index] = (w[index - 16] + s0 + w[index - 7] + s1) >>> 0;
      }

      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      let f = h5;
      let g = h6;
      let h = h7;

      for (let index = 0; index < 64; index += 1) {
        const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + K[index] + w[index]) >>> 0;
        const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) >>> 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
      h5 = (h5 + f) >>> 0;
      h6 = (h6 + g) >>> 0;
      h7 = (h7 + h) >>> 0;
    }

    return [h0, h1, h2, h3, h4, h5, h6, h7]
      .map((value) => value.toString(16).padStart(8, "0"))
      .join("");
  }

  function hashPassword(salt, password) {
    return hashBytes(new TextEncoder().encode(`${salt}:${password}`));
  }

  function createSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function createId() {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return createSalt();
  }

  function isEmail(value) {
    return value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function initial(name) {
    const first = Array.from(name)[0] || "?";
    return first.toLocaleUpperCase("pt-BR");
  }

  function readUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function isAdmin(email) {
    return email === ADMIN_EMAIL;
  }

  function ensureAdmin() {
    const users = readUsers();
    if (users.some((user) => user.email === ADMIN_EMAIL)) return;
    const salt = createSalt();
    users.push({
      id: createId(),
      name: "Administradora",
      email: ADMIN_EMAIL,
      role: "admin",
      salt,
      passwordHash: hashPassword(salt, ADMIN_PASSWORD),
      createdAt: new Date().toISOString()
    });
    writeUsers(users);
  }

  function setFieldError(input, message) {
    const error = byId(`${input.id}-error`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  }

  function showBanner(banner, message) {
    banner.hidden = !message;
    banner.textContent = message;
  }

  function clearErrors(form) {
    form.querySelectorAll("input").forEach((input) => setFieldError(input, ""));
    const banner = form.querySelector(".banner");
    if (banner) showBanner(banner, "");
  }

  function focusFirstInvalid(form) {
    const invalid = form.querySelector('[aria-invalid="true"]');
    if (invalid) invalid.focus();
  }

  function hidePasswords() {
    document.querySelectorAll("[data-toggle-password]").forEach((button) => {
      const input = byId(button.dataset.togglePassword);
      if (!input) return;
      input.type = "password";
      button.classList.remove("is-visible");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Mostrar senha");
    });
  }

  const AUTH_TAB_KEY = "bangtan-house-auth-tab";

  function showTab(tab) {
    const isLogin = tab === "login";
    sessionStorage.setItem(AUTH_TAB_KEY, isLogin ? "login" : "register");
    formLogin.hidden = !isLogin;
    formRegister.hidden = isLogin;
    tabLogin.setAttribute("aria-selected", String(isLogin));
    tabRegister.setAttribute("aria-selected", String(!isLogin));
    authTitle.textContent = COPY[tab].title;
    authLede.textContent = COPY[tab].lede;
    document.title = COPY[tab].documentTitle;
  }

  function showHome(session) {
    const admin = isAdmin(session.email);
    stage.classList.add("is-app");
    viewAuth.hidden = true;
    viewHome.hidden = admin;
    viewAdmin.hidden = !admin;
    if (admin) {
      document.title = "Bangtan House · Produtos";
      adminHeading.focus();
      document.dispatchEvent(new CustomEvent("bangtan-admin-open"));
      return;
    }
    document.title = "Bangtan House · Produtos";
    document.dispatchEvent(new CustomEvent("bangtan-customer-open"));
  }

  function showAuth() {
    stage.classList.remove("is-app");
    viewHome.hidden = true;
    viewAdmin.hidden = true;
    viewAuth.hidden = false;
    showTab("login");
    document.dispatchEvent(new CustomEvent("bangtan-admin-close"));
    document.dispatchEvent(new CustomEvent("bangtan-customer-close"));
    authTitle.focus();
  }

  function startSession(user) {
    const session = { name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    showHome(session);
  }

  function onLogout() {
    localStorage.removeItem(SESSION_KEY);
    formLogin.reset();
    formRegister.reset();
    clearErrors(formLogin);
    clearErrors(formRegister);
    hidePasswords();
    showAuth();
  }

  function releaseSubmit(button) {
    window.setTimeout(() => {
      button.disabled = false;
    }, 450);
  }

  function onLogin(event) {
    event.preventDefault();
    const submit = formLogin.querySelector("[type='submit']");
    if (submit.disabled) return;
    submit.disabled = true;

    const emailInput = byId("login-email");
    const passwordInput = byId("login-password");
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    let hasError = false;

    setFieldError(emailInput, "");
    setFieldError(passwordInput, "");
    showBanner(loginBanner, "");

    if (!isEmail(email)) {
      setFieldError(emailInput, "Informe um e-mail válido.");
      hasError = true;
    }
    if (!password) {
      setFieldError(passwordInput, "Informe sua senha.");
      hasError = true;
    }
    if (hasError) {
      submit.disabled = false;
      focusFirstInvalid(formLogin);
      return;
    }

    try {
      const user = readUsers().find((item) => item.email === email);
      if (!user || hashPassword(user.salt, password) !== user.passwordHash) {
        showBanner(loginBanner, "E-mail ou senha incorretos.");
        passwordInput.value = "";
        return;
      }
      startSession(user);
      formLogin.reset();
      hidePasswords();
    } catch (error) {
      showBanner(loginBanner, "Não foi possível acessar os dados neste navegador.");
    } finally {
      releaseSubmit(submit);
    }
  }

  function onRegister(event) {
    event.preventDefault();
    const submit = formRegister.querySelector("[type='submit']");
    if (submit.disabled) return;
    submit.disabled = true;

    const nameInput = byId("register-name");
    const emailInput = byId("register-email");
    const passwordInput = byId("register-password");
    const confirmInput = byId("register-confirm");
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmation = confirmInput.value;
    let hasError = false;

    [nameInput, emailInput, passwordInput, confirmInput].forEach((input) => setFieldError(input, ""));
    showBanner(registerBanner, "");

    if (name.length < 2) {
      setFieldError(nameInput, "Informe seu nome.");
      hasError = true;
    }

    if (!isEmail(email)) {
      setFieldError(emailInput, "Informe um e-mail válido.");
      hasError = true;
    }

    if (password.length < 6) {
      setFieldError(passwordInput, "Use pelo menos 6 caracteres.");
      hasError = true;
    }

    if (password !== confirmation) {
      setFieldError(confirmInput, "As senhas não coincidem.");
      hasError = true;
    }

    if (hasError) {
      submit.disabled = false;
      focusFirstInvalid(formRegister);
      return;
    }

    try {
      const users = readUsers();
      if (users.some((user) => user.email === email)) {
        setFieldError(emailInput, "Este e-mail já está cadastrado.");
        emailInput.focus();
        return;
      }

      const salt = createSalt();
      const user = {
        id: createId(),
        name,
        email,
        salt,
        passwordHash: hashPassword(salt, password),
        role: "cliente",
        createdAt: new Date().toISOString()
      };
      users.push(user);
      writeUsers(users);
      startSession(user);
      formRegister.reset();
      formLogin.reset();
      hidePasswords();
    } catch (error) {
      showBanner(registerBanner, "Não foi possível salvar os dados neste navegador.");
    } finally {
      releaseSubmit(submit);
    }
  }

  function restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        const valid = session && typeof session.email === "string" && typeof session.name === "string";
        const exists = valid && readUsers().some((user) => user.email === session.email);
        if (!valid || !exists) localStorage.removeItem(SESSION_KEY);
        else {
          showHome(session);
          return;
        }
      }
    } catch (error) {
      // Sem sessão válida, a tela de entrada continua visível.
    }
    if (sessionStorage.getItem(AUTH_TAB_KEY) === "register") showTab("register");
  }

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = byId(button.dataset.togglePassword);
      if (!input) return;
      const willShow = input.type === "password";
      input.type = willShow ? "text" : "password";
      button.classList.toggle("is-visible", willShow);
      button.setAttribute("aria-pressed", String(willShow));
      button.setAttribute("aria-label", willShow ? "Ocultar senha" : "Mostrar senha");
    });
  });

  ["login-email", "login-password", "register-name", "register-email", "register-password", "register-confirm"].forEach((id) => {
    const input = byId(id);
    input.addEventListener("input", () => setFieldError(input, ""));
  });

  formLogin.addEventListener("input", () => showBanner(loginBanner, ""));
  formRegister.addEventListener("input", () => showBanner(registerBanner, ""));
  formLogin.addEventListener("submit", onLogin);
  formRegister.addEventListener("submit", onRegister);
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", onLogout);
  });
  try {
    ensureAdmin();
  } catch (error) {
    // Sem armazenamento, a entrada continua disponível.
  }
  restoreSession();
})();
