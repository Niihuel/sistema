import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Temporary workaround for jspdf-autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Import jspdf-autotable plugin
import 'jspdf-autotable';

export interface ExportData {
  headers: string[];
  data: (string | number)[][];
  filename: string;
}

export function exportToExcel(exportData: ExportData): void {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data with headers
    const wsData = [exportData.headers, ...exportData.data];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Save the file
    XLSX.writeFile(wb, `${exportData.filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
}

export function exportToPDF(exportData: ExportData): void {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(exportData.filename, 20, 20);
    
    // Add table with autoTable
    doc.autoTable({
      head: [exportData.headers],
      body: exportData.data,
      startY: 30,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Save the PDF
    doc.save(`${exportData.filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF');
  }
}

// Helper function to format data for export
export function formatDataForExport<T extends Record<string, any>>(
  data: T[],
  columnMap: Record<keyof T, string>
): ExportData {
  const headers = Object.values(columnMap);
  const rows = data.map(item => 
    Object.keys(columnMap).map(key => {
      const value = item[key];
      // Handle different data types
      if (value === null || value === undefined) return '';
      if (typeof value === 'object' && value.firstName && value.lastName) {
        return `${value.firstName} ${value.lastName}`;
      }
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      if (value instanceof Date) return value.toLocaleDateString('es-ES');
      return String(value);
    })
  );
  
  return {
    headers,
    data: rows,
    filename: 'export'
  };
}