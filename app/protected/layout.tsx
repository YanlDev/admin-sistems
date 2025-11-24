"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Fuel,
  UtensilsCrossed,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useRole } from "@/lib/hooks/useRole";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { role, loading: loadingRol, isAdmin, canView } = useRole();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // Todos pueden ver el dashboard incluso sin rol
  const canAccessDashboard = true;

  const navLinks = [
    {
      name: "Dashboard",
      href: "/protected",
      icon: LayoutDashboard,
      show: canAccessDashboard,
    },
    {
      name: "Combustible",
      href: "/protected/combustible",
      icon: Fuel,
      show: canView(), // admin, almacen, visor
    },
    {
      name: "Alimentación",
      href: "/protected/alimentacion",
      icon: UtensilsCrossed,
      show: canView(), // admin, almacen, visor
    },
    {
      name: "Asistencia",
      href: "/protected/asistencia",
      icon: ClipboardList,
      show: canView(), // admin, almacen, visor
    },
    {
      name: "Administración",
      href: "/protected/admin",
      icon: Shield,
      show: isAdmin(), // Solo admin
    },
  ].filter(link => link.show);

  if (loading || loadingRol) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Consorcio Soramayo</h2>
              {role && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {role}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {user && (
            <div className="px-3 py-2 text-sm">
              <p className="font-medium truncate">{user.email}</p>
            </div>
          )}

          {mounted && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-5 w-5 mr-3" />
                  Modo Claro
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 mr-3" />
                  Modo Oscuro
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-background border-b lg:hidden">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Consorcio Soramayo</h1>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}