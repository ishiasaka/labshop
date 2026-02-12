const getAdminHeaders = () => ({
            'Content-Type': 'application/json',
            'admin-id': localStorage.getItem('loggedAdminId'),
            'admin-name': localStorage.getItem('loggedAdminName')
        });
        

        if (!localStorage.getItem('loggedAdminId')) window.location.href = "login.html";

        function logout() {
            localStorage.clear();
            window.location.href = "login.html";
        }

        async function loadData() {
            document.getElementById('admin_greeting').innerText = "Logged in as: " + localStorage.getItem('loggedAdminName');
            await loadUsers();
            await loadActivity();
        }

        async function loadUsers() {
            try {
                const res = await fetch('/users/');
                const data = await res.json();
                const tbody = document.querySelector("#userTable tbody");
                
                tbody.innerHTML = data.users.map(u => {
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                    const debtClass = u.account_balance > 0 ? 'debt-high' : 'debt-zero';
                    return `<tr>
                        <td>${u.student_id}</td>
                        <td>${fullName}</td>
                        <td class="${debtClass}">¥${u.account_balance}</td>
                    </tr>`;
                }).join('');
                filterStudents();
            } catch (e) { console.error("Load users failed", e); }
        }

        async function loadActivity() {
            try {
                const [pRes, payRes] = await Promise.all([fetch('/purchases/'), fetch('/payments/')]);
                const pData = (await pRes.json()).purchases || [];
                const payData = (await payRes.json()).payments || [];

                const all = [
                    ...pData.map(x => ({ time: x.created_at, id: x.student_id, type: 'PURCHASE', amount: x.price, color: '#d9534f' })),
                    ...payData.map(x => ({ time: x.created_at, id: x.student_id, type: 'PAYMENT', amount: x.amount_paid, color: '#28a745' }))
                ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

                document.querySelector("#activityTable tbody").innerHTML = all.map(a => `
                    <tr>
                        <td>${new Date(a.time).toLocaleTimeString()}</td>
                        <td>ID: ${a.id}</td>
                        <td style="color: ${a.color}; font-weight: bold;">${a.type}</td>
                        <td>¥${a.amount}</td>
                    </tr>
                `).join('');
            } catch (e) { console.error("Activity load failed", e); }
        }

       async function createUser() {
            try {
                const res = await fetch('/users/', {
                    method: 'POST',
                    headers: getAdminHeaders(),
                    body: JSON.stringify({
                        student_id: parseInt(document.getElementById('sid').value),
                        first_name: document.getElementById('fname').value,
                        last_name: document.getElementById('lname').value
                    })
                });

            if (res.ok) { 
                alert("Student Created!"); 
                loadData(); 
                document.getElementById('sid').value = "";
                document.getElementById('fname').value = "";
                document.getElementById('lname').value = "";
            } else {
                const errorData = await res.json();
                alert("Error: " + (errorData.detail || "Could not create student"));
            }
            } catch (err) {
                console.error(err);
                alert("Network Error: Please check if the server is running.");
            }
        }
        async function registerCard() {
            const res = await fetch('/register_card/', {
                method: 'POST',
                headers: getAdminHeaders(),
                body: JSON.stringify({
                    uid: document.getElementById('uid').value,
                    student_id: parseInt(document.getElementById('link_sid').value),
                    admin_id: localStorage.getItem('loggedAdminId'),
                    admin_name: localStorage.getItem('loggedAdminName')
                })
            });
            if (res.ok) { 
                alert("Card Linked!"); 
                document.getElementById('uid').value = "";
                document.getElementById('link_sid').value = "";
                loadData(); 
            }
            else {
                const error = await res.json();
                alert("Error: " + (error.detail || "Could not link card"));
            }
        } 

        async function updateMaxDebt() {
            const element = document.getElementById('max_debt_limit');
    
            if (!element) {
                console.error("Could not find an HTML element with id='max_debt_limit'");
                return;
            }

                const val = element.value;

            if (!val) {
                alert("Please enter a limit");
                return;
            }

            try {
                const res = await fetch('/system_settings/', {
                    method: 'POST',
                    headers: getAdminHeaders(),
                    body: JSON.stringify({ 
                        key: "max_debt_limit", 
                        value: String(val) 
                    })
                });

            if (res.ok) {
                alert("Limit Updated to ¥" + val);
            } else {
                const errData = await res.json();
                alert("Server Error: " + (errData.detail || "Update failed"));
            }
            } catch (err) {
                alert("Connection failed. Is the server running?");
            }
        }

        function filterStudents() {
            const query = document.getElementById('studentSearch').value.toLowerCase();
            document.querySelectorAll("#userTable tbody tr").forEach(row => {
                row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none";
            });
        }

        async function pollForNewCard() {
            const res = await fetch('/get_captured_card/');
            const data = await res.json();
            if (data && data.uid) {
                document.getElementById('uid').value = data.uid;
                document.getElementById('status_msg').innerText = "New Card: " + data.uid;
            }
        }

        

        window.onload = loadData;
        window.logout = logout;
        setInterval(pollForNewCard, 2000);
        setInterval(loadData, 10000);