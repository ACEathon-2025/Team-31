/* script.js - simple shared JS for all pages
   Purpose: store and read small demo data in localStorage and update page UI.
   Keys in localStorage:
     - sbp_username  (string)
     - sbp_transactions (array of objects)
     - sbp_goals (array of objects)
     - sbp_income (number)
*/

/* ---------- small helpers ---------- */
function readJSON(key, fallback){
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
function writeJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

/* get/save helpers */
function getTransactions(){ return readJSON('sbp_transactions', []); }
function saveTransactions(arr){ writeJSON('sbp_transactions', arr); }

function getGoals(){ return readJSON('sbp_goals', []); }
function saveGoals(arr){ writeJSON('sbp_goals', arr); }

function getIncome(){ return Number(localStorage.getItem('sbp_income') || 0); }
function saveIncome(v){ localStorage.setItem('sbp_income', Number(v)); }

function getUsername(){ return localStorage.getItem('sbp_username') || ''; }
function saveUsername(name){ localStorage.setItem('sbp_username', name); }
function logout(){ localStorage.removeItem('sbp_username'); window.location.href = 'login.html'; }

/* small format helper */
function rupee(n){ return '₹' + Number(n).toFixed(2); }

/* If user is not set and page is not login, go to login */
function requireLogin(){
  const name = getUsername();
  if (!name && document.body.dataset.page !== 'login'){
    window.location.href = 'login.html';
  }
}

/* ---------- LOGIN page setup ---------- */
function setupLogin(){
  requireLogin(); // if already logged in, will redirect to dashboard
  const form = document.getElementById('loginForm');
  const nameInput = document.getElementById('name');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();                 // stop page reload
    const name = nameInput.value.trim();
    if (!name){ alert('Please enter your name'); return; }
    saveUsername(name);
    window.location.href = 'dashboard.html';
  });
}

/* ---------- DASHBOARD ---------- */
function setupDashboard(){
  requireLogin();
  const greet = document.getElementById('greet');
  const incomeInput = document.getElementById('incomeInput');
  const saveIncomeBtn = document.getElementById('saveIncome');

  if (greet) greet.textContent = 'Hello, ' + (getUsername() || 'Student');
  if (incomeInput) incomeInput.value = getIncome();

  if (saveIncomeBtn){
    saveIncomeBtn.addEventListener('click', function(){
      const val = Number(incomeInput.value) || 0;
      saveIncome(val);
      updateDashboard();
      alert('Income saved');
    });
  }

  updateDashboard();
  renderRecent();
}

/* update the three dashboard cards */
function updateDashboard(){
  const list = getTransactions();
  const income = getIncome();
  const totalIncomeFromTx = list.filter(t=>t.type==='income').reduce((s,t)=>s + t.amount, 0);
  const usedIncome = income || totalIncomeFromTx; // prefer manual income if provided

  const totalExpenses = list.filter(t=>t.type==='expense').reduce((s,t)=>s + t.amount, 0);
  const balance = usedIncome - totalExpenses;

  const incEl = document.getElementById('incomeCard');
  const expEl = document.getElementById('expensesCard');
  const balEl = document.getElementById('balanceCard');

  if (incEl) incEl.textContent = rupee(usedIncome);
  if (expEl) expEl.textContent = rupee(totalExpenses);
  if (balEl) balEl.textContent = rupee(balance);
}

/* show up to 3 recent transactions */
function renderRecent(){
  const recent = document.getElementById('recentList');
  if (!recent) return;
  const list = getTransactions().slice().reverse().slice(0,3);
  if (!list.length){ recent.innerHTML = '<li class="small">No transactions yet</li>'; return; }
  recent.innerHTML = list.map(t => `<li><strong>${t.desc}</strong><div class="small">${t.type} • ${rupee(t.amount)}</div></li>`).join('');
}

/* ---------- TRANSACTIONS ---------- */
function setupTransactions(){
  requireLogin();
  const desc = document.getElementById('desc');
  const amt = document.getElementById('amt');
  const type = document.getElementById('type');
  const add = document.getElementById('addTrans');

  if (add){
    add.addEventListener('click', function(){
      const d = desc.value.trim();
      const a = Number(amt.value);
      const ty = type.value;
      if (!d || !a || a <= 0){ alert('Enter valid details'); return; }
      const arr = getTransactions();
      arr.push({ desc: d, amount: a, type: ty, date: new Date().toISOString() });
      saveTransactions(arr);
      desc.value=''; amt.value='';
      renderTransactions();
      updateDashboard();
    });
  }
  renderTransactions();
}

/* draw transactions list with delete */
function renderTransactions(){
  const ul = document.getElementById('expenseList');
  if (!ul) return;
  const arr = getTransactions();
  if (!arr.length){ ul.innerHTML = '<li class="small">No transactions yet</li>'; return; }
  ul.innerHTML = arr.map((t,i) => `
    <li>
      <div>
        <strong>${t.desc}</strong>
        <div class="small">${new Date(t.date).toLocaleString()} • ${t.type}</div>
      </div>
      <div style="text-align:right;">
        <div>${rupee(t.amount)}</div>
        <div style="margin-top:6px;">
          <button class="secondary" onclick="deleteTransaction(${i})">Delete</button>
        </div>
      </div>
    </li>
  `).join('');
}
function deleteTransaction(index){
  const arr = getTransactions(); arr.splice(index,1); saveTransactions(arr);
  renderTransactions(); updateDashboard(); renderRecent();
}

/* ---------- GOALS ---------- */
function setupGoals(){
  requireLogin();
  const name = document.getElementById('goalName');
  const target = document.getElementById('goalTarget');
  const add = document.getElementById('addGoalBtn');

  if (add){
    add.addEventListener('click', function(){
      const n = name.value.trim();
      const t = Number(target.value);
      if (!n || !t || t <= 0){ alert('Enter valid goal'); return; }
      const arr = getGoals();
      arr.push({ name: n, target: t, saved: 0 });
      saveGoals(arr);
      name.value=''; target.value='';
      renderGoals();
    });
  }
  renderGoals();
}

/* draw goals with simple progress and options */
function renderGoals(){
  const ul = document.getElementById('goalList');
  if (!ul) return;
  const arr = getGoals();
  if (!arr.length){ ul.innerHTML = '<li class="small">No goals yet</li>'; return; }
  ul.innerHTML = arr.map((g,i) => {
    const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
    return `<li>
      <div style="width:65%;">
        <strong>${g.name}</strong>
        <div class="small">Target: ${rupee(g.target)} • Saved: ${rupee(g.saved)}</div>
        <div style="margin-top:8px;background:rgba(255,255,255,0.03);height:10px;border-radius:6px;overflow:hidden;">
          <div style="height:100%;background:linear-gradient(90deg,var(--accent),#0072ff);width:${pct}%"></div>
        </div>
      </div>
      <div style="text-align:right;">
        <button class="secondary" onclick="addToGoal(${i})">Add</button>
        <button class="secondary" onclick="removeGoal(${i})" style="margin-top:6px">Remove</button>
      </div>
    </li>`;
  }).join('');
}
function addToGoal(i){
  const amt = Number(prompt('Enter amount to add to this goal (₹):', '0'));
  if (!amt || amt <= 0) return;
  const arr = getGoals(); arr[i].saved += amt; saveGoals(arr); renderGoals();
}
function removeGoal(i){
  if (!confirm('Remove this goal?')) return;
  const arr = getGoals(); arr.splice(i,1); saveGoals(arr); renderGoals();
}

/* ---------- Run page specific setup based on data-page ---------- */
document.addEventListener('DOMContentLoaded', function(){
  const page = document.body.dataset.page || '';
  if (page === 'login') setupLogin();
  if (page === 'dashboard') setupDashboard();
  if (page === 'transactions') setupTransactions();
  if (page === 'goals') setupGoals();
});
