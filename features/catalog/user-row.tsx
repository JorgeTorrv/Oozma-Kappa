"use client";

import * as React from "react";
import { TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
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
  const [editing, setEditing] = React.useState(false);

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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Cerrar" : "Editar"}
            </Button>
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
      {editing && (
        <TR>
          <TD colSpan={6} className="bg-slate-50">
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
          </TD>
        </TR>
      )}
    </>
  );
}
