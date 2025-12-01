import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Fuel, UtensilsCrossed, UserCheck, BarChart3, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-b-foreground/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4 px-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="font-bold text-xl">Sistema de Gestión</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Link href="/auth/login">
              <Button>Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Sistema Integral de Gestión y Seguimiento
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma completa para el control y seguimiento de recursos, alimentación y asistencia de personal.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/auth/login">
              <Button size="lg" className="text-lg px-8">
                Acceder al Sistema
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Crear Cuenta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-muted/50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Módulos Disponibles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg border space-y-3">
              <Fuel className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Combustible</h3>
              <p className="text-muted-foreground">
                Control detallado de consumo de combustible, costos y rendimiento por vehículo.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border space-y-3">
              <UtensilsCrossed className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Alimentación</h3>
              <p className="text-muted-foreground">
                Gestión de recursos alimentarios, inventario y control de consumo diario.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg border space-y-3">
              <UserCheck className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold">Asistencia</h3>
              <p className="text-muted-foreground">
                Registro y seguimiento de asistencia de personal con reportes detallados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="w-full py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Beneficios</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Seguro y Confiable</h3>
              <p className="text-muted-foreground">
                Control de acceso basado en roles y autenticación segura.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Reportes en Tiempo Real</h3>
              <p className="text-muted-foreground">
                Estadísticas y métricas actualizadas para mejor toma de decisiones.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Ahorro de Tiempo</h3>
              <p className="text-muted-foreground">
                Automatiza procesos y reduce tiempo en tareas administrativas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <p>Creado por Milder Carreon Chambi.</p>
      </footer>
    </main>
  );
}
