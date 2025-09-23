import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['purchases:view'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || undefined
    const where = status ? { status } : {}
    const items = await prisma.purchase.findMany({ where, orderBy: { id: 'desc' } })
    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error listando compras:', error)
    return NextResponse.json({ error: 'Error listando compras' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['purchases:create'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const data = await req.json()
    const payload = {
      requestId: data?.requestId ?? null,
      itemName: String(data?.itemName ?? '').trim(),
      requestedQty: Number(data?.requestedQty ?? 0),
      requestedDate: data?.requestedDate ? new Date(data.requestedDate) : null,
      receivedQty: Number(data?.receivedQty ?? 0),
      receivedDate: data?.receivedDate ? new Date(data.receivedDate) : null,
      pendingQty: Number(data?.pendingQty ?? 0),
      status: String(data?.status ?? 'PENDING').toUpperCase()
    }

    const created = await prisma.purchase.create({ data: payload })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error creando compra:', error)
    return NextResponse.json({ error: 'Error creando compra' }, { status: 500 })
  }
}
