import { NavLink } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Cpu,
  History,
  Settings,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/utils/cn";
import type { UserRole } from "@/types/auth.types";

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const PLATFORM_ADMIN_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Organisations", href: "/admin/organisations", icon: Building2 },
  { name: "Applications", href: "/admin/applications", icon: Cpu },
  { name: "Findings & Evidence", href: "/findings", icon: AlertTriangle },
  { name: "Release Reviews", href: "/release-reviews", icon: ClipboardCheck },
  { name: "Regression Metrics", href: "/regression", icon: TrendingUp },
  { name: "Evaluation History", href: "/admin/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

const ORG_USER_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Applications", href: "/applications", icon: Cpu },
  { name: "Findings & Evidence", href: "/findings", icon: AlertTriangle },
  { name: "Release Reviews", href: "/release-reviews", icon: ClipboardCheck },
  { name: "Regression Benchmarks", href: "/regression", icon: TrendingUp },
  { name: "Evaluation History", href: "/history", icon: History },
  { name: "My Tests", href: "/my-tests", icon: FileCheck2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggleCollapse,
  currentRole,
  onRoleChange,
}: SidebarProps) {
  const navItems = currentRole === "PLATFORM_ADMIN" ? PLATFORM_ADMIN_NAV : ORG_USER_NAV;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col justify-between select-none",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Top Header & Brand */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
                  QualiTrust AI
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                  {currentRole === "PLATFORM_ADMIN" ? "Platform Admin" : "Quality Engine"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2">
            {!collapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navigation ({currentRole === "PLATFORM_ADMIN" ? "Admin" : "Workspace"})
              </span>
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-colors" />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-md group-hover:block z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Area: Role Badge & Preview Switcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-2 py-1 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Active Role</span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                  currentRole === "PLATFORM_ADMIN"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                )}
              >
                {currentRole}
              </span>
            </div>

            {onRoleChange && (
              <button
                type="button"
                onClick={() =>
                  onRoleChange(currentRole === "PLATFORM_ADMIN" ? "ORG_USER" : "PLATFORM_ADMIN")
                }
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Toggle role for UX review"
              >
                <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                <span>Switch to {currentRole === "PLATFORM_ADMIN" ? "ORG_USER" : "PLATFORM_ADMIN"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                currentRole === "PLATFORM_ADMIN" ? "bg-amber-500" : "bg-indigo-500"
              )}
              title={`Role: ${currentRole}`}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;

