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

    const account = await prisma.calipsoAccount.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        username: data.username,
        password: data.password || null,
        profile: data.profile || null,
        permissions: data.permissions || null,
        modules: data.modules || null,
        isActive: data.isActive ?? true,
        notes: data.notes || null
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            area: true
          }
        }
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating Calipso account:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cuenta de Calipso' },
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

    await prisma.calipsoAccount.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Calipso account:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cuenta de Calipso' },
      { status: 500 }
    )
  }
}
