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

    const account = await prisma.windowsAccount.update({
      where: { id },
      data: {
        employeeId: data.employeeId,
        username: data.username,
        domain: data.domain || null,
        password: data.password || null,
        profilePath: data.profilePath || null,
        homeDirectory: data.homeDirectory || null,
        groups: data.groups || null,
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
    console.error('Error updating Windows account:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cuenta de Windows' },
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

    await prisma.windowsAccount.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Windows account:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cuenta de Windows' },
      { status: 500 }
    )
  }
}
