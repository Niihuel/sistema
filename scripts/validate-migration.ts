import { withDatabase } from '../lib/prisma'
import { legacyPermissionToRoles } from '../lib/middleware.legacy'

function getLegacyPermissions(): string[] {
  return Object.keys(legacyPermissionToRoles)
}

async function getDynamicPermissions(): Promise<string[]> {
  return withDatabase(async (prisma) => {
    const records = await prisma.permission.findMany({
      where: { isActive: true },
      select: { resource: true, action: true }
    })

    return records.map(({ resource, action }) => ${resource}:)
  })
}

async function validatePermissionsMigration(): Promise<void> {
  const legacyPermissions = getLegacyPermissions()
  const dynamicPermissions = await getDynamicPermissions()

  const legacySet = new Set(legacyPermissions)
  const dynamicSet = new Set(dynamicPermissions)

  const missing = legacyPermissions.filter((permission) => !dynamicSet.has(permission))
  const extra = dynamicPermissions.filter((permission) => !legacySet.has(permission))

  console.log('Permisos faltantes:', missing)
  console.log('Permisos extras:', extra)
}

if (require.main === module) {
  validatePermissionsMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error validando migración de permisos:', error)
      process.exit(1)
    })
}

export { validatePermissionsMigration }
