import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const accounts = await prisma.calipsoAccount.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            area: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching Calipso accounts:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuentas de Calipso' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const account = await prisma.calipsoAccount.create({
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

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating Calipso account:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta de Calipso' },
      { status: 500 }
    )
  }
}
