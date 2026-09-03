"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";

/**
 * Contexto que expone `close()` del modal actual. `ActionForm` lo consume para
 * cerrar el modal automáticamente cuando el formulario termina con éxito.
 */
export const DialogCloseContext = React.createContext<(() => void) | null>(null);

/**
 * Botón que abre contenido (normalmente un formulario) en una ventana flotante.
 *
 * Usa el elemento nativo `<dialog showModal()>`: trae captura de foco, cierre
 * con Escape, fondo oscurecido (`::backdrop`) y se dibuja en la "top layer",
 * por encima de todo (incluido el mapa de Leaflet).
 */
export function DialogButton({
  label,
  title,
  description,
  children,
  variant = "default",
  size = "sm",
  className,
  width = "md",
}: {
  label: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  width?: "sm" | "md" | "lg" | "xl";
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = React.useState(false);

  const close = React.useCallback(() => ref.current?.close(), []);
  const open = () => {
    setMounted(true);
    requestAnimationFrame(() => ref.current?.showModal());
  };

  const maxW = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
  }[width];

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(buttonVariants({ variant, size }), className)}
      >
        {label}
      </button>

      {mounted && (
        <dialog
          ref={ref}
          onClose={() => setMounted(false)}
          onClick={(e) => {
            if (e.target === ref.current) close();
          }}
          className={cn(
            "m-auto w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50",
            maxW,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              {description && (
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="-mr-1 rounded-md p-1 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
            <DialogCloseContext.Provider value={close}>
              {children}
            </DialogCloseContext.Provider>
          </div>
        </dialog>
      )}
    </>
  );
}
