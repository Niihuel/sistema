import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)
    
    const technicians = await withDatabase(async (prisma) => {
      // Obtener usuarios con rol TECHNICIAN o ADMIN (pueden ser asignados como técnicos)
      const users = await prisma.user.findMany({
        where: { 
          role: { in: ["TECHNICIAN", "ADMIN"] }
        },
        select: { 
          id: true, 
          username: true, 
          role: true 
        }
      })
      
      // Buscar empleados que coincidan con los usernames de los técnicos
      // Esta es una solución temporal hasta que se establezca una relación directa
      const employees = await prisma.employee.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          area: true
        }
      })
      
      // Combinar información de usuarios técnicos con empleados
      // Por ahora, usaremos el username para intentar hacer match con email o firstName
      const techniciansWithInfo = users.map(user => {
        // Buscar empleado que coincida por email o nombre
        const matchingEmployee = employees.find(emp => 
          emp.email === `${user.username}@company.com` ||
          emp.firstName?.toLowerCase() === user.username.toLowerCase() ||
          emp.lastName?.toLowerCase() === user.username.toLowerCase()
        )
        
        if (matchingEmployee) {
          return {
            id: matchingEmployee.id,
            userId: user.id,
            firstName: matchingEmployee.firstName,
            lastName: matchingEmployee.lastName,
            username: user.username,
            role: user.role,
            area: matchingEmployee.area,
            email: matchingEmployee.email
          }
        } else {
          // Si no hay empleado coincidente, usar datos del usuario
          return {
            id: user.id, // Usar user ID como fallback
            userId: user.id,
            firstName: user.username,
            lastName: `(${user.role})`,
            username: user.username,
            role: user.role,
            area: null,
            email: null
          }
        }
      })
      
      return techniciansWithInfo
    })
    
    return Response.json(technicians)
  } catch (e) {
    console.error('Error in /api/technicians GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo técnicos" }, { status: 500 })
  }
}

