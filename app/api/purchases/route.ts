import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: Request) {
  try {
    requireAuth(req)
    const url = new URL(req.url)
    const status = url.searchParams.get("status") || undefined
    const where = status ? { status } : {}
    const items = await prisma.purchase.findMany({ where, orderBy: { id: "desc" } })
    return Response.json(items)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error listando compras" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["TECHNICIAN", "ADMIN"])
    const data = await req.json()
    // Validación mínima y normalización
    const payload = {
      requestId: data?.requestId ?? null,
      itemName: String(data?.itemName ?? "").trim(),
      requestedQty: Number(data?.requestedQty ?? 0),
      requestedDate: data?.requestedDate ? new Date(data.requestedDate) : null,
      receivedQty: Number(data?.receivedQty ?? 0),
      receivedDate: data?.receivedDate ? new Date(data.receivedDate) : null,
      pendingQty: Number(data?.pendingQty ?? 0),
      status: String(data?.status ?? "PENDING").toUpperCase(),
    }
    const created = await prisma.purchase.create({ data: payload })
    return Response.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando compra" }, { status: 500 })
  }
}


