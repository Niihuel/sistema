"use client"

import { useMemo, useState, useCallback, memo } from "react"
import { useDebounce } from "use-debounce"
import { useEmployees } from "@/lib/hooks/use-api"
import { useToast } from "@/lib/hooks/use-toast"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import Button from "@/components/button"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import MobileTable from "@/components/mobile-table"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { useAppAuth } from "@/lib/hooks/useAppAuth"

type Employee = {
  id: number
  firstName: string
  lastName: string
  area?: string | null
  email?: string | null
  phone?: string | null
  position?: string | null
  status: string
}

import { FIXED_AREAS } from "@/lib/constants/areas"

const statusOptions = ["Activo", "Inactivo"]

function EmployeesPage() {
  const { isAuthenticated, loading: authLoading, can } = useAppAuth()
  const { showError, showSuccess } = useToast()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [area, setArea] = useState("")

  // Áreas fijas según requerimiento
  const areas = FIXED_AREAS

  // Debounced filters - espera 300ms antes de filtrar
  const [debouncedFirstName] = useDebounce(firstName, 300)
  const [debouncedLastName] = useDebounce(lastName, 300)
  const [debouncedArea] = useDebounce(area, 300)

  // SWR hook optimizado con filtros debounced
  const { data, isLoading, error: apiError, refresh } = useEmployees({
    firstName: debouncedFirstName || undefined,
    lastName: debouncedLastName || undefined,
    area: debouncedArea || undefined
  })

  const items = data?.items || []
  const loading = isLoading

  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState<Partial<Employee>>({ status: "Activo" })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filtered = useMemo(() => items, [items])

  // Export functions - memoized with useCallback
  const handleExportExcel = useCallback(async () => {
    try {
      const exportData = filtered.map(employee => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        area: employee.area || '-',
        email: employee.email || '-',
        phone: employee.phone || '-',
        position: employee.position || '-',
        status: employee.status
      }))

      const exportOptions = prepareDataForExport(exportData, {
        id: 'ID',
        firstName: 'Nombre',
        lastName: 'Apellido',
        area: 'Área',
        email: 'Email',
        phone: 'Teléfono',
        position: 'Puesto',
        status: 'Estado'
      }, {
        title: 'Reporte de Empleados',
        subtitle: `${filtered.length} empleados encontrados`,
        department: 'Recursos Humanos',
        author: 'Sistema de Gestión'
      })

      const result = await exportToProfessionalExcel(exportOptions)
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
    } catch (error) {
      showError('Error al exportar a Excel')
    }
  }, [filtered, showSuccess, showError])

  const handleExportPDF = useCallback(async () => {
    try {
      const exportData = filtered.map(employee => ({
        name: `${employee.firstName} ${employee.lastName}`,
        area: employee.area || '-',
        email: employee.email || '-',
        phone: employee.phone || '-',
        position: employee.position || '-',
        status: employee.status
      }))

      const exportOptions = prepareDataForExport(exportData, {
        name: 'Empleado',
        area: 'Área',
        email: 'Email',
        phone: 'Teléfono',
        position: 'Puesto',
        status: 'Estado'
      }, {
        title: 'Reporte de Empleados',
        subtitle: `${filtered.length} empleados`,
        department: 'Recursos Humanos',
        author: 'Sistema de Gestión'
      })

      const result = await exportToProfessionalPDF(exportOptions)
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
    } catch (error) {
      showError('Error al exportar a PDF')
    }
  }, [filtered, showSuccess, showError])

  // Funciones optimizadas para save/remove que necesitan revalidar
  const refreshData = useCallback(() => {
    refresh() // SWR mutate para actualizar datos
  }, [refresh])

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm({ status: "Activo" })
    setIsFormOpen(true)
  }, [])

  const openEdit = useCallback((emp: Employee) => {
    setEditing(emp)
    setForm(emp)
    setIsFormOpen(true)
  }, [])

  const save = useCallback(async () => {
    // Check permissions
    if (!can('employees:edit')) {
      showError('No tienes permisos para gestionar empleados')
      return
    }
    
    try {
      const payload = {
        firstName: form.firstName ?? "",
        lastName: form.lastName ?? "",
        area: form.area || null,
        email: form.email || null,
        phone: form.phone || null,
        position: form.position || null,
        status: form.status || "Activo",
      }
      let res: Response
      if (editing) {
        res = await fetch(`/api/employees/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      } else {
        res = await fetch(`/api/employees`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error guardando")
      setEditing(null)
      setForm({ status: "Activo" })
      setIsFormOpen(false)
      refreshData()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      showError(msg)
    }
  }, [editing, form, refreshData, can, showError])

  const remove = useCallback(async (id: number) => {
    // Check permissions
    if (!can('employees:delete')) {
      showError('No tienes permisos para eliminar empleados')
      return
    }
    
    const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error(data?.error || "Error eliminando")
      return
    }
    refreshData()
  }, [refreshData, can, showError])

  const mobileColumns = useMemo(() => [
    { key: "firstName", label: "Nombre" },
    { key: "lastName", label: "Apellido" },
    { key: "area", label: "Área", render: (value: unknown) => String(value || "-") },
    { key: "email", label: "Email", render: (value: unknown) => String(value || "-") },
    { key: "phone", label: "Teléfono", render: (value: unknown) => String(value || "-") },
    { key: "status", label: "Estado", render: (value: unknown) => (
      <span className={`text-xs px-2 py-1 rounded-full ${value === 'Activo' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
        {String(value)}
      </span>
    ) },
    { 
      key: "actions", 
      label: "Acciones", 
      render: (_: unknown, item: Record<string, unknown>) => (
        <div className="flex gap-1 justify-end flex-wrap">
          <Button onClick={() => window.location.href = `/employees/${item.id}`} variant="ghost" small>Ver</Button>
          {can('employees:edit') && (
            <>
              <Button onClick={() => openEdit(item as Employee)} variant="ghost" small>Editar</Button>
              <Button onClick={() => setDeleteId(item.id as number)} small>Eliminar</Button>
            </>
          )}
        </div>
      )
    }
  ], [openEdit, can])

  if (loading || authLoading) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">{authLoading ? 'Verificando permisos...' : 'Cargando...'}</div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!isAuthenticated) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso denegado</div>
            <div className="text-white/60">Debes iniciar sesión para gestionar empleados.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  // Show access denied if user doesn't have required permissions
  if (!can('employees:view')) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-white/60 mb-4">No tienes permisos para ver esta página</div>
            <div className="text-white/40 text-sm">Solo los administradores pueden gestionar empleados</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.05}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Empleados</h1>
          <p className="text-white/70">Gestión de personal y directorio interno</p>
        </div>
      </FadeInUp>
      <FadeInUp delay={0.1}>
        <div className="mb-6 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm text-white/70 mb-1">Nombre</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-white/70 mb-1">Apellido</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-white/70 mb-1">Área</label>
          <SearchableSelect 
            value={area} 
            onChange={setArea} 
            options={[{ value: "", label: "Todas" }, ...areas.map(a => ({ value: a, label: a }))]}
            searchPlaceholder="Buscar área..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportExcel} variant="ghost">Excel</Button>
          <Button onClick={handleExportPDF} variant="ghost">PDF</Button>
          {can('employees:create') && (
            <Button onClick={() => openCreate()} variant="ghost">Nuevo</Button>
          )}
        </div>
        </div>
        </div>
      </FadeInUp>

      {/* Separator line between filters and content */}
      <div className="mb-8 border-b border-white/10"></div>

      {apiError && <FadeInUp delay={0.2}><div className="mb-4 text-red-400 text-sm">{apiError}</div></FadeInUp>}

      {/* Desktop Table */}
      <FadeInUp delay={0.3} className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/70">
              <th className="p-3">Nombre</th>
              <th className="p-3">Apellido</th>
              <th className="p-3">Área</th>
              <th className="p-3">Email</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Estado</th>
              <th className="p-3 w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={7}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-3" colSpan={7}>Sin resultados</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="p-3">{p.firstName}</td>
                  <td className="p-3">{p.lastName}</td>
                  <td className="p-3">{p.area || "-"}</td>
                  <td className="p-3">{p.email || "-"}</td>
                  <td className="p-3">{p.phone || "-"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'Activo' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <Button onClick={() => window.location.href = `/employees/${p.id}`} variant="ghost" small>Ver</Button>
                    {can('employees:edit') && (
                      <>
                        <Button onClick={() => openEdit(p)} variant="ghost" small>Editar</Button>
                        <Button onClick={() => setDeleteId(p.id)} small>Eliminar</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </FadeInUp>

      {/* Mobile Cards */}
      <FadeInUp delay={0.3} className="md:hidden">
        <MobileTable 
          data={filtered} 
          columns={mobileColumns}
          loading={loading}
          emptyMessage="Sin empleados encontrados"
        />
      </FadeInUp>

      <Modal open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "Activo" }) }} title={editing ? "Editar empleado" : "Nuevo empleado"} footer={(
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "Activo" }) }} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cancelar</button>
          <button onClick={() => save()} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">Guardar</button>
        </div>
      )}>
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/70 mb-1">Nombre</label>
            <input value={form.firstName ?? ""} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Apellido</label>
            <input value={form.lastName ?? ""} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Puesto</label>
            <input value={form.position ?? ""} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Área</label>
            <SearchableSelect 
              value={form.area ?? ""} 
              onChange={(v) => setForm({ ...form, area: v })} 
              options={[{ value: "", label: "-- Seleccionar --" }, ...areas.map(a => ({ value: a, label: a }))]}
              searchPlaceholder="Buscar área..."
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Teléfono</label>
            <input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Estado</label>
            <Select value={form.status ?? "Activo"} onChange={(v) => setForm({ ...form, status: v })} options={statusOptions.map(s => ({ value: s, label: s }))} />
          </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar empleado"
        description="Esta acción no se puede deshacer"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) { await remove(deleteId); setDeleteId(null) } }}
      />
    </AnimatedContainer>
  )
}

export default memo(EmployeesPage)
