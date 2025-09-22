import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"
import { getNotificationTriggers } from "@/lib/notification-triggers"

export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== "production"
    if (!isDev) {
      const ctx = requireAuth(req)
      requireRole(ctx, ["TECHNICIAN", "ADMIN"]) 
    }
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || undefined
    const printerId = searchParams.get("printerId")
    const items = await prisma.consumable.findMany({
      where: {
        AND: [
          status ? { status } : {},
          printerId ? { printerId: Number(printerId) } : {},
        ],
      },
      orderBy: { id: "desc" },
      include: { printer: true },
    })
    return Response.json(items)
  } catch (e) {
    if (e instanceof Response) return e
    if (process.env.NODE_ENV !== "production") return Response.json([])
    return Response.json({ error: "Error listando consumibles" }, { status: 500 })
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
      itemName: String(data?.itemName ?? "Consumible"),
      color: data?.color ? String(data.color) : null,
      quantityAvailable: data?.quantityAvailable ? Number(data.quantityAvailable) : 0,
      status: data?.status ? String(data.status) : "OK",
      printerId: data?.printerId ? Number(data.printerId) : null,
    }

    const consumable = await prisma.consumable.create({ data: payload })
    
    // Trigger notifications for the new consumable
    try {
      const triggers = getNotificationTriggers(prisma)
      await triggers.onConsumableChange(consumable, 'CREATE')
    } catch (notificationError) {
      console.error('Failed to trigger consumable notifications:', notificationError)
      // Don't fail the request if notifications fail
    }
    
    return Response.json(consumable, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando consumible" }, { status: 500 })
  }
}


