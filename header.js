function renderHeaderComponent() {
  const container = document.getElementById('headerComponent');
  container.innerHTML = `
    <div class="flex items-center gap-2">
      <h1 id="currentCategoryTitle" class="text-base font-bold text-slate-900 leading-none">เอกสารทั้งหมด</h1>
      <span id="filteredDocCount" class="px-3 py-1 rounded-xl text-base font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/80 leading-none">0 รายการ</span>
    </div>

    <div class="flex items-center gap-3">
      <button id="docUploadBtn" onclick="openUploadModal()" class="hidden bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95">
        <i class="fa-solid fa-cloud-arrow-up text-base"></i>
        <span>นำเข้าไฟล์ PDF</span>
      </button>

      <div class="flex items-center gap-3 pl-3 border-l border-slate-200">
        <div class="flex items-center gap-2">
          <div id="currentUserFullName" class="text-xs font-bold text-slate-800">Name</div>
          <span id="currentUserRoleBadge" class="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">User</span>
        </div>
        <button onclick="handleLogout()" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-all border border-slate-200" title="ออกจากระบบ">
          <i class="fa-solid fa-right-from-bracket text-base"></i>
        </button>
      </div>
    </div>
  `;
}