import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const backups = await prisma.backupLog.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Mapear backupType a diskUsed y convertir bytes a GB
    const mappedBackups = backups.map((backup: any) => ({
      ...backup,
      diskUsed: backup.backupType,
      sizeBytes: backup.sizeBytes ? Number((Number(backup.sizeBytes) / (1024 ** 3)).toFixed(2)) : null
    }))

    return NextResponse.json(mappedBackups)
  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros de backup' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Auto-generar nombre si no se proporciona
    const today = new Date()
    const autoName = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
    
    const backup = await prisma.backupLog.create({
      data: {
        backupName: data.backupName || autoName,
        backupType: data.diskUsed, // Usar diskUsed como backupType
        source: '', // Campo requerido por el modelo, usar vacío
        destination: '', // Campo requerido por el modelo, usar vacío
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

    return NextResponse.json(serializedBackup, { status: 201 })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Error al crear registro de backup' },
      { status: 500 }
    )
  }
}
