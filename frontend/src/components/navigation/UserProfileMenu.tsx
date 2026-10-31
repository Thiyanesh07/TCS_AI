import * as React from "react";
import { Link } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import type { UserRole } from "@/types/auth.types";

export interface UserProfileMenuProps {
  currentRole: UserRole;
  userEmail?: string;
}

export function UserProfileMenu({
  currentRole,
  userEmail = "evaluator@qualitrust.ai",
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none select-none"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-semibold text-xs shadow-xs">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            {userEmail.split("@")[0]}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {currentRole === "PLATFORM_ADMIN" ? "Platform Admin" : "Quality Engineer"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-200/50 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-900 truncate">{userEmail}</p>
            <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
              Role: {currentRole}
            </p>
          </div>

          <div className="py-1">
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              <span>Workspace Settings</span>
            </Link>
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
              <User className="h-4 w-4 text-slate-400" />
              <span>Account Profile</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfileMenu;

