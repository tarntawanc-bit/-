// ==========================================
// 1. ตัวแปร Global และการจัดการ State
// ==========================================
let historyLogs = [];
let isSelectDeleteMode = false;
let isSelectRestoreMode = false;
let historyCurrentPage = 1;
let historyItemsPerPage = 10;

let historySortColumn = null; 
let historySortDirection = 'desc';   
let thaiSarabunBase64 = null;

// ==========================================
// 2. ฟังก์ชันหลักสำหรับ Restore ข้อมูลกลับตารางหลักในตำแหน่งเดิม
// ==========================================
if (typeof window.restoreDocumentData !== 'function') {
  window.restoreDocumentData = function(dataToRestore) {
    if (!dataToRestore) {
      throw new Error("ไม่พบข้อมูลเดิม (beforeState) สำหรับทำการ Restore");
    }

    const storageKey = 'app_documents_data';
    const rawData = localStorage.getItem(storageKey);
    let mainDocuments = rawData ? JSON.parse(rawData) : [];

    const targetId = dataToRestore.id || dataToRestore.docNumber || dataToRestore.number;
    
    // ค้นหาตำแหน่งเดิมของเอกสารด้วย id หรือ docNumber
    const index = mainDocuments.findIndex(doc => 
      (doc.id && doc.id === targetId) || 
      (doc.docNumber && doc.docNumber === targetId) ||
      (doc.number && doc.number === targetId)
    );

    if (index !== -1) {
      // 🔹 คืนค่าข้อมูล state เดิมลงในตำแหน่งเดิมทันที (กรณี UPDATE)
      mainDocuments[index] = { ...dataToRestore };
    } else {
      // 🔹 หากเป็นรายการที่เคยลบออกไป ให้นำกลับมาไว้ที่รายการแรกสุด (กรณี DELETE)
      mainDocuments.unshift({ ...dataToRestore });
    }

    localStorage.setItem(storageKey, JSON.stringify(mainDocuments));

    // สั่งให้หน้า Dashboard รีเฟรชตารางข้อมูลใหม่
    if (typeof window.applyFilters === 'function') {
      window.applyFilters();
    } else if (typeof window.renderDashboardComponent === 'function') {
      window.renderDashboardComponent();
    }
  };
}

// ==========================================
// 3. Helper Functions & Helper UI
// ==========================================
function loadExportLibraries(callback) {
  const libraries = [
    { id: 'jspdf-lib', url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' },
    { id: 'autotable-lib', url: 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js' }
  ];

  function loadScriptAtIndex(index) {
    if (index >= libraries.length) {
      if (typeof callback === 'function') callback();
      return;
    }

    const lib = libraries[index];
    if (document.getElementById(lib.id)) {
      loadScriptAtIndex(index + 1);
    } else {
      const script = document.createElement('script');
      script.id = lib.id;
      script.src = lib.url;
      script.onload = () => loadScriptAtIndex(index + 1);
      script.onerror = () => loadScriptAtIndex(index + 1);
      document.head.appendChild(script);
    }
  }

  loadScriptAtIndex(0);
}

function isUserAdmin() {
  if (typeof window.checkAdminAccess === 'function') {
    return window.checkAdminAccess();
  }
  if (typeof checkAdminAccess === 'function') {
    return checkAdminAccess();
  }
  
  const activeUser = window.currentUser || window.user || window.loggedInUser || (typeof currentUser !== 'undefined' ? currentUser : {});
  const userRole = (activeUser.role || activeUser.userRole || '').toUpperCase();
  return userRole === 'ADMIN';
}

function toggleExportDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('exportMenuDropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('exportMenuDropdown');
  const btn = document.getElementById('btnExportDropdown');
  if (dropdown && !dropdown.classList.contains('hidden')) {
    if (btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  }
});

function formatDateTimeSplit(dateStr) {
  if (!dateStr || dateStr === '-') return { date: '-', time: '-' };
  const parts = dateStr.trim().split(/[\s,]+/);
  return {
    date: parts[0] || '-',
    time: parts[1] || '-'
  };
}

function toggleUpdateDeleteOption(show) {
  const opt = document.getElementById('optUpdateDelete');
  if (opt) {
    if (show) {
      opt.classList.remove('hidden');
      opt.style.display = 'block';
    } else {
      opt.classList.add('hidden');
      opt.style.display = 'none';
    }
  }
}

// Helper สกัดค่าจาก Object ป้องกันการดึงค่า Null/Undefined
function extractDocVal(obj, key) {
  if (!obj) return '';
  return String(obj[key] || '').trim();
}

// ==========================================
// 4. Modal Render & Table Operations
// ==========================================
function openHistoryLogsModal() {
  loadExportLibraries();

  let modal = document.getElementById('historyLogsModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'historyLogsModal';
    modal.className = 'fixed inset-0 w-screen h-screen bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-0 overflow-hidden animate-in fade-in duration-200';
    
    modal.innerHTML = `
      <div class="bg-white w-full h-full flex flex-col overflow-hidden">
        
        <!-- Header Bar -->
        <div class="px-6 py-4 bg-slate-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <i class="fa-solid fa-clock-rotate-left text-xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-lg leading-tight">System Audit & Activity Logs</h3>
              <p class="text-xs text-slate-300">Track and manage document import, update, and deletion history</p>
            </div>
          </div>
          
          <button onclick="closeHistoryLogsModal()" class="text-slate-400 hover:text-white hover:bg-slate-700/80 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95" title="Close">
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <!-- Filter & Search Bar -->
        <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 shrink-0 shadow-2xs">
          <div class="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div class="relative flex-1 min-w-[180px]">
              <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input type="text" id="logSearchInput" oninput="resetPageAndRenderLogs()" placeholder="Search Doc No, Company, Detail, Name..." class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-2xs">
            </div>

            <select id="logActionFilter" onchange="resetPageAndRenderLogs()" class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs">
              <option value="ALL">-- All Actions --</option>
              <option id="optUpdateDelete" value="UPDATE_DELETE" class="hidden" style="display: none;">-- UPDATE & DELETE Only --</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="DOWNLOAD">DOWNLOAD</option>
              <option value="RESTORE">RESTORE</option>
            </select>

            <select id="logDeptFilter" onchange="resetPageAndRenderLogs()" class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs">
              <option value="ALL">-- All Departments --</option>
            </select>

            <div class="flex items-center gap-1.5 bg-white px-2.5 py-1.5 border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-600">
              <i class="fa-solid fa-calendar-days text-indigo-500"></i>
              <span>วันที่:</span>
              <input type="date" id="logStartDate" oninput="resetPageAndRenderLogs()" onchange="resetPageAndRenderLogs()" class="bg-transparent font-medium text-slate-700 focus:outline-none cursor-text w-28">
              <span>ถึง</span>
              <input type="date" id="logEndDate" oninput="resetPageAndRenderLogs()" onchange="resetPageAndRenderLogs()" class="bg-transparent font-medium text-slate-700 focus:outline-none cursor-text w-28">
              <button type="button" onclick="clearLogDateRange()" class="text-slate-400 hover:text-rose-500 px-1" title="Clear Date Range">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Dropdown Export & Report -->
            <div class="relative">
              <button id="btnExportDropdown" onclick="toggleExportDropdown(event)" class="bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-xs cursor-pointer">
                <i class="fa-solid fa-file-export"></i>
                <span>Export & Report</span>
                <i class="fa-solid fa-chevron-down text-[10px] ml-0.5"></i>
              </button>

              <div id="exportMenuDropdown" class="hidden absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onclick="toggleExportDropdown(); exportHistoryLogsToExcel();" class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-2.5 transition-colors">
                  <i class="fa-solid fa-file-excel text-emerald-600 text-sm"></i>
                  <span>Export to Excel</span>
                </button>
                <button onclick="toggleExportDropdown(); previewHistoryLogsPDF();" class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-2.5 transition-colors">
                  <i class="fa-solid fa-file-pdf text-rose-600 text-sm"></i>
                  <span>Preview PDF Report</span>
                </button>
              </div>
            </div>

            <div class="h-5 w-[1px] bg-slate-300 mx-0.5"></div>

            <!-- กลุ่มปุ่มโหมดปกติ -->
            <div id="normalModeActionBtns" class="flex items-center gap-2">
              <button onclick="toggleSelectRestoreMode(true)" class="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer" title="Select items to restore">
                <i class="fa-solid fa-rotate-left"></i>
                <span>Select Restore</span>
              </button>

              <button onclick="toggleSelectDeleteMode(true)" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-list-check text-xs"></i>
                <span>Select to Delete</span>
              </button>
            </div>

            <!-- กลุ่มปุ่มโหมด Select Restore -->
            <div id="restoreModeActionBtns" class="hidden flex items-center gap-2">
              <button onclick="confirmSelectedHistoryLogsRestore()" class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer">
                <i class="fa-solid fa-rotate-left text-xs"></i>
                <span id="btnConfirmRestoreText">Confirm Restore (0)</span>
              </button>

              <button onclick="toggleSelectRestoreMode(false)" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Cancel
              </button>
            </div>

            <!-- กลุ่มปุ่มโหมด Select Delete -->
            <div id="deleteModeActionBtns" class="hidden flex items-center gap-2">
              <button onclick="deleteSelectedHistoryLogs()" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer">
                <i class="fa-solid fa-trash-can text-xs"></i>
                <span id="btnDeleteSelectedLogsText">Confirm Delete (0)</span>
              </button>

              <button onclick="toggleSelectDeleteMode(false)" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Top Pagination Control Bar -->
        <div class="px-6 py-2 bg-slate-100/80 border-b border-slate-200 flex justify-between items-center shrink-0 text-xs text-slate-600 font-medium">
          <div class="flex items-center gap-2">
            <span>แสดงผล:</span>
            <select id="logItemsPerPageSelect" onchange="changeHistoryItemsPerPage(this.value)" class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none cursor-pointer shadow-2xs">
              <option value="5">5 รายการ / หน้า</option>
              <option value="10" selected>10 รายการ / หน้า</option>
              <option value="20">20 รายการ / หน้า</option>
              <option value="50">50 รายการ / หน้า</option>
              <option value="ALL">ทั้งหมด</option>
            </select>
          </div>

          <div id="historyPaginationControls" class="flex items-center gap-1"></div>
        </div>

        <!-- Table Container -->
        <div class="flex-1 overflow-hidden p-4 sm:p-6 min-h-0 bg-slate-100/60 flex flex-col">
          <div class="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xs h-full flex flex-col">
            <div class="w-full overflow-y-auto flex-1 h-full">
              <table class="w-full text-left text-xs border-collapse table-fixed">
                <thead class="bg-slate-800 text-slate-100 font-extrabold text-xs uppercase tracking-tight sticky top-0 z-10 shadow-xs select-none">
                  <tr>
                    <th id="thSelectAllBox" class="hidden py-3.5 px-2 w-[3%] text-center border-r border-slate-700">
                      <input type="checkbox" id="selectAllHistoryLogsChk" onchange="toggleSelectAllHistoryLogs(this)" class="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer">
                    </th>
                    
                    <th id="thCol-entryDate" onclick="handleHistorySort('entryDate')" class="py-3.5 px-3 w-[10%] text-center border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-calendar-days text-sky-400 text-xs shrink-0"></i>
                        <span class="text-xs">Import Date</span>
                        <i id="sortIcon-entryDate" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>

                    <th id="thCol-time" onclick="handleHistorySort('entryDate')" class="py-3.5 px-3 w-[8%] text-center border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-clock text-amber-300 text-xs shrink-0"></i>
                        <span class="text-xs">Time</span>
                      </div>
                    </th>

                    <th id="thCol-fullName" onclick="handleHistorySort('fullName')" class="py-3.5 px-3 w-[13%] border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center gap-1.5 truncate">
                        <i class="fa-solid fa-user text-indigo-300 text-xs shrink-0"></i>
                        <span class="text-xs">Full Name</span>
                        <i id="sortIcon-fullName" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>

                    <th id="thCol-employeeId" onclick="handleHistorySort('employeeId')" class="py-3.5 px-3 w-[9%] text-center border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-id-card text-emerald-400 text-xs shrink-0"></i>
                        <span class="text-xs">Employee ID</span>
                        <i id="sortIcon-employeeId" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>

                    <th id="thCol-department" onclick="handleHistorySort('department')" class="py-3.5 px-3 w-[10%] text-center border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-sitemap text-cyan-300 text-xs shrink-0"></i>
                        <span class="text-xs">Department</span>
                        <i id="sortIcon-department" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>

                    <th id="thCol-category" onclick="handleHistorySort('category')" class="py-3.5 px-3 w-[10%] text-center border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-tags text-purple-300 text-xs shrink-0"></i>
                        <span class="text-xs">Category</span>
                        <i id="sortIcon-category" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>

                    <th id="thCol-action" onclick="handleHistorySort('action')" class="py-3.5 px-2 w-[8%] text-center border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-bolt text-amber-400 text-xs shrink-0"></i>
                        <span class="text-xs">Action</span>
                        <i id="sortIcon-action" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>

                    <th id="thCol-detail" onclick="handleHistorySort('detail')" class="py-3.5 px-3 w-[21%] text-center border-r border-slate-700 cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-file-lines text-amber-300 text-xs shrink-0"></i>
                        <span class="text-xs">Details</span>
                        <i id="sortIcon-detail" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>

                    <th id="thCol-updatedBy" onclick="handleHistorySort('updatedBy')" class="py-3.5 px-3 w-[11%] text-center cursor-pointer">
                      <div class="flex items-center justify-center gap-1.5 truncate">
                        <i class="fa-solid fa-id-card text-teal-300 text-xs shrink-0"></i>
                        <span class="text-xs">Updated By (ID)</span>
                        <i id="sortIcon-updatedBy" class="fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50"></i>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody id="historyLogsTableBody" class="divide-y divide-slate-200 bg-white">
                  <!-- History log rows will render here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer Bar -->
        <div class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 text-xs text-slate-500 shadow-2xs">
          <span id="logTotalCount" class="font-bold text-slate-700">Total: 0 records</span>
          <button onclick="closeHistoryLogsModal()" class="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all active:scale-95 cursor-pointer">
            Close
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(modal);
  }

  const searchInput = document.getElementById('logSearchInput');
  const actionFilter = document.getElementById('logActionFilter');
  const deptFilter = document.getElementById('logDeptFilter');
  const startDate = document.getElementById('logStartDate');
  const endDate = document.getElementById('logEndDate');

  if (searchInput) searchInput.value = '';
  if (actionFilter) actionFilter.value = 'ALL';
  if (deptFilter) deptFilter.value = 'ALL';
  if (startDate) startDate.value = '';
  if (endDate) endDate.value = '';

  modal.classList.remove('hidden');
  isSelectDeleteMode = false;
  isSelectRestoreMode = false;
  historyCurrentPage = 1;
  historySortColumn = null;

  toggleUpdateDeleteOption(false);
  loadHistoryLogs();
}

function closeHistoryLogsModal() {
  const modal = document.getElementById('historyLogsModal');
  if (modal) modal.classList.add('hidden');
}

function loadHistoryLogs() {
  const savedLogs = localStorage.getItem('apex_vault_audit_logs');
  historyLogs = savedLogs ? JSON.parse(savedLogs) : [];
  
  populateDepartmentFilterOptions();
  renderHistoryLogsTable();
}

function populateDepartmentFilterOptions() {
  const deptSelect = document.getElementById('logDeptFilter');
  if (!deptSelect) return;

  const currentVal = deptSelect.value;
  const depts = Array.from(new Set(historyLogs.map(l => l.department).filter(d => d && d !== '-'))).sort();

  deptSelect.innerHTML = '<option value="ALL">-- All Departments --</option>';
  depts.forEach(dept => {
    const opt = document.createElement('option');
    opt.value = dept;
    opt.textContent = dept;
    if (dept === currentVal) opt.selected = true;
    deptSelect.appendChild(opt);
  });
}

function clearLogDateRange() {
  const startEl = document.getElementById('logStartDate');
  const endEl = document.getElementById('logEndDate');
  if (startEl) startEl.value = '';
  if (endEl) endEl.value = '';
  resetPageAndRenderLogs();
}

function resetPageAndRenderLogs() {
  historyCurrentPage = 1;
  renderHistoryLogsTable();
}

function changeHistoryItemsPerPage(val) {
  historyItemsPerPage = val === 'ALL' ? 'ALL' : Number(val);
  resetPageAndRenderLogs();
}

function goToHistoryPage(page) {
  historyCurrentPage = page;
  renderHistoryLogsTable();
}

function handleHistorySort(colName) {
  if (historySortColumn === colName) {
    historySortDirection = historySortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    historySortColumn = colName;
    historySortDirection = 'asc';
  }
  renderHistoryLogsTable();
}

function updateSortIconsUI() {
  const columns = ['entryDate', 'fullName', 'employeeId', 'department', 'category', 'action', 'detail', 'updatedBy'];
  
  columns.forEach(col => {
    const iconEl = document.getElementById(`sortIcon-${col}`);

    if (iconEl) {
      if (col === historySortColumn) {
        if (historySortDirection === 'asc') {
          iconEl.className = 'fa-solid fa-sort-up text-amber-400 text-xs ml-1 opacity-100';
        } else {
          iconEl.className = 'fa-solid fa-sort-down text-amber-400 text-xs ml-1 opacity-100';
        }
      } else {
        iconEl.className = 'fa-solid fa-sort text-slate-400 text-[10px] ml-1 opacity-50';
      }
    }
  });
}

function parseLogDate(dateStr) {
  if (!dateStr || dateStr === '-') return new Date(0);

  try {
    const dateTimeParts = dateStr.trim().split(/[\s,]+/);
    const datePart = dateTimeParts[0]; 
    const timePart = dateTimeParts[1] || "00:00:00"; 

    const datePieces = datePart.split('/');
    if (datePieces.length === 3) {
      const day = Number(datePieces[0]);
      const month = Number(datePieces[1]) - 1; 
      let year = Number(datePieces[2]);

      if (year > 2500) year -= 543;

      const timePieces = timePart.split(':');
      const hours = Number(timePieces[0]) || 0;
      const minutes = Number(timePieces[1]) || 0;
      const seconds = Number(timePieces[2]) || 0;

      return new Date(year, month, day, hours, minutes, seconds);
    }

    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date(0) : parsed;
  } catch (e) {
    return new Date(0);
  }
}

function getFilteredHistoryLogs() {
  const keyword = (document.getElementById('logSearchInput')?.value || '').toLowerCase().trim();
  const actionFilter = document.getElementById('logActionFilter')?.value || 'ALL';
  const deptFilter = document.getElementById('logDeptFilter')?.value || 'ALL';
  const startDateVal = document.getElementById('logStartDate')?.value || '';
  const endDateVal = document.getElementById('logEndDate')?.value || '';

  const startDate = startDateVal ? new Date(startDateVal) : null;
  const endDate = endDateVal ? new Date(endDateVal) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  let filteredLogs = historyLogs.filter(log => {
    const logName = (log.fullName || log.fullname || log.name || log.updatedBy || '').toLowerCase();
    const logEmp = (log.employeeId || log.empId || log.empCode || '').toLowerCase();
    const logDept = log.department || '-';
    const logCat = (log.category || '').toLowerCase();
    const logDateStr = log.entryDate || '';
    const logAction = log.action || 'LOG';
    const rawDetail = (log.detail || '').toLowerCase();

    let companyMatch = rawDetail.match(/\(([^)]+)\)/);
    let companyName = companyMatch ? companyMatch[1].trim().toLowerCase() : '';

    let matchAction = true;
    if (actionFilter === 'UPDATE_DELETE') {
      matchAction = (logAction === 'UPDATE' || logAction === 'DELETE');
    } else if (actionFilter !== 'ALL') {
      matchAction = logAction === actionFilter;
    }

    const matchDept = deptFilter === 'ALL' || logDept === deptFilter;

    let matchDateRange = true;
    const logDateObj = parseLogDate(logDateStr);
    if (logDateObj) {
      if (startDate && logDateObj < startDate) matchDateRange = false;
      if (endDate && logDateObj > endDate) matchDateRange = false;
    }

    const matchText = !keyword || 
      logDateStr.toLowerCase().includes(keyword) ||
      logName.includes(keyword) ||
      logEmp.includes(keyword) ||
      logDept.toLowerCase().includes(keyword) ||
      logCat.includes(keyword) ||
      logAction.toLowerCase().includes(keyword) ||
      rawDetail.includes(keyword) ||
      companyName.includes(keyword);

    return matchAction && matchDept && matchDateRange && matchText;
  });

  if (historySortColumn) {
    filteredLogs.sort((a, b) => {
      let result = 0;

      if (historySortColumn === 'entryDate') {
        const dateA = parseLogDate(a.entryDate).getTime();
        const dateB = parseLogDate(b.entryDate).getTime();
        result = dateA - dateB;
      } else if (historySortColumn === 'fullName') {
        const valA = (a.fullName || a.fullname || a.name || '').toLowerCase();
        const valB = (b.fullName || b.fullname || b.name || '').toLowerCase();
        result = valA.localeCompare(valB);
      } else if (historySortColumn === 'employeeId' || historySortColumn === 'updatedBy') {
        const valA = (a.employeeId || a.empId || a.empCode || '').toLowerCase();
        const valB = (b.employeeId || b.empId || b.empCode || '').toLowerCase();
        result = valA.localeCompare(valB);
      } else if (historySortColumn === 'department') {
        const valA = (a.department || '').toLowerCase();
        const valB = (b.department || '').toLowerCase();
        result = valA.localeCompare(valB);
      } else if (historySortColumn === 'category') {
        const valA = (a.category || '').toLowerCase();
        const valB = (b.category || '').toLowerCase();
        result = valA.localeCompare(valB);
      } else if (historySortColumn === 'action') {
        const valA = (a.action || '').toLowerCase();
        const valB = (b.action || '').toLowerCase();
        result = valA.localeCompare(valB);
      } else if (historySortColumn === 'detail') {
        const valA = (a.detail || '').toLowerCase();
        const valB = (b.detail || '').toLowerCase();
        result = valA.localeCompare(valB);
      }

      if (result === 0) {
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;
        result = idA - idB;
      }

      return historySortDirection === 'asc' ? result : -result;
    });
  }

  return filteredLogs;
}

function renderHistoryLogsTable() {
  const tbody = document.getElementById('historyLogsTableBody');
  const countEl = document.getElementById('logTotalCount');
  if (!tbody) return;

  const filteredLogs = getFilteredHistoryLogs();
  updateSortIconsUI();

  const totalRecords = filteredLogs.length;
  if (countEl) countEl.textContent = `Total: ${totalRecords} records`;

  let paginatedLogs = filteredLogs;
  let totalPages = 1;

  if (historyItemsPerPage !== 'ALL' && totalRecords > 0) {
    totalPages = Math.ceil(totalRecords / historyItemsPerPage);
    if (historyCurrentPage > totalPages) historyCurrentPage = totalPages;
    if (historyCurrentPage < 1) historyCurrentPage = 1;

    const startIdx = (historyCurrentPage - 1) * historyItemsPerPage;
    const endIdx = Math.min(startIdx + historyItemsPerPage, totalRecords);
    paginatedLogs = filteredLogs.slice(startIdx, endIdx);
  }

  renderHistoryPaginationUI(totalRecords, totalPages);

  const showCheckbox = isSelectDeleteMode || isSelectRestoreMode;
  const colSpanCount = showCheckbox ? 10 : 9;

  if (paginatedLogs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${colSpanCount}" class="py-12 text-center text-slate-400">
          <i class="fa-solid fa-inbox text-3xl mb-2 block"></i>
          <span class="text-base font-bold">No records found</span>
        </td>
      </tr>
    `;
    updateSelectedLogsCount();
    return;
  }

  const isAdmin = isUserAdmin();

  tbody.innerHTML = paginatedLogs.map(log => {
    const displayName = log.fullName || log.fullname || log.name || log.updatedBy || '-';
    const displayEmpId = log.employeeId || log.empId || log.empCode || '-';
    const dt = formatDateTimeSplit(log.entryDate);

    let rawDetail = log.detail || '-';
    let formattedDetailHtml = '';

    const isRestorable = log.action === 'UPDATE' || log.action === 'DELETE';
    const alreadyRestored = !!log.isRestored;

    if (log.action === 'DOWNLOAD') {
      let fileNameText = rawDetail;
      if (fileNameText.includes('|')) {
        fileNameText = fileNameText.split('|')[0].trim();
      }
      fileNameText = fileNameText
        .replace(/^ดาวน์โหลดเอกสาร\s*Doc\s*No:\s*/i, '')
        .replace(/^Doc No:\s*/i, '')
        .trim();

      formattedDetailHtml = `
        <div class="font-black text-indigo-900 text-sm flex items-center gap-1.5 break-words">
          <i class="fa-solid fa-file-arrow-down text-emerald-600 text-base shrink-0"></i>
          <span>${escapeHtml(fileNameText || '-')}</span>
        </div>
      `;
    } 
    else if (log.action === 'UPDATE') {
      let companyMatch = rawDetail.match(/\(([^)]+)\)/);
      let companyName = companyMatch ? companyMatch[1].trim() : '';

      let cleanText = rawDetail
        .replace(/^อัปเดตเอกสาร\s*Doc No:\s*/i, '')
        .replace(/^แก้ไขเอกสาร\s*Doc No:\s*/i, '')
        .replace(/^Doc No:\s*/i, '')
        .replace(/\([^)]*\)/g, '')
        .trim();

      let docNoVal = '-';
      let updateInfoText = '-';

      if (cleanText.includes('|')) {
        const parts = cleanText.split('|');
        docNoVal = parts[0].replace(/Doc No:/gi, '').replace(/Detail:/gi, '').trim();
        updateInfoText = parts.slice(1).join('|').replace(/Details:/gi, '').replace(/Detail:/gi, '').trim();
      } else {
        updateInfoText = cleanText;
      }

      const beforeState = log.beforeState;
      let formattedChangesHtml = '';

      if (beforeState) {
        const changes = [];
        
        // 1. เปรียบเทียบเลขที่เอกสาร
        const oldDocNum = extractDocVal(beforeState, 'docNumber') || extractDocVal(beforeState, 'number');
        if (oldDocNum && docNoVal !== '-' && oldDocNum !== docNoVal) {
          changes.push(`Doc No: <span class="text-slate-400 line-through me-1">${escapeHtml(oldDocNum)}</span> <i class="fa-solid fa-arrow-right text-[10px] text-slate-400 me-1"></i> <span class="text-rose-600 font-bold">${escapeHtml(docNoVal)}</span>`);
        }

        // 2. เปรียบเทียบชื่อบริษัท
        const oldComp = extractDocVal(beforeState, 'companyName') || extractDocVal(beforeState, 'company');
        const newComp = extractDocVal(log, 'companyName') || extractDocVal(log, 'company') || companyName;
        if (oldComp && newComp && oldComp !== newComp) {
          companyName = newComp;
          changes.push(`Company: <span class="text-slate-400 line-through me-1">${escapeHtml(oldComp)}</span> <i class="fa-solid fa-arrow-right text-[10px] text-slate-400 me-1"></i> <span class="text-rose-600 font-bold">${escapeHtml(newComp)}</span>`);
        }

        // 3. เปรียบเทียบรายละเอียด
        const oldDetail = extractDocVal(beforeState, 'productDetail') || extractDocVal(beforeState, 'title');
        const newDetail = extractDocVal(log, 'productDetail') || extractDocVal(log, 'title') || updateInfoText;
        if (oldDetail && newDetail && oldDetail !== newDetail) {
          changes.push(`Detail: <span class="text-slate-400 line-through me-1">${escapeHtml(oldDetail)}</span> <i class="fa-solid fa-arrow-right text-[10px] text-slate-400 me-1"></i> <span class="text-rose-600 font-bold">${escapeHtml(newDetail)}</span>`);
        }

        if (changes.length > 0) {
          formattedChangesHtml = `<div class="text-slate-700 font-medium text-xs mt-1 space-y-0.5 break-words">${changes.join('<br>')}</div>`;
        } else {
          let highlightedText = escapeHtml(updateInfoText)
            .replace(/(-&gt;|->|เป็น)/g, '<span class="text-slate-400 mx-1">$1</span>')
            .replace(/('([^']*)'|"([^"]*)")/g, '<span class="text-rose-600 font-bold">$1</span>');

          formattedChangesHtml = `<div class="text-slate-600 font-medium text-xs mt-0.5 break-words">${highlightedText}</div>`;
        }
      } else {
        let highlightedText = escapeHtml(updateInfoText)
          .replace(/(-&gt;|->|เป็น)/g, '<span class="text-slate-400 mx-1">$1</span>')
          .replace(/('([^']*)'|"([^"]*)")/g, '<span class="text-rose-600 font-bold">$1</span>');

        formattedChangesHtml = `<div class="text-slate-600 font-medium text-xs mt-0.5 break-words">${highlightedText}</div>`;
      }

      formattedDetailHtml = `
        <div class="${isSelectRestoreMode ? (alreadyRestored ? 'p-2 bg-slate-100 border border-slate-200 rounded-xl opacity-60' : 'p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl shadow-2xs') : ''}">
          <div class="font-black text-indigo-950 text-sm flex items-center gap-1">
            <i class="fa-solid fa-pen-to-square text-amber-500 text-xs shrink-0"></i>
            <span>${escapeHtml(docNoVal || '-')}</span>
          </div>
          ${companyName ? `<div class="text-emerald-800 font-bold text-xs mt-0.5"><i class="fa-solid fa-building text-[10px] me-1"></i>${escapeHtml(companyName)}</div>` : ''}
          ${formattedChangesHtml}
          ${isSelectRestoreMode ? (
            alreadyRestored ? `
              <div class="mt-1.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span><i class="fa-solid fa-circle-check text-emerald-600 me-1"></i>กู้คืนเรียบร้อยแล้ว</span>
                <span class="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">RESTORED</span>
              </div>
            ` : `
              <div class="mt-1.5 pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[10px] font-bold text-amber-800">
                <span><i class="fa-solid fa-rotate-left me-1"></i>พร้อมคืนค่าข้อมูลเดิม</span>
                <span class="px-1.5 py-0.5 bg-amber-200/60 rounded text-amber-900">BEFORE EDIT STATE</span>
              </div>
            `
          ) : ''}
        </div>
      `;
    } 
    else {
      let companyMatch = rawDetail.match(/\(([^)]+)\)/);
      let companyName = companyMatch ? companyMatch[1].trim() : '';

      let cleanText = rawDetail
        .replace(/^ลบเอกสารเลขที่:\s*/i, '')
        .replace(/^ลบเอกสารแบบกลุ่ม\s*\(Bulk Delete\)\s*เลขที่:\s*/i, '')
        .replace(/^ลบเอกสาร\s*Doc No:\s*/i, '')
        .replace(/\([^)]*\)/g, '')
        .trim();

      let docNoVal = '-';
      let detailVal = '-';

      if (cleanText.includes('|')) {
        const parts = cleanText.split('|');
        docNoVal = parts[0].replace(/Doc No:/gi, '').replace(/Detail:/gi, '').trim();
        detailVal = parts[1] ? parts[1].replace(/Detail:/gi, '').trim() : '-';
      } else if (cleanText.includes('[เรื่อง:')) {
        const parts = cleanText.split('[เรื่อง:');
        docNoVal = parts[0].replace(/Doc No:/gi, '').trim();
        detailVal = parts[1] ? parts[1].replace(/\]/g, '').trim() : '-';
      } else {
        detailVal = cleanText;
      }

      if (docNoVal && docNoVal !== '-' && detailVal !== '-') {
        detailVal = detailVal.replace(docNoVal, '').replace(/^[-:\s]+/, '').trim();
      }
      if (companyName && detailVal !== '-') {
        detailVal = detailVal.replace(companyName, '').replace(/^[-:\s()]+/, '').trim();
      }

      formattedDetailHtml = `
        <div class="${isSelectRestoreMode && isRestorable ? (alreadyRestored ? 'p-2 bg-slate-100 border border-slate-200 rounded-xl opacity-60' : 'p-2 bg-rose-50/80 border border-rose-200/80 rounded-xl shadow-2xs') : ''}">
          <div class="font-black text-indigo-950 text-sm">${escapeHtml(docNoVal || '-')}</div>
          ${companyName ? `<div class="text-emerald-800 font-bold text-xs mt-0.5"><i class="fa-solid fa-building text-[10px] me-1"></i>${escapeHtml(companyName)}</div>` : ''}
          <div class="text-slate-600 font-medium text-xs mt-0.5 break-words">${escapeHtml(detailVal || '-')}</div>
          ${isSelectRestoreMode && isRestorable ? (
            alreadyRestored ? `
              <div class="mt-1.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span><i class="fa-solid fa-circle-check text-emerald-600 me-1"></i>กู้คืนเรียบร้อยแล้ว</span>
                <span class="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">RESTORED</span>
              </div>
            ` : `
              <div class="mt-1.5 pt-1.5 border-t border-rose-200/60 flex items-center justify-between text-[10px] font-bold text-rose-800">
                <span><i class="fa-solid fa-trash-arrow-up me-1"></i>พร้อมกู้คืนข้อมูลที่ลบ</span>
                <span class="px-1.5 py-0.5 bg-rose-200/60 rounded text-rose-900">DELETED DATA</span>
              </div>
            `
          ) : ''}
        </div>
      `;
    }

    const canSelectForRestore = isSelectRestoreMode && isRestorable && !alreadyRestored;
    const checkboxDisabled = !isAdmin || (isSelectRestoreMode && !canSelectForRestore);

    const rowBgClass = isSelectRestoreMode && canSelectForRestore 
      ? 'bg-amber-50/30 hover:bg-amber-50/80' 
      : (alreadyRestored && isSelectRestoreMode ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50');

    return `
      <tr class="${rowBgClass} transition-colors">
        ${showCheckbox ? `
          <td class="py-3.5 px-2 text-center border-r border-slate-200">
            <input type="checkbox" data-log-id="${log.id}" onchange="updateSelectedLogsCount()" class="history-log-chk w-4 h-4 rounded ${isSelectRestoreMode ? 'text-amber-500 focus:ring-amber-400' : 'text-rose-600 focus:ring-rose-500'} cursor-pointer" ${checkboxDisabled ? 'disabled' : ''}>
          </td>
        ` : ''}

        <td class="py-3.5 px-3 text-slate-700 font-semibold border-r border-slate-200 text-xs text-center truncate">
          ${escapeHtml(dt.date)}
        </td>

        <td class="py-3.5 px-3 border-r border-slate-200 text-xs text-center font-bold text-indigo-900">
          <span class="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md inline-block">
            ${escapeHtml(dt.time)}
          </span>
        </td>

        <td class="py-3.5 px-3 font-bold text-slate-900 border-r border-slate-200 text-xs">
          <div class="flex items-center gap-1.5 truncate">
            <i class="fa-solid fa-user text-slate-400 text-xs shrink-0"></i>
            <span class="truncate font-bold">${escapeHtml(displayName)}</span>
          </div>
        </td>

        <td class="py-3.5 px-3 text-indigo-950 font-black border-r border-slate-200 text-xs text-center truncate">
          <span class="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg inline-block truncate max-w-full font-extrabold">
            ${escapeHtml(displayEmpId)}
          </span>
        </td>

        <td class="py-3.5 px-3 text-slate-800 font-bold border-r border-slate-200 text-xs text-center truncate">
          ${escapeHtml(log.department || '-')}
        </td>

        <td class="py-3.5 px-3 text-indigo-800 font-bold border-r border-slate-200 text-xs text-center truncate">
          ${escapeHtml(log.category || '-')}
        </td>

        <td class="py-3.5 px-2 text-center border-r border-slate-200">
          <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-black ${getActionBadgeStyle(log.action)}">
            ${log.action || 'LOG'}
          </span>
        </td>

        <td class="py-3 px-3 border-r border-slate-200">
          ${formattedDetailHtml}
        </td>

        <td class="py-3.5 px-3 text-slate-800 font-medium text-xs text-center truncate">
          <span class="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg font-black text-indigo-950 inline-block truncate max-w-full">
            ${escapeHtml(displayEmpId)}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  updateSelectedLogsCount();
}

function toggleSelectRestoreMode(enable) {
  if (enable && !isUserAdmin()) {
    alert('สิทธิ์ไม่เพียงพอ! เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถใช้ฟังก์ชัน Restore ได้');
    return;
  }

  isSelectRestoreMode = enable;
  isSelectDeleteMode = false;

  const normalBtns = document.getElementById('normalModeActionBtns');
  const restoreBtns = document.getElementById('restoreModeActionBtns');
  const deleteBtns = document.getElementById('deleteModeActionBtns');
  const thSelectAll = document.getElementById('thSelectAllBox');
  const actionFilterEl = document.getElementById('logActionFilter');

  if (enable) {
    if (normalBtns) normalBtns.classList.add('hidden');
    if (deleteBtns) deleteBtns.classList.add('hidden');
    if (restoreBtns) restoreBtns.classList.remove('hidden');
    if (thSelectAll) thSelectAll.classList.remove('hidden');

    toggleUpdateDeleteOption(true);
    if (actionFilterEl) {
      actionFilterEl.value = 'UPDATE_DELETE';
    }
  } else {
    if (normalBtns) normalBtns.classList.remove('hidden');
    if (restoreBtns) restoreBtns.classList.add('hidden');
    if (deleteBtns) deleteBtns.classList.add('hidden');
    if (thSelectAll) thSelectAll.classList.add('hidden');

    if (actionFilterEl && actionFilterEl.value === 'UPDATE_DELETE') {
      actionFilterEl.value = 'ALL';
    }
    toggleUpdateDeleteOption(false);
  }

  resetPageAndRenderLogs();
}

function confirmSelectedHistoryLogsRestore() {
  if (!isUserAdmin()) {
    alert('สิทธิ์ไม่เพียงพอ! เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถ Restore ข้อมูลได้');
    return;
  }

  const selectedCheckboxes = document.querySelectorAll('.history-log-chk:checked');
  if (selectedCheckboxes.length === 0) {
    alert('กรุณาเลือกอย่างน้อย 1 รายการที่ต้องการ Restore');
    return;
  }

  const count = selectedCheckboxes.length;
  if (!confirm(`[Admin Authorized]\nคุณต้องการกู้คืนข้อมูล (Restore) รายการที่เลือกจำนวน ${count} รายการ ใช่หรือไม่?`)) {
    return;
  }

  const selectedIds = Array.from(selectedCheckboxes).map(chk => Number(chk.getAttribute('data-log-id')));
  const targetLogs = historyLogs.filter(log => selectedIds.includes(Number(log.id)) && !log.isRestored);

  if (targetLogs.length === 0) {
    alert('รายการที่เลือกได้รับการ Restore ไปเรียบร้อยแล้ว ไม่สามารถ Restore ซ้ำได้');
    return;
  }

  let successCount = 0;
  targetLogs.forEach(targetLog => {
    try {
      if (typeof window.restoreDocumentData === 'function') {
        window.restoreDocumentData(targetLog.beforeState || targetLog);
      }
      
      targetLog.isRestored = true;
      
      addAuditLog('RESTORE', `กู้คืนข้อมูลสำเร็จจากประวัติ ${targetLog.action} (Ref: ${targetLog.detail || '-'})`, targetLog.category || '-');
      successCount++;
    } catch (err) {
      console.error('Error during restore log:', targetLog, err);
    }
  });

  saveHistoryLogs();
  alert(`กู้คืนข้อมูลเรียบร้อยแล้ว จำนวน ${successCount} รายการ`);
  toggleSelectRestoreMode(false);
  loadHistoryLogs();
}

function toggleSelectDeleteMode(enable) {
  isSelectDeleteMode = enable;
  isSelectRestoreMode = false;
  
  const normalBtns = document.getElementById('normalModeActionBtns');
  const deleteBtns = document.getElementById('deleteModeActionBtns');
  const restoreBtns = document.getElementById('restoreModeActionBtns');
  const thSelectAll = document.getElementById('thSelectAllBox');
  const actionFilterEl = document.getElementById('logActionFilter');

  if (enable) {
    if (normalBtns) normalBtns.classList.add('hidden');
    if (restoreBtns) restoreBtns.classList.add('hidden');
    if (deleteBtns) deleteBtns.classList.remove('hidden');
    if (thSelectAll) thSelectAll.classList.remove('hidden');
  } else {
    if (normalBtns) normalBtns.classList.remove('hidden');
    if (deleteBtns) deleteBtns.classList.add('hidden');
    if (restoreBtns) restoreBtns.classList.add('hidden');
    if (thSelectAll) thSelectAll.classList.add('hidden');
    
    if (actionFilterEl && actionFilterEl.value === 'UPDATE_DELETE') {
      actionFilterEl.value = 'ALL';
    }
    toggleUpdateDeleteOption(false);
  }

  renderHistoryLogsTable();
}

function updateSelectedLogsCount() {
  const selectedCount = document.querySelectorAll('.history-log-chk:checked').length;
  const btnDeleteText = document.getElementById('btnDeleteSelectedLogsText');
  const btnRestoreText = document.getElementById('btnConfirmRestoreText');
  const masterChk = document.getElementById('selectAllHistoryLogsChk');
  const enabledCheckboxes = document.querySelectorAll('.history-log-chk:not([disabled])');

  if (btnDeleteText) {
    btnDeleteText.textContent = `Confirm Delete (${selectedCount})`;
  }

  if (btnRestoreText) {
    btnRestoreText.textContent = `Confirm Restore (${selectedCount})`;
  }

  if (masterChk) {
    masterChk.checked = enabledCheckboxes.length > 0 && selectedCount === enabledCheckboxes.length;
  }
}

function toggleSelectAllHistoryLogs(masterChk) {
  const checkboxes = document.querySelectorAll('.history-log-chk:not([disabled])');
  checkboxes.forEach(chk => {
    chk.checked = masterChk.checked;
  });
  updateSelectedLogsCount();
}

function deleteSingleHistoryLog(logId) {
  if (!isUserAdmin()) {
    alert('สิทธิ์ไม่เพียงพอ! เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบประวัติกิจกรรมได้');
    return;
  }

  if (confirm('คุณต้องการลบรายการประวัตินี้ใช่หรือไม่?')) {
    historyLogs = historyLogs.filter(log => Number(log.id) !== Number(logId));
    saveHistoryLogs();
    renderHistoryLogsTable();
  }
}

function deleteSelectedHistoryLogs() {
  if (!isUserAdmin()) {
    alert('สิทธิ์ไม่เพียงพอ! เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบประวัติกิจกรรมได้');
    return;
  }

  const selectedCheckboxes = document.querySelectorAll('.history-log-chk:checked');
  if (selectedCheckboxes.length === 0) {
    alert('กรุณาเลือกอย่างน้อย 1 รายการประวัติที่ต้องการลบ');
    return;
  }

  const count = selectedCheckboxes.length;
  if (!confirm(`คุณต้องการลบประวัติรายการที่เลือกจำนวน ${count} รายการ ใช่หรือไม่?`)) {
    return;
  }

  const selectedIds = Array.from(selectedCheckboxes).map(chk => Number(chk.getAttribute('data-log-id')));

  historyLogs = historyLogs.filter(log => !selectedIds.includes(Number(log.id)));

  saveHistoryLogs();
  toggleSelectDeleteMode(false);
  alert(`ลบประวัติที่เลือกจำนวน ${count} รายการ เรียบร้อยแล้ว`);
}

// ==========================================
// 5. Export Functions (Excel & PDF)
// ==========================================
function exportHistoryLogsToExcel() {
  const filteredData = getFilteredHistoryLogs();
  if (filteredData.length === 0) {
    alert('ไม่พบข้อมูลที่จะส่งออกเป็นไฟล์ Excel');
    return;
  }

  if (typeof XLSX === 'undefined') {
    loadExportLibraries(() => exportHistoryLogsToExcel());
    return;
  }

  const exportRows = filteredData.map((log, index) => {
    const displayName = log.fullName || log.fullname || log.name || log.updatedBy || '-';
    const displayEmpId = log.employeeId || log.empId || log.empCode || '-';
    const dt = formatDateTimeSplit(log.entryDate);
    let detailText = log.detail || '-';

    if (log.action === 'DOWNLOAD') {
      if (detailText.includes('|')) {
        detailText = detailText.split('|')[0].trim();
      }
      detailText = detailText.replace(/^ดาวน์โหลดเอกสาร\s*Doc\s*No:\s*/i, '').replace(/^Doc No:\s*/i, '').trim();
    }

    return {
      'No.': index + 1,
      'Import Date': dt.date,
      'Time': dt.time,
      'Full Name': displayName,
      'Employee ID': displayEmpId,
      'Department': log.department || '-',
      'Category': log.category || '-',
      'Action': log.action || '-',
      'Details': detailText,
      'Updated By (ID)': displayEmpId
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

  worksheet['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 12 }, { wch: 22 }, { wch: 15 },  
    { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 45 }, { wch: 16 }   
  ];

  const fileName = `Audit_Logs_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

async function generateHistoryPDFDoc() {
  const filteredData = getFilteredHistoryLogs();
  if (!filteredData || filteredData.length === 0) return null;

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("ไม่พบไลบรารี jsPDF กำลังพยายามโหลดสคริปต์ซ้ำ...");
    return null;
  }

  const fontLoaded = await ensureThaiFontLoaded();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');

  let activeFont = 'helvetica';
  if (fontLoaded && thaiSarabunBase64) {
    doc.addFileToVFS('THSarabunNew.ttf', thaiSarabunBase64);
    doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
    doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'bold');
    doc.setFont('THSarabunNew', 'normal');
    activeFont = 'THSarabunNew';
  }

  const globalUser = window.currentUser || window.user || {};
  const currentUserName = globalUser.fullName || globalUser.fullname || globalUser.name || 'Administrator';
  const currentUserEmpId = globalUser.employeeId || globalUser.empId || '-';
  const nowStr = typeof getFormattedDateTime === 'function' ? getFormattedDateTime() : new Date().toLocaleString('th-TH');

  const startDateVal = document.getElementById('logStartDate')?.value || '';
  const endDateVal = document.getElementById('logEndDate')?.value || '';
  const dateRangeStr = (startDateVal || endDateVal) ? `${startDateVal || 'Start'} to ${endDateVal || 'Present'}` : 'All Time History';

  doc.setFillColor(30, 41, 59); 
  doc.rect(0, 0, 297, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(activeFont, 'bold');
  doc.text('SYSTEM AUDIT LOGS REPORT', 10, 11.5);

  doc.setFontSize(9);
  doc.setFont(activeFont, 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${nowStr}  |  Issuer: ${currentUserName} (${currentUserEmpId})`, 287, 11.5, { align: 'right' });

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 18, 297, 9, 'F');
  
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont(activeFont, 'bold');
  doc.text('Filter Scope:', 10, 23.8);

  doc.setFont(activeFont, 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date Scope: ${dateRangeStr}   |   Department: ${document.getElementById('logDeptFilter')?.value || 'ALL'}   |   Total Records: ${filteredData.length}`, 32, 23.8);

  const tableHeaders = ['No.', 'Date', 'Time', 'Full Name', 'Emp ID', 'Dept', 'Category', 'Action', 'Details', 'Updated By'];

  const tableRows = filteredData.map((log, index) => {
    const displayName = log.fullName || log.fullname || log.name || log.updatedBy || '-';
    const displayEmpId = log.employeeId || log.empId || log.empCode || '-';
    const dt = formatDateTimeSplit(log.entryDate);
    let rawDetail = log.detail || '-';

    let finalDetailText = '';

    if (log.action === 'DOWNLOAD') {
      finalDetailText = rawDetail.includes('|') ? rawDetail.split('|')[0].trim() : rawDetail;
      finalDetailText = finalDetailText.replace(/^ดาวน์โหลดเอกสาร\s*Doc\s*No:\s*/i, '').replace(/^Doc No:\s*/i, '').trim();
    } else {
      let companyMatch = rawDetail.match(/\(([^)]+)\)/);
      let companyName = companyMatch ? companyMatch[1].trim() : '';

      let cleanText = rawDetail
        .replace(/^ลบเอกสารเลขที่:\s*/i, '')
        .replace(/^ลบเอกสารแบบกลุ่ม\s*\(Bulk Delete\)\s*เลขที่:\s*/i, '')
        .replace(/^ลบเอกสาร\s*Doc No:\s*/i, '')
        .replace(/\([^)]*\)/g, '')
        .trim();

      let docNoVal = '-';
      let detailVal = '-';

      if (cleanText.includes('|')) {
        const parts = cleanText.split('|');
        docNoVal = parts[0].replace(/Doc No:/gi, '').replace(/Detail:/gi, '').trim();
        detailVal = parts[1] ? parts[1].replace(/Detail:/gi, '').trim() : '-';
      } else if (cleanText.includes('[เรื่อง:')) {
        const parts = cleanText.split('[เรื่อง:');
        docNoVal = parts[0].replace(/Doc No:/gi, '').trim();
        detailVal = parts[1] ? parts[1].replace(/\]/g, '').trim() : '-';
      } else {
        detailVal = cleanText;
      }

      if (docNoVal && docNoVal !== '-' && detailVal !== '-') {
        detailVal = detailVal.replace(docNoVal, '').replace(/^[-:\s]+/, '').trim();
      }
      if (companyName && detailVal !== '-') {
        detailVal = detailVal.replace(companyName, '').replace(/^[-:\s()]+/, '').trim();
      }

      let formattedLines = [];
      if (docNoVal && docNoVal !== '-') formattedLines.push(`Doc No: ${docNoVal}`);
      if (companyName) formattedLines.push(`Company: ${companyName}`);
      if (detailVal && detailVal !== '-') formattedLines.push(`Detail: ${detailVal}`);

      finalDetailText = formattedLines.length > 0 ? formattedLines.join('\n') : rawDetail;
    }

    return [
      index + 1, dt.date, dt.time, displayName, displayEmpId,
      log.department || '-', log.category || '-', log.action || '-',
      finalDetailText, displayEmpId
    ];
  });

  if (typeof doc.autoTable !== 'function') {
    alert("ไม่พบปลั๊กอินสร้างตาราง autoTable กรุณารีเฟรชแล้วลองใหม่อีกครั้ง");
    return null;
  }

  doc.autoTable({
    head: [tableHeaders],
    body: tableRows,
    startY: 29,
    margin: { left: 10, right: 10, bottom: 12 },
    styles: {
      font: activeFont, fontStyle: 'normal', fontSize: 8.5,
      cellPadding: 1.8, valign: 'middle', overflow: 'linebreak',
      textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.15
    },
    headStyles: {
      font: activeFont, fontSize: 9, fillColor: [30, 41, 59],
      textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 }, 1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 }, 3: { cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 }, 5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 22 }, 7: { halign: 'center', cellWidth: 16 },
      8: { cellWidth: 95 }, 9: { halign: 'center', cellWidth: 20 }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: function (data) {
      const totalPages = doc.internal.getNumberOfPages();
      doc.setFont(activeFont, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(226, 232, 240);
      doc.line(10, 198, 287, 198);
      doc.text('Apex Vault - System Audit & Security Logging System', 10, 202);
      doc.text(`Page ${data.pageNumber} of ${totalPages}`, 287, 202, { align: 'right' });
    }
  });

  return doc;
}

let currentPdfPreviewUrl = null;

function previewHistoryLogsPDF() {
  const filteredData = getFilteredHistoryLogs();
  if (!filteredData || filteredData.length === 0) {
    alert('ไม่พบข้อมูลตามเงื่อนไขที่เลือก เพื่อแสดงรายงาน PDF');
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    loadExportLibraries(() => previewHistoryLogsPDF());
    return;
  }

  let previewModal = document.getElementById('historyPdfPreviewModal');
  if (!previewModal) {
    previewModal = document.createElement('div');
    previewModal.id = 'historyPdfPreviewModal';
    previewModal.className = 'fixed inset-0 w-screen h-screen bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200';
    document.body.appendChild(previewModal);
  }

  previewModal.innerHTML = `
    <div class="bg-slate-900 w-full h-full max-w-7xl max-h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
      <div class="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
            <i class="fa-solid fa-file-pdf text-lg"></i>
          </div>
          <div>
            <h3 class="font-bold text-base leading-tight">PDF Document Preview (A4 Landscape)</h3>
            <p class="text-xs text-slate-400">ตรวจสอบตัวอย่างรายงานและสถิติก่อนดาวน์โหลดไฟล์ PDF</p>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button onclick="exportHistoryLogsToPDF()" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md cursor-pointer">
            <i class="fa-solid fa-download"></i>
            <span>Download PDF</span>
          </button>
          <button onclick="closeHistoryPdfPreviewModal()" class="text-slate-400 hover:text-white hover:bg-slate-700 w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <div id="pdfPreviewFrameContainer" class="flex-1 bg-slate-950 p-2 min-h-0 flex items-center justify-center">
        <div class="text-center text-slate-300 flex flex-col items-center gap-3">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-rose-500"></i>
          <span class="text-sm font-semibold">กำลังจัดเตรียมฟอนต์ภาษาไทยและสร้างเอกสาร PDF...</span>
        </div>
      </div>

      <div class="px-6 py-2.5 bg-slate-800 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400 shrink-0">
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>จำนวนรายการทั้งหมด: ${filteredData.length} รายการ</span>
        </div>
        <button onclick="closeHistoryPdfPreviewModal()" class="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all cursor-pointer">
          Close Preview
        </button>
      </div>
    </div>
  `;

  previewModal.classList.remove('hidden');

  generateHistoryPDFDoc().then(doc => {
    const container = document.getElementById('pdfPreviewFrameContainer');
    if (!doc || !container) return;

    if (currentPdfPreviewUrl) {
      URL.revokeObjectURL(currentPdfPreviewUrl);
    }

    const pdfBlob = doc.output('blob');
    currentPdfPreviewUrl = URL.createObjectURL(pdfBlob);
    
    container.innerHTML = `
      <object data="${currentPdfPreviewUrl}#view=FitH" type="application/pdf" class="w-full h-full rounded-xl border border-slate-800">
        <iframe src="${currentPdfPreviewUrl}#view=FitH" class="w-full h-full rounded-xl border border-slate-800"></iframe>
      </object>
    `;
  }).catch(err => {
    console.error("PDF Preview Error:", err);
    alert("เกิดข้อผิดพลาดในการสร้างเอกสาร PDF: " + err.message);
  });
}

function closeHistoryPdfPreviewModal() {
  const modal = document.getElementById('historyPdfPreviewModal');
  if (modal) modal.classList.add('hidden');
  if (currentPdfPreviewUrl) {
    URL.revokeObjectURL(currentPdfPreviewUrl);
    currentPdfPreviewUrl = null;
  }
}

async function exportHistoryLogsToPDF() {
  const filteredData = getFilteredHistoryLogs();
  if (filteredData.length === 0) {
    alert('ไม่พบข้อมูลที่จะส่งออกเป็นไฟล์ PDF');
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    loadExportLibraries(() => exportHistoryLogsToPDF());
    return;
  }

  const doc = await generateHistoryPDFDoc();
  if (doc) {
    const pdfFileName = `Audit_Logs_Report_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(pdfFileName);
  }
}

function renderHistoryPaginationUI(totalRecords, totalPages) {
  const container = document.getElementById('historyPaginationControls');
  if (!container) return;
  container.innerHTML = '';

  if (totalRecords === 0 || historyItemsPerPage === 'ALL' || totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = `px-2 py-0.5 rounded-md text-xs font-bold transition-all ${historyCurrentPage === 1 ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-200' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer'}`;
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left text-[10px]"></i>';
  prevBtn.disabled = historyCurrentPage === 1;
  prevBtn.onclick = () => goToHistoryPage(historyCurrentPage - 1);
  container.appendChild(prevBtn);

  for (let p = 1; p <= totalPages; p++) {
    const pBtn = document.createElement('button');
    pBtn.className = `w-6 h-6 rounded-md text-xs font-bold transition-all cursor-pointer ${p === historyCurrentPage ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`;
    pBtn.textContent = p;
    pBtn.onclick = () => goToHistoryPage(p);
    container.appendChild(pBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = `px-2 py-0.5 rounded-md text-xs font-bold transition-all ${historyCurrentPage === totalPages ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-200' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer'}`;
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right text-[10px]"></i>';
  nextBtn.disabled = historyCurrentPage === totalPages;
  nextBtn.onclick = () => goToHistoryPage(historyCurrentPage + 1);
  container.appendChild(nextBtn);
}

// ==========================================
// 6. Audit Logging System & Font Loader
// ==========================================
function deleteDocumentWithLog(doc) {
  if (!doc) return;

  const category = doc.category || '-';
  const docNum = doc.docNumber || doc.number || '-';
  const company = doc.companyName || doc.company || '';
  const detail = doc.productDetail || doc.title || '-';
  const detailText = `${docNum}${company ? ` (${company})` : ''} | ${detail}`;

  addAuditLog('DELETE', detailText, category, null, doc);
}

function addAuditLog(action, detail, category = '-', customUserInfo = null, beforeState = null) {
  const globalUser = window.currentUser || window.user || window.loggedInUser || (typeof currentUser !== 'undefined' ? currentUser : {});
  const activeUser = customUserInfo || globalUser;
  const allUsers = window.usersList || window.employees || window.userList || [];

  let matchedUser = allUsers.find(u => 
    (activeUser.employeeId && (u.employeeId === activeUser.employeeId || u.empId === activeUser.employeeId)) ||
    (activeUser.empId && (u.empId === activeUser.empId || u.employeeId === activeUser.empId || u.empCode === activeUser.empId)) ||
    (activeUser.username && u.username === activeUser.username)
  ) || activeUser;

  const finalFullName = 
    activeUser.fullName || activeUser.fullname || activeUser.name || 
    matchedUser.fullName || matchedUser.fullname || matchedUser.name || 
    globalUser.fullName || globalUser.fullname || globalUser.name || globalUser.username || 'System';

  const finalEmployeeId = 
    activeUser.employeeId || activeUser.empId || activeUser.empCode || 
    matchedUser.employeeId || matchedUser.empId || matchedUser.empCode || 
    globalUser.employeeId || globalUser.empId || globalUser.empCode || '-';

  const finalDept = 
    activeUser.department || activeUser.dept || 
    matchedUser.department || matchedUser.dept || 
    globalUser.department || globalUser.dept || '-';

  const newLog = {
    id: Date.now(),
    entryDate: typeof getFormattedDateTime === 'function' ? getFormattedDateTime() : new Date().toLocaleString('th-TH'),
    fullname: finalFullName,
    fullName: finalFullName,
    empId: finalEmployeeId,
    employeeId: finalEmployeeId,
    department: finalDept,
    category: category,
    action: action,
    detail: detail,
    beforeState: beforeState,
    isRestored: false,
    updatedBy: finalFullName
  };

  try {
    const savedLogs = localStorage.getItem('apex_vault_audit_logs');
    const logs = savedLogs ? JSON.parse(savedLogs) : [];
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    localStorage.setItem('apex_vault_audit_logs', JSON.stringify(logs));

    if (typeof loadHistoryLogs === 'function') {
      loadHistoryLogs();
    }
  } catch (err) {
    console.error("Error saving audit log:", err);
  }
}

async function ensureThaiFontLoaded() {
  if (thaiSarabunBase64) return true;
  
  const fontUrls = [
    'https://cdn.jsdelivr.net/npm/@canvas-fonts/th-sarabun-new/THSarabunNew.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf'
  ];

  for (const url of fontUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const blob = await response.blob();
      
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            thaiSarabunBase64 = reader.result.split(',')[1];
            resolve(true);
          } else {
            resolve(false);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn('โหลดฟอนต์จาก URL ล้มเหลว ลอง URL ถัดไป:', url, err);
    }
  }

  console.error('ไม่สามารถโหลดฟอนต์ภาษาไทยได้จากทุกแหล่งข้อมูล');
  return false;
}

// ==========================================
// 7. Bindings to Window Object & Storage Helper
// ==========================================
window.isUserAdmin = isUserAdmin;
window.addAuditLog = addAuditLog;
window.deleteDocumentWithLog = deleteDocumentWithLog;
window.openHistoryLogsModal = openHistoryLogsModal;
window.closeHistoryLogsModal = closeHistoryLogsModal;
window.deleteSingleHistoryLog = deleteSingleHistoryLog;
window.toggleSelectRestoreMode = toggleSelectRestoreMode;
window.confirmSelectedHistoryLogsRestore = confirmSelectedHistoryLogsRestore;
window.toggleSelectDeleteMode = toggleSelectDeleteMode;
window.toggleExportDropdown = toggleExportDropdown;
window.resetPageAndRenderLogs = resetPageAndRenderLogs;
window.clearLogDateRange = clearLogDateRange;
window.changeHistoryItemsPerPage = changeHistoryItemsPerPage;
window.goToHistoryPage = goToHistoryPage;
window.handleHistorySort = handleHistorySort;
window.exportHistoryLogsToExcel = exportHistoryLogsToExcel;
window.exportHistoryLogsToPDF = exportHistoryLogsToPDF;
window.previewHistoryLogsPDF = previewHistoryLogsPDF;
window.closeHistoryPdfPreviewModal = closeHistoryPdfPreviewModal;

function saveHistoryLogs() {
  localStorage.setItem('apex_vault_audit_logs', JSON.stringify(historyLogs));
}

function getActionBadgeStyle(action) {
  switch(action) {
    case 'CREATE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'UPDATE': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'DELETE': return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'DOWNLOAD': return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'RESTORE': return 'bg-purple-50 text-purple-700 border border-purple-200';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}