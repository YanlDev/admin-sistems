import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { RolType } from "@/lib/roles";

export function useUserRole() {
  const [rol, setRol] = useState<RolType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from("usuarios_roles")
            .select("rol_id")
            .eq("user_id", user.id)
            .single();

          if (!error && data) {
            setRol(data.rol_id as RolType);
          } else {
            // Si no tiene rol asignado, asignar rol por defecto 'visor'
            setRol('visor');
          }
        }
      } catch (error) {
        console.error("Error al cargar rol:", error);
        setRol('visor');
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  return { rol, loading };
}