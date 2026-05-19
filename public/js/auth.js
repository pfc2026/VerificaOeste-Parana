const API_BASE = (window.location.origin || 'http://localhost:3000');
const API = {
  register: '/api/auth/register',
  login: '/api/auth/login',
  me: '/api/auth/me',
};

function getAlert(el, type, msg) {
  el.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
  el.classList.add(type);
  el.textContent = msg;
}

function setTab(which) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const loginBtn = document.getElementById('tab-login');
  const registerBtn = document.getElementById('tab-register');

  // default: mostrar abas de login/registro
  if (which === 'login') {
    if (loginForm) loginForm.classList.remove('d-none');
    if (registerForm) registerForm.classList.add('d-none');

    if (loginBtn) {
      loginBtn.textContent = 'Login';
      loginBtn.classList.add('btn-primary');
      loginBtn.classList.remove('btn-outline-primary');
      loginBtn.disabled = false;
    }

    if (registerBtn) {
      registerBtn.classList.remove('d-none');
      registerBtn.classList.add('btn-outline-primary');
      registerBtn.classList.remove('btn-primary');
    }
  } else {
    if (registerForm) registerForm.classList.remove('d-none');
    if (loginForm) loginForm.classList.add('d-none');

    if (registerBtn) {
      registerBtn.classList.add('btn-primary');
      registerBtn.classList.remove('btn-outline-primary');
    }

    if (loginBtn) {
      loginBtn.classList.add('btn-outline-primary');
      loginBtn.classList.remove('btn-primary');
    }
  }
}

function readForm(form) {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

async function register(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('register-alert');

  const payload = readForm(form);
  try {
    const res = await fetch(API_BASE + API.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: payload.nome,
        email: payload.email,
        senha: payload.senha,
        cpf: payload.cpf || undefined,
        tipo: 'usuario',
        ativo: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || 'Erro ao criar conta');
    }

    getAlert(alertEl, 'alert-success', 'Conta criada com sucesso. Faça login!');
    setTab('login');
  } catch (err) {
    getAlert(alertEl, 'alert-danger', err.message);
  }
}

async function login(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('login-alert');

  const payload = readForm(form);
  try {
    const res = await fetch(API_BASE + API.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email,
        senha: payload.senha,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || 'Credenciais inválidas');
    }

    localStorage.setItem('token', data.data.token);
    window.location.href = '/';
  } catch (err) {
    getAlert(alertEl, 'alert-danger', err.message);
  }
}

function setContaView(user) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const loginBtn = document.getElementById('tab-login');
  const registerBtn = document.getElementById('tab-register');

  if (loginForm) loginForm.classList.add('d-none');
  if (registerForm) registerForm.classList.add('d-none');

  // Troca “Login” -> “Conta”
  if (loginBtn) {
    loginBtn.textContent = 'Conta';
    loginBtn.classList.add('btn-outline-secondary');
    loginBtn.classList.remove('btn-primary');
    loginBtn.disabled = true;
  }

  if (registerBtn) registerBtn.classList.add('d-none');

  // Preenche dados
  const contaNome = document.getElementById('conta-nome');
  const contaEmail = document.getElementById('conta-email');
  const contaTipo = document.getElementById('conta-tipo');

  if (contaNome) contaNome.textContent = user?.nome || '-';
  if (contaEmail) contaEmail.textContent = user?.email || '-';
  if (contaTipo) contaTipo.textContent = user?.tipo || '-';

  const contaBox = document.getElementById('conta-box');
  if (contaBox) contaBox.classList.remove('d-none');
}

async function tryAutoLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    setTab('login');
    return;
  }

  try {
    const res = await fetch(API_BASE + API.me, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    const data = await res.json();
    if (!res.ok || data.success === false) {
      localStorage.removeItem('token');
      setTab('login');
      return;
    }

    setContaView(data.data);
  } catch {
    localStorage.removeItem('token');
    setTab('login');
  }
}

document.getElementById('tab-login').addEventListener('click', () => setTab('login'));
document.getElementById('tab-register').addEventListener('click', () => setTab('register'));

document.getElementById('form-login').addEventListener('submit', login);
document.getElementById('form-register').addEventListener('submit', register);

// fallback + auto-login
setTab('login');
tryAutoLogin();

