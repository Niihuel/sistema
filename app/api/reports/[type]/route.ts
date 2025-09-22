import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const ctx = requireAuth(req)

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const dateFilter = {
      ...(dateFrom && { gte: new Date(dateFrom) }),
      ...(dateTo && { lte: new Date(dateTo) })
    }

    let reportData: any = {}

    const resolvedParams = await params
    switch (resolvedParams.type) {
      case 'equipment':
        const equipment = await prisma.equipment.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : {},
          include: { assignedTo: true }
        })
        
        reportData = {
          total: equipment.length,
          active: equipment.filter(e => e.status === 'IN_USE').length,
          maintenance: equipment.filter(e => e.status === 'MAINTENANCE').length,
          items: equipment.slice(0, 100)
        }
        break

      case 'tickets':
        const tickets = await prisma.ticket.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : {},
          include: { requestor: true, technician: true }
        })
        
        reportData = {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'OPEN').length,
          resolved: tickets.filter(t => t.status === 'RESOLVED').length,
          avgResolutionTime: 'N/A',
          items: tickets.slice(0, 100)
        }
        break

      case 'inventory':
        const inventory = await prisma.inventoryItem.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : {}
        })
        
        reportData = {
          total: inventory.length,
          totalValue: 0,
          lowStock: inventory.filter(i => i.quantity < 5).length,
          items: inventory.slice(0, 100)
        }
        break

      case 'purchases':
        const purchases = await prisma.purchaseRequest.findMany({
          where: dateFrom || dateTo ? { createdAt: dateFilter } : {}
        })
        
        const totalCost = purchases.reduce((sum, p) => 
          sum + (p.estimatedCost ? parseFloat(p.estimatedCost.toString()) : 0), 0
        )
        
        reportData = {
          total: purchases.length,
          pending: purchases.filter(p => p.status === 'PENDING').length,
          approved: purchases.filter(p => p.status === 'APPROVED').length,
          totalCost: totalCost.toFixed(2),
          items: purchases.slice(0, 100)
        }
        break

      case 'monthly':
        // Reporte mensual integral
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const monthlyEquipment = await prisma.equipment.count()
        const monthlyTickets = await prisma.ticket.findMany({
          where: { createdAt: { gte: startOfMonth } }
        })
        const monthlyPurchases = await prisma.purchaseRequest.findMany({
          where: { createdAt: { gte: startOfMonth } }
        })
        
        const totalInvestment = monthlyPurchases.reduce((sum, p) => 
          sum + (p.actualCost ? parseFloat(p.actualCost.toString()) : 0), 0
        )
        
        reportData = {
          equipment: {
            total: monthlyEquipment
          },
          tickets: {
            total: monthlyTickets.length,
            resolved: monthlyTickets.filter(t => t.status === 'RESOLVED').length
          },
          purchases: {
            completed: monthlyPurchases.filter(p => p.status === 'RECEIVED').length
          },
          totalInvestment: totalInvestment.toFixed(2),
          metrics: {
            avgTicketsPerDay: (monthlyTickets.length / 30).toFixed(1),
            avgResolutionTime: 'N/A',
            equipmentAvailability: 95,
            purchaseEfficiency: 88,
            ticketsTrend: 5,
            resolutionTrend: -2,
            availabilityTrend: 1,
            purchaseTrend: 10
          },
          recommendations: [
            'Realizar mantenimiento preventivo en equipos críticos',
            'Revisar stock de consumibles de impresoras',
            'Actualizar inventario de software',
            'Programar capacitación para nuevas herramientas'
          ]
        }
        break

      default:
        return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    return NextResponse.json({ error: 'Error generando reporte' }, { status: 500 })
  }
}