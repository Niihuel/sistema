"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"

type Area = { id: number; name: string }

type Paged<T> = { total: number; page: number; perPage: number; items: T[] }

export default function AreasPage() {
  const [items, setItems] = useState<Area[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [editing, setEditing] = useState<Area | null>(null)
  const [name, setName] = useState("")

  const perPage = 20
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total])

  const load = useCallback(async (p = page) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), perPage: String(perPage) })
      if (q) params.set("q", q)
      const res = await fetch(`/api/areas?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Error cargando áreas")
      const data = (await res.json()) as Paged<Area>
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, q])

  useEffect(() => { void load(1) }, [load])

  function openCreate() {
    setEditing(null)
    setName("")
  }

  function openEdit(a: Area) {
    setEditing(a)
    setName(a.name)
  }

  async function save() {
    setError(null)
    try {
      if (!name.trim() || name.trim().length < 2) throw new Error("Nombre demasiado corto")
      let res: Response
      if (editing) {
        res = await fetch(`/api/areas/${editing.id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name  
      }) })
      } else {
        res = await fetch(`/api/areas`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name  
      }) })
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Error guardando área")
      setEditing(null)
      setName("")
      await load(1)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    }
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar área?")) return
    setError(null)
    const res = await fetch(`/api/areas/${id}`, {
        method: 'DELETE'
      })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || "Error eliminando")
      return
    }
    await load(1)
  }

  return (
    <div className="text-white px-2 sm:px-0">
      {/* Header with title and description */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Áreas</h1>
        <p className="text-white/70">Gestión de áreas organizacionales</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm text-white/70 mb-1">Buscar</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" placeholder="Nombre de área" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load(1)} className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90">Filtrar</button>
          <button onClick={() => openCreate()} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Nueva</button>
        </div>
      </div>

      {/* Separator line between filters and content */}
      <div className="mb-8 border-b border-white/10"></div>

      {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/70">
              <th className="p-3">Área</th>
              <th className="p-3 w-28">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={2}>Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-3" colSpan={2}>Sin resultados</td></tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-t border-white/10">
                  <td className="p-3">{a.name}</td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEdit(a)} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20">Editar</button>
                    <button onClick={() => void remove(a.id)} className="px-3 py-1 rounded-md bg-white text-black hover:bg-white/90">Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* paginación */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <button onClick={() => void load(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40">Anterior</button>
        <span className="text-white/70">Página {page} / {totalPages}</span>
        <button onClick={() => void load(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-40">Siguiente</button>
      </div>

      {/* formulario */}
      <div className="mt-8 max-w-lg space-y-3 p-4 rounded-lg border border-white/10 bg-white/5">
        <h2 className="text-lg font-medium">{editing ? "Editar área" : "Nueva área"}</h2>
        <div>
          <label className="block text-sm text-white/70 mb-1">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => void save()} className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90">Guardar</button>
          {editing && <button onClick={() => { setEditing(null); setName("") }} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Cancelar</button>}
        </div>
      </div>
    </div>
  )
}
