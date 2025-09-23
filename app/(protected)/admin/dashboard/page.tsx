"use client"

import { useState, useMemo } from 'react'
import {
  Users, Shield, AlertTriangle, Activity, TrendingUp, TrendingDown,
  Clock, Eye, UserCheck, UserX, Crown, Zap, BarChart3, PieChart
} from 'lucide-react'
import { RoleBadge, RoleBadgeGroup } from '@/components/roles/RoleBadge'
import AnimatedContainer, { FadeInUp } from '@/components/animated-container'
import { usePermissionsV2 } from '@/lib/hooks/usePermissionsV2'

// Mock data for dashboard analytics
const mockDashboardData = {
  users: {
    total: 127,
    active: 98,
    inactive: 29,
    online: 23,
    locked: 3,
    newThisWeek: 8,
    activeToday: 45
  },
  roles: {
    total: 12,
    active: 10,
    system: 4,
    custom: 8,
    highLevel: 3,
    withUsers: 9
  },
  permissions: {
    total: 156,
    granted: 1243,
    highRisk: 23,
    critical: 8,
    expiringSoon: 5
  },
  activity: {
    loginAttempts: 342,
    successfulLogins: 298,
    failedLogins: 44,
    passwordResets: 7,
    roleChanges: 12,
    permissionChanges: 18
  },
  trends: {
    userGrowth: 5.2,
    activeUsers: 78.2,
    securityScore: 87.5,
    systemHealth: 92.1
  }
}

const mockRecentActivity = [
  {
    id: 1,
    type: 'role_assigned',
    user: 'John Doe',
    role: 'Manager',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    riskLevel: 'MEDIUM'
  },
  {
    id: 2,
    type: 'permission_granted',
    user: 'Jane Smith',
    permission: 'users:delete',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    riskLevel: 'HIGH'
  },
  {
    id: 3,
    type: 'user_locked',
    user: 'Bob Wilson',
    reason: 'Multiple failed attempts',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    riskLevel: 'HIGH'
  },
  {
    id: 4,
    type: 'role_created',
    role: 'Department Head',
    creator: 'Admin',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    riskLevel: 'LOW'
  }
]

const mockRoleDistribution = [
  { name: 'User', count: 45, color: '#95A5A6', percentage: 35.4 },
  { name: 'Manager', count: 18, color: '#3498DB', percentage: 14.2 },
  { name: 'Admin', count: 8, color: '#E74C3C', percentage: 6.3 },
  { name: 'Guest', count: 56, color: '#BDC3C7', percentage: 44.1 }
]

const mockSecurityAlerts = [
  {
    id: 1,
    type: 'suspicious_login',
    message: 'Multiple failed login attempts from IP 192.168.1.100',
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    user: 'Unknown'
  },
  {
    id: 2,
    type: 'privilege_escalation',
    message: 'User "jdoe" granted high-risk permissions',
    severity: 'MEDIUM',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    user: 'jdoe'
  },
  {
    id: 3,
    type: 'permission_expiry',
    message: '5 permissions expiring in next 7 days',
    severity: 'LOW',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    user: 'Multiple users'
  }
]

export default function AdminDashboardPage() {
  const { hasPermission } = usePermissionsV2()
  const [timeRange, setTimeRange] = useState('7d')

  // Permission checks
  const canViewDashboard = hasPermission('admin', 'view')
  const canViewUsers = hasPermission('users', 'view')
  const canViewRoles = hasPermission('roles', 'view')
  const canViewAuditLogs = hasPermission('audit', 'view')

  // Calculate metrics
  const metrics = useMemo(() => {
    const data = mockDashboardData
    return {
      userActiveRate: (data.users.active / data.users.total) * 100,
      roleUtilizationRate: (data.roles.withUsers / data.roles.total) * 100,
      securityScore: data.trends.securityScore,
      loginSuccessRate: (data.activity.successfulLogins / data.activity.loginAttempts) * 100
    }
  }, [])

  if (!canViewDashboard) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <div className="text-white/60 mb-4">You do not have permission to view the admin dashboard</div>
            <div className="text-white/40 text-sm">Contact your administrator for access</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0 space-y-6">
      {/* Header */}
      <FadeInUp delay={0.05}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>
            <p className="text-white/70">System overview and role management analytics</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white text-sm"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </FadeInUp>

      {/* Key Metrics */}
      <FadeInUp delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${mockDashboardData.trends.userGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {mockDashboardData.trends.userGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(mockDashboardData.trends.userGrowth)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{mockDashboardData.users.total}</div>
            <div className="text-white/60 text-sm">Total Users</div>
            <div className="mt-2 text-xs text-white/50">
              {mockDashboardData.users.active} active • {mockDashboardData.users.online} online
            </div>
          </div>

          {/* Active Roles */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-sm text-white/60">
                {metrics.roleUtilizationRate.toFixed(1)}% utilized
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{mockDashboardData.roles.active}</div>
            <div className="text-white/60 text-sm">Active Roles</div>
            <div className="mt-2 text-xs text-white/50">
              {mockDashboardData.roles.total} total • {mockDashboardData.roles.system} system
            </div>
          </div>

          {/* Security Score */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-sm text-green-400">Excellent</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metrics.securityScore.toFixed(1)}%</div>
            <div className="text-white/60 text-sm">Security Score</div>
            <div className="mt-2 w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${metrics.securityScore}%` }}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-500/20">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-sm text-white/60">{timeRange}</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{mockDashboardData.activity.roleChanges + mockDashboardData.activity.permissionChanges}</div>
            <div className="text-white/60 text-sm">Permission Changes</div>
            <div className="mt-2 text-xs text-white/50">
              {mockDashboardData.activity.roleChanges} role • {mockDashboardData.activity.permissionChanges} permission
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <FadeInUp delay={0.15}>
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Role Distribution</h3>
              <PieChart className="w-5 h-5 text-white/60" />
            </div>

            <div className="space-y-4">
              {mockRoleDistribution.map((role) => (
                <div key={role.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <span className="text-white font-medium">{role.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">{role.count} users</span>
                    <span className="text-white/40 text-sm">{role.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{mockDashboardData.users.active}</div>
                <div className="text-xs text-white/60">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{metrics.userActiveRate.toFixed(1)}%</div>
                <div className="text-xs text-white/60">Activity Rate</div>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* Security Alerts */}
        <FadeInUp delay={0.2}>
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Security Alerts</h3>
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>

            <div className="space-y-4">
              {mockSecurityAlerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-lg border border-white/10 bg-black/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'HIGH'
                        ? 'bg-red-500/20 text-red-400'
                        : alert.severity === 'MEDIUM'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {alert.severity}
                    </div>
                    <span className="text-xs text-white/50">{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                  <p className="text-white/80 text-sm mb-2">{alert.message}</p>
                  <div className="text-xs text-white/50">User: {alert.user}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                View all alerts →
              </button>
            </div>
          </div>
        </FadeInUp>
      </div>

      {/* Recent Activity */}
      <FadeInUp delay={0.25}>
        <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View all
            </button>
          </div>

          <div className="space-y-4">
            {mockRecentActivity.map((activity) => {
              const getActivityIcon = (type: string) => {
                switch (type) {
                  case 'role_assigned': return <UserCheck className="w-4 h-4 text-blue-400" />
                  case 'permission_granted': return <Shield className="w-4 h-4 text-green-400" />
                  case 'user_locked': return <UserX className="w-4 h-4 text-red-400" />
                  case 'role_created': return <Crown className="w-4 h-4 text-purple-400" />
                  default: return <Activity className="w-4 h-4 text-white/60" />
                }
              }

              const getActivityDescription = (activity: any) => {
                switch (activity.type) {
                  case 'role_assigned':
                    return `${activity.user} was assigned the ${activity.role} role`
                  case 'permission_granted':
                    return `${activity.user} was granted ${activity.permission} permission`
                  case 'user_locked':
                    return `${activity.user} account was locked: ${activity.reason}`
                  case 'role_created':
                    return `${activity.role} role was created by ${activity.creator}`
                  default:
                    return 'Unknown activity'
                }
              }

              return (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="p-2 rounded-full bg-white/10">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white/90 text-sm">{getActivityDescription(activity)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/50">{formatTimeAgo(activity.timestamp)}</span>
                      <div className={`px-2 py-0.5 rounded text-xs ${
                        activity.riskLevel === 'HIGH'
                          ? 'bg-red-500/20 text-red-400'
                          : activity.riskLevel === 'MEDIUM'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {activity.riskLevel}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </FadeInUp>

      {/* Quick Actions */}
      <FadeInUp delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">Manage Users</h4>
            <p className="text-white/60 text-sm mb-4">Add, edit, or remove user accounts and their roles</p>
            <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-colors">
              Go to Users
            </button>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-center">
            <Shield className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">Configure Roles</h4>
            <p className="text-white/60 text-sm mb-4">Create and manage roles with specific permissions</p>
            <button className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg font-medium transition-colors">
              Manage Roles
            </button>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-center">
            <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">View Reports</h4>
            <p className="text-white/60 text-sm mb-4">Access detailed analytics and audit logs</p>
            <button className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-medium transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </FadeInUp>
    </AnimatedContainer>
  )
}