'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react'

interface ExcelImporterProps {
  onImport: (data: any[]) => Promise<void>
  columns: {
    key: string
    label: string
    required?: boolean
    transform?: (value: any) => any
  }[]
  templateName: string
  entityName: string
}

export function ExcelImporter({ 
  onImport, 
  columns, 
  templateName,
  entityName 
}: ExcelImporterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setErrors(['Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV'])
      return
    }

    setFile(selectedFile)
    setErrors([])
    setImportStatus('idle')
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target?.result
        const workbook = XLSX.read(binaryStr, { type: 'binary' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false })
        
        // Validar y transformar datos
        const processedData = jsonData.map((row: any, index) => {
          const processed: any = {}
          const rowErrors: string[] = []
          
          columns.forEach(col => {
            const value = row[col.label] || row[col.key]
            
            if (col.required && !value) {
              rowErrors.push(`Fila ${index + 2}: ${col.label} es requerido`)
            }
            
            processed[col.key] = col.transform ? col.transform(value) : value
          })
          
          if (rowErrors.length > 0) {
            setErrors(prev => [...prev, ...rowErrors])
          }
          
          return processed
        })
        
        setPreview(processedData.slice(0, 5)) // Mostrar solo las primeras 5 filas
      } catch (error) {
        setErrors(['Error al leer el archivo. Verifica el formato.'])
      }
    }
    
    reader.readAsBinaryString(selectedFile)
  }, [columns])

  const handleImport = async () => {
    if (preview.length === 0) return
    
    setIsLoading(true)
    setErrors([])
    
    try {
      await onImport(preview)
      setImportStatus('success')
      setFile(null)
      setPreview([])
      
      // Reset después de 3 segundos
      setTimeout(() => {
        setImportStatus('idle')
      }, 3000)
    } catch (error: any) {
      setErrors([error.message || 'Error al importar datos'])
      setImportStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    const templateData = columns.reduce((acc, col) => {
      acc[col.label] = ''
      return acc
    }, {} as any)
    
    const ws = XLSX.utils.json_to_sheet([templateData])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, `${templateName}_template.xlsx`)
  }

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Importar {entityName} desde Excel</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona un archivo Excel con los datos a importar
        </p>
      </div>

      <div className="space-y-4">
        {/* Botón de descarga de plantilla */}
        <button
          onClick={downloadTemplate}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <FileSpreadsheet className="w-4 h-4 inline mr-1" />
          Descargar plantilla Excel
        </button>

        {/* Input de archivo */}
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
          >
            <Upload className="w-6 h-6 mr-2 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              {file ? file.name : 'Haz clic para seleccionar archivo'}
            </span>
          </label>
        </div>

        {/* Errores */}
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
              <div className="space-y-1">
                {errors.map((error, i) => (
                  <p key={i} className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vista previa */}
        {preview.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2">
              <h4 className="text-sm font-medium">Vista previa (primeras 5 filas)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="px-4 py-2 text-left">
                        {col.label}
                        {col.required && <span className="text-red-500 ml-1">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t dark:border-gray-700">
                      {columns.map(col => (
                        <td key={col.key} className="px-4 py-2">
                          {row[col.key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {preview.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={isLoading || errors.length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Importar {preview.length} registros
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setPreview([])
                setFile(null)
                setErrors([])
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </button>
          </div>
        )}

        {/* Mensaje de éxito */}
        {importStatus === 'success' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Datos importados exitosamente
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}