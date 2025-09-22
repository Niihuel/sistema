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

    const account = await prisma.qnapAccount.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        username: data.username,
        password: data.password || null,
        userGroup: data.userGroup || null,
        folderPermissions: data.folderPermissions || null,
        quotaLimit: data.quotaLimit || null,
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
    console.error('Error updating QNAP account:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cuenta de QNAP' },
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

    await prisma.qnapAccount.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting QNAP account:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cuenta de QNAP' },
      { status: 500 }
    )
  }
}
