"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DialogCloseContext } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/result";

/** Botón de envío con estado `pending` automático (a11y + feedback, spec §22). */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? (pendingText ?? "Guardando…") : children}
    </Button>
  );
}

type ActionFn = (
  state: ActionState | undefined,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Formulario que envuelve un Server Action con `useActionState`, muestra errores
 * de campo, dispara toasts y opcionalmente refresca / redirige al terminar.
 */
export function ActionForm({
  action,
  children,
  onSuccess,
  successToast,
  refreshOnSuccess = true,
  resetOnSuccess = false,
  className,
}: {
  action: ActionFn;
  children:
    | React.ReactNode
    | ((state: ActionState | undefined) => React.ReactNode);
  onSuccess?: (state: Extract<ActionState, { ok: true }>) => void;
  successToast?: string;
  refreshOnSuccess?: boolean;
  resetOnSuccess?: boolean;
  className?: string;
}) {
  const [state, formAction] = React.useActionState(action, undefined);
  const { toast } = useToast();
  const router = useRouter();
  const closeDialog = React.useContext(DialogCloseContext);
  const formRef = React.useRef<HTMLFormElement>(null);
  const lastHandled = React.useRef<ActionState | undefined>(undefined);

  React.useEffect(() => {
    if (!state || state === lastHandled.current) return;
    lastHandled.current = state;
    if (state.ok) {
      toast(successToast ?? state.message ?? "Operación realizada.", "success");
      if (resetOnSuccess) formRef.current?.reset();
      if (refreshOnSuccess) router.refresh();
      onSuccess?.(state);
      // Si el formulario vive dentro de un modal, ciérralo al terminar bien.
      closeDialog?.();
    } else {
      toast(state.message, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={className} noValidate>
      {typeof children === "function" ? children(state) : children}
    </form>
  );
}

/**
 * Botón que ejecuta un Server Action simple (sin formulario de campos).
 * Si recibe `confirm`, pide confirmación en una ventana flotante propia del
 * sitio (nunca el `window.confirm()` nativo del navegador, que se ve genérico
 * y no se puede vestir).
 */
export function ActionButton({
  action,
  confirm,
  confirmTitle = "Confirmar",
  confirmLabel = "Confirmar",
  confirmVariant = "default",
  successToast,
  children,
  ...props
}: ButtonProps & {
  action: () => Promise<ActionState>;
  confirm?: string;
  confirmTitle?: string;
  confirmLabel?: string;
  confirmVariant?: ButtonProps["variant"];
  successToast?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const closeDialog = React.useContext(DialogCloseContext);
  const [pending, start] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);
  const confirmRef = React.useRef<HTMLDialogElement>(null);

  const run = () => {
    start(async () => {
      const res = await action();
      if (res.ok) {
        toast(successToast ?? res.message ?? "Listo.", "success");
        router.refresh();
        closeDialog?.();
      } else {
        toast(res.message, "error");
      }
    });
  };

  const closeConfirm = () => confirmRef.current?.close();

  return (
    <>
      <Button
        {...props}
        disabled={pending || props.disabled}
        aria-busy={pending}
        onClick={() => {
          if (!confirm) {
            run();
            return;
          }
          setConfirming(true);
          requestAnimationFrame(() => confirmRef.current?.showModal());
        }}
      >
        {children}
      </Button>

      {confirming && confirm && (
        <dialog
          ref={confirmRef}
          onClose={() => setConfirming(false)}
          onClick={(e) => {
            if (e.target === confirmRef.current) closeConfirm();
          }}
          className="m-auto w-[calc(100vw-1.5rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50"
        >
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">{confirmTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">{confirm}</p>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <button
              type="button"
              onClick={closeConfirm}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                closeConfirm();
                run();
              }}
              className={cn(buttonVariants({ variant: confirmVariant, size: "sm" }))}
            >
              {confirmLabel}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
