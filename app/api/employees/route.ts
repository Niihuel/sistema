import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)
    // Los permisos se verifican en el frontend, aquí solo verificamos autenticación

    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") || 1)
    const perPage = Math.min(Number(searchParams.get("perPage") || 20), 100)
    const firstName = searchParams.get("firstName") || undefined
    const lastName = searchParams.get("lastName") || undefined
    const area = searchParams.get("area") || undefined

    const where = {
      AND: [
        firstName ? { firstName: { contains: firstName, mode: "insensitive" } } : {},
        lastName ? { lastName: { contains: lastName, mode: "insensitive" } } : {},
        area ? { area: { equals: area, mode: "insensitive" } } : {},
      ],
    }

    const [total, items] = await withDatabase(async (prisma) => {
      return Promise.all([
        prisma.employee.count({ where }),
        prisma.employee.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: { id: "desc" },
        }),
      ])
    })

    return Response.json({ total, page, perPage, items })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error listando empleados" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)
    // Los permisos se verifican en el frontend, aquí solo verificamos autenticación
    const data = await req.json()

    const employee = await withDatabase(async (prisma) => {
      // Validar área si viene informada
      let area: string | undefined
      if (data?.area) {
        const name = String(data.area)
        const exists = await prisma.catalogArea.findUnique({ where: { name } })
        if (!exists) throw new Error("Área no válida")
        area = name
      }

      return await prisma.employee.create({ data: { ...data, area } })
    })
    return Response.json(employee, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando empleado" }, { status: 500 })
  }
}


