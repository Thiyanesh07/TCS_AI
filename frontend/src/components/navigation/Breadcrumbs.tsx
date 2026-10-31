import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  organisations: "Organisations",
  applications: "Applications",
  history: "Evaluation History",
  "my-tests": "My Tests",
  evaluation: "Evaluation",
  findings: "Findings",
  regression: "Regression",
  settings: "Settings",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <div key={to} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{label}</span>
            ) : (
              <Link to={to} className="hover:text-slate-900 transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;

