import { requireUser, toPrincipal } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell/shell";
import { buildNav } from "@/components/app-shell/nav-config";
import { countUnreadFor } from "@/services/notification.service";
import { ROLES, type Role } from "@/lib/constants";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const principal = toPrincipal(user);
  const nav = buildNav(principal);

  // Ámbito legible (centro / institución / campaña) para la cabecera.
  let scope: string | null = null;
  if (user.centerId) {
    scope =
      (await prisma.center.findUnique({ where: { id: user.centerId } }))?.name ??
      null;
  } else if (user.institutionId) {
    scope =
      (
        await prisma.recipientInstitution.findUnique({
          where: { id: user.institutionId },
        })
      )?.name ?? null;
  } else if (user.campaignId) {
    scope =
      (await prisma.campaign.findUnique({ where: { id: user.campaignId } }))
        ?.name ?? null;
  } else if (user.role === ROLES.COORDINADOR_GENERAL) {
    scope = "Visibilidad global";
  }

  const unread = await countUnreadFor({
    id: user.id,
    role: user.role,
    centerId: user.centerId,
  });

  return (
    <AppShell
      nav={nav}
      user={{ name: user.name, role: user.role as Role, scope }}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
