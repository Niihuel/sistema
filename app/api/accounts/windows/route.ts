import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const accounts = await prisma.windowsAccount.findMany({
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
    console.error('Error fetching Windows accounts:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuentas de Windows' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const account = await prisma.windowsAccount.create({
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

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating Windows account:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta de Windows' },
      { status: 500 }
    )
  }
}
