let currentUser = null;

function renderLoginScreen() {
  const container = document.getElementById('loginScreen');
  container.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200">
      <div class="text-center space-y-2 mb-8">
        <div class="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-indigo-500/30">
          <i class="fa-solid fa-vault"></i>
        </div>
        <h2 class="text-2xl font-bold text-slate-900">เข้าสู่ระบบ Apex Vault</h2>
        <p class="text-xs text-slate-500">เข้าใช้งานด้วยบัญชีที่ลงทะเบียนโดยผู้ดูแลระบบ</p>
      </div>

      <form onsubmit="handleLogin(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">ชื่อผู้ใช้งาน (Username)</label>
          <div class="relative">
            <i class="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input type="text" id="loginUsername" required placeholder="ป้อนชื่อผู้ใช้งาน..." class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">รหัสผ่าน (Password)</label>
          <div class="relative">
            <i class="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input type="password" id="loginPassword" required placeholder="ป้อนรหัสผ่าน..." class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all">
          </div>
        </div>

        <div id="loginErrorMsg" class="hidden text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
          <i class="fa-solid fa-circle-exclamation"></i>
          <span>ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง</span>
        </div>

        <button type="submit" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mt-2">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>เข้าสู่ระบบ</span>
        </button>
      </form>
    </div>
  `;
}

function checkSessionAndStart() {
  const sessionData = localStorage.getItem(CURRENT_USER_KEY);
  if (sessionData) {
    currentUser = JSON.parse(sessionData);
    showMainApp();
  } else {
    showLoginScreen();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const uInput = document.getElementById('loginUsername').value.trim();
  const pInput = document.getElementById('loginPassword').value.trim();
  const errBox = document.getElementById('loginErrorMsg');

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const foundUser = users.find(u => u.username === uInput && u.password === pInput);

  if (foundUser) {
    errBox.classList.add('hidden');
    currentUser = foundUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    showMainApp();
  } else {
    errBox.classList.remove('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  currentUser = null;
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginErrorMsg').classList.add('hidden');
}