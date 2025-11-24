-- ============================================
-- ACTUALIZACIÓN DE POLÍTICAS RLS CON ROLES
-- ============================================
-- Este script actualiza las políticas RLS de las tablas de datos
-- para que respeten el sistema de roles (admin, almacen, visor)
-- ============================================

-- ============================================
-- 1. COMBUSTIBLE_REGISTROS
-- ============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Authenticated users can view all records" ON combustible_registros;
DROP POLICY IF EXISTS "Users can insert own records" ON combustible_registros;
DROP POLICY IF EXISTS "Users can update own records" ON combustible_registros;
DROP POLICY IF EXISTS "Users can delete own records" ON combustible_registros;

-- Política: Ver registros (admin, almacen, visor)
CREATE POLICY "Users with role can view all records"
  ON combustible_registros
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen', 'visor')
    )
  );

-- Política: Insertar registros (solo admin y almacen)
CREATE POLICY "Admin and almacen can insert records"
  ON combustible_registros
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
    AND auth.uid() = user_id
  );

-- Política: Actualizar registros (solo admin y almacen, solo sus propios registros)
CREATE POLICY "Admin and almacen can update own records"
  ON combustible_registros
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
  );

-- Política: Eliminar registros (solo admin y almacen, solo sus propios registros)
CREATE POLICY "Admin and almacen can delete own records"
  ON combustible_registros
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
  );


-- ============================================
-- 2. ALIMENTACION_REGISTROS
-- ============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Authenticated users can view all records" ON alimentacion_registros;
DROP POLICY IF EXISTS "Users can insert own records" ON alimentacion_registros;
DROP POLICY IF EXISTS "Users can update own records" ON alimentacion_registros;
DROP POLICY IF EXISTS "Users can delete own records" ON alimentacion_registros;

-- Política: Ver registros (admin, almacen, visor)
CREATE POLICY "Users with role can view all records"
  ON alimentacion_registros
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen', 'visor')
    )
  );

-- Política: Insertar registros (solo admin y almacen)
CREATE POLICY "Admin and almacen can insert records"
  ON alimentacion_registros
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
    AND auth.uid() = user_id
  );

-- Política: Actualizar registros (solo admin y almacen, solo sus propios registros)
CREATE POLICY "Admin and almacen can update own records"
  ON alimentacion_registros
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
  );

-- Política: Eliminar registros (solo admin y almacen, solo sus propios registros)
CREATE POLICY "Admin and almacen can delete own records"
  ON alimentacion_registros
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
  );


-- ============================================
-- 3. ASISTENCIA (si usas tabla "asistencia")
-- ============================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Authenticated users can view all records" ON asistencia;
DROP POLICY IF EXISTS "Users can insert own records" ON asistencia;
DROP POLICY IF EXISTS "Users can update own records" ON asistencia;
DROP POLICY IF EXISTS "Users can delete own records" ON asistencia;

-- Política: Ver registros (admin, almacen, visor)
CREATE POLICY "Users with role can view all records"
  ON asistencia
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen', 'visor')
    )
  );

-- Política: Insertar registros (solo admin y almacen)
CREATE POLICY "Admin and almacen can insert records"
  ON asistencia
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
    AND auth.uid() = user_id
  );

-- Política: Actualizar registros (solo admin y almacen, solo sus propios registros)
CREATE POLICY "Admin and almacen can update own records"
  ON asistencia
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
  );

-- Política: Eliminar registros (solo admin y almacen, solo sus propios registros)
CREATE POLICY "Admin and almacen can delete own records"
  ON asistencia
  FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM usuarios_roles
      WHERE user_id = auth.uid()
      AND rol_id IN ('admin', 'almacen')
    )
  );


-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('combustible_registros', 'alimentacion_registros', 'asistencia')
ORDER BY tablename, cmd;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
--
-- 1. Estas políticas garantizan que:
--    - VISOR: Solo puede VER registros (SELECT)
--    - ALMACEN: Puede VER, CREAR, EDITAR y ELIMINAR sus propios registros
--    - ADMIN: Puede VER, CREAR, EDITAR y ELIMINAR sus propios registros
--
-- 2. Los usuarios sin rol NO podrán acceder a ningún dato
--
-- 3. La seguridad ahora está en dos niveles:
--    - Frontend: Botones deshabilitados/ocultos según rol
--    - Backend (RLS): Base de datos valida permisos según rol
--
-- 4. Si intentas hacer una acción sin permisos, Supabase retornará:
--    Error: "new row violates row-level security policy"
--
-- ============================================
