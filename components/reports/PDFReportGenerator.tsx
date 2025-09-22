'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { FileText, Download, Calendar, Filter } from 'lucide-react'

interface ReportConfig {
  title: string
  type: 'equipment' | 'tickets' | 'inventory' | 'purchases' | 'monthly'
  dateFrom?: string
  dateTo?: string
  filters?: Record<string, any>
}

export function PDFReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportType, setReportType] = useState<ReportConfig['type']>('monthly')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      // Obtener datos según el tipo de reporte
      const response = await fetch(`/api/reports/${reportType}?` + new URLSearchParams({
        dateFrom,
        dateTo
      }))
      
      if (!response.ok) throw new Error('Error obteniendo datos')
      
      const data = await response.json()
      
      // Crear documento PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Configurar fuentes y colores
      pdf.setFont('helvetica')
      
      // Header del reporte
      pdf.setFillColor(30, 41, 59) // Color oscuro para el header
      pdf.rect(0, 0, pageWidth, 40, 'F')
      
      // Logo o título de la empresa
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(20)
      pdf.text('Sistema IT - Reporte', 20, 20)
      
      pdf.setFontSize(12)
      pdf.text(getReportTitle(reportType), 20, 30)
      
      // Fecha del reporte
      pdf.setFontSize(10)
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 50, 20)
      
      if (dateFrom && dateTo) {
        pdf.text(`Período: ${dateFrom} - ${dateTo}`, pageWidth - 50, 30)
      }
      
      // Resetear color de texto
      pdf.setTextColor(0, 0, 0)
      
      const yPosition = 50
      
      // Contenido según tipo de reporte
      switch (reportType) {
        case 'equipment':
          generateEquipmentReport(pdf, data, yPosition)
          break
        case 'tickets':
          generateTicketsReport(pdf, data, yPosition)
          break
        case 'inventory':
          generateInventoryReport(pdf, data, yPosition)
          break
        case 'purchases':
          generatePurchasesReport(pdf, data, yPosition)
          break
        case 'monthly':
          generateMonthlyReport(pdf, data, yPosition)
          break
      }
      
      // Footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        pdf.text('Sistema Interno IT © 2024', 20, pageHeight - 10)
      }
      
      // Descargar PDF
      const fileName = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      // Error silenciado
    } finally {
      setIsGenerating(false)
    }
  }

  const getReportTitle = (type: ReportConfig['type']) => {
    const titles = {
      equipment: 'Reporte de Equipos',
      tickets: 'Reporte de Tickets',
      inventory: 'Reporte de Inventario',
      purchases: 'Reporte de Compras',
      monthly: 'Reporte Mensual Integral'
    }
    return titles[type]
  }

  const generateEquipmentReport = (pdf: jsPDF, data: any, startY: number) => {
    pdf.setFontSize(14)
    pdf.text('Resumen de Equipos', 20, startY)
    
    // Estadísticas
    pdf.setFontSize(10)
    pdf.text(`Total de equipos: ${data.total}`, 20, startY + 10)
    pdf.text(`Equipos activos: ${data.active}`, 20, startY + 15)
    pdf.text(`En mantenimiento: ${data.maintenance}`, 20, startY + 20)
    
    // Tabla de equipos
    if (data.items && data.items.length > 0) {
      ;(pdf as any).autoTable({
        startY: startY + 30,
        head: [['ID', 'Nombre', 'Tipo', 'Estado', 'Ubicación', 'Asignado a']],
        body: data.items.map((item: any) => [
          item.id,
          item.name,
          item.type,
          item.status,
          item.location || '-',
          item.assignedTo?.firstName || '-'
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] }
      })
    }
  }

  const generateTicketsReport = (pdf: jsPDF, data: any, startY: number) => {
    pdf.setFontSize(14)
    pdf.text('Resumen de Tickets', 20, startY)
    
    // Estadísticas
    pdf.setFontSize(10)
    pdf.text(`Total de tickets: ${data.total}`, 20, startY + 10)
    pdf.text(`Abiertos: ${data.open}`, 20, startY + 15)
    pdf.text(`Resueltos: ${data.resolved}`, 20, startY + 20)
    pdf.text(`Tiempo promedio resolución: ${data.avgResolutionTime || 'N/A'}`, 20, startY + 25)
    
    // Tabla de tickets
    if (data.items && data.items.length > 0) {
      ;(pdf as any).autoTable({
        startY: startY + 35,
        head: [['ID', 'Título', 'Prioridad', 'Estado', 'Solicitante', 'Fecha']],
        body: data.items.map((item: any) => [
          item.id,
          item.title.substring(0, 30),
          item.priority,
          item.status,
          item.requestor?.firstName || '-',
          new Date(item.createdAt).toLocaleDateString('es-ES')
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] }
      })
    }
  }

  const generateInventoryReport = (pdf: jsPDF, data: any, startY: number) => {
    pdf.setFontSize(14)
    pdf.text('Resumen de Inventario', 20, startY)
    
    // Estadísticas
    pdf.setFontSize(10)
    pdf.text(`Total de items: ${data.total}`, 20, startY + 10)
    pdf.text(`Valor total estimado: $${data.totalValue || 0}`, 20, startY + 15)
    pdf.text(`Items con stock bajo: ${data.lowStock}`, 20, startY + 20)
    
    // Tabla de inventario
    if (data.items && data.items.length > 0) {
      ;(pdf as any).autoTable({
        startY: startY + 30,
        head: [['ID', 'Nombre', 'Categoría', 'Cantidad', 'Estado', 'Ubicación']],
        body: data.items.map((item: any) => [
          item.id,
          item.name,
          item.category,
          item.quantity,
          item.status,
          item.location || '-'
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] }
      })
    }
  }

  const generatePurchasesReport = (pdf: jsPDF, data: any, startY: number) => {
    pdf.setFontSize(14)
    pdf.text('Resumen de Compras', 20, startY)
    
    // Estadísticas
    pdf.setFontSize(10)
    pdf.text(`Total de solicitudes: ${data.total}`, 20, startY + 10)
    pdf.text(`Pendientes: ${data.pending}`, 20, startY + 15)
    pdf.text(`Aprobadas: ${data.approved}`, 20, startY + 20)
    pdf.text(`Costo total: $${data.totalCost || 0}`, 20, startY + 25)
    
    // Tabla de compras
    if (data.items && data.items.length > 0) {
      ;(pdf as any).autoTable({
        startY: startY + 35,
        head: [['ID', 'Item', 'Cantidad', 'Costo Est.', 'Estado', 'Fecha']],
        body: data.items.map((item: any) => [
          item.id,
          item.itemName.substring(0, 30),
          item.quantity,
          `$${item.estimatedCost || 0}`,
          item.status,
          new Date(item.createdAt).toLocaleDateString('es-ES')
        ]),
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] }
      })
    }
  }

  const generateMonthlyReport = (pdf: jsPDF, data: any, startY: number) => {
    pdf.setFontSize(16)
    pdf.text('Reporte Mensual Integral', 20, startY)
    
    let currentY = startY + 15
    
    // Resumen ejecutivo
    pdf.setFontSize(12)
    pdf.text('Resumen Ejecutivo', 20, currentY)
    currentY += 10
    
    pdf.setFontSize(10)
    const summary = [
      `Equipos totales: ${data.equipment?.total || 0}`,
      `Tickets resueltos: ${data.tickets?.resolved || 0}`,
      `Compras realizadas: ${data.purchases?.completed || 0}`,
      `Inversión total: $${data.totalInvestment || 0}`
    ]
    
    summary.forEach((line, index) => {
      pdf.text(line, 25, currentY + (index * 5))
    })
    
    currentY += 30
    
    // Gráficos de tendencias (simulados con texto)
    pdf.setFontSize(12)
    pdf.text('Tendencias del Mes', 20, currentY)
    currentY += 10
    
    // Métricas clave
    if (data.metrics) {
      ;(pdf as any).autoTable({
        startY: currentY,
        head: [['Métrica', 'Valor', 'Variación']],
        body: [
          ['Tickets promedio/día', data.metrics.avgTicketsPerDay || 0, `${data.metrics.ticketsTrend || 0}%`],
          ['Tiempo resolución', data.metrics.avgResolutionTime || 'N/A', `${data.metrics.resolutionTrend || 0}%`],
          ['Disponibilidad equipos', `${data.metrics.equipmentAvailability || 0}%`, `${data.metrics.availabilityTrend || 0}%`],
          ['Eficiencia compras', `${data.metrics.purchaseEfficiency || 0}%`, `${data.metrics.purchaseTrend || 0}%`]
        ],
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] }
      })
    }
    
    // Recomendaciones
    pdf.addPage()
    pdf.setFontSize(12)
    pdf.text('Recomendaciones', 20, 30)
    
    const recommendations = data.recommendations || [
      'Realizar mantenimiento preventivo en equipos críticos',
      'Revisar stock de consumibles de impresoras',
      'Actualizar inventario de software',
      'Programar capacitación para nuevas herramientas'
    ]
    
    pdf.setFontSize(10)
    recommendations.forEach((rec: string, index: number) => {
      pdf.text(`${index + 1}. ${rec}`, 25, 40 + (index * 7))
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Generador de Reportes PDF</h3>
        <p className="text-sm text-white/60">Genera reportes detallados del sistema</p>
      </div>

      <div className="space-y-4">
        {/* Selector de tipo de reporte */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Tipo de Reporte
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportConfig['type'])}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Reporte Mensual Integral</option>
            <option value="equipment">Reporte de Equipos</option>
            <option value="tickets">Reporte de Tickets</option>
            <option value="inventory">Reporte de Inventario</option>
            <option value="purchases">Reporte de Compras</option>
          </select>
        </div>

        {/* Rango de fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botón de generación */}
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Generando reporte...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generar Reporte PDF
            </>
          )}
        </button>

        {/* Vista previa de contenido */}
        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <p className="text-xs text-white/60 mb-2">El reporte incluirá:</p>
          <ul className="text-xs text-white/80 space-y-1">
            {reportType === 'monthly' ? (
              <>
                <li>• Resumen ejecutivo del mes</li>
                <li>• Métricas y KPIs principales</li>
                <li>• Tendencias y comparativas</li>
                <li>• Recomendaciones automáticas</li>
              </>
            ) : (
              <>
                <li>• Estadísticas generales</li>
                <li>• Tabla detallada de registros</li>
                <li>• Gráficos de distribución</li>
                <li>• Período: {dateFrom && dateTo ? `${dateFrom} a ${dateTo}` : 'Todo el historial'}</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}