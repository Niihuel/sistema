import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["TECHNICIAN", "ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    
    // Check if we need to include all relationships
    const url = new URL(req.url)
    const includeAll = url.searchParams.get('include') === 'all'
    
    const includeOptions = includeAll ? {
      equipmentAssigned: true,
      inventoryAssigned: true,
      ticketsRequested: true,
      ticketsAssigned: true,
      windowsAccounts: true,
      qnapAccounts: true,
      calipsoAccounts: true,
      emailAccounts: true,
      purchaseRequests: true
    } : {
      equipmentAssigned: true,
      ticketsRequested: true,
      ticketsAssigned: true
    }
    
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: includeOptions,
    })
    if (!employee) return new Response("Not Found", { status: 404 })
    return Response.json(employee)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo empleado" }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["TECHNICIAN", "ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()
    const employee = await prisma.employee.update({ where: { id }, data })
    return Response.json(employee)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando empleado" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.employee.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando empleado" }, { status: 500 })
  }
}


