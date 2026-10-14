let pdfDocObj = null;
let isScannedPdf = false;
let pagesData = [];
let masterBox = null;
let isDrawing = false;
let activePageNum = 1;
let startX = 0, startY = 0;
let isImportDarkMode = false;
let quotationTargetField = '';

// วัตถุเก็บพิกัดลากคลุมแยกรายฟิลด์ { fieldId: { pageNum, pdfX, pdfY, pdfW, pdfH } }
let fieldBoxes = {};

// ตัวแปรเก็บการเลือกฟิลด์ในปัจจุบัน
let activeCategoryFields = [];

// กำหนดค่าเริ่มต้นของ Box Field แต่ละหมวดหมู่เอกสาร
function getDefaultCategoryFields() {
  const CUSTOM_FIELDS_KEY = 'custom_fields_data';
  const saved = localStorage.getItem(CUSTOM_FIELDS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved custom fields:", e);
    }
  }

  return {
    Quotation: [
      { id: 'q_doc', name: 'เลขเอกสารใบเสนอราคา', fieldType: 'selection', maxLen: 50 },
      { id: 'q_comp', name: 'บริษัท', fieldType: 'selection', maxLen: 100 },
      { id: 'q_detail', name: 'รายละเอียด', fieldType: 'selection', maxLen: 200 },
      { id: 'q_date', name: 'วันที่เอกสาร', fieldType: 'selection', maxLen: 50 }
    ],
    Invoice: [
      { id: 'inv_doc', name: 'เลขเอกสารใบแจ้งหนี้', fieldType: 'auto', maxLen: 50, prefix: 'INV-' },
      { id: 'inv_comp', name: 'ชื่อบริษัท', fieldType: 'auto', maxLen: 100, prefix: '' },
      { id: 'inv_detail', name: 'รายละเอียด', fieldType: 'auto', maxLen: 200, prefix: '' },
      { id: 'inv_date', name: 'วันที่เอกสาร', fieldType: 'auto', maxLen: 20, prefix: '' }
    ],
    Investment: [
      { id: 'invt_doc', name: 'เลขเอกสารการลงทุน', fieldType: 'auto', maxLen: 50, prefix: 'INVT-' },
      { id: 'invt_comp', name: 'ชื่อบริษัท / สถาบัน', fieldType: 'auto', maxLen: 100, prefix: '' },
      { id: 'invt_detail', name: 'รายละเอียดการลงทุน', fieldType: 'auto', maxLen: 200, prefix: '' },
      { id: 'invt_date', name: 'วันที่เอกสาร', fieldType: 'auto', maxLen: 20, prefix: '' }
    ],
    Certificate: [
      { id: 'cert_doc', name: 'เลขที่เกียรติบัตร / ใบรับรอง', fieldType: 'auto', maxLen: 50, prefix: 'CERT-' },
      { id: 'cert_comp', name: 'ชื่อบริษัท / หน่วยงานผู้ออก', fieldType: 'auto', maxLen: 100, prefix: '' },
      { id: 'cert_detail', name: 'รายละเอียด / หลักสูตร', fieldType: 'auto', maxLen: 200, prefix: '' },
      { id: 'cert_date', name: 'วันที่เอกสาร', fieldType: 'auto', maxLen: 20, prefix: '' }
    ]
  };
}

function renderUploadModal() {
  const container = document.getElementById('uploadModal');
  container.className = "fixed inset-0 w-screen h-screen bg-slate-950 z-50 hidden flex flex-col p-0 overflow-hidden max-w-full max-h-full";

  container.innerHTML = `
    <div class="bg-white w-full h-full flex flex-col min-h-0 overflow-hidden">
      
      <!-- Top Bar Toolbar -->
      <div id="importTopBar" class="w-full px-3 py-2 bg-slate-100 text-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-slate-200 shadow-2xs transition-colors duration-200">
        
        <div class="flex flex-wrap items-center gap-2 max-w-full">
          <!-- 1. โลโก้ + เลือกไฟล์ PDF -->
          <div class="flex items-center gap-2 shrink-0">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <i class="fa-solid fa-file-signature"></i>
            </div>

            <label class="h-9 bg-white hover:bg-indigo-50 text-indigo-700 px-3.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-95 border border-indigo-200">
              <i class="fa-solid fa-cloud-arrow-up text-sm text-indigo-600"></i>
              <span id="uploadFileLabelText" class="truncate max-w-[130px] sm:max-w-[180px]">เลือกไฟล์ PDF</span>
              <input type="file" id="pdfFileInput" accept="application/pdf" class="hidden" onchange="processPDFFile(this)">
            </label>
          </div>

          <!-- 2. คำแนะนำ + ปุ่มล้างกรอบ -->
          <div class="h-9 flex items-center bg-white px-2.5 rounded-xl border border-slate-200 gap-2 shrink-0 shadow-2xs">
            <span class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <i class="fa-solid fa-vector-square text-indigo-600 text-sm"></i>
              <span>โปรดลากกรอบบน PDF ไฟล์ตามข้อมูลที่ต้องการ</span>
            </span>

            <button type="button" onclick="clearAllBoxes()" class="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-xs transition-all flex items-center gap-1 border border-rose-200 active:scale-95" title="ล้างกรอบตำแหน่ง">
              <i class="fa-solid fa-rotate-left text-[10px]"></i> ล้างกรอบ
            </button>
          </div>

          <!-- 3. แม่แบบ (Template) -->
          <div class="h-9 flex items-center bg-white px-2 py-1 rounded-xl border border-slate-200 gap-1.5 shrink-0 shadow-2xs">
            <span class="text-xs font-bold text-slate-700 flex items-center gap-1">
              <i class="fa-solid fa-bookmark text-amber-500"></i>
              <span class="hidden sm:inline">แบบฟอร์ม:</span>
            </span>

            <select id="templateSelector" onchange="loadSelectedTemplate()" class="h-7 px-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none max-w-[110px] truncate cursor-pointer">
              <option value="">-- เลือกแบบฟอร์ม --</option>
            </select>
            
            <button type="button" onclick="deleteCurrentTemplate()" class="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center text-xs transition-colors shrink-0" title="ลบแม่แบบ">
              <i class="fa-solid fa-trash-can"></i>
            </button>

            <div class="h-4 w-px bg-slate-300"></div>

            <input type="text" id="newTemplateName" placeholder="ชื่อแม่แบบ..." class="h-7 px-2 bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg text-xs w-20 sm:w-24 focus:outline-none">
            
            <button type="button" onclick="saveCurrentTemplate()" class="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shrink-0 transition-all flex items-center gap-1 active:scale-95">
              <i class="fa-solid fa-floppy-disk text-[10px]"></i> บันทึก
            </button>
          </div>

          <!-- 4. หมวดหมู่เอกสาร -->
          <div class="h-9 flex items-center bg-white px-2.5 rounded-xl border border-slate-200 gap-1.5 shrink-0 shadow-2xs">
            <span class="text-xs font-bold text-amber-600 flex items-center gap-1 shrink-0">
              <i class="fa-solid fa-folder-open text-xs"></i> หมวดหมู่:
            </span>
            <select id="fileCategory" onchange="onCategoryChanged()" required class="h-7 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none cursor-pointer">
              <option value="Quotation">Quotation (ใบเสนอราคา)</option>
              <option value="Invoice">Invoice (ใบแจ้งหนี้)</option>
              <option value="Investment">Investment (การลงทุน)</option>
              <option value="Certificate">Certificate (เกียรติบัตร/ใบรับรอง)</option>
            </select>
          </div>

        </div>

        <!-- ปุ่มขวาสุด -->
        <div class="flex items-center gap-1.5 shrink-0 ml-auto">
          <button type="button" id="importThemeToggleBtn" onclick="toggleImportTheme()" class="w-9 h-9 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-all font-bold shadow-2xs active:scale-95" title="สลับธีม สว่าง/มืด">
            <i id="importThemeIcon" class="fa-solid fa-moon text-indigo-600 text-sm"></i>
          </button>

          <button type="button" onclick="closeUploadModal()" class="w-9 h-9 rounded-xl bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-all font-bold shadow-2xs active:scale-95" title="ปิดหน้าต่าง">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

      </div>

      <!-- Workspace Fullscreen Height 100% -->
      <form id="uploadForm" onsubmit="handleUploadSubmit(event)" class="flex-1 flex min-h-0 w-full h-full overflow-hidden bg-white">
        <input type="hidden" id="editDocId" value="">

        <!-- PDF Canvas Viewport -->
        <div class="flex-1 bg-slate-300 transition-colors duration-200 overflow-auto p-4 sm:p-6 flex flex-col items-center relative min-h-0 h-full w-full" id="canvasViewport">
          <div id="pagesContainer" class="flex flex-col items-center w-full min-h-full"></div>

          <div id="noFileOverlay" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-200/95 backdrop-blur-xs z-10 space-y-4">
            <div class="w-20 h-20 rounded-3xl bg-white text-indigo-600 flex items-center justify-center text-3xl shadow-lg border border-slate-300 animate-bounce">
              <i class="fa-solid fa-file-pdf"></i>
            </div>
            <div class="text-center space-y-1">
              <h4 class="text-lg font-bold text-slate-800">นำเข้าหรือเปลี่ยนไฟล์ PDF เข้าสู่ระบบ</h4>
              <p class="text-sm text-slate-500">ระบบสแกนข้อความภาษาไทย/อังกฤษให้อัตโนมัติ</p>
            </div>
            <button type="button" onclick="document.getElementById('pdfFileInput').click()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 active:scale-95">
              <i class="fa-solid fa-cloud-arrow-up text-base"></i>
              <span>เลือกไฟล์ PDF ที่ต้องการ</span>
            </button>
          </div>
        </div>

        <!-- Panel ด้านขวาสำหรับจัดการข้อมูล OCR & Dynamic Custom Boxes -->
        <aside id="importRightPanel" class="w-96 bg-slate-50 text-slate-800 border-l border-slate-200 flex flex-col h-full shrink-0 shadow-md relative overflow-y-auto transition-colors duration-200">
          <div id="ocrLoadingOverlay" class="hidden absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <div class="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-bold text-indigo-200" id="ocrStatusText">กำลังสแกนและประมวลผลอักขระภาษาไทย...</span>
          </div>

          <div id="importRightHeader" class="p-4 border-b border-slate-200 bg-white space-y-3 transition-colors duration-200">
            <div class="flex justify-between items-center">
              <h3 id="importRightTitle" class="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-sliders text-indigo-600"></i>
                <span>จัดการข้อมูลและบันทึก</span>
              </h3>

              <!-- ปุ่มเปิด Pop-up ตั้งค่า Custom Fields -->
              <button type="button" id="btnManageCustomFields" onclick="openCustomFieldModal()" class="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs">
                <i class="fa-solid fa-gear text-indigo-600"></i>
                <span>ตั้งค่า Box ฟิลด์</span>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button type="submit" class="h-11 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 active:scale-95">
                <i class="fa-solid fa-floppy-disk text-sm text-white"></i>
                <span>บันทึกเอกสาร</span>
              </button>

              <button type="button" onclick="closeUploadModal()" id="importCancelBtn" class="h-11 rounded-xl text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 shadow-2xs">
                ยกเลิก
              </button>
            </div>
          </div>

          <div class="p-4 space-y-4 flex-1 overflow-y-auto">
            
            <!-- Selector กรณีสกัดเฉพาะจุด (Quotation target Selector) -->
            <div id="quotationSelectorSection" class="hidden bg-indigo-50 border border-indigo-200 p-3 rounded-2xl space-y-2">
              <label class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <i class="fa-solid fa-crosshairs text-indigo-600"></i> เลือกหัวข้อที่จะลากคลุมข้อมูล:
              </label>
              <div id="quotationTargetBtnGroup" class="grid grid-cols-2 gap-1.5"></div>
            </div>

            <!-- คอนเทนเนอร์แสดงฟอร์ม dynamic field แบบปรับแต่งได้ -->
            <div id="dynamicFieldsContainer" class="space-y-3.5"></div>

          </div>
        </aside>
      </form>
    </div>

    <!-- POP-UP MODAL: สำหรับเพิ่ม/แก้ไข/ตั้งค่า Box ฟิลด์ของหมวดหมู่นั้นๆ -->
    <div id="customFieldModal" class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs hidden flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        
        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base">
              <i class="fa-solid fa-boxes-stacked"></i>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-slate-900">ตั้งค่าฟิลด์ Box ข้อมูลตามหมวดหมู่</h4>
              <p id="customFieldModalCategorySub" class="text-[11px] font-bold text-indigo-600">หมวดหมู่: Quotation</p>
            </div>
          </div>
          <button type="button" onclick="closeCustomFieldModal()" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <!-- รายการ Box ฟิลด์ที่มีในปัจจุบัน -->
        <div class="space-y-2 max-h-60 overflow-y-auto pr-1" id="customFieldsList"></div>

        <!-- ฟอร์มสำหรับเพิ่ม/แก้ไข Box ฟิลด์ใหม่ -->
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <i class="fa-solid fa-square-plus text-indigo-600"></i>
            <span id="customFieldFormModeTitle">เพิ่ม Box ข้อมูลใหม่</span>
          </div>

          <input type="hidden" id="cfEditId" value="">

          <div class="grid grid-cols-1 gap-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">1. ชนิดการสกัดข้อมูล (Field Mode) *</label>
              <select id="cfMode" onchange="toggleFieldTypeInputs()" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="selection">1. กรอกจากการลากคลุมข้อมูล (ตั้งชื่อ Box + ช่องเก็บข้อมูล + Max Length)</option>
                <option value="auto">2. สกัดอัตโนมัติ / ตัดตามเงื่อนไข (ชื่อ Box + Prefix + Max Length)</option>
                <option value="number_strip_prefix">3. สกัดเฉพาะตัวเลข (ค้นหาและตัด Prefix ออกอัตโนมัติ)</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">2. ชื่อ Box ข้อมูล *</label>
              <input type="text" id="cfName" required placeholder="เช่น เลขเอกสาร, บริษัท, รายละเอียด, วันที่..." class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <!-- กลุ่มตั้งค่าสำหรับ Prefix และ Max Length -->
            <div id="cfAutoSettingsGroup" class="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2.5">
              <div id="cfPrefixContainer">
                <label class="block text-[11px] font-bold text-indigo-900 mb-1" id="lblCfPrefix">3. Prefix (คำนำหน้าค้นหาข้อมูล)</label>
                <input type="text" id="cfPrefix" placeholder="เช่น QT-, INV-, CERT-..." class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>

              <div id="cfMaxLenContainer">
                <label class="block text-[11px] font-bold text-indigo-900 mb-1" id="lblCfMaxLen">4. จำนวนตัวอักษรสูงสุด (Max Length)</label>
                <input type="number" id="cfMaxLen" value="50" min="1" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button type="button" onclick="resetCustomFieldForm()" class="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all">ล้างฟอร์ม</button>
            <button type="button" onclick="saveCustomFieldItem()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
              <i class="fa-solid fa-plus"></i> บันทึกฟิลด์ Box
            </button>
          </div>
        </div>

        <div class="flex justify-end border-t border-slate-100 pt-3">
          <button type="button" onclick="closeCustomFieldModal()" class="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
            เสร็จสิ้น
          </button>
        </div>

      </div>
    </div>
  `;
}

function toggleFieldTypeInputs() {
  const mode = document.getElementById('cfMode').value;
  const autoGroup = document.getElementById('cfAutoSettingsGroup');
  const prefixContainer = document.getElementById('cfPrefixContainer');
  const maxLenContainer = document.getElementById('cfMaxLenContainer');
  const lblPrefix = document.getElementById('lblCfPrefix');
  const lblMaxLen = document.getElementById('lblCfMaxLen');

  if (autoGroup) {
    autoGroup.classList.remove('hidden'); // แสดงกลุ่มการตั้งค่าเสมอ

    if (mode === 'selection') {
      // รายการที่ 1: กรอกจากการลากคลุมข้อมูล -> ซ่อน Prefix แสดงเฉพาะ Max Length
      if (prefixContainer) prefixContainer.classList.add('hidden');
      if (maxLenContainer) maxLenContainer.classList.remove('hidden');
      if (lblMaxLen) lblMaxLen.textContent = '3. กำหนดค่าเริ่มต้น Max Length (จำนวนตัวอักษรสูงสุด):';
    } else {
      // รายการที่ 2 และ 3: แสดงทั้ง Prefix และ Max Length
      if (prefixContainer) prefixContainer.classList.remove('hidden');
      if (maxLenContainer) maxLenContainer.classList.remove('hidden');

      if (mode === 'number_strip_prefix') {
        if (lblPrefix) lblPrefix.textContent = '3. Prefix (ค้นหาตำแหน่งแล้วตัดPrefixนี้ออก):';
        if (lblMaxLen) lblMaxLen.textContent = '4. จำนวนตัวเลขสูงสุด (Max Number Digits):';
      } else {
        if (lblPrefix) lblPrefix.textContent = '3. Prefix (คำนำหน้าค้นหาข้อมูล):';
        if (lblMaxLen) lblMaxLen.textContent = '4. จำนวนตัวอักษรสูงสุดรวม Prefix (Max Length):';
      }
    }
  }
}

// เมื่อมีการเปลี่ยนหมวดหมู่เอกสาร ให้โหลดฟิลด์ Box ข้อมูลที่ตั้งค่าไว้ขึ้นมาใหม่
function onCategoryChanged() {
  const category = document.getElementById('fileCategory').value;
  const allCategoryFields = getAllCategoryFieldsData();
  activeCategoryFields = allCategoryFields[category] || [];

  renderDynamicFieldsUI();
}

// เรนเดอร์ฟิลด์ Box ต่างๆ ด้านขวามือของหน้า Import PDF
function renderDynamicFieldsUI() {
  const fieldsContainer = document.getElementById('dynamicFieldsContainer');
  const quotationSection = document.getElementById('quotationSelectorSection');
  const quotationBtnGroup = document.getElementById('quotationTargetBtnGroup');

  fieldsContainer.innerHTML = '';
  if (quotationBtnGroup) quotationBtnGroup.innerHTML = '';

  const category = document.getElementById('fileCategory').value;
  const colors = ['indigo', 'emerald', 'amber', 'purple', 'rose', 'sky'];

  if (!activeCategoryFields || activeCategoryFields.length === 0) {
    if (quotationSection) quotationSection.classList.add('hidden');
    fieldsContainer.innerHTML = `<div class="p-4 bg-slate-100 text-slate-500 text-xs text-center rounded-xl font-bold">ไม่มีฟิลด์ Box ข้อมูลในหมวดหมู่นี้ กรุณากดปุ่ม "ตั้งค่า Box ฟิลด์" เพื่อเพิ่มข้อมูล</div>`;
    return;
  }

  const selectionFields = activeCategoryFields.filter(f => f.fieldType === 'selection' || !f.fieldType);

  if (selectionFields.length > 0) {
    if (quotationSection) quotationSection.classList.remove('hidden');

    selectionFields.forEach((field, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = `qBtn-${field.id}`;
      btn.onclick = () => setQuotationTarget(field.id);
      btn.textContent = field.name;
      btn.className = "q-target-btn py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-100 truncate";
      quotationBtnGroup.appendChild(btn);

      if (index === 0 && !quotationTargetField) {
        setQuotationTarget(field.id);
      }
    });
  } else {
    if (quotationSection) quotationSection.classList.add('hidden');
  }

  activeCategoryFields.forEach((field, idx) => {
    const color = field.color || colors[idx % colors.length];
    const boxDiv = document.createElement('div');
    boxDiv.className = `space-y-2.5 bg-white p-4 rounded-2xl border-2 border-${color}-500 shadow-xs`;

    const fType = field.fieldType || 'selection';
    const hasPrefix = fType === 'auto' || fType === 'number_strip_prefix';

    boxDiv.innerHTML = `
      <div class="flex items-center justify-between gap-1">
        <span class="text-xs font-extrabold text-${color}-900 flex items-center gap-1.5 uppercase tracking-wide truncate">
          <span class="w-3 h-3 rounded-full bg-${color}-500 shadow-xs shrink-0"></span> ${idx + 1}. ${escapeHtml(field.name)}
        </span>
        <!-- ช่องปรับแต่ง Max Length ได้โดยตรงจากหน้า Import PDF -->
        <div class="prefix-controls flex items-center gap-1 shrink-0">
          <span class="text-[10px] font-bold text-${color}-600 uppercase">Max:</span>
          <input 
            type="number" 
            id="maxLen-${field.id}" 
            value="${field.maxLen || 50}" 
            min="1" 
            onchange="updateFieldMaxLen('${field.id}', this.value)" 
            class="font-bold text-${color}-900 bg-${color}-50/80 px-1.5 py-0.5 border border-${color}-200 rounded-lg text-xs w-12 text-center focus:outline-none" 
            title="จำนวนตัวอักษรสูงสุด"
          >
        </div>
      </div>

      <!-- แสดง Prefix เฉพาะฟิลด์ประเภทที่มีการใช้ Prefix -->
      ${hasPrefix ? `
        <div class="prefix-controls flex items-center gap-2">
          <span class="text-[10px] font-bold text-${color}-600 uppercase shrink-0">Prefix (${fType === 'number_strip_prefix' ? 'ตัดออก' : 'ค้นหา'}):</span>
          <input type="text" id="prefix-${field.id}" value="${escapeHtml(field.prefix || '')}" onchange="runAutoExtraction()" placeholder="เช่น ${field.prefix || '...'}" class="font-bold text-${color}-900 bg-${color}-50/80 px-2.5 py-1 border border-${color}-200 rounded-lg text-xs w-full focus:outline-none">
        </div>
      ` : ''}

      <!-- ช่อง Input สำหรับเก็บรายละเอียดข้อมูล -->
      <div class="relative flex items-center">
        <input 
          type="text" 
          id="val-field-${field.id}" 
          maxlength="${field.maxLen || 50}" 
          placeholder="ลากคลุมหรือพิมพ์แก้ไข${escapeHtml(field.name)}..." 
          onmousedown="event.stopPropagation()"
          onkeydown="event.stopPropagation()"
          class="font-bold text-slate-900 bg-${color}-50/80 focus:bg-white px-3 py-2 pr-8 border border-${color}-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-${color}-500 w-full text-xs shadow-2xs transition-all cursor-text relative z-10"
        >
        <button 
          type="button" 
          onmousedown="event.stopPropagation()"
          onclick="const el = document.getElementById('val-field-${field.id}'); if(el){ el.value=''; el.focus(); }; delete fieldBoxes['${field.id}']; drawAllSelectionBoxes();" 
          class="absolute right-2 text-slate-400 hover:text-rose-500 text-xs p-1.5 z-20 cursor-pointer" 
          title="ล้างข้อความในช่องนี้"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;

    fieldsContainer.appendChild(boxDiv);
  });

  if (quotationTargetField && document.getElementById(`qBtn-${quotationTargetField}`)) {
    setQuotationTarget(quotationTargetField);
  }
}

function updateFieldMaxLen(fieldId, newMax) {
  const maxVal = parseInt(newMax) || 50;
  
  // 1. อัปเดตค่า Max Length ใน activeCategoryFields
  const field = activeCategoryFields.find(f => String(f.id) === String(fieldId));
  if (field) {
    field.maxLen = maxVal;
  }

  // 2. ปรับ attribute maxlength ของช่อง Input
  const valInput = document.getElementById(`val-field-${fieldId}`);
  if (valInput) {
    valInput.setAttribute('maxlength', maxVal);
    
    // ตัดทอนข้อความในช่อง Input ทันทีหากยาวเกินค่า Max ใหม่
    if (valInput.value && valInput.value.length > maxVal) {
      valInput.value = valInput.value.substring(0, maxVal);
    }
  }

  // 3. รันประมวลผลดึงข้อมูลใหม่ทันทีหากมีการวาดกรอบอยู่แล้ว
  if (fieldBoxes[fieldId]) {
    runAutoExtraction(fieldBoxes[fieldId], fieldId);
  }
}

function setQuotationTarget(targetId) {
  quotationTargetField = targetId;

  document.querySelectorAll('.q-target-btn').forEach(btn => {
    btn.className = "q-target-btn py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-100 truncate";
  });

  const activeBtn = document.getElementById(`qBtn-${targetId}`);
  if (activeBtn) {
    activeBtn.className = "q-target-btn py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all bg-indigo-600 text-white border-indigo-600 shadow-xs truncate";
  }
}

/* === POP-UP HANDLERS FOR CUSTOM FIELD MANAGEMENT === */
function openCustomFieldModal() {
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') {
    alert('เฉพาะ Admin และ Editor เท่านั้นที่สามารถตั้งค่าฟิลด์ได้');
    return;
  }

  const category = document.getElementById('fileCategory').value;
  document.getElementById('customFieldModalCategorySub').textContent = `หมวดหมู่: ${category}`;

  resetCustomFieldForm();
  renderCustomFieldsListModal();
  document.getElementById('customFieldModal').classList.remove('hidden');
}

function closeCustomFieldModal() {
  document.getElementById('customFieldModal').classList.add('hidden');
  onCategoryChanged();
}

function renderCustomFieldsListModal() {
  const category = document.getElementById('fileCategory').value;
  const allFields = getAllCategoryFieldsData();
  const fields = allFields[category] || [];
  const container = document.getElementById('customFieldsList');

  if (!container) return;
  container.innerHTML = '';

  if (fields.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 font-bold">ยังไม่มี Box ข้อมูลในหมวดหมู่นี้</p>`;
    return;
  }

  fields.forEach((f, idx) => {
    const div = document.createElement('div');
    div.className = "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs";

    let modeText = `ลากคลุมข้อมูล (Max: ${f.maxLen || 50})`;
    if (f.fieldType === 'auto') {
      modeText = `Auto Prefix (Prefix: "${escapeHtml(f.prefix || '-')}", Max: ${f.maxLen || 50})`;
    } else if (f.fieldType === 'number_strip_prefix') {
      modeText = `สกัดเฉพาะตัวเลข (ตัด Prefix: "${escapeHtml(f.prefix || '-')}", Max ตัวเลข: ${f.maxLen || 50})`;
    }

    div.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="font-bold text-indigo-600">${idx + 1}.</span>
        <div>
          <div class="font-bold text-slate-800">${escapeHtml(f.name)}</div>
          <div class="text-[10px] text-slate-400">ชนิด: ${modeText}</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button type="button" onclick="editCustomFieldItem('${f.id}')" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold cursor-pointer">แก้ไข</button>
        <button type="button" onclick="deleteCustomFieldItem('${f.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer">ลบ</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function getAllCategoryFieldsData() {
  const CUSTOM_FIELDS_KEY = 'custom_fields_data';
  const defaults = getDefaultCategoryFields();

  const saved = localStorage.getItem(CUSTOM_FIELDS_KEY);
  if (!saved) return defaults;

  try {
    const parsed = JSON.parse(saved);
    return { ...defaults, ...parsed };
  } catch (e) {
    console.error("Error parsing saved custom fields:", e);
    return defaults;
  }
}

function resetCustomFieldForm() {
  document.getElementById('cfEditId').value = '';
  document.getElementById('cfMode').value = 'selection';
  document.getElementById('cfName').value = '';
  document.getElementById('cfMaxLen').value = '50';
  document.getElementById('cfPrefix').value = '';
  document.getElementById('customFieldFormModeTitle').textContent = 'เพิ่ม Box ข้อมูลใหม่';
  toggleFieldTypeInputs();
}

function saveCustomFieldItem() {
  const CUSTOM_FIELDS_KEY = 'custom_fields_data';
  const category = document.getElementById('fileCategory').value;
  const editId = document.getElementById('cfEditId').value;
  const fieldType = document.getElementById('cfMode').value;
  const name = document.getElementById('cfName').value.trim();
  const maxLen = parseInt(document.getElementById('cfMaxLen').value) || 50;
  const prefix = document.getElementById('cfPrefix').value.trim();

  if (!name) {
    alert('กรุณากรอกชื่อ Box ข้อมูล');
    return;
  }

  const allFields = getAllCategoryFieldsData();
  let fields = allFields[category] || [];

  const isPrefixMode = fieldType === 'auto' || fieldType === 'number_strip_prefix';

  if (editId) {
    const idx = fields.findIndex(f => String(f.id) === String(editId));
    if (idx !== -1) {
      fields[idx].name = name;
      fields[idx].fieldType = fieldType;
      fields[idx].maxLen = maxLen; // บันทึกค่า Max Length สำหรับทุกโหมด
      fields[idx].prefix = isPrefixMode ? prefix : '';
    }
  } else {
    fields.push({
      id: 'field_' + Date.now(),
      name: name,
      fieldType: fieldType,
      maxLen: maxLen, // บันทึกค่า Max Length สำหรับทุกโหมด
      prefix: isPrefixMode ? prefix : ''
    });
  }

  allFields[category] = fields;
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(allFields));

  resetCustomFieldForm();
  renderCustomFieldsListModal();
  onCategoryChanged();
}
function editCustomFieldItem(id) {
  const category = document.getElementById('fileCategory').value;
  const allFields = getAllCategoryFieldsData();
  const field = (allFields[category] || []).find(f => String(f.id) === String(id));

  if (!field) return;

  document.getElementById('cfEditId').value = field.id;
  document.getElementById('cfMode').value = field.fieldType || 'selection';
  document.getElementById('cfName').value = field.name;
  document.getElementById('cfMaxLen').value = field.maxLen || 50;
  document.getElementById('cfPrefix').value = field.prefix || '';

  document.getElementById('customFieldFormModeTitle').textContent = 'แก้ไข Box ข้อมูล';
  toggleFieldTypeInputs();
}

function deleteCustomFieldItem(id) {
  const CUSTOM_FIELDS_KEY = 'custom_fields_data';
  if (!confirm('คุณต้องการลบ Box ฟิลด์นี้ใช่หรือไม่?')) return;

  const category = document.getElementById('fileCategory').value;
  const allFields = getAllCategoryFieldsData();

  if (allFields[category]) {
    allFields[category] = allFields[category].filter(f => String(f.id) !== String(id));
    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(allFields));

    renderCustomFieldsListModal();
    onCategoryChanged();
  }
}

// 1. ฟังก์ชันคำนวณความใกล้เคียงของข้อความ (Levenshtein Distance)
function getLevenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

// 2. ฟังก์ชันประมวลผลข้อความตามกฎ (Prefix, Strip Prefix, Extract Numbers, Max Length)
function processTextByRules(text, prefix, length, fieldType = 'auto') {
  let cleanPrefix = prefix ? prefix.trim() : '';
  if (!text) return (fieldType === 'auto' && cleanPrefix) ? cleanPrefix : '';

  let str = String(text).trim();
  let bodyText = str;

  // ค้นหาตำแหน่งของ Prefix ในข้อความ
  if (cleanPrefix !== '') {
    if (str.includes(cleanPrefix)) {
      const parts = str.split(cleanPrefix);
      bodyText = parts.slice(1).join(cleanPrefix).trim();
    } else {
      const pLen = cleanPrefix.length;
      let bestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i <= str.length - Math.max(1, pLen - 1); i++) {
        const subStr = str.substring(i, i + pLen);
        const dist = getLevenshteinDistance(cleanPrefix.toLowerCase(), subStr.toLowerCase());

        const maxAllowedError = Math.floor(pLen * 0.35) || 1;
        if (dist <= maxAllowedError && dist < minDistance) {
          minDistance = dist;
          bestIndex = i + pLen;
        }
      }

      if (bestIndex !== -1) {
        bodyText = str.substring(bestIndex).trim();
      }
    }

    bodyText = bodyText.replace(/^[:\-_=\s]+/, '');
  }

  // --- กรณีโหมดที่ 3: สกัดเฉพาะตัวเลข และ ตัด Prefix ออก ---
  if (fieldType === 'number_strip_prefix') {
    const numMatches = bodyText.match(/[\d.-]+/g);
    let numberOnlyStr = numMatches ? numMatches.join('') : '';

    if (length && length > 0 && numberOnlyStr.length > length) {
      numberOnlyStr = numberOnlyStr.substring(0, length);
    }
    return numberOnlyStr;
  }

  // --- กรณีโหมดทั่วไป (Auto Prefix) ---
  if (length && length > 0) {
    bodyText = bodyText.replace(/\s+/g, ' ').trim();
    const allowedBodyLen = Math.max(0, length - cleanPrefix.length);
    if (bodyText.length > allowedBodyLen) {
      bodyText = bodyText.substring(0, allowedBodyLen);
    }
  }

  const fullResult = cleanPrefix ? `${cleanPrefix}${bodyText}` : bodyText;
  
  return (length && length > 0 && fullResult.length > length) 
    ? fullResult.substring(0, length) 
    : fullResult;
}

/* === OCR RUNNER & DATA SUBMISSION === */
async function runAutoExtraction(targetBox = null, targetFieldId = null) {
  const boxToUse = targetBox || masterBox;
  if (!boxToUse) return;

  const pData = pagesData.find(p => p.pageNum === boxToUse.pageNum);
  if (!pData) return;

  let fullExtractedText = "";
  const realX = boxToUse.pdfX * pData.pdfCanvas.width;
  const realY = boxToUse.pdfY * pData.pdfCanvas.height;
  const realW = boxToUse.pdfW * pData.pdfCanvas.width;
  const realH = boxToUse.pdfH * pData.pdfCanvas.height;

  const pad = 20;

  if (!isScannedPdf && pData.textItems && pData.textItems.length > 0) {
    const matchedTexts = pData.textItems.filter(item => {
      return (
        item.x >= realX - pad &&
        item.x + item.w <= realX + realW + pad &&
        item.y >= realY - pad &&
        item.y + item.h <= realY + realH + pad
      );
    }).map(item => item.str.trim()).filter(Boolean);

    fullExtractedText = matchedTexts.join(' ');
  } else if (realW > 5 && realH > 5) {
    showOcrLoading(true, "กำลังสแกนและประมวลผลอักขระภาษาไทย...");
    try {
      const processedCanvas = getCroppedCanvas(pData.pdfCanvas, boxToUse);
      if (!tesseractWorker) await initTesseractWorker();

      const ret = await tesseractWorker.recognize(processedCanvas);
      fullExtractedText = ret.data.text || '';
    } catch (err) {
      console.error("OCR Extraction Error:", err);
    } finally {
      showOcrLoading(false);
    }
  }

  const cleanedText = cleanOCRText(fullExtractedText);

  // ใส่ข้อความลงช่องฟิลด์เป้าหมาย
  activeCategoryFields.forEach(field => {
    const valInput = document.getElementById(`val-field-${field.id}`);
    if (!valInput) return;

    const fType = field.fieldType || 'selection';

    if (targetFieldId === field.id || (!targetFieldId && quotationTargetField === field.id)) {
      if (fType === 'selection') {
        const maxLenInput = document.getElementById(`maxLen-${field.id}`);
        const maxLen = maxLenInput ? parseInt(maxLenInput.value) || field.maxLen : field.maxLen;
        
        let textResult = cleanedText;
        if (maxLen && maxLen > 0 && textResult.length > maxLen) {
          textResult = textResult.substring(0, maxLen);
        }
        valInput.value = textResult;
      } else {
        const prefixInput = document.getElementById(`prefix-${field.id}`);
        const maxLenInput = document.getElementById(`maxLen-${field.id}`);
        const prefix = prefixInput ? prefixInput.value.trim() : field.prefix;
        const maxLen = maxLenInput ? parseInt(maxLenInput.value) || field.maxLen : field.maxLen;

        valInput.value = processTextByRules(cleanedText, prefix, maxLen, fType);
      }
    } else if (fType === 'auto' || fType === 'number_strip_prefix') {
      const prefixInput = document.getElementById(`prefix-${field.id}`);
      const maxLenInput = document.getElementById(`maxLen-${field.id}`);
      const prefix = prefixInput ? prefixInput.value.trim() : field.prefix;
      const maxLen = maxLenInput ? parseInt(maxLenInput.value) || field.maxLen : field.maxLen;

      valInput.value = processTextByRules(cleanedText, prefix, maxLen, fType);
    }
  });
}

function clearAllBoxes() {
  masterBox = null;
  fieldBoxes = {};
  activeCategoryFields.forEach(f => {
    const inp = document.getElementById(`val-field-${f.id}`);
    if (inp) inp.value = '';
  });
  drawAllSelectionBoxes();
}

function handleUploadSubmit(e) {
  e.preventDefault();
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;

  const editId = document.getElementById('editDocId').value;
  const fileInput = document.getElementById('pdfFileInput');
  const file = fileInput.files[0];
  const category = document.getElementById('fileCategory').value;

  const boxValues = {};
  const fieldsData = [];

  const currentCategoryFields = (typeof getAllCategoryFieldsData === 'function') 
    ? (getAllCategoryFieldsData()[category] || []) 
    : activeCategoryFields;

  currentCategoryFields.forEach(f => {
    const inp = document.getElementById(`val-field-${f.id}`);
    const val = inp ? inp.value.trim() : '';
    boxValues[f.id] = val;
    fieldsData.push({
      id: f.id,
      name: f.name,
      value: val
    });
  });

  const docNumVal = boxValues['q_doc'] || boxValues['inv_doc'] || boxValues['invt_doc'] || boxValues['cert_doc'] || Object.values(boxValues)[0] || '';
  const companyVal = boxValues['q_comp'] || boxValues['inv_comp'] || boxValues['invt_comp'] || boxValues['cert_comp'] || Object.values(boxValues)[1] || '';
  const detailVal = boxValues['q_detail'] || boxValues['inv_detail'] || boxValues['invt_detail'] || boxValues['cert_detail'] || Object.values(boxValues)[2] || '';
  const dateVal = boxValues['q_date'] || boxValues['inv_date'] || boxValues['invt_date'] || boxValues['cert_date'] || Object.values(boxValues)[3] || '';

  const fallbackTitle = [docNumVal, companyVal, detailVal].filter(Boolean).join(' - ') || 'เอกสารไม่มีชื่อ';
  const nowStr = (typeof getFormattedDateTime === 'function') ? getFormattedDateTime() : new Date().toLocaleString('th-TH');

  if (editId) {
    getDocById(Number(editId), doc => {
      doc.docNumber = docNumVal;
      doc.companyName = companyVal;
      doc.productDetail = detailVal;
      doc.docDate = dateVal;
      doc.q_date = dateVal;
      doc.inv_date = dateVal;
      doc.invt_date = dateVal;
      doc.cert_date = dateVal;
      doc.title = fallbackTitle;
      doc.category = category;

      doc.updateDate = nowStr;
      doc.formattedUpdateDate = nowStr;

      doc.boxValues = boxValues;
      doc.fieldsData = fieldsData;
      doc.fieldBoxes = JSON.parse(JSON.stringify(fieldBoxes || {}));

      if (file) {
        doc.originalName = file.name;
        doc.rawSize = file.size;
        doc.formattedSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        doc.fileBlob = file;
      }

      saveDoc(doc, () => {
        closeUploadModal();
        renderAll();
      });
    });
  } else {
    if (!file) {
      alert('กรุณาเลือกไฟล์ PDF');
      return;
    }

    const docData = {
      docNumber: docNumVal,
      companyName: companyVal,
      productDetail: detailVal,
      docDate: dateVal,
      q_date: dateVal,
      inv_date: dateVal,
      invt_date: dateVal,
      cert_date: dateVal,
      title: fallbackTitle,
      category: category,
      originalName: file.name,
      rawSize: file.size,
      formattedSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      createDate: nowStr,
      formattedDate: nowStr,
      updateDate: '',
      formattedUpdateDate: '',
      fileBlob: file,
      boxValues: boxValues,
      fieldsData: fieldsData,
      fieldBoxes: JSON.parse(JSON.stringify(fieldBoxes || {}))
    };

    saveDoc(docData, () => {
      closeUploadModal();
      renderAll();
    });
  }
}

function openUploadModal() {
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;
  document.getElementById('uploadForm').reset();
  document.getElementById('editDocId').value = '';

  resetCanvasToInitialState();
  refreshTemplateDropdown();
  onCategoryChanged();

  document.getElementById('uploadModal').classList.remove('hidden');
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.add('hidden');
  resetCanvasToInitialState();
}

window.addEventListener('resize', () => {
  if (pdfDocObj && !document.getElementById('uploadModal').classList.contains('hidden')) {
    fitPDFToScreen();
  }
});

function initImportTheme() {
  const IMPORT_THEME_KEY = 'import_theme_preference';
  const savedTheme = localStorage.getItem(IMPORT_THEME_KEY);
  isImportDarkMode = savedTheme === 'dark';
  applyImportThemeUI();
}

function toggleImportTheme() {
  const IMPORT_THEME_KEY = 'import_theme_preference';
  isImportDarkMode = !isImportDarkMode;
  localStorage.setItem(IMPORT_THEME_KEY, isImportDarkMode ? 'dark' : 'light');
  applyImportThemeUI();
}

function applyImportThemeUI() {
  const topBar = document.getElementById('importTopBar');
  const rightPanel = document.getElementById('importRightPanel');
  const canvasViewport = document.getElementById('canvasViewport');
  const rightHeader = document.getElementById('importRightHeader');
  const rightTitle = document.getElementById('importRightTitle');
  const cancelBtn = document.getElementById('importCancelBtn');
  const themeIcon = document.getElementById('importThemeIcon');

  if (isImportDarkMode) {
    topBar.className = "w-full px-3 py-2 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-slate-800 shadow-md transition-colors duration-200";
    rightPanel.className = "w-96 bg-slate-900 text-white border-l border-slate-800 flex flex-col h-full shrink-0 shadow-2xl relative overflow-y-auto transition-colors duration-200";
    canvasViewport.className = "flex-1 bg-slate-800 transition-colors duration-200 overflow-auto p-4 sm:p-6 flex flex-col items-center relative min-h-0 h-full w-full";
    rightHeader.className = "p-4 border-b border-slate-800 bg-slate-950 space-y-3 transition-colors duration-200";
    rightTitle.className = "text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2";
    if (cancelBtn) cancelBtn.className = "h-11 rounded-xl text-xs font-extrabold text-slate-800 bg-white hover:bg-slate-100 border border-white transition-all active:scale-95 shadow-md";
    themeIcon.className = "fa-solid fa-sun text-amber-400 text-lg";
  } else {
    topBar.className = "w-full px-3 py-2 bg-slate-100 text-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-slate-200 shadow-2xs transition-colors duration-200";
    rightPanel.className = "w-96 bg-slate-50 text-slate-800 border-l border-slate-200 flex flex-col h-full shrink-0 shadow-md relative overflow-y-auto transition-colors duration-200";
    canvasViewport.className = "flex-1 bg-slate-300 transition-colors duration-200 overflow-auto p-4 sm:p-6 flex flex-col items-center relative min-h-0 h-full w-full";
    rightHeader.className = "p-4 border-b border-slate-200 bg-white space-y-3 transition-colors duration-200";
    rightTitle.className = "text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2";
    if (cancelBtn) cancelBtn.className = "h-11 rounded-xl text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 shadow-2xs";
    themeIcon.className = "fa-solid fa-moon text-indigo-600 text-lg";
  }
}

function drawAllSelectionBoxes() {
  pagesData.forEach(pData => {
    const canvas = pData.selectionCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (masterBox && masterBox.pageNum === pData.pageNum) {
      const rx = masterBox.pdfX * canvas.width;
      const ry = masterBox.pdfY * canvas.height;
      const rw = masterBox.pdfW * canvas.width;
      const rh = masterBox.pdfH * canvas.height;

      ctx.strokeStyle = '#4f46e5';
      ctx.fillStyle = 'rgba(79, 70, 229, 0.15)';
      ctx.lineWidth = 2;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    }

    for (let fId in fieldBoxes) {
      const fBox = fieldBoxes[fId];
      if (fBox && fBox.pageNum === pData.pageNum) {
        const rx = fBox.pdfX * canvas.width;
        const ry = fBox.pdfY * canvas.height;
        const rw = fBox.pdfW * canvas.width;
        const rh = fBox.pdfH * canvas.height;

        ctx.strokeStyle = fId === quotationTargetField ? '#059669' : '#d97706';
        ctx.fillStyle = fId === quotationTargetField ? 'rgba(5, 150, 105, 0.15)' : 'rgba(217, 119, 6, 0.12)';
        ctx.lineWidth = 2;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }
    }
  });
}

async function checkIsScannedPDF(pdfDoc) {
  let totalTextLength = 0;
  const pagesToCheck = Math.min(pdfDoc.numPages, 3);
  for (let i = 1; i <= pagesToCheck; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    totalTextLength += textContent.items.map(item => item.str).join('').trim().length;
  }
  return totalTextLength < 20;
}

async function processPDFData(arrayBuffer, fileName = 'เอกสาร PDF') {
  document.getElementById('uploadFileLabelText').textContent = fileName;
  try {
    pdfDocObj = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    isScannedPdf = await checkIsScannedPDF(pdfDocObj);

    await fitPDFToScreen();
    refreshTemplateDropdown();

    const selectedTemplate = document.getElementById('templateSelector').value;
    if (selectedTemplate) {
      loadSelectedTemplate();
    }
  } catch (err) {
    console.error("PDF Multi-Page Render Error:", err);
  }
}

async function processPDFFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const arrayBuffer = await file.arrayBuffer();
  await processPDFData(arrayBuffer, file.name);
}

async function fitPDFToScreen() {
  if (!pdfDocObj) return;
  await renderAllPDFPages();
}

async function renderAllPDFPages() {
  if (!pdfDocObj) return;

  const container = document.getElementById('pagesContainer');
  container.innerHTML = '';
  pagesData = [];

  document.getElementById('noFileOverlay').classList.add('hidden');

  const viewportContainer = document.getElementById('canvasViewport');
  const containerWidth = viewportContainer.clientWidth - 48;

  for (let pNum = 1; pNum <= pdfDocObj.numPages; pNum++) {
    const page = await pdfDocObj.getPage(pNum);

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = containerWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale: scale });

    const wrapper = document.createElement('div');
    wrapper.className = 'page-wrapper relative rounded-lg bg-white mb-6';
    wrapper.style.width = viewport.width + 'px';
    wrapper.style.height = viewport.height + 'px';

    const pdfCanvas = document.createElement('canvas');
    pdfCanvas.className = 'pdf-page-canvas';
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    const selectionCanvas = document.createElement('canvas');
    selectionCanvas.className = 'selection-page-layer';
    selectionCanvas.width = viewport.width;
    selectionCanvas.height = viewport.height;

    wrapper.appendChild(pdfCanvas);
    wrapper.appendChild(selectionCanvas);
    container.appendChild(wrapper);

    const context = pdfCanvas.getContext('2d');
    await page.render({ canvasContext: context, viewport: viewport }).promise;

    const textContent = await page.getTextContent();

    const textItems = textContent.items.map(item => {
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      return {
        str: item.str,
        x: tx[4],
        y: tx[5] - Math.abs(item.height * scale),
        w: item.width * scale,
        h: item.height * scale
      };
    });

    pagesData.push({
      pageNum: pNum,
      viewport: viewport,
      textItems: textItems,
      pdfCanvas: pdfCanvas,
      selectionCanvas: selectionCanvas
    });

    bindMouseEventsToSelectionCanvas(selectionCanvas, pNum);
  }

  drawAllSelectionBoxes();
}

function bindMouseEventsToSelectionCanvas(canvas, pageNum) {
  canvas.addEventListener('mousedown', (e) => {
    if (!pdfDocObj) return;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    isDrawing = true;
    activePageNum = pageNum;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || activePageNum !== pageNum) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const absX = Math.min(startX, curX);
    const absY = Math.min(startY, curY);
    const absW = Math.abs(curX - startX);
    const absH = Math.abs(curY - startY);

    masterBox = {
      pageNum: pageNum,
      pdfX: absX / canvas.width,
      pdfY: absY / canvas.height,
      pdfW: absW / canvas.width,
      pdfH: absH / canvas.height
    };

    drawAllSelectionBoxes();
  });

  canvas.addEventListener('mouseup', () => {
    if (!isDrawing) return;
    isDrawing = false;

    if (quotationTargetField && masterBox) {
      if (!fieldBoxes) fieldBoxes = {};
      fieldBoxes[quotationTargetField] = JSON.parse(JSON.stringify(masterBox));
    }

    runAutoExtraction(masterBox, quotationTargetField);
    drawAllSelectionBoxes();
  });
}

function getCroppedCanvas(sourceCanvas, box) {
  const realX = box.pdfX * sourceCanvas.width;
  const realY = box.pdfY * sourceCanvas.height;
  const realW = box.pdfW * sourceCanvas.width;
  const realH = box.pdfH * sourceCanvas.height;

  const cropCanvas = document.createElement('canvas');
  const scale = 4.0;
  cropCanvas.width = Math.max(realW * scale, 1);
  cropCanvas.height = Math.max(realH * scale, 1);

  const ctx = cropCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, realX, realY, realW, realH, 0, 0, cropCanvas.width, cropCanvas.height);

  const imgData = ctx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const factor = 1.2;
    let gray = factor * (avg - 128) + 128;
    gray = Math.max(0, Math.min(255, gray));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  ctx.putImageData(imgData, 0, 0);

  return cropCanvas;
}

function showOcrLoading(show, text = "") {
  const overlay = document.getElementById('ocrLoadingOverlay');
  const statusText = document.getElementById('ocrStatusText');
  if (show) {
    statusText.textContent = text;
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

function resetCanvasToInitialState() {
  pdfDocObj = null;
  pagesData = [];
  isScannedPdf = false;

  clearAllBoxes();

  document.getElementById('pdfFileInput').value = '';
  document.getElementById('uploadFileLabelText').textContent = 'เลือก/เปลี่ยนไฟล์ PDF';
  document.getElementById('newTemplateName').value = '';
  document.getElementById('pagesContainer').innerHTML = '';

  document.getElementById('noFileOverlay').classList.remove('hidden');
}

function saveCurrentTemplate() {
  const name = document.getElementById('newTemplateName').value.trim();
  if (!name) {
    alert('กรุณากรอกชื่อฟอร์มแม่แบบก่อนบันทึก');
    return;
  }

  const category = document.getElementById('fileCategory').value;
  const TEMPLATES_KEY = 'form_templates_data';
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}');

  const fieldsSettings = activeCategoryFields.map(f => {
    const prefixInput = document.getElementById(`prefix-${f.id}`);
    const maxLenInput = document.getElementById(`maxLen-${f.id}`);
    return {
      id: f.id,
      name: f.name,
      fieldType: f.fieldType,
      prefix: prefixInput ? prefixInput.value.trim() : (f.prefix || ''),
      maxLen: maxLenInput ? parseInt(maxLenInput.value) || 50 : (f.maxLen || 50)
    };
  });

  templates[name] = {
    category: category,
    masterBox: masterBox ? JSON.parse(JSON.stringify(masterBox)) : null,
    fieldBoxes: JSON.parse(JSON.stringify(fieldBoxes || {})),
    fieldsSettings: fieldsSettings
  };

  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  document.getElementById('newTemplateName').value = '';
  refreshTemplateDropdown(name);

  fieldsSettings.forEach(setting => {
    const prefixInput = document.getElementById(`prefix-${setting.id}`);
    const maxLenInput = document.getElementById(`maxLen-${setting.id}`);
    
    if (prefixInput) prefixInput.value = setting.prefix;
    if (maxLenInput) maxLenInput.value = setting.maxLen;
  });

  alert(`บันทึกฟอร์มแม่แบบ "${name}" เรียบร้อยแล้ว`);
}

function refreshTemplateDropdown(selectedName = '') {
  const select = document.getElementById('templateSelector');
  select.innerHTML = '<option value="">-- เลือก --</option>';

  const TEMPLATES_KEY = 'form_templates_data';
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}');
  for (let name in templates) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    if (name === selectedName) option.selected = true;
    select.appendChild(option);
  }
}

async function processQuotationTemplateExtraction(tData) {
  if (!tData || !tData.fieldBoxes) return;

  showOcrLoading(true, "กำลังดึงข้อมูลใบเสนอราคาจากแม่แบบ...");
  try {
    for (let fId in tData.fieldBoxes) {
      const box = tData.fieldBoxes[fId];
      if (box) {
        await runAutoExtraction(box, fId);
      }
    }
  } catch (err) {
    console.error("Error processing Quotation template extraction:", err);
  } finally {
    showOcrLoading(false);
  }
}

async function loadSelectedTemplate() {
  const name = document.getElementById('templateSelector').value;
  if (!name) return;

  const TEMPLATES_KEY = 'form_templates_data';
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}');

  if (templates[name]) {
    const tData = templates[name];

    if (tData.category) {
      document.getElementById('fileCategory').value = tData.category;
      onCategoryChanged();
    }

    masterBox = tData.masterBox ? JSON.parse(JSON.stringify(tData.masterBox)) : null;
    fieldBoxes = tData.fieldBoxes ? JSON.parse(JSON.stringify(tData.fieldBoxes)) : {};

    if (tData.fieldsSettings && Array.isArray(tData.fieldsSettings)) {
      tData.fieldsSettings.forEach(setting => {
        const prefixInput = document.getElementById(`prefix-${setting.id}`);
        const maxLenInput = document.getElementById(`maxLen-${setting.id}`);
        
        if (prefixInput) prefixInput.value = setting.prefix || '';
        if (maxLenInput) maxLenInput.value = setting.maxLen || 50;
      });
    }

    drawAllSelectionBoxes();

    const currentCategory = document.getElementById('fileCategory').value;
    if (currentCategory === 'Quotation') {
      await processQuotationTemplateExtraction(tData);
    }
  }
}

function deleteCurrentTemplate() {
  const name = document.getElementById('templateSelector').value;
  if (!name) return;

  if (confirm(`คุณต้องการลบฟอร์มแม่แบบ "${name}" หรือไม่?`)) {
    const TEMPLATES_KEY = 'form_templates_data';
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '{}');
    delete templates[name];
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    refreshTemplateDropdown();
  }
}

function openEditModal(id) {
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') return;
  getDocById(id, async doc => {
    document.getElementById('uploadForm').reset();
    document.getElementById('editDocId').value = doc.id;
    document.getElementById('fileCategory').value = doc.category;

    onCategoryChanged();

    if (doc.boxValues) {
      for (let fId in doc.boxValues) {
        const input = document.getElementById(`val-field-${fId}`);
        if (input) input.value = doc.boxValues[fId] || '';
      }
    } else {
      const mapValues = {
        q_doc: doc.docNumber || '', inv_doc: doc.docNumber || '', invt_doc: doc.docNumber || '', cert_doc: doc.docNumber || '',
        q_comp: doc.companyName || '', inv_comp: doc.companyName || '', invt_comp: doc.companyName || '', cert_comp: doc.companyName || '',
        q_detail: doc.productDetail || '', inv_detail: doc.productDetail || '', invt_detail: doc.productDetail || '', cert_detail: doc.productDetail || '',
        q_date: doc.docDate || doc.q_date || '', inv_date: doc.docDate || doc.inv_date || '', invt_date: doc.docDate || doc.inv_date || '', cert_date: doc.docDate || doc.cert_date || ''
      };
      for (let fId in mapValues) {
        const input = document.getElementById(`val-field-${fId}`);
        if (input) input.value = mapValues[fId];
      }
    }

    if (doc.fieldBoxes) {
      fieldBoxes = JSON.parse(JSON.stringify(doc.fieldBoxes));
    }

    document.getElementById('uploadModal').classList.remove('hidden');

    if (doc.fileBlob) {
      const arrayBuffer = await doc.fileBlob.arrayBuffer();
      await processPDFData(arrayBuffer, doc.originalName);
    }
  });
}