import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    requireAuth(req)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") as string | null
    const priority = searchParams.get("priority") as string | null
    const technicianId = searchParams.get("technicianId")
    const where = {
      AND: [
        status ? { status } : {},
        priority ? { priority } : {},
        technicianId ? { technicianId: Number(technicianId) } : {},
      ],
    }
    const items = await withDatabase(async (prisma) => {
      return await prisma.ticket.findMany({ where, orderBy: { id: "desc" } })
    })
    return Response.json(items)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error listando tickets" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAuth(req)
    const data = await req.json()
    if (!data?.requestorId) {
      return Response.json({ error: "requestorId requerido" }, { status: 400 })
    }
    const priority = String(data?.priority ?? "MEDIUM").toUpperCase()
    if (!["LOW","MEDIUM","HIGH","URGENT"].includes(priority)) {
      return Response.json({ error: "Prioridad inválida" }, { status: 400 })
    }
    const status = String(data?.status ?? "OPEN").toUpperCase()
    if (!["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].includes(status)) {
      return Response.json({ error: "Estado inválido" }, { status: 400 })
    }
    const payload = {
      title: String(data?.title ?? "Ticket"),
      description: data?.description ? String(data.description) : null,
      requestorId: Number(data.requestorId),
      technicianId: data?.technicianId ? Number(data.technicianId) : null,
      solution: data?.solution ? String(data.solution) : null,
      // Nuevos campos agregados
      category: data?.category ? String(data.category) : null,
      area: data?.area ? String(data.area) : null,
      ipAddress: data?.ipAddress ? String(data.ipAddress) : null,
      resolutionTime: data?.resolutionTime ? String(data.resolutionTime) : null,
      priority,
      status,
    }
    const ticket = await withDatabase(async (prisma) => {
      return await prisma.ticket.create({ data: payload })
    })
    return Response.json(ticket, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando ticket" }, { status: 500 })
  }
}


