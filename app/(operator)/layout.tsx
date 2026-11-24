import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { exigirOperador } from "@/lib/acesso";
import { OperationSelector } from "./operation-selector";
import { OperatorSidebar } from "./operator-sidebar";

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  const operator = await exigirOperador();
  const cookieStore = await cookies();

  return (
    <SidebarProvider className="operator-shell" defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}>
      <OperatorSidebar name={operator.name} />
      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center border-b border-slate-200 px-4">
          <SidebarTrigger id="operator-sidebar-trigger" aria-label="Alternar menu de navegação" className="size-9" />
          <div className="ml-3 min-w-0"><Suspense fallback={null}><OperationSelector /></Suspense></div>
        </div>
        {children}
      </div>
    </SidebarProvider>
  );
}
