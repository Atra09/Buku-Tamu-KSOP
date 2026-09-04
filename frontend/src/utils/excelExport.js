import * as XLSX from 'xlsx-js-style';

/**
 * Export visitor data array to a beautifully styled Excel (.xlsx) file
 * complete with colored header blocks, grid cell borders, zebra rows,
 * and custom column widths.
 * 
 * @param {Array} dataList - Array of visitor objects from backend/state
 * @param {String} reportTitle - Report title (e.g. 'Laporan Kunjungan Tamu September 2026')
 * @param {String} fileNamePrefix - Prefix for file download (e.g. 'Laporan_Kunjungan_September_2026')
 */
export const exportTamuToExcel = (dataList = [], reportTitle = 'Laporan Kunjungan Tamu', fileNamePrefix = 'Laporan_Kunjungan') => {
  if (!dataList || dataList.length === 0) {
    alert('Tidak ada data kunjungan tamu untuk diexport!');
    return false;
  }

  // 1. Build Header Title Rows (KSOP Banner)
  const sheetData = [
    ['SISTEM INFORMASI BUKU TAMU TERINTEGRASI (SI-TAMU)'],
    ['KANTOR KESYAHBANDARAN DAN OTORITAS PELABUHAN (KSOP)'],
    [`PERIODE LAPORAN: ${reportTitle.toUpperCase()}`],
    [`TANGGAL EXPORT: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
    [], // Blank spacing row (Row 5)
    // 2. Table Column Headers (Row 6)
    [
      'NO',
      'NO. REGISTRASI',
      'TANGGAL DATANG',
      'JAM DATANG',
      'TANGGAL KELUAR',
      'JAM KELUAR',
      'NAMA TAMU',
      'JENIS KELAMIN',
      'NO. TELEPON',
      'KATEGORI ASAL',
      'ASAL INSTANSI / PERUSAHAAN',
      'ALAMAT DETAIL',
      'BERTEMU (TUJUAN)',
      'KEPERLUAN / CATATAN',
      'LOKASI REGISTRASI (REAL)',
      'STATUS KUNJUNGAN'
    ]
  ];

  // 3. Append Data Rows (Row 7 onwards)
  dataList.forEach((g, index) => {
    sheetData.push([
      index + 1,
      g.no_reg || '-',
      g.tanggal || '-',
      g.jam || '-',
      g.tanggal_keluar || '-',
      g.jam_keluar || '-',
      g.nama || '-',
      g.jenis_kelamin || '-',
      g.no_telpon || '-',
      g.kategori_asal || '-',
      g.asal_instansi || '-',
      g.alamat || '-',
      g.bertemu || '-',
      g.keperluan || '-',
      g.lokasi || 'Lokasi Tidak Terdeteksi',
      g.status || 'Berkunjung'
    ]);
  });

  // 4. Append Summary Footer Row
  sheetData.push([]);
  const summaryRowIndex = sheetData.length;
  sheetData.push(['TOTAL KUNJUNGAN TAMU TERDATA:', dataList.length]);

  // Create Worksheet from AOA
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Define Borders
  const borderThin = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } }
  };

  const borderHeader = {
    top: { style: 'medium', color: { rgb: '0284C7' } },
    bottom: { style: 'medium', color: { rgb: '0284C7' } },
    left: { style: 'thin', color: { rgb: '0369A1' } },
    right: { style: 'thin', color: { rgb: '0369A1' } }
  };

  // Styles definition
  const styleTitleMain = {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '0F172A' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };

  const styleSubTitle = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0284C7' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };

  const styleMetaInfo = {
    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '334155' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };

  const styleTableHeader = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } }, // Dark Navy Blue background
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderHeader
  };

  // Apply Styles to Banner Headers (Rows 0-3)
  const setCell = (cellRef, style) => {
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = style;
    }
  };

  setCell('A1', styleTitleMain);
  setCell('A2', styleSubTitle);
  setCell('A3', styleMetaInfo);
  setCell('A4', { font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '64748B' } } });

  // Column Center Alignment Map (0-indexed column numbers)
  const centerCols = new Set([0, 1, 2, 3, 4, 5, 7, 8, 15]);

  // Apply Styles to Table Header Row (Row index 5 -> Excel Row 6)
  const numCols = 16;
  for (let col = 0; col < numCols; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 5, c: col });
    setCell(cellRef, styleTableHeader);
  }

  // Apply Styles to Data Rows (Row index 6 to 6 + dataList.length - 1)
  const startRow = 6;
  const endRow = startRow + dataList.length;

  for (let r = startRow; r < endRow; r++) {
    const isEven = (r - startRow) % 2 === 0;
    const bgHex = isEven ? 'FFFFFF' : 'F8FAFC'; // Clean zebra striping

    for (let c = 0; c < numCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (worksheet[cellRef]) {
        const isCenter = centerCols.has(c);
        worksheet[cellRef].s = {
          font: { name: 'Calibri', sz: 10, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: bgHex } },
          alignment: { 
            horizontal: isCenter ? 'center' : 'left', 
            vertical: 'center' 
          },
          border: borderThin
        };
      }
    }
  }

  // Apply Styles to Summary Footer Row
  const summaryR = summaryRowIndex - 1;
  const summaryLabelCell = XLSX.utils.encode_cell({ r: summaryR, c: 0 });
  const summaryValueCell = XLSX.utils.encode_cell({ r: summaryR, c: 1 });

  if (worksheet[summaryLabelCell]) {
    worksheet[summaryLabelCell].s = {
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0369A1' } },
      fill: { fgColor: { rgb: 'E0F2FE' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderThin
    };
  }
  if (worksheet[summaryValueCell]) {
    worksheet[summaryValueCell].s = {
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0369A1' } },
      fill: { fgColor: { rgb: 'E0F2FE' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderThin
    };
  }

  // Set Custom Column Widths (in characters)
  worksheet['!cols'] = [
    { wch: 6 },   // NO
    { wch: 22 },  // NO. REGISTRASI
    { wch: 16 },  // TANGGAL DATANG
    { wch: 14 },  // JAM DATANG
    { wch: 16 },  // TANGGAL KELUAR
    { wch: 14 },  // JAM KELUAR
    { wch: 26 },  // NAMA TAMU
    { wch: 16 },  // JENIS KELAMIN
    { wch: 18 },  // NO. TELEPON
    { wch: 18 },  // KATEGORI ASAL
    { wch: 32 },  // ASAL INSTANSI / PERUSAHAAN
    { wch: 35 },  // ALAMAT DETAIL
    { wch: 30 },  // BERTEMU (TUJUAN)
    { wch: 38 },  // KEPERLUAN / CATATAN
    { wch: 45 },  // LOKASI REGISTRASI
    { wch: 18 }   // STATUS KUNJUNGAN
  ];

  // Set Row Heights
  worksheet['!rows'] = [
    { hpt: 22 }, // Title
    { hpt: 18 }, // Subtitle
    { hpt: 16 }, // Meta info
    { hpt: 15 }, // Export date
    { hpt: 10 }, // Blank
    { hpt: 26 }, // Header Row
  ];

  // Merge title banner cells across columns A to P for clean appearance
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } },
    { s: { r: summaryR, c: 0 }, e: { r: summaryR, c: 1 } }
  ];

  // Create Workbook & Write File
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Tamu KSOP');

  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStamp}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
  return true;
};
