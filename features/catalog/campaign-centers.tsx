"use client";

import { ActionButton } from "@/components/form";
import type { ActionState } from "@/lib/result";

export function CampaignCenterToggle({
  campaignId,
  centerId,
  linked,
  action,
}: {
  campaignId: string;
  centerId: string;
  linked: boolean;
  action: (campaignId: string, centerId: string) => Promise<ActionState>;
}) {
  return (
    <ActionButton
      size="sm"
      variant={linked ? "outline" : "default"}
      action={() => action(campaignId, centerId)}
    >
      {linked ? "Quitar" : "Vincular"}
    </ActionButton>
  );
}
