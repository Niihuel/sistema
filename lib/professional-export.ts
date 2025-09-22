import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Corporate colors matching Pretensa logo
const CORPORATE_COLORS = {
  primary: '#1e5aa8', // Pretensa blue
  secondary: '#dc2626', // Pretensa red accent
  accent: '#059669', // Success green
  warning: '#d97706', // Warning orange
  error: '#dc2626', // Error red
  light: '#f8fafc', // Light background
  dark: '#1f2937', // Dark text
  white: '#ffffff',
  pretensaBlue: '#1e5aa8',
  pretensaRed: '#dc2626'
};

export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  align?: 'left' | 'center' | 'right';
}

export interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string; // Base64 or URL
  };
  metadata?: {
    author?: string;
    department?: string;
    description?: string;
    keywords?: string[];
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    headerColor?: string;
  };
}

// Professional Excel Export with ExcelJS
export async function exportToProfessionalExcel(options: ExportOptions): Promise<{ success: boolean; message: string }> {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook metadata
    workbook.creator = options.metadata?.author || 'Sistema Pretensa & Paschini';
    workbook.lastModifiedBy = options.metadata?.author || 'Sistema Pretensa & Paschini';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.description = options.metadata?.description || options.title;
    workbook.subject = options.title;
    workbook.keywords = options.metadata?.keywords?.join(', ') || 'reporte,datos,sistemas';
    workbook.category = options.metadata?.department || 'Sistemas';

    const worksheet = workbook.addWorksheet(options.title, {
      properties: {
        tabColor: { argb: options.branding?.primaryColor?.replace('#', 'FF') || 'FF1e40af' }
      },
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        margins: {
          left: 0.7, right: 0.7, top: 0.75, bottom: 0.75,
          header: 0.3, footer: 0.3
        }
      }
    });

    let currentRow = 1;

    // Company Header Section
    if (options.companyInfo) {
      // Company name
      worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + options.columns.length - 1)}${currentRow}`);
      const companyCell = worksheet.getCell(`A${currentRow}`);
      companyCell.value = options.companyInfo.name;
      companyCell.font = { 
        size: 18, 
        bold: true, 
        color: { argb: options.branding?.primaryColor?.replace('#', 'FF') || 'FF1e40af' }
      };
      companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      companyCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
      worksheet.getRow(currentRow).height = 30;
      currentRow++;

      // Company details
      if (options.companyInfo.address || options.companyInfo.phone || options.companyInfo.email) {
        const details = [
          options.companyInfo.address,
          options.companyInfo.phone,
          options.companyInfo.email,
          options.companyInfo.website
        ].filter(Boolean).join(' | ');
        
        worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + options.columns.length - 1)}${currentRow}`);
        const detailsCell = worksheet.getCell(`A${currentRow}`);
        detailsCell.value = details;
        detailsCell.font = { size: 10, color: { argb: 'FF6B7280' } };
        detailsCell.alignment = { horizontal: 'center', vertical: 'middle' };
        currentRow++;
      }
      currentRow++; // Space
    }

    // Report Title Section
    worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + options.columns.length - 1)}${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = options.title;
    titleCell.font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FF1F2937' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.branding?.headerColor?.replace('#', 'FF') || 'FFE5E7EB' }
    };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Subtitle
    if (options.subtitle) {
      worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + options.columns.length - 1)}${currentRow}`);
      const subtitleCell = worksheet.getCell(`A${currentRow}`);
      subtitleCell.value = options.subtitle;
      subtitleCell.font = { size: 12, italic: true, color: { argb: 'FF6B7280' } };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow++;
    }

    // Report metadata
    worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + options.columns.length - 1)}${currentRow}`);
    const metaCell = worksheet.getCell(`A${currentRow}`);
    metaCell.value = `Generado el ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} | Total de registros: ${options.data.length}`;
    metaCell.font = { size: 10, color: { argb: 'FF9CA3AF' } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2; // Space

    // Headers with professional styling
    const headerRow = worksheet.getRow(currentRow);
    options.columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = column.label;
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: options.branding?.primaryColor?.replace('#', 'FF') || 'FF1e40af' }
      };
      cell.alignment = { 
        horizontal: column.align || 'left', 
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
      
      // Set column width - intelligent calculation to prevent truncation
      const headerLength = column.label.length;
      const maxDataLength = Math.max(...options.data.map(row => {
        let cellValue = row[column.key] || '';
        
        // Handle different data types properly for width calculation
        if (column.format === 'date' && cellValue) {
          cellValue = new Date(cellValue).toLocaleDateString('es-ES');
        } else if (column.format === 'currency' && cellValue) {
          cellValue = `$${Number(cellValue).toLocaleString('es-ES')}`;
        } else if (column.format === 'number' && cellValue) {
          cellValue = Number(cellValue).toLocaleString('es-ES');
        }
        
        return String(cellValue).length;
      }));
      
      // Calculate optimal width with padding for readability
      const optimalWidth = Math.max(
        headerLength + 4,  // Header with extra padding
        maxDataLength + 4, // Content with extra padding
        12  // Minimum readable width
      );
      
      // Set reasonable limits: minimum 12, maximum 60 characters
      worksheet.getColumn(index + 1).width = column.width || Math.min(Math.max(optimalWidth, 12), 60);
    });
    headerRow.height = 20;
    currentRow++;

    // Data rows with alternating colors
    options.data.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow(currentRow + rowIndex);
      const isEvenRow = rowIndex % 2 === 0;
      
      options.columns.forEach((column, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        let value = row[column.key];
        
        // Format value based on column type
        switch (column.format) {
          case 'date':
            if (value) {
              // Ensure consistent date formatting as DD/MM/YYYY without time
              const dateObj = new Date(value);
              if (!isNaN(dateObj.getTime())) {
                value = dateObj.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                // For Excel, keep as text to ensure proper formatting
              } else {
                value = String(value);
              }
            }
            break;
          case 'number':
            value = Number(value) || 0;
            cell.numFmt = '#,##0';
            break;
          case 'currency':
            value = Number(value) || 0;
            cell.numFmt = '"$"#,##0.00';
            break;
          case 'percentage':
            value = Number(value) || 0;
            cell.numFmt = '0.00%';
            break;
          default:
            value = String(value || '');
        }
        
        cell.value = value;
        cell.alignment = { 
          horizontal: column.align || 'left', 
          vertical: 'middle' 
        };
        
        // Alternating row colors
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFFFFFFF' : 'FFF9FAFB' }
        };
        
        // Borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        
        cell.font = { 
          size: 10, 
          color: { argb: 'FF374151' } 
        };
      });
      
      dataRow.height = 18;
    });

    // Summary footer
    const summaryRow = currentRow + options.data.length + 1;
    worksheet.mergeCells(`A${summaryRow}:${String.fromCharCode(65 + options.columns.length - 1)}${summaryRow}`);
    const summaryCell = worksheet.getCell(`A${summaryRow}`);
    summaryCell.value = `${options.title} - ${options.data.length} registros | Exportado por Sistema Pretensa & Paschini`;
    summaryCell.font = { size: 9, italic: true, color: { argb: 'FF9CA3AF' } };
    summaryCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Freeze header rows
    worksheet.views = [{ state: 'frozen', ySplit: currentRow }];

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${options.filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    return { 
      success: true, 
      message: `Archivo Excel exportado exitosamente: ${options.filename}.xlsx` 
    };
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { 
      success: false, 
      message: `Error al exportar Excel: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    };
  }
}

// Professional PDF Export with enhanced styling
export async function exportToProfessionalPDF(options: ExportOptions): Promise<{ success: boolean; message: string }> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Set document properties
    pdf.setProperties({
      title: options.title,
      subject: options.title,
      author: options.metadata?.author || 'Sistema Estructuras Pretensa',
      creator: 'Sistema Estructuras Pretensa',
      keywords: options.metadata?.keywords?.join(', ') || 'reporte,datos,sistemas'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Professional header with gradient effect
    const primaryColor = options.branding?.primaryColor || CORPORATE_COLORS.primary;
    const secondaryColor = options.branding?.secondaryColor || CORPORATE_COLORS.secondary;

    // Header background
    pdf.setFillColor(primaryColor);
    pdf.rect(0, 0, pageWidth, 50, 'F');

    // Company info
    if (options.companyInfo) {
      pdf.setTextColor('#FFFFFF');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Company contact information
      if (options.companyInfo.address || options.companyInfo.email) {
        const details = [
          options.companyInfo.address,
          options.companyInfo.email
        ].filter(Boolean).join(' | ');
        pdf.text(details, margin, 25);
      }
    }

    // Report title
    yPosition = 60;
    pdf.setTextColor(CORPORATE_COLORS.dark);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const titleWidth = pdf.getTextWidth(options.title);
    pdf.text(options.title, (pageWidth - titleWidth) / 2, yPosition);

    // Subtitle
    if (options.subtitle) {
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor('#6B7280');
      const subtitleWidth = pdf.getTextWidth(options.subtitle);
      pdf.text(options.subtitle, (pageWidth - subtitleWidth) / 2, yPosition);
    }

    // Metadata
    yPosition += 15;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#9CA3AF');
    const metaText = `Generado el ${new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} | Total de registros: ${options.data.length}`;
    const metaWidth = pdf.getTextWidth(metaText);
    pdf.text(metaText, (pageWidth - metaWidth) / 2, yPosition);

    yPosition += 20;

    // Calculate dynamic column widths based on content
    const availableWidth = pageWidth - (2 * margin);
    const minColumnWidth = 25; // Minimum width per column
    
    // Calculate optimal column widths based on content length with smart formatting
    const columnWidths = options.columns.map(column => {
      const headerLength = pdf.getTextWidth(column.label) + 12; // Extra padding
      let maxContentLength = 0;
      
      options.data.forEach(row => {
        let cellValue = row[column.key] || '';
        
        // Format cell value for width calculation (same as display formatting)
        switch (column.format) {
          case 'date':
            if (cellValue) {
              const dateObj = new Date(cellValue);
              if (!isNaN(dateObj.getTime())) {
                cellValue = dateObj.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
              }
            }
            break;
          case 'currency':
            cellValue = `$${Number(cellValue || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
            break;
          case 'number':
            cellValue = Number(cellValue || 0).toLocaleString('es-ES');
            break;
          case 'percentage':
            cellValue = `${(Number(cellValue || 0) * 100).toFixed(2)}%`;
            break;
          default:
            cellValue = String(cellValue);
        }
        
        const contentWidth = pdf.getTextWidth(String(cellValue)) + 12; // Extra padding
        maxContentLength = Math.max(maxContentLength, contentWidth);
      });
      
      // Ensure minimum width but allow for wider columns if content requires it
      const optimalWidth = Math.max(minColumnWidth, headerLength, Math.min(maxContentLength, availableWidth * 0.4));
      return optimalWidth;
    });
    
    // Normalize column widths to fit available space
    const totalCalculatedWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const widthMultiplier = availableWidth / totalCalculatedWidth;
    const adjustedColumnWidths = columnWidths.map(width => width * widthMultiplier);

    // Table headers with professional styling
    pdf.setFillColor(primaryColor);
    pdf.rect(margin, yPosition - 5, availableWidth, 12, 'F');
    
    pdf.setTextColor('#FFFFFF');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    
    let currentX = margin;
    options.columns.forEach((column, index) => {
      const columnWidth = adjustedColumnWidths[index];
      let text = column.label;
      
      // Smart text truncation with ellipsis only if needed
      const maxWidth = columnWidth - 6;
      if (pdf.getTextWidth(text) > maxWidth) {
        while (pdf.getTextWidth(text + '...') > maxWidth && text.length > 0) {
          text = text.substring(0, text.length - 1);
        }
        text += '...';
      }
      
      pdf.text(text, currentX + 3, yPosition + 3);
      currentX += columnWidth;
    });

    yPosition += 15;

    // Table data with alternating colors
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    const rowHeight = 8;
    let pageCount = 1;

    options.data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        pageCount++;
        yPosition = margin;
        
        // Repeat headers on new page
        pdf.setFillColor(primaryColor);
        pdf.rect(margin, yPosition - 5, availableWidth, 12, 'F');
        
        pdf.setTextColor('#FFFFFF');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        
        let currentX = margin;
        options.columns.forEach((column, index) => {
          const columnWidth = adjustedColumnWidths[index];
          let text = column.label;
          const maxWidth = columnWidth - 6;
          if (pdf.getTextWidth(text) > maxWidth) {
            while (pdf.getTextWidth(text + '...') > maxWidth && text.length > 0) {
              text = text.substring(0, text.length - 1);
            }
            text += '...';
          }
          pdf.text(text, currentX + 3, yPosition + 3);
          currentX += columnWidth;
        });
        
        yPosition += 15;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
      }

      // Alternating row background
      if (rowIndex % 2 === 0) {
        pdf.setFillColor('#F9FAFB');
        pdf.rect(margin, yPosition - 2, availableWidth, rowHeight, 'F');
      }

      // Row data with improved formatting
      pdf.setTextColor(CORPORATE_COLORS.dark);
      let currentX = margin;
      options.columns.forEach((column, colIndex) => {
        const columnWidth = adjustedColumnWidths[colIndex];
        let value = row[column.key];
        
        // Format value
        switch (column.format) {
          case 'date':
            if (value) {
              // Ensure consistent date formatting as DD/MM/YYYY without time
              const dateObj = new Date(value);
              if (!isNaN(dateObj.getTime())) {
                value = dateObj.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
              } else {
                value = String(value);
              }
            }
            break;
          case 'number':
            value = Number(value || 0).toLocaleString('es-ES');
            break;
          case 'currency':
            value = `$${Number(value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
            break;
          case 'percentage':
            value = `${(Number(value || 0) * 100).toFixed(2)}%`;
            break;
          default:
            value = String(value || '');
        }
        
        // Smart text handling - wrap or truncate based on content length
        const maxWidth = columnWidth - 6;
        let text = String(value);
        
        // For very long text, try to break at spaces first
        if (pdf.getTextWidth(text) > maxWidth) {
          const words = text.split(' ');
          if (words.length > 1) {
            let truncated = words[0];
            for (let i = 1; i < words.length; i++) {
              const testText = truncated + ' ' + words[i];
              if (pdf.getTextWidth(testText + '...') <= maxWidth) {
                truncated = testText;
              } else {
                break;
              }
            }
            if (truncated !== text) text = truncated + '...';
          } else {
            // Single long word - truncate character by character
            while (pdf.getTextWidth(text + '...') > maxWidth && text.length > 0) {
              text = text.substring(0, text.length - 1);
            }
            if (text !== String(value)) text += '...';
          }
        }
        
        pdf.text(text, currentX + 3, yPosition + 2);
        currentX += columnWidth;
      });

      yPosition += rowHeight;
    });

    // Footer with page numbers and company info
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor('#9CA3AF');
    
    for (let page = 1; page <= pageCount; page++) {
      if (page > 1) pdf.setPage(page);
      
      // Page number
      const pageText = `Página ${page} de ${pageCount}`;
      pdf.text(pageText, pageWidth - margin - pdf.getTextWidth(pageText), footerY);
      
      // Company footer
      const footerText = `${options.title} - Sistema Estructuras Pretensa`;
      pdf.text(footerText, margin, footerY);
    }

    // Save PDF
    pdf.save(`${options.filename}.pdf`);

    return { 
      success: true, 
      message: `Archivo PDF exportado exitosamente: ${options.filename}.pdf` 
    };
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { 
      success: false, 
      message: `Error al exportar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    };
  }
}

// Helper function to format data for professional export
export function prepareDataForExport<T extends Record<string, any>>(
  data: T[],
  columnMapping: Record<keyof T, string>,
  options?: {
    title: string;
    subtitle?: string;
    department?: string;
    author?: string;
  }
): ExportOptions {
  const columns: ExportColumn[] = Object.entries(columnMapping).map(([key, label]) => {
    // Auto-detect format based on data
    const sampleValue = data[0]?.[key];
    let format: ExportColumn['format'] = 'text';
    let width = 15;
    
    if (sampleValue !== null && sampleValue !== undefined) {
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('fecha')) {
        format = 'date';
        width = 18;
      } else if (key.toLowerCase().includes('cost') || key.toLowerCase().includes('price') || key.toLowerCase().includes('amount')) {
        format = 'currency';
        width = 20;
      } else if (typeof sampleValue === 'number') {
        format = 'number';
        width = 15;
      } else if (typeof sampleValue === 'string' && sampleValue.length > 30) {
        width = 25;
      }
    }
    
    return {
      key: key as string,
      label,
      width,
      format,
      align: format === 'number' || format === 'currency' ? 'right' : 'left'
    };
  });

  return {
    title: options?.title || 'Reporte de Datos',
    subtitle: options?.subtitle,
    filename: `${options?.title?.toLowerCase().replace(/\s+/g, '_') || 'reporte'}_${new Date().toISOString().split('T')[0]}`,
    columns,
    data,
    companyInfo: {
      name: 'Estructuras Pretensa',
      address: 'Avenida La Voz del Interior 5500, Córdoba, Argentina',
      email: 'sistemas@pretensa.com.ar',
      website: 'www.pretensa.com.ar',
      logo: '/logo.png'
    },
    metadata: {
      author: options?.author || 'Sistema de Gestión',
      department: options?.department || 'Sistemas',
      description: `Reporte de ${options?.title || 'datos'} generado automáticamente`,
      keywords: ['reporte', 'datos', 'sistemas', 'pretensa', 'paschini']
    },
    branding: {
      primaryColor: CORPORATE_COLORS.primary,
      secondaryColor: CORPORATE_COLORS.secondary,
      headerColor: '#E5E7EB'
    }
  };
}