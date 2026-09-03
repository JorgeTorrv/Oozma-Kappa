"use server";

import { revalidatePath } from "next/cache";
import { requireUserOrThrow, assertSameOrigin } from "@/lib/auth/dal";
import { markAllRead } from "@/services/notification.service";
import { ok, runAction, type ActionState } from "@/lib/result";

export async function markAllReadAction(): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const user = await requireUserOrThrow();
    await markAllRead({
      id: user.id,
      role: user.role,
      centerId: user.centerId,
    });
    revalidatePath("/notificaciones");
    revalidatePath("/");
    return ok(undefined, "Notificaciones marcadas como leídas.");
  });
}
