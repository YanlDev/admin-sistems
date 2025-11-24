"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/lib/hooks/useRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, UserCog, Users, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Usuario {
  id: string;
  email: string;
  created_at: string;
  rol_id?: string;
}

interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
}

export default function AdminPage() {
  const { role, loading: roleLoading, isAdmin } = useRole();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin()) {
      toast.error("No tienes permisos para acceder a esta página");
      router.push("/protected");
      return;
    }

    if (!roleLoading && isAdmin()) {
      loadData();
    }
  }, [roleLoading, isAdmin, router]);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Cargar todos los roles disponibles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .order("id");

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Cargar todos los usuarios registrados
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("No estás autenticado");
        return;
      }

      // Obtener lista de usuarios desde auth.users (via función personalizada o RPC)
      // Por ahora, obtenemos usuarios que tienen roles asignados
      const { data: usuariosRoles, error: urError } = await supabase
        .from("usuarios_roles")
        .select("user_id, rol_id");

      if (urError) throw urError;

      // Para obtener emails, necesitamos usar una función RPC o consultar metadatos
      // Vamos a crear una lista combinada
      const usuariosMap = new Map<string, Usuario>();

      // Primero, agregar usuarios con roles
      if (usuariosRoles) {
        for (const ur of usuariosRoles) {
          usuariosMap.set(ur.user_id, {
            id: ur.user_id,
            email: "Cargando...",
            created_at: new Date().toISOString(),
            rol_id: ur.rol_id
          });
        }
      }

      // Agregar el usuario actual para asegurar que aparezca
      usuariosMap.set(user.id, {
        id: user.id,
        email: user.email || "Sin email",
        created_at: user.created_at || new Date().toISOString(),
        rol_id: usuariosMap.get(user.id)?.rol_id
      });

      setUsuarios(Array.from(usuariosMap.values()));

      // Cargar emails desde la tabla de auth (si existe acceso)
      loadUserEmails(Array.from(usuariosMap.keys()));

    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUserEmails = async (userIds: string[]) => {
    try {
      const supabase = createClient();

      // Intentar obtener información de usuarios
      for (const userId of userIds) {
        const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);

        if (!error && user) {
          setUsuarios(prev =>
            prev.map(u => u.id === userId ? { ...u, email: user.email || u.email } : u)
          );
        }
      }
    } catch (error) {
      // El método admin requiere permisos especiales, ignorar errores
      console.log("No se pudieron cargar emails desde auth.users");
    }
  };

  const handleRoleChange = async (userId: string, newRolId: string) => {
    setUpdating(userId);

    try {
      const supabase = createClient();

      // Verificar si el usuario ya tiene un rol asignado
      const { data: existingRole } = await supabase
        .from("usuarios_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        // Actualizar rol existente
        const { error } = await supabase
          .from("usuarios_roles")
          .update({ rol_id: newRolId })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insertar nuevo rol
        const { error } = await supabase
          .from("usuarios_roles")
          .insert({ user_id: userId, rol_id: newRolId });

        if (error) throw error;
      }

      toast.success("Rol actualizado correctamente");
      await loadData();

    } catch (error: any) {
      console.error("Error al actualizar rol:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleName = (rolId?: string) => {
    const rol = roles.find(r => r.id === rolId);
    return rol?.nombre || "Sin rol";
  };

  const getRolColor = (rolId?: string) => {
    const colors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      'almacen': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      'visor': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    };
    return colors[rolId || ''] || 'bg-gray-100 text-gray-800';
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-red-500" />
          Administración de Usuarios
        </h1>
        <p className="text-muted-foreground">
          Gestiona roles y permisos de usuarios
        </p>
      </div>

      {/* Información de Roles */}
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map(rol => (
          <Card key={rol.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                {rol.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{rol.descripcion}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerta informativa */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Instrucciones para asignar roles
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                1. Los nuevos usuarios aparecerán en la lista cuando inicien sesión por primera vez.<br />
                2. Selecciona un rol para cada usuario desde el menú desplegable.<br />
                3. Los cambios se aplican inmediatamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuarios Registrados
          </CardTitle>
          <CardDescription>
            Lista de todos los usuarios y sus roles asignados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol Actual</TableHead>
                      <TableHead>Asignar Rol</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRolColor(usuario.rol_id)}`}>
                            {getRoleName(usuario.rol_id)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={usuario.rol_id || ""}
                            onValueChange={(value) => handleRoleChange(usuario.id, value)}
                            disabled={updating === usuario.id}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Seleccionar rol..." />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(rol => (
                                <SelectItem key={rol.id} value={rol.id}>
                                  {rol.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(usuario.created_at).toLocaleDateString('es-PE')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de tarjetas para móvil */}
              <div className="md:hidden space-y-4">
                {usuarios.map((usuario) => (
                  <Card key={usuario.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{usuario.email}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Rol Actual</p>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRolColor(usuario.rol_id)}`}>
                            {getRoleName(usuario.rol_id)}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Asignar Rol</p>
                          <Select
                            value={usuario.rol_id || ""}
                            onValueChange={(value) => handleRoleChange(usuario.id, value)}
                            disabled={updating === usuario.id}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar rol..." />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(rol => (
                                <SelectItem key={rol.id} value={rol.id}>
                                  {rol.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                          <p className="text-sm">{new Date(usuario.created_at).toLocaleDateString('es-PE')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{usuarios.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Con Rol Asignado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {usuarios.filter(u => u.rol_id).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sin Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {usuarios.filter(u => !u.rol_id).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
