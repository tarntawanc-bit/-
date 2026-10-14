let currentViewerDocId = null;

function renderViewerModal() {
  const container = document.getElementById('viewerModal');
  container.innerHTML = `
    <div class="bg-white rounded-3xl border border-slate-200 shadow-2xl flex-1 flex flex-col overflow-hidden max-w-6xl w-full mx-auto">
      <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <span id="viewerCategoryBadge" class="px-3 py-1 rounded-lg text-xs font-extrabold uppercase">Category</span>
          <h3 id="viewerTitle" class="text-base font-bold text-slate-800 truncate">Title</h3>
        </div>

        <div class="flex items-center justify-end gap-2">
          <button id="viewerEditBtn" class="hidden px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all flex items-center gap-2 border border-amber-200 shadow-xs">
            <i class="fa-solid fa-pen-to-square"></i> แก้ไขข้อมูล
          </button>
          <button id="viewerPrintBtn" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-2">
            <i class="fa-solid fa-print"></i> พิมพ์
          </button>
          <button id="viewerDownloadBtn" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xs">
            <i class="fa-solid fa-download"></i> ดาวน์โหลด
          </button>
          <button onclick="closeViewerModal()" class="w-9 h-9 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all ml-1">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100">
        <div class="flex-1 h-full bg-slate-200 relative">
          <iframe id="pdfFrame" class="w-full h-full border-0"></iframe>
        </div>

        <div class="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col space-y-4">
          <h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">รายละเอียดเอกสาร</h4>
          
          <div class="space-y-3.5 text-xs">
            <div class="py-2 border-b border-slate-100">
              <div class="text-slate-400 text-[10px] font-bold uppercase">1. เลขเอกสาร</div>
              <div id="viewerDocNum" class="font-bold text-indigo-600 text-sm mt-0.5">-</div>
            </div>
            <div class="py-2 border-b border-slate-100">
              <div class="text-slate-400 text-[10px] font-bold uppercase">2. ชื่อบริษัท</div>
              <div id="viewerCompany" class="font-bold text-emerald-600 text-sm mt-0.5">-</div>
            </div>
            <div class="py-2 border-b border-slate-100">
              <div class="text-slate-400 text-[10px] font-bold uppercase">3. รายละเอียดสินค้า</div>
              <div id="viewerProduct" class="font-medium text-slate-700 text-xs mt-0.5">-</div>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">ชื่อไฟล์เดิม:</span>
              <span id="viewerOriginalName" class="font-medium text-slate-800 truncate max-w-[140px]">-</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">ขนาดไฟล์:</span>
              <span id="viewerFileSize" class="font-medium text-slate-800">-</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">วันที่บันทึก:</span>
              <span id="viewerDate" class="font-medium text-slate-800">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openViewerModal(id) {
  currentViewerDocId = id;
  getDocById(id, doc => {
    const blobUrl = URL.createObjectURL(doc.fileBlob);
    document.getElementById('pdfFrame').src = blobUrl;
    document.getElementById('viewerTitle').textContent = doc.docNumber || doc.title;
    document.getElementById('viewerDocNum').textContent = doc.docNumber || '-';
    document.getElementById('viewerCompany').textContent = doc.companyName || '-';
    document.getElementById('viewerProduct').textContent = doc.productDetail || '-';
    document.getElementById('viewerCategoryBadge').textContent = doc.category;
    document.getElementById('viewerCategoryBadge').className = `px-3 py-1 rounded-lg text-xs font-extrabold uppercase ${getCategoryStyle(doc.category)}`;
    document.getElementById('viewerOriginalName').textContent = doc.originalName;
    document.getElementById('viewerFileSize').textContent = doc.formattedSize;
    document.getElementById('viewerDate').textContent = doc.formattedDate;

    const editBtn = document.getElementById('viewerEditBtn');
    const canManageDocs = currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR';

    if (canManageDocs) {
      editBtn.classList.remove('hidden');
      editBtn.onclick = () => {
        closeViewerModal();
        openEditModal(id);
      };
    } else {
      editBtn.classList.add('hidden');
    }

    document.getElementById('viewerDownloadBtn').onclick = () => downloadDoc(id);
    document.getElementById('viewerPrintBtn').onclick = () => {
      const win = window.open(blobUrl, '_blank');
      win.print();
    };

    document.getElementById('viewerModal').classList.remove('hidden');
  });
}

function closeViewerModal() {
  document.getElementById('viewerModal').classList.add('hidden');
  document.getElementById('pdfFrame').src = '';
  currentViewerDocId = null;
}