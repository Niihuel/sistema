# 🎮 Discord-Like Roles & Permissions System - Implementation Guide

## 📋 Overview

This document provides a complete implementation guide for the Discord-like roles and permissions system in your IT management application. The system provides hierarchical roles, granular permissions, and flexible authorization controls.

## 🚀 Quick Start

### 1. Database Setup

```bash
# Generate Prisma client with new models
npx prisma generate

# Run migration to create new tables
npx prisma migrate dev --name discord-roles-system

# Seed initial data
npx ts-node prisma/seed-discord-roles.ts
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Role System Configuration
ROLE_CACHE_DURATION=300000  # 5 minutes in ms
ENABLE_PERMISSION_CACHE=true
ENABLE_ROLE_HIERARCHY=true
MAX_ROLES_PER_USER=10
```

### 3. Application Setup

Update your main layout to include the permissions provider:

```tsx
// app/layout.tsx
import { PermissionsProvider } from '@/lib/hooks/usePermissionsV2'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <PermissionsProvider>
            {children}
          </PermissionsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

## 🏗️ Architecture

### Database Schema

```
Users ←→ UserRoles ←→ Roles
  ↓                      ↓
UserPermissions    RolePermissions
  ↓                      ↓
  └─── Permissions ←─────┘
```

### Key Models

- **Role**: Discord-style roles with color, icon, and hierarchy
- **Permission**: Granular permissions (resource:action)
- **UserRole**: User-to-role assignments with expiration support
- **RolePermission**: Role-to-permission mappings
- **UserPermission**: Direct permission overrides
- **PermissionGroup**: Bundled permissions for easy assignment

## 🔑 Core Features

### 1. Hierarchical Roles

Roles have a `level` property that determines hierarchy:

```typescript
SuperAdmin (100) > Admin (90) > Manager (70) > Technician (50) > Employee (30)
```

Higher level roles can:
- Manage lower level roles
- Override lower level permissions
- Cannot be managed by lower levels

### 2. Permission Format

Permissions follow the `resource:action` format:

```
equipment:view      - View equipment
equipment:create    - Create equipment
equipment:edit      - Edit equipment
equipment:delete    - Delete equipment
equipment:*         - All equipment actions
*:*                 - All permissions (super admin)
```

### 3. Permission Sources

Users get permissions from three sources (in priority order):

1. **Direct Permissions** (UserPermission) - Highest priority
2. **Role Permissions** (via UserRole → RolePermission)
3. **Inherited Permissions** (from parent roles, if enabled)

## 📝 Usage Examples

### Backend - API Routes

```typescript
// app/api/protected-route/route.ts
import { requirePermission } from '@/lib/middleware/authorization'

// Single permission check
export async function GET(req: NextRequest) {
  const ctx = await requirePermission('equipment', 'view')(req)
  if (ctx instanceof NextResponse) return ctx // Permission denied

  // User has permission, continue...
  return NextResponse.json({ data: 'protected data' })
}

// Multiple permissions (ANY)
export async function POST(req: NextRequest) {
  const ctx = await requireAnyPermission([
    { resource: 'equipment', action: 'create' },
    { resource: 'equipment', action: 'edit' }
  ])(req)
  if (ctx instanceof NextResponse) return ctx

  // User has at least one permission...
}

// Role-based check
export async function DELETE(req: NextRequest) {
  const ctx = await requireRole('Admin')(req)
  if (ctx instanceof NextResponse) return ctx

  // User has Admin role...
}
```

### Frontend - React Components

```tsx
// Using RoleGuard component
import { RoleGuard } from '@/components/roles/RoleGuard'

export function AdminPanel() {
  return (
    <RoleGuard
      requires={['users:view', 'users:edit']}
      requiresAll={true}
      fallback={<AccessDenied />}
    >
      <div>Admin content here...</div>
    </RoleGuard>
  )
}

// Using Can component for inline checks
import { Can } from '@/components/roles/RoleGuard'

export function EquipmentCard({ equipment }) {
  return (
    <div>
      <h3>{equipment.name}</h3>

      <Can I="edit" on="equipment">
        <EditButton equipmentId={equipment.id} />
      </Can>

      <Can I="delete" on="equipment">
        <DeleteButton equipmentId={equipment.id} />
      </Can>
    </div>
  )
}

// Using hooks directly
import { usePermissionsV2, useCan } from '@/lib/hooks/usePermissionsV2'

export function Dashboard() {
  const { hasPermission, hasRole, getHighestRole } = usePermissionsV2()
  const can = useCan()

  const canViewReports = hasPermission('reports', 'view')
  const isAdmin = hasRole('Admin')
  const canEditEquipment = can.edit('equipment')

  const highestRole = getHighestRole()
  const roleColor = highestRole?.color || '#95A5A6'

  return (
    <div>
      <div style={{ borderColor: roleColor }}>
        Welcome, {highestRole?.displayName}
      </div>

      {canViewReports && <ReportsWidget />}
      {isAdmin && <AdminTools />}
      {canEditEquipment && <QuickEditPanel />}
    </div>
  )
}
```

## 🛠️ Role Management UI

### Creating Roles

```tsx
// Example role creation form
const createRole = async (roleData) => {
  const response = await fetch('/api/roles-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'CustomRole',
      displayName: 'Custom Role',
      description: 'A custom role for specific needs',
      color: '#3498DB',
      icon: '🔧',
      permissions: [
        'equipment:view',
        'equipment:edit',
        'tickets:create'
      ]
    })
  })

  if (response.ok) {
    const role = await response.json()
    console.log('Role created:', role)
  }
}
```

### Assigning Roles

```tsx
// Assign role to user
const assignRole = async (userId, roleId) => {
  const response = await fetch('/api/roles-v2/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      roleId,
      reason: 'Promoted to technician',
      isPrimary: true,
      expiresAt: null // Permanent assignment
    })
  })

  if (response.ok) {
    console.log('Role assigned successfully')
  }
}
```

## 🔐 Security Considerations

### 1. Permission Validation

Always validate permissions on the backend:

```typescript
// ❌ Bad - Client-side only
if (user.role === 'Admin') {
  deleteEquipment()
}

// ✅ Good - Backend validation
const response = await fetch('/api/equipment/delete', {
  method: 'DELETE',
  // Backend checks permissions
})
```

### 2. Role Hierarchy Enforcement

Users cannot:
- Assign roles higher than their own
- Edit permissions of higher roles
- Delete system roles

### 3. Audit Logging

High-risk actions are automatically logged:

```typescript
// Automatically logged when riskLevel is HIGH or CRITICAL
await service.assignRole(userId, adminRoleId, {
  assignedBy: currentUser.username,
  reason: 'Security incident response'
})
```

## 📊 Default Roles & Permissions

### Roles Hierarchy

| Role | Level | Description | Key Permissions |
|------|-------|-------------|-----------------|
| SuperAdmin | 100 | Full system control | `*:*` (all permissions) |
| Admin | 90 | System administration | All except system config |
| Manager | 70 | Department management | Approve, assign, manage |
| Technician | 50 | IT support | Edit equipment, close tickets |
| Support | 40 | Help desk | View all, create tickets |
| Employee | 30 | Regular user | View own, create requests |
| Guest | 10 | Read-only | View public resources |

### Permission Categories

| Category | Resources | Risk Levels |
|----------|-----------|-------------|
| General | dashboard | LOW |
| Equipment | equipment, inventory | LOW-HIGH |
| Tickets | tickets | LOW-MEDIUM |
| Personal | employees | MEDIUM-CRITICAL |
| Finance | purchases | MEDIUM-HIGH |
| System | users, roles, backups | HIGH-CRITICAL |

## 🚨 Troubleshooting

### Common Issues

1. **Permissions not updating**
   ```typescript
   // Force refresh permissions cache
   const { refresh } = usePermissionsV2()
   await refresh()
   ```

2. **Role assignment fails**
   - Check user has `roles:assign` permission
   - Verify target role level is lower than user's highest role
   - Ensure role is active and not deleted

3. **Permission denied errors**
   - Check permission exists in database
   - Verify role-permission mapping is active
   - Check for user permission overrides (denials)

### Debug Mode

Enable debug logging in development:

```typescript
// lib/services/RoleManagementService.ts
constructor(prisma: PrismaClient) {
  this.prisma = prisma
  this.debug = process.env.NODE_ENV === 'development'
}

private log(message: string, data?: any) {
  if (this.debug) {
    console.log(`[RoleService] ${message}`, data)
  }
}
```

## 📈 Performance Optimization

### 1. Caching Strategy

Permissions are cached for 5 minutes by default:

```typescript
// Adjust cache duration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Clear cache when needed
service.clearCache()
```

### 2. Batch Operations

```typescript
// Batch role assignments
await service.assignMultipleRoles([
  { userId: 1, roleId: 2 },
  { userId: 3, roleId: 4 }
])
```

### 3. Lazy Loading

```typescript
// Only load permissions when needed
const { permissions, isLoading } = usePermissionsV2()

if (isLoading) return <Skeleton />
```

## 🔄 Migration from Old System

Run the migration script to transition existing users:

```bash
npx ts-node scripts/migrate-to-discord-roles.ts
```

This will:
1. Map old roles to new Discord-style roles
2. Convert existing permissions
3. Maintain user access levels
4. Create audit log of changes

## 📱 Mobile Considerations

The system is mobile-responsive:

```tsx
// Responsive role badges
<div className="flex flex-wrap gap-2">
  {user.roles.map(role => (
    <span
      key={role.id}
      className="px-2 py-1 rounded-full text-xs"
      style={{ backgroundColor: role.color + '20', color: role.color }}
    >
      {role.icon} {role.displayName}
    </span>
  ))}
</div>
```

## 🎯 Best Practices

1. **Use semantic permission names**: `equipment:view` not `eq_r`
2. **Group related permissions**: Use permission groups for common sets
3. **Document permission requirements**: Add comments in code
4. **Test permission changes**: Always test in development first
5. **Audit sensitive operations**: Log who, what, when for critical actions
6. **Use role templates**: Create templates for common role patterns
7. **Regular permission reviews**: Audit user permissions quarterly

## 📚 Additional Resources

- [API Documentation](/api/docs/roles-v2)
- [Permission Matrix Spreadsheet](/docs/permission-matrix.xlsx)
- [Role Design Guidelines](/docs/role-guidelines.md)
- [Security Best Practices](/docs/security.md)

## 🤝 Support

For questions or issues with the roles system:

1. Check this documentation
2. Review the seed file for examples
3. Check application logs
4. Contact the development team

---

**Last Updated**: December 2024
**Version**: 2.0.0
**Status**: Production Ready