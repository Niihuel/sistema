import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { withDatabase } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import logger from '@/lib/logger'

const updatePasswordSchema = z.object({
  currentPassword: z.string().optional(), // Required for self-change
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// PUT /api/users/[id]/password - Update user password
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth(req)
    const targetUserId = parseInt(params.id)

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = updatePasswordSchema.parse(body)

    const result = await withDatabase(async (prisma) => {
      // Check if user is changing their own password or has permission
      const isSelfChange = ctx.userId === targetUserId

      if (!isSelfChange) {
        // Check if user has permission to reset passwords
        const userRole = await prisma.userRole.findFirst({
          where: { userId: ctx.userId, isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  where: { isActive: true },
                  include: { permission: true }
                }
              }
            }
          }
        })

        const hasPermission = userRole?.role.rolePermissions.some(rp =>
          rp.permission.resource === 'users' &&
          rp.permission.action === 'reset_password'
        )

        if (!hasPermission && !['SUPER_ADMIN', 'ADMIN'].includes(userRole?.role.name || '')) {
          throw new Error('Insufficient permissions to reset user password')
        }
      } else if (validatedData.currentPassword) {
        // Verify current password for self-change
        const user = await prisma.user.findUnique({
          where: { id: targetUserId }
        })

        if (!user) {
          throw new Error('User not found')
        }

        const isValid = await bcrypt.compare(validatedData.currentPassword, user.passwordHash)
        if (!isValid) {
          throw new Error('Current password is incorrect')
        }
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(validatedData.newPassword, 10)

      // Update password
      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
          passwordHash,
          passwordExpiresAt: null, // Reset expiration
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedBy: ctx.username
        },
        select: {
          id: true,
          username: true,
          email: true
        }
      })

      // Log the action
      await prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          userName: ctx.username,
          action: isSelfChange ? 'CHANGE_PASSWORD' : 'RESET_PASSWORD',
          entity: 'User',
          entityId: targetUserId,
          description: isSelfChange
            ? 'User changed their own password'
            : `Password reset for user: ${updatedUser.username}`,
          severity: 'HIGH',
          isSuccess: true,
          category: 'SECURITY'
        }
      })

      return updatedUser
    })

    logger.info('Password updated successfully', {
      userId: ctx.userId,
      targetUserId,
      isSelfChange: ctx.userId === targetUserId,
      path: req.url
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      data: result
    })
  } catch (error) {
    logger.error('Error updating password', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: params.id,
      path: req.url
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update password' },
      { status: error instanceof Error && error.message.includes('permissions') ? 403 : 400 }
    )
  }
}