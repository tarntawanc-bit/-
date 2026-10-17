let currentCategoryFilter = 'ALL';
let currentPage = 1;
let itemsPerPage = 10;
let selectedDocIds = new Set();
let isSelectionMode = false;

function renderDashboardComponent() {
  const container = document.getElementById('dashboardComponent');
  const canManageDocs = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR');

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
    <div class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 shrink-0 w-full">
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1 min-w-0">
        <!-- 1. ค้นหาข้อความ -->
        <div class="relative w-full min-w-0">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" id="textSearchInput" oninput="applyFilters(true)" placeholder="พิมพ์คำค้นหา..." class="w-full pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all truncate">
        </div>

        <!-- 2. เลือกบริษัท -->
        <div class="flex items-center gap-1.5 w-full min-w-0">
          <i class="fa-solid fa-building text-emerald-500 text-xs shrink-0"></i>
          <select id="companyDropdownFilter" onchange="applyFilters(true)" class="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer truncate">
            <option value="ALL">-- เลือกบริษัท ทั้งหมด --</option>
          </select>
        </div>

        <!-- 3. เลือกแผนก -->
        <div class="flex items-center gap-1.5 w-full min-w-0">
          <i class="fa-solid fa-sitemap text-cyan-500 text-xs shrink-0"></i>
          <select id="deptDropdownFilter" onchange="applyFilters(true)" class="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer truncate">
            <option value="ALL">-- เลือกแผนก ทั้งหมด --</option>
          </select>
        </div>

        <!-- 4. เลือกหมวดหมู่ -->
        <div class="flex items-center gap-1.5 w-full min-w-0">
          <i class="fa-solid fa-tags text-purple-500 text-xs shrink-0"></i>
          <select id="categoryDropdownFilter" onchange="onCategoryDropdownChange(this.value)" class="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer truncate">
            <option value="ALL">-- เลือกหมวดหมู่ ทั้งหมด --</option>
            <option value="Quotation">Quotation (ใบเสนอราคา)</option>
            <option value="Invoice">Invoice (ใบแจ้งหนี้)</option>
            <option value="Investment">Investment (การลงทุน)</option>
            <option value="Certificate">Certificate (ใบรับรอง)</option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center justify-end gap-2 shrink-0">
        <div id="exportPdfActionContainer" class="hidden flex items-center gap-1.5 bg-emerald-50 p-1 rounded-xl border border-emerald-200">
          <button onclick="selectAllCurrentDocs(true)" class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all">
            เลือกทั้งหมด
          </button>

          <button onclick="confirmAndDownloadSelectedPDFs()" id="btnConfirmExportPdf" disabled class="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95">
            <i class="fa-solid fa-file-arrow-down"></i>
            <span id="btnConfirmExportPdfText">ยืนยันดึง PDF (0)</span>
          </button>

          <button onclick="exitExportPdfMode()" class="px-2 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-500 hover:text-slate-800 transition-all">
            ยกเลิก
          </button>
        </div>

        ${canManageDocs ? `
        <button type="button" onclick="openUploadModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 whitespace-nowrap" title="นำเข้าไฟล์ PDF (รองรับสูงสุด 10 ไฟล์)">
          <i class="fa-solid fa-file-circle-plus text-xs"></i>
          <span>นำเข้า PDF</span>
        </button>

        <label class="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap" title="เลือกไฟล์ PDF สูงสุด 10 ไฟล์">
          <i class="fa-solid fa-cloud-arrow-up text-xs"></i>
          <span>อัปโหลดทันที</span>
          <input type="file" id="dashBatchPdfInput" accept="application/pdf" multiple class="hidden" onchange="handleDashboardBatchUpload(this)">
        </label>
        ` : ''}

        <div id="docBulkActionControls" class="hidden items-center gap-2 shrink-0">
          <button id="btnToggleSelectionMode" onclick="toggleSelectionMode()" class="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 whitespace-nowrap">
            <i class="fa-solid fa-list-check text-xs"></i>
            <span>เลือกรายการลบ</span>
          </button>

          <div id="bulkActionContainer" class="hidden flex items-center gap-1.5">
            <button onclick="selectAllCurrentDocs(true)" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all">
              เลือกทั้งหมด
            </button>

            <button onclick="deleteSelectedDocs()" id="btnDeleteSelected" disabled class="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95">
              <i class="fa-solid fa-trash-can text-xs"></i>
              <span id="btnDeleteText">ลบที่เลือก (0)</span>
            </button>

            <button onclick="toggleSelectionMode(false)" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap justify-between items-center border-b border-slate-200/80 pb-2 shrink-0 gap-2">
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-slate-500 font-medium">แสดง:</span>
        <select id="itemsPerPageSelect" onchange="changeItemsPerPage(this.value)" class="px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs">
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

function cleanCompanyName(name) {
  if (!name) return '';
  return name
    .replace(/(บริษัท|บจก\.|บมจ\.)/gi, '')
    .replace(/(co\.,?\s*ltd\.?|co\.?|ltd\.?|company\s+limited|inc\.?|corp\.?|จำกัด\s*\(มหาชน\)|จำกัด)/gi, '')
    .replace(/[().,-]/g, '')
    .trim();
}

function onCategoryDropdownChange(val) {
  currentCategoryFilter = val;
  const activeBtnTitle = document.getElementById('currentCategoryTitle');
  if (activeBtnTitle) {
    activeBtnTitle.textContent = val === 'ALL' ? 'เอกสารทั้งหมด' : `หมวดหมู่: ${val}`;
  }
  applyFilters(true);
}

function updateDropdownOptions(docs) {
  const companySelect = document.getElementById('companyDropdownFilter');
  const deptSelect = document.getElementById('deptDropdownFilter');
  if (!companySelect || !deptSelect) return;

  const currentCompany = companySelect.value;
  const currentDept = deptSelect.value;

  const rawCompanies = docs.map(d => extractDocFieldValue(d, 'companyName')).filter(b => b && b !== '-');
  const cleanCompanyMap = new Map();

  rawCompanies.forEach(comp => {
    const cleaned = cleanCompanyName(comp);
    if (cleaned && !cleanCompanyMap.has(cleaned)) {
      cleanCompanyMap.set(cleaned, cleaned);
    }
  });

  const sortedCompanies = Array.from(cleanCompanyMap.values()).sort();

  companySelect.innerHTML = '<option value="ALL">-- เลือกบริษัท ทั้งหมด --</option>';
  sortedCompanies.forEach(compClean => {
    const opt = document.createElement('option');
    opt.value = compClean;
    opt.textContent = compClean;
    if (compClean === currentCompany) opt.selected = true;
    companySelect.appendChild(opt);
  });

  const departments = Array.from(new Set(
    docs.map(d => extractDocFieldValue(d, 'department')).filter(b => b && b !== '-')
  )).sort();

  deptSelect.innerHTML = '<option value="ALL">-- เลือกแผนก ทั้งหมด --</option>';
  departments.forEach(dept => {
    const opt = document.createElement('option');
    opt.value = dept;
    opt.textContent = dept;
    if (dept === currentDept) opt.selected = true;
    deptSelect.appendChild(opt);
  });
}

function applyFilters(resetPage = false) {
  if (resetPage) currentPage = 1;

  getAllDocs(docs => {
    updateStats(docs);
    updateDropdownOptions(docs);

    const searchKeyword = (document.getElementById('textSearchInput')?.value || '').toLowerCase().trim();
    const selectedCompanyClean = document.getElementById('companyDropdownFilter')?.value || 'ALL';
    const selectedDept = document.getElementById('deptDropdownFilter')?.value || 'ALL';

    const catDropdown = document.getElementById('categoryDropdownFilter');
    if (catDropdown && catDropdown.value !== currentCategoryFilter) {
      catDropdown.value = currentCategoryFilter;
    }

    docs.sort((a, b) => b.id - a.id);

    const filtered = docs.filter(doc => {
      const matchCat = currentCategoryFilter === 'ALL' || doc.category === currentCategoryFilter;
      
      const docCompanyRaw = extractDocFieldValue(doc, 'companyName');
      const docCompanyClean = cleanCompanyName(docCompanyRaw);
      const docDept = extractDocFieldValue(doc, 'department');

      const matchCompany = selectedCompanyClean === 'ALL' || docCompanyClean === selectedCompanyClean;
      const matchDept = selectedDept === 'ALL' || docDept === selectedDept;

      let matchText = true;
      if (searchKeyword.length > 0) {
        const docNum = extractDocFieldValue(doc, 'docNumber').toLowerCase();
        const company = docCompanyRaw.toLowerCase();
        const product = extractDocFieldValue(doc, 'productDetail').toLowerCase();
        const dept = docDept.toLowerCase();
        const fileName = (doc.originalName || '').toLowerCase();

        matchText = docNum.includes(searchKeyword) || 
                    company.includes(searchKeyword) || 
                    product.includes(searchKeyword) || 
                    dept.includes(searchKeyword) || 
                    fileName.includes(searchKeyword);
      }

      return matchCat && matchCompany && matchDept && matchText;
    });

    const totalItems = filtered.length;
    const countEl = document.getElementById('filteredDocCount');
    if (countEl) countEl.textContent = `${totalItems} รายการ`;

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

function renderDocuments(docs) {
  const container = document.getElementById('documentContainer');
  if (!container) return;
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
  
  const thCheckboxClass = isSelectionMode ? '' : 'hidden';

  const colDocNum = isSelectionMode ? 'w-[8%]' : 'w-[10%]';
  const colCompany = isSelectionMode ? 'w-[14%]' : 'w-[15%]';
  const colProduct = isSelectionMode ? 'w-[18%]' : 'w-[19%]';
  const colDept = 'w-[11%]';
  const colCat = 'w-[9%]';
  const colDocDate = 'w-[8%]';
  const colCreateDate = 'w-[10%]';
  const colUpdateDate = 'w-[9%]';
  const colManage = 'w-[9%]';

  table.innerHTML = `
    <div class="w-full overflow-y-auto flex-1 h-full">
      <table class="w-full text-left text-xs table-fixed border-collapse">
        <thead class="bg-slate-800 text-slate-100 border-b-2 border-slate-300 font-extrabold sticky top-0 z-10 text-sm uppercase tracking-tight shadow-xs">
          <tr>
            <th class="py-3 px-1 w-[3%] text-center border-r border-slate-700 ${thCheckboxClass}">
              <input type="checkbox" onchange="toggleSelectAllDocsHeader(this)" class="w-4 h-4 rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer" title="เลือกทั้งหมด">
            </th>
            <th class="py-3 px-2 ${colDocNum} border-r border-slate-700">
              <div class="flex items-center gap-1.5 truncate" title="Doc No.">
                <i class="fa-solid fa-file-lines text-indigo-300 text-sm shrink-0"></i>
                <span class="truncate">Doc No.</span>
              </div>
            </th>
            <th class="py-3 px-2 ${colCompany} border-r border-slate-700">
              <div class="flex items-center gap-1.5 truncate" title="Company">
                <i class="fa-solid fa-building text-emerald-300 text-sm shrink-0"></i>
                <span class="truncate">Company</span>
              </div>
            </th>
            <th class="py-3 px-2 ${colProduct} border-r border-slate-700">
              <div class="flex items-center gap-1.5 truncate" title="Detail">
                <i class="fa-solid fa-box-open text-amber-300 text-sm shrink-0"></i>
                <span class="truncate">Detail</span>
              </div>
            </th>
            <th class="py-3 px-1.5 ${colDept} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Department">
                <i class="fa-solid fa-sitemap text-cyan-300 text-sm shrink-0"></i>
                <span class="truncate">Department</span>
              </div>
            </th>
            <th class="py-3 px-1.5 ${colCat} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Category">
                <i class="fa-solid fa-tags text-purple-300 text-sm shrink-0"></i>
                <span class="truncate">Category</span>
              </div>
            </th>
            <th class="py-3 px-1.5 ${colDocDate} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Date">
                <i class="fa-solid fa-calendar-day text-sky-300 text-sm shrink-0"></i>
                <span class="truncate">Date</span>
              </div>
            </th>
            <th class="py-3 px-1.5 ${colCreateDate} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Create Date">
                <i class="fa-solid fa-clock text-rose-300 text-sm shrink-0"></i>
                <span class="truncate">Create Date</span>
              </div>
            </th>
            <th class="py-3 px-1.5 ${colUpdateDate} text-center border-r border-slate-700">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Update By">
                <i class="fa-solid fa-user-pen text-teal-300 text-sm shrink-0"></i>
                <span class="truncate">Update By</span>
              </div>
            </th>
            <th class="py-3 px-1.5 ${colManage} text-center">
              <div class="flex items-center justify-center gap-1.5 truncate" title="Manage">
                <i class="fa-solid fa-sliders text-slate-300 text-sm shrink-0"></i>
                <span class="truncate">Manage</span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-300 border-b-2 border-slate-300 bg-white">
          ${docs.map(doc => {
            const isChecked = selectedDocIds.has(doc.id) ? 'checked' : '';
            
            const docNumStr = extractDocFieldValue(doc, 'docNumber');
            const companyStr = extractDocFieldValue(doc, 'companyName');
            const productStr = extractDocFieldValue(doc, 'productDetail');
            const deptStr = extractDocFieldValue(doc, 'department') || '-';
            const importedDateStr = extractImportedDocDate(doc);
            
            const createDateStr = doc.formattedDate || doc.createDate || '';
            const updatedByStr = doc.updatedBy || doc.updateBy || doc.updatedByEmpId || '-';

            const canEditThisDoc = canUserEditDoc(doc);

            return `
            <tr class="hover:bg-slate-50 transition-colors ${selectedDocIds.has(doc.id) ? 'bg-indigo-50/70' : ''}">
              <td class="py-2.5 px-1 text-center border-r border-slate-300 ${thCheckboxClass}">
                <input type="checkbox" value="${doc.id}" ${isChecked} onchange="toggleDocSelection(${doc.id}, this.checked)" class="doc-checkbox w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
              </td>

              <!-- 1. Document No. -->
              <td class="py-2.5 px-2 font-bold text-indigo-700 cursor-pointer hover:underline border-r border-slate-300">
                <div class="truncate" onclick="openViewerModal(${doc.id})" title="${escapeHtml(docNumStr)}">
                  <span class="truncate text-[13px] font-bold block">${escapeHtml(docNumStr)}</span>
                </div>
              </td>

              <!-- 2. Company -->
              <td class="py-2.5 px-2 font-semibold text-emerald-800 border-r border-slate-300">
                <div class="truncate" title="${escapeHtml(companyStr)}">
                  <span class="truncate text-[13px] block">${escapeHtml(companyStr)}</span>
                </div>
              </td>

              <!-- 3. Detail -->
              <td class="py-2.5 px-2 text-slate-800 border-r border-slate-300">
                <div title="${escapeHtml(productStr)}">
                  <span class="line-clamp-2 text-[13px] leading-tight block overflow-hidden break-words" style="max-height: 2.6em;">${escapeHtml(productStr)}</span>
                </div>
              </td>

              <!-- 4. Department Data -->
              <td class="py-2.5 px-2 text-center font-medium text-slate-700 border-r border-slate-300">
                <div class="truncate" title="${escapeHtml(deptStr)}">
                  <span class="truncate text-[13px] block text-center">${escapeHtml(deptStr)}</span>
                </div>
              </td>

              <!-- Category -->
              <td class="py-2.5 px-1.5 text-center border-r border-slate-300">
                <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-extrabold truncate max-w-full ${getCategoryStyle(doc.category)}">${doc.category || ''}</span>
              </td>

              <!-- Date -->
              <td class="py-2.5 px-1.5 text-center text-slate-700 border-r border-slate-300">
                <div class="text-[13px] font-semibold text-slate-800 truncate" title="${escapeHtml(importedDateStr)}">${escapeHtml(importedDateStr)}</div>
              </td>

              <!-- Create Date -->
              <td class="py-2.5 px-1.5 text-center text-slate-600 border-r border-slate-300">
                <div class="text-[13px] font-medium text-slate-800 truncate" title="${escapeHtml(createDateStr)}">${escapeHtml(createDateStr)}</div>
              </td>

              <!-- Update By -->
              <td class="py-2.5 px-1.5 text-center text-slate-600 border-r border-slate-300">
                <div class="text-[13px] font-medium text-slate-800 truncate" title="${escapeHtml(updatedByStr)}">${escapeHtml(updatedByStr)}</div>
              </td>

              <!-- Manage Controls -->
              <td class="py-2.5 px-1.5 text-center relative">
                <button onclick="toggleActionMenu(${doc.id}, event)" class="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-1 rounded-lg font-bold text-xs border border-slate-300 transition-all flex items-center justify-center gap-1 mx-auto active:scale-95 shadow-2xs w-full max-w-[72px]">
                  <span>จัดการ</span>
                  <i class="fa-solid fa-chevron-down text-[9px] text-slate-500"></i>
                </button>

                <div id="dropdown-menu-${doc.id}" class="hidden absolute right-2 top-9 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 w-44 z-30 text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button onclick="openViewerModal(${doc.id})" class="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all flex items-center gap-2.5">
                    <i class="fa-solid fa-eye text-indigo-500 w-4 text-center"></i>
                    <span>ดูเอกสาร</span>
                  </button>

                  <button onclick="downloadDoc(${doc.id})" class="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-2.5">
                    <i class="fa-solid fa-download text-slate-500 w-4 text-center"></i>
                    <span>ดาวน์โหลด</span>
                  </button>

                  ${canEditThisDoc ? `
                  <div class="h-px bg-slate-200 my-1"></div>

                  <button onclick="openEditModalFromDashboard(${doc.id})" class="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-amber-600 hover:bg-amber-50/80 transition-all flex items-center gap-2.5">
                    <i class="fa-solid fa-pen-to-square text-amber-500 w-4 text-center"></i>
                    <span>แก้ไขข้อมูล/ไฟล์</span>
                  </button>

                  <button onclick="deleteDocFromDashboard(${doc.id})" class="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2.5">
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

/**
 * 🔹 ฟังก์ชันสำหรับบันทึกการแก้ไขข้อมูลพร้อมส่ง beforeState สำหรับ Restore
 */
function handleSaveEditedDocument(docId, newFormData) {
  getDocById(docId, oldDoc => {
    if (!oldDoc) return;

    // 1. Deep Copy ข้อมูลเดิมก่อนแก้ไขเก็บไว้ใน beforeState
    const beforeState = JSON.parse(JSON.stringify(oldDoc));

    const docNum = extractDocFieldValue(oldDoc, 'docNumber') || '-';
    const oldDetail = extractDocFieldValue(oldDoc, 'productDetail') || '-';
    const newDetail = newFormData.productDetail || oldDetail;
    const category = oldDoc.category || 'Quotation';

    // 2. ปรับปรุงข้อมูลใหม่
    const updatedDoc = {
      ...oldDoc,
      ...newFormData,
      updateDate: new Date().toISOString(),
      updatedBy: currentUser ? (currentUser.fullName || currentUser.username) : 'System'
    };

    // 3. บันทึกลง Database หรือ LocalStorage
    updateDocById(docId, updatedDoc, () => {
      // 4. บันทึก Audit Log โดยส่ง beforeState ไปในพารามิเตอร์ตัวที่ 5
      if (typeof window.addAuditLog === 'function') {
        const detailText = `Doc No: ${docNum} | Details: '${oldDetail}' -> '${newDetail}'`;
        window.addAuditLog('UPDATE', detailText, category, null, beforeState);
      }

      alert("อัปเดตข้อมูลสำเร็จ");
      if (typeof closeEditModal === 'function') closeEditModal();
      applyFilters();
    });
  });
}

function openEditModalFromDashboard(docId) {
  if (typeof openEditModal === 'function') {
    openEditModal(docId);
  } else {
    console.log("เปิด Modal แก้ไขสำหรับ ID:", docId);
  }
}

function handleExportPDF() {
  isSelectionMode = true;
  selectedDocIds.clear();

  const container = document.getElementById('exportPdfActionContainer');
  if (container) {
    container.classList.remove('hidden');
  }

  updateBulkUi();
  applyFilters();
}

function exitExportPdfMode() {
  isSelectionMode = false;
  selectedDocIds.clear();

  const container = document.getElementById('exportPdfActionContainer');
  if (container) {
    container.classList.add('hidden');
  }

  updateBulkUi();
  applyFilters();
}

function confirmAndDownloadSelectedPDFs() {
  if (selectedDocIds.size === 0) {
    alert('กรุณาติ๊กเลือกรายการเอกสารที่ต้องการ Export ก่อนครับ');
    return;
  }

  const selectedCount = selectedDocIds.size;
  if (!confirm(`คุณต้องการดึงไฟล์ PDF ของรายการที่เลือกจำนวน ${selectedCount} รายการ ใช่หรือไม่?`)) {
    return;
  }

  let downloadedCount = 0;
  const idsArray = Array.from(selectedDocIds);
  const exportedDocNumbers = [];

  idsArray.forEach(id => {
    getDocById(id, doc => {
      if (doc && doc.fileBlob) {
        const docNum = extractDocFieldValue(doc, 'docNumber') || '-';

        if (docNum && docNum !== '-') {
          exportedDocNumbers.push(docNum);
        }

        let fileName = (docNum && docNum !== '-' && docNum.trim()) 
          ? `${docNum.trim().replace(/[/\\?%*:|"<>]/g, '_')}.pdf` 
          : (doc.originalName || `Document_${doc.id}.pdf`);

        const url = URL.createObjectURL(doc.fileBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        downloadedCount++;
      }

      if (downloadedCount === selectedCount) {
        if (typeof addAuditLog === 'function') {
          const docNumListStr = exportedDocNumbers.length > 0 ? exportedDocNumbers.join(', ') : '-';
          addAuditLog('DOWNLOAD', docNumListStr, currentCategoryFilter || 'Quotation');
        }

        setTimeout(() => {
          exitExportPdfMode();
        }, 500);
      }
    });
  });
}

window.handleExportPDF = handleExportPDF;
window.exitExportPdfMode = exitExportPdfMode;
window.confirmAndDownloadSelectedPDFs = confirmAndDownloadSelectedPDFs;

async function handleDashboardBatchUpload(input) {
  if (!input.files || input.files.length === 0) return;

  const files = Array.from(input.files);

  if (files.length > 10) {
    alert("ระบบรองรับการนำเข้าไฟล์พร้อมกันได้สูงสุดไม่เกิน 10 ไฟล์");
    input.value = "";
    return;
  }

  openUploadModal();

  if (typeof processMultiplePDFFiles === 'function') {
    await processMultiplePDFFiles(files);
  } else if (typeof processPDFFile === 'function') {
    const fileInput = document.getElementById('pdfFileInput');
    if (fileInput) {
      const dataTransfer = new DataTransfer();
      files.forEach(f => dataTransfer.items.add(f));
      fileInput.files = dataTransfer.files;
      await processPDFFile(fileInput);
    }
  }

  input.value = "";
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
  const storageText = document.getElementById('sidebarStorageText');
  const progressBar = document.getElementById('storageProgressBar');
  if (storageText) storageText.textContent = `${totalMB} MB`;
  if (progressBar) progressBar.style.width = `${Math.min((totalBytes / (500 * 1024 * 1024)) * 100, 100)}%`;
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

function renderPaginationUI(totalItems, totalPages) {
  const controls = document.getElementById('paginationControls');
  if (!controls) return;
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
  if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;

  if (enable === undefined) {
    isSelectionMode = !isSelectionMode;
  } else {
    isSelectionMode = enable;
  }

  const btnToggle = document.getElementById('btnToggleSelectionMode');
  const bulkContainer = document.getElementById('bulkActionContainer');

  if (isSelectionMode) {
    if (btnToggle) btnToggle.classList.add('hidden');
    if (bulkContainer) bulkContainer.classList.remove('hidden');
  } else {
    if (btnToggle) btnToggle.classList.remove('hidden');
    if (bulkContainer) bulkContainer.classList.add('hidden');
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
  const btnExport = document.getElementById('btnConfirmExportPdf');
  const btnExportText = document.getElementById('btnConfirmExportPdfText');

  const count = selectedDocIds.size;

  if (btnDelete && btnDeleteText) {
    btnDelete.disabled = count === 0;
    btnDeleteText.textContent = `ลบที่เลือก (${count})`;
  }

  if (btnExport && btnExportText) {
    btnExport.disabled = count === 0;
    btnExportText.textContent = `ยืนยันดึง PDF (${count})`;
  }
}

function deleteDocFromDashboard(id) {
  getDocById(id, doc => {
    if (!doc || !canUserEditDoc(doc)) {
      alert('คุณไม่มีสิทธิ์ลบเอกสารของแผนกอื่น');
      return;
    }

    const docNum = extractDocFieldValue(doc, 'docNumber') || '-';
    const productDetail = extractDocFieldValue(doc, 'productDetail') || doc.title || '-';
    const category = doc.category || 'Quotation';

    if (confirm(`คุณต้องการลบเอกสารเลขที่ "${docNum}" ใช่หรือไม่?`)) {
      if (window.deleteDocumentWithLog) {
        window.deleteDocumentWithLog(doc);
      } else if (window.addAuditLog) {
        const logDetail = `${docNum} | ${productDetail}`;
        window.addAuditLog('DELETE', logDetail, category, null, doc);
      }

      deleteDocById(id, () => {
        selectedDocIds.delete(id);
        updateBulkUi();
        if (typeof renderAll === 'function') renderAll();
        if (typeof applyFilters === 'function') applyFilters();
      });
    }
  });
}

function deleteSelectedDocs() {
  if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;
  if (selectedDocIds.size === 0) return;

  const count = selectedDocIds.size;

  if (confirm(`คุณต้องการลบเอกสารที่เลือกทั้งหมด ${count} รายการ ใช่หรือไม่?`)) {
    const idsToDelete = Array.from(selectedDocIds);
    let processed = 0;

    idsToDelete.forEach(id => {
      getDocById(id, doc => {
        if (doc) {
          const docNum = extractDocFieldValue(doc, 'docNumber') || '-';
          const productDetail = extractDocFieldValue(doc, 'productDetail') || doc.title || '-';
          const category = doc.category || 'Quotation';

          if (window.deleteDocumentWithLog) {
            window.deleteDocumentWithLog(doc);
          } else if (window.addAuditLog) {
            const logDetail = `${docNum} | ${productDetail}`;
            window.addAuditLog('DELETE', logDetail, category, null, doc);
          }

          deleteDocById(id, () => {
            processed++;
            if (processed === idsToDelete.length) {
              selectedDocIds.clear();
              toggleSelectionMode(false);
              if (typeof renderAll === 'function') renderAll();
              if (typeof applyFilters === 'function') applyFilters();
            }
          });
        }
      });
    });
  }
}

function deleteDoc(id) {
  deleteDocFromDashboard(id);
}

function downloadDoc(id) {
  getDocById(id, doc => {
    if (doc && doc.fileBlob) {
      const docNum = extractDocFieldValue(doc, 'docNumber') || '-';
      const productDetail = extractDocFieldValue(doc, 'productDetail') || doc.title || '-';
      const category = doc.category || 'Quotation';
      const fileName = doc.originalName || `Document_${doc.id}.pdf`;

      const url = URL.createObjectURL(doc.fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      if (typeof addAuditLog === 'function') {
        const logDetail = `${docNum} | ${productDetail}`;
        addAuditLog('DOWNLOAD', logDetail, category);
      }
    }
  });
}

function extractImportedDocDate(doc) {
  if (!doc) return '';

  const targetKeys = ['q_date', 'inv_date', 'invt_date', 'cert_date', 'docDate', 'date'];

  if (Array.isArray(doc.fieldsData)) {
    const found = doc.fieldsData.find(item => targetKeys.includes(item.id) || item.id?.toLowerCase().includes('date') || item.name?.includes('วันที่'));
    if (found && found.value && String(found.value).trim()) {
      return String(found.value).trim();
    }
  }

  for (const k of targetKeys) {
    if (doc[k] && String(doc[k]).trim()) return String(doc[k]).trim();
  }

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

function extractDocFieldValue(doc, fieldType) {
  if (!doc) return '';

  let keys = [];
  if (fieldType === 'docNumber') keys = ['q_doc', 'inv_doc', 'invt_doc', 'cert_doc', 'docNumber', 'title'];
  if (fieldType === 'companyName') keys = ['q_comp', 'inv_comp', 'invt_comp', 'cert_comp', 'companyName'];
  if (fieldType === 'productDetail') keys = ['q_detail', 'inv_detail', 'invt_detail', 'cert_detail', 'productDetail'];
  if (fieldType === 'department') {
    keys = [
      'department', 'dept', 'empDept', 'employeeDepartment', 'userDepartment', 'userDept',
      'q_dept', 'inv_dept', 'invt_dept', 'cert_dept', 'deptName', 'section'
    ];
  }

  for (const k of keys) {
    if (doc[k] && String(doc[k]).trim()) return String(doc[k]).trim();
  }

  if (fieldType === 'department') {
    const userObjs = [doc.employee, doc.user, doc.createdUser, doc.empInfo];
    for (const obj of userObjs) {
      if (obj && typeof obj === 'object') {
        for (const k of ['department', 'dept', 'section', 'deptName']) {
          if (obj[k] && String(obj[k]).trim()) return String(obj[k]).trim();
        }
      }
    }
  }

  if (Array.isArray(doc.fieldsData)) {
    const found = doc.fieldsData.find(item => 
      keys.includes(item.id) || 
      item.id?.toLowerCase().includes('dept') || 
      item.name?.includes('แผนก')
    );
    if (found && found.value && String(found.value).trim()) {
      return String(found.value).trim();
    }
  }

  const containers = [doc.boxValues, doc.customFields, doc.boxData, doc.formData];
  for (const container of containers) {
    if (container && typeof container === 'object') {
      for (const k of keys) {
        if (container[k] && String(container[k]).trim()) return String(container[k]).trim();
      }
    }
  }

  return '-';
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
  if (!currentMenu) return;
  const isHidden = currentMenu.classList.contains('hidden');
  closeAllDropdowns();
  if (isHidden) currentMenu.classList.remove('hidden');
}

function canUserEditDoc(doc) {
  if (!currentUser) return false;

  if (currentUser.role === 'ADMIN') return true;

  if (currentUser.role === 'EDITOR') {
    const docDept = extractDocFieldValue(doc, 'department').trim().toLowerCase();
    const userDept = (currentUser.department || currentUser.dept || currentUser.section || '').trim().toLowerCase();

    return userDept !== '' && docDept === userDept;
  }

  return false;
}

window.handleSaveEditedDocument = handleSaveEditedDocument;
window.deleteDocFromDashboard = deleteDocFromDashboard;
window.deleteDoc = deleteDoc;
window.deleteSelectedDocs = deleteSelectedDocs;
window.downloadDoc = downloadDoc;