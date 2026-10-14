function renderUserManagementModal() {
  const container = document.getElementById('userManagementModal');
  container.innerHTML = `
    <div class="bg-slate-100 w-full h-full flex flex-col min-h-0 overflow-hidden">
      <!-- Top Bar -->
      <div class="px-6 py-3.5 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-amber-500/20">
            <i class="fa-solid fa-users-gear"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-900 leading-tight">ระบบจัดการผู้ใช้งานและสิทธิ์ (Employee & Access Management)</h3>
            <p class="text-xs text-slate-500">จัดการข้อมูลบัญชีผู้ใช้ สิทธิ์การใช้งาน อุปกรณ์ และสาขาประจำการ</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative">
            <button onclick="toggleUserIOMenu(event)" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
              <i class="fa-solid fa-file-import text-sm"></i>
              <span>นำเข้า / ส่งออก ข้อมูล</span>
              <i class="fa-solid fa-chevron-down text-[10px] ml-1"></i>
            </button>
            
            <div id="userIODropdown" class="hidden absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 w-52 z-30 space-y-1">
              <button onclick="triggerExcelImport()" class="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-all">
                <i class="fa-solid fa-file-excel text-emerald-600 text-sm"></i>
                <span>นำเข้าไฟล์ Excel (.xlsx)</span>
              </button>
              <div class="h-px bg-slate-100 my-1"></div>
              <button onclick="exportUsersToExcel()" class="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-all">
                <i class="fa-solid fa-file-excel text-indigo-600 text-sm"></i>
                <span>ส่งออกข้อมูลเป็น Excel</span>
              </button>
              <button onclick="exportUsersToPDF()" class="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition-all">
                <i class="fa-solid fa-file-pdf text-rose-600 text-sm"></i>
                <span>ส่งออกข้อมูลเป็น PDF</span>
              </button>
            </div>
            
            <input type="file" id="userExcelInput" accept=".xlsx, .xls" class="hidden" onchange="handleExcelImportFile(this)">
          </div>

          <button id="btnOpenUserAddForm" onclick="showUserFormSection()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
            <i class="fa-solid fa-user-plus text-sm"></i>
            <span>เพิ่มพนักงานใหม่</span>
          </button>

          <button id="btnBackToUserList" onclick="hideUserFormSection()" class="hidden bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200">
            <i class="fa-solid fa-arrow-left text-xs"></i>
            <span>กลับไปยังรายการพนักงาน</span>
          </button>

          <button onclick="closeUserManagementModal()" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all border border-slate-200">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
      </div>

      <!-- Main Body Area -->
      <div class="flex-1 overflow-y-auto p-6 min-h-0">
        <div class="max-w-7xl mx-auto space-y-6">

          <!-- VIEW 1: FORM เพิ่ม/แก้ไข -->
          <div id="userFormCard" class="hidden bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-5 animate-in fade-in duration-200">
            <div class="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 id="userFormTitle" class="text-sm font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-user-plus text-base"></i> เพิ่มผู้ใช้งานใหม่
              </h4>
              <button type="button" onclick="hideUserFormSection()" class="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                <i class="fa-solid fa-arrow-left"></i> กลับไปยังรายการพนักงาน
              </button>
            </div>

            <form id="userForm" onsubmit="handleSaveUser(event)" class="space-y-5">
              <input type="hidden" id="editUserId" value="">

              <div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/80 space-y-3">
                <div class="text-xs font-extrabold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                  <i class="fa-solid fa-shield-halved text-indigo-600"></i> 1. ข้อมูลบัญชีและสิทธิ์การใช้งาน
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">1. User (Username) *</label>
                    <div class="relative">
                      <i class="fa-solid fa-at absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="text" id="uUsername" required placeholder="เช่น johndoe" class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                    <div class="relative">
                      <i class="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="password" id="uPassword" placeholder="ปล่อยว่างไว้หากไม่เปลี่ยน" class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">2. Role (สิทธิ์การใช้งาน) *</label>
                    <div class="relative">
                      <i class="fa-solid fa-user-gear absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <select id="uRole" required class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                        <option value="USER">User (ดู/ดาวน์โหลดเอกสาร)</option>
                        <option value="EDITOR">Editor (จัดการเอกสาร นำเข้า/แก้ไข/ลบ)</option>
                        <option value="ADMIN">Admin (สิทธิ์เต็ม จัดการทุกอย่าง + ผู้ใช้งาน)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div class="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <i class="fa-solid fa-id-card text-emerald-600"></i> 2. ข้อมูลส่วนตัวและตำแหน่ง
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">3. Full Name (ชื่อ-นามสกุล)</label>
                    <div class="relative">
                      <i class="fa-solid fa-signature absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="text" id="uFullName" placeholder="เช่น นายสมชาย ใจดี" class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">4. Employee ID (รหัสพนักงาน)</label>
                    <div class="relative">
                      <i class="fa-solid fa-hashtag absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="text" id="uEmployeeId" placeholder="เช่น EMP-2024-001" class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 space-y-3">
                <div class="text-xs font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                  <i class="fa-solid fa-building-user text-amber-600"></i> 3. ข้อมูลอุปกรณ์และสถานที่ปฏิบัติงาน
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">5. Device Name (ชื่ออุปกรณ์)</label>
                    <div class="relative">
                      <i class="fa-solid fa-laptop absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="text" id="uDeviceName" placeholder="เช่น PC-ACCOUNT-01" class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">6. Department (แผนก)</label>
                    <div class="relative">
                      <i class="fa-solid fa-sitemap absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="text" id="uDepartment" placeholder="เช่น บัญชีและการเงิน" class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">7. Plant (โรงงาน/สาขา)</label>
                    <div class="relative">
                      <i class="fa-solid fa-industry absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input type="text" id="uPlant" placeholder="เช่น โรงงานระยอง สาขา 1" class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="hideUserFormSection()" class="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all">ยกเลิก</button>
                <button type="submit" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2">
                  <i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูลพนักงาน
                </button>
              </div>
            </form>
          </div>

          <!-- VIEW 2: ตารางพนักงาน -->
          <div id="userListCard" class="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div class="p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50">
              <div class="flex items-center gap-3">
                <h4 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <i class="fa-solid fa-list text-indigo-600"></i> รายชื่อพนักงานทั้งหมดในระบบ
                </h4>
                <span id="userTotalBadge" class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">0 คน</span>
              </div>

              <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div class="relative min-w-[140px]">
                  <select id="userFilterDepartment" onchange="renderUsersTable()" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    <option value="ALL">-- ทุกแผนก --</option>
                  </select>
                </div>

                <div class="relative min-w-[140px]">
                  <select id="userFilterPlant" onchange="renderUsersTable()" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    <option value="ALL">-- ทุกสาขา/Plant --</option>
                  </select>
                </div>

                <div class="relative w-full sm:w-64">
                  <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input type="text" id="userTableSearch" oninput="renderUsersTable()" placeholder="ค้นหาชื่อ, รหัส, User, แผนก..." class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100/80 text-slate-600 font-extrabold uppercase border-b border-slate-200 text-[11px] tracking-wider">
                  <tr>
                    <th class="p-4">User (Username)</th>
                    <th class="p-4">Full Name (ชื่อ-นามสกุล)</th>
                    <th class="p-4 text-center">Role (สิทธิ์)</th>
                    <th class="p-4">Employee ID</th>
                    <th class="p-4">Department</th>
                    <th class="p-4">Plant</th>
                    <th class="p-4">Device Name</th>
                    <th class="p-4 text-center">Create Date</th>
                    <th class="p-4 text-center">Update Date</th>
                    <th class="p-4 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody id="userTableBody" class="divide-y divide-slate-100 font-medium"></tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

function openUserManagementModal() {
  if (currentUser.role !== 'ADMIN') return;
  resetUserForm();
  hideUserFormSection();
  renderUsersTable();
  document.getElementById('userManagementModal').classList.remove('hidden');
}

function closeUserManagementModal() {
  document.getElementById('userManagementModal').classList.add('hidden');
}

function showUserFormSection() {
  document.getElementById('userListCard').classList.add('hidden');
  document.getElementById('userFormCard').classList.remove('hidden');
  document.getElementById('btnOpenUserAddForm').classList.add('hidden');
  document.getElementById('btnBackToUserList').classList.remove('hidden');
}

function hideUserFormSection() {
  document.getElementById('userFormCard').classList.add('hidden');
  document.getElementById('userListCard').classList.remove('hidden');
  document.getElementById('btnOpenUserAddForm').classList.remove('hidden');
  document.getElementById('btnBackToUserList').classList.add('hidden');
  resetUserForm();
}

function resetUserForm() {
  document.getElementById('userForm').reset();
  document.getElementById('editUserId').value = '';
  document.getElementById('userFormTitle').innerHTML = '<i class="fa-solid fa-user-plus text-base"></i> เพิ่มผู้ใช้งานใหม่';
}

function handleSaveUser(e) {
  e.preventDefault();
  if (currentUser.role !== 'ADMIN') return;

  const editId = document.getElementById('editUserId').value;
  const username = document.getElementById('uUsername').value.trim();
  const password = document.getElementById('uPassword').value.trim();
  const role = document.getElementById('uRole').value;
  const fullName = document.getElementById('uFullName').value.trim();
  const employeeId = document.getElementById('uEmployeeId').value.trim();
  const deviceName = document.getElementById('uDeviceName').value.trim();
  const department = document.getElementById('uDepartment').value.trim();
  const plant = document.getElementById('uPlant').value.trim();

  const nowStr = getFormattedDateTime();
  let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

  if (editId) {
    const index = users.findIndex(u => u.id == editId);
    if (index !== -1) {
      users[index].username = username;
      if (password) users[index].password = password;
      users[index].role = role;
      users[index].fullName = fullName;
      users[index].employeeId = employeeId;
      users[index].deviceName = deviceName;
      users[index].department = department;
      users[index].plant = plant;
      users[index].updateDate = nowStr;
    }
  } else {
    if (users.some(u => u.username === username)) {
      alert('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
      return;
    }
    if (!password) {
      alert('กรุณากรอกรหัสผ่านสำหรับผู้ใช้งานใหม่');
      return;
    }
    users.push({
      id: Date.now(),
      username, password, role, fullName, employeeId, deviceName, department, plant,
      createDate: nowStr,
      updateDate: nowStr
    });
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  hideUserFormSection();
  renderUsersTable();
}

function editUser(id) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.id == id);
  if (!user) return;

  document.getElementById('editUserId').value = user.id;
  document.getElementById('uUsername').value = user.username || '';
  document.getElementById('uPassword').value = '';
  document.getElementById('uRole').value = user.role || 'USER';
  document.getElementById('uFullName').value = user.fullName || '';
  document.getElementById('uEmployeeId').value = user.employeeId || '';
  document.getElementById('uDeviceName').value = user.deviceName || '';
  document.getElementById('uDepartment').value = user.department || '';
  document.getElementById('uPlant').value = user.plant || '';

  document.getElementById('userFormTitle').innerHTML = '<i class="fa-solid fa-user-pen text-base"></i> แก้ไขข้อมูลผู้ใช้งาน';
  showUserFormSection();
}

function deleteUser(id) {
  if (id == currentUser.id) {
    alert('ไม่สามารถลบบัญชีผู้ใช้ที่คุณกำลังใช้งานอยู่ได้');
    return;
  }
  if (confirm('คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?')) {
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users = users.filter(u => u.id != id);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    renderUsersTable();
  }
}

function toggleUserIOMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('userIODropdown');
  menu.classList.toggle('hidden');
}

function renderUsersTable() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const searchKeyword = (document.getElementById('userTableSearch')?.value || '').toLowerCase().trim();
  const selectedDept = document.getElementById('userFilterDepartment')?.value || 'ALL';
  const selectedPlant = document.getElementById('userFilterPlant')?.value || 'ALL';

  const depts = Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort();
  const plants = Array.from(new Set(users.map(u => u.plant).filter(Boolean))).sort();

  const deptSelect = document.getElementById('userFilterDepartment');
  const plantSelect = document.getElementById('userFilterPlant');

  if (deptSelect && deptSelect.options.length <= 1) {
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      deptSelect.appendChild(opt);
    });
  }

  if (plantSelect && plantSelect.options.length <= 1) {
    plants.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p; opt.textContent = p;
      plantSelect.appendChild(opt);
    });
  }

  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '';

  const filteredUsers = users.filter(u => {
    const matchDept = selectedDept === 'ALL' || u.department === selectedDept;
    const matchPlant = selectedPlant === 'ALL' || u.plant === selectedPlant;

    let matchText = true;
    if (searchKeyword) {
      matchText = (u.username || '').toLowerCase().includes(searchKeyword) ||
                 (u.fullName || '').toLowerCase().includes(searchKeyword) ||
                 (u.employeeId || '').toLowerCase().includes(searchKeyword) ||
                 (u.department || '').toLowerCase().includes(searchKeyword) ||
                 (u.plant || '').toLowerCase().includes(searchKeyword) ||
                 (u.deviceName || '').toLowerCase().includes(searchKeyword);
    }

    return matchDept && matchPlant && matchText;
  });

  document.getElementById('userTotalBadge').textContent = `${filteredUsers.length} คน`;

  if (filteredUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="p-8 text-center text-slate-400 font-medium">ไม่พบข้อมูลพนักงานที่ค้นหา</td>
      </tr>
    `;
    return;
  }

  filteredUsers.forEach(u => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50/80 transition-all";

    let roleBadgeClass = "bg-slate-100 text-slate-600 border border-slate-200";
    if (u.role === 'ADMIN') roleBadgeClass = "bg-amber-100 text-amber-800 border border-amber-200";
    if (u.role === 'EDITOR') roleBadgeClass = "bg-blue-100 text-blue-800 border border-blue-200";

    tr.innerHTML = `
      <td class="p-4">
        <div class="font-bold text-indigo-600 text-sm flex items-center gap-2">
          <i class="fa-solid fa-circle-user text-indigo-400 text-base"></i>
          <span>${escapeHtml(u.username)}</span>
        </div>
      </td>
      <td class="p-4">
        <div class="text-slate-800 font-bold text-sm">${escapeHtml(u.fullName || '-')}</div>
      </td>
      <td class="p-4 text-center">
        <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${roleBadgeClass}">${u.role}</span>
      </td>
      <td class="p-4 font-bold text-slate-700 text-xs">
        ${escapeHtml(u.employeeId || '-')}
      </td>
      <td class="p-4 text-slate-800 font-bold">
        ${escapeHtml(u.department || '-')}
      </td>
      <td class="p-4 text-slate-600 font-semibold">
        ${escapeHtml(u.plant || '-')}
      </td>
      <td class="p-4 text-slate-600 font-semibold">
        <div class="flex items-center gap-1.5">
          <i class="fa-solid fa-laptop text-slate-400 text-xs"></i>
          <span>${escapeHtml(u.deviceName || '-')}</span>
        </div>
      </td>
      <td class="p-4 text-center text-[11px] text-slate-500 font-medium whitespace-nowrap">
        ${escapeHtml(u.createDate || '-')}
      </td>
      <td class="p-4 text-center text-[11px] text-indigo-600 font-medium whitespace-nowrap">
        ${escapeHtml(u.updateDate || '-')}
      </td>
      <td class="p-4 text-center space-x-1 whitespace-nowrap">
        <button onclick="editUser(${u.id})" class="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs">แก้ไข</button>
        <button onclick="deleteUser(${u.id})" class="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs">ลบ</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}