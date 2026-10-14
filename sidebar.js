function renderSidebarComponent() {
    const container = document.getElementById('sidebarComponent');
    container.innerHTML = `
    <div>
      <div class="p-4 border-b border-slate-800 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 shrink-0">
          <i class="fa-solid fa-box-archive"></i>
        </div>
        <div class="min-w-0">
          <h1 class="font-bold text-sm text-white leading-tight truncate">Apex Vault</h1>
          <p class="text-[10px] text-slate-400 truncate">Thai OCR & Custom Max Engine</p>
        </div>
      </div>

      <nav class="p-3 space-y-1">
        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-1">เมนูหลัก</div>
        
        <button onclick="filterCategory('ALL')" id="side-nav-ALL" class="side-nav-btn active w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 transition-all shadow-xs">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-layer-group w-5 text-center text-base"></i>
            <span>เอกสารทั้งหมด</span>
          </div>
          <span id="side-count-ALL" class="px-2.5 py-0.5 rounded-md text-xs bg-indigo-700/80">0</span>
        </button>

        <button id="adminUserNavBtn" onclick="openUserManagementModal()" class="hidden w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-slate-800/80 transition-all">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-users-gear w-5 text-center text-base"></i>
            <span>จัดการผู้ใช้งาน</span>
          </div>
          <span class="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">Admin Only</span>
        </button>

        <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mt-4 mb-1">หมวดหมู่เอกสาร</div>

        <button onclick="filterCategory('Quotation')" id="side-nav-Quotation" class="side-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-file-invoice-dollar text-indigo-400 w-5 text-center text-base"></i>
            <span>Quotation</span>
          </div>
          <span id="side-count-Quotation" class="px-2.5 py-0.5 rounded-md text-xs bg-slate-800 text-slate-400">0</span>
        </button>

        <button onclick="filterCategory('Invoice')" id="side-nav-Invoice" class="side-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-receipt text-emerald-400 w-5 text-center text-base"></i>
            <span>Invoice</span>
          </div>
          <span id="side-count-Invoice" class="px-2.5 py-0.5 rounded-md text-xs bg-slate-800 text-slate-400">0</span>
        </button>

        <button onclick="filterCategory('Investment')" id="side-nav-Investment" class="side-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-chart-line text-amber-400 w-5 text-center text-base"></i>
            <span>Investment</span>
          </div>
          <span id="side-count-Investment" class="px-2.5 py-0.5 rounded-md text-xs bg-slate-800 text-slate-400">0</span>
        </button>

<button onclick="filterCategory('Certificate')" id="side-nav-Certificate" class="side-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all">
  <div class="flex items-center gap-3">
    <i class="fa-solid fa-certificate text-purple-400 w-5 text-center text-base"></i>
    <span>Certificate</span>
  </div>
  <span id="side-count-Certificate" class="px-2.5 py-0.5 rounded-md text-xs bg-slate-800 text-slate-400">0</span>
</button>
      </nav>
    </div>

    <div class="p-3.5 m-3 bg-slate-800/60 border border-slate-700/50 rounded-xl space-y-1.5">
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-400"><i class="fa-solid fa-hard-drive me-1.5 text-slate-400"></i> Local Storage</span>
        <span id="sidebarStorageText" class="font-bold text-white">0.0 MB</span>
      </div>
      <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
        <div id="storageProgressBar" class="bg-indigo-500 h-full w-0 transition-all duration-300"></div>
      </div>
      <p class="text-[10px] text-slate-400">IndexedDB Engine Active</p>
    </div>
  `;
}