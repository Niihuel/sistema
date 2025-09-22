import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { error: 'Error al obtener items del inventario' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        quantity: data.quantity,
        location: data.location || null,
        status: data.status,
        condition: data.condition,
        notes: data.notes || null,
        assignedToId: data.assignedToId || null,
        isPersonalProperty: data.isPersonalProperty || false
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Error al crear item del inventario' },
      { status: 500 }
    )
  }
}
