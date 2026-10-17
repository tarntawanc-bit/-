let pdfDocObj = null;
let isScannedPdf = false;
let pagesData = [];
let masterBox = null;
let isDrawing = false;
let activePageNum = 1;
let startX = 0, startY = 0;
let isImportDarkMode = false;
let quotationTargetField = "";
let pendingImportTemplates = {};
// วัตถุเก็บพิกัดลากคลุมแยกรายฟิลด์ { fieldId: { pageNum, pdfX, pdfY, pdfW, pdfH } }
let fieldBoxes = {};

// ตัวแปรเก็บการเลือกฟิลด์ในปัจจุบัน
let activeCategoryFields = [];

// กำหนดค่าเริ่มต้นของ Box Field แต่ละหมวดหมู่เอกสาร
function getDefaultCategoryFields() {
  const CUSTOM_FIELDS_KEY = "custom_fields_data";
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
      { id: "q_doc", name: "เลขเอกสารใบเสนอราคา", fieldType: "selection", maxLen: 50 },
      { id: "q_comp", name: "บริษัท", fieldType: "selection", maxLen: 100 },
      { id: "q_detail", name: "รายละเอียด", fieldType: "selection", maxLen: 200 },
      { id: "q_date", name: "วันที่เอกสาร", fieldType: "selection", maxLen: 50 },
    ],
    Invoice: [
      { id: "inv_doc", name: "เลขเอกสารใบแจ้งหนี้", fieldType: "auto", maxLen: 50, prefix: "INV-" },
      { id: "inv_comp", name: "ชื่อบริษัท", fieldType: "auto", maxLen: 100, prefix: "" },
      { id: "inv_detail", name: "รายละเอียด", fieldType: "auto", maxLen: 200, prefix: "" },
      { id: "inv_date", name: "วันที่เอกสาร", fieldType: "auto", maxLen: 20, prefix: "" },
    ],
    Investment: [
      { id: "invt_doc", name: "เลขเอกสารการลงทุน", fieldType: "auto", maxLen: 50, prefix: "INVT-" },
      { id: "invt_comp", name: "ชื่อบริษัท / สถาบัน", fieldType: "auto", maxLen: 100, prefix: "" },
      { id: "invt_detail", name: "รายละเอียดการลงทุน", fieldType: "auto", maxLen: 200, prefix: "" },
      { id: "invt_date", name: "วันที่เอกสาร", fieldType: "auto", maxLen: 20, prefix: "" },
    ],
    Certificate: [
      { id: "cert_doc", name: "เลขที่เกียรติบัตร / ใบรับรอง", fieldType: "auto", maxLen: 50, prefix: "CERT-" },
      { id: "cert_comp", name: "ชื่อบริษัท / หน่วยงานผู้ออก", fieldType: "auto", maxLen: 100, prefix: "" },
      { id: "cert_detail", name: "รายละเอียด / หลักสูตร", fieldType: "auto", maxLen: 200, prefix: "" },
      { id: "cert_date", name: "วันที่เอกสาร", fieldType: "auto", maxLen: 20, prefix: "" },
    ],
  };
}

function renderUploadModal() {
  const container = document.getElementById("uploadModal");
  container.className =
    "fixed inset-0 w-screen h-screen bg-slate-950 z-50 hidden flex flex-col p-0 overflow-hidden max-w-full max-h-full";

  container.innerHTML = `
    <div class="bg-white w-full h-full flex flex-col min-h-0 overflow-hidden">
      
      <!-- Top Bar Toolbar (ป้องกันการล้น + ซ่อน Scrollbar) -->
      <div id="importTopBar" class="w-full px-4 py-2 bg-slate-100 text-slate-800 flex items-center justify-between gap-3 shrink-0 border-b border-slate-200 shadow-xs transition-colors duration-200">
        
        <!-- กลุ่มเครื่องมือด้านซ้าย-กลาง (ใช้ overflow-x-auto + [scrollbar-width:none] เพื่อเลื่อนได้โดยไม่มี Slide bar) -->
        <div class="flex-1 flex flex-nowrap items-center gap-2.5 max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
          
          <!-- 1. โลโก้ + เลือกไฟล์ PDF (เพิ่มไอคอนหน้าข้อความแล้ว) -->
          <div class="flex items-center gap-2 shrink-0">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              <i class="fa-solid fa-file-signature"></i>
            </div>

            <label class="h-10 bg-white hover:bg-indigo-50 text-indigo-700 px-4 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2 shrink-0 shadow-2xs active:scale-95 border border-indigo-200" title="อัปโหลดไฟล์ PDF">
              <i class="fa-solid fa-cloud-arrow-up text-sm text-indigo-600"></i>
              <span id="uploadFileLabelText" class="truncate max-w-[150px] sm:max-w-[200px]">เลือกหรือเปลี่ยนไฟล์ PDF</span>
              <input type="file" id="pdfFileInput" accept="application/pdf" class="hidden" onchange="processPDFFile(this)">
            </label>
          </div>

          <!-- 5. คำแนะนำการลากกรอบ + ปุ่มล้างกรอบ -->
          <div class="h-10 flex items-center bg-white px-2.5 rounded-xl border border-slate-200 gap-2 shrink-0 shadow-2xs">
            <span class="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
              <i class="fa-solid fa-vector-square text-indigo-600 text-sm"></i> กรุณาลากกรอบบน PDF ตามหัวข้อที่ต้องการ
            </span>

            <button type="button" onclick="clearAllBoxes()" class="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-xs transition-all flex items-center gap-1 border border-rose-200 active:scale-95 shrink-0 whitespace-nowrap" title="ล้างกรอบตำแหน่งทั้งหมด">
              <i class="fa-solid fa-rotate-left text-xs"></i> ล้างกรอบ
            </button>
          </div>

          <!-- 2. ปุ่มเปิดดูแบบฟอร์มที่บันทึกไว้ -->
          <button type="button" 
                  onclick="openFormTemplatesModal()" 
                  class="h-10 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold rounded-xl text-xs border border-amber-200 transition-all flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer shrink-0">
            <i class="fa-solid fa-folder-open text-amber-500 text-sm"></i>
            <span class="whitespace-nowrap">ดูแบบฟอร์ม</span>
          </button>

          <!-- 3. หมวดหมู่เอกสาร -->
          <div class="h-10 flex items-center bg-white px-2.5 rounded-xl border border-slate-200 gap-1.5 shrink-0 shadow-2xs">
            <span class="text-xs font-bold text-amber-600 flex items-center gap-1 shrink-0">
              <i class="fa-solid fa-tag text-xs"></i>
            </span>
            <select id="fileCategory" onchange="onCategoryChanged()" required class="h-7 px-1 bg-transparent text-slate-800 text-xs font-extrabold focus:outline-none cursor-pointer">
              <option value="Quotation">Quotation (ใบเสนอราคา)</option>
              <option value="Invoice">Invoice (ใบแจ้งหนี้)</option>
              <option value="Investment">Investment (การลงทุน)</option>
              <option value="Certificate">Certificate (เกียรติบัตร/ใบรับรอง)</option>
            </select>
          </div>

          <!-- 4. บล็อกจัดการแม่แบบ (Template Manager) -->
          <div class="h-10 flex items-center bg-white px-2.5 rounded-xl border border-slate-200 gap-1.5 shrink-0 shadow-2xs">
            <span class="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
              <i class="fa-solid fa-bookmark text-amber-500 text-xs"></i>
            </span>

            <select id="templateSelector" onchange="loadSelectedTemplate()" class="h-7 px-2 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none max-w-[120px] truncate cursor-pointer shrink-0" title="เลือกแม่แบบ">
              <option value="">-- เลือกแบบฟอร์ม --</option>
            </select>
            
            <button type="button" onclick="deleteCurrentTemplate()" class="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center text-xs transition-colors shrink-0" title="ลบแม่แบบที่เลือก">
              <i class="fa-solid fa-trash-can"></i>
            </button>

            <div class="h-4 w-px bg-slate-200 mx-0.5 shrink-0"></div>

            <input type="text" id="newTemplateName" placeholder="ชื่อแม่แบบ..." class="h-7 px-2 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg text-xs w-24 focus:outline-none shrink-0">
            
            <button type="button" onclick="saveCurrentTemplate()" class="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shrink-0 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap" title="บันทึกเป็นแม่แบบใหม่">
              <i class="fa-solid fa-floppy-disk text-xs"></i> บันทึก
            </button>
          </div>

        </div>

        <!-- ปุ่มควบคุมฝั่งขวาสุด -->
        <div class="flex items-center gap-1.5 shrink-0 ml-auto border-l border-slate-200 pl-2.5">
          <button type="button" id="importThemeToggleBtn" onclick="toggleImportTheme()" class="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-all font-bold shadow-2xs active:scale-95 shrink-0" title="สลับธีม สว่าง/มืด">
            <i id="importThemeIcon" class="fa-solid fa-moon text-indigo-600 text-sm"></i>
          </button>

          <button type="button" onclick="closeUploadModal()" class="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-all font-bold shadow-2xs active:scale-95 shrink-0" title="ปิดหน้าต่าง">
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
            <div id="quotationSelectorSection" class="hidden bg-indigo-50 border border-indigo-200 p-3 rounded-2xl space-y-2">
              <label class="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <i class="fa-solid fa-crosshairs text-indigo-600"></i> เลือกหัวข้อที่จะลากคลุมข้อมูล:
              </label>
              <div id="quotationTargetBtnGroup" class="grid grid-cols-2 gap-1.5"></div>
            </div>

            <div id="dynamicFieldsContainer" class="space-y-3.5"></div>
          </div>
        </aside>
      </form>
    </div>

    <!-- POP-UP MODAL: ตั้งค่า Custom Field -->
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

        <div class="space-y-2 max-h-60 overflow-y-auto pr-1" id="customFieldsList"></div>

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
  const mode = document.getElementById("cfMode").value;
  const autoGroup = document.getElementById("cfAutoSettingsGroup");
  const prefixContainer = document.getElementById("cfPrefixContainer");
  const maxLenContainer = document.getElementById("cfMaxLenContainer");
  const lblPrefix = document.getElementById("lblCfPrefix");
  const lblMaxLen = document.getElementById("lblCfMaxLen");

  if (autoGroup) {
    autoGroup.classList.remove("hidden");

    if (mode === "selection") {
      if (prefixContainer) prefixContainer.classList.add("hidden");
      if (maxLenContainer) maxLenContainer.classList.remove("hidden");
      if (lblMaxLen)
        lblMaxLen.textContent = "3. กำหนดค่าเริ่มต้น Max Length (จำนวนตัวอักษรสูงสุด):";
    } else {
      if (prefixContainer) prefixContainer.classList.remove("hidden");
      if (maxLenContainer) maxLenContainer.classList.remove("hidden");

      if (mode === "number_strip_prefix") {
        if (lblPrefix)
          lblPrefix.textContent = "3. Prefix (ค้นหาตำแหน่งแล้วตัดPrefixนี้ออก):";
        if (lblMaxLen)
          lblMaxLen.textContent = "4. จำนวนตัวเลขสูงสุด (Max Number Digits):";
      } else {
        if (lblPrefix)
          lblPrefix.textContent = "3. Prefix (คำนำหน้าค้นหาข้อมูล):";
        if (lblMaxLen)
          lblMaxLen.textContent = "4. จำนวนตัวอักษรสูงสุดรวม Prefix (Max Length):";
      }
    }
  }
}

function onCategoryChanged() {
  const category = document.getElementById("fileCategory").value;
  const allCategoryFields = getAllCategoryFieldsData();
  activeCategoryFields = allCategoryFields[category] || [];

  // เรนเดอร์ UI ฟิลด์ประจำหมวดหมู่
  renderDynamicFieldsUI();

  // รีเฟรชรายการแบบฟอร์มใน Dropdown ให้ตรงกับหมวดหมู่ใหม่ทันที
  refreshTemplateDropdown();
}

function renderDynamicFieldsUI() {
  const fieldsContainer = document.getElementById("dynamicFieldsContainer");
  const quotationSection = document.getElementById("quotationSelectorSection");
  const quotationBtnGroup = document.getElementById("quotationTargetBtnGroup");

  fieldsContainer.innerHTML = "";
  if (quotationBtnGroup) quotationBtnGroup.innerHTML = "";

  const category = document.getElementById("fileCategory").value;
  const colors = ["indigo", "emerald", "amber", "purple", "rose", "sky"];

  if (!activeCategoryFields || activeCategoryFields.length === 0) {
    if (quotationSection) quotationSection.classList.add("hidden");
    fieldsContainer.innerHTML = `<div class="p-4 bg-slate-100 text-slate-500 text-xs text-center rounded-xl font-bold">ไม่มีฟิลด์ Box ข้อมูลในหมวดหมู่นี้ กรุณากดปุ่ม "ตั้งค่า Box ฟิลด์" เพื่อเพิ่มข้อมูล</div>`;
    return;
  }

  const selectionFields = activeCategoryFields.filter(
    (f) => f.fieldType === "selection" || !f.fieldType
  );

  if (selectionFields.length > 0) {
    if (quotationSection) quotationSection.classList.remove("hidden");

    selectionFields.forEach((field, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = `qBtn-${field.id}`;
      btn.onclick = () => setQuotationTarget(field.id);
      btn.textContent = field.name;
      btn.className =
        "q-target-btn py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-100 truncate";
      quotationBtnGroup.appendChild(btn);

      if (index === 0 && !quotationTargetField) {
        setQuotationTarget(field.id);
      }
    });
  } else {
    if (quotationSection) quotationSection.classList.add("hidden");
  }

  activeCategoryFields.forEach((field, idx) => {
    const color = field.color || colors[idx % colors.length];
    const boxDiv = document.createElement("div");
    boxDiv.className = `space-y-2.5 bg-white p-4 rounded-2xl border-2 border-${color}-500 shadow-xs`;

    const fType = field.fieldType || "selection";
    const hasPrefix = fType === "auto" || fType === "number_strip_prefix";

    boxDiv.innerHTML = `
      <div class="flex items-center justify-between gap-1">
        <span class="text-xs font-extrabold text-${color}-900 flex items-center gap-1.5 uppercase tracking-wide truncate">
          <span class="w-3 h-3 rounded-full bg-${color}-500 shadow-xs shrink-0"></span> ${idx + 1}. ${escapeHtml(field.name)}
        </span>
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

      ${
        hasPrefix
          ? `
        <div class="prefix-controls flex items-center gap-2">
          <span class="text-[10px] font-bold text-${color}-600 uppercase shrink-0">Prefix (${fType === "number_strip_prefix" ? "ตัดออก" : "ค้นหา"}):</span>
          <input type="text" id="prefix-${field.id}" value="${escapeHtml(field.prefix || "")}" onchange="runAutoExtraction()" placeholder="เช่น ${field.prefix || "..."}" class="font-bold text-${color}-900 bg-${color}-50/80 px-2.5 py-1 border border-${color}-200 rounded-lg text-xs w-full focus:outline-none">
        </div>
      `
          : ""
      }

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

  if (
    quotationTargetField &&
    document.getElementById(`qBtn-${quotationTargetField}`)
  ) {
    setQuotationTarget(quotationTargetField);
  }
}

function updateFieldMaxLen(fieldId, newMax) {
  const maxVal = parseInt(newMax) || 50;

  const field = activeCategoryFields.find(
    (f) => String(f.id) === String(fieldId)
  );
  if (field) {
    field.maxLen = maxVal;
  }

  const valInput = document.getElementById(`val-field-${fieldId}`);
  if (valInput) {
    valInput.setAttribute("maxlength", maxVal);

    if (valInput.value && valInput.value.length > maxVal) {
      valInput.value = valInput.value.substring(0, maxVal);
    }
  }

  if (fieldBoxes[fieldId]) {
    runAutoExtraction(fieldBoxes[fieldId], fieldId);
  }
}

function setQuotationTarget(targetId) {
  quotationTargetField = targetId;

  document.querySelectorAll(".q-target-btn").forEach((btn) => {
    btn.className =
      "q-target-btn py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all bg-white text-slate-700 border-slate-200 hover:bg-slate-100 truncate";
  });

  const activeBtn = document.getElementById(`qBtn-${targetId}`);
  if (activeBtn) {
    activeBtn.className =
      "q-target-btn py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all bg-indigo-600 text-white border-indigo-600 shadow-xs truncate";
  }
}

/* === POP-UP HANDLERS FOR CUSTOM FIELD MANAGEMENT === */
function openCustomFieldModal() {
  if (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR") {
    alert("เฉพาะ Admin และ Editor เท่านั้นที่สามารถตั้งค่าฟิลด์ได้");
    return;
  }

  const category = document.getElementById("fileCategory").value;
  document.getElementById("customFieldModalCategorySub").textContent =
    `หมวดหมู่: ${category}`;

  resetCustomFieldForm();
  renderCustomFieldsListModal();
  document.getElementById("customFieldModal").classList.remove("hidden");
}

function closeCustomFieldModal() {
  document.getElementById("customFieldModal").classList.add("hidden");
  onCategoryChanged();
}

function renderCustomFieldsListModal() {
  const category = document.getElementById("fileCategory").value;
  const allFields = getAllCategoryFieldsData();
  const fields = allFields[category] || [];
  const container = document.getElementById("customFieldsList");

  if (!container) return;
  container.innerHTML = "";

  if (fields.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 font-bold">ยังไม่มี Box ข้อมูลในหมวดหมู่นี้</p>`;
    return;
  }

  fields.forEach((f, idx) => {
    const div = document.createElement("div");
    div.className =
      "flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs";

    let modeText = `ลากคลุมข้อมูล (Max: ${f.maxLen || 50})`;
    if (f.fieldType === "auto") {
      modeText = `Auto Prefix (Prefix: "${escapeHtml(f.prefix || "-")}", Max: ${f.maxLen || 50})`;
    } else if (f.fieldType === "number_strip_prefix") {
      modeText = `สกัดเฉพาะตัวเลข (ตัด Prefix: "${escapeHtml(f.prefix || "-")}", Max ตัวเลข: ${f.maxLen || 50})`;
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
  const CUSTOM_FIELDS_KEY = "custom_fields_data";
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
  document.getElementById("cfEditId").value = "";
  document.getElementById("cfMode").value = "selection";
  document.getElementById("cfName").value = "";
  document.getElementById("cfMaxLen").value = "50";
  document.getElementById("cfPrefix").value = "";
  document.getElementById("customFieldFormModeTitle").textContent =
    "เพิ่ม Box ข้อมูลใหม่";
  toggleFieldTypeInputs();
}

function saveCustomFieldItem() {
  const CUSTOM_FIELDS_KEY = "custom_fields_data";
  const category = document.getElementById("fileCategory").value;
  const editId = document.getElementById("cfEditId").value;
  const fieldType = document.getElementById("cfMode").value;
  const name = document.getElementById("cfName").value.trim();
  const maxLen = parseInt(document.getElementById("cfMaxLen").value) || 50;
  const prefix = document.getElementById("cfPrefix").value.trim();

  if (!name) {
    alert("กรุณากรอกชื่อ Box ข้อมูล");
    return;
  }

  const allFields = getAllCategoryFieldsData();
  let fields = allFields[category] || [];

  const isPrefixMode =
    fieldType === "auto" || fieldType === "number_strip_prefix";

  if (editId) {
    const idx = fields.findIndex((f) => String(f.id) === String(editId));
    if (idx !== -1) {
      fields[idx].name = name;
      fields[idx].fieldType = fieldType;
      fields[idx].maxLen = maxLen;
      fields[idx].prefix = isPrefixMode ? prefix : "";
    }
  } else {
    fields.push({
      id: "field_" + Date.now(),
      name: name,
      fieldType: fieldType,
      maxLen: maxLen,
      prefix: isPrefixMode ? prefix : "",
    });
  }

  allFields[category] = fields;
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(allFields));

  resetCustomFieldForm();
  renderCustomFieldsListModal();
  onCategoryChanged();
}

function editCustomFieldItem(id) {
  const category = document.getElementById("fileCategory").value;
  const allFields = getAllCategoryFieldsData();
  const field = (allFields[category] || []).find(
    (f) => String(f.id) === String(id)
  );

  if (!field) return;

  document.getElementById("cfEditId").value = field.id;
  document.getElementById("cfMode").value = field.fieldType || "selection";
  document.getElementById("cfName").value = field.name;
  document.getElementById("cfMaxLen").value = field.maxLen || 50;
  document.getElementById("cfPrefix").value = field.prefix || "";

  document.getElementById("customFieldFormModeTitle").textContent =
    "แก้ไข Box ข้อมูล";
  toggleFieldTypeInputs();
}

function deleteCustomFieldItem(id) {
  const CUSTOM_FIELDS_KEY = "custom_fields_data";
  if (!confirm("คุณต้องการลบ Box ฟิลด์นี้ใช่หรือไม่?")) return;

  const category = document.getElementById("fileCategory").value;
  const allFields = getAllCategoryFieldsData();

  if (allFields[category]) {
    allFields[category] = allFields[category].filter(
      (f) => String(f.id) !== String(id)
    );
    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(allFields));

    renderCustomFieldsListModal();
    onCategoryChanged();
  }
}

function getLevenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
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

function processTextByRules(text, prefix, length, fieldType = "auto") {
  let cleanPrefix = prefix ? prefix.trim() : "";
  if (!text) return fieldType === "auto" && cleanPrefix ? cleanPrefix : "";

  let str = String(text).trim();
  let bodyText = str;

  if (cleanPrefix !== "") {
    if (str.includes(cleanPrefix)) {
      const parts = str.split(cleanPrefix);
      bodyText = parts.slice(1).join(cleanPrefix).trim();
    } else {
      const pLen = cleanPrefix.length;
      let bestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i <= str.length - Math.max(1, pLen - 1); i++) {
        const subStr = str.substring(i, i + pLen);
        const dist = getLevenshteinDistance(
          cleanPrefix.toLowerCase(),
          subStr.toLowerCase()
        );

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

    bodyText = bodyText.replace(/^[:\-_=\s]+/, "");
  }

  if (fieldType === "number_strip_prefix") {
    const numMatches = bodyText.match(/[\d.-]+/g);
    let numberOnlyStr = numMatches ? numMatches.join("") : "";

    if (length && length > 0 && numberOnlyStr.length > length) {
      numberOnlyStr = numberOnlyStr.substring(0, length);
    }
    return numberOnlyStr;
  }

  if (length && length > 0) {
    bodyText = bodyText.replace(/\s+/g, " ").trim();
    const allowedBodyLen = Math.max(0, length - cleanPrefix.length);
    if (bodyText.length > allowedBodyLen) {
      bodyText = bodyText.substring(0, allowedBodyLen);
    }
  }

  const fullResult = cleanPrefix ? `${cleanPrefix}${bodyText}` : bodyText;

  return length && length > 0 && fullResult.length > length
    ? fullResult.substring(0, length)
    : fullResult;
}

/* === OCR RUNNER & DATA SUBMISSION === */
async function runAutoExtraction(targetBox = null, targetFieldId = null) {
  const boxToUse = targetBox || masterBox;
  if (!boxToUse) return;

  const pData = pagesData.find((p) => p.pageNum === boxToUse.pageNum);
  if (!pData) return;

  let fullExtractedText = "";
  const realX = boxToUse.pdfX * pData.pdfCanvas.width;
  const realY = boxToUse.pdfY * pData.pdfCanvas.height;
  const realW = boxToUse.pdfW * pData.pdfCanvas.width;
  const realH = boxToUse.pdfH * pData.pdfCanvas.height;

  const pad = 20;

  if (!isScannedPdf && pData.textItems && pData.textItems.length > 0) {
    const matchedTexts = pData.textItems
      .filter((item) => {
        return (
          item.x >= realX - pad &&
          item.x + item.w <= realX + realW + pad &&
          item.y >= realY - pad &&
          item.y + item.h <= realY + realH + pad
        );
      })
      .map((item) => item.str.trim())
      .filter(Boolean);

    fullExtractedText = matchedTexts.join(" ");
  } else if (realW > 5 && realH > 5) {
    showOcrLoading(true, "กำลังสแกนและประมวลผลอักขระภาษาไทย...");
    try {
      const processedCanvas = getCroppedCanvas(pData.pdfCanvas, boxToUse);
      if (!tesseractWorker) await initTesseractWorker();

      const ret = await tesseractWorker.recognize(processedCanvas);
      fullExtractedText = ret.data.text || "";
    } catch (err) {
      console.error("OCR Extraction Error:", err);
    } finally {
      showOcrLoading(false);
    }
  }

  const cleanedText = cleanOCRText(fullExtractedText);

  activeCategoryFields.forEach((field) => {
    const valInput = document.getElementById(`val-field-${field.id}`);
    if (!valInput) return;

    const fType = field.fieldType || "selection";

    if (
      targetFieldId === field.id ||
      (!targetFieldId && quotationTargetField === field.id)
    ) {
      if (fType === "selection") {
        const maxLenInput = document.getElementById(`maxLen-${field.id}`);
        const maxLen = maxLenInput
          ? parseInt(maxLenInput.value) || field.maxLen
          : field.maxLen;

        let textResult = cleanedText;
        if (maxLen && maxLen > 0 && textResult.length > maxLen) {
          textResult = textResult.substring(0, maxLen);
        }
        valInput.value = textResult;
      } else {
        const prefixInput = document.getElementById(`prefix-${field.id}`);
        const maxLenInput = document.getElementById(`maxLen-${field.id}`);
        const prefix = prefixInput ? prefixInput.value.trim() : field.prefix;
        const maxLen = maxLenInput
          ? parseInt(maxLenInput.value) || field.maxLen
          : field.maxLen;

        valInput.value = processTextByRules(cleanedText, prefix, maxLen, fType);
      }
    } else if (fType === "auto" || fType === "number_strip_prefix") {
      const prefixInput = document.getElementById(`prefix-${field.id}`);
      const maxLenInput = document.getElementById(`maxLen-${field.id}`);
      const prefix = prefixInput ? prefixInput.value.trim() : field.prefix;
      const maxLen = maxLenInput
        ? parseInt(maxLenInput.value) || field.maxLen
        : field.maxLen;

      valInput.value = processTextByRules(cleanedText, prefix, maxLen, fType);
    }
  });
}

function clearAllBoxes() {
  masterBox = null;
  fieldBoxes = {};
  activeCategoryFields.forEach((f) => {
    const inp = document.getElementById(`val-field-${f.id}`);
    if (inp) inp.value = "";
  });
  drawAllSelectionBoxes();
}

function handleUploadSubmit(e) {
  e.preventDefault();
  if (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR") return;

  const editId = document.getElementById("editDocId").value;
  const fileInput = document.getElementById("pdfFileInput");
  const file = fileInput.files[0];
  const category = document.getElementById("fileCategory").value;

  const boxValues = {};
  const fieldsData = [];

  const currentCategoryFields =
    typeof getAllCategoryFieldsData === "function"
      ? getAllCategoryFieldsData()[category] || []
      : activeCategoryFields;

  currentCategoryFields.forEach((f) => {
    const inp = document.getElementById(`val-field-${f.id}`);
    const val = inp ? inp.value.trim() : "";
    boxValues[f.id] = val;
    fieldsData.push({
      id: f.id,
      name: f.name,
      value: val,
    });
  });

  const docNumVal =
    boxValues["q_doc"] || boxValues["inv_doc"] || boxValues["invt_doc"] || boxValues["cert_doc"] || Object.values(boxValues)[0] || "";
  const companyVal =
    boxValues["q_comp"] || boxValues["inv_comp"] || boxValues["invt_comp"] || boxValues["cert_comp"] || Object.values(boxValues)[1] || "";
  const detailVal =
    boxValues["q_detail"] || boxValues["inv_detail"] || boxValues["invt_detail"] || boxValues["cert_detail"] || Object.values(boxValues)[2] || "";
  const dateVal =
    boxValues["q_date"] || boxValues["inv_date"] || boxValues["invt_date"] || boxValues["cert_date"] || Object.values(boxValues)[3] || "";

  // ดึงข้อมูลแผนก
  const deptVal = 
    boxValues["q_dept"] || 
    boxValues["inv_dept"] || 
    boxValues["invt_dept"] || 
    boxValues["cert_dept"] || 
    boxValues["department"] || 
    boxValues["dept"] || 
    (currentUser ? (currentUser.department || currentUser.dept || currentUser.section || "") : "");

  const fallbackTitle = [docNumVal, companyVal, detailVal].filter(Boolean).join(" - ") || "เอกสารไม่มีชื่อ";
  const nowStr = typeof getFormattedDateTime === "function" ? getFormattedDateTime() : new Date().toLocaleString("th-TH");

  // =========================================================================
  // 🔹 ดึงข้อมูลผู้บันทึกข้อมูล (Full Name & Employee ID)
  // =========================================================================
  const activeUser = window.currentUser || window.user || window.loggedInUser || (typeof currentUser !== "undefined" ? currentUser : {});
  const allUsers = window.usersList || window.employees || window.userList || [];

  const matchedUser = allUsers.find(u => 
    (activeUser.employeeId && (u.employeeId === activeUser.employeeId || u.empId === activeUser.employeeId)) ||
    (activeUser.empId && (u.empId === activeUser.empId || u.employeeId === activeUser.empId || u.empCode === activeUser.empId)) ||
    (activeUser.username && u.username === activeUser.username)
  ) || activeUser;

  const userFullName = 
    activeUser.fullName || activeUser.fullname || activeUser.name || 
    matchedUser.fullName || matchedUser.fullname || matchedUser.name || 
    activeUser.username || "System";

  const userEmployeeId = 
    activeUser.employeeId || activeUser.empId || activeUser.empCode || 
    matchedUser.employeeId || matchedUser.empId || matchedUser.empCode || 
    activeUser.id || "-";

  const userInfoForLog = {
    fullName: userFullName,
    employeeId: userEmployeeId,
    department: deptVal || matchedUser.department || matchedUser.dept || activeUser.department || activeUser.dept || "-"
  };

  // 🔹 สร้างข้อความสำหรับ Log ให้เข้าโครงสร้างมาตรฐาน 3 บรรทัด: "Doc No (Company) | Detail"
  const logDetailText = `${docNumVal || '-'}${companyVal ? ` (${companyVal})` : ''} | ${detailVal || '-'}`;

  if (editId) {
    getDocById(Number(editId), (doc) => {
      doc.docNumber = docNumVal;
      doc.companyName = companyVal;
      doc.productDetail = detailVal;
      doc.department = deptVal;
      doc.empDept = deptVal;
      doc.docDate = dateVal;
      doc.title = fallbackTitle;
      doc.category = category;

      doc.updateDate = nowStr;
      doc.formattedUpdateDate = nowStr;

      doc.updatedBy = userFullName;
      doc.updatedByEmpId = userEmployeeId;

      doc.boxValues = boxValues;
      doc.fieldsData = fieldsData;
      doc.fieldBoxes = JSON.parse(JSON.stringify(fieldBoxes || {}));

      if (file) {
        doc.originalName = file.name;
        doc.rawSize = file.size;
        doc.formattedSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        doc.fileBlob = file;
      }

      saveDoc(doc, () => {
        // 🔹 เรียกฟังก์ชันบันทึก Audit Log (กรณี UPDATE)
        if (window.addAuditLog) {
          window.addAuditLog("UPDATE", logDetailText, category, userInfoForLog);
        }

        closeUploadModal();
        renderAll();
      });
    });
  } else {
    if (!file) {
      alert("กรุณาเลือกไฟล์ PDF");
      return;
    }

    const docData = {
      docNumber: docNumVal,
      companyName: companyVal,
      productDetail: detailVal,
      department: deptVal,
      empDept: deptVal,
      employeeDepartment: deptVal,
      docDate: dateVal,
      title: fallbackTitle,
      category: category,
      originalName: file.name,
      rawSize: file.size,
      formattedSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      createDate: nowStr,
      formattedDate: nowStr,
      updateDate: "",
      formattedUpdateDate: "",

      createdBy: userFullName,
      createdByName: userFullName,
      createdByEmpId: userEmployeeId,
      employeeId: userEmployeeId,
      empId: userEmployeeId,

      fileBlob: file,
      boxValues: boxValues,
      fieldsData: fieldsData,
      fieldBoxes: JSON.parse(JSON.stringify(fieldBoxes || {})),
    };

    saveDoc(docData, () => {
      // 🔹 เรียกฟังก์ชันบันทึก Audit Log (กรณี CREATE)
      if (window.addAuditLog) {
        window.addAuditLog("CREATE", logDetailText, category, userInfoForLog);
      }

      closeUploadModal();
      renderAll();
    });
  }
}

function openUploadModal() {
  if (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR") return;
  document.getElementById("uploadForm").reset();
  document.getElementById("editDocId").value = "";

  resetCanvasToInitialState();
  refreshTemplateDropdown();
  onCategoryChanged();

  document.getElementById("uploadModal").classList.remove("hidden");
}

function closeUploadModal() {
  document.getElementById("uploadModal").classList.add("hidden");
  resetCanvasToInitialState();
}

window.addEventListener("resize", () => {
  if (
    pdfDocObj &&
    !document.getElementById("uploadModal").classList.contains("hidden")
  ) {
    fitPDFToScreen();
  }
});

function initImportTheme() {
  const IMPORT_THEME_KEY = "import_theme_preference";
  const savedTheme = localStorage.getItem(IMPORT_THEME_KEY);
  isImportDarkMode = savedTheme === "dark";
  applyImportThemeUI();
}

function toggleImportTheme() {
  const IMPORT_THEME_KEY = "import_theme_preference";
  isImportDarkMode = !isImportDarkMode;
  localStorage.setItem(IMPORT_THEME_KEY, isImportDarkMode ? "dark" : "light");
  applyImportThemeUI();
}

function applyImportThemeUI() {
  const topBar = document.getElementById("importTopBar");
  const rightPanel = document.getElementById("importRightPanel");
  const canvasViewport = document.getElementById("canvasViewport");
  const rightHeader = document.getElementById("importRightHeader");
  const rightTitle = document.getElementById("importRightTitle");
  const cancelBtn = document.getElementById("importCancelBtn");
  const themeIcon = document.getElementById("importThemeIcon");

  if (isImportDarkMode) {
    topBar.className =
      "w-full px-3 py-2 bg-slate-900 text-white flex flex-nowrap items-center justify-between gap-2 shrink-0 border-b border-slate-800 shadow-md transition-colors duration-200";
    rightPanel.className =
      "w-96 bg-slate-900 text-white border-l border-slate-800 flex flex-col h-full shrink-0 shadow-2xl relative overflow-y-auto transition-colors duration-200";
    canvasViewport.className =
      "flex-1 bg-slate-800 transition-colors duration-200 overflow-auto p-4 sm:p-6 flex flex-col items-center relative min-h-0 h-full w-full";
    rightHeader.className =
      "p-4 border-b border-slate-800 bg-slate-950 space-y-3 transition-colors duration-200";
    rightTitle.className =
      "text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2";
    if (cancelBtn)
      cancelBtn.className =
        "h-11 rounded-xl text-xs font-extrabold text-slate-800 bg-white hover:bg-slate-100 border border-white transition-all active:scale-95 shadow-md";
    themeIcon.className = "fa-solid fa-sun text-amber-400 text-lg";
  } else {
    topBar.className =
      "w-full px-3 py-2 bg-slate-100 text-slate-800 flex flex-nowrap items-center justify-between gap-2 shrink-0 border-b border-slate-200 shadow-2xs transition-colors duration-200";
    rightPanel.className =
      "w-96 bg-slate-50 text-slate-800 border-l border-slate-200 flex flex-col h-full shrink-0 shadow-md relative overflow-y-auto transition-colors duration-200";
    canvasViewport.className =
      "flex-1 bg-slate-300 transition-colors duration-200 overflow-auto p-4 sm:p-6 flex flex-col items-center relative min-h-0 h-full w-full";
    rightHeader.className =
      "p-4 border-b border-slate-200 bg-white space-y-3 transition-colors duration-200";
    rightTitle.className =
      "text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2";
    if (cancelBtn)
      cancelBtn.className =
        "h-11 rounded-xl text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 shadow-2xs";
    themeIcon.className = "fa-solid fa-moon text-indigo-600 text-lg";
  }
}

function drawAllSelectionBoxes() {
  pagesData.forEach((pData) => {
    const canvas = pData.selectionCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (masterBox && masterBox.pageNum === pData.pageNum) {
      const rx = masterBox.pdfX * canvas.width;
      const ry = masterBox.pdfY * canvas.height;
      const rw = masterBox.pdfW * canvas.width;
      const rh = masterBox.pdfH * canvas.height;

      ctx.strokeStyle = "#4f46e5";
      ctx.fillStyle = "rgba(79, 70, 229, 0.15)";
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

        ctx.strokeStyle = fId === quotationTargetField ? "#059669" : "#d97706";
        ctx.fillStyle =
          fId === quotationTargetField
            ? "rgba(5, 150, 105, 0.15)"
            : "rgba(217, 119, 6, 0.12)";
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
    totalTextLength += textContent.items
      .map((item) => item.str)
      .join("")
      .trim().length;
  }
  return totalTextLength < 20;
}

async function processPDFData(arrayBuffer, fileName = "เอกสาร PDF") {
  try {
    pdfDocObj = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    isScannedPdf = await checkIsScannedPDF(pdfDocObj);

    await fitPDFToScreen();
    refreshTemplateDropdown();

    const selectedTemplate = document.getElementById("templateSelector").value;
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

  const container = document.getElementById("pagesContainer");
  container.innerHTML = "";
  pagesData = [];

  document.getElementById("noFileOverlay").classList.add("hidden");

  const viewportContainer = document.getElementById("canvasViewport");
  const containerWidth = viewportContainer.clientWidth - 48;

  for (let pNum = 1; pNum <= pdfDocObj.numPages; pNum++) {
    const page = await pdfDocObj.getPage(pNum);

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = containerWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale: scale });

    const wrapper = document.createElement("div");
    wrapper.className = "page-wrapper relative rounded-lg bg-white mb-6";
    wrapper.style.width = viewport.width + "px";
    wrapper.style.height = viewport.height + "px";

    const pdfCanvas = document.createElement("canvas");
    pdfCanvas.className = "pdf-page-canvas";
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    const selectionCanvas = document.createElement("canvas");
    selectionCanvas.className = "selection-page-layer";
    selectionCanvas.width = viewport.width;
    selectionCanvas.height = viewport.height;

    wrapper.appendChild(pdfCanvas);
    wrapper.appendChild(selectionCanvas);
    container.appendChild(wrapper);

    const context = pdfCanvas.getContext("2d");
    await page.render({ canvasContext: context, viewport: viewport }).promise;

    const textContent = await page.getTextContent();

    const textItems = textContent.items.map((item) => {
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      return {
        str: item.str,
        x: tx[4],
        y: tx[5] - Math.abs(item.height * scale),
        w: item.width * scale,
        h: item.height * scale,
      };
    });

    pagesData.push({
      pageNum: pNum,
      viewport: viewport,
      textItems: textItems,
      pdfCanvas: pdfCanvas,
      selectionCanvas: selectionCanvas,
    });

    bindMouseEventsToSelectionCanvas(selectionCanvas, pNum);
  }

  drawAllSelectionBoxes();
}

function bindMouseEventsToSelectionCanvas(canvas, pageNum) {
  canvas.addEventListener("mousedown", (e) => {
    if (!pdfDocObj) return;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    isDrawing = true;
    activePageNum = pageNum;
  });

  canvas.addEventListener("mousemove", (e) => {
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
      pdfH: absH / canvas.height,
    };

    drawAllSelectionBoxes();
  });

  canvas.addEventListener("mouseup", () => {
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

  const cropCanvas = document.createElement("canvas");
  const scale = 4.0;
  cropCanvas.width = Math.max(realW * scale, 1);
  cropCanvas.height = Math.max(realH * scale, 1);

  const ctx = cropCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    sourceCanvas,
    realX,
    realY,
    realW,
    realH,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

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
  const overlay = document.getElementById("ocrLoadingOverlay");
  const statusText = document.getElementById("ocrStatusText");
  if (show) {
    statusText.textContent = text;
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function resetCanvasToInitialState() {
  pdfDocObj = null;
  pagesData = [];
  isScannedPdf = false;

  clearAllBoxes();

  document.getElementById("pdfFileInput").value = "";
  document.getElementById("uploadFileLabelText").textContent =
    "เลือกหรือเปลี่ยนไฟล์ PDF";
  document.getElementById("newTemplateName").value = "";
  document.getElementById("pagesContainer").innerHTML = "";

  document.getElementById("noFileOverlay").classList.remove("hidden");
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// บันทึกแม่แบบพร้อมแปลงไฟล์ PDF เป็น Base64 Data URL
async function saveCurrentTemplate() {
  const name = document.getElementById("newTemplateName").value.trim();
  if (!name) {
    alert("กรุณากรอกชื่อฟอร์มแม่แบบก่อนบันทึก");
    return;
  }

  const category = document.getElementById("fileCategory").value;
  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  const fieldsSettings = activeCategoryFields.map((f) => {
    const prefixInput = document.getElementById(`prefix-${f.id}`);
    const maxLenInput = document.getElementById(`maxLen-${f.id}`);
    return {
      id: f.id,
      name: f.name,
      fieldType: f.fieldType,
      prefix: prefixInput ? prefixInput.value.trim() : f.prefix || "",
      maxLen: maxLenInput ? parseInt(maxLenInput.value) || 50 : f.maxLen || 50,
    };
  });

  let pdfDataUrl = null;
  const fileInput = document.getElementById("pdfFileInput");
  if (fileInput && fileInput.files && fileInput.files[0]) {
    try {
      pdfDataUrl = await fileToBase64(fileInput.files[0]);
    } catch (e) {
      console.error("Error converting PDF file to Base64:", e);
    }
  } else if (templates[name] && templates[name].pdfDataUrl) {
    pdfDataUrl = templates[name].pdfDataUrl;
  }

  templates[name] = {
    category: category,
    masterBox: masterBox ? JSON.parse(JSON.stringify(masterBox)) : null,
    fieldBoxes: JSON.parse(JSON.stringify(fieldBoxes || {})),
    fieldsSettings: fieldsSettings,
    pdfDataUrl: pdfDataUrl,
    savedAt: new Date().toLocaleString("th-TH"),
  };

  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    document.getElementById("newTemplateName").value = "";
    refreshTemplateDropdown(name);

    fieldsSettings.forEach((setting) => {
      const prefixInput = document.getElementById(`prefix-${setting.id}`);
      const maxLenInput = document.getElementById(`maxLen-${setting.id}`);
      if (prefixInput) prefixInput.value = setting.prefix;
      if (maxLenInput) maxLenInput.value = setting.maxLen;
    });

    alert(`บันทึกฟอร์มแม่แบบ "${name}" เรียบร้อยแล้ว`);
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      alert("ไฟล์ PDF มีขนาดใหญ่เกินไปสำหรับ LocalStorage โปรดใช้ไฟล์ PDF ที่มีขนาดเล็กลงในการบันทึกแม่แบบ");
    } else {
      console.error(e);
    }
  }
}

function refreshTemplateDropdown(selectedName = "") {
  const select = document.getElementById("templateSelector");
  if (!select) return;

  select.innerHTML = '<option value="">-- เลือกแบบ --</option>';

  const currentCategory = document.getElementById("fileCategory")?.value || "";

  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  for (let name in templates) {
    const tData = templates[name];

    if (tData && tData.category === currentCategory) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;

      if (name === selectedName) {
        option.selected = true;
      }

      select.appendChild(option);
    }
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
  const name = document.getElementById("templateSelector").value;
  if (!name) return;

  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  if (templates[name]) {
    const tData = templates[name];

    if (tData.category) {
      document.getElementById("fileCategory").value = tData.category;
      onCategoryChanged();
    }

    masterBox = tData.masterBox
      ? JSON.parse(JSON.stringify(tData.masterBox))
      : null;
    fieldBoxes = tData.fieldBoxes
      ? JSON.parse(JSON.stringify(tData.fieldBoxes))
      : {};

    if (tData.fieldsSettings && Array.isArray(tData.fieldsSettings)) {
      tData.fieldsSettings.forEach((setting) => {
        const prefixInput = document.getElementById(`prefix-${setting.id}`);
        const maxLenInput = document.getElementById(`maxLen-${setting.id}`);

        if (prefixInput) prefixInput.value = setting.prefix || "";
        if (maxLenInput) maxLenInput.value = setting.maxLen || 50;
      });
    }

    drawAllSelectionBoxes();

    const currentCategory = document.getElementById("fileCategory").value;
    if (currentCategory === "Quotation") {
      await processQuotationTemplateExtraction(tData);
    }
  }
}

function deleteCurrentTemplate() {
  const name = document.getElementById("templateSelector").value;
  if (!name) return;

  if (confirm(`คุณต้องการลบฟอร์มแม่แบบ "${name}" หรือไม่?`)) {
    const TEMPLATES_KEY = "form_templates_data";
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");
    delete templates[name];
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    refreshTemplateDropdown();
  }
}

function openEditModal(id) {
  if (currentUser.role !== "ADMIN" && currentUser.role !== "EDITOR") return;
  getDocById(id, async (doc) => {
    document.getElementById("uploadForm").reset();
    document.getElementById("editDocId").value = doc.id;
    document.getElementById("fileCategory").value = doc.category;

    onCategoryChanged();

    if (doc.boxValues) {
      for (let fId in doc.boxValues) {
        const input = document.getElementById(`val-field-${fId}`);
        if (input) input.value = doc.boxValues[fId] || "";
      }
    } else {
      const mapValues = {
        q_doc: doc.docNumber || "",
        inv_doc: doc.docNumber || "",
        invt_doc: doc.docNumber || "",
        cert_doc: doc.docNumber || "",
        q_comp: doc.companyName || "",
        inv_comp: doc.companyName || "",
        invt_comp: doc.companyName || "",
        cert_comp: doc.companyName || "",
        q_detail: doc.productDetail || "",
        inv_detail: doc.productDetail || "",
        invt_detail: doc.productDetail || "",
        cert_detail: doc.productDetail || "",
        q_date: doc.docDate || doc.q_date || "",
        inv_date: doc.docDate || doc.inv_date || "",
        invt_date: doc.docDate || doc.inv_date || "",
        cert_date: doc.docDate || doc.cert_date || "",
      };
      for (let fId in mapValues) {
        const input = document.getElementById(`val-field-${fId}`);
        if (input) input.value = mapValues[fId];
      }
    }

    if (doc.fieldBoxes) {
      fieldBoxes = JSON.parse(JSON.stringify(doc.fieldBoxes));
    }

    document.getElementById("uploadModal").classList.remove("hidden");

    if (doc.fileBlob) {
      const arrayBuffer = await doc.fileBlob.arrayBuffer();
      await processPDFData(arrayBuffer, doc.originalName);
    }
  });
}

function renderFormTemplatesModal() {
  let modal = document.getElementById("formTemplatesModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "formTemplatesModal";
    document.body.appendChild(modal);
  }

  modal.className =
    "fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs hidden flex items-center justify-center p-4";
  modal.innerHTML = `
    <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
      
      <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold shadow-xs">
            <i class="fa-solid fa-shapes"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-800">จัดการแบบฟอร์มแม่แบบ (Templates)</h3>
            <p class="text-xs text-slate-500 font-medium">รายการแบบฟอร์มกรอบตำแหน่งข้อมูลที่บันทึกไว้ทั้งหมด</p>
          </div>
        </div>

        <button type="button" onclick="closeFormTemplatesModal()" class="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center transition-all cursor-pointer">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-4 border-b border-slate-100 bg-white shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div class="relative flex-1 min-w-[180px]">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" 
                 id="templateSearchInput" 
                 oninput="filterFormTemplates()" 
                 placeholder="ค้นหาชื่อแบบฟอร์ม..." 
                 class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <label class="text-xs font-bold text-slate-500">หมวดหมู่:</label>
          <select id="templateCategoryFilter" onchange="filterFormTemplates()" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer">
            <option value="ALL">ทั้งหมด</option>
            <option value="Quotation">Quotation (ใบเสนอราคา)</option>
            <option value="Invoice">Invoice (ใบแจ้งหนี้)</option>
            <option value="Investment">Investment (การลงทุน)</option>
            <option value="Certificate">Certificate (เกียรติบัตร/ใบรับรอง)</option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 border-l border-slate-200 pl-2">
          <label class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="นำเข้าแม่แบบจากไฟล์ JSON">
            <i class="fa-solid fa-file-import text-indigo-600"></i>
            <span>Import</span>
            <input type="file" id="importTemplateJsonInput" accept=".json" class="hidden" onchange="importFormTemplates(this)">
          </label>

          <button type="button" 
                  onclick="openExportSelectorModal()" 
                  class="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="เลือกแม่แบบที่ต้องการส่งออก">
            <i class="fa-solid fa-file-export text-emerald-600"></i>
            <span>Export</span>
          </button>

          <button type="button" 
                  id="btnBulkDeleteTemplates" 
                  onclick="deleteSelectedFormTemplates()" 
                  class="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95" title="ลบรายการที่เลือก">
            <i class="fa-solid fa-trash-can text-rose-600"></i>
            <span id="btnDeleteSelectedText">ลบที่เลือก (0)</span>
          </button>
        </div>
      </div>

      <div class="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
          <input type="checkbox" id="selectAllManagerTemplatesChk" onchange="toggleSelectAllManagerTemplates(this)" class="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer">
          <span>เลือกทั้งหมด</span>
        </label>
        <span class="text-[11px] text-slate-400 font-medium">ติ๊กถูกหน้าแบบฟอร์มเพื่อเลือกการลบหลายรายการพร้อมกัน</span>
      </div>

      <div class="p-5 flex-1 overflow-y-auto space-y-3" id="formTemplatesListContainer"></div>

      <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <span class="text-xs text-slate-500 font-bold" id="templatesCountText">พบแบบฟอร์มทั้งหมด 0 รายการ</span>
      </div>

      <div id="templatePreviewOverlay" class="absolute inset-0 bg-white z-20 hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
              <i class="fa-solid fa-file-pdf"></i>
            </div>
            <div>
              <h4 class="text-xs font-extrabold text-slate-800" id="previewModalTitle">ตัวอย่างเอกสาร PDF และตำแหน่งฟิลด์</h4>
              <p class="text-[11px] font-bold text-indigo-600" id="previewModalCategory">หมวดหมู่: -</p>
            </div>
          </div>
          
          <button type="button" onclick="closeTemplatePreview()" class="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-all cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-slate-100">
          <div class="flex-1 p-4 overflow-auto flex flex-col items-center justify-start bg-slate-200 border-r border-slate-200">
            <div class="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-eye text-indigo-600"></i> ตัวอย่างหน้าเอกสารและการครอบกรอบพิกัด
            </div>
            <div class="relative bg-white shadow-lg rounded-lg border border-slate-300 p-2 overflow-hidden" id="previewCanvasWrapper">
              <canvas id="pdfPreviewCanvas" class="block rounded border border-slate-100 max-w-full h-auto"></canvas>
            </div>
          </div>

          <div class="w-full md:w-80 bg-white p-4 overflow-y-auto space-y-4 shrink-0 border-t md:border-t-0 border-slate-200">
            <div>
              <h5 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <i class="fa-solid fa-sliders text-indigo-600"></i> รายการฟิลด์ข้อมูล
              </h5>
              <div class="space-y-2" id="previewFieldsList"></div>
            </div>

            <div class="pt-3 border-t border-slate-100">
              <h5 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-layer-group text-amber-500"></i> ตำแหน่งกรอบที่ครอบไว้
              </h5>
              <div id="previewBoxesList" class="space-y-1.5 text-[11px]"></div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span class="text-[11px] font-bold text-slate-500">
            <i class="fa-solid fa-circle-info text-amber-500"></i> กรอบสีบนตัวอย่างแสดงถึงตำแหน่งที่จะสกัดข้อมูล (กด X ที่มุมขวาบนเพื่อปิด)
          </span>
        </div>
      </div>

    </div>
  `;
}

function toggleSelectAllManagerTemplates(masterChk) {
  const checkboxes = document.querySelectorAll(".manager-tmpl-chk");
  checkboxes.forEach((chk) => {
    chk.checked = masterChk.checked;
  });

  updateBulkDeleteCount();
}

function updateBulkDeleteCount() {
  const selectedCount = document.querySelectorAll(".manager-tmpl-chk:checked").length;
  const btnText = document.getElementById("btnDeleteSelectedText");
  
  if (btnText) {
    btnText.textContent = `ลบที่เลือก (${selectedCount})`;
  }

  const allCheckboxes = document.querySelectorAll(".manager-tmpl-chk");
  const selectAllChk = document.getElementById("selectAllManagerTemplatesChk");
  
  if (selectAllChk) {
    selectAllChk.checked = allCheckboxes.length > 0 && selectedCount === allCheckboxes.length;
  }
}

function deleteSelectedFormTemplates() {
  const checkboxes = document.querySelectorAll(".manager-tmpl-chk:checked");

  if (checkboxes.length === 0) {
    alert("โปรดเลือกอย่างน้อย 1 รายการที่ต้องการลบ");
    return;
  }

  const count = checkboxes.length;
  if (!confirm(`คุณต้องการลบแบบฟอร์มที่เลือกจำนวน ${count} รายการ ใช่หรือไม่?`)) {
    return;
  }

  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  let deletedCount = 0;

  checkboxes.forEach((chk) => {
    const name = chk.getAttribute("data-tmpl-name");
    if (name && templates[name]) {
      delete templates[name];
      deletedCount++;
    }
  });

  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));

  alert(`ลบแบบฟอร์มเรียบร้อยแล้ว จำนวน ${deletedCount} รายการ`);

  renderFormTemplatesList();
  if (typeof refreshTemplateDropdown === "function") {
    refreshTemplateDropdown();
  }
}

async function renderPDFRealPreview(template) {
  const canvas = document.getElementById("pdfPreviewCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (!template.pdfDataUrl) {
    canvas.width = 450;
    canvas.height = 600;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ไม่พบไฟล์ PDF ตัวอย่างที่บันทึกไว้ในแม่แบบนี้", canvas.width / 2, canvas.height / 2);
    return;
  }

  try {
    const loadingTask = pdfjsLib.getDocument(template.pdfDataUrl);
    const pdfDoc = await loadingTask.promise;
    
    const page = await pdfDoc.getPage(1);
    
    const targetWidth = 450;
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale: scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    if (template.fieldBoxes && Object.keys(template.fieldBoxes).length > 0) {
      const strokeColors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#9333ea", "#0284c7"];
      const fillColors = [
        "rgba(79, 70, 229, 0.25)", 
        "rgba(5, 150, 105, 0.25)", 
        "rgba(217, 119, 6, 0.25)", 
        "rgba(220, 38, 38, 0.25)",
        "rgba(147, 51, 234, 0.25)",
        "rgba(2, 132, 199, 0.25)"
      ];

      let colorIdx = 0;

      for (let fieldId in template.fieldBoxes) {
        const box = template.fieldBoxes[fieldId];
        if (box) {
          const rx = box.pdfX * canvas.width;
          const ry = box.pdfY * canvas.height;
          const rw = box.pdfW * canvas.width;
          const rh = box.pdfH * canvas.height;

          const strokeColor = strokeColors[colorIdx % strokeColors.length];
          const fillColor = fillColors[colorIdx % fillColors.length];

          ctx.fillStyle = fillColor;
          ctx.fillRect(rx, ry, rw, rh);

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(rx, ry, rw, rh);

          ctx.fillStyle = strokeColor;
          ctx.fillRect(rx, Math.max(0, ry - 16), Math.min(rw, 100), 16);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(fieldId, rx + 4, Math.max(11, ry - 4));

          colorIdx++;
        }
      }
    }
  } catch (err) {
    console.error("Error rendering PDF Preview:", err);
    canvas.width = 450;
    canvas.height = 300;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e11d48";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("เกิดข้อผิดพลาดในการโหลดตัวอย่างไฟล์ PDF", canvas.width / 2, canvas.height / 2);
  }
}

function openFormTemplatesModal() {
  renderFormTemplatesModal();
  renderFormTemplatesList();
  document.getElementById("formTemplatesModal").classList.remove("hidden");
}

function closeFormTemplatesModal() {
  const modal = document.getElementById("formTemplatesModal");
  if (modal) modal.classList.add("hidden");
}

function closeTemplatePreview() {
  document.getElementById("templatePreviewOverlay").classList.add("hidden");
}

function filterFormTemplates() {
  renderFormTemplatesList();
}

function renderFormTemplatesList() {
  const container = document.getElementById("formTemplatesListContainer");
  const countText = document.getElementById("templatesCountText");
  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  const searchKeyword = (
    document.getElementById("templateSearchInput")?.value || ""
  )
    .toLowerCase()
    .trim();
  const selectedCategory =
    document.getElementById("templateCategoryFilter")?.value || "ALL";

  container.innerHTML = "";
  const templateNames = Object.keys(templates);

  if (templateNames.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 space-y-3">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
          <i class="fa-solid fa-folder-open"></i>
        </div>
        <div class="text-slate-500 text-sm font-bold">ยังไม่มีแบบฟอร์มแม่แบบที่บันทึกไว้</div>
      </div>
    `;
    if (countText) countText.textContent = "พบแบบฟอร์มทั้งหมด 0 รายการ";
    updateBulkDeleteCount();
    return;
  }

  let matchedCount = 0;

  templateNames.forEach((name) => {
    const template = templates[name];
    const category = template.category || "ไม่ระบุหมวดหมู่";

    const matchSearch = name.toLowerCase().includes(searchKeyword);
    const matchCategory =
      selectedCategory === "ALL" || category === selectedCategory;

    if (matchSearch && matchCategory) {
      matchedCount++;
      const boxesCount = template.fieldBoxes
        ? Object.keys(template.fieldBoxes).length
        : 0;

      const card = document.createElement("div");
      card.className =
        "bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-md group";

      card.innerHTML = `
        <div class="flex items-center gap-3.5 min-w-[200px]">
          <input type="checkbox" 
                 data-tmpl-name="${escapeHtml(name)}" 
                 onchange="updateBulkDeleteCount()" 
                 class="manager-tmpl-chk w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0">

          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-base font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <i class="fa-solid fa-file-contract"></i>
          </div>
          <div>
            <h4 class="text-sm font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">${escapeHtml(name)}</h4>
            <div class="flex items-center gap-2 mt-1">
              <span class="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-extrabold">
                ${escapeHtml(category)}
              </span>
              <span class="text-[11px] text-slate-400 font-medium">
                <i class="fa-solid fa-vector-square text-indigo-500"></i> ${boxesCount} ตำแหน่งกรอบ
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 ml-auto">
          <button type="button" 
                  onclick="previewFormTemplate('${escapeHtml(name)}')" 
                  class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer" 
                  title="ดูตัวอย่างเอกสาร">
            <i class="fa-solid fa-eye text-indigo-600"></i>
            <span>ดูตัวอย่าง</span>
          </button>

          <button type="button" 
                  onclick="editFormTemplateDirectly('${escapeHtml(name)}')" 
                  class="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer" 
                  title="แก้ไขแม่แบบนี้">
            <i class="fa-solid fa-pen-to-square"></i>
            <span>แก้ไข</span>
          </button>

          <button type="button" 
                  onclick="exportSingleFormTemplate('${escapeHtml(name)}')" 
                  class="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-all cursor-pointer active:scale-95" 
                  title="ส่งออกแม่แบบนี้">
            <i class="fa-solid fa-download text-xs"></i>
          </button>

          <button type="button" 
                  onclick="deleteFormTemplateFromManager('${escapeHtml(name)}')" 
                  class="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all cursor-pointer active:scale-95" 
                  title="ลบแบบฟอร์มนี้">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      `;

      container.appendChild(card);
    }
  });

  if (countText)
    countText.textContent = `พบแบบฟอร์มทั้งหมด ${matchedCount} รายการ`;

  updateBulkDeleteCount();
}

function exportSingleFormTemplate(name) {
  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");
  const template = templates[name];

  if (!template) {
    alert("ไม่พบแบบฟอร์มที่ต้องการส่งออก");
    return;
  }

  const exportData = {
    version: "1.0",
    exportType: "SINGLE_TEMPLATE",
    exportedAt: new Date().toISOString(),
    templates: {
      [name]: template
    }
  };

  downloadJsonFile(exportData, `Template_${name.replace(/\s+/g, '_')}.json`);
}

function exportAllFormTemplates() {
  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  if (Object.keys(templates).length === 0) {
    alert("ไม่มีแม่แบบให้ส่งออก");
    return;
  }

  const exportData = {
    version: "1.0",
    exportType: "ALL_TEMPLATES",
    exportedAt: new Date().toISOString(),
    templates: templates
  };

  const dateStr = new Date().toISOString().split('T')[0];
  downloadJsonFile(exportData, `FormTemplates_Backup_${dateStr}.json`);
}

function downloadJsonFile(dataObj, filename) {
  const jsonStr = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isTemplateContentEqual(tmplA, tmplB) {
  if (!tmplA || !tmplB) return false;
  if (tmplA.category !== tmplB.category) return false;
  if (tmplA.pdfDataUrl !== tmplB.pdfDataUrl) return false;

  const fieldsA = JSON.stringify(tmplA.fieldsSettings || []);
  const fieldsB = JSON.stringify(tmplB.fieldsSettings || []);
  if (fieldsA !== fieldsB) return false;

  const boxesA = JSON.stringify(tmplA.fieldBoxes || {});
  const boxesB = JSON.stringify(tmplB.fieldBoxes || {});
  if (boxesA !== boxesB) return false;

  const masterA = JSON.stringify(tmplA.masterBox || null);
  const masterB = JSON.stringify(tmplB.masterBox || null);
  if (masterA !== masterB) return false;

  return true;
}

function renderImportReviewModal() {
  let modal = document.getElementById("importReviewModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "importReviewModal";
    document.body.appendChild(modal);
  }

  modal.className =
    "fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xs hidden flex items-center justify-center p-4";
  modal.innerHTML = `
    <div class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      
      <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold shadow-xs">
            <i class="fa-solid fa-file-import"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-800">ตรวจสอบรายการแบบฟอร์มก่อนนำเข้า</h3>
            <p class="text-xs text-slate-500 font-medium">เลือกนำเข้าทั้งหมด หรือเลือกเฉพาะบางหมวดหมู่ได้ตามต้องการ</p>
          </div>
        </div>

        <button type="button" onclick="closeImportReviewModal()" class="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center transition-all cursor-pointer">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-4 border-b border-slate-100 bg-slate-50/80 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
        
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <input type="checkbox" id="selectAllImportChk" onchange="toggleSelectAllImport(this)" checked class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer">
            <span>เลือกทั้งหมด</span>
          </label>

          <span id="importSummaryBadge" class="text-[11px] px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-extrabold">
            รวม 0 รายการ
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-slate-500">กรองหมวดหมู่:</span>
          <select id="importCategoryFilter" onchange="filterImportReviewList()" class="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-2xs">
            <option value="ALL">แสดงทั้งหมด</option>
            <option value="Quotation">Quotation (ใบเสนอราคา)</option>
            <option value="Invoice">Invoice (ใบแจ้งหนี้)</option>
            <option value="Investment">Investment (การลงทุน)</option>
            <option value="Certificate">Certificate (เกียรติบัตร/ใบรับรอง)</option>
          </select>

          <button type="button" 
                  onclick="selectCategoryImportOnly()" 
                  class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs" 
                  title="เลือกเฉพาะรายการในหมวดหมู่ที่กรองอยู่">
            <i class="fa-solid fa-check-double text-amber-600"></i> เลือกเฉพาะหมวดหมู่นี้
          </button>
        </div>

      </div>

      <div class="p-5 flex-1 overflow-y-auto space-y-2.5" id="importReviewListContainer"></div>

      <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <button type="button" onclick="closeImportReviewModal()" class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
          ยกเลิกทั้งหมด
        </button>
        <button type="button" onclick="confirmImportSelectedTemplates()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer">
          <i class="fa-solid fa-circle-check"></i>
          <span id="btnConfirmImportText">ยืนยันการนำเข้าที่เลือก</span>
        </button>
      </div>

    </div>
  `;
}

function filterImportReviewList() {
  populateImportReviewList();
}

function selectCategoryImportOnly() {
  const selectedCategoryFilter = document.getElementById("importCategoryFilter")?.value || "ALL";
  const checkboxes = document.querySelectorAll(".import-item-chk");

  checkboxes.forEach((chk) => {
    const itemCategory = chk.getAttribute("data-category");
    if (selectedCategoryFilter === "ALL" || itemCategory === selectedCategoryFilter) {
      chk.checked = true;
    } else {
      chk.checked = false;
    }
  });

  updateImportSelectionCount();
}

async function importFormTemplates(input) {
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  try {
    const text = await file.text();
    const importedData = JSON.parse(text);

    let templatesToImport = null;

    if (importedData.templates && typeof importedData.templates === "object") {
      templatesToImport = importedData.templates;
    } else if (typeof importedData === "object" && !importedData.exportType) {
      templatesToImport = importedData;
    }

    if (!templatesToImport || Object.keys(templatesToImport).length === 0) {
      alert("ไฟล์ JSON ไม่ถูกต้อง หรือไม่มีข้อมูลแบบฟอร์ม");
      input.value = "";
      return;
    }

    pendingImportTemplates = templatesToImport;

    renderImportReviewModal();
    populateImportReviewList();
    document.getElementById("importReviewModal").classList.remove("hidden");

  } catch (err) {
    console.error("Import Error:", err);
    alert("เกิดข้อผิดพลาดในการอ่านไฟล์ JSON โปรดตรวจสอบความถูกต้องของไฟล์");
  } finally {
    input.value = "";
  }
}

function populateImportReviewList() {
  const container = document.getElementById("importReviewListContainer");
  const summaryBadge = document.getElementById("importSummaryBadge");
  const selectedCategoryFilter = document.getElementById("importCategoryFilter")?.value || "ALL";

  const TEMPLATES_KEY = "form_templates_data";
  const existingTemplates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  container.innerHTML = "";
  const names = Object.keys(pendingImportTemplates);

  let newCount = 0;
  let updateCount = 0;
  let duplicateCount = 0;
  let visibleCount = 0;

  names.forEach((name) => {
    const incomingTmpl = pendingImportTemplates[name];
    const category = incomingTmpl.category || "ไม่ระบุหมวดหมู่";

    if (selectedCategoryFilter !== "ALL" && category !== selectedCategoryFilter) {
      return;
    }

    visibleCount++;
    const existingTmpl = existingTemplates[name];

    let statusTag = "";
    let isChecked = true;

    if (!existingTmpl) {
      newCount++;
      statusTag = `<span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1"><i class="fa-solid fa-plus text-[9px]"></i> เพิ่มใหม่</span>`;
    } else {
      const isExactDuplicate = isTemplateContentEqual(existingTmpl, incomingTmpl);
      if (isExactDuplicate) {
        duplicateCount++;
        isChecked = false;
        statusTag = `<span class="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation text-[9px]"></i> ซ้ำกัน 100%</span>`;
      } else {
        updateCount++;
        statusTag = `<span class="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-extrabold flex items-center gap-1"><i class="fa-solid fa-pen-to-square text-[9px]"></i> อัปเดตทับรายการเดิม</span>`;
      }
    }

    const boxesCount = incomingTmpl.fieldBoxes ? Object.keys(incomingTmpl.fieldBoxes).length : 0;

    const itemCard = document.createElement("div");
    itemCard.className = "p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-200 transition-all import-card-item";
    itemCard.setAttribute("data-category", category);

    itemCard.innerHTML = `
      <div class="flex items-center gap-3">
        <input type="checkbox" 
               data-tmpl-name="${escapeHtml(name)}" 
               data-category="${escapeHtml(category)}" 
               ${isChecked ? "checked" : ""} 
               onchange="updateImportSelectionCount()" 
               class="import-item-chk w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0">
        <div>
          <div class="text-xs font-extrabold text-slate-800">${escapeHtml(name)}</div>
          <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span class="font-bold text-indigo-600">หมวดหมู่: ${escapeHtml(category)}</span>
            <span>•</span>
            <span><i class="fa-solid fa-vector-square text-slate-400"></i> ${boxesCount} กรอบพิกัด</span>
          </div>
        </div>
      </div>
      <div>
        ${statusTag}
      </div>
    `;

    container.appendChild(itemCard);
  });

  if (visibleCount === 0) {
    container.innerHTML = `<div class="text-center py-10 text-slate-400 text-xs font-bold">ไม่พบรายการแบบฟอร์มในหมวดหมู่นี้</div>`;
  }

  if (summaryBadge) {
    summaryBadge.textContent = `แสดง ${visibleCount} | เพิ่มใหม่ ${newCount} | อัปเดต ${updateCount} | ซ้ำ ${duplicateCount}`;
  }

  updateImportSelectionCount();
}

function toggleSelectAllImport(masterChk) {
  const checkboxes = document.querySelectorAll(".import-item-chk");
  checkboxes.forEach((chk) => {
    chk.checked = masterChk.checked;
  });

  updateImportSelectionCount();
}

function updateImportSelectionCount() {
  const selectedCount = document.querySelectorAll(".import-item-chk:checked").length;
  const btnText = document.getElementById("btnConfirmImportText");
  
  if (btnText) {
    btnText.textContent = `ยืนยันการนำเข้าที่เลือก (${selectedCount} รายการ)`;
  }
}

function confirmImportSelectedTemplates() {
  const checkboxes = document.querySelectorAll(".import-item-chk:checked");
  
  if (checkboxes.length === 0) {
    alert("โปรดเลือกอย่างน้อย 1 รายการเพื่อนำเข้า");
    return;
  }

  const TEMPLATES_KEY = "form_templates_data";
  const existingTemplates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  let importedCount = 0;

  checkboxes.forEach((chk) => {
    const tmplName = chk.getAttribute("data-tmpl-name");
    if (tmplName && pendingImportTemplates[tmplName]) {
      existingTemplates[tmplName] = pendingImportTemplates[tmplName];
      importedCount++;
    }
  });

  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(existingTemplates));

  alert(`นำเข้าแบบฟอร์มเรียบร้อยแล้ว จำนวน ${importedCount} รายการ`);

  closeImportReviewModal();

  renderFormTemplatesList();
  if (typeof refreshTemplateDropdown === "function") {
    refreshTemplateDropdown();
  }
}

function closeImportReviewModal() {
  const modal = document.getElementById("importReviewModal");
  if (modal) modal.classList.add("hidden");
  pendingImportTemplates = {};
}

function previewFormTemplate(name) {
  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");
  const template = templates[name];

  if (!template) return;

  document.getElementById("previewModalTitle").textContent = `ตัวอย่างแบบฟอร์ม: ${name}`;
  document.getElementById("previewModalCategory").textContent = `หมวดหมู่: ${template.category || "-"} (บันทึกเมื่อ: ${template.savedAt || "ไม่ระบุ"})`;

  renderPDFRealPreview(template);

  const fieldsContainer = document.getElementById("previewFieldsList");
  fieldsContainer.innerHTML = "";

  if (template.fieldsSettings && template.fieldsSettings.length > 0) {
    template.fieldsSettings.forEach((f) => {
      const fieldCard = document.createElement("div");
      fieldCard.className = "p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1";

      let modeText = "ลากคลุมข้อมูล";
      if (f.fieldType === "auto") modeText = "สกัดอัตโนมัติ";
      else if (f.fieldType === "number_strip_prefix") modeText = "สกัดเฉพาะตัวเลข";

      fieldCard.innerHTML = `
        <div class="flex items-center justify-between font-extrabold text-slate-800">
          <span>${escapeHtml(f.name)}</span>
          <span class="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">${modeText}</span>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          ${f.prefix ? `<span>Prefix: <strong class="text-slate-700">"${escapeHtml(f.prefix)}"</strong></span>` : ""}
          <span>Max Length: <strong class="text-slate-700">${f.maxLen || 50}</strong></span>
        </div>
      `;
      fieldsContainer.appendChild(fieldCard);
    });
  } else {
    fieldsContainer.innerHTML = `<div class="text-xs text-slate-400 italic">ไม่มีข้อมูลการตั้งค่าฟิลด์</div>`;
  }

  const boxesContainer = document.getElementById("previewBoxesList");
  boxesContainer.innerHTML = "";

  if (template.fieldBoxes && Object.keys(template.fieldBoxes).length > 0) {
    for (let fId in template.fieldBoxes) {
      const box = template.fieldBoxes[fId];
      if (box) {
        const boxCard = document.createElement("div");
        boxCard.className = "p-2 bg-amber-50/80 border border-amber-200 rounded-lg font-mono text-[10px] text-amber-900 flex justify-between items-center";
        boxCard.innerHTML = `
          <span class="font-bold text-amber-800 font-sans">${escapeHtml(fId)}</span>
          <span>หน้า ${box.pageNum} [X:${(box.pdfX * 100).toFixed(0)}%, Y:${(box.pdfY * 100).toFixed(0)}%]</span>
        `;
        boxesContainer.appendChild(boxCard);
      }
    }
  } else {
    boxesContainer.innerHTML = `<div class="text-xs text-slate-400 italic">ยังไม่ได้ลากกรอบตำแหน่ง</div>`;
  }

  document.getElementById("templatePreviewOverlay").classList.remove("hidden");
}

async function editFormTemplateDirectly(templateName) {
  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");
  const template = templates[templateName];

  if (!template) {
    alert("ไม่พบข้อมูลแบบฟอร์มแม่แบบนี้");
    return;
  }

  closeFormTemplatesModal();

  const uploadModal = document.getElementById("uploadModal");
  if (uploadModal && uploadModal.classList.contains("hidden")) {
    if (typeof openUploadModal === "function") {
      openUploadModal();
    }
  }

  const selector = document.getElementById("templateSelector");
  if (selector) {
    selector.value = templateName;
  }

  const newNameInput = document.getElementById("newTemplateName");
  if (newNameInput) {
    newNameInput.value = templateName;
  }

  if (template.category) {
    const categorySelect = document.getElementById("fileCategory");
    if (categorySelect) {
      categorySelect.value = template.category;
      onCategoryChanged();
    }
  }

  masterBox = template.masterBox ? JSON.parse(JSON.stringify(template.masterBox)) : null;
  fieldBoxes = template.fieldBoxes ? JSON.parse(JSON.stringify(template.fieldBoxes)) : {};

  if (template.fieldsSettings && Array.isArray(template.fieldsSettings)) {
    template.fieldsSettings.forEach((setting) => {
      const prefixInput = document.getElementById(`prefix-${setting.id}`);
      const maxLenInput = document.getElementById(`maxLen-${setting.id}`);

      if (prefixInput) prefixInput.value = setting.prefix || "";
      if (maxLenInput) maxLenInput.value = setting.maxLen || 50;
    });
  }

  if (template.pdfDataUrl) {
    try {
      showOcrLoading(true, "กำลังดึงไฟล์ PDF ของแม่แบบมาแสดงผล...");
      const response = await fetch(template.pdfDataUrl);
      const arrayBuffer = await response.arrayBuffer();
      await processPDFData(arrayBuffer, `[แม่แบบ] ${templateName}.pdf`);
    } catch (err) {
      console.error("Error loading PDF from template:", err);
      alert("เกิดข้อผิดพลาดในการโหลดไฟล์ PDF ของแม่แบบ");
    } finally {
      showOcrLoading(false);
    }
  } else {
    drawAllSelectionBoxes();
  }
}

function deleteFormTemplateFromManager(name) {
  if (confirm(`คุณต้องการลบฟอร์มแม่แบบ "${name}" ใช่หรือไม่?`)) {
    const TEMPLATES_KEY = "form_templates_data";
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

    delete templates[name];
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));

    if (typeof refreshTemplateDropdown === "function") {
      refreshTemplateDropdown();
    }
    renderFormTemplatesList();
  }
}

function renderExportSelectorModal() {
  let modal = document.getElementById("exportSelectorModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "exportSelectorModal";
    document.body.appendChild(modal);
  }

  modal.className =
    "fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-xs hidden flex items-center justify-center p-4";
  modal.innerHTML = `
    <div class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      
      <div class="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold shadow-xs">
            <i class="fa-solid fa-file-export"></i>
          </div>
          <div>
            <h3 class="text-base font-extrabold text-slate-800">เลือกรายการแบบฟอร์มที่ต้องการส่งออก (Export)</h3>
            <p class="text-xs text-slate-500 font-medium">เลือกส่งออกทั้งหมด หรือเลือกเฉพาะบางรายการ/ตามหมวดหมู่</p>
          </div>
        </div>

        <button type="button" onclick="closeExportSelectorModal()" class="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center transition-all cursor-pointer">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-4 border-b border-slate-100 bg-slate-50/80 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
        
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer select-none text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <input type="checkbox" id="selectAllExportChk" onchange="toggleSelectAllExport(this)" checked class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
            <span>เลือกทั้งหมด</span>
          </label>

          <span id="exportSummaryBadge" class="text-[11px] px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-extrabold">
            แสดง 0 รายการ
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-slate-500">กรองหมวดหมู่:</span>
          <select id="exportCategoryFilter" onchange="filterExportReviewList()" class="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer shadow-2xs">
            <option value="ALL">แสดงทั้งหมด</option>
            <option value="Quotation">Quotation (ใบเสนอราคา)</option>
            <option value="Invoice">Invoice (ใบแจ้งหนี้)</option>
            <option value="Investment">Investment (การลงทุน)</option>
            <option value="Certificate">Certificate (เกียรติบัตร/ใบรับรอง)</option>
          </select>

          <button type="button" 
                  onclick="selectCategoryExportOnly()" 
                  class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs" 
                  title="เลือกเฉพาะรายการในหมวดหมู่ที่กรองอยู่">
            <i class="fa-solid fa-check-double text-amber-600"></i> เลือกเฉพาะหมวดหมู่นี้
          </button>
        </div>

      </div>

      <div class="p-5 flex-1 overflow-y-auto space-y-2.5" id="exportReviewListContainer"></div>

      <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <button type="button" onclick="closeExportSelectorModal()" class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
          ยกเลิก
        </button>
        <button type="button" onclick="confirmExportSelectedTemplates()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95 cursor-pointer">
          <i class="fa-solid fa-download"></i>
          <span id="btnConfirmExportText">ยืนยันส่งออกที่เลือก (0 รายการ)</span>
        </button>
      </div>

    </div>
  `;
}

function openExportSelectorModal() {
  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  if (Object.keys(templates).length === 0) {
    alert("ไม่มีแบบฟอร์มให้ส่งออก");
    return;
  }

  renderExportSelectorModal();
  populateExportReviewList();
  document.getElementById("exportSelectorModal").classList.remove("hidden");
}

function closeExportSelectorModal() {
  const modal = document.getElementById("exportSelectorModal");
  if (modal) modal.classList.add("hidden");
}

function populateExportReviewList() {
  const container = document.getElementById("exportReviewListContainer");
  const summaryBadge = document.getElementById("exportSummaryBadge");
  const selectedCategoryFilter = document.getElementById("exportCategoryFilter")?.value || "ALL";

  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  container.innerHTML = "";
  const names = Object.keys(templates);

  let visibleCount = 0;

  names.forEach((name) => {
    const tmpl = templates[name];
    const category = tmpl.category || "ไม่ระบุหมวดหมู่";

    if (selectedCategoryFilter !== "ALL" && category !== selectedCategoryFilter) {
      return;
    }

    visibleCount++;
    const boxesCount = tmpl.fieldBoxes ? Object.keys(tmpl.fieldBoxes).length : 0;

    const itemCard = document.createElement("div");
    itemCard.className = "p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-emerald-200 transition-all";

    itemCard.innerHTML = `
      <div class="flex items-center gap-3">
        <input type="checkbox" 
               data-tmpl-name="${escapeHtml(name)}" 
               data-category="${escapeHtml(category)}" 
               checked 
               onchange="updateExportSelectionCount()" 
               class="export-item-chk w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0">
        <div>
          <div class="text-xs font-extrabold text-slate-800">${escapeHtml(name)}</div>
          <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span class="font-bold text-emerald-700">หมวดหมู่: ${escapeHtml(category)}</span>
            <span>•</span>
            <span><i class="fa-solid fa-vector-square text-slate-400"></i> ${boxesCount} กรอบพิกัด</span>
          </div>
        </div>
      </div>
      <div>
        <span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">บันทึกเมื่อ: ${tmpl.savedAt || "ไม่ระบุ"}</span>
      </div>
    `;

    container.appendChild(itemCard);
  });

  if (visibleCount === 0) {
    container.innerHTML = `<div class="text-center py-10 text-slate-400 text-xs font-bold">ไม่พบรายการแบบฟอร์มในหมวดหมู่นี้</div>`;
  }

  if (summaryBadge) {
    summaryBadge.textContent = `แสดง ${visibleCount} รายการ`;
  }

  updateExportSelectionCount();
}

function filterExportReviewList() {
  populateExportReviewList();
}

function selectCategoryExportOnly() {
  const selectedCategoryFilter = document.getElementById("exportCategoryFilter")?.value || "ALL";
  const checkboxes = document.querySelectorAll(".export-item-chk");

  checkboxes.forEach((chk) => {
    const itemCategory = chk.getAttribute("data-category");
    if (selectedCategoryFilter === "ALL" || itemCategory === selectedCategoryFilter) {
      chk.checked = true;
    } else {
      chk.checked = false;
    }
  });

  updateExportSelectionCount();
}

function toggleSelectAllExport(masterChk) {
  const checkboxes = document.querySelectorAll(".export-item-chk");
  checkboxes.forEach((chk) => {
    chk.checked = masterChk.checked;
  });

  updateExportSelectionCount();
}

function updateExportSelectionCount() {
  const selectedCount = document.querySelectorAll(".export-item-chk:checked").length;
  const btnText = document.getElementById("btnConfirmExportText");
  
  if (btnText) {
    btnText.textContent = `ยืนยันส่งออกที่เลือก (${selectedCount} รายการ)`;
  }
}

function confirmExportSelectedTemplates() {
  const checkboxes = document.querySelectorAll(".export-item-chk:checked");
  
  if (checkboxes.length === 0) {
    alert("โปรดเลือกอย่างน้อย 1 รายการเพื่อส่งออก");
    return;
  }

  const TEMPLATES_KEY = "form_templates_data";
  const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "{}");

  const exportedTemplates = {};

  checkboxes.forEach((chk) => {
    const tmplName = chk.getAttribute("data-tmpl-name");
    if (tmplName && templates[tmplName]) {
      exportedTemplates[tmplName] = templates[tmplName];
    }
  });

  const exportData = {
    version: "1.0",
    exportType: "SELECTED_TEMPLATES",
    exportedAt: new Date().toISOString(),
    templates: exportedTemplates
  };

  const dateStr = new Date().toISOString().split('T')[0];
  downloadJsonFile(exportData, `FormTemplates_Export_${dateStr}.json`);

  closeExportSelectorModal();
}