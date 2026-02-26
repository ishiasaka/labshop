const API_PREFIX = '/api';
const LOGIN_PAGE = '/login';

let allUsersPage = 1;
let allUsersPageSize = 10;
let allUsersCache = [];

let debtPage = 1;
let debtPageSize = 10;
let debtCache = [];

let cardsPage = 1;
let cardsPageSize = 10;
let cardsCache = [];

let shelvesPage = 1;
let shelvesPageSize = 10;
let shelvesCache = [];

let activityPage = 1;
let activityPageSize = 10;
let activityCache = [];

function $(id) {
  return document.getElementById(id);
}

async function apiFetch(path, options = {}) {
  const url = `${API_PREFIX}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

async function requireLogin() {
  try {
    const res = await apiFetch('/me', { credentials: 'include' });
    if (!res.ok) {
      window.location.href = LOGIN_PAGE;
      return false;
    }
    const me = await res.json();
    const greeting = $('admin_greeting');
    if (greeting) {
      greeting.innerText = `Logged in as: ${me.admin_name || ''}`;
    }
    return true;
  } catch {
    window.location.href = LOGIN_PAGE;
    return false;
  }
}

async function logout() {
  try {
    await fetch('/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    window.location.href = LOGIN_PAGE;
  }
}

async function readErrorMessage(res) {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      const detail = payload?.detail ?? payload?.message ?? payload;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((d) => d?.msg || d?.message || JSON.stringify(d))
          .join('\n');
      }
      return JSON.stringify(detail, null, 2);
    }
    return await res.text();
  } catch {
    return `Request failed (${res.status})`;
  }
}
async function loadData() {
  const ok = await requireLogin();
  if (!ok) return;
  await Promise.all([loadUsers(), loadActivity(), loadAllUsers(), loadCards(), loadShelves()]);
}

async function loadUsers() {
  try {
    const res = await apiFetch('/users/');
    if (!res.ok) {
      console.error(
        'loadUsers failed',
        res.status,
        await readErrorMessage(res)
      );
      return;
    }

    const data = await res.json();

    // show only users with debt > 0
    debtCache = (data.users || []).filter(
      (u) => Number(u.account_balance ?? 0) > 0
    );

    renderDebtTable();
  } catch (e) {
    console.error('Load users failed', e);
  }
}
function renderDebtTable() {
  const tbody = document.querySelector('#userTable tbody');
  if (!tbody) return;
  const q = (document.getElementById('studentSearch')?.value || '')
    .toLowerCase()
    .trim();

  const filtered = q
    ? debtCache.filter((u) => {
        const sid = String(u.student_id ?? '').toLowerCase();
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        return sid.includes(q) || name.includes(q);
      })
    : debtCache;

  const totalPages = Math.max(1, Math.ceil(filtered.length / debtPageSize));
  if (debtPage > totalPages) debtPage = totalPages;
  if (debtPage < 1) debtPage = 1;

  const start = (debtPage - 1) * debtPageSize;
  const pageUsers = filtered.slice(start, start + debtPageSize);

  tbody.innerHTML = pageUsers
    .map((u) => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      const debt = Number(u.account_balance ?? 0);
      return `<tr>
        <td>${u.student_id}</td>
        <td>${fullName}</td>
        <td class="debt-high">¥${debt}</td>
      </tr>`;
    })
    .join('');

  const prev = document.getElementById('debtPrev');
  const next = document.getElementById('debtNext');
  const info = document.getElementById('debtPageInfo');

  if (prev) prev.disabled = debtPage <= 1;
  if (next) next.disabled = debtPage >= totalPages;
  if (info) info.innerText = `${debtPage} / ${totalPages}`;
}
function debtNextPage() {
  debtPage++;
  renderDebtTable();
}

function debtPrevPage() {
  debtPage--;
  renderDebtTable();
}

window.debtNextPage = debtNextPage;
window.debtPrevPage = debtPrevPage;
function filterStudents() {
  debtPage = 1;
  renderDebtTable();
}
window.filterStudents = filterStudents;

function filterAllUsers() {
  allUsersPage = 1;
  renderAllUsersTable();
}
window.filterAllUsers = filterAllUsers;

// Load ALL users (Admin CRUD table)
async function loadAllUsers() {
  const res = await apiFetch('/users/');
  if (!res.ok) {
    console.error(
      'loadAllUsers failed',
      res.status,
      await readErrorMessage(res)
    );
    return;
  }

  const data = await res.json();
  allUsersCache = data.users || [];

  renderAllUsersTable();
}
function renderAllUsersTable() {
  const tbody = document.querySelector('#allUserTable tbody');
  if (!tbody) return;

  const q = (document.getElementById('allUserSearch')?.value || '')
    .toLowerCase()
    .trim();

  const filtered = q
    ? allUsersCache.filter((u) => {
        const sid = String(u.student_id ?? '').toLowerCase();
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        return sid.includes(q) || name.includes(q);
      })
    : allUsersCache;

  const totalPages = Math.max(1, Math.ceil(filtered.length / allUsersPageSize));
  if (allUsersPage > totalPages) allUsersPage = totalPages;
  if (allUsersPage < 1) allUsersPage = 1;

  const start = (allUsersPage - 1) * allUsersPageSize;
  const pageUsers = filtered.slice(start, start + allUsersPageSize);

  tbody.innerHTML = pageUsers
    .map((u) => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      const status = String(u.status || '').toLowerCase();
      const balance = Number(u.account_balance || 0);
      const isActive = status === 'active';
      const nextStatus = isActive ? 'inactive' : 'active';
      return `<tr>
        <td>${u.student_id}</td>
        <td>${fullName}</td>
        <td>${status}</td>
        <td>¥${balance}</td>
        <td>
          <button class="btn-danger" onclick="toggleUserStatus(${u.student_id}, '${nextStatus}')">
            ${isActive ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>`;
    })
    .join('');

  document.getElementById('allUsersPrev').disabled = allUsersPage <= 1;
  document.getElementById('allUsersNext').disabled = allUsersPage >= totalPages;

  const info = document.getElementById('allUsersPageInfo');
  if (info) info.innerText = `${allUsersPage} / ${totalPages}`;
}
function allUsersNextPage() {
  allUsersPage++;
  renderAllUsersTable();
}

function allUsersPrevPage() {
  allUsersPage--;
  renderAllUsersTable();
}

async function toggleUserStatus(studentId, status) {
  try {
    const res = await apiFetch(
      `/users/${studentId}/status?status=${encodeURIComponent(status)}`,
      { method: 'PATCH' }
    );

    if (!res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        alert(data.detail || text);
      } catch {
        alert(text);
      }
      return;
    }
    await loadAllUsers();
    await loadUsers();
  } catch (e) {
    alert('Network error: ' + (e?.message || String(e)));
  }
}

async function loadActivity() {
  try {
    const [pRes, payRes] = await Promise.all([
      apiFetch('/purchases/'),
      apiFetch('/payments/'),
    ]);

    if (!pRes.ok || !payRes.ok) return;

    const pData = await pRes.json();
    const payData = await payRes.json();

    const purchases = pData.purchases || [];
    const payments = payData.payments || [];

    activityCache = [
      ...purchases.map((x) => ({
        time: x.created_at,
        id: x.student_id,
        type: 'PURCHASE',
        amount: x.price,
        className: 'purchase',
      })),
      ...payments.map((x) => ({
        time: x.created_at,
        id: x.student_id,
        type: 'PAYMENT',
        amount: x.amount_paid,
        className: 'payment',
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    renderActivityTable();
  } catch (e) {
    console.error('Activity load failed', e);
  }
}
function renderActivityTable() {
  const tbody = document.querySelector('#activityTable tbody');
  if (!tbody) return;

  const totalPages = Math.max(
    1,
    Math.ceil(activityCache.length / activityPageSize)
  );
  if (activityPage > totalPages) activityPage = totalPages;
  if (activityPage < 1) activityPage = 1;

  const start = (activityPage - 1) * activityPageSize;
  const pageItems = activityCache.slice(start, start + activityPageSize);

  tbody.innerHTML = pageItems
    .map(
      (a) => `<tr>
        <td>${new Date(a.time).toLocaleTimeString()}</td>
        <td>ID: ${a.id}</td>
        <td class="${a.className}">${a.type}</td>
        <td>¥${a.amount}</td>
      </tr>`
    )
    .join('');

  const prev = document.getElementById('activityPrev');
  const next = document.getElementById('activityNext');
  const info = document.getElementById('activityPageInfo');

  if (prev) prev.disabled = activityPage <= 1;
  if (next) next.disabled = activityPage >= totalPages;
  if (info) info.innerText = `${activityPage} / ${totalPages}`;
}
function activityNextPage() {
  activityPage++;
  renderActivityTable();
}
function activityPrevPage() {
  activityPage--;
  renderActivityTable();
}

window.activityNextPage = activityNextPage;
window.activityPrevPage = activityPrevPage;

async function createUser() {
  const ok = await requireLogin();
  if (!ok) return;

  try {
    const sid = parseInt(($('sid')?.value || '').trim(), 10);
    const first_name = ($('fname')?.value || '').trim();
    const last_name = ($('lname')?.value || '').trim();

    if (!sid || !first_name || !last_name) {
      alert('Please enter Student ID, First Name, and Last Name.');
      return;
    }
    const res = await apiFetch('/users/', {
      method: 'POST',
      body: JSON.stringify({ student_id: sid, first_name, last_name }),
    });

    if (res.ok) {
      alert('Student Created!');
      $('sid').value = '';
      $('fname').value = '';
      $('lname').value = '';
      await loadUsers();
      await loadActivity();
      return;
    }
    const msg = await readErrorMessage(res);
    alert(`Error (${res.status}): ${msg}`);
  } catch (e) {
    alert('Network Error: ' + (e?.message || String(e)));
  }
}

async function updateMaxDebt() {
  const ok = await requireLogin();
  if (!ok) return;

  const el = $('max_debt_limit');
  if (!el) return;

  const val = String(el.value || '').trim();
  if (!val) {
    alert('Please enter a limit');
    return;
  }

  try {
    const res = await apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify({ key: 'max_debt_limit', value: val }),
    });

    if (res.ok) {
      alert('Limit Updated to ¥' + val);
      el.value = '';
      return;
    }

    const msg = await readErrorMessage(res);
    alert(`Error (${res.status}): ${msg}`);
  } catch (e) {
    alert('Network Error: ' + (e?.message || String(e)));
  }
}
async function loadCards() {
  const res = await apiFetch('/ic_cards/');
  if (!res.ok) {
    console.error('loadCards failed', res.status, await readErrorMessage(res));
    return;
  }

  cardsCache = await res.json();
  renderCardsTable();
}
function renderCardsTable() {
  const tbody = document.querySelector('#cardTable tbody');
  if (!tbody) return;

  const q = (document.getElementById('cardSearch')?.value || '')
    .toLowerCase()
    .trim();

  const filtered = q
    ? (cardsCache || []).filter((c) => {
        const uid = String(c.uid || '').toLowerCase();
        const sid = String(c.student_id ?? '').toLowerCase();
        const status = String(c.status || '').toLowerCase();
        return uid.includes(q) || sid.includes(q) || status.includes(q);
      })
    : cardsCache || [];

  const totalPages = Math.max(1, Math.ceil(filtered.length / cardsPageSize));
  if (cardsPage > totalPages) cardsPage = totalPages;
  if (cardsPage < 1) cardsPage = 1;

  const start = (cardsPage - 1) * cardsPageSize;
  const pageCards = filtered.slice(start, start + cardsPageSize);

  tbody.innerHTML = pageCards
    .map((c) => {
      const uid = c.uid || '';
      const sid = c.student_id ?? '';
      const status = c.status || '';
      const unlinkBtn =
        sid !== ''
          ? `<button class="btn" onclick="unlinkCard('${uid}')">Unlink</button>`
          : '';

      const deactivateBtn = `<button class="btn" onclick="deactivateCard('${uid}')">Deactivate</button>`;
      const activateBtn = `<button class="btn" onclick="activateCard('${uid}')">Activate</button>`;
      return `<tr>
        <td>${uid}</td>
        <td>${sid === '' ? '-' : sid}</td>
        <td>${status}</td>
        <td class="actions">
          ${unlinkBtn}
          ${c.status === "active" ? deactivateBtn : activateBtn}
        </td>
      </tr>`;
    })
    .join('');

  const prev = document.getElementById('cardsPrev');
  const next = document.getElementById('cardsNext');
  const info = document.getElementById('cardsPageInfo');

  if (prev) prev.disabled = cardsPage <= 1;
  if (next) next.disabled = cardsPage >= totalPages;
  if (info) info.innerText = `${cardsPage} / ${totalPages}`;
}
function cardsNextPage() {
  cardsPage++;
  renderCardsTable();
}

function cardsPrevPage() {
  cardsPage--;
  renderCardsTable();
}

function filterCards() {
  cardsPage = 1;
  renderCardsTable();
}
window.filterCards = filterCards;

async function loadShelves() {
  try {
    const res = await apiFetch('/shelves/');
    if (!res.ok) {
      console.error('loadShelves failed', res.status, await readErrorMessage(res));
      return;
    }

    const data = await res.json();
    shelvesCache = data.shelves || data || [];
    renderShelvesTable();
  } catch (e) {
    console.error('loadShelves failed', e);
  }
}

function renderShelvesTable() {
  const tbody = document.querySelector('#shelfTable tbody');
  if (!tbody) return;

  const q = (document.getElementById('shelfSearch')?.value || '')
    .toLowerCase()
    .trim();

  const filtered = q
    ? (shelvesCache || []).filter((s) => {
        const sid = String(s.shelf_id || '').toLowerCase();
        const port = String(s.usb_port ?? '').toLowerCase();
        return sid.includes(q) || port.includes(q);
      })
    : shelvesCache || [];

  const totalPages = Math.max(1, Math.ceil(filtered.length / shelvesPageSize));
  if (shelvesPage > totalPages) shelvesPage = totalPages;
  if (shelvesPage < 1) shelvesPage = 1;

  const start = (shelvesPage - 1) * shelvesPageSize;
  const pageItems = filtered.slice(start, start + shelvesPageSize);

  tbody.innerHTML = pageItems
    .map(
      (s) => `<tr>
        <td>${s.shelf_id}</td>
        <td>${s.usb_port}</td>
        <td>¥${s.price}</td>
        <td class="actions">
          <button class="btn" onclick="selectShelf('${s.shelf_id}', ${s.usb_port || 0}, ${s.price || 0})">Select</button>
          <button class="btn-danger" onclick="deleteShelf('${s.shelf_id}')">Delete</button>
        </td>
      </tr>`
    )
    .join('');

  const prev = document.getElementById('shelvesPrev');
  const next = document.getElementById('shelvesNext');
  const info = document.getElementById('shelvesPageInfo');

  if (prev) prev.disabled = shelvesPage <= 1;
  if (next) next.disabled = shelvesPage >= totalPages;
  if (info) info.innerText = `${shelvesPage} / ${totalPages}`;
}

function filterShelves() {
  shelvesPage = 1;
  renderShelvesTable();
}

async function createShelf() {
  const ok = await requireLogin();
  if (!ok) return;

  const shelf_id = ($('shelf_id')?.value || '').trim();
  const usb_port = parseInt(($('shelf_usb_port')?.value || '').trim(), 10);
  const price = parseInt(($('shelf_price')?.value || '').trim(), 10);

  if (!shelf_id || Number.isNaN(usb_port) || Number.isNaN(price)) {
    alert('Please enter Shelf ID, USB Port, and Price.');
    return;
  }

  try {
    // Try creating first; backend may support upsert on PUT/PATCH otherwise
    let res = await apiFetch('/shelves/', {
      method: 'POST',
      body: JSON.stringify({ shelf_id, usb_port, price }),
    });

    if (!res.ok && res.status === 409) {
      // Conflict: try update
      res = await apiFetch(`/shelves/${encodeURIComponent(shelf_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ usb_port, price }),
      });
    }

    if (res.ok) {
      alert('Shelf saved!');
      $('shelf_id').value = '';
      $('shelf_usb_port').value = '';
      $('shelf_price').value = '';
      await loadShelves();
      return;
    }

    const msg = await readErrorMessage(res);
    alert(`Error (${res.status}): ${msg}`);
  } catch (e) {
    alert('Network Error: ' + (e?.message || String(e)));
  }
}

function shelvesNextPage() {
  shelvesPage++;
  renderShelvesTable();
}

function shelvesPrevPage() {
  shelvesPage--;
  renderShelvesTable();
}

function selectShelf(shelfId, usbPort, price) {
  const elId = $('shelf_id');
  const elPort = $('shelf_usb_port');
  const elPrice = $('shelf_price');
  if (elId) elId.value = shelfId;
  if (elPort) elPort.value = usbPort;
  if (elPrice) elPrice.value = price;
}

async function deleteShelf(shelfId) {
  if (!confirm('Delete shelf ' + shelfId + '?')) return;
  try {
    const res = await apiFetch(`/shelves/${encodeURIComponent(shelfId)}`, { method: 'DELETE' });
    if (!res.ok) {
      alert(`Error (${res.status}): ` + (await readErrorMessage(res)));
      return;
    }
    await loadShelves();
  } catch (e) {
    alert('Network Error: ' + (e?.message || String(e)));
  }
}

async function unlinkCard(uid) {
  const res = await apiFetch(`/ic_cards/${uid}/unlink`, { method: 'POST' });
  if (!res.ok) {
    alert(`Error (${res.status}): ` + (await readErrorMessage(res)));
    return;
  }
  await loadCards();
}

async function deactivateCard(uid) {
  const res = await apiFetch(`/ic_cards/${uid}/deactivate`, { method: 'PATCH' });
  if (!res.ok) {
    alert(`Error (${res.status}): ` + (await readErrorMessage(res)));
    return;
  }
  await loadCards();
}

async function activateCard(uid) {
  const res = await apiFetch(`/ic_cards/${uid}/activate`, { method: 'PATCH' });
  if (!res.ok) {
    alert(`Error (${res.status}): ` + (await readErrorMessage(res)));
    return;
  }
  await loadCards();
}

async function registerCard() {
  const ok = await requireLogin();
  if (!ok) return;

  const uid = ($('uid')?.value || '').trim();
  const studentId = parseInt(($('link_sid')?.value || '').trim(), 10);

  if (!uid) {
    alert('No UID detected. Tap a card first.');
    return;
  }
  if (!studentId) {
    alert('Please enter a Student ID.');
    return;
  }

  try {
    const res = await apiFetch(`/ic_cards/${uid}/register`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId }),
    });

    if (res.ok) {
      alert('Card Linked!');
      $('uid').value = '';
      $('link_sid').value = '';
      const status = $('status_msg');
      if (status) status.innerText = '🔍 Scanning for new card taps...';
      await loadUsers();
      await loadActivity();
      return;
    }
    const msg = await readErrorMessage(res);
    alert(`Error (${res.status}): ${msg}`);
  } catch (e) {
    alert('Network Error: ' + (e?.message || String(e)));
  }
}

let pollTimer = null;
let dataTimer = null;

async function pollForNewCard() {
  try {
    const res = await apiFetch('/ic_cards/captured');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const card = await res.json();
    const newUid = card?.uid;

    if (newUid) {
      if ($('uid')) $('uid').value = newUid;
      if ($('status_msg')) $('status_msg').innerText = 'New Card: ' + newUid;
    }
  } catch (e) {
    console.error('pollForNewCard error', e);
  } finally {
    pollTimer = setTimeout(pollForNewCard, 2000);
  }
}

function startTimers() {
  stopTimers();
  pollForNewCard();
  dataTimer = setInterval(loadData, 5000);
}

function stopTimers() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = null;
  if (dataTimer) clearInterval(dataTimer);
  dataTimer = null;
}

window.logout = logout;
window.createUser = createUser;
window.registerCard = registerCard;
window.updateMaxDebt = updateMaxDebt;
window.filterStudents = filterStudents;
window.loadUsers = loadUsers;
window.loadAllUsers = loadAllUsers;
window.toggleUserStatus = toggleUserStatus;
window.loadCards = loadCards;
window.filterCards = filterCards;
window.unlinkCard = unlinkCard;
window.deactivateCard = deactivateCard;
window.filterAllUsers = filterAllUsers;
window.allUsersNextPage = allUsersNextPage;
window.allUsersPrevPage = allUsersPrevPage;

window.debtNextPage = debtNextPage;
window.debtPrevPage = debtPrevPage;

window.cardsNextPage = cardsNextPage;
window.cardsPrevPage = cardsPrevPage;
window.filterShelves = filterShelves;
window.createShelf = createShelf;
window.shelvesNextPage = shelvesNextPage;
window.shelvesPrevPage = shelvesPrevPage;
window.selectShelf = selectShelf;
window.deleteShelf = deleteShelf;

window.addEventListener('load', () => {
  loadData();
  startTimers();
});
