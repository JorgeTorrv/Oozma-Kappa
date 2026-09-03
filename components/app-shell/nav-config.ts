import { can, type Capability, type Principal } from "@/lib/permissions";

/**
 * La navegación se calcula en el servidor y se envía al shell (Client Component).
 * Por eso los items son 100% serializables: el icono es una CLAVE (string), no
 * un componente, y no se envían funciones.
 */
export type IconKey =
  | "dashboard"
  | "reception"
  | "delivery"
  | "waste"
  | "transfer"
  | "adjustment"
  | "history"
  | "inventory"
  | "trace"
  | "map"
  | "campaign"
  | "center"
  | "article"
  | "institution"
  | "users"
  | "team"
  | "bell"
  | "inbox";

export type NavItem = { label: string; href: string; icon: IconKey };
export type NavGroup = { title?: string; items: NavItem[] };

type Rule = {
  label: string;
  href: string;
  icon: IconKey;
  caps: Capability[];
};

const GROUPS: { title?: string; rules: Rule[] }[] = [
  {
    rules: [
      { label: "Panel", href: "/inicio", icon: "dashboard", caps: [] },
      {
        label: "Entregas recibidas",
        href: "/institucion",
        icon: "inbox",
        caps: ["delivery.confirm"],
      },
    ],
  },
  {
    title: "Operación",
    rules: [
      {
        label: "Registrar recepción",
        href: "/recepciones",
        icon: "reception",
        caps: ["reception.create"],
      },
      {
        label: "Entregas",
        href: "/entregas",
        icon: "delivery",
        caps: ["delivery.create"],
      },
      {
        label: "Mermas",
        href: "/mermas",
        icon: "waste",
        caps: ["waste.create", "waste.approve"],
      },
      {
        label: "Transferencias",
        href: "/transferencias",
        icon: "transfer",
        caps: ["transfer.create"],
      },
      {
        label: "Ajustes",
        href: "/ajustes",
        icon: "adjustment",
        caps: ["adjustment.create"],
      },
    ],
  },
  {
    title: "Información",
    rules: [
      {
        label: "Movimientos",
        href: "/movimientos",
        icon: "history",
        caps: [
          "movements.global.read",
          "movements.center.read",
          "movements.campaign.read",
        ],
      },
      {
        label: "Inventario",
        href: "/inventario",
        icon: "inventory",
        caps: [
          "inventory.global.read",
          "inventory.center.read",
          "inventory.campaign.read",
        ],
      },
      {
        label: "Trazabilidad",
        href: "/trazabilidad",
        icon: "trace",
        caps: ["traceability.read"],
      },
      {
        label: "Mapa de centros",
        href: "/mapa",
        icon: "map",
        caps: ["inventory.global.read", "inventory.campaign.read"],
      },
    ],
  },
  {
    title: "Administración",
    rules: [
      {
        label: "Campañas",
        href: "/campanas",
        icon: "campaign",
        caps: ["campaign.create", "dashboard.campaign.read", "goal.manage"],
      },
      {
        label: "Centros",
        href: "/centros",
        icon: "center",
        caps: ["center.create"],
      },
      {
        label: "Artículos",
        href: "/articulos",
        icon: "article",
        caps: ["article.manage"],
      },
      {
        label: "Instituciones",
        href: "/instituciones",
        icon: "institution",
        caps: ["institution.manage"],
      },
      {
        label: "Mi equipo",
        href: "/mi-equipo",
        icon: "team",
        caps: ["team.manage"],
      },
      {
        label: "Usuarios",
        href: "/usuarios",
        icon: "users",
        caps: ["users.manage"],
      },
    ],
  },
  {
    rules: [
      {
        label: "Notificaciones",
        href: "/notificaciones",
        icon: "bell",
        caps: ["notifications.read"],
      },
    ],
  },
];

export function buildNav(p: Principal): NavGroup[] {
  return GROUPS.map((g) => ({
    title: g.title,
    items: g.rules
      .filter((r) => r.caps.length === 0 || r.caps.some((c) => can(p, c)))
      .map(({ label, href, icon }) => ({ label, href, icon })),
  })).filter((g) => g.items.length > 0);
}
