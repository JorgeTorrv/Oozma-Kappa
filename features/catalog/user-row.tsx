"use client";

import { TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/primitives";
import { DialogButton } from "@/components/ui/dialog";
import { ToggleActiveButton } from "./row-actions";
import { toggleUserAction } from "./actions";
import { UserForm } from "./forms";

type Opt = { id: string; name: string };
type U = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  roleLabel: string;
  active: boolean;
  scope: string;
  centerId: string | null;
  institutionId: string | null;
  campaignId: string | null;
};

export function UserRow({
  user,
  self,
  centers,
  institutions,
  campaigns,
}: {
  user: U;
  self: boolean;
  centers: Opt[];
  institutions: Opt[];
  campaigns: Opt[];
}) {
  return (
    <>
      <TR>
        <TD className="font-medium text-slate-900">
          {user.name}
          {self && (
            <Badge color="blue" className="ml-2">
              tú
            </Badge>
          )}
        </TD>
        <TD className="text-slate-500">
          {user.phone ?? "—"}
          {user.email && (
            <span className="block text-xs text-slate-400">{user.email}</span>
          )}
        </TD>
        <TD>{user.roleLabel}</TD>
        <TD className="text-slate-500">{user.scope}</TD>
        <TD>
          <Badge color={user.active ? "green" : "slate"}>
            {user.active ? "Activo" : "Inactivo"}
          </Badge>
        </TD>
        <TD className="text-right">
          <div className="flex justify-end gap-2">
            <DialogButton
              label="Editar"
              title={`Editar usuario: ${user.name}`}
              variant="outline"
              width="lg"
            >
              <UserForm
                mode="edit"
                centers={centers}
                institutions={institutions}
                campaigns={campaigns}
                defaults={{
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  role: user.role,
                  centerId: user.centerId,
                  institutionId: user.institutionId,
                  campaignId: user.campaignId,
                }}
              />
            </DialogButton>
            {!self && (
              <ToggleActiveButton
                id={user.id}
                active={user.active}
                action={toggleUserAction}
                entityLabel="el usuario"
              />
            )}
          </div>
        </TD>
      </TR>
    </>
  );
}
