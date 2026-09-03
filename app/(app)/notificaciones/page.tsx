import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listNotificationsFor } from "@/services/notification.service";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { ActionButton } from "@/components/form";
import { markAllReadAction } from "@/features/notifications/actions";
import { formatDateTime } from "@/lib/format";
import { CheckCheck } from "lucide-react";

export const metadata = { title: "Notificaciones · Acopio Hub" };

export default async function NotificacionesPage() {
  const user = await requireUser();
  const items = await listNotificationsFor({
    id: user.id,
    role: user.role,
    centerId: user.centerId,
  });
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Centro de notificaciones"
        description="Avisos internos: recepciones, mermas, transferencias, entregas y metas."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Notificaciones" },
        ]}
        actions={
          unread > 0 && (
            <ActionButton
              size="sm"
              variant="outline"
              action={markAllReadAction}
              successToast="Todo marcado como leído."
            >
              <CheckCheck className="size-4" />
              Marcar todo leído
            </ActionButton>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState title="No tienes notificaciones." />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const body = (
              <div
                className={`rounded-lg border p-4 ${
                  n.readAt
                    ? "border-slate-200 bg-white"
                    : "border-brand-200 bg-brand-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                    )}
                  </div>
                  {!n.readAt && <Badge color="blue">Nueva</Badge>}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {formatDateTime(n.createdAt)}
                </p>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? <Link href={n.link}>{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
