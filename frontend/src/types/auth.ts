export type UserRole = 'admin' | 'user' | 'client';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    company?: string;
  };
  role?: UserRole;
}

// 권한 정의
export const PERMISSIONS = {
  admin: {
    canAccessAdmin: true,
    canManageUsers: true,
    canViewAllProjects: true,
    canCreateProjects: true,
    canManageSystem: true,
  },
  user: {
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAllProjects: false,
    canCreateProjects: true,
    canManageSystem: false,
  },
  client: {
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAllProjects: false,
    canCreateProjects: false,
    canManageSystem: false,
  },
} as const;