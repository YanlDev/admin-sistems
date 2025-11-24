export const PERMISOS = {
  admin: {
    dashboard: true,
    combustible: { ver: true, crear: true, editar: true, eliminar: true },
    alimentacion: { ver: true, crear: true, editar: true, eliminar: true },
    asistencia: { ver: true, crear: true, editar: true, eliminar: true },
    gestionUsuarios: true,
  },
  almacen: {
    dashboard: true,
    combustible: { ver: true, crear: true, editar: true, eliminar: true },
    alimentacion: { ver: true, crear: true, editar: true, eliminar: true },
    asistencia: { ver: true, crear: true, editar: true, eliminar: true },
    gestionUsuarios: false,
  },
  visor: {
    dashboard: true,
    combustible: { ver: true, crear: false, editar: false, eliminar: false },
    alimentacion: { ver: true, crear: false, editar: false, eliminar: false },
    asistencia: { ver: true, crear: false, editar: false, eliminar: false },
    gestionUsuarios: false,
  },
};

export type RolType = keyof typeof PERMISOS;

export function tienePermiso(
  rol: RolType | null,
  modulo: keyof typeof PERMISOS.admin,
  accion?: 'ver' | 'crear' | 'editar' | 'eliminar'
): boolean {
  if (!rol) return false;
  
  const permisos = PERMISOS[rol];
  if (!permisos) return false;

  const permisoModulo = permisos[modulo];
  
  // Si es un permiso simple (boolean)
  if (typeof permisoModulo === 'boolean') {
    return permisoModulo;
  }
  
  // Si es un objeto con acciones
  if (typeof permisoModulo === 'object' && accion) {
    return permisoModulo[accion] || false;
  }
  
  return false;
}