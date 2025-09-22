'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Download, FileSpreadsheet } from 'lucide-react'

interface ExcelExporterProps {
  data: any[]
  columns: {
    key: string
    label: string
    format?: (value: any) => string
  }[]
  filename: string
  sheetName?: string
  buttonText?: string
  buttonClassName?: string
}

export function ExcelExporter({
  data,
  columns,
  filename,
  sheetName = 'Datos',
  buttonText = 'Exportar a Excel',
  buttonClassName = ''
}: ExcelExporterProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToExcel = () => {
    setIsExporting(true)
    
    try {
      // Preparar datos para exportación
      const exportData = data.map(row => {
        const exportRow: any = {}
        columns.forEach(col => {
          const value = row[col.key]
          exportRow[col.label] = col.format ? col.format(value) : value
        })
        return exportRow
      })

      // Crear hoja de cálculo
      const ws = XLSX.utils.json_to_sheet(exportData)
      
      // Ajustar ancho de columnas
      const colWidths = columns.map(col => ({
        wch: Math.max(col.label.length, 15)
      }))
      ws['!cols'] = colWidths

      // Crear libro
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)

      // Generar archivo con fecha
      const date = new Date().toISOString().split('T')[0]
      const fullFilename = `${filename}_${date}.xlsx`
      
      // Descargar
      XLSX.writeFile(wb, fullFilename)
      
    } catch (error) {
      console.error('Error al exportar:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const defaultClassName = "flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
  
  return (
    <button
      onClick={exportToExcel}
      disabled={isExporting || data.length === 0}
      className={buttonClassName || defaultClassName}
      title={data.length === 0 ? 'No hay datos para exportar' : ''}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
          Exportando...
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {buttonText} ({data.length})
        </>
      )}
    </button>
  )
}

// Componente de exportación avanzada con filtros
interface AdvancedExcelExporterProps extends ExcelExporterProps {
  filters?: {
    key: string
    label: string
    value: any
  }[]
  includeFilters?: boolean
  includeSummary?: boolean
  summaryData?: { label: string; value: any }[]
}

export function AdvancedExcelExporter({
  data,
  columns,
  filename,
  sheetName = 'Datos',
  buttonText = 'Exportar reporte',
  buttonClassName = '',
  filters = [],
  includeFilters = true,
  includeSummary = true,
  summaryData = []
}: AdvancedExcelExporterProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToExcel = () => {
    setIsExporting(true)
    
    try {
      const wb = XLSX.utils.book_new()
      
      // Hoja principal con datos
      const exportData = data.map(row => {
        const exportRow: any = {}
        columns.forEach(col => {
          const value = row[col.key]
          exportRow[col.label] = col.format ? col.format(value) : value
        })
        return exportRow
      })
      
      const wsData = XLSX.utils.json_to_sheet(exportData)
      wsData['!cols'] = columns.map(col => ({ wch: Math.max(col.label.length, 15) }))
      XLSX.utils.book_append_sheet(wb, wsData, sheetName)
      
      // Hoja de resumen si está habilitada
      if (includeSummary && (summaryData.length > 0 || filters.length > 0)) {
        const summaryRows: any[] = []
        
        // Agregar información de filtros
        if (includeFilters && filters.length > 0) {
          summaryRows.push({ Concepto: 'FILTROS APLICADOS', Valor: '' })
          filters.forEach(filter => {
            if (filter.value) {
              summaryRows.push({ 
                Concepto: filter.label, 
                Valor: filter.value 
              })
            }
          })
          summaryRows.push({ Concepto: '', Valor: '' }) // Línea vacía
        }
        
        // Agregar datos de resumen
        if (summaryData.length > 0) {
          summaryRows.push({ Concepto: 'RESUMEN', Valor: '' })
          summaryData.forEach(item => {
            summaryRows.push({ 
              Concepto: item.label, 
              Valor: item.value 
            })
          })
        }
        
        // Agregar estadísticas básicas
        summaryRows.push({ Concepto: '', Valor: '' })
        summaryRows.push({ Concepto: 'ESTADÍSTICAS', Valor: '' })
        summaryRows.push({ 
          Concepto: 'Total de registros', 
          Valor: data.length 
        })
        summaryRows.push({ 
          Concepto: 'Fecha de exportación', 
          Valor: new Date().toLocaleString('es-ES') 
        })
        
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 40 }]
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen')
      }
      
      // Generar archivo
      const date = new Date().toISOString().split('T')[0]
      const fullFilename = `${filename}_${date}.xlsx`
      XLSX.writeFile(wb, fullFilename)
      
    } catch (error) {
      console.error('Error al exportar:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const defaultClassName = "flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
  
  return (
    <button
      onClick={exportToExcel}
      disabled={isExporting || data.length === 0}
      className={buttonClassName || defaultClassName}
      title={data.length === 0 ? 'No hay datos para exportar' : ''}
    >
      {isExporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </button>
  )
}