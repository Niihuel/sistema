"use client"

import { useEffect, useMemo, useState } from "react"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import Button from "@/components/button"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import MobileTable from "@/components/mobile-table"

type Consumable = {
  id: number
  itemName: string
  color?: string | null
  quantityAvailable: number
  status: string
  printerId?: number | null
}

const statusOptions = ["OK", "LOW", "OUT"]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OK': return 'bg-green-500/10 text-green-400'
    case 'LOW': return 'bg-yellow-500/10 text-yellow-400'
    case 'OUT': return 'bg-red-500/10 text-red-400'
    default: return 'bg-gray-500/10 text-gray-400'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'OK': return 'Disponible'
    case 'LOW': return 'Bajo Stock'
    case 'OUT': return 'Agotado'
    default: return status
  }
}

export default function ConsumablesPage() {
  const [items, setItems] = useState<Consumable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState<string | "">("")
  const [printerId, setPrinterId] = useState<string>("")

  const [editing, setEditing] = useState<Consumable | null>(null)
  const [form, setForm] = useState<Partial<Consumable>>({ status: "OK", quantityAvailable: 0 })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filteredItems = useMemo(() => items, [items])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      if (printerId) params.set("printerId", printerId)
      const res = await fetch(`/api/consumables?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Error cargando consumibles")
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
    setForm({ status: "OK", quantityAvailable: 0 })
    setIsFormOpen(true)
  }

  function openEdit(c: Consumable) {
    setEditing(c)
    setForm(c)
    setIsFormOpen(true)
  }

  async function save() {
    setError(null)
    try {
      const payload = {
        itemName: form.itemName ?? "",
        color: form.color || null,
        quantityAvailable: Number(form.quantityAvailable ?? 0),
        status: form.status || "OK",
        printerId: form.printerId ?? null,
      }
      let res: Response
      if (editing) {
        res = await fetch(`/api/consumables/${editing.id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      })
      } else {
        res = await fetch(`/api/consumables`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error guardando")
      setEditing(null)
      setForm({ status: "OK", quantityAvailable: 0 })
      setIsFormOpen(false)
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    }
  }

  async function remove(id: number) {
    setError(null)
    const res = await fetch(`/api/consumables/${id}`, {
        method: 'DELETE'
      })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || "Error eliminando")
      return
    }
    await load()
  }

  const mobileColumns = [
    { key: "itemName", label: "Nombre" },
    { key: "color", label: "Color", render: (value: unknown) => String(value || "-") },
    { key: "quantityAvailable", label: "Cantidad" },
    { key: "status", label: "Estado", render: (value: unknown) => (
      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(String(value))}`}>
        {getStatusLabel(String(value))}
      </span>
    ) },
    { key: "printerId", label: "Printer", render: (value: unknown) => String(value || "-") },
    { 
      key: "actions", 
      label: "Acciones", 
      render: (_: unknown, item: Record<string, unknown>) => (
        <div className="flex gap-2 justify-end">
          <Button onClick={() => openEdit(item as Consumable)} variant="ghost" small>Editar</Button>
          <Button onClick={() => setDeleteId(item.id as number)} small>Eliminar</Button>
        </div>
      )
    }
  ]

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.1}>
        <div className="mb-6 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm text-white/70 mb-1">Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer">
            <option value="">Todos</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-white/70 mb-1">Printer ID</label>
          <input value={printerId} onChange={(e) => setPrinterId(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" placeholder="ID de impresora (opcional)" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => load()}>Filtrar</Button>
          <Button onClick={() => openCreate()} variant="ghost">Nuevo</Button>
        </div>
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
              <th className="p-3">Nombre</th>
              <th className="p-3">Color</th>
              <th className="p-3">Cantidad</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Printer</th>
              <th className="p-3 w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={6}>Cargando...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td className="p-3" colSpan={6}>Sin resultados</td></tr>
            ) : (
              filteredItems.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td className="p-3">{c.itemName}</td>
                  <td className="p-3">{c.color || "-"}</td>
                  <td className="p-3">{c.quantityAvailable}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="p-3">{c.printerId ?? "-"}</td>
                  <td className="p-3 flex gap-2">
                    <Button onClick={() => openEdit(c)} variant="ghost" small>Editar</Button>
                    <Button onClick={() => setDeleteId(c.id)} small>Eliminar</Button>
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
          data={filteredItems} 
          columns={mobileColumns}
          loading={loading}
          emptyMessage="Sin consumibles encontrados"
        />
      </FadeInUp>

      <Modal open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "OK", quantityAvailable: 0 }) }} title={editing ? "Editar consumible" : "Nuevo consumible"} footer={(
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "OK", quantityAvailable: 0 }) }} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cancelar</button>
          <button onClick={() => save()} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">Guardar</button>
        </div>
      )}>
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/70 mb-1">Nombre</label>
            <input value={form.itemName ?? ""} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Color</label>
            <input value={form.color ?? ""} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Cantidad</label>
            <input type="number" value={form.quantityAvailable ?? 0} onChange={(e) => setForm({ ...form, quantityAvailable: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Estado</label>
            <select value={form.status ?? "OK"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer">
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Printer ID</label>
            <input value={form.printerId ?? ""} onChange={(e) => setForm({ ...form, printerId: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar consumible"
        description="Esta acción no se puede deshacer"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) { await remove(deleteId); setDeleteId(null) } }}
      />
    </AnimatedContainer>
  )
}

