let currentCategoryFilter = 'ALL';
let currentPage = 1;
let itemsPerPage = 10;
let selectedDocIds = new Set();
let isSelectionMode = false;

function renderDashboardComponent() {
  const container = document.getElementById('dashboardComponent');
  container.innerHTML = `
    <!-- Category Cards Summary -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
      <div onclick="filterCategory('Quotation')" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex justify-between items-center">
        <div>
          <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Quotation</span>
          <h3 class="text-sm font-semibold text-slate-600 mt-0.5">ใบเสนอราคา</h3>
          <div id="card-size-Quotation" class="text-xs text-slate-400 mt-0.5">0 MB</div>
        </div>
        <div id="card-count-Quotation" class="text-3xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">0</div>
      </div>

      <div onclick="filterCategory('Invoice')" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex justify-between items-center">
        <div>
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">Invoice</span>
          <h3 class="text-sm font-semibold text-slate-600 mt-0.5">ใบแจ้งหนี้ / ใบเสร็จ</h3>
          <div id="card-size-Invoice" class="text-xs text-slate-400 mt-0.5">0 MB</div>
        </div>
        <div id="card-count-Invoice" class="text-3xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">0</div>
      </div>

      <div onclick="filterCategory('Investment')" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex justify-between items-center">
        <div>
          <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">Investment</span>
          <h3 class="text-sm font-semibold text-slate-600 mt-0.5">เอกสารการลงทุน</h3>
          <div id="card-size-Investment" class="text-xs text-slate-400 mt-0.5">0 MB</div>
        </div>
        <div id="card-count-Investment" class="text-3xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">0</div>
      </div>

      <div onclick="filterCategory('Certificate')" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group flex justify-between items-center">
        <div>
          <span class="text-xs font-bold text-purple-600 uppercase tracking-wider">Certificate</span>
          <h3 class="text-sm font-semibold text-slate-600 mt-0.5">ใบรับรอง / เกียรติบัตร</h3>
          <div id="card-size-Certificate" class="text-xs text-slate-400 mt-0.5">0 MB</div>
        </div>
        <div id="card-count-Certificate" class="text-3xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">0</div>
      </div>
    </div>

    <!-- Search & Filters Bar -->
    <div class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap justify-between items-center gap-3 shrink-0">
      <div class="flex items-center gap-3 flex-1 min-w-[280px]">
        <div class="relative flex-1 min-w-[180px]">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" id="textSearchInput" oninput="applyFilters(true)" placeholder="พิมพ์คำค้นหา..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all">
        </div>

        <div class="flex items-center gap-1.5 flex-1 min-w-[160px]">
          <i class="fa-solid fa-building text-emerald-500 text-xs shrink-0"></i>
          <select id="companyDropdownFilter" onchange="applyFilters(true)" class="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer truncate">
            <option value="ALL">-- เลือกบริษัท ทั้งหมด --</option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 flex-1 min-w-[160px]">
          <i class="fa-solid fa-box-open text-amber-500 text-xs shrink-0"></i>
          <select id="productDropdownFilter" onchange="applyFilters(true)" class="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer truncate">
            <option value="ALL">-- เลือกลายรายละเอียด ทั้งหมด --</option>
          </select>
        </div>
      </div>

      <div id="docBulkActionControls" class="hidden items-center gap-2 shrink-0">
        <button id="btnToggleSelectionMode" onclick="toggleSelectionMode()" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
          <i class="fa-solid fa-list-check text-base"></i>
          <span>เลือกรายการเพื่อลบ</span>
        </button>

        <div id="bulkActionContainer" class="hidden flex items-center gap-2">
          <button onclick="selectAllCurrentDocs(true)" class="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all">
            เลือกทั้งหมด
          </button>

          <button onclick="deleteSelectedDocs()" id="btnDeleteSelected" disabled class="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
            <i class="fa-solid fa-trash-can"></i>
            <span id="btnDeleteText">ลบที่เลือก (0)</span>
          </button>

          <button onclick="toggleSelectionMode(false)" class="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap justify-between items-center border-b border-slate-200/80 pb-2.5 shrink-0 gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 font-medium">แสดง:</span>
        <select id="itemsPerPageSelect" onchange="changeItemsPerPage(this.value)" class="px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs">
          <option value="5">5 รายการ/หน้า</option>
          <option value="10" selected>10 รายการ/หน้า</option>
          <option value="20">20 รายการ/หน้า</option>
          <option value="50">50 รายการ/หน้า</option>
          <option value="ALL">ทั้งหมด</option>
        </select>
      </div>

      <div id="paginationControls" class="flex items-center gap-1 ml-auto"></div>
    </div>

    <!-- Main Document Render Area -->
    <div id="documentContainer" class="flex-1 w-full min-h-0 overflow-hidden"></div>
  `;
}

function filterCategory(cat) {
  currentCategoryFilter = cat;
  currentPage = 1;
  document.querySelectorAll('.side-nav-btn').forEach(btn => {
    btn.className = 'side-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all';
  });

  const activeBtn = document.getElementById(`side-nav-${cat}`);
  if(activeBtn) {
    activeBtn.className = 'side-nav-btn active w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 transition-all shadow-xs';
  }

  document.getElementById('currentCategoryTitle').textContent = cat === 'ALL' ? 'เอกสารทั้งหมด' : `หมวดหมู่: ${cat}`;
  applyFilters();
}

function updateStats(docs) {
  const stats = {
    ALL: { count: docs.length },
    Quotation: { count: 0, bytes: 0 },
    Invoice: { count: 0, bytes: 0 },
    Investment: { count: 0, bytes: 0 },
    Certificate: { count: 0, bytes: 0 },
  };

  let totalBytes = 0;
  docs.forEach(doc => {
    if (stats[doc.category]) {
      stats[doc.category].count++;
      stats[doc.category].bytes += (doc.rawSize || 0);
      totalBytes += (doc.rawSize || 0);
    }
  });

  for (let cat in stats) {
    const sideCount = document.getElementById(`side-count-${cat}`);
    const cardCount = document.getElementById(`card-count-${cat}`);
    const cardSize = document.getElementById(`card-size-${cat}`);

    if (sideCount) sideCount.textContent = stats[cat].count;
    if (cardCount) cardCount.textContent = stats[cat].count;
    if (cardSize) cardSize.textContent = (stats[cat].bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  document.getElementById('sidebarStorageText').textContent = `${totalMB} MB`;
  const percent = Math.min((totalBytes / (500 * 1024 * 1024)) * 100, 100);
  document.getElementById('storageProgressBar').style.width = `${percent}%`;
}

function updateDropdownOptions(docs) {
  const companySelect = document.getElementById('companyDropdownFilter');
  const productSelect = document.getElementById('productDropdownFilter');

  const currentCompany = companySelect.value;
  const currentProduct = productSelect.value;

  const companies = Array.from(new Set(docs.map(d => extractDocFieldValue(d, 'companyName')).filter(Boolean))).sort();
  const products = Array.from(new Set(docs.map(d => extractDocFieldValue(d, 'productDetail')).filter(Boolean))).sort();

  companySelect.innerHTML = '<option value="ALL">-- เลือกบริษัท ทั้งหมด --</option>';
  companies.forEach(comp => {
    const opt = document.createElement('option');
    opt.value = comp;
    opt.textContent = comp;
    if (comp === currentCompany) opt.selected = true;
    companySelect.appendChild(opt);
  });

  productSelect.innerHTML = '<option value="ALL">-- เลือกลายรายละเอียด ทั้งหมด --</option>';
  products.forEach(prod => {
    const opt = document.createElement('option');
    opt.value = prod;
    opt.textContent = prod;
    if (prod === currentProduct) opt.selected = true;
    productSelect.appendChild(opt);
  });
}

function changeItemsPerPage(value) {
  if (value === 'ALL') {
    itemsPerPage = 'ALL';
  } else {
    itemsPerPage = Number(value);
  }
  currentPage = 1;
  applyFilters();
}

function goToPage(page) {
  currentPage = page;
  applyFilters();
}

function applyFilters(resetPage = false) {
  if (resetPage) currentPage = 1;

  getAllDocs(docs => {
    updateStats(docs);
    updateDropdownOptions(docs);

    const searchKeyword = document.getElementById('textSearchInput').value.toLowerCase().trim();
    const selectedCompany = document.getElementById('companyDropdownFilter').value;
    const selectedProduct = document.getElementById('productDropdownFilter').value;

    docs.sort((a, b) => b.id - a.id);

    const filtered = docs.filter(doc => {
      const matchCat = currentCategoryFilter === 'ALL' || doc.category === currentCategoryFilter;
      
      const docCompany = extractDocFieldValue(doc, 'companyName');
      const docProduct = extractDocFieldValue(doc, 'productDetail');
      
      const matchCompany = selectedCompany === 'ALL' || docCompany === selectedCompany;
      const matchProduct = selectedProduct === 'ALL' || docProduct === selectedProduct;

      let matchText = true;
      if (searchKeyword.length > 0) {
        const docNum = extractDocFieldValue(doc, 'docNumber').toLowerCase();
        const company = docCompany.toLowerCase();
        const product = docProduct.toLowerCase();
        const fileName = (doc.originalName || '').toLowerCase();

        matchText = docNum.includes(searchKeyword) || 
                    company.includes(searchKeyword) || 
                    product.includes(searchKeyword) || 
                    fileName.includes(searchKeyword);
      }

      return matchCat && matchCompany && matchProduct && matchText;
    });

    const totalItems = filtered.length;
    document.getElementById('filteredDocCount').textContent = `${totalItems} รายการ`;

    let paginatedDocs = filtered;
    let totalPages = 1;
    let startIndex = 0;
    let endIndex = totalItems;

    if (itemsPerPage !== 'ALL' && totalItems > 0) {
      totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      startIndex = (currentPage - 1) * itemsPerPage;
      endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      paginatedDocs = filtered.slice(startIndex, endIndex);
    }

    renderDocuments(paginatedDocs);
    renderPaginationUI(totalItems, totalPages);
  });
}

function renderPaginationUI(totalItems, totalPages) {
  const controls = document.getElementById('paginationControls');
  controls.innerHTML = '';

  if (totalItems === 0 || itemsPerPage === 'ALL' || totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = `px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${currentPage === 1 ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`;
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left text-[10px] me-1"></i> ก่อนหน้า';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => goToPage(currentPage - 1);
  controls.appendChild(prevBtn);

  for (let page = 1; page <= totalPages; page++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `w-7 h-7 rounded-lg text-xs font-bold transition-all ${page === currentPage ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;
    pageBtn.textContent = page;
    pageBtn.onclick = () => goToPage(page);
    controls.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = `px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`;
  nextBtn.innerHTML = 'ถัดไป <i class="fa-solid fa-chevron-right text-[10px] ms-1"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => goToPage(currentPage + 1);
  controls.appendChild(nextBtn);
}

function toggleSelectionMode(enable) {
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;

  if (enable === undefined) {
    isSelectionMode = !isSelectionMode;
  } else {
    isSelectionMode = enable;
  }

  const btnToggle = document.getElementById('btnToggleSelectionMode');
  const bulkContainer = document.getElementById('bulkActionContainer');

  if (isSelectionMode) {
    btnToggle.classList.add('hidden');
    bulkContainer.classList.remove('hidden');
  } else {
    btnToggle.classList.remove('hidden');
    bulkContainer.classList.add('hidden');
    selectedDocIds.clear();
  }

  updateBulkUi();
  applyFilters();
}

function toggleDocSelection(id, checked) {
  if (checked) {
    selectedDocIds.add(id);
  } else {
    selectedDocIds.delete(id);
  }
  updateBulkUi();
}

function selectAllCurrentDocs(checkAll = true) {
  const checkboxes = document.querySelectorAll('.doc-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = checkAll;
    const docId = Number(cb.value);
    if (checkAll) {
      selectedDocIds.add(docId);
    } else {
      selectedDocIds.delete(docId);
    }
  });
  updateBulkUi();
}

function toggleSelectAllDocsHeader(masterCheckbox) {
  selectAllCurrentDocs(masterCheckbox.checked);
}

function updateBulkUi() {
  const btnDelete = document.getElementById('btnDeleteSelected');
  const btnDeleteText = document.getElementById('btnDeleteText');
  const count = selectedDocIds.size;

  if (count > 0) {
    btnDelete.disabled = false;
    btnDeleteText.textContent = `ลบที่เลือก (${count})`;
  } else {
    btnDelete.disabled = true;
    btnDeleteText.textContent = `ลบที่เลือก (0)`;
  }
}

function deleteSelectedDocs() {
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;
  if (selectedDocIds.size === 0) return;

  if (confirm(`คุณต้องการลบเอกสารที่เลือกทั้งหมด ${selectedDocIds.size} รายการ ใช่หรือไม่?`)) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    selectedDocIds.forEach(id => store.delete(id));

    tx.oncomplete = () => {
      selectedDocIds.clear();
      toggleSelectionMode(false);
      renderAll();
    };
  }
}

// ฟังก์ชันสแกนดึงข้อมูลค่า Date จากทุกรูปแบบของการ Import PDF (รวม Quotation: q_date)
function extractImportedDocDate(doc) {
  if (!doc) return '';

  const targetKeys = ['q_date', 'inv_date', 'invt_date', 'cert_date', 'docDate', 'date'];

  // 1. ตรวจสอบใน fieldsData (Array)
  if (Array.isArray(doc.fieldsData)) {
    const found = doc.fieldsData.find(item => targetKeys.includes(item.id) || item.id?.toLowerCase().includes('date') || item.name?.includes('วันที่'));
    if (found && found.value && String(found.value).trim()) {
      return String(found.value).trim();
    }
  }

  // 2. ตรวจสอบใน Root Properties
  for (const k of targetKeys) {
    if (doc[k] && String(doc[k]).trim()) return String(doc[k]).trim();
  }

  // 3. ตรวจสอบใน Object Containers (boxValues, customFields, boxData, formData)
  const containers = [doc.boxValues, doc.customFields, doc.boxData, doc.formData];
  for (const container of containers) {
    if (container && typeof container === 'object') {
      for (const k of targetKeys) {
        if (container[k] && String(container[k]).trim()) return String(container[k]).trim();
      }

      const foundKey = Object.keys(container).find(k => k.toLowerCase().includes('date'));
      if (foundKey && container[foundKey] && String(container[foundKey]).trim()) {
        return String(container[foundKey]).trim();
      }
    }
  }

  return '';
}

// ฟังก์ชันดึงค่าฟิลด์ทั่วไป (เลขเอกสาร, บริษัท, รายละเอียด) แบบสแกนครอบคลุมทุกหมวดหมู่
function extractDocFieldValue(doc, fieldType) {
  if (!doc) return '';

  let keys = [];
  if (fieldType === 'docNumber') keys = ['q_doc', 'inv_doc', 'invt_doc', 'cert_doc', 'docNumber', 'title'];
  if (fieldType === 'companyName') keys = ['q_comp', 'inv_comp', 'invt_comp', 'cert_comp', 'companyName'];
  if (fieldType === 'productDetail') keys = ['q_detail', 'inv_detail', 'invt_detail', 'cert_detail', 'productDetail'];

  // 1. ค้นหาใน Root Property ก่อน
  for (const k of keys) {
    if (doc[k] && String(doc[k]).trim()) return String(doc[k]).trim();
  }

  // 2. ค้นหาใน fieldsData (Array)
  if (Array.isArray(doc.fieldsData)) {
    const found = doc.fieldsData.find(item => keys.includes(item.id));
    if (found && found.value && String(found.value).trim()) {
      return String(found.value).trim();
    }
  }

  // 3. ค้นหาใน Object Containers
  const containers = [doc.boxValues, doc.customFields, doc.boxData, doc.formData];
  for (const container of containers) {
    if (container && typeof container === 'object') {
      for (const k of keys) {
        if (container[k] && String(container[k]).trim()) return String(container[k]).trim();
      }
    }
  }

  return '';
}

function renderDocuments(docs) {
  const container = document.getElementById('documentContainer');
  container.innerHTML = '';

  if (docs.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl border-2 border-slate-300 p-12 text-center h-full flex flex-col justify-center items-center shadow-xs">
        <div class="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mb-3 text-2xl border border-slate-300">
          <i class="fa-solid fa-folder-open"></i>
        </div>
        <h4 class="text-base font-bold text-slate-800">ไม่พบเอกสารตามเงื่อนไขที่เลือก</h4>
        <p class="text-sm text-slate-500 mt-1">ลองเปลี่ยนการเลือก Dropdown หรือคำค้นหาใหม่</p>
      </div>
    `;
    return;
  }

  const table = document.createElement('div');
  table.className = 'bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-xs w-full h-full flex flex-col min-h-0';
  
  const canManageDocs = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR');
  const thCheckboxClass = (isSelectionMode && canManageDocs) ? '' : 'hidden';

  // ปรับสัดส่วนคอลัมน์รวม 100% พอดี ไม่หลุดตาราง
  const colDocNum = isSelectionMode ? 'w-[11%]' : 'w-[13%]';
  const colCompany = isSelectionMode ? 'w-[16%]' : 'w-[17%]';
  const colProduct = isSelectionMode ? 'w-[19%]' : 'w-[20%]';
  const colCat = 'w-[10%]';
  const colDocDate = 'w-[9%]';
  const colCreateDate = 'w-[12%]';
  const colUpdateDate = 'w-[11%]';
  const colManage = isSelectionMode ? 'w-[9%]' : 'w-[8%]';

  table.innerHTML = `
    <div class="w-full overflow-y-auto flex-1 h-full">
      <table class="w-full text-left text-sm table-fixed border-collapse">
        <!-- หัวข้อตาราง สี Slate 800 ฟอนต์ใหญ่ ตัวหนาชัดเจน -->
        <thead class="bg-slate-800 text-slate-100 border-b-2 border-slate-300 font-extrabold sticky top-0 z-10 text-xs sm:text-sm uppercase tracking-tight shadow-xs">
          <tr>
            <th class="p-2.5 w-[3%] text-center border-r border-slate-700 ${thCheckboxClass}">
              <input type="checkbox" onchange="toggleSelectAllDocsHeader(this)" class="w-4 h-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer" title="เลือกทั้งหมด">
            </th>
            <th class="p-2.5 ${colDocNum} border-r border-slate-700">
              <div class="flex items-center gap-1.5 truncate" title="Document No.">
                <i class="fa-solid fa-file-lines text-indigo-300 text-sm shrink-0"></i>
                <span class="truncate">Document No.</span>
              </div>
            </th>
            <th class="p-2.5 ${colCompany} border-r border-slate-700">
              <div class="flex items-center gap-1.5 truncate" title="Company">
                <i class="fa-solid fa-building text-emerald-300 text-sm shrink-0"></i>
                <span class="truncate">Company</span>
              </div>
            </th>
            <th class="p-2.5 ${colProduct} border-r border-slate-700">
              <div class="flex items-center gap-1.5 truncate" title="Detail">
                <i class="fa-solid fa-box-open text-amber-300 text-sm shrink-0"></i>
                <span class="truncate">Detail</span>
              </div>
            </th>
            <th class="p-2.5 ${colCat} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="หมวดหมู่">
                <i class="fa-solid fa-tags text-purple-300 text-sm shrink-0"></i>
                <span class="truncate">หมวดหมู่</span>
              </div>
            </th>
            <th class="p-2.5 ${colDocDate} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Date">
                <i class="fa-solid fa-calendar-day text-sky-300 text-sm shrink-0"></i>
                <span class="truncate">Date</span>
              </div>
            </th>
            <th class="p-2.5 ${colCreateDate} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Create Date">
                <i class="fa-solid fa-clock text-rose-300 text-sm shrink-0"></i>
                <span class="truncate">Create Date</span>
              </div>
            </th>
            <th class="p-2.5 ${colUpdateDate} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Update By">
                <i class="fa-solid fa-user-pen text-teal-300 text-sm shrink-0"></i>
                <span class="truncate">Update By</span>
              </div>
            </th>
            <th class="p-2.5 ${colManage} text-center">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Manage">
                <i class="fa-solid fa-sliders text-slate-300 text-sm shrink-0"></i>
                <span class="truncate">Manage</span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- รายการข้อมูล ล็อค Detail ห้ามเกิน 2 บรรทัดเด็ดขาด -->
        <tbody class="divide-y divide-slate-300 border-b-2 border-slate-300 bg-white">
          ${docs.map(doc => {
            const isChecked = selectedDocIds.has(doc.id) ? 'checked' : '';
            
            const docNumStr = extractDocFieldValue(doc, 'docNumber');
            const companyStr = extractDocFieldValue(doc, 'companyName');
            const productStr = extractDocFieldValue(doc, 'productDetail');
            const importedDateStr = extractImportedDocDate(doc);
            
            const createDateStr = doc.formattedDate || doc.createDate || '';
            const updatedByStr = doc.updatedBy || doc.updateBy || doc.updatedByEmpId || '-';

            return `
            <tr class="hover:bg-slate-50 transition-colors ${selectedDocIds.has(doc.id) ? 'bg-indigo-50/70' : ''}">
              <td class="p-2 text-center border-r border-slate-300 ${thCheckboxClass}">
                <input type="checkbox" value="${doc.id}" ${isChecked} onchange="toggleDocSelection(${doc.id}, this.checked)" class="doc-checkbox w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
              </td>

              <!-- 1. Document No. -->
              <td class="p-2 font-bold text-indigo-700 cursor-pointer hover:underline border-r border-slate-300">
                <div class="truncate" onclick="openViewerModal(${doc.id})" title="${escapeHtml(docNumStr)}">
                  <span class="truncate text-xs sm:text-sm font-bold block">${escapeHtml(docNumStr)}</span>
                </div>
              </td>

              <!-- 2. Company -->
              <td class="p-2 font-semibold text-emerald-800 border-r border-slate-300">
                <div class="truncate" title="${escapeHtml(companyStr)}">
                  <span class="truncate text-xs sm:text-sm block">${escapeHtml(companyStr)}</span>
                </div>
              </td>

              <!-- 3. Detail: กำหนดความสูงและจำนวนบรรทัดสูงสุดไม่เกิน 2 บรรทัด -->
              <td class="p-2 text-slate-800 border-r border-slate-300">
                <div title="${escapeHtml(productStr)}">
                  <span class="line-clamp-2 text-xs sm:text-sm leading-snug block overflow-hidden break-words" style="max-height: 2.6em;">${escapeHtml(productStr)}</span>
                </div>
              </td>

              <!-- หมวดหมู่ -->
              <td class="p-2 text-center border-r border-slate-300">
                <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-extrabold truncate max-w-full ${getCategoryStyle(doc.category)}">${doc.category || ''}</span>
              </td>

              <!-- 4. Date -->
              <td class="p-2 text-center text-slate-700 border-r border-slate-300">
                <div class="text-xs sm:text-sm font-semibold text-slate-800 truncate" title="${escapeHtml(importedDateStr)}">${escapeHtml(importedDateStr)}</div>
              </td>

              <!-- Create Date -->
              <td class="p-2 text-center text-slate-600 border-r border-slate-300">
                <div class="text-xs sm:text-sm font-medium text-slate-800 truncate" title="${escapeHtml(createDateStr)}">${escapeHtml(createDateStr)}</div>
              </td>

              <!-- Update By -->
              <td class="p-2 text-center text-slate-600 border-r border-slate-300">
                <div class="text-xs sm:text-sm font-medium text-slate-800 truncate" title="${escapeHtml(updatedByStr)}">${escapeHtml(updatedByStr)}</div>
              </td>

              <!-- Manage Controls -->
              <td class="p-2 text-center relative">
                <button onclick="toggleActionMenu(${doc.id}, event)" class="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded-xl font-bold text-xs sm:text-sm border border-slate-300 transition-all flex items-center justify-center gap-1 mx-auto active:scale-95 shadow-2xs w-full max-w-[80px]">
                  <span>จัดการ</span>
                  <i class="fa-solid fa-chevron-down text-[10px] text-slate-500"></i>
                </button>

                <div id="dropdown-menu-${doc.id}" class="hidden absolute right-2 top-9 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 w-44 z-30 text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button onclick="openViewerModal(${doc.id})" class="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all flex items-center gap-2.5">
                    <i class="fa-solid fa-eye text-indigo-500 w-4 text-center"></i>
                    <span>ดูเอกสาร</span>
                  </button>
                  
                  ${canManageDocs ? `
                  <button onclick="openEditModal(${doc.id})" class="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-amber-600 hover:bg-amber-50/80 transition-all flex items-center gap-2.5">
                    <i class="fa-solid fa-pen-to-square text-amber-500 w-4 text-center"></i>
                    <span>แก้ไขข้อมูล/ไฟล์</span>
                  </button>
                  ` : ''}

                  <button onclick="downloadDoc(${doc.id})" class="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2.5">
                    <i class="fa-solid fa-download text-slate-500 w-4 text-center"></i>
                    <span>ดาวน์โหลด</span>
                  </button>

                  ${canManageDocs ? `
                  <div class="h-px bg-slate-200 my-1"></div>
                  <button onclick="deleteDoc(${doc.id})" class="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2.5">
                    <i class="fa-solid fa-trash-can text-rose-500 w-4 text-center"></i>
                    <span>ลบเอกสาร</span>
                  </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>
  `;
  container.appendChild(table);
}

function getCategoryStyle(cat) {
  switch(cat) {
    case 'Quotation': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'Invoice': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Investment': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Certificate': return 'bg-purple-50 text-purple-700 border border-purple-200';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function toggleActionMenu(id, event) {
  if (event) event.stopPropagation();
  const currentMenu = document.getElementById(`dropdown-menu-${id}`);
  const isHidden = currentMenu.classList.contains('hidden');
  closeAllDropdowns();
  if (isHidden) currentMenu.classList.remove('hidden');
}

function deleteDoc(id) {
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;
  if (confirm('คุณต้องการลบเอกสารนี้หรือไม่?')) {
    deleteDocById(id, () => {
      selectedDocIds.delete(id);
      updateBulkUi();
      renderAll();
    });
  }
}

function downloadDoc(id) {
  getDocById(id, doc => {
    const url = URL.createObjectURL(doc.fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.originalName;
    a.click();
    URL.revokeObjectURL(url);
  });
}