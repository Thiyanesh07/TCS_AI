import { Search, Bell, Activity } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserProfileMenu } from "./UserProfileMenu";
import type { UserRole } from "@/types/auth.types";

export interface HeaderProps {
  currentRole: UserRole;
  userEmail?: string;
}

export function Header({ currentRole, userEmail }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between px-6 transition-all">
      {/* Left Area: Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      {/* Right Area: Search, System Beacon, Notifications, Profile Menu */}
      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search evaluations, models..."
            className="w-56 h-8.5 pl-8.5 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        {/* System Health Beacon */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-medium text-emerald-700">
          <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span>Evaluation Engine Online</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
        </button>

        {/* User Profile Menu */}
        <UserProfileMenu currentRole={currentRole} userEmail={userEmail} />
      </div>
    </header>
  );
}

export default Header;

