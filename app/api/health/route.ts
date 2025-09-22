import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  return Response.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Sistema funcionando correctamente - caché limpio',
    version: '1.0'
  })
}
