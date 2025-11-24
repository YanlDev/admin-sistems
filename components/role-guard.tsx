"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole, UserRole } from "@/lib/hooks/useRole";
import { toast } from "sonner";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackPath = "/protected" }: RoleGuardProps) {
  const { role, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role && !allowedRoles.includes(role)) {
      toast.error("No tienes permisos para acceder a esta página");
      router.push(fallbackPath);
    }
  }, [role, loading, allowedRoles, fallbackPath, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Verificando permisos...</p>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}

// Componente específico para páginas que solo pueden editar admin y almacen
export function EditGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin", "almacen"]}>{children}</RoleGuard>;
}

// Componente específico para páginas que todos los roles autenticados pueden ver
export function ViewGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin", "almacen", "visor"]}>{children}</RoleGuard>;
}

// Componente específico solo para admin
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}
