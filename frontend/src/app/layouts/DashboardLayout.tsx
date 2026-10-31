import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Header } from "@/components/navigation/Header";
import { DemoBanner } from "@/components/demo/DemoBanner";
import type { UserRole } from "@/types/auth.types";

export interface DashboardLayoutProps {
  initialRole?: UserRole;
}

export function DashboardLayout({ initialRole = "ORG_USER" }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [currentRole, setCurrentRole] = React.useState<UserRole>(initialRole);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Persistent Demo Mode Banner */}
      <DemoBanner />

      <div className="flex-1 flex">
        {/* Collapsible Left Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />

        {/* Main Layout Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
            collapsed ? "ml-[72px]" : "ml-[260px]"
          }`}
        >
          <Header currentRole={currentRole} />

          {/* Dynamic Page Content */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet context={{ currentRole }} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;

