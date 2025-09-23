"use client"

import { useState, useEffect } from "react"
import AnimatedContainer from "@/components/animated-container"
import Modal from "@/components/modal"
import Button from "@/components/button"
import ConfirmDialog from "@/components/confirm-dialog"
import Select from "@/components/select"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { useToast } from "@/lib/hooks/use-toast"
import { useAppAuth } from "@/lib/hooks/useAppAuth"
import { usePermissionToast } from "@/lib/hooks/usePermissionToast"

interface BackupLog {
  id: number
  backupName: string
  diskUsed: string
  status: string
  sizeBytes?: number
  errorMessage?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const DISK_OPTIONS = [
  { value: 'Disco 1', label: 'Disco 1' },
  { value: 'Disco 2', label: 'Disco 2' },
  { value: 'Disco 3', label: 'Disco 3' },
  { value: 'Disco 4', label: 'Disco 4' }
]

const STATUS_OPTIONS = [
  { value: 'SUCCESS', label: 'Exitoso' },
  { value: 'FAILED', label: 'Fallido' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'SCHEDULED', label: 'Programado' }
]

type FilterOption = {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export default function BackupsPage() {
  const { isAuthenticated, loading: authLoading, hasRole, hasPermission } = useAppAuth()
  const { showPermissionError } = usePermissionToast()
  const [backups, setBackups] = useState<BackupLog[]>([])
  const [filteredBackups, setFilteredBackups] = useState<BackupLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBackup, setEditingBackup] = useState<BackupLog | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; backup: BackupLog | null }>({ isOpen: false, backup: null })
  const [showCalendar, setShowCalendar] = useState(false)

  // Toast notifications
  const { showSuccess, showError } = useToast()

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [diskFilter, setDiskFilter] = useState("")

  const [formData, setFormData] = useState({
    backupName: "",
    diskUsed: "Disco 1",
    status: "SUCCESS",
    sizeBytes: "",
    errorMessage: "",
    notes: ""
  })

  useEffect(() => {
    fetchBackups()
  }, [])

  useEffect(() => {
    let filtered = backups

    if (searchTerm) {
      filtered = filtered.filter(backup => 
        backup.backupName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(backup => backup.status === statusFilter)
    }

    if (diskFilter) {
      filtered = filtered.filter(backup => backup.diskUsed === diskFilter)
    }

    setFilteredBackups(filtered)
  }, [backups, searchTerm, statusFilter, diskFilter])

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backups')
      if (response.ok) {
        const data = await response.json()
        setBackups(data)
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      // Transform data to use Spanish status labels
      const exportData = filteredBackups.map(backup => ({
        id: backup.id.toString(),
        backupName: backup.backupName,
        diskUsed: backup.diskUsed,
        status: getStatusLabel(backup.status), // Convert to Spanish
        sizeBytes: backup.sizeBytes,
        errorMessage: backup.errorMessage || '',
        notes: backup.notes || '',
        createdAt: new Date(backup.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        }),
        updatedAt: new Date(backup.updatedAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        })
      }))
      
      const columnMap = {
        id: 'ID',
        backupName: 'Nombre del Backup',
        diskUsed: 'Disco Usado',
        status: 'Estado',
        sizeBytes: 'Tamaño (bytes)',
        errorMessage: 'Mensaje de Error',
        notes: 'Notas',
        createdAt: 'Fecha de Creación',
        updatedAt: 'Última Actualización'
      }
      
      const exportOptions = prepareDataForExport(exportData, columnMap, {
        title: 'Reporte de Backups',
        subtitle: 'Sistema de Respaldos - Pretensa & Paschini',
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })
      
      const result = await exportToProfessionalExcel(exportOptions)
      
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      showError('Error inesperado al exportar a Excel. Por favor, intenta nuevamente.')
    }
  }

  const handleExportPDF = async () => {
    try {
      // Transform data to use Spanish status labels
      const exportData = filteredBackups.map(backup => ({
        id: backup.id.toString(),
        backupName: backup.backupName,
        diskUsed: backup.diskUsed,
        status: getStatusLabel(backup.status), // Convert to Spanish
        sizeBytes: backup.sizeBytes,
        errorMessage: backup.errorMessage || '',
        notes: backup.notes || '',
        createdAt: new Date(backup.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        }),
        updatedAt: new Date(backup.updatedAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        })
      }))
      
      const columnMap = {
        id: 'ID',
        backupName: 'Nombre del Backup',
        diskUsed: 'Disco Usado',
        status: 'Estado',
        sizeBytes: 'Tamaño (bytes)',
        errorMessage: 'Mensaje de Error',
        notes: 'Notas',
        createdAt: 'Fecha de Creación',
        updatedAt: 'Última Actualización'
      }
      
      const exportOptions = prepareDataForExport(exportData, columnMap, {
        title: 'Reporte de Backups',
        subtitle: 'Sistema de Respaldos - Pretensa & Paschini',
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })
      
      const result = await exportToProfessionalPDF(exportOptions)
      
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      showError('Error inesperado al exportar a PDF. Por favor, intenta nuevamente.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check permissions
    if (!hasPermission('backups:create') && !hasPermission('backups:update')) {
      showPermissionError('No tienes permisos para gestionar backups')
      return
    }
    
    try {
      const url = editingBackup ? `/api/backups/${editingBackup.id}` : '/api/backups'
      const method = editingBackup ? 'PUT' : 'POST'
      
      // Auto-generar nombre con formato DD-MM-YYYY si no se proporciona
      const today = new Date()
      const autoName = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
      
      const submitData = {
        ...formData,
        backupName: formData.backupName || autoName,
        sizeBytes: formData.sizeBytes ? parseInt(formData.sizeBytes) : null
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        await fetchBackups()
        resetForm()
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Error saving backup:', error)
    }
  }

  const handleEdit = (backup: BackupLog) => {
    setEditingBackup(backup)
    setFormData({
      backupName: backup.backupName,
      diskUsed: backup.diskUsed,
      status: backup.status,
      sizeBytes: backup.sizeBytes?.toString() || "",
      errorMessage: backup.errorMessage || "",
      notes: backup.notes || ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.backup) return
    
    // Check permissions
    if (!hasPermission('backups:delete')) {
      showPermissionError('No tienes permisos para eliminar backups')
      return
    }
    
    try {
      const response = await fetch(`/api/backups/${deleteConfirm.backup.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchBackups()
        setDeleteConfirm({ isOpen: false, backup: null })
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      backupName: "",
      diskUsed: "Disco 1",
      status: "SUCCESS",
      sizeBytes: "",
      errorMessage: "",
      notes: ""
    })
    setEditingBackup(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500/10 text-green-400'
      case 'FAILED': return 'bg-red-500/10 text-red-400'
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-400'
      case 'SCHEDULED': return 'bg-yellow-500/10 text-yellow-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.label || status
  }

  const getDiskColor = (disk: string) => {
    switch (disk) {
      case 'Disco 1': return 'bg-blue-500'
      case 'Disco 2': return 'bg-green-500'
      case 'Disco 3': return 'bg-yellow-500'
      case 'Disco 4': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColorForCalendar = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500'
      case 'FAILED': return 'bg-red-500'
      case 'IN_PROGRESS': return 'bg-blue-500'
      case 'SCHEDULED': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const formatGigabytes = (sizeGB?: number) => {
    if (!sizeGB) return '-'
    return `${sizeGB.toFixed(2)} GB`
  }

  const filterOptions: FilterOption[] = [
    {
      label: 'Estado',
      value: statusFilter,
      onChange: (value: string) => setStatusFilter(value),
      options: [
        { value: '', label: 'Todos los estados' },
        ...STATUS_OPTIONS
      ]
    },
    {
      label: 'Disco',
      value: diskFilter,
      onChange: (value: string) => setDiskFilter(value),
      options: [
        { value: '', label: 'Todos los discos' },
        ...DISK_OPTIONS
      ]
    }
  ]

  if (authLoading) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Verificando autenticación...</div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!isAuthenticated) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso denegado</div>
            <div className="text-white/60">Debes iniciar sesión para acceder a esta página.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  const hasRoleAccess = hasRole('SuperAdmin') || hasRole('Admin') || hasRole('Technician')

  // Show access denied if user doesn't have required permissions
  if (!hasPermission('backups:view') && !hasRoleAccess) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para acceder a los backups.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <div className="space-y-6">
      {/* Header sin card */}
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Backups</h1>
        <p className="text-white/60 text-sm">Gestión y monitoreo de respaldos del sistema</p>
      </div>

      {/* Filtros en card como en Solicitudes */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs sm:text-sm text-white/70 mb-1">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de backup..."
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
            />
          </div>
          {filterOptions.map((filter, index) => (
            <div key={index} className="w-full sm:w-auto min-w-[180px]">
              <label className="block text-xs sm:text-sm text-white/70 mb-1">{filter.label}</label>
              <Select value={filter.value} onChange={filter.onChange} options={filter.options} />
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {hasPermission('backups:create') && (
              <Button
                onClick={() => {
                  resetForm()
                  setIsModalOpen(true)
                }}
              >
                Nuevo Backup
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowCalendar(true)}
            >
              Ver Calendario
            </Button>
            {hasPermission('backups:export') && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleExportExcel}
                >
                  Exportar Excel
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleExportPDF}
                >
                  Exportar PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="mb-2 border-b border-white/10"></div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_OPTIONS.map((status) => {
          const count = backups.filter(b => b.status === status.value).length
          return (
            <div key={status.value} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {count}
                </div>
                <div className="text-white/60 text-sm">{status.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-3 text-white/80 font-medium">Nombre</th>
                <th className="text-left p-3 text-white/80 font-medium">Disco</th>
                <th className="text-left p-3 text-white/80 font-medium">Estado</th>
                <th className="text-left p-3 text-white/80 font-medium">Tamaño (GB)</th>
                <th className="text-left p-3 text-white/80 font-medium">Fecha</th>
                <th className="text-left p-3 text-white/80 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-white/60">
                    Cargando backups...
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-white/60">
                    No se encontraron backups
                  </td>
                </tr>
              ) : (
                filteredBackups.map((backup) => (
                  <tr key={backup.id} className="border-t border-white/10">
                    <td className="p-3">{backup.backupName}</td>
                    <td className="p-3">{backup.diskUsed}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(backup.status)}`}>
                        {getStatusLabel(backup.status)}
                      </span>
                    </td>
                    <td className="p-3">{formatGigabytes(backup.sizeBytes)}</td>
                    <td className="p-3">
                      {new Date(backup.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-3 flex gap-2">
                      {hasPermission('backups:update') && (
                        <Button onClick={() => handleEdit(backup)} variant="ghost" small>Editar</Button>
                      )}
                      {hasPermission('backups:delete') && (
                        <Button onClick={() => setDeleteConfirm({ isOpen: true, backup })} small>Eliminar</Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-4 p-4">
          {loading ? (
            <div className="text-center text-white/60">Cargando backups...</div>
          ) : filteredBackups.length === 0 ? (
            <div className="text-center text-white/60">No se encontraron backups</div>
          ) : (
            filteredBackups.map((backup) => (
              <div key={backup.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{backup.backupName}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(backup.status)}`}>
                    {getStatusLabel(backup.status)}
                  </span>
                </div>
                <div className="text-sm text-white/60 space-y-1">
                  <div>Disco: {backup.diskUsed}</div>
                  <div>Fecha: {new Date(backup.createdAt).toLocaleDateString('es-ES')}</div>
                  {backup.sizeBytes && <div>Tamaño: {formatGigabytes(backup.sizeBytes)}</div>}
                </div>
                <div className="flex gap-2 mt-3">
                  {hasPermission('backups:update') && (
                    <Button onClick={() => handleEdit(backup)} variant="ghost" small>Editar</Button>
                  )}
                  {hasPermission('backups:delete') && (
                    <Button onClick={() => setDeleteConfirm({ isOpen: true, backup })} small>Eliminar</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para crear/editar */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingBackup ? 'Editar Backup' : 'Nuevo Backup'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide" id="backup-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Nombre del Backup
              </label>
              <input
                type="text"
                value={formData.backupName}
                onChange={(e) => setFormData({ ...formData, backupName: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                placeholder="Deja vacío para usar fecha actual (DD-MM-YYYY)"
              />
              <p className="text-xs text-white/50 mt-1">Si no se especifica, se usará el formato DD-MM-YYYY</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Disco Utilizado *
              </label>
              <Select value={formData.diskUsed} onChange={(v) => setFormData({ ...formData, diskUsed: v })} options={DISK_OPTIONS} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Estado *
              </label>
              <Select value={formData.status} onChange={(v) => setFormData({ ...formData, status: v })} options={STATUS_OPTIONS} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Tamaño (GB)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sizeBytes}
                onChange={(e) => setFormData({ ...formData, sizeBytes: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                placeholder="Ej: 1.5 (para 1.5 GB)"
              />
            </div>
          </div>

          {formData.status === 'FAILED' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Mensaje de Error
              </label>
              <textarea
                value={formData.errorMessage}
                onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none resize-none"
                placeholder="Descripción del error..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none resize-none"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </form>
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const f = document.getElementById('backup-form') as HTMLFormElement | null;
                f?.requestSubmit();
              }}
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base"
            >
              {editingBackup ? 'Actualizar' : 'Crear'} Backup
            </button>
          </div>
        </div>
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, backup: null })}
        title="Eliminar Registro de Backup"
        description={`¿Estás seguro de que deseas eliminar el backup "${deleteConfirm.backup?.backupName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Modal Calendario de Backups */}
      <Modal
        open={showCalendar}
        onClose={() => setShowCalendar(false)}
        title="Calendario de Backups"
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => setShowCalendar(false)} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cerrar</button>
          </div>
        )}
      >
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="font-medium text-white/80 p-1 sm:p-2">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 6 + 1
              const isCurrentMonth = day > 0 && day <= 31
              const backup = isCurrentMonth ? backups.find(b => new Date(b.createdAt).getDate() === day) : null
              return (
                <div key={i} className={`p-1 sm:p-2 h-8 sm:h-12 border border-white/10 rounded ${isCurrentMonth ? 'bg-white/5' : 'bg-white/2'} relative overflow-hidden`}>
                  {isCurrentMonth && (
                    <>
                      <div className="text-xs text-white/70">{day}</div>
                      {backup && (
                        <>
                          {/* Indicador de estado por color */}
                          <div 
                            className={`absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 right-0.5 sm:right-1 h-0.5 sm:h-1 rounded ${getStatusColorForCalendar(backup.status)}`} 
                            title={`${getStatusLabel(backup.status)} - ${backup.backupName} (${backup.diskUsed})`} 
                          />
                          {/* Disco usado en texto muy pequeño */}
                          <div 
                            className="absolute bottom-1.5 sm:bottom-2 left-0.5 sm:left-1 right-0.5 sm:right-1 text-[0.5rem] sm:text-xs text-white/60 truncate leading-tight font-medium"
                            title={`${backup.diskUsed} - ${getStatusLabel(backup.status)} (${backup.backupName})`}
                          >
                            {backup.diskUsed}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-white/80 mb-2">Leyenda - Estados:</h4>
            <div className="flex flex-wrap gap-3 mb-3">
              {STATUS_OPTIONS.map(status => (
                <div key={status.value} className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded ${getStatusColorForCalendar(status.value)}`} />
                  <span className="text-white/70">{status.label}</span>
                </div>
              ))}
            </div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Discos:</h4>
            <div className="flex flex-wrap gap-2">
              {DISK_OPTIONS.map(disk => (
                <div key={disk.value} className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded ${getDiskColor(disk.value)}`} />
                  <span className="text-white/70">{disk.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      </div>
    </AnimatedContainer>
  )
}
