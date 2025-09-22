"use client"

import { useEffect, useState } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import CustomNotification from "@/components/notification"

type Role = { id: number; name: string }
type Permission = { id: number; roleId: number; resource: string; level: string }

type UserLite = { id: number; username: string }

enum Level { READ = "READ", WRITE = "WRITE", ADMIN = "ADMIN" }

export default function RolesPage() {
  const [roles, setRoles] = useState<(Role & { permissions?: Permission[] })[]>([])
  const [users, setUsers] = useState<UserLite[]>([])
  const [error, setError] = useState<string | null>(null)

  const [newRole, setNewRole] = useState("")
  const [assign, setAssign] = useState<{ userId?: number; roleId?: number }>({})

  // Modal de permisos por rol
  const [openPermModal, setOpenPermModal] = useState(false)
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const [newPermission, setNewPermission] = useState<{ resource: string; level: string }>({ resource: "", level: "READ" })
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; permission?: Permission; role?: Role } | null>({ open: false })
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function load() {
    setError(null)
    try {
      const [r, u] = await Promise.all([
        fetch("/api/roles", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ])
      if (!r.ok) throw new Error("Error cargando roles")
      if (!u.ok) throw new Error("Error cargando usuarios")
      setRoles(await r.json())
      setUsers(await u.json())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    }
  }

  useEffect(() => { void load() }, [])

  async function createRole() {
    setError(null)
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole  
      }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error creando rol")
      setNewRole("")
      await load()
      setNotification({ type: 'success', message: 'Rol creado correctamente' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
      setNotification({ type: 'error', message: msg })
    }
  }

  async function addPermission() {
    setError(null)
    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: activeRole?.id, ...newPermission  
      }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error creando permiso")
      setNewPermission({ resource: "", level: "READ" })
      await load()
      setNotification({ type: 'success', message: 'Permiso agregado correctamente' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
      setNotification({ type: 'error', message: msg })
    }
  }

  async function removePermission(p: Permission) {
    setError(null)
    try {
      const res = await fetch(`/api/permissions/${p.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Error eliminando permiso")
      }
      await load()
      setNotification({ type: 'success', message: 'Permiso eliminado correctamente' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
      setNotification({ type: 'error', message: msg })
    }
  }

  async function removeRole(roleId: number) {
    setError(null)
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Error eliminando rol")
      }
      await load()
      setNotification({ type: 'success', message: 'Rol eliminado correctamente' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
      setNotification({ type: 'error', message: msg })
    }
  }

  async function assignRole() {
    setError(null)
    try {
      const res = await fetch(`/api/users/${assign.userId}/roles`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: assign.roleId  
      }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error asignando rol")
      setAssign({})
      setNotification({ type: 'success', message: 'Rol asignado correctamente' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
      setNotification({ type: 'error', message: msg })
    }
  }

  return (
    <div className="text-white px-2 sm:px-0">
      {/* Header with title and description */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Roles y Permisos</h1>
        <p className="text-white/70">Gestión de roles de usuario y permisos del sistema</p>
      </div>

      {/* Separator line between header and content */}
      <div className="mb-8 border-b border-white/10"></div>

      {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="font-medium mb-2">Crear Rol</h3>
          <div className="flex gap-2">
            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} className="px-3 py-2 rounded-md bg-black/30 border border-white/10" placeholder="ADMIN, TECHNICIAN..." />
            <button onClick={() => void createRole()} className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90">Crear</button>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="font-medium mb-2">Asignar Rol a Usuario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select value={assign.userId ?? ''} onChange={(e) => setAssign({ ...assign, userId: Number(e.target.value) })} className="px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer">
              <option value="">Usuario</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
            <select value={assign.roleId ?? ''} onChange={(e) => setAssign({ ...assign, roleId: Number(e.target.value) })} className="px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer">
              <option value="">Rol</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button onClick={() => void assignRole()} className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90">Asignar</button>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-white/10 bg-white/5 lg:col-span-2">
          <h3 className="font-medium mb-2">Roles</h3>
          <div className="space-y-3">
            {roles.map(r => (
              <div key={r.id} className="rounded-md border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-white/70">Permisos: {r.permissions?.length ?? 0}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveRole(r); setOpenPermModal(true) }} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20">Gestionar permisos</button>
                    <button onClick={() => setConfirmDelete({ open: true, role: r })} className="px-3 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal permisos por rol */}
      <Modal open={openPermModal} onClose={() => setOpenPermModal(false)} title={`Permisos: ${activeRole?.name ?? ''}`} footer={(
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={() => setOpenPermModal(false)} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cerrar</button>
        </div>
      )}>
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={newPermission.resource} onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value.toUpperCase() })} placeholder="RESOURCE" className="px-3 py-2 rounded-md bg-black/30 border border-white/10" />
            <select value={newPermission.level} onChange={(e) => setNewPermission({ ...newPermission, level: e.target.value })} className="px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none cursor-pointer">
              {Object.values(Level).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => void addPermission()} className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90">Agregar</button>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/70">
                  <th className="p-2">Recurso</th>
                  <th className="p-2">Nivel</th>
                  <th className="p-2 w-20">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.find(r => r.id === activeRole?.id)?.permissions?.map(p => (
                  <tr key={p.id} className="border-t border-white/10">
                    <td className="p-2">{p.resource}</td>
                    <td className="p-2">{p.level}</td>
                    <td className="p-2">
                      <button onClick={() => setConfirmDelete({ open: true, permission: p })} className="px-2 py-1 rounded-md bg-white text-black hover:bg-white/90">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete?.open}
        title={confirmDelete?.permission ? "Eliminar permiso" : "Eliminar rol"}
        description={confirmDelete?.permission 
          ? `¿Eliminar ${confirmDelete.permission.resource}:${confirmDelete.permission.level}?`
          : `¿Eliminar rol ${confirmDelete?.role?.name}? Esta acción no se puede deshacer.`
        }
        onCancel={() => setConfirmDelete({ open: false })}
        onConfirm={async () => { 
          if (confirmDelete?.permission) { 
            await removePermission(confirmDelete.permission); 
            setConfirmDelete({ open: false }) 
          } else if (confirmDelete?.role) {
            await removeRole(confirmDelete.role.id);
            setConfirmDelete({ open: false })
          }
        }}
      />

      {notification && (
        <CustomNotification
          type={notification.type}
          message={notification.message}
          isVisible={notification !== null}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
