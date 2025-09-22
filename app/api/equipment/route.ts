import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"
import { 
  equipmentFilterSchema, 
  createEquipmentSchema,
  validateRequest 
} from "@/lib/validations"

export async function GET(req: NextRequest) {
  try {
    // En desarrollo permitimos listar sin auth para facilitar pruebas
    const isDev = process.env.NODE_ENV !== "production"
    if (!isDev) {
      const ctx = requireAuth(req)
      requireRole(ctx, ["TECHNICIAN", "ADMIN"]) // lectura para staff
    }
    
    const { searchParams } = new URL(req.url)
    const filters = Object.fromEntries(searchParams.entries())
    
    // Validar filtros
    const validation = validateRequest(equipmentFilterSchema, filters)
    if (!validation.success) return validation.error
    
    const { type, status, location, area, assignedToId, search } = validation.data

    const where = {
      AND: [
        type ? { type } : {},
        status ? { status } : {},
        location ? { location: { contains: location, mode: "insensitive" as const } } : {},
        area ? { area: { contains: area, mode: "insensitive" as const } } : {},
        assignedToId ? { assignedToId } : {},
        search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { serialNumber: { contains: search, mode: "insensitive" as const } },
            { ip: { contains: search, mode: "insensitive" as const } },
            { macAddress: { contains: search, mode: "insensitive" as const } },
          ]
        } : {},
      ],
    }
    
    const items = await prisma.equipment.findMany({ 
      where, 
      orderBy: { id: "desc" },
      include: {
        assignedTo: true
      }
    })
    
    return NextResponse.json(items)
  } catch (e) {
    if (e instanceof Response) return e
    // Si la DB no está disponible en desarrollo, devolvemos lista vacía
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: "Error listando equipos" }, { status: 500 })
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
    
    // Validar datos con Zod
    const validation = validateRequest(createEquipmentSchema, data)
    if (!validation.success) return validation.error
    
    const validatedData = validation.data
    
    // Verificar si el serial number ya existe si fue proporcionado
    if (validatedData.serialNumber) {
      const existing = await prisma.equipment.findUnique({
        where: { serialNumber: validatedData.serialNumber }
      })
      if (existing) {
        return NextResponse.json(
          { error: "El número de serie ya existe" },
          { status: 400 }
        )
      }
    }
    
    // Crear el equipo con los datos validados
    const equipment = await prisma.equipment.create({ 
      data: {
        ...validatedData,
        purchaseDate: validatedData.purchaseDate 
          ? new Date(validatedData.purchaseDate) 
          : null
      },
      include: {
        assignedTo: true
      }
    })
    
    return NextResponse.json(equipment, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    console.error('Error creating equipment:', e)
    return NextResponse.json(
      { error: "Error creando equipo" },
      { status: 500 }
    )
  }
}


