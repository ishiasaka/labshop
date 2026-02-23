const API_PREFIX = 'http://localhost:8000';
const LOGIN_PAGE = '/login';

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
    const res = await apiFetch('/');
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

async function loadData() {
  const ok = await requireLogin();
  if (!ok) return;

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

    if (!pRes.ok || !payRes.ok) return;

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
        className: 'purchase',
      })),
      ...payments.map((x) => ({
        time: x.created_at,
        id: x.student_id,
        type: 'PAYMENT',
        amount: x.amount_paid,
        className: 'payment',
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
          <td class="${a.className}">${a.type}</td>
          <td>¥${a.amount}</td>
        </tr>`
      )
      .join('');
  } catch (e) {
    console.error('Activity load failed', e);
  }
}

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

window.addEventListener('load', () => {
  loadData();
  startTimers();
});
