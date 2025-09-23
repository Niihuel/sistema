import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params
    const id = parseInt(idParam)

    const printer = await prisma.printer.findUnique({
      where: { id }
    })

    if (!printer) {
      return NextResponse.json(
        { error: 'Impresora no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(printer)
  } catch (error) {
    console.error('Error fetching printer:', error)
    return NextResponse.json(
      { error: 'Error al obtener impresora' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params
    const id = parseInt(idParam)
    const data = await request.json()

    const printer = await prisma.printer.update({
      where: { id },
      data: {
        model: data.model,
        serialNumber: data.serialNumber,
        area: data.area,
        location: data.location,
        ip: data.ip || null,
        status: data.status
      }
    })

    return NextResponse.json(printer)
  } catch (error) {
    console.error('Error updating printer:', error)
    return NextResponse.json(
      { error: 'Error al actualizar impresora' },
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

    await prisma.printer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting printer:', error)
    return NextResponse.json(
      { error: 'Error al eliminar impresora' },
      { status: 500 }
    )
  }
}
