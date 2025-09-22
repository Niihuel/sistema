import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const data = await request.json()

    const purchaseRequest = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        requestNumber: data.requestNumber || null,
        requestorId: data.requestorId || null,
        itemName: data.itemName,
        category: data.category,
        description: data.description || null,
        justification: data.justification || null,
        quantity: data.quantity,
        estimatedCost: data.estimatedCost || null,
        priority: data.priority,
        status: data.status,
        approvedBy: data.approvedBy || null,
        approvalDate: data.approvalDate ? new Date(data.approvalDate) : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        vendor: data.vendor || null,
        actualCost: data.actualCost || null,
        notes: data.notes || null
      },
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            area: true
          }
        }
      }
    })

    return NextResponse.json(purchaseRequest)
  } catch (error) {
    console.error('Error updating purchase request:', error)
    return NextResponse.json(
      { error: 'Error al actualizar solicitud de compra' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    await prisma.purchaseRequest.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase request:', error)
    return NextResponse.json(
      { error: 'Error al eliminar solicitud de compra' },
      { status: 500 }
    )
  }
}
