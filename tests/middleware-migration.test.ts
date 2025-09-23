import { NextRequest, NextResponse } from 'next/server'
import {
  requireRole as requireLegacyRole,
  AuthContext as LegacyAuthContext
} from '@/lib/middleware.legacy'
import {
  requireDynamicRole,
  requireDynamicAuth,
  type DynamicAuthContext
} from '@/lib/middleware/dynamic-authorization'

jest.mock('@/lib/middleware/dynamic-authorization', () => {
  const actual = jest.requireActual('@/lib/middleware/dynamic-authorization')

  return {
    ...actual,
    requireDynamicAuth: jest.fn()
  }
})

const mockedRequireDynamicAuth = requireDynamicAuth as jest.MockedFunction<typeof requireDynamicAuth>

const createMockRequest = (): NextRequest => ({}) as unknown as NextRequest

describe('Middleware Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('dynamic role check matches legacy behavior', async () => {
    const legacyContext: LegacyAuthContext & DynamicAuthContext = {
      userId: 42,
      username: 'tech_user',
      role: 'TECHNICIAN',
      roles: ['TECHNICIAN'],
      permissions: [],
      highestRole: {
        id: 1,
        name: 'TECHNICIAN',
        level: 50
      },
      token: 'legacy-token'
    }

    mockedRequireDynamicAuth.mockResolvedValueOnce(legacyContext)

    expect(() => requireLegacyRole(legacyContext, ['TECHNICIAN'])).not.toThrow()

    const result = await requireDynamicRole('TECHNICIAN')(createMockRequest())

    expect(mockedRequireDynamicAuth).toHaveBeenCalled()
    expect(result).toEqual(legacyContext)
  })

  test('dynamic role check denies when legacy does', async () => {
    const deniedContext: LegacyAuthContext & DynamicAuthContext = {
      userId: 7,
      username: 'employee',
      role: 'EMPLOYEE',
      roles: ['EMPLOYEE'],
      permissions: [],
      highestRole: {
        id: 2,
        name: 'EMPLOYEE',
        level: 30
      },
      token: 'employee-token'
    }

    mockedRequireDynamicAuth.mockResolvedValueOnce(deniedContext)

    expect(() => requireLegacyRole(deniedContext, ['TECHNICIAN'])).toThrow()

    const result = await requireDynamicRole('TECHNICIAN')(createMockRequest())

    expect(result).toBeInstanceOf(NextResponse)
    expect(result.status).toBe(403)
  })
})
