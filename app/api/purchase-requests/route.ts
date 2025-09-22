import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const requests = await prisma.purchaseRequest.findMany({
      include: {
        requestor: {
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

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching purchase requests:', error)
    return NextResponse.json(
      { error: 'Error al obtener solicitudes de compra' },
      { status: 500 }
    )
  }
}

// Función para generar número de solicitud único
async function generateUniqueRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Buscar el último número de solicitud del año/mes actual
  const lastRequest = await prisma.purchaseRequest.findFirst({
    where: {
      requestNumber: {
        startsWith: `REQ-${currentYear}${currentMonth}-`
      }
    },
    orderBy: {
      requestNumber: 'desc'
    }
  })
  
  let nextNumber = 1
  if (lastRequest?.requestNumber) {
    // Extraer el número secuencial del último request
    const lastNumber = parseInt(lastRequest.requestNumber.split('-')[2])
    nextNumber = lastNumber + 1
  }
  
  // Generar nuevo número con formato REQ-YYYYMM-###
  const requestNumber = `REQ-${currentYear}${currentMonth}-${String(nextNumber).padStart(3, '0')}`
  
  // Verificar que no existe (por seguridad)
  const existing = await prisma.purchaseRequest.findFirst({
    where: { requestNumber }
  })
  
  if (existing) {
    // Si existe, recursivamente generar el siguiente
    return generateUniqueRequestNumber()
  }
  
  return requestNumber
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validar prioridad
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (data.priority && !validPriorities.includes(data.priority)) {
      return NextResponse.json(
        { error: 'Prioridad inválida. Debe ser: LOW, MEDIUM, HIGH o URGENT' },
        { status: 400 }
      )
    }
    
    // Validar status
    const validStatuses = ['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']
    if (data.status && !validStatuses.includes(data.status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }
    
    // Validar que el solicitante sea del área de sistemas
    if (data.requestorId) {
      const requestor = await prisma.employee.findUnique({
        where: { id: data.requestorId },
        select: { area: true }
      })
      
      if (!requestor || requestor.area?.toLowerCase() !== 'sistemas') {
        return NextResponse.json(
          { error: 'Solo los empleados del área de sistemas pueden crear solicitudes de compra' },
          { status: 403 }
        )
      }
    }
    
    // Generar número de solicitud único
    const requestNumber = await generateUniqueRequestNumber()
    
    const purchaseRequest = await prisma.purchaseRequest.create({
      data: {
        requestNumber,
        requestorId: data.requestorId || null,
        itemName: data.itemName,
        category: data.category,
        description: data.description || null,
        justification: data.justification || null,
        quantity: data.quantity,
        estimatedCost: data.estimatedCost || null,
        priority: data.priority,
        status: data.status,
        approvedBy: data.approvedBy || null,
        approvalDate: data.approvalDate ? new Date(data.approvalDate) : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
        vendor: data.vendor || null,
        actualCost: data.actualCost || null,
        notes: data.notes || null
      },
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            area: true
          }
        }
      }
    })

    return NextResponse.json(purchaseRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase request:', error)
    return NextResponse.json(
      { error: 'Error al crear solicitud de compra' },
      { status: 500 }
    )
  }
}
