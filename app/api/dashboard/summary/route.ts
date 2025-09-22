import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    try {
      requireAuth(req)
    } catch (authError) {
      // En desarrollo, continuamos sin auth para demos
      if (process.env.NODE_ENV === "production") {
        console.error("Auth error in dashboard:", authError)
        return new Response("Unauthorized", { status: 401 })
      }
      console.log("Running in development mode without auth")
    }

    const [openTickets, totalEquipment, activeEmployees, equipmentByStatus, printersByStatus] = await withDatabase(
      async (prisma) => {
        const [tickets, equipment, employees, equipmentStatus, printersStatus] = await Promise.all([
          prisma.ticket.count({ where: { status: "OPEN" } }).catch(() => 0),
          prisma.equipment.count().catch(() => 0),
          prisma.employee.count({ where: { status: "ACTIVE" } }).catch(() => 0),
          prisma.equipment
            .groupBy({ by: ["status"], _count: { _all: true } })
            .then((rows: any[]) => rows.map((r) => ({ name: r.status, value: r._count._all })))
            .catch(() => [] as { name: string; value: number }[]),
          prisma.printer
            .groupBy({ by: ["status"], _count: { _all: true } })
            .then((rows: any[]) => rows.map((r) => ({
              name: r.status === 'ACTIVE' ? 'Activo' : r.status,
              value: r._count._all
            })))
            .catch(() => [] as { name: string; value: number }[])
        ])

        return [tickets, equipment, employees, equipmentStatus, printersStatus]
      },
      // Fallback con datos de demo cuando no hay base de datos
      async () => {
        return [
          5, // openTickets
          12, // totalEquipment
          8, // activeEmployees
          [{ name: 'Activo', value: 8 }, { name: 'En Reparación', value: 2 }, { name: 'Inactivo', value: 2 }], // equipmentByStatus
          [{ name: 'Activo', value: 4 }, { name: 'Inactivo', value: 1 }] // printersByStatus
        ]
      }
    )

    // Temporarily simplified to avoid Prisma client issues
    const purchasesByStatus: { name: string; value: number }[] = []
    const ticketsByPriority: { name: string; value: number }[] = []
    const employeesByArea: { name: string; value: number }[] = []
    const inventoryByCategory: { name: string; value: number }[] = []
    const backupsByStatus: { name: string; value: number }[] = []

    return Response.json({
      openTickets,
      totalEquipment,
      activeEmployees,
      equipmentByStatus,
      printersByStatus,
      purchasesByStatus,
      ticketsByPriority,
      employeesByArea,
      inventoryByCategory,
      backupsByStatus
    })
  } catch (e) {
    if (e instanceof Response) return e
    if (process.env.NODE_ENV !== "production") {
      return Response.json({
        openTickets: 0,
        totalEquipment: 0,
        activeEmployees: 0,
        equipmentByStatus: [],
        printersByStatus: [],
        purchasesByStatus: [],
        ticketsByPriority: [],
        employeesByArea: [],
        inventoryByCategory: [],
        backupsByStatus: []
      })
    }
    return Response.json({ error: "Error en dashboard" }, { status: 500 })
  }
}


