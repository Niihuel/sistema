"use client"

import { useEffect, useMemo, useState } from "react"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import Button from "@/components/button"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import MobileTable from "@/components/mobile-table"
import { usePermissionsV2 } from "@/lib/hooks/usePermissionsV2"
import { useToast } from "@/lib/hooks/use-toast"

type Purchase = {
  id: number
  requestId?: string | null
  itemName: string
  requestedQty: number
  requestedDate?: string | null
  receivedQty: number
  receivedDate?: string | null
  pendingQty: number
  status: string
}

const statusOptions = ["PENDING", "PARTIAL", "RECEIVED", "CANCELLED"]

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'RECEIVED':
      return 'bg-green-500/10 text-green-400'
    case 'PARTIAL':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'PENDING':
      return 'bg-blue-500/10 text-blue-400'
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-400'
    default:
      return 'bg-gray-500/10 text-gray-400'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Pendiente'
    case 'PARTIAL': return 'Parcial'
    case 'RECEIVED': return 'Recibido'
    case 'CANCELLED': return 'Cancelado'
    default: return status
  }
}

export default function PurchasesPage() {
  const { user, loading: authLoading, can, hasRole } = usePermissionsV2()
  const { showPermissionError } = usePermissionToast()
  const [items, setItems] = useState<Purchase[]>([])
  const [status, setStatus] = useState<string | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Purchase | null>(null)
  const [form, setForm] = useState<Partial<Purchase>>({ status: "PENDING", requestedQty: 0, receivedQty: 0, pendingQty: 0 })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  // Toast notifications
  const { showSuccess, showError } = useToast()

  const filtered = useMemo(() => {
    let result = items
    if (status) {
      result = result.filter(item => item.status === status)
    }
    return result
  }, [items, status])

  if (loading || authLoading) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">{authLoading ? 'Verificando permisos...' : 'Cargando...'}</div>
        </div>
      </AnimatedContainer>
    )
  }

  // Show access denied if user doesn't have required permissions
  if (!can('purchases:view')) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-white/60 mb-4">No tienes permisos para ver esta página</div>
            <div className="text-white/40 text-sm">Contacta al administrador para obtener acceso</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      const res = await fetch(`/api/purchases?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Error cargando compras")
      setItems(await res.json())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ status: "PENDING", requestedQty: 0, receivedQty: 0, pendingQty: 0 })
    setIsFormOpen(true)
  }

  function openEdit(p: Purchase) {
    setEditing(p)
    setForm(p)
    setIsFormOpen(true)
  }

  async function save() {
    // Check permissions
    if (!can('purchases:edit')) {
      showPermissionError('No tienes permisos para gestionar compras')
      return
    }
    
    setError(null)
    try {
      const payload = {
        requestId: form.requestId || null,
        itemName: form.itemName ?? "",
        requestedQty: Number(form.requestedQty ?? 0),
        requestedDate: form.requestedDate || null,
        receivedQty: Number(form.receivedQty ?? 0),
        receivedDate: form.receivedDate || null,
        pendingQty: Number(form.pendingQty ?? 0),
        status: form.status || "PENDING",
      }
      let res: Response
      if (editing) {
        res = await fetch(`/api/purchases/${editing.id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)  
      })
      } else {
        res = await fetch(`/api/purchases`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)  
      })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error guardando")
      setEditing(null)
      setIsFormOpen(false)
      showSuccess(editing ? 'Compra actualizada correctamente' : 'Compra creada correctamente')
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
      showError(msg)
    }
  }

  async function remove(id: number) {
    // Check permissions
    if (!can('purchases:edit')) {
      showPermissionError('No tienes permisos para eliminar compras')
      return
    }
    
    setError(null)
    const res = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE'
      })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || "Error eliminando")
      showError(data?.error || "Error eliminando")
      return
    }
    showSuccess('Compra eliminada correctamente')
    await load()
  }

  const mobileColumns = [
    { key: "requestId", label: "ReqID", render: (value: unknown) => String(value || "-") },
    { key: "itemName", label: "Item" },
    { key: "requestedQty", label: "Pedida" },
    { key: "receivedQty", label: "Recibida" },
    { key: "pendingQty", label: "Pendiente" },
    { key: "status", label: "Estado", render: (value: unknown) => (
      <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(String(value))}`}>
        {getStatusLabel(String(value))}
      </span>
    ) },
    { 
      key: "actions", 
      label: "Acciones", 
      render: (_: unknown, item: Record<string, unknown>) => (
        <div className="flex gap-2 justify-end">
          <PermissionGuard roles={['ADMIN', 'TECHNICIAN']} showToast={false}>
            <Button onClick={() => openEdit(item as Purchase)} variant="ghost" small>Editar</Button>
            <Button onClick={() => setDeleteId(item.id as number)} small>Eliminar</Button>
          </PermissionGuard>
        </div>
      )
    }
  ]

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.1}>
        <div className="mb-6 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-end gap-3">
        <div>
          <label className="block text-sm text-white/70 mb-1">Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer">
            <option value="">Todos</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => load()}>Filtrar</Button>
        <PermissionGuard roles={['ADMIN', 'TECHNICIAN']} showToast={false}>
          <Button onClick={() => openCreate()} variant="ghost">Nuevo</Button>
        </PermissionGuard>
        </div>
        </div>
      </FadeInUp>

      {/* Separator line between filters and content */}
      <div className="mb-8 border-b border-white/10"></div>
      {error && <FadeInUp delay={0.2}><div className="mb-4 text-red-400 text-sm">{error}</div></FadeInUp>}

      {/* Desktop Table */}
      <FadeInUp delay={0.3} className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/70">
              <th className="p-3">ReqID</th>
              <th className="p-3">Item</th>
              <th className="p-3">Pedida</th>
              <th className="p-3">Recibida</th>
              <th className="p-3">Pendiente</th>
              <th className="p-3">Estado</th>
              <th className="p-3 w-24">Acciones</th>
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
                  <td className="p-3">{p.requestId || "-"}</td>
                  <td className="p-3">{p.itemName}</td>
                  <td className="p-3">{p.requestedQty}</td>
                  <td className="p-3">{p.receivedQty}</td>
                  <td className="p-3">{p.pendingQty}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <PermissionGuard roles={['ADMIN', 'TECHNICIAN']} showToast={false}>
                      <Button onClick={() => openEdit(p)} variant="ghost" small>Editar</Button>
                      <Button onClick={() => setDeleteId(p.id)} small>Eliminar</Button>
                    </PermissionGuard>
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
          emptyMessage="Sin órdenes encontradas"
        />
      </FadeInUp>

      <Modal open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "PENDING", requestedQty: 0, receivedQty: 0, pendingQty: 0 }) }} title={editing ? "Editar compra" : "Nueva compra"} footer={(
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "PENDING", requestedQty: 0, receivedQty: 0, pendingQty: 0 }) }} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cancelar</button>
          <button onClick={() => save()} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">Guardar</button>
        </div>
      )}>
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/70 mb-1">ReqID</label>
            <input value={form.requestId ?? ""} onChange={(e) => setForm({ ...form, requestId: e.target.value })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Item</label>
            <input value={form.itemName ?? ""} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Cantidad pedida</label>
            <input type="number" value={form.requestedQty ?? 0} onChange={(e) => setForm({ ...form, requestedQty: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Fecha pedido</label>
            <input type="date" value={form.requestedDate ? form.requestedDate.slice(0,10) : ""} onChange={(e) => setForm({ ...form, requestedDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Cant. recibida</label>
            <input type="number" value={form.receivedQty ?? 0} onChange={(e) => setForm({ ...form, receivedQty: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Fecha recibido</label>
            <input type="date" value={form.receivedDate ? form.receivedDate.slice(0,10) : ""} onChange={(e) => setForm({ ...form, receivedDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Pendiente</label>
            <input type="number" value={form.pendingQty ?? 0} onChange={(e) => setForm({ ...form, pendingQty: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Estado</label>
            <select value={form.status ?? "PENDING"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer">
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar compra"
        description="Esta acción no se puede deshacer"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) { await remove(deleteId); setDeleteId(null) } }}
      />

      )}
    </AnimatedContainer>
  )
}

