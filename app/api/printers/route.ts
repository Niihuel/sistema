import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const printers = await prisma.printer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(printers)
  } catch (error) {
    console.error('Error fetching printers:', error)
    return NextResponse.json(
      { error: 'Error al obtener impresoras' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const printer = await prisma.printer.create({
      data: {
        model: data.model,
        serialNumber: data.serialNumber,
        area: data.area,
        location: data.location,
        ip: data.ip || null,
        status: data.status
      }
    })

    return NextResponse.json(printer, { status: 201 })
  } catch (error) {
    console.error('Error creating printer:', error)
    return NextResponse.json(
      { error: 'Error al crear impresora' },
      { status: 500 }
    )
  }
}


