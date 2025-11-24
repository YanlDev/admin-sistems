"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/lib/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText, Fuel, DollarSign, TrendingUp, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function CombustiblePage() {
  const { canEdit, isVisor } = useRole();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    tipoCombustible: "",
    grifo: "",
    cantidad: "",
    totalCobrado: "",
    equipo: "",
    observaciones: "",
  });

  // Obtener el usuario actual
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Cargar registros
  const loadRegistros = async () => {
    setLoadingRegistros(true);
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("combustible_registros")
        .select("*")
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRegistros(data || []);
    } catch (error: any) {
      console.error("Error al cargar registros:", error);
      toast.error(`Error al cargar registros: ${error.message}`);
    } finally {
      setLoadingRegistros(false);
    }
  };

  // Cargar registros al montar el componente
  useEffect(() => {
    loadRegistros();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Verificar que el usuario esté autenticado
      if (!user) {
        toast.error("Debes iniciar sesión para guardar registros");
        return;
      }

      // Preparar los datos (precio_por_galon es una columna generada automáticamente)
      const dataToSave = {
        fecha: formData.fecha,
        tipo_combustible: formData.tipoCombustible,
        grifo: formData.grifo,
        cantidad_galones: parseFloat(formData.cantidad),
        total_cobrado: parseFloat(formData.totalCobrado),
        equipo: formData.equipo,
        observaciones: formData.observaciones || null,
        user_id: user.id,
      };

      if (editingId) {
        // Actualizar registro existente
        const { error } = await supabase
          .from("combustible_registros")
          .update(dataToSave)
          .eq("id", editingId)
          .eq("user_id", user.id); // Seguridad: solo puede editar sus propios registros

        if (error) throw error;
        toast.success("¡Registro actualizado correctamente!");
      } else {
        // Insertar nuevo registro
        const { error } = await supabase
          .from("combustible_registros")
          .insert([dataToSave])
          .select();

        if (error) throw error;
        toast.success("¡Registro guardado! El consumo de combustible se ha registrado correctamente");
      }

      // Resetear formulario
      setFormData({
        fecha: new Date().toISOString().split("T")[0],
        tipoCombustible: "",
        grifo: "",
        cantidad: "",
        totalCobrado: "",
        equipo: "",
        observaciones: "",
      });
      setEditingId(null);
      setShowForm(false);

      // Recargar registros
      await loadRegistros();

    } catch (error: any) {
      console.error("Error al guardar:", error);
      toast.error(error.message || "Ocurrió un error al guardar el registro");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      tipoCombustible: "",
      grifo: "",
      cantidad: "",
      totalCobrado: "",
      equipo: "",
      observaciones: "",
    });
  };

  const handleEdit = (registro: any) => {
    setEditingId(registro.id);
    setFormData({
      fecha: registro.fecha,
      tipoCombustible: registro.tipo_combustible,
      grifo: registro.grifo,
      cantidad: registro.cantidad_galones.toString(),
      totalCobrado: registro.total_cobrado.toString(),
      equipo: registro.equipo,
      observaciones: registro.observaciones || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (registroId: string) => {
    // Confirmación antes de eliminar
    if (!confirm("¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("combustible_registros")
        .delete()
        .eq("id", registroId)
        .eq("user_id", user?.id); // Seguridad: solo puede eliminar sus propios registros

      if (error) throw error;

      toast.success("Registro eliminado correctamente");
      await loadRegistros();

    } catch (error: any) {
      console.error("Error al eliminar:", error);
      toast.error(error.message || "Ocurrió un error al eliminar el registro");
    }
  };

  const stats = [
    {
      title: "Total Registros",
      value: registros.length.toString(),
      icon: FileText,
    },
    {
      title: "Total Galones",
      value: registros.reduce((sum, r) => sum + parseFloat(r.cantidad_galones || 0), 0).toFixed(2),
      icon: Fuel,
    },
    {
      title: "Total Gastado",
      value: `S/ ${registros.reduce((sum, r) => sum + parseFloat(r.total_cobrado || 0), 0).toFixed(2)}`,
      icon: DollarSign,
    },
    {
      title: "Precio Promedio",
      value: registros.length > 0
        ? `S/ ${(registros.reduce((sum, r) => {
            const precio = r.precio_por_galon || (r.total_cobrado / r.cantidad_galones);
            return sum + parseFloat(precio || 0);
          }, 0) / registros.length).toFixed(2)}`
        : "S/ 0.00",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Control de Combustible</h1>
        <p className="text-muted-foreground">
          Registro y control de consumo de combustible
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New Record Button */}
      {!showForm && canEdit() && (
        <div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </div>
      )}

      {/* Mensaje para usuarios visor */}
      {isVisor() && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Modo Solo Lectura
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Tu rol de "Visor" te permite ver la información pero no crear, editar o eliminar registros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar Registro" : "Nuevo Registro"}</CardTitle>
            <CardDescription>
              {editingId
                ? "Modifique los datos del registro de combustible"
                : "Complete los datos para registrar el consumo de combustible"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Fecha, Tipo Combustible, Grifo */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="fecha">
                    Fecha <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fecha"
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoCombustible">
                    Tipo Combustible <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tipoCombustible}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipoCombustible: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petroleo">Petróleo</SelectItem>
                      <SelectItem value="gasolina">Gasolina</SelectItem>
                      <SelectItem value="gasolina-premium">
                        Gasolina Premium
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grifo">
                    Grifo <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.grifo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, grifo: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRIFO D&J">GRIFO D&J</SelectItem>
                      <SelectItem value="OTROS">
                        OTROS
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Cantidad, Total Cobrado, Precio por Galón */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cantidad">
                    Cantidad (Galones) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={formData.cantidad}
                    onChange={(e) =>
                      setFormData({ ...formData, cantidad: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalCobrado">
                    Total Cobrado <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="totalCobrado"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    required
                    value={formData.totalCobrado}
                    onChange={(e) =>
                      setFormData({ ...formData, totalCobrado: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioPorGalon">Precio por Galón</Label>
                  <Input
                    id="precioPorGalon"
                    type="text"
                    placeholder="S/ 0.00"
                    value={
                      formData.cantidad && formData.totalCobrado
                        ? `S/ ${(parseFloat(formData.totalCobrado) / parseFloat(formData.cantidad)).toFixed(2)}`
                        : "S/ 0.00"
                    }
                    disabled
                  />
                </div>
              </div>

              {/* Row 3: Equipo y Registrante */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="equipo">
                    Equipo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="equipo"
                    type="text"
                    placeholder="Ej: Excavadora CAT-320"
                    required
                    value={formData.equipo}
                    onChange={(e) =>
                      setFormData({ ...formData, equipo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrante">Registrante</Label>
                  <Input
                    id="registrante"
                    type="text"
                    value={user?.email || "Cargando..."}
                    disabled
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Notas adicionales (opcional)"
                  rows={4}
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? editingId
                      ? "Actualizando..."
                      : "Guardando..."
                    : editingId
                    ? "Actualizar"
                    : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabla de registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros del Mes</CardTitle>
          <CardDescription>
            Historial de consumo de combustible
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRegistros ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando registros...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay registros todavía. Haz clic en "Nuevo Registro" para agregar uno.
              </p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Combustible</TableHead>
                      <TableHead className="text-right">Cantidad (Gal)</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Grifo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell>
                          {new Date(registro.fecha).toLocaleDateString('es-PE')}
                        </TableCell>
                        <TableCell>{registro.equipo}</TableCell>
                        <TableCell className="capitalize">
                          {registro.tipo_combustible.replace("-", " ")}
                        </TableCell>
                        <TableCell className="text-right">
                          {parseFloat(registro.cantidad_galones).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          S/ {(registro.precio_por_galon
                            ? parseFloat(registro.precio_por_galon)
                            : parseFloat(registro.total_cobrado) / parseFloat(registro.cantidad_galones)
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          S/ {parseFloat(registro.total_cobrado).toFixed(2)}
                        </TableCell>
                        <TableCell>{registro.grifo}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(registro)}
                              disabled={!canEdit() || registro.user_id !== user?.id}
                              title={
                                !canEdit()
                                  ? "No tienes permisos para editar"
                                  : registro.user_id !== user?.id
                                    ? "Solo puedes editar tus propios registros"
                                    : "Editar registro"
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(registro.id)}
                              disabled={!canEdit() || registro.user_id !== user?.id}
                              title={
                                !canEdit()
                                  ? "No tienes permisos para eliminar"
                                  : registro.user_id !== user?.id
                                    ? "Solo puedes eliminar tus propios registros"
                                    : "Eliminar registro"
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de tarjetas para móvil */}
              <div className="md:hidden space-y-4">
                {registros.map((registro) => {
                  const precioGalon = registro.precio_por_galon
                    ? parseFloat(registro.precio_por_galon)
                    : parseFloat(registro.total_cobrado) / parseFloat(registro.cantidad_galones);

                  return (
                    <Card key={registro.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {/* Fecha y Total */}
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-muted-foreground">Fecha</p>
                              <p className="font-medium">
                                {new Date(registro.fecha).toLocaleDateString('es-PE')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-lg font-bold">S/ {parseFloat(registro.total_cobrado).toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Equipo */}
                          <div>
                            <p className="text-sm text-muted-foreground">Equipo</p>
                            <p className="font-medium">{registro.equipo}</p>
                          </div>

                          {/* Combustible y Grifo */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Combustible</p>
                              <p className="font-medium capitalize">
                                {registro.tipo_combustible.replace("-", " ")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Grifo</p>
                              <p className="font-medium text-sm">{registro.grifo}</p>
                            </div>
                          </div>

                          {/* Cantidad y Precio */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Cantidad</p>
                              <p className="font-medium">{parseFloat(registro.cantidad_galones).toFixed(2)} Gal</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Precio/Gal</p>
                              <p className="font-medium">S/ {precioGalon.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Observaciones */}
                          {registro.observaciones && (
                            <div>
                              <p className="text-sm text-muted-foreground">Observaciones</p>
                              <p className="text-sm">{registro.observaciones}</p>
                            </div>
                          )}

                          {/* Botones de acción */}
                          {canEdit() && (
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEdit(registro)}
                                disabled={registro.user_id !== user?.id}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDelete(registro.id)}
                                disabled={registro.user_id !== user?.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                Eliminar
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}