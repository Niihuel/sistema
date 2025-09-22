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

    const backup = await prisma.backupLog.update({
      where: { id },
      data: {
        backupName: data.backupName,
        backupType: data.diskUsed, // Usar diskUsed como backupType
        status: data.status,
        sizeBytes: data.sizeBytes ? BigInt(Math.round(data.sizeBytes * (1024 ** 3))) : null,
        errorMessage: data.errorMessage || null,
        notes: data.notes || null
      }
    })

    // Convert BigInt to GB for JSON serialization and add diskUsed
    const serializedBackup = {
      ...backup,
      diskUsed: backup.backupType,
      sizeBytes: backup.sizeBytes ? Number((Number(backup.sizeBytes) / (1024 ** 3)).toFixed(2)) : null
    }

    return NextResponse.json(serializedBackup)
  } catch (error) {
    console.error('Error updating backup:', error)
    return NextResponse.json(
      { error: 'Error al actualizar registro de backup' },
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

    await prisma.backupLog.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: 'Error al eliminar registro de backup' },
      { status: 500 }
    )
  }
}
