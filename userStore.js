function initUsersSystem() {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    const nowStr = getFormattedDateTime();
    const defaultAdmin = [{
      id: Date.now(),
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
      fullName: 'System Administrator',
      employeeId: 'EMP001',
      deviceName: 'Server-PC',
      department: 'IT Systems',
      plant: 'Headquarters',
      createDate: nowStr,
      updateDate: nowStr
    }];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultAdmin));
  }
}

function exportUsersToExcel() {
  closeAllDropdowns();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const exportData = users.map(u => ({
    'Username': u.username || '',
    'Role': u.role || 'USER',
    'Full Name': u.fullName || '',
    'Employee ID': u.employeeId || '',
    'Department': u.department || '',
    'Plant': u.plant || '',
    'Device Name': u.deviceName || '',
    'Create Date': u.createDate || '-',
    'Update Date': u.updateDate || '-'
  }));

  const exportDate = getExportDateString();
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  XLSX.writeFile(workbook, `Employee List Report ${exportDate}.xlsx`);
}

function exportUsersToPDF() {
  closeAllDropdowns();
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const exportDateStr = getFormattedDateTime(); // เช่น "11/10/2569 19:23"
  const totalUsers = users.length;
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ 
    orientation: 'landscape', 
    unit: 'mm', 
    format: 'a4' 
  });

  // --- 1. Document Header (ส่วนหัวเอกสาร) ---
  // แถบสี Accent ตกแต่งด้านบนสุด
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 297, 6, 'F');

  // หัวข้อรายงานหลัก
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFont("helvetica", "bold");
  doc.text("EMPLOYEE & ACCESS CONTROL REPORT", 14, 18);

  // คำอธิบายย่อย
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Apex Vault Management System - User Accounts & Role Permissions", 14, 23);

  // --- 2. Summary Badge & Export Metadata (กล่องข้อมูลวันที่และสรุป) ---
  // กล่องด้านขวาแสดงวันที่ส่งออกข้อมูล และจำนวนพนักงานทั้งหมด
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(205, 10, 78, 16, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // Indigo Accent Text
  doc.text("Exported On:", 209, 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`${exportDateStr} hrs.`, 232, 16);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text("Total Users:", 209, 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`${totalUsers} Accounts`, 232, 22);

  // เส้นแบ่งโซน Header
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 29, 283, 29);

  // --- 3. Data Table (ตารางข้อมูลพนักงาน) ---
  const tableColumn = [
    "#", 
    "Username", 
    "Full Name", 
    "Role", 
    "Emp ID", 
    "Department", 
    "Plant / Branch", 
    "Device Name", 
    "Created Date"
  ];

  const tableRows = users.map((u, index) => [
    index + 1,
    u.username || '-',
    u.fullName || '-',
    (u.role || 'USER').toUpperCase(),
    u.employeeId || '-',
    u.department || '-',
    u.plant || '-',
    u.deviceName || '-',
    u.createDate || '-'
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 33,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],       // Slate 700
      lineColor: [241, 245, 249],   // Slate 100
      lineWidth: 0.2,
      font: "helvetica"
    },
    headStyles: {
      fillColor: [79, 70, 229],     // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]    // Slate 50 สลับสีแถวเพื่อดูง่าย
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 }, // ลำดับ #
      1: { fontStyle: 'bold', textColor: [79, 70, 229] }, // Username ไฮไลท์สีน้ำเงิน
      3: { halign: 'center', fontStyle: 'bold' }, // Role
      4: { halign: 'center' }, // Emp ID
      8: { halign: 'center', cellWidth: 28 } // Created Date
    },
    didParseCell: function(data) {
      // ตกแต่งสีตัวอักษรของ Role ให้มองง่ายขึ้น
      if (data.section === 'body' && data.column.index === 3) {
        const role = data.cell.raw;
        if (role === 'ADMIN') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber 700
        } else if (role === 'EDITOR') {
          data.cell.styles.textColor = [29, 78, 216]; // Blue 700
        }
      }
    },
    didDrawPage: function (data) {
      // --- 4. Footer (ส่วนท้ายของทุกหน้า) ---
      const pageCount = doc.internal.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate 400

      // ข้อความลิขสิทธิ์ / นโยบายความปลอดภัย
      doc.text("CONFIDENTIAL - Apex Vault Internal Document System", 14, pageHeight - 8);
      
      // เลขหน้า (Page X of Y)
      const pageText = `Page ${data.pageNumber} of ${pageCount}`;
      doc.text(pageText, 283, pageHeight - 8, { align: 'right' });
    }
  });

  // ส่งออกไฟล์ PDF
  const fileDateStr = getExportDateString();
  doc.save(`Employee_Report_${fileDateStr}.pdf`);
}