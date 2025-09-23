import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAllDynamicPermissions(['inventory:view'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || 1)
    const perPage = Math.min(Number(searchParams.get('perPage') || 20), 100)
    const q = searchParams.get('q') || undefined

    const where = q
      ? { name: { contains: q, mode: 'insensitive' as const } }
      : {}

    const [total, items] = await Promise.all([
      prisma.catalogArea.count({ where }),
      prisma.catalogArea.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { name: 'asc' }
      })
    ])

    return NextResponse.json({ total, page, perPage, items })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ total: 0, page: 1, perPage: 20, items: [] })
    }

    console.error('Error listando áreas:', error)
    return NextResponse.json({ error: 'Error listando áreas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAllDynamicPermissions(['inventory:create'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { name } = await req.json()
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json({ error: 'Nombre de área inválido' }, { status: 400 })
    }

    const created = await prisma.catalogArea.create({
      data: { name: String(name).trim() }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error creando área:', error)
    return NextResponse.json({ error: 'Error creando área' }, { status: 500 })
  }
}
