"use client"

import { useEffect, useState } from "react"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import Button from "@/components/button"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import MobileTable from "@/components/mobile-table"

type Replacement = {
  id: number
  printerId: number
  consumableId?: number | null
  replacementDate: string
  completionDate?: string | null
  rendimientoDays?: number | null
  notes?: string | null
}

export default function ReplacementsPage() {
  const [items, setItems] = useState<Replacement[]>([])
  const [printerId, setPrinterId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Replacement>>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    setError(null)
    try {
      const params = new URLSearchParams()
      if (printerId) params.set("printerId", printerId)
      const res = await fetch(`/api/replacements?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Error cargando reemplazos")
      setItems(await res.json())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    setError(null)
    try {
      const payload = {
        printerId: Number(form.printerId),
        consumableId: form.consumableId ?? null,
        replacementDate: form.replacementDate ?? new Date().toISOString(),
        completionDate: form.completionDate ?? null,
        rendimientoDays: form.rendimientoDays ?? null,
        notes: form.notes ?? null,
      }
      const res = await fetch(`/api/replacements`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)  
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error guardando")
      setForm({})
      setIsFormOpen(false)
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    }
  }

  const mobileColumns = [
    { key: "printerId", label: "Printer" },
    { key: "consumableId", label: "Consumible", render: (value: unknown) => String(value || "-") },
    { key: "replacementDate", label: "Fecha reemplazo", render: (value: unknown) => new Date(value as string).toLocaleDateString() },
    { key: "completionDate", label: "Fin", render: (value: unknown) => value ? new Date(value as string).toLocaleDateString() : "-" },
    { key: "rendimientoDays", label: "Rend. (días)", render: (value: unknown) => String(value || "-") },
    { 
      key: "actions", 
      label: "Acciones", 
      render: (_: unknown, item: Record<string, unknown>) => (
        <div className="flex gap-2 justify-end">
          <Button onClick={() => setDeleteId(item.id as number)} small>Eliminar</Button>
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
          <label className="block text-sm text-white/70 mb-1">Printer ID</label>
          <input value={printerId} onChange={(e) => setPrinterId(e.target.value)} className="px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
        </div>
        <Button onClick={() => load()}>Filtrar</Button>
        <Button onClick={() => setIsFormOpen(true)} variant="ghost">Nuevo</Button>
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
              <th className="p-3">Printer</th>
              <th className="p-3">Consumible</th>
              <th className="p-3">Fecha reemplazo</th>
              <th className="p-3">Fin</th>
              <th className="p-3">Rend. (días)</th>
              <th className="p-3">Notas</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td className="p-3" colSpan={6}>Sin datos</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3">{r.printerId}</td>
                <td className="p-3">{r.consumableId ?? "-"}</td>
                <td className="p-3">{new Date(r.replacementDate).toLocaleDateString()}</td>
                <td className="p-3">{r.completionDate ? new Date(r.completionDate).toLocaleDateString() : "-"}</td>
                <td className="p-3">{r.rendimientoDays ?? "-"}</td>
                <td className="p-3 flex gap-2">{r.notes ?? "-"}
                  <Button onClick={() => setDeleteId(r.id)} small className="ml-2">Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </FadeInUp>

      {/* Mobile Cards */}
      <FadeInUp delay={0.3} className="md:hidden">
        <MobileTable 
          data={items} 
          columns={mobileColumns}
          loading={false}
          emptyMessage="Sin reemplazos registrados"
        />
      </FadeInUp>

      <Modal open={isFormOpen} onClose={() => { setIsFormOpen(false); setForm({}) }} title="Nuevo reemplazo" footer={(
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={() => { setIsFormOpen(false); setForm({}) }} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cancelar</button>
          <button onClick={() => save()} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">Guardar</button>
        </div>
      )}>
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/70 mb-1">Printer ID</label>
            <input value={form.printerId ?? ""} onChange={(e) => setForm({ ...form, printerId: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Consumible ID</label>
            <input value={form.consumableId ?? ""} onChange={(e) => setForm({ ...form, consumableId: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Fecha reemplazo</label>
            <input type="date" value={form.replacementDate ? form.replacementDate.slice(0,10) : ""} onChange={(e) => setForm({ ...form, replacementDate: new Date(e.target.value).toISOString() })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Fecha fin</label>
            <input type="date" value={form.completionDate ? form.completionDate.slice(0,10) : ""} onChange={(e) => setForm({ ...form, completionDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Rendimiento (días)</label>
            <input type="number" value={form.rendimientoDays ?? ""} onChange={(e) => setForm({ ...form, rendimientoDays: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-white/70 mb-1">Notas</label>
            <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" rows={3} />
          </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar reemplazo"
        description="Esta acción no se puede deshacer"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) { await fetch(`/api/replacements?id=${deleteId}`, {
        method: 'DELETE'
      }).catch(() => {}); setDeleteId(null); await load() } }}
      />
    </AnimatedContainer>
  )
}

