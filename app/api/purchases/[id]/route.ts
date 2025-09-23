import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAllDynamicPermissions,
  requireAnyDynamicPermission,
  hasPermission
} from '@/lib/middleware'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['purchases:view'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const item = await prisma.purchase.findUnique({ where: { id } })
    if (!item) {
      return new NextResponse('Not Found', { status: 404 })
    }
    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error obteniendo compra:', error)
    return NextResponse.json({ error: 'Error obteniendo compra' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAnyDynamicPermission([
    'purchases:process',
    'purchases:approve',
    'purchases:create'
  ])(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const updated = await prisma.purchase.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error actualizando compra:', error)
    return NextResponse.json({ error: 'Error actualizando compra' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['purchases:process'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.purchase.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error eliminando compra:', error)
    return NextResponse.json({ error: 'Error eliminando compra' }, { status: 500 })
  }
}
