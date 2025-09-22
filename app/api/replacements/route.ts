import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== "production"
    if (!isDev) {
      const ctx = requireAuth(req)
      requireRole(ctx, ["TECHNICIAN", "ADMIN"]) 
    }
    const { searchParams } = new URL(req.url)
    const printerId = searchParams.get("printerId")
    const items = await prisma.replacement.findMany({
      where: printerId ? { printerId: Number(printerId) } : {},
      orderBy: { id: "desc" },
      include: { printer: true, consumable: true },
    })
    return Response.json(items)
  } catch (e) {
    if (e instanceof Response) return e
    if (process.env.NODE_ENV !== "production") return Response.json([])
    return Response.json({ error: "Error listando reemplazos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== "production"
    if (!isDev) {
      const ctx = requireAuth(req)
      requireRole(ctx, ["TECHNICIAN", "ADMIN"])
    }
    const data = await req.json()

    const payload = {
      printerId: Number(data?.printerId),
      consumableId: data?.consumableId ? Number(data.consumableId) : null,
      replacementDate: new Date(data?.replacementDate ?? new Date()),
      completionDate: data?.completionDate ? new Date(data.completionDate) : null,
      rendimientoDays: data?.rendimientoDays ? Number(data.rendimientoDays) : null,
      notes: data?.notes ? String(data.notes) : null,
    }

    const replacement = await prisma.replacement.create({ data: payload })
    return Response.json(replacement, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando reemplazo" }, { status: 500 })
  }
}


