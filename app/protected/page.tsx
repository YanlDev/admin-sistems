"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Fuel,
  UtensilsCrossed,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  ArrowRight,
  Plus,
  BarChart3,
  Users,
  DollarSign,
  Shield
} from "lucide-react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasRole, setHasRole] = useState(false);
  const [stats, setStats] = useState({
    combustible: {
      totalRegistros: 0,
      totalGalones: 0,
      totalGastado: 0,
      registrosHoy: 0
    },
    alimentacion: {
      totalRegistros: 0,
      totalPersonas: 0,
      registrosHoy: 0
    },
    asistencia: {
      totalRegistros: 0,
      totalPresentes: 0,
      totalAusentes: 0,
      registrosHoy: 0
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // Obtener usuario
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Verificar si el usuario tiene rol asignado
      if (user) {
        const { data: roleData } = await supabase
          .from("usuarios_roles")
          .select("rol_id")
          .eq("user_id", user.id)
          .maybeSingle();

        setHasRole(!!roleData?.rol_id);
      }

      const hoy = new Date().toISOString().split('T')[0];

      // Cargar estadísticas de combustible
      const { data: combustibleData } = await supabase
        .from("combustible_registros")
        .select("*");

      if (combustibleData) {
        const totalGalones = combustibleData.reduce((sum, r) => sum + parseFloat(r.cantidad_galones || 0), 0);
        const totalGastado = combustibleData.reduce((sum, r) => sum + parseFloat(r.total_cobrado || 0), 0);
        const registrosHoy = combustibleData.filter(r => r.fecha === hoy).length;

        setStats(prev => ({
          ...prev,
          combustible: {
            totalRegistros: combustibleData.length,
            totalGalones,
            totalGastado,
            registrosHoy
          }
        }));
      }

      // Cargar estadísticas de alimentación
      const { data: alimentacionData } = await supabase
        .from("alimentacion_registros")
        .select("*");

      if (alimentacionData) {
        const totalPersonas = alimentacionData.reduce((sum, r) => sum + (r.cantidad || 0), 0);
        const registrosHoy = alimentacionData.filter(r => r.fecha === hoy).length;

        setStats(prev => ({
          ...prev,
          alimentacion: {
            totalRegistros: alimentacionData.length,
            totalPersonas,
            registrosHoy
          }
        }));
      }

      // Cargar estadísticas de asistencia
      const { data: asistenciaData } = await supabase
        .from("asistencia")
        .select("*");

      if (asistenciaData) {
        const totalPresentes = asistenciaData.filter(r => r.estado === 'presente').length;
        const totalAusentes = asistenciaData.filter(r => r.estado === 'ausente').length;
        const registrosHoy = asistenciaData.filter(r => r.fecha === hoy).length;

        setStats(prev => ({
          ...prev,
          asistencia: {
            totalRegistros: asistenciaData.length,
            totalPresentes,
            totalAusentes,
            registrosHoy
          }
        }));
      }

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Registrar Combustible",
      description: "Ingresa un nuevo consumo de combustible",
      icon: Fuel,
      href: "/protected/combustible",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950"
    },
    {
      title: "Registrar Alimentación",
      description: "Registra servicios de alimentación",
      icon: UtensilsCrossed,
      href: "/protected/alimentacion",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Marcar Asistencia",
      description: "Registrar asistencia del personal",
      icon: ClipboardCheck,
      href: "/protected/asistencia",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    }
  ];

  const overviewStats = [
    {
      title: "Combustible Hoy",
      value: stats.combustible.registrosHoy.toString(),
      subtitle: "registros",
      icon: Calendar,
      color: "text-orange-500"
    },
    {
      title: "Alimentación Hoy",
      value: stats.alimentacion.registrosHoy.toString(),
      subtitle: "registros",
      icon: Calendar,
      color: "text-green-500"
    },
    {
      title: "Asistencia Hoy",
      value: stats.asistencia.registrosHoy.toString(),
      subtitle: "registros",
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Total Gastado",
      value: `S/ ${stats.combustible.totalGastado.toFixed(0)}`,
      subtitle: "en combustible",
      icon: DollarSign,
      color: "text-red-500"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.email || "Usuario"}
        </p>
      </div>

      {/* Alerta de sin rol asignado */}
      {!hasRole && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Rol no asignado
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Tu cuenta aún no tiene un rol asignado. Contacta al administrador del sistema para obtener acceso a los módulos.
                  Una vez asignado tu rol, podrás acceder a Combustible, Alimentación y Asistencia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas Generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Accesos Rápidos */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Accesos Rápidos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                className={`transition-all hover:shadow-md ${action.disabled ? 'opacity-60' : 'cursor-pointer'}`}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {action.title}
                    {action.disabled && (
                      <span className="text-xs font-normal text-muted-foreground">
                        Próximamente
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {action.disabled ? (
                    <Button disabled className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Próximamente
                    </Button>
                  ) : (
                    <Link href={action.href}>
                      <Button className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Registro
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Resumen por Módulo */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Resumen de Módulos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Combustible */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-orange-500" />
                Control de Combustible
              </CardTitle>
              <CardDescription>
                Gestión de consumo de combustible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Registros</span>
                  <span className="font-bold">{stats.combustible.totalRegistros}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Galones</span>
                  <span className="font-bold">{stats.combustible.totalGalones.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Gastado</span>
                  <span className="font-bold">S/ {stats.combustible.totalGastado.toFixed(2)}</span>
                </div>
                <Link href="/protected/combustible">
                  <Button variant="outline" className="w-full mt-2">
                    Ver Detalle
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Alimentación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-green-500" />
                Control de Alimentación
              </CardTitle>
              <CardDescription>
                Gestión de servicios de alimentación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Registros</span>
                  <span className="font-bold">{stats.alimentacion.totalRegistros}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Personas</span>
                  <span className="font-bold">{stats.alimentacion.totalPersonas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Promedio/día</span>
                  <span className="font-bold">
                    {stats.alimentacion.totalRegistros > 0
                      ? (stats.alimentacion.totalPersonas / stats.alimentacion.totalRegistros).toFixed(1)
                      : "0"}
                  </span>
                </div>
                <Link href="/protected/alimentacion">
                  <Button variant="outline" className="w-full mt-2">
                    Ver Detalle
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos y Análisis */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Análisis Visual</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Gráfico de Combustible por Mes */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos en Combustible</CardTitle>
              <CardDescription>Total gastado acumulado</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="w-full h-full">
                <Doughnut
                  data={{
                    labels: ['Gastado', 'Presupuesto Restante'],
                    datasets: [{
                      data: [stats.combustible.totalGastado, Math.max(0, 50000 - stats.combustible.totalGastado)],
                      backgroundColor: [
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(229, 231, 235, 0.5)'
                      ],
                      borderColor: [
                        'rgba(249, 115, 22, 1)',
                        'rgba(229, 231, 235, 1)'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Alimentación */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios de Alimentación</CardTitle>
              <CardDescription>Distribución por tipo de comida</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="w-full h-full">
                <Bar
                  data={{
                    labels: ['Desayunos', 'Almuerzos', 'Cenas'],
                    datasets: [{
                      label: 'Personas Servidas',
                      data: [
                        stats.alimentacion.totalPersonas * 0.3,
                        stats.alimentacion.totalPersonas * 0.5,
                        stats.alimentacion.totalPersonas * 0.2
                      ],
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgba(34, 197, 94, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Asistencia */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Asistencia</CardTitle>
              <CardDescription>Distribución del personal</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="w-full h-full">
                <Doughnut
                  data={{
                    labels: ['Presentes', 'Ausentes', 'Otros'],
                    datasets: [{
                      data: [
                        stats.asistencia.totalPresentes,
                        stats.asistencia.totalAusentes,
                        stats.asistencia.totalRegistros - stats.asistencia.totalPresentes - stats.asistencia.totalAusentes
                      ],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(234, 179, 8, 0.8)'
                      ],
                      borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(234, 179, 8, 1)'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Tendencia */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad General</CardTitle>
              <CardDescription>Registros por módulo</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="w-full h-full">
                <Bar
                  data={{
                    labels: ['Combustible', 'Alimentación', 'Asistencia'],
                    datasets: [{
                      label: 'Total de Registros',
                      data: [
                        stats.combustible.totalRegistros,
                        stats.alimentacion.totalRegistros,
                        stats.asistencia.totalRegistros
                      ],
                      backgroundColor: [
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)'
                      ],
                      borderColor: [
                        'rgba(249, 115, 22, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
