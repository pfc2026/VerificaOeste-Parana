const API_BASE = window.location.origin || 'http://localhost:3000';
const API = {
  search: '/api/search'
};

function getToken() {
  return localStorage.getItem('token');
}

function setAlert(type, msg) {
  const el = document.getElementById('alert');
  el.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
  el.classList.add('alert-' + type);
  el.textContent = msg;
}

function formatWhen(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

function safeTrunc(str, max = 60) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? s.slice(0, max) + '...' : s;
}

let state = {
  page: 1,
  limit: 10,
  q: '',
  modo: '',
  veredito: '',
  totalPages: 1,
};

async function fetchHistory() {
  const token = getToken();
  if (!token) {
    window.location.href = '/auth.html';
    return;
  }

  const tbody = document.getElementById('tbody');
  const meta = document.getElementById('meta');
  const pager = document.getElementById('pager');

  tbody.innerHTML = '';

  const params = new URLSearchParams();
  params.set('page', state.page);
  params.set('limit', state.limit);
  if (state.q) params.set('q', state.q);
  if (state.modo) params.set('modo', state.modo);
  if (state.veredito) params.set('veredito', state.veredito);

  try {
    const res = await fetch(API_BASE + API.search + '?' + params.toString(), {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
      throw new Error(data?.error?.message || 'Falha ao carregar histórico');
    }

    const { items, totalItems, totalPages } = data.data;
    state.totalPages = totalPages;

    meta.textContent = `Total: ${totalItems} • Total de páginas: ${totalPages}`;
    pager.textContent = `Página ${state.page} de ${totalPages}`;

    if (!items || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Nenhuma pesquisa encontrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const entrada = item.modo === 'link' ? safeTrunc(item.url, 55) : safeTrunc(item.texto, 55);
      return `
        <tr>
          <td>${formatWhen(item.createdAt)}</td>
          <td><span class="badge ${item.modo === 'link' ? 'text-bg-secondary' : 'text-bg-primary'}">${item.modo}</span></td>
          <td>${entrada || '-'}</td>
          <td>${item.veredito || '-'}</td>
          <td class="text-end">
            ${item.modo === 'link' && item.url ? `<a class="btn btn-sm btn-outline-primary" target="_blank" href="${item.url}">Abrir</a>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('btn-prev').disabled = state.page <= 1;
    document.getElementById('btn-next').disabled = state.page >= state.totalPages;

  } catch (err) {
    setAlert('danger', err.message);
  }
}

document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  state.page = 1;
  state.q = fd.get('q') || '';
  state.modo = fd.get('modo') || '';
  state.veredito = fd.get('veredito') || '';
  fetchHistory();
});

document.getElementById('btn-prev').addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    fetchHistory();
  }
});

document.getElementById('btn-next').addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    fetchHistory();
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = '/';
});

// Init
fetchHistory();

