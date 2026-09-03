import "server-only";
import { prisma, type Db } from "@/lib/db";
import type { NotificationType } from "@/lib/constants";
import type { Role } from "@/lib/constants";

/**
 * Notificaciones internas (extra, spec §19). Sin correo ni servicios externos:
 * sólo filas en la base que el centro de notificaciones muestra dentro de la app.
 * Una notificación puede dirigirse a un usuario, a un rol y/o a un centro.
 */
export type NotifyInput = {
  type: NotificationType;
  title: string;
  body?: string;
  userId?: string;
  role?: Role;
  centerId?: string;
  link?: string;
};

export async function notify(input: NotifyInput, db: Db = prisma) {
  return db.notification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      userId: input.userId ?? null,
      role: input.role ?? null,
      centerId: input.centerId ?? null,
      link: input.link ?? null,
    },
  });
}

/** Notificaciones visibles para un usuario según su identidad, rol y centro. */
export async function listNotificationsFor(user: {
  id: string;
  role: string;
  centerId: string | null;
}) {
  return prisma.notification.findMany({
    where: {
      OR: [
        { userId: user.id },
        { role: user.role },
        ...(user.centerId ? [{ centerId: user.centerId }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function countUnreadFor(user: {
  id: string;
  role: string;
  centerId: string | null;
}) {
  return prisma.notification.count({
    where: {
      readAt: null,
      OR: [
        { userId: user.id },
        { role: user.role },
        ...(user.centerId ? [{ centerId: user.centerId }] : []),
      ],
    },
  });
}

export async function markAllRead(user: {
  id: string;
  role: string;
  centerId: string | null;
}) {
  await prisma.notification.updateMany({
    where: {
      readAt: null,
      OR: [
        { userId: user.id },
        { role: user.role },
        ...(user.centerId ? [{ centerId: user.centerId }] : []),
      ],
    },
    data: { readAt: new Date() },
  });
}
