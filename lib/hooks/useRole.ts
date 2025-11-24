import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "almacen" | "visor" | null;

export function useRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const supabase = createClient();

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(user);

      // Obtener rol del usuario
      const { data: roleData, error } = await supabase
        .from("usuarios_roles")
        .select("rol_id")
        .eq("user_id", user.id)
        .maybeSingle(); // Cambiado de single() a maybeSingle() para no fallar si no hay registro

      if (error) {
        // Solo logear si es un error real (no "no rows returned")
        if (error.code !== "PGRST116") {
          console.warn("Error al obtener rol:", error.message || error);
        }
        // Usuario sin rol asignado - esto es normal para nuevos usuarios
        setRole(null);
      } else {
        setRole(roleData?.rol_id as UserRole);
      }
    } catch (error) {
      console.error("Error en loadUserRole:", error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => role === "admin";
  const isAlmacen = () => role === "almacen";
  const isVisor = () => role === "visor";

  const canEdit = () => role === "admin" || role === "almacen";
  const canView = () => role === "admin" || role === "almacen" || role === "visor";

  const hasAccess = (requiredRoles: UserRole[]) => {
    return role ? requiredRoles.includes(role) : false;
  };

  return {
    role,
    loading,
    user,
    isAdmin,
    isAlmacen,
    isVisor,
    canEdit,
    canView,
    hasAccess,
    refresh: loadUserRole
  };
}
