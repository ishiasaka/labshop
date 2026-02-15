const API_BASE = 'http://localhost:8001';
const LOGIN_PAGE = '/login';

function $(id) {
  return document.getElementById(id);
}

function getAdminHeaders() {
  return {
    'Content-Type': 'application/json',
    'admin-id': String(localStorage.getItem('loggedAdminId') || ''),
    'admin-name': String(localStorage.getItem('loggedAdminName') || ''),
  };
}

function isLoggedIn() {
  return !!localStorage.getItem('loggedAdminId');
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = LOGIN_PAGE;
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('loggedAdminId');
  localStorage.removeItem('loggedAdminName');
  localStorage.removeItem('access_token');
  window.location.href = LOGIN_PAGE;
}

async function readErrorMessage(res) {
  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = { detail: await res.text() };
  }

  const detail = payload?.detail;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((d) => d?.msg || d?.message || JSON.stringify(d))
      .join('\n');
  }

  if (detail && typeof detail === 'object') {
    if (detail.message) return detail.message;
    return JSON.stringify(detail, null, 2);
  }

  if (payload?.message) return payload.message;
  return JSON.stringify(payload, null, 2);
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  return res;
}

async function loadData() {
  if (!requireLogin()) return;

  const greeting = $('admin_greeting');
  if (greeting) {
    greeting.innerText =
      'Logged in as: ' + (localStorage.getItem('loggedAdminName') || '');
  }

  await Promise.all([loadUsers(), loadActivity(), loadMaxDebtLimit()]);
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
    const tbody = document.querySelector('#userTable tbody');
    if (!tbody) return;

    const users = data.users || [];
    tbody.innerHTML = users
      .map((u) => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        const debt = Number(u.account_balance || 0);
        const debtClass = debt > 0 ? 'debt-high' : 'debt-zero';
        return `<tr>
          <td>${u.student_id}</td>
          <td>${fullName}</td>
          <td class="${debtClass}">¥${debt}</td>
        </tr>`;
      })
      .join('');

    filterStudents();
  } catch (e) {
    console.error('Load users failed', e);
  }
}

function filterStudents() {
  const input = $('studentSearch');
  const query = (input?.value || '').toLowerCase();

  document.querySelectorAll('#userTable tbody tr').forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(query)
      ? ''
      : 'none';
  });
}

async function loadActivity() {
  try {
    const [pRes, payRes] = await Promise.all([
      apiFetch('/purchases/'),
      apiFetch('/payments/'),
    ]);

    if (!pRes.ok) {
      console.error(
        'purchases load failed',
        pRes.status,
        await readErrorMessage(pRes)
      );
      return;
    }
    if (!payRes.ok) {
      console.error(
        'payments load failed',
        payRes.status,
        await readErrorMessage(payRes)
      );
      return;
    }

    const pData = await pRes.json();
    const payData = await payRes.json();

    const purchases = pData.purchases || [];
    const payments = payData.payments || [];

    const all = [
      ...purchases.map((x) => ({
        time: x.created_at,
        id: x.student_id,
        type: 'PURCHASE',
        amount: x.price,
        color: '#d9534f',
      })),
      ...payments.map((x) => ({
        time: x.created_at,
        id: x.student_id,
        type: 'PAYMENT',
        amount: x.amount_paid,
        color: '#28a745',
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    const tbody = document.querySelector('#activityTable tbody');
    if (!tbody) return;

    tbody.innerHTML = all
      .map(
        (a) => `<tr>
          <td>${new Date(a.time).toLocaleTimeString()}</td>
          <td>ID: ${a.id}</td>
          <td style="color: ${a.color}; font-weight: bold;">${a.type}</td>
          <td>¥${a.amount}</td>
        </tr>`
      )
      .join('');
  } catch (e) {
    console.error('Activity load failed', e);
  }
}

async function createUser() {
  if (!requireLogin()) return;

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
      headers: getAdminHeaders(),
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

async function loadMaxDebtLimit() {}

async function updateMaxDebt() {
  if (!requireLogin()) return;

  const el = $('max_debt_limit');
  if (!el) return;

  const val = String(el.value || '').trim();
  if (!val) {
    alert('Please enter a limit');
    return;
  }

  try {
    const res = await apiFetch('/system_settings/', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ key: 'max_debt_limit', value: val }),
    });

    if (res.ok) {
      alert('Limit Updated to ¥' + val);
      return;
    }

    const msg = await readErrorMessage(res);
    alert(`Error (${res.status}): ${msg}`);
  } catch (e) {
    alert('Network Error: ' + (e?.message || String(e)));
  }
}

async function registerCard() {
  if (!requireLogin()) return;

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
    const res = await apiFetch('/register_card/', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ uid, student_id: studentId }),
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
    const res = await apiFetch('/get_captured_card/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const card = await res.json();

    const newUid = card?.uid;
    if (newUid) {
      if ($('uid')) $('uid').value = newUid;
      if ($('status_msg')) $('status_msg').innerText = '✅ New Card: ' + newUid;
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
  dataTimer = setInterval(loadData, 10000);
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

window.addEventListener('load', () => {
  if (!requireLogin()) return;
  loadData();
  startTimers();
});
