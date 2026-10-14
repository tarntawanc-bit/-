pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['Prompt', 'sans-serif'] },
      colors: {
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' }
      }
    }
  }
};

const DB_NAME = 'ApexSidebarVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_vault';
const USERS_KEY = 'ApexVault_Users_List';
const CURRENT_USER_KEY = 'ApexVault_SessionUser';
const TEMPLATES_KEY = 'ApexVault_FormTemplates';
const IMPORT_THEME_KEY = 'ApexVault_ImportModalTheme';

function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleDateString('th-TH', { 
    day: '2-digit', month: '2-digit', year: '2-digit' 
  }) + ' ' + now.toLocaleTimeString('th-TH', { 
    hour: '2-digit', minute: '2-digit' 
  });
}

function getExportDateString() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearTH = now.getFullYear() + 543;
  return `${day}-${month}-${yearTH}`;
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

// เพิ่ม Key ใน config.js
const CUSTOM_FIELDS_KEY = 'ApexVault_CustomCategoryFields';

// ฟังก์ชันดึง/ตั้งค่าเริ่มต้น Custom Fields แยกตามหมวดหมู่
function getDefaultCategoryFields() {
  const saved = localStorage.getItem(CUSTOM_FIELDS_KEY);
  if (saved) return JSON.parse(saved);

  // ค่าเริ่มต้นตั้งต้นสำหรับ 4 หมวดหมู่
  const defaultFields = {
    Quotation: [
      { id: 'field_1', name: 'เลขเอกสาร', maxLen: 20, prefix: '30000', color: 'indigo' },
      { id: 'field_2', name: 'ชื่อบริษัท', maxLen: 50, prefix: '', color: 'emerald' },
      { id: 'field_3', name: 'รายละเอียด', maxLen: 100, prefix: '', color: 'amber' }
    ],
    Invoice: [
      { id: 'field_1', name: 'เลขเอกสาร', maxLen: 20, prefix: '30000', color: 'indigo' },
      { id: 'field_2', name: 'ชื่อบริษัท', maxLen: 50, prefix: '', color: 'emerald' },
      { id: 'field_3', name: 'รายละเอียด', maxLen: 100, prefix: '', color: 'amber' }
    ],
    Investment: [
      { id: 'field_1', name: 'เลขเอกสาร', maxLen: 20, prefix: '30000', color: 'indigo' },
      { id: 'field_2', name: 'ชื่อบริษัท', maxLen: 50, prefix: '', color: 'emerald' },
      { id: 'field_3', name: 'รายละเอียด', maxLen: 100, prefix: '', color: 'amber' }
    ],
    Certificate: [
      { id: 'field_1', name: 'เลขเอกสาร', maxLen: 20, prefix: '30000', color: 'indigo' },
      { id: 'field_2', name: 'ชื่อบริษัท', maxLen: 50, prefix: '', color: 'emerald' },
      { id: 'field_3', name: 'รายละเอียด', maxLen: 100, prefix: '', color: 'amber' }
    ]
  };

  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(defaultFields));
  return defaultFields;
}