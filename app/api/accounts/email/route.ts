import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const accounts = await prisma.emailAccount.findMany({
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
    console.error('Error fetching Email accounts:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuentas de email' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const account = await prisma.emailAccount.create({
      data: {
        employeeId: data.employeeId,
        email: data.email,
        password: data.password || null,
        accountType: data.accountType || 'PRETENSA',
        forwardingTo: data.forwardingTo || null,
        aliases: data.aliases || null,
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
    console.error('Error creating Email account:', error)
    return NextResponse.json(
      { error: 'Error al crear cuenta de email' },
      { status: 500 }
    )
  }
}
