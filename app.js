document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Base Services
  initUsersSystem();
  
  // 2. Render UI Components Shell
  renderLoginScreen();
  renderSidebarComponent();
  renderHeaderComponent();
  renderDashboardComponent();
  renderUserManagementModal();
  renderExcelPreviewModal();
  renderViewerModal();
  renderUploadModal();

  // 3. Start Application Session
  initIndexedDB(() => {
    checkSessionAndStart();
  });
});

function showMainApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');

  document.getElementById('currentUserFullName').textContent = currentUser.fullName || currentUser.username;
  const roleBadge = document.getElementById('currentUserRoleBadge');
  roleBadge.textContent = currentUser.role;

  const canManageDocs = currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR';

  if (currentUser.role === 'ADMIN') {
    roleBadge.className = "inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase border border-amber-200";
    document.getElementById('adminUserNavBtn').classList.remove('hidden');
  } else if (currentUser.role === 'EDITOR') {
    roleBadge.className = "inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase border border-blue-200";
    document.getElementById('adminUserNavBtn').classList.add('hidden');
  } else {
    roleBadge.className = "inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase";
    document.getElementById('adminUserNavBtn').classList.add('hidden');
  }

  if (canManageDocs) {
    document.getElementById('docUploadBtn').classList.remove('hidden');
    document.getElementById('docBulkActionControls').classList.remove('hidden');
    document.getElementById('docBulkActionControls').classList.add('flex');
  } else {
    document.getElementById('docUploadBtn').classList.add('hidden');
    document.getElementById('docBulkActionControls').classList.add('hidden');
    document.getElementById('docBulkActionControls').classList.remove('flex');
  }

  renderAll();
  initTesseractWorker();
  initImportTheme();
  onCategoryChanged();
}

function closeAllDropdowns(event) {
  document.querySelectorAll('[id^="dropdown-menu-"]').forEach(menu => {
    if (!event || !menu.contains(event.target)) menu.classList.add('hidden');
  });
  const userIOMenu = document.getElementById('userIODropdown');
  if (userIOMenu && !userIOMenu.contains(event?.target)) {
    userIOMenu.classList.add('hidden');
  }
}

function renderAll() {
  applyFilters();
}
// กำหนดค่าเริ่มต้นของ Box Field แต่ละหมวดหมู่เอกสาร
function getDefaultCategoryFieldsData() {
  return {
    Quotation: [
      { id: 'q_doc', name: 'เลขเอกสารใบเสนอราคา', fieldType: 'selection', maxLen: 50, prefix: '' },
      { id: 'q_comp', name: 'บริษัท', fieldType: 'selection', maxLen: 100, prefix: '' },
      { id: 'q_detail', name: 'รายละเอียด', fieldType: 'selection', maxLen: 200, prefix: '' },
      { id: 'q_date', name: 'วันที่เอกสาร', fieldType: 'last10', maxLen: 10, lastLen: 10, prefix: '' }
    ],
    Invoice: [
      { id: 'inv_doc', name: 'เลขเอกสารใบแจ้งหนี้', fieldType: 'selection', maxLen: 50, prefix: '' },
      { id: 'inv_comp', name: 'ชื่อบริษัท', fieldType: 'selection', maxLen: 100, prefix: '' },
      { id: 'inv_detail', name: 'รายละเอียด', fieldType: 'selection', maxLen: 200, prefix: '' },
      { id: 'inv_date', name: 'วันที่เอกสาร', fieldType: 'last10', maxLen: 10, lastLen: 10, prefix: '' }
    ],
    Investment: [
      { id: 'invt_doc', name: 'เลขเอกสารการลงทุน', fieldType: 'selection', maxLen: 50, prefix: '' },
      { id: 'invt_comp', name: 'ชื่อบริษัท / สถาบัน', fieldType: 'selection', maxLen: 100, prefix: '' },
      { id: 'invt_detail', name: 'รายละเอียดการลงทุน', fieldType: 'selection', maxLen: 200, prefix: '' }
    ],
    Certificate: [
      { id: 'cert_doc', name: 'เลขที่เกียรติบัตร / ใบรับรอง', fieldType: 'selection', maxLen: 50, prefix: '' },
      { id: 'cert_comp', name: 'ชื่อบริษัท / หน่วยงานผู้ออก', fieldType: 'selection', maxLen: 100, prefix: '' },
      { id: 'cert_detail', name: 'รายละเอียด / หลักสูตร', fieldType: 'selection', maxLen: 200, prefix: '' }
    ]
  };
}