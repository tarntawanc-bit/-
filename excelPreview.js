let pendingImportUsers = [];

function renderExcelPreviewModal() {
  const container = document.getElementById('excelPreviewModal');
  container.innerHTML = `
    <div class="bg-white w-full h-full rounded-3xl border border-slate-200 shadow-2xl flex flex-col min-h-0 overflow-hidden max-w-7xl mx-auto">
      <div class="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <i class="fa-solid fa-file-excel"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-900 leading-tight">ตรวจสอบและแก้ไขข้อมูลก่อนนำเข้า (Import Verification)</h3>
            <p class="text-xs text-slate-500">ตรวจสอบความถูกต้อง แก้ไข หรือลบแถวที่ไม่ต้องการก่อนกดยืนยันบันทึกเข้าสู่ระบบ</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="confirmImportUsers()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95">
            <i class="fa-solid fa-circle-check"></i> ยืนยันนำเข้าข้อมูล
          </button>
          <button onclick="closeExcelPreviewModal()" class="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-all">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 p-6 overflow-y-auto min-h-0">
        <div class="overflow-x-auto border border-slate-200 rounded-2xl">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 text-[11px] tracking-wider">
              <tr>
                <th class="p-3 w-10 text-center">#</th>
                <th class="p-3">Username *</th>
                <th class="p-3">Password</th>
                <th class="p-3">Role *</th>
                <th class="p-3">Full Name *</th>
                <th class="p-3">Emp ID *</th>
                <th class="p-3">Department *</th>
                <th class="p-3">Plant *</th>
                <th class="p-3">Device Name *</th>
                <th class="p-3 text-center w-16">ลบ</th>
              </tr>
            </thead>
            <tbody id="excelPreviewTableBody" class="divide-y divide-slate-100 font-medium"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function triggerExcelImport() {
  closeAllDropdowns();
  document.getElementById('userExcelInput').value = '';
  document.getElementById('userExcelInput').click();
}

function handleExcelImportFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonRows.length === 0) {
        alert('ไม่พบข้อมูลพนักงานในไฟล์ Excel ที่เลือก');
        return;
      }

      let invalidRowsCount = 0;
      let parsedUsers = [];

      jsonRows.forEach((row) => {
        const username = String(row['Username'] || row['username'] || '').trim();
        const password = String(row['Password'] || row['password'] || '123456').trim();
        const role = String(row['Role'] || row['role'] || 'USER').trim().toUpperCase();
        const fullName = String(row['Full Name'] || row['Name'] || row['fullName'] || row['ชื่อ-นามสกุล'] || '').trim();
        const employeeId = String(row['Employee ID'] || row['Emp ID'] || row['employeeId'] || row['รหัสพนักงาน'] || '').trim();
        const department = String(row['Department'] || row['department'] || row['แผนก'] || '').trim();
        const plant = String(row['Plant'] || row['plant'] || row['สาขา'] || row['โรงงาน'] || '').trim();
        const deviceName = String(row['Device Name'] || row['deviceName'] || row['อุปกรณ์'] || '').trim();

        if (!username || !role || !fullName || !employeeId || !department || !plant || !deviceName) {
          invalidRowsCount++;
        } else {
          parsedUsers.push({
            username, password, 
            role: ['ADMIN', 'EDITOR'].includes(role) ? role : 'USER',
            fullName, employeeId, department, plant, deviceName
          });
        }
      });

      if (invalidRowsCount > 0) {
        alert(`ไม่สามารถนำเข้าข้อมูลได้!\nพบข้อมูลไม่ครบถ้วนทุกช่องจำนวน ${invalidRowsCount} รายการในไฟล์ Excel\n\n* กรุณาตรวจสอบให้แน่ใจว่าได้กรอกข้อมูล Username, Role, Full Name, Emp ID, Department, Plant และ Device Name ครบทุกช่อง`);
        return;
      }

      pendingImportUsers = parsedUsers;
      renderExcelPreviewTable();
      document.getElementById('excelPreviewModal').classList.remove('hidden');

    } catch (err) {
      console.error("Excel Read Error:", err);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์');
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderExcelPreviewTable() {
  const tbody = document.getElementById('excelPreviewTableBody');
  tbody.innerHTML = '';

  if (pendingImportUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">ไม่มีข้อมูลพนักงานสำหรับนำเข้า</td></tr>`;
    return;
  }

  pendingImportUsers.forEach((u, idx) => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-50";
    tr.innerHTML = `
      <td class="p-3 text-center font-bold text-slate-400">${idx + 1}</td>
      <td class="p-2"><input type="text" value="${escapeHtml(u.username)}" onchange="updatePendingUser(${idx}, 'username', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"></td>
      <td class="p-2"><input type="password" value="${escapeHtml(u.password)}" onchange="updatePendingUser(${idx}, 'password', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"></td>
      <td class="p-2">
        <select onchange="updatePendingUser(${idx}, 'role', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="USER" ${u.role === 'USER' ? 'selected' : ''}>USER</option>
          <option value="EDITOR" ${u.role === 'EDITOR' ? 'selected' : ''}>EDITOR</option>
          <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
        </select>
      </td>
      <td class="p-2"><input type="text" value="${escapeHtml(u.fullName)}" onchange="updatePendingUser(${idx}, 'fullName', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"></td>
      <td class="p-2"><input type="text" value="${escapeHtml(u.employeeId)}" onchange="updatePendingUser(${idx}, 'employeeId', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"></td>
      <td class="p-2"><input type="text" value="${escapeHtml(u.department)}" onchange="updatePendingUser(${idx}, 'department', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"></td>
      <td class="p-2"><input type="text" value="${escapeHtml(u.plant)}" onchange="updatePendingUser(${idx}, 'plant', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"></td>
      <td class="p-2"><input type="text" value="${escapeHtml(u.deviceName)}" onchange="updatePendingUser(${idx}, 'deviceName', this.value)" class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"></td>
      <td class="p-2 text-center">
        <button onclick="removePendingUser(${idx})" class="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center transition-all border border-rose-200" title="ลบรายการนี้">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updatePendingUser(idx, key, value) {
  if (pendingImportUsers[idx]) {
    pendingImportUsers[idx][key] = value.trim();
  }
}

function removePendingUser(idx) {
  pendingImportUsers.splice(idx, 1);
  renderExcelPreviewTable();
}

function closeExcelPreviewModal() {
  pendingImportUsers = [];
  document.getElementById('excelPreviewModal').classList.add('hidden');
}

function confirmImportUsers() {
  let invalidFound = false;
  pendingImportUsers.forEach(u => {
    if (!u.username || !u.role || !u.fullName || !u.employeeId || !u.department || !u.plant || !u.deviceName) {
      invalidFound = true;
    }
  });

  if (invalidFound) {
    alert('กรุณากรอกข้อมูลพนักงานให้ครบถ้วนทุกช่องก่อนกดยืนยันนำเข้า');
    return;
  }

  let existingUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const nowStr = getFormattedDateTime();

  pendingImportUsers.forEach(nu => {
    const existingIdx = existingUsers.findIndex(u => u.username === nu.username);
    if (existingIdx !== -1) {
      existingUsers[existingIdx] = {
        ...existingUsers[existingIdx],
        password: nu.password || existingUsers[existingIdx].password,
        role: nu.role,
        fullName: nu.fullName,
        employeeId: nu.employeeId,
        department: nu.department,
        plant: nu.plant,
        deviceName: nu.deviceName,
        updateDate: nowStr
      };
    } else {
      existingUsers.push({
        id: Date.now() + Math.random(),
        username: nu.username,
        password: nu.password || '123456',
        role: nu.role,
        fullName: nu.fullName,
        employeeId: nu.employeeId,
        department: nu.department,
        plant: nu.plant,
        deviceName: nu.deviceName,
        createDate: nowStr,
        updateDate: nowStr
      });
    }
  });

  localStorage.setItem(USERS_KEY, JSON.stringify(existingUsers));
  closeExcelPreviewModal();
  renderUsersTable();
  alert(`นำเข้าข้อมูลพนักงานจำนวน ${pendingImportUsers.length} รายการ เรียบร้อยแล้ว!`);
}