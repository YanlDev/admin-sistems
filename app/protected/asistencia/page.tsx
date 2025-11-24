"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, UserCheck, UserX, Clock, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string | null;
  puesto: string;
  horas_extra_acumuladas: number;
  activo: boolean;
  user_id: string;
}

interface Asistencia {
  id: number;
  empleado_id: number;
  fecha: string;
  presente: boolean;
  horas_extra: number;
  observaciones: string | null;
}

export default function AsistenciaPage() {
  const [user, setUser] = useState<any>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);
  
  // Estados para empleados
  const [showEmpleadoDialog, setShowEmpleadoDialog] = useState(false);
  const [editingEmpleadoId, setEditingEmpleadoId] = useState<number | null>(null);
  const [empleadoForm, setEmpleadoForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    puesto: "",
  });

  // Estados para asistencias
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [asistenciasPorEmpleado, setAsistenciasPorEmpleado] = useState<{
    [key: number]: { presente: boolean; horas_extra: string };
  }>({});

  // Obtener usuario
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Cargar empleados
  const loadEmpleados = async () => {
    setLoadingEmpleados(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("empleados")
        .select("*")
        .eq("activo", true)
        .order("apellido", { ascending: true });

      if (error) throw error;
      setEmpleados(data || []);
    } catch (error: any) {
      console.error("Error al cargar empleados:", error);
      toast.error(`Error al cargar empleados: ${error.message}`);
    } finally {
      setLoadingEmpleados(false);
    }
  };

  // Cargar asistencias de una fecha
  const loadAsistencias = async (fecha: string) => {
    setLoadingAsistencias(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("asistencias")
        .select("*")
        .eq("fecha", fecha);

      if (error) throw error;
      
      setAsistencias(data || []);
      
      // Crear mapa de asistencias por empleado
      const mapa: { [key: number]: { presente: boolean; horas_extra: string } } = {};
      data?.forEach((asistencia) => {
        mapa[asistencia.empleado_id] = {
          presente: asistencia.presente,
          horas_extra: asistencia.horas_extra?.toString() || "0",
        };
      });
      setAsistenciasPorEmpleado(mapa);
    } catch (error: any) {
      console.error("Error al cargar asistencias:", error);
      toast.error(`Error al cargar asistencias: ${error.message}`);
    } finally {
      setLoadingAsistencias(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, []);

  useEffect(() => {
    if (empleados.length > 0) {
      loadAsistencias(fechaSeleccionada);
    }
  }, [fechaSeleccionada, empleados.length]);

  // CRUD Empleados
  const handleEmpleadoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const dataToSave = {
        nombre: empleadoForm.nombre,
        apellido: empleadoForm.apellido,
        dni: empleadoForm.dni || null,
        puesto: empleadoForm.puesto,
        user_id: user.id,
      };

      if (editingEmpleadoId) {
        const { error } = await supabase
          .from("empleados")
          .update(dataToSave)
          .eq("id", editingEmpleadoId)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Empleado actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("empleados")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Empleado creado correctamente");
      }

      setEmpleadoForm({ nombre: "", apellido: "", dni: "", puesto: "" });
      setEditingEmpleadoId(null);
      setShowEmpleadoDialog(false);
      await loadEmpleados();
    } catch (error: any) {
      console.error("Error al guardar empleado:", error);
      toast.error(error.message || "Error al guardar empleado");
    }
  };

  const handleEmpleadoEdit = (empleado: Empleado) => {
    setEditingEmpleadoId(empleado.id);
    setEmpleadoForm({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      dni: empleado.dni || "",
      puesto: empleado.puesto,
    });
    setShowEmpleadoDialog(true);
  };

  const handleEmpleadoDelete = async (empleadoId: number) => {
    if (!confirm("¿Estás seguro de eliminar este empleado? Se marcarán como inactivo.")) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("empleados")
        .update({ activo: false })
        .eq("id", empleadoId)
        .eq("user_id", user?.id);

      if (error) throw error;
      toast.success("Empleado eliminado correctamente");
      await loadEmpleados();
    } catch (error: any) {
      console.error("Error al eliminar empleado:", error);
      toast.error(error.message || "Error al eliminar empleado");
    }
  };

  // Guardar asistencias
  const handleGuardarAsistencias = async () => {
    try {
      const supabase = createClient();
      
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Preparar datos de asistencias
      const asistenciasToUpsert = empleados.map((empleado) => {
        const asistencia = asistenciasPorEmpleado[empleado.id] || {
          presente: false,
          horas_extra: "0",
        };

        return {
          empleado_id: empleado.id,
          fecha: fechaSeleccionada,
          presente: asistencia.presente,
          horas_extra: parseFloat(asistencia.horas_extra) || 0,
          user_id: user.id,
        };
      });

      // Usar upsert para insertar o actualizar
      const { error } = await supabase
        .from("asistencias")
        .upsert(asistenciasToUpsert, {
          onConflict: "empleado_id,fecha",
        });

      if (error) throw error;

      toast.success("Asistencias guardadas correctamente");
      await loadAsistencias(fechaSeleccionada);
    } catch (error: any) {
      console.error("Error al guardar asistencias:", error);
      toast.error(error.message || "Error al guardar asistencias");
    }
  };

  const handleAsistenciaChange = (
    empleadoId: number,
    field: "presente" | "horas_extra",
    value: boolean | string
  ) => {
    setAsistenciasPorEmpleado((prev) => ({
      ...prev,
      [empleadoId]: {
        ...prev[empleadoId],
        presente: prev[empleadoId]?.presente || false,
        horas_extra: prev[empleadoId]?.horas_extra || "0",
        [field]: value,
      },
    }));
  };

  // Estadísticas
  const totalEmpleados = empleados.length;
  const asistenciaHoy = asistencias.filter((a) => a.presente).length;
  const ausenciasHoy = asistencias.filter((a) => !a.presente).length;
  const horasExtraHoy = asistencias.reduce((sum, a) => sum + parseFloat(a.horas_extra.toString()), 0);

  const stats = [
    {
      title: "Total Empleados",
      value: totalEmpleados.toString(),
      icon: Users,
    },
    {
      title: "Presentes",
      value: asistenciaHoy.toString(),
      icon: UserCheck,
    },
    {
      title: "Ausentes",
      value: ausenciasHoy.toString(),
      icon: UserX,
    },
    {
      title: "Horas Extra",
      value: horasExtraHoy.toFixed(2),
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Control de Asistencia</h1>
        <p className="text-muted-foreground">
          Gestión de empleados y registro de asistencias
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="asistencia" className="space-y-4">
        <TabsList>
          <TabsTrigger value="asistencia">
            <Calendar className="h-4 w-4 mr-2" />
            Registrar Asistencia
          </TabsTrigger>
          <TabsTrigger value="empleados">
            <Users className="h-4 w-4 mr-2" />
            Empleados
          </TabsTrigger>
        </TabsList>

        {/* Tab: Registrar Asistencia */}
        <TabsContent value="asistencia" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registro de Asistencia</CardTitle>
                  <CardDescription>
                    Marque la asistencia y horas extra del personal
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="w-auto"
                  />
                  <Button onClick={handleGuardarAsistencias}>
                    Guardar Asistencias
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEmpleados || loadingAsistencias ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando...</p>
                </div>
              ) : empleados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay empleados registrados. Ve a la pestaña "Empleados" para agregar uno.
                  </p>
                </div>
              ) : (
                <>
                  {/* Vista desktop */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead>DNI</TableHead>
                          <TableHead>Puesto</TableHead>
                          <TableHead className="text-center">Presente</TableHead>
                          <TableHead className="text-right">Horas Extra</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {empleados.map((empleado) => {
                          const asistencia = asistenciasPorEmpleado[empleado.id] || {
                            presente: false,
                            horas_extra: "0",
                          };

                          return (
                            <TableRow key={empleado.id}>
                              <TableCell className="font-medium">
                                {empleado.apellido}, {empleado.nombre}
                              </TableCell>
                              <TableCell>{empleado.dni || "-"}</TableCell>
                              <TableCell>{empleado.puesto}</TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={asistencia.presente}
                                  onCheckedChange={(checked) =>
                                    handleAsistenciaChange(
                                      empleado.id,
                                      "presente",
                                      checked as boolean
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={asistencia.horas_extra}
                                  onChange={(e) =>
                                    handleAsistenciaChange(
                                      empleado.id,
                                      "horas_extra",
                                      e.target.value
                                    )
                                  }
                                  className="w-24 ml-auto"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Vista móvil */}
                  <div className="md:hidden space-y-4">
                    {empleados.map((empleado) => {
                      const asistencia = asistenciasPorEmpleado[empleado.id] || {
                        presente: false,
                        horas_extra: "0",
                      };

                      return (
                        <Card key={empleado.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium text-lg">
                                  {empleado.apellido}, {empleado.nombre}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {empleado.puesto}
                                  {empleado.dni && ` • DNI: ${empleado.dni}`}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`presente-${empleado.id}`}
                                    checked={asistencia.presente}
                                    onCheckedChange={(checked) =>
                                      handleAsistenciaChange(
                                        empleado.id,
                                        "presente",
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label htmlFor={`presente-${empleado.id}`}>
                                    Presente
                                  </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`horas-${empleado.id}`}>H. Extra:</Label>
                                  <Input
                                    id={`horas-${empleado.id}`}
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={asistencia.horas_extra}
                                    onChange={(e) =>
                                      handleAsistenciaChange(
                                        empleado.id,
                                        "horas_extra",
                                        e.target.value
                                      )
                                    }
                                    className="w-20"
                                  />
                                </div>
                              </div>
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
        </TabsContent>

        {/* Tab: Empleados */}
        <TabsContent value="empleados" className="space-y-4">
          <div className="flex justify-between items-center">
            <Dialog open={showEmpleadoDialog} onOpenChange={setShowEmpleadoDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Empleado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingEmpleadoId ? "Editar Empleado" : "Nuevo Empleado"}
                  </DialogTitle>
                  <DialogDescription>
                    Complete los datos del empleado
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEmpleadoSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">
                        Nombre <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nombre"
                        required
                        value={empleadoForm.nombre}
                        onChange={(e) =>
                          setEmpleadoForm({ ...empleadoForm, nombre: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido">
                        Apellido <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="apellido"
                        required
                        value={empleadoForm.apellido}
                        onChange={(e) =>
                          setEmpleadoForm({ ...empleadoForm, apellido: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI (opcional)</Label>
                    <Input
                      id="dni"
                      value={empleadoForm.dni}
                      onChange={(e) =>
                        setEmpleadoForm({ ...empleadoForm, dni: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="puesto">
                      Puesto <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={empleadoForm.puesto}
                      onValueChange={(value) =>
                        setEmpleadoForm({ ...empleadoForm, puesto: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Peón">Peón</SelectItem>
                        <SelectItem value="Operario">Operario</SelectItem>
                        <SelectItem value="Administrativo">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEmpleadoDialog(false);
                        setEditingEmpleadoId(null);
                        setEmpleadoForm({ nombre: "", apellido: "", dni: "", puesto: "" });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingEmpleadoId ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Empleados</CardTitle>
              <CardDescription>Personal activo registrado</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEmpleados ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Cargando empleados...</p>
                </div>
              ) : empleados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay empleados registrados. Haz clic en "Nuevo Empleado" para agregar uno.
                  </p>
                </div>
              ) : (
                <>
                  {/* Vista desktop */}
                  <div className="hidden md:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre Completo</TableHead>
                          <TableHead>DNI</TableHead>
                          <TableHead>Puesto</TableHead>
                          <TableHead className="text-right">Horas Extra Acum.</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {empleados.map((empleado) => (
                          <TableRow key={empleado.id}>
                            <TableCell className="font-medium">
                              {empleado.apellido}, {empleado.nombre}
                            </TableCell>
                            <TableCell>{empleado.dni || "-"}</TableCell>
                            <TableCell>{empleado.puesto}</TableCell>
                            <TableCell className="text-right">
                              {parseFloat(empleado.horas_extra_acumuladas.toString()).toFixed(2)} hrs
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEmpleadoEdit(empleado)}
                                  disabled={empleado.user_id !== user?.id}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEmpleadoDelete(empleado.id)}
                                  disabled={empleado.user_id !== user?.id}
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

                  {/* Vista móvil */}
                  <div className="md:hidden space-y-4">
                    {empleados.map((empleado) => (
                      <Card key={empleado.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium text-lg">
                                {empleado.apellido}, {empleado.nombre}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {empleado.puesto}
                                {empleado.dni && ` • DNI: ${empleado.dni}`}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground">Horas Extra Acumuladas</p>
                              <p className="font-medium">
                                {parseFloat(empleado.horas_extra_acumuladas.toString()).toFixed(2)} hrs
                              </p>
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEmpleadoEdit(empleado)}
                                disabled={empleado.user_id !== user?.id}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEmpleadoDelete(empleado.id)}
                                disabled={empleado.user_id !== user?.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                Eliminar
                              </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}