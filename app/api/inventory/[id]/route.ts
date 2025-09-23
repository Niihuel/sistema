import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params
    const id = parseInt(idParam)
    const data = await request.json()

    const item = await prisma.inventoryItem.update({
      where: { id },
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
        assignedToId: data.assignedToId || null
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

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Error al actualizar item del inventario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params
    const id = parseInt(idParam)

    await prisma.inventoryItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Error al eliminar item del inventario' },
      { status: 500 }
    )
  }
}
