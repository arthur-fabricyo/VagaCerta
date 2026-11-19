"use client";

import { CalendarDays, ChevronUp, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/app/_components/sair";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const pages = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, paths: ["/history", "/visits"] },
  { href: "/reservations", label: "Reservas", icon: CalendarDays, paths: [] },
  { href: "/settings", label: "Configurações", icon: Settings, paths: ["/usuarios"] },
];

export function OperatorSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { signOut, pending, error } = useSignOut();
  const initials = name.trim().split(/\s+/).slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "").join("").toLocaleUpperCase("pt-BR");

  return (
    <Sidebar>
      <SidebarHeader className="px-5 pb-5 pt-6">
        <Link href="/" className="w-fit rounded-sm text-lg font-semibold tracking-wide text-emerald-800 focus-visible:outline-2"
          onNavigate={() => setOpenMobile(false)}>VagaCerta</Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <nav aria-label="Navegação principal">
          <SidebarMenu>
            {pages.map(({ href, label, icon: Icon, paths }) => {
              const active = pathname === href || paths.some((path) =>
                pathname === path || pathname.startsWith(`${path}/`));
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={active} className="h-10">
                    <Link href={href} aria-current={active ? "page" : undefined}
                      onNavigate={() => setOpenMobile(false)}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" aria-label={`Menu da conta de ${name}`}>
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-emerald-100 font-semibold text-emerald-800">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                  <ChevronUp aria-hidden="true" className="size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuItem disabled={pending} onSelect={(event) => {
                  event.preventDefault();
                  void signOut();
                }}>
                  <LogOut aria-hidden="true" />
                  {pending ? "Saindo…" : "Sair"}
                </DropdownMenuItem>
                {error && <DropdownMenuLabel role="alert" className="font-normal text-rose-700">
                  Não foi possível sair. Tente novamente.
                </DropdownMenuLabel>}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
