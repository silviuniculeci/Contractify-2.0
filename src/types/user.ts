export type UserRole = 
  | 'sales'
  | 'sales_support'
  | 'operational'
  | 'sales_manager'
  | 'marketing'

export interface User {
  id: string
  email: string
  role: UserRole
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

export interface UserPermissions {
  canCreateContract: boolean
  canEditContract: boolean
  canDeleteContract: boolean
  canViewContracts: boolean
  canApproveContracts: boolean
  canManageUsers: boolean
  canViewReports: boolean
  canExportData: boolean
}

// Define permissions for each role
export const rolePermissions: Record<UserRole, UserPermissions> = {
  sales: {
    canCreateContract: true,
    canEditContract: true,
    canDeleteContract: false,
    canViewContracts: true,
    canApproveContracts: false,
    canManageUsers: false,
    canViewReports: true,
    canExportData: true
  },
  sales_support: {
    canCreateContract: false,
    canEditContract: true,
    canDeleteContract: false,
    canViewContracts: true,
    canApproveContracts: false,
    canManageUsers: false,
    canViewReports: false,
    canExportData: true
  },
  operational: {
    canCreateContract: false,
    canEditContract: true,
    canDeleteContract: false,
    canViewContracts: true,
    canApproveContracts: false,
    canManageUsers: false,
    canViewReports: true,
    canExportData: true
  },
  sales_manager: {
    canCreateContract: true,
    canEditContract: true,
    canDeleteContract: true,
    canViewContracts: true,
    canApproveContracts: true,
    canManageUsers: true,
    canViewReports: true,
    canExportData: true
  },
  marketing: {
    canCreateContract: false,
    canEditContract: false,
    canDeleteContract: false,
    canViewContracts: true,
    canApproveContracts: false,
    canManageUsers: false,
    canViewReports: true,
    canExportData: true
  }
} 