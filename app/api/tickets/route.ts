import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import {
  requireAllDynamicPermissions,
  requireAnyDynamicPermission,
  hasPermission
} from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const authResult = await requireAnyDynamicPermission([
    'tickets:view_all',
    'tickets:view_own'
  ])(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const context = authResult

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const technicianId = searchParams.get('technicianId')

    const filters: Array<Record<string, unknown>> = []

    if (status) {
      filters.push({ status })
    }

    if (priority) {
      filters.push({ priority })
    }

    if (technicianId) {
      filters.push({ technicianId: Number(technicianId) })
    }

    if (!hasPermission(context, 'tickets:view_all')) {
      filters.push({ requestorId: context.userId })
    }

    const items = await withDatabase(async (prisma) => {
      return prisma.ticket.findMany({
        where: filters.length > 0 ? { AND: filters } : undefined,
        orderBy: { id: 'desc' }
      })
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Error listando tickets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['tickets:create'])(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const context = authResult

  try {
    const data = await req.json()

    if (!data?.requestorId) {
      return NextResponse.json({ error: 'requestorId requerido' }, { status: 400 })
    }

    const priority = String(data?.priority ?? 'MEDIUM').toUpperCase()
    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      return NextResponse.json({ error: 'Prioridad inválida' }, { status: 400 })
    }

    const status = String(data?.status ?? 'OPEN').toUpperCase()
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    if (data?.technicianId && !hasPermission(context, 'tickets:assign')) {
      return NextResponse.json({
        error: 'Permiso requerido para asignar tickets',
        code: 'PERMISSION_DENIED'
      }, { status: 403 })
    }

    const payload = {
      title: String(data?.title ?? 'Ticket'),
      description: data?.description ? String(data.description) : null,
      requestorId: Number(data.requestorId),
      technicianId: data?.technicianId ? Number(data.technicianId) : null,
      solution: data?.solution ? String(data.solution) : null,
      category: data?.category ? String(data.category) : null,
      area: data?.area ? String(data.area) : null,
      ipAddress: data?.ipAddress ? String(data.ipAddress) : null,
      resolutionTime: data?.resolutionTime ? String(data.resolutionTime) : null,
      priority,
      status
    }

    const ticket = await withDatabase(async (prisma) => {
      return prisma.ticket.create({ data: payload })
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Error creando ticket' }, { status: 500 })
  }
}
