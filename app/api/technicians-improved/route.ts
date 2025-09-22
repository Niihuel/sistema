import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

/**
 * Improved Technicians API - Uses direct Employee-User relationship
 * This replaces the temporary solution in /api/technicians once the schema migration is applied
 */

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    
    const technicians = await withDatabase(async (prisma) => {
      // Get users with technician roles that have associated employees
      const technicianUsers = await prisma.user.findMany({
        where: { 
          role: { in: ["TECHNICIAN", "ADMIN"] },
          employee: { isNot: null } // Only users with associated employees
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              area: true,
              position: true,
              status: true
            }
          }
        }
      })
      
      // Transform to the expected format
      return technicianUsers.map(user => ({
        id: user.employee!.id, // Use employee ID for assignments
        userId: user.id,        // Keep user ID for reference
        firstName: user.employee!.firstName,
        lastName: user.employee!.lastName,
        username: user.username,
        role: user.role,
        area: user.employee!.area,
        email: user.employee!.email,
        position: user.employee!.position,
        status: user.employee!.status
      }))
    })
    
    return Response.json(technicians)
  } catch (e) {
    console.error('Error in /api/technicians-improved GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo técnicos" }, { status: 500 })
  }
}
