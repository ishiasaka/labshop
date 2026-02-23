async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const res = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    alert('Login failed: ' + (await readErrorMessage(res)));
    return;
  }

  window.location.href = '/admin';
}
window.login = login;
