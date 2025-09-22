"use client";

import { ReactNode } from "react";
import { useRole } from "@/hooks/useRole";
import { UserRole } from "@/types/auth";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  requireAll?: boolean; // true면 모든 역할이 필요, false면 하나만 있으면 됨
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, loading } = useRole();

  if (loading) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  const hasAccess = requireAll
    ? allowedRoles.every((role) => hasRole(role))
    : hasAnyRole(allowedRoles);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 편의 컴포넌트들
export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function UserOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["user", "admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["client", "user", "admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
