import { useOutletContext } from "react-router-dom";
import { OrgUserDashboard } from "./OrgUserDashboard";
import { PlatformAdminDashboard } from "@/pages/admin/PlatformAdminDashboard";
import type { UserRole } from "@/types/auth.types";

export function DashboardPage() {
  const context = useOutletContext<{ currentRole?: UserRole }>();
  const role = context?.currentRole || "ORG_USER";

  if (role === "PLATFORM_ADMIN") {
    return <PlatformAdminDashboard />;
  }

  return <OrgUserDashboard />;
}

export default DashboardPage;

