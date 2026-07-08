"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { getDashboardData, type DashboardUser } from "@/app/(admin)/dashboard/dashboardData";
import { getStoredUser } from "@/services/authService";

interface AdminShellContextValue {
  role: DashboardUser["role"];
}

interface AdminShellProps {
  activeItem?: string;
  children: React.ReactNode;
  render?: (context: AdminShellContextValue) => React.ReactNode;
}

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

const routeToItem: Record<string, string> = {
  dashboard: "dashboard",
  properties: "properties",
  managers: "managers",
  rooms: "rooms",
  tenants: "tenants",
  payments: "payments",
  complaints: "complaints",
  reports: "reports",
  settings: "profile",
  profile: "profile",
};

export function useAdminShell() {
  const context = useContext(AdminShellContext);

  if (!context) {
    throw new Error("useAdminShell must be used inside AdminShell");
  }

  return context;
}

export function AdminShell({ activeItem, children, render }: AdminShellProps) {
  const existingContext = useContext(AdminShellContext);
  const pathname = usePathname();
  const currentRoute = pathname.split("/").filter(Boolean)[0] || "dashboard";
  const resolvedActiveItem = activeItem || routeToItem[currentRoute] || "dashboard";

  const [user, setUser] = useState<DashboardUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncUser = () => {
      setUser(getStoredUser() as DashboardUser | null);
    };

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("pg_user_updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("pg_user_updated", syncUser);
    };
  }, []);

  const dashboard = useMemo(() => getDashboardData(user), [user]);
  const displayName =
    user?.name ||
    (dashboard.role === "owner" ? "Owner User" : dashboard.role === "manager" ? "Manager User" : "Tenant User");
  const contextValue = useMemo(() => ({ role: dashboard.role }), [dashboard.role]);

  if (existingContext) {
    return <>{render ? render(existingContext) : children}</>;
  }

  return (
    <AdminShellContext.Provider value={contextValue}>
      <div className="flex min-h-screen bg-[#F0F7FF]">
        <Sidebar
          role={dashboard.role}
          activeItem={resolvedActiveItem}
          onItemClick={() => undefined}
        />
        <div className="ml-72 flex flex-1 flex-col">
          <TopBar
            userName={displayName}
            profileLabel={dashboard.profileLabel}
            propertyScope={dashboard.propertyScope}
            profilePhotoUrl={user?.profilePhotoUrl}
          />
          <main className="flex-1 overflow-auto p-6">
            {render ? render(contextValue) : children}
          </main>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}

export default AdminShell;
