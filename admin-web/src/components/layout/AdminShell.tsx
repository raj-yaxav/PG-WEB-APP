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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

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
      <div className="min-h-screen overflow-x-hidden bg-[#F0F7FF] text-slate-900">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          />
        )}
        <Sidebar
          role={dashboard.role}
          activeItem={resolvedActiveItem}
          onItemClick={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-col lg:pl-72">
          <TopBar
            userName={displayName}
            profileLabel={dashboard.profileLabel}
            propertyScope={dashboard.propertyScope}
            profilePhotoUrl={user?.profilePhotoUrl}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">
            <div className="mx-auto w-full max-w-[1480px]">
              {render ? render(contextValue) : children}
            </div>
          </main>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}

export default AdminShell;
