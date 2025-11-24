"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useRole } from "@/lib/hooks/useRole";

interface RoleButtonProps extends ButtonProps {
  requireEdit?: boolean; // Si true, solo admin y almacen pueden usar el botón
}

export function RoleButton({ requireEdit = true, disabled, children, ...props }: RoleButtonProps) {
  const { canEdit } = useRole();

  const isDisabled = requireEdit ? !canEdit() || disabled : disabled;

  return (
    <Button
      {...props}
      disabled={isDisabled}
      title={isDisabled && requireEdit ? "No tienes permisos para esta acción" : props.title}
    >
      {children}
    </Button>
  );
}
