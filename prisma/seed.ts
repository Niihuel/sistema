import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive production database seed...')

  try {
    // Limpiar TODOS los datos existentes en orden correcto
    console.log('🧹 Cleaning all existing data...')
    await prisma.userSession.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.userPermission.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.permissionGroupItem.deleteMany()
    await prisma.permissionGroup.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.role.deleteMany()
    await prisma.user.deleteMany()

    console.log('🎨 Creating permission groups...')

    // Crear grupos de permisos
    const systemGroup = await prisma.permissionGroup.create({
      data: {
        name: 'SYSTEM_ADMINISTRATION',
        displayName: 'Administración del Sistema',
        description: 'Permisos para administración completa del sistema',
        category: 'system',
        color: '#dc2626',
        icon: 'shield-check',
        isSystem: true,
        priority: 100
      }
    })

    const userManagementGroup = await prisma.permissionGroup.create({
      data: {
        name: 'USER_MANAGEMENT',
        displayName: 'Gestión de Usuarios',
        description: 'Permisos para administrar usuarios y roles',
        category: 'users',
        color: '#7c3aed',
        icon: 'users',
        isSystem: true,
        priority: 90
      }
    })

    const itOperationsGroup = await prisma.permissionGroup.create({
      data: {
        name: 'IT_OPERATIONS',
        displayName: 'Operaciones IT',
        description: 'Permisos para operaciones técnicas y soporte',
        category: 'operations',
        color: '#059669',
        icon: 'cpu',
        isSystem: true,
        priority: 80
      }
    })

    const dataAccessGroup = await prisma.permissionGroup.create({
      data: {
        name: 'DATA_ACCESS',
        displayName: 'Acceso a Datos',
        description: 'Permisos para acceso y visualización de información',
        category: 'data',
        color: '#0ea5e9',
        icon: 'database',
        isSystem: true,
        priority: 70
      }
    })

    console.log('🔐 Creating comprehensive permissions...')

    // Definir todas las combinaciones de permisos para el sistema
    const permissionDefinitions = [
      // Sistema y Configuración
      { name: 'system.settings.read', displayName: 'Ver Configuración del Sistema', category: 'system', resource: 'settings', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: systemGroup.id },
      { name: 'system.settings.write', displayName: 'Modificar Configuración del Sistema', category: 'system', resource: 'settings', action: 'write', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: systemGroup.id },
      { name: 'system.logs.read', displayName: 'Ver Logs del Sistema', category: 'system', resource: 'logs', action: 'read', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: systemGroup.id },
      { name: 'system.audit.read', displayName: 'Ver Auditoría del Sistema', category: 'system', resource: 'audit', action: 'read', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: systemGroup.id },
      { name: 'system.backup.read', displayName: 'Ver Backups', category: 'system', resource: 'backups', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: systemGroup.id },
      { name: 'system.backup.create', displayName: 'Crear Backups', category: 'system', resource: 'backups', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: systemGroup.id },
      { name: 'system.backup.restore', displayName: 'Restaurar Backups', category: 'system', resource: 'backups', action: 'restore', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: systemGroup.id },

      // Gestión de Usuarios
      { name: 'users.read', displayName: 'Ver Usuarios', category: 'users', resource: 'users', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: userManagementGroup.id },
      { name: 'users.create', displayName: 'Crear Usuarios', category: 'users', resource: 'users', action: 'create', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: userManagementGroup.id },
      { name: 'users.update', displayName: 'Modificar Usuarios', category: 'users', resource: 'users', action: 'update', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: userManagementGroup.id },
      { name: 'users.delete', displayName: 'Eliminar Usuarios', category: 'users', resource: 'users', action: 'delete', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: userManagementGroup.id },
      { name: 'users.password.reset', displayName: 'Resetear Contraseñas', category: 'users', resource: 'users', action: 'password_reset', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: userManagementGroup.id },
      { name: 'users.sessions.view', displayName: 'Ver Sesiones de Usuario', category: 'users', resource: 'users', action: 'sessions_view', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: userManagementGroup.id },
      { name: 'users.sessions.terminate', displayName: 'Terminar Sesiones de Usuario', category: 'users', resource: 'users', action: 'sessions_terminate', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: userManagementGroup.id },

      // Roles y Permisos
      { name: 'roles.read', displayName: 'Ver Roles', category: 'users', resource: 'roles', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: userManagementGroup.id },
      { name: 'roles.create', displayName: 'Crear Roles', category: 'users', resource: 'roles', action: 'create', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: userManagementGroup.id },
      { name: 'roles.update', displayName: 'Modificar Roles', category: 'users', resource: 'roles', action: 'update', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: userManagementGroup.id },
      { name: 'roles.delete', displayName: 'Eliminar Roles', category: 'users', resource: 'roles', action: 'delete', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: userManagementGroup.id },
      { name: 'roles.assign', displayName: 'Asignar Roles', category: 'users', resource: 'roles', action: 'assign', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: userManagementGroup.id },
      { name: 'permissions.read', displayName: 'Ver Permisos', category: 'users', resource: 'permissions', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: userManagementGroup.id },
      { name: 'permissions.grant', displayName: 'Otorgar Permisos', category: 'users', resource: 'permissions', action: 'grant', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: userManagementGroup.id },

      // Equipos (reemplazando los antiguos)
      { name: 'equipment.read', displayName: 'Ver Equipos', category: 'assets', resource: 'equipment', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'equipment.create', displayName: 'Crear Equipos', category: 'assets', resource: 'equipment', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'equipment.update', displayName: 'Modificar Equipos', category: 'assets', resource: 'equipment', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'equipment.delete', displayName: 'Eliminar Equipos', category: 'assets', resource: 'equipment', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'equipment.assign', displayName: 'Asignar Equipos', category: 'assets', resource: 'equipment', action: 'assign', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'equipment.transfer', displayName: 'Transferir Equipos', category: 'assets', resource: 'equipment', action: 'transfer', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },

      // Tickets/Soporte (reemplazando los antiguos)
      { name: 'tickets.read', displayName: 'Ver Tickets', category: 'support', resource: 'tickets', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'tickets.read.own', displayName: 'Ver Mis Tickets', category: 'support', resource: 'tickets', action: 'read', scope: 'OWN', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'tickets.create', displayName: 'Crear Tickets', category: 'support', resource: 'tickets', action: 'create', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'tickets.update', displayName: 'Modificar Tickets', category: 'support', resource: 'tickets', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'tickets.assign', displayName: 'Asignar Tickets', category: 'support', resource: 'tickets', action: 'assign', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'tickets.close', displayName: 'Cerrar Tickets', category: 'support', resource: 'tickets', action: 'close', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'tickets.delete', displayName: 'Eliminar Tickets', category: 'support', resource: 'tickets', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },

      // Impresoras
      { name: 'printers.read', displayName: 'Ver Impresoras', category: 'assets', resource: 'printers', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'printers.create', displayName: 'Crear Impresoras', category: 'assets', resource: 'printers', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'printers.update', displayName: 'Modificar Impresoras', category: 'assets', resource: 'printers', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'printers.delete', displayName: 'Eliminar Impresoras', category: 'assets', resource: 'printers', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'printers.maintenance', displayName: 'Mantenimiento de Impresoras', category: 'assets', resource: 'printers', action: 'maintenance', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },

      // Inventario (conservando solo una versión)
      { name: 'inventory.read', displayName: 'Ver Inventario', category: 'assets', resource: 'inventory', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'inventory.create', displayName: 'Crear Items de Inventario', category: 'assets', resource: 'inventory', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'inventory.update', displayName: 'Modificar Inventario', category: 'assets', resource: 'inventory', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'inventory.delete', displayName: 'Eliminar Items de Inventario', category: 'assets', resource: 'inventory', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'inventory.stock', displayName: 'Gestionar Stock', category: 'assets', resource: 'inventory', action: 'stock', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },

      // Empleados (consolidado aquí)
      { name: 'employees.read', displayName: 'Ver Empleados', category: 'hr', resource: 'employees', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'employees.create', displayName: 'Crear Empleados', category: 'hr', resource: 'employees', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'employees.update', displayName: 'Modificar Empleados', category: 'hr', resource: 'employees', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'employees.delete', displayName: 'Eliminar Empleados', category: 'hr', resource: 'employees', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'employees.export', displayName: 'Exportar Datos de Empleados', category: 'hr', resource: 'employees', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },

      // Compras/Purchase Requests (conservando solo una versión)
      { name: 'purchases.read', displayName: 'Ver Compras', category: 'finance', resource: 'purchases', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'purchases.create', displayName: 'Crear Solicitudes de Compra', category: 'finance', resource: 'purchases', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'purchases.update', displayName: 'Modificar Compras', category: 'finance', resource: 'purchases', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'purchases.approve', displayName: 'Aprobar Compras', category: 'finance', resource: 'purchases', action: 'approve', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'purchases.delete', displayName: 'Eliminar Compras', category: 'finance', resource: 'purchases', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },

      // Cuentas y Accesos
      { name: 'accounts.windows.read', displayName: 'Ver Cuentas Windows', category: 'accounts', resource: 'accounts_windows', action: 'read', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'accounts.windows.create', displayName: 'Crear Cuentas Windows', category: 'accounts', resource: 'accounts_windows', action: 'create', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'accounts.windows.update', displayName: 'Modificar Cuentas Windows', category: 'accounts', resource: 'accounts_windows', action: 'update', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'accounts.email.read', displayName: 'Ver Cuentas Email', category: 'accounts', resource: 'accounts_email', action: 'read', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'accounts.email.create', displayName: 'Crear Cuentas Email', category: 'accounts', resource: 'accounts_email', action: 'create', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'accounts.qnap.read', displayName: 'Ver Cuentas QNAP', category: 'accounts', resource: 'accounts_qnap', action: 'read', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'accounts.calipso.read', displayName: 'Ver Cuentas Calipso', category: 'accounts', resource: 'accounts_calipso', action: 'read', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },

      // Reportes
      { name: 'reports.read', displayName: 'Ver Reportes', category: 'reports', resource: 'reports', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'reports.generate', displayName: 'Generar Reportes', category: 'reports', resource: 'reports', action: 'generate', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'reports.export', displayName: 'Exportar Reportes', category: 'reports', resource: 'reports', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'reports.schedule', displayName: 'Programar Reportes', category: 'reports', resource: 'reports', action: 'schedule', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },

      // Dashboard y Notificaciones
      { name: 'DASHBOARD.read', displayName: 'Ver Dashboard', category: 'general', resource: 'DASHBOARD', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'notifications.read', displayName: 'Ver Notificaciones', category: 'general', resource: 'notifications', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'notifications.create', displayName: 'Crear Notificaciones', category: 'general', resource: 'notifications', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'notifications.broadcast', displayName: 'Enviar Notificaciones Masivas', category: 'general', resource: 'notifications', action: 'broadcast', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: systemGroup.id },

      // Permisos específicos para los módulos (formato MAYÚSCULAS que utiliza el código)
      { name: 'EMPLOYEES.read', displayName: 'Ver Empleados Dashboard', category: 'hr', resource: 'EMPLOYEES', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'EMPLOYEES.create', displayName: 'Crear Empleados Dashboard', category: 'hr', resource: 'EMPLOYEES', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'EMPLOYEES.update', displayName: 'Modificar Empleados Dashboard', category: 'hr', resource: 'EMPLOYEES', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'EMPLOYEES.delete', displayName: 'Eliminar Empleados Dashboard', category: 'hr', resource: 'EMPLOYEES', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'EMPLOYEES.export', displayName: 'Exportar Empleados Dashboard', category: 'hr', resource: 'EMPLOYEES', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },

      { name: 'EQUIPMENT.read', displayName: 'Ver Equipos Dashboard', category: 'assets', resource: 'EQUIPMENT', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'EQUIPMENT.create', displayName: 'Crear Equipos Dashboard', category: 'assets', resource: 'EQUIPMENT', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'EQUIPMENT.update', displayName: 'Modificar Equipos Dashboard', category: 'assets', resource: 'EQUIPMENT', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'EQUIPMENT.delete', displayName: 'Eliminar Equipos Dashboard', category: 'assets', resource: 'EQUIPMENT', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'EQUIPMENT.export', displayName: 'Exportar Equipos Dashboard', category: 'assets', resource: 'EQUIPMENT', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },

      { name: 'INVENTORY.read', displayName: 'Ver Inventario Dashboard', category: 'assets', resource: 'INVENTORY', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'INVENTORY.create', displayName: 'Crear Inventario Dashboard', category: 'assets', resource: 'INVENTORY', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'INVENTORY.update', displayName: 'Modificar Inventario Dashboard', category: 'assets', resource: 'INVENTORY', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'INVENTORY.delete', displayName: 'Eliminar Inventario Dashboard', category: 'assets', resource: 'INVENTORY', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'INVENTORY.export', displayName: 'Exportar Inventario Dashboard', category: 'assets', resource: 'INVENTORY', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },

      { name: 'ADMIN.read', displayName: 'Ver Panel Administración', category: 'system', resource: 'ADMIN', action: 'read', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: systemGroup.id },
      { name: 'ADMIN.create', displayName: 'Crear en Panel Administración', category: 'system', resource: 'ADMIN', action: 'create', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: systemGroup.id },
      { name: 'ADMIN.update', displayName: 'Modificar Panel Administración', category: 'system', resource: 'ADMIN', action: 'update', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: systemGroup.id },
      { name: 'ADMIN.delete', displayName: 'Eliminar en Panel Administración', category: 'system', resource: 'ADMIN', action: 'delete', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: systemGroup.id },

      { name: 'USERS.read', displayName: 'Ver Panel Usuarios', category: 'users', resource: 'USERS', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: userManagementGroup.id },
      { name: 'USERS.create', displayName: 'Crear Panel Usuarios', category: 'users', resource: 'USERS', action: 'create', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: userManagementGroup.id },
      { name: 'USERS.update', displayName: 'Modificar Panel Usuarios', category: 'users', resource: 'USERS', action: 'update', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: userManagementGroup.id },
      { name: 'USERS.delete', displayName: 'Eliminar Panel Usuarios', category: 'users', resource: 'USERS', action: 'delete', scope: 'ALL', riskLevel: 'CRITICAL', requiresMFA: true, group: userManagementGroup.id },

      { name: 'TICKETS.read', displayName: 'Ver Panel Tickets', category: 'support', resource: 'TICKETS', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'TICKETS.create', displayName: 'Crear Panel Tickets', category: 'support', resource: 'TICKETS', action: 'create', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'TICKETS.update', displayName: 'Modificar Panel Tickets', category: 'support', resource: 'TICKETS', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'TICKETS.delete', displayName: 'Eliminar Panel Tickets', category: 'support', resource: 'TICKETS', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'TICKETS.export', displayName: 'Exportar Panel Tickets', category: 'support', resource: 'TICKETS', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id },

      { name: 'BACKUPS.read', displayName: 'Ver Panel Backups', category: 'system', resource: 'BACKUPS', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: systemGroup.id },
      { name: 'BACKUPS.create', displayName: 'Crear Panel Backups', category: 'system', resource: 'BACKUPS', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: systemGroup.id },
      { name: 'BACKUPS.update', displayName: 'Modificar Panel Backups', category: 'system', resource: 'BACKUPS', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: systemGroup.id },
      { name: 'BACKUPS.delete', displayName: 'Eliminar Panel Backups', category: 'system', resource: 'BACKUPS', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: false, group: systemGroup.id },
      { name: 'BACKUPS.export', displayName: 'Exportar Panel Backups', category: 'system', resource: 'BACKUPS', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: systemGroup.id },

      { name: 'PURCHASE_REQUESTS.read', displayName: 'Ver Panel Solicitudes Compra', category: 'finance', resource: 'PURCHASE_REQUESTS', action: 'read', scope: 'ALL', riskLevel: 'LOW', requiresMFA: false, group: dataAccessGroup.id },
      { name: 'PURCHASE_REQUESTS.create', displayName: 'Crear Panel Solicitudes Compra', category: 'finance', resource: 'PURCHASE_REQUESTS', action: 'create', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'PURCHASE_REQUESTS.update', displayName: 'Modificar Panel Solicitudes Compra', category: 'finance', resource: 'PURCHASE_REQUESTS', action: 'update', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: itOperationsGroup.id },
      { name: 'PURCHASE_REQUESTS.delete', displayName: 'Eliminar Panel Solicitudes Compra', category: 'finance', resource: 'PURCHASE_REQUESTS', action: 'delete', scope: 'ALL', riskLevel: 'HIGH', requiresMFA: true, group: itOperationsGroup.id },
      { name: 'PURCHASE_REQUESTS.export', displayName: 'Exportar Panel Solicitudes Compra', category: 'finance', resource: 'PURCHASE_REQUESTS', action: 'export', scope: 'ALL', riskLevel: 'MEDIUM', requiresMFA: false, group: dataAccessGroup.id }
    ]

    // Crear permisos con validación de duplicados
    const permissions = []
    const seenCombinations = new Set()

    for (const permDef of permissionDefinitions) {
      // Validar que no exista la combinación [resource, action, scope]
      const combo = `${permDef.resource}-${permDef.action}-${permDef.scope}`
      if (seenCombinations.has(combo)) {
        console.log(`⚠️  Skipping duplicate permission: ${permDef.name} (${combo})`)
        continue
      }
      seenCombinations.add(combo)

      const permission = await prisma.permission.create({
        data: {
          name: permDef.name,
          displayName: permDef.displayName,
          description: `${permDef.displayName} - ${permDef.action.toUpperCase()} en ${permDef.resource}`,
          category: permDef.category,
          resource: permDef.resource,
          action: permDef.action,
          scope: permDef.scope,
          riskLevel: permDef.riskLevel,
          requiresMFA: permDef.requiresMFA,
          isSystem: true,
          auditRequired: ['CRITICAL', 'HIGH'].includes(permDef.riskLevel),
          createdBy: 'system'
        }
      })
      permissions.push(permission)

      // Asociar permiso al grupo
      await prisma.permissionGroupItem.create({
        data: {
          groupId: permDef.group,
          permissionId: permission.id,
          isRequired: permDef.riskLevel === 'CRITICAL',
          priority: permDef.riskLevel === 'CRITICAL' ? 100 : permDef.riskLevel === 'HIGH' ? 80 : 50
        }
      })
    }

    console.log('👑 Creating system roles...')

    // Super Admin - Acceso completo sin restricciones
    const superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        displayName: 'Super Administrador',
        description: 'Acceso completo e irrestricto al sistema. Solo para administradores principales.',
        color: '#dc2626',
        icon: 'crown',
        isSystem: true,
        level: 100,
        priority: 1000,
        maxUsers: 2,
        createdBy: 'system'
      }
    })

    // Admin - Administrador del sistema
    const adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        displayName: 'Administrador',
        description: 'Administrador del sistema con acceso amplio pero con algunas restricciones de seguridad.',
        color: '#7c3aed',
        icon: 'shield-check',
        isSystem: true,
        level: 90,
        priority: 900,
        maxUsers: 5,
        createdBy: 'system'
      }
    })

    // IT Manager - Gerente IT
    const itManagerRole = await prisma.role.create({
      data: {
        name: 'IT_MANAGER',
        displayName: 'Gerente IT',
        description: 'Gerente de tecnología con permisos administrativos para operaciones IT.',
        color: '#059669',
        icon: 'briefcase',
        isSystem: true,
        level: 80,
        priority: 800,
        maxUsers: 3,
        createdBy: 'system'
      }
    })

    // Technician - Técnico IT
    const technicianRole = await prisma.role.create({
      data: {
        name: 'TECHNICIAN',
        displayName: 'Técnico IT',
        description: 'Técnico especializado en soporte y mantenimiento de sistemas.',
        color: '#0ea5e9',
        icon: 'wrench',
        isSystem: true,
        level: 70,
        priority: 700,
        createdBy: 'system'
      }
    })

    // Support - Soporte técnico
    const supportRole = await prisma.role.create({
      data: {
        name: 'SUPPORT',
        displayName: 'Soporte Técnico',
        description: 'Personal de soporte con acceso limitado para resolver tickets básicos.',
        color: '#f59e0b',
        icon: 'headphones',
        isSystem: true,
        level: 60,
        priority: 600,
        createdBy: 'system'
      }
    })

    // User - Usuario estándar
    const userRole = await prisma.role.create({
      data: {
        name: 'USER',
        displayName: 'Usuario',
        description: 'Usuario estándar con permisos básicos para operaciones cotidianas.',
        color: '#6b7280',
        icon: 'user',
        isSystem: true,
        level: 50,
        priority: 500,
        createdBy: 'system'
      }
    })

    // Viewer - Solo lectura
    const viewerRole = await prisma.role.create({
      data: {
        name: 'VIEWER',
        displayName: 'Visualizador',
        description: 'Acceso de solo lectura para consulta de información.',
        color: '#9ca3af',
        icon: 'eye',
        isSystem: true,
        level: 40,
        priority: 400,
        createdBy: 'system'
      }
    })

    console.log('🔗 Assigning permissions to roles...')

    // Asignar permisos a SUPER_ADMIN (todos los permisos)
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
          grantedBy: 'system',
          isActive: true
        }
      })
    }

    // Asignar permisos a ADMIN (todos excepto los más críticos del sistema)
    const adminPermissions = permissions.filter(p =>
      !p.name.includes('system.backup.restore') &&
      !p.name.includes('permissions.grant') &&
      p.riskLevel !== 'CRITICAL' || p.category !== 'system'
    )
    for (const permission of adminPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
          grantedBy: 'system',
          isActive: true
        }
      })
    }

    // Asignar permisos a IT_MANAGER
    const itManagerPermissions = permissions.filter(p =>
      ['assets', 'support', 'accounts', 'reports', 'general', 'hr'].includes(p.category) ||
      (p.category === 'users' && !p.name.includes('delete')) ||
      (p.category === 'system' && ['logs', 'audit', 'backup'].includes(p.resource) && p.action !== 'restore')
    )
    for (const permission of itManagerPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: itManagerRole.id,
          permissionId: permission.id,
          grantedBy: 'system',
          isActive: true
        }
      })
    }

    // Asignar permisos a TECHNICIAN
    const technicianPermissions = permissions.filter(p =>
      ['assets', 'support', 'accounts', 'general'].includes(p.category) ||
      (p.category === 'hr' && ['read', 'update'].includes(p.action)) ||
      (p.category === 'users' && p.action === 'read') ||
      (p.category === 'reports' && ['read', 'generate'].includes(p.action))
    )
    for (const permission of technicianPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: technicianRole.id,
          permissionId: permission.id,
          grantedBy: 'system',
          isActive: true
        }
      })
    }

    // Asignar permisos a SUPPORT
    const supportPermissions = permissions.filter(p =>
      (p.category === 'support' && ['read', 'create', 'update', 'assign'].includes(p.action)) ||
      (p.category === 'assets' && p.action === 'read') ||
      (p.category === 'general' && p.action === 'read') ||
      (p.category === 'hr' && p.action === 'read')
    )
    for (const permission of supportPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: supportRole.id,
          permissionId: permission.id,
          grantedBy: 'system',
          isActive: true
        }
      })
    }

    // Asignar permisos a USER
    const userPermissions = permissions.filter(p =>
      (p.scope === 'OWN') ||
      (p.category === 'general' && p.action === 'read') ||
      (p.category === 'support' && p.name === 'tickets.create') ||
      (p.category === 'assets' && p.action === 'read')
    )
    for (const permission of userPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: userRole.id,
          permissionId: permission.id,
          grantedBy: 'system',
          isActive: true
        }
      })
    }

    // Asignar permisos a VIEWER (solo lectura)
    const viewerPermissions = permissions.filter(p =>
      p.action === 'read' &&
      ['general', 'assets', 'support', 'reports'].includes(p.category)
    )
    for (const permission of viewerPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: viewerRole.id,
          permissionId: permission.id,
          grantedBy: 'system',
          isActive: true
        }
      })
    }

    console.log('👤 Creating and updating system users...')

    // Hash de contraseña segura
    const passwordHash = await bcrypt.hash('AuxSist24', 12)
    const now = new Date()
    const passwordExpiry = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 días

    // Usuario Super Admin
    let superAdminUser = await prisma.user.findUnique({
      where: { username: 'auxsistemas' }
    })

    if (!superAdminUser) {
      superAdminUser = await prisma.user.create({
        data: {
          username: 'auxsistemas',
          email: 'auxsistemas@pretensa.com',
          firstName: 'AUX',
          lastName: 'Sistemas',
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true,
          isEmailVerified: true,
          passwordExpiresAt: passwordExpiry,
          createdBy: 'system'
        }
      })
    } else {
      superAdminUser = await prisma.user.update({
        where: { id: superAdminUser.id },
        data: {
          email: 'auxsistemas@pretensa.com',
          firstName: 'AUX',
          lastName: 'Sistemas',
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true,
          isEmailVerified: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordExpiresAt: passwordExpiry,
          updatedBy: 'system',
          deletedAt: null
        }
      })
    }

    // Usuario Admin/Técnico principal
    let adminUser = await prisma.user.findUnique({
      where: { username: 'sistemas' }
    })

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          username: 'sistemas',
          email: 'sistemas@pretensa.com',
          firstName: 'Sistemas',
          lastName: 'IT',
          passwordHash,
          role: 'ADMIN',
          isActive: true,
          isEmailVerified: true,
          passwordExpiresAt: passwordExpiry,
          createdBy: 'system'
        }
      })
    } else {
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          email: 'sistemas@pretensa.com',
          firstName: 'Sistemas',
          lastName: 'IT',
          passwordHash,
          role: 'ADMIN',
          isActive: true,
          isEmailVerified: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordExpiresAt: passwordExpiry,
          updatedBy: 'system',
          deletedAt: null
        }
      })
    }

    console.log('🔐 Assigning roles to users...')

    // Limpiar roles existentes
    await prisma.userRole.deleteMany({
      where: {
        userId: {
          in: [superAdminUser.id, adminUser.id]
        }
      }
    })

    // Asignar rol SUPER_ADMIN a auxsistemas
    await prisma.userRole.create({
      data: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
        assignedBy: 'system',
        isPrimary: true,
        isActive: true,
        reason: 'Usuario super administrador principal del sistema'
      }
    })

    // Asignar rol ADMIN a sistemas
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
        assignedBy: 'system',
        isPrimary: true,
        isActive: true,
        reason: 'Usuario administrador del sistema'
      }
    })

    // También asignar rol IT_MANAGER a sistemas como rol secundario
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: itManagerRole.id,
        assignedBy: 'system',
        isPrimary: false,
        isActive: true,
        reason: 'Permisos adicionales de gestión IT'
      }
    })

    console.log('📊 Database seed completed successfully!')
    console.log('===============================================')
    console.log('✅ CREATED PERMISSION GROUPS:')
    console.log(`   📁 ${systemGroup.displayName} (${systemGroup.name})`)
    console.log(`   📁 ${userManagementGroup.displayName} (${userManagementGroup.name})`)
    console.log(`   📁 ${itOperationsGroup.displayName} (${itOperationsGroup.name})`)
    console.log(`   📁 ${dataAccessGroup.displayName} (${dataAccessGroup.name})`)
    console.log('')
    console.log('✅ CREATED PERMISSIONS:')
    console.log(`   🔑 ${permissions.length} permissions total`)
    console.log(`   🔑 System: ${permissions.filter(p => p.category === 'system').length}`)
    console.log(`   🔑 Users: ${permissions.filter(p => p.category === 'users').length}`)
    console.log(`   🔑 Assets: ${permissions.filter(p => ['assets', 'support'].includes(p.category)).length}`)
    console.log(`   🔑 Other: ${permissions.filter(p => !['system', 'users', 'assets', 'support'].includes(p.category)).length}`)
    console.log('')
    console.log('✅ CREATED ROLES:')
    console.log(`   👑 ${superAdminRole.displayName} (Level ${superAdminRole.level})`)
    console.log(`   🛡️  ${adminRole.displayName} (Level ${adminRole.level})`)
    console.log(`   💼 ${itManagerRole.displayName} (Level ${itManagerRole.level})`)
    console.log(`   🔧 ${technicianRole.displayName} (Level ${technicianRole.level})`)
    console.log(`   🎧 ${supportRole.displayName} (Level ${supportRole.level})`)
    console.log(`   👤 ${userRole.displayName} (Level ${userRole.level})`)
    console.log(`   👁️  ${viewerRole.displayName} (Level ${viewerRole.level})`)
    console.log('')
    console.log('✅ CREATED USERS:')
    console.log(`   👑 auxsistemas (ID: ${superAdminUser.id}) - SUPER_ADMIN`)
    console.log(`   🛡️  sistemas (ID: ${adminUser.id}) - ADMIN + IT_MANAGER`)
    console.log('')
    console.log('🔐 SECURITY INFORMATION:')
    console.log(`   🔑 Default password: AuxSist24`)
    console.log(`   ⏰ Password expires: ${passwordExpiry.toLocaleDateString()}`)
    console.log(`   🔒 High-risk permissions require MFA`)
    console.log(`   📝 All critical actions are audited`)
    console.log('===============================================')

  } catch (error) {
    console.error('❌ Error during database seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })