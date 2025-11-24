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
import { Plus, Coffee, UtensilsCrossed, Moon, Users, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AlimentacionPage() {
  const { canEdit, isVisor } = useRole();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    empresa: "",
    tipoComida: "",
    cantidad: "1",
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
        .from("alimentacion_registros")
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

      if (!user) {
        toast.error("Debes iniciar sesión para guardar registros");
        return;
      }

      const dataToSave = {
        fecha: formData.fecha,
        empresa: formData.empresa,
        tipo_comida: formData.tipoComida,
        cantidad: parseInt(formData.cantidad) || 1,
        observaciones: formData.observaciones || null,
        user_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("alimentacion_registros")
          .update(dataToSave)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("¡Registro actualizado correctamente!");
      } else {
        const { error } = await supabase
          .from("alimentacion_registros")
          .insert([dataToSave])
          .select();

        if (error) throw error;
        toast.success("¡Registro guardado correctamente!");
      }

      setFormData({
        fecha: new Date().toISOString().split("T")[0],
        empresa: "",
        tipoComida: "",
        cantidad: "1",
        observaciones: "",
      });
      setEditingId(null);
      setShowForm(false);
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
      empresa: "",
      tipoComida: "",
      cantidad: "1",
      observaciones: "",
    });
  };

  const handleEdit = (registro: any) => {
    setEditingId(registro.id);
    setFormData({
      fecha: registro.fecha,
      empresa: registro.empresa,
      tipoComida: registro.tipo_comida,
      cantidad: registro.cantidad.toString(),
      observaciones: registro.observaciones || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (registroId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) {
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("alimentacion_registros")
        .delete()
        .eq("id", registroId)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Registro eliminado correctamente");
      await loadRegistros();

    } catch (error: any) {
      console.error("Error al eliminar:", error);
      toast.error(error.message || "Ocurrió un error al eliminar el registro");
    }
  };

  // Calcular estadísticas
  const totalDesayunos = registros
    .filter(r => r.tipo_comida === 'desayuno')
    .reduce((sum, r) => sum + r.cantidad, 0);

  const totalAlmuerzos = registros
    .filter(r => r.tipo_comida === 'almuerzo')
    .reduce((sum, r) => sum + r.cantidad, 0);

  const totalCenas = registros
    .filter(r => r.tipo_comida === 'cena')
    .reduce((sum, r) => sum + r.cantidad, 0);

  const stats = [
    {
      title: "Total Registros",
      value: registros.length.toString(),
      icon: Users,
    },
    {
      title: "Total Desayunos",
      value: totalDesayunos.toString(),
      icon: Coffee,
    },
    {
      title: "Total Almuerzos",
      value: totalAlmuerzos.toString(),
      icon: UtensilsCrossed,
    },
    {
      title: "Total Cenas",
      value: totalCenas.toString(),
      icon: Moon,
    },
  ];

  const getTipoComidaLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'desayuno': 'Desayuno',
      'almuerzo': 'Almuerzo',
      'cena': 'Cena'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Control de Alimentación</h1>
        <p className="text-muted-foreground">
          Registro individual de cada servicio de alimentación
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
                ? "Modifique los datos del registro de alimentación"
                : "Registre cada servicio de alimentación por separado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Fecha, Empresa, Tipo de Comida */}
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
                  <Label htmlFor="empresa">
                    Empresa <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.empresa}
                    onValueChange={(value) =>
                      setFormData({ ...formData, empresa: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gallegos Subcontrata">Gallegos Subcontrata</SelectItem>
                      <SelectItem value="Consorcio Soramayo">Consorcio Soramayo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoComida">
                    Tipo de Comida <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tipoComida}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipoComida: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desayuno">Desayuno</SelectItem>
                      <SelectItem value="almuerzo">Almuerzo</SelectItem>
                      <SelectItem value="cena">Cena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Cantidad */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cantidad">
                    Cantidad de Personas <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    placeholder="1"
                    required
                    value={formData.cantidad}
                    onChange={(e) =>
                      setFormData({ ...formData, cantidad: e.target.value })
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
                  rows={3}
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
          <CardTitle>Registros de Alimentación</CardTitle>
          <CardDescription>
            Historial de servicios de alimentación registrados
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
                      <TableHead>Empresa</TableHead>
                      <TableHead>Tipo de Comida</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((registro) => (
                      <TableRow key={registro.id}>
                        <TableCell>
                          {new Date(registro.fecha).toLocaleDateString('es-PE')}
                        </TableCell>
                        <TableCell>{registro.empresa}</TableCell>
                        <TableCell>{getTipoComidaLabel(registro.tipo_comida)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {registro.cantidad}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {registro.observaciones || "-"}
                        </TableCell>
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
                {registros.map((registro) => (
                  <Card key={registro.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* Fecha y Empresa */}
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">Fecha</p>
                            <p className="font-medium">
                              {new Date(registro.fecha).toLocaleDateString('es-PE')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Cantidad</p>
                            <p className="text-lg font-bold">{registro.cantidad}</p>
                          </div>
                        </div>

                        {/* Empresa */}
                        <div>
                          <p className="text-sm text-muted-foreground">Empresa</p>
                          <p className="font-medium">{registro.empresa}</p>
                        </div>

                        {/* Tipo de Comida */}
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo de Comida</p>
                          <p className="font-medium">{getTipoComidaLabel(registro.tipo_comida)}</p>
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
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}