"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Menu,
  X,
  LogOut,
  Bell,
  LayoutDashboard,
  PackagePlus,
  Send,
  Trash2,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Route,
  Map as MapIcon,
  Megaphone,
  Building2,
  Warehouse,
  PackageSearch,
  Users,
  UsersRound,
  UserCheck,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import type { IconKey, NavGroup } from "./nav-config";
import { logoutAction } from "@/features/auth/actions";
import { Logo } from "@/components/brand/logo";

const ICONS: Record<IconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  reception: PackagePlus,
  delivery: Send,
  waste: Trash2,
  transfer: ArrowLeftRight,
  adjustment: SlidersHorizontal,
  history: History,
  inventory: Boxes,
  trace: Route,
  map: MapIcon,
  campaign: Megaphone,
  center: Warehouse,
  article: PackageSearch,
  institution: Building2,
  users: Users,
  team: UsersRound,
  requests: UserCheck,
  bell: Bell,
  inbox: ClipboardCheck,
};

export function AppShell({
  nav,
  user,
  unread,
  children,
}: {
  nav: NavGroup[];
  user: { name: string; role: Role; scope: string | null };
  unread: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr] lg:items-start">
      {/* Sidebar desktop: fija a la altura de la ventana y acompaña el scroll. */}
      <aside className="sticky top-0 hidden h-dvh border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <SidebarContent nav={nav} pathname={pathname} unread={unread} />
      </aside>

      {/* Topbar móvil */}
      <div className="sticky top-0 z-[1001] flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
        <Link href="/" className="py-1 pl-1" aria-label="Acopia — inicio">
          <Logo height={52} />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/notificaciones"
            className="relative flex size-11 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
            aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-11 items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Drawer móvil — siempre montado, se desliza con transición */}
      <div
        className={cn(
          "fixed inset-0 z-[1100] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          onClick={close}
          className={cn(
            "absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ease-out motion-reduce:transition-none",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className={cn(
            "absolute left-0 top-0 h-full w-72 bg-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold">Menú</span>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-2 hover:bg-slate-100"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
          </div>
          <SidebarContent
            nav={nav}
            pathname={pathname}
            unread={unread}
            onNavigate={close}
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex min-w-0 flex-col lg:min-h-dvh">
        <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-slate-200 bg-white px-6 py-3 lg:flex">
          <div className="text-sm text-slate-500">
            {ROLE_LABELS[user.role]}
            {user.scope ? ` · ${user.scope}` : ""}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notificaciones"
              className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"
              aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="size-4" />
                Salir
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  nav,
  pathname,
  unread,
  onNavigate,
}: {
  nav: NavGroup[];
  pathname: string;
  unread: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="hidden px-4 py-4 lg:block">
        <Link href="/" aria-label="Acopia — inicio">
          <Logo height={80} />
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {nav.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/inicio"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = ICONS[item.icon];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand-50 font-medium text-brand-800"
                          : "text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/notificaciones" && unread > 0 && (
                        <span className="rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 lg:hidden">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="size-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
