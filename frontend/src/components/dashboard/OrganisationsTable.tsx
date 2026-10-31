import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck } from "lucide-react";

export interface OrganisationSummary {
  id: string;
  name: string;
  tier: "ENTERPRISE" | "GROWTH" | "STARTER";
  applicationCount: number;
  totalEvaluations: number;
  status: "ACTIVE" | "PENDING_REVIEW";
  joinedDate: string;
}

const DEFAULT_ORGS: OrganisationSummary[] = [
  {
    id: "org-101",
    name: "Nexus Health Systems",
    tier: "ENTERPRISE",
    applicationCount: 14,
    totalEvaluations: 4820,
    status: "ACTIVE",
    joinedDate: "Jan 2026",
  },
  {
    id: "org-102",
    name: "Apex Financial Core",
    tier: "ENTERPRISE",
    applicationCount: 8,
    totalEvaluations: 3120,
    status: "ACTIVE",
    joinedDate: "Feb 2026",
  },
  {
    id: "org-103",
    name: "Synthetix AI Labs",
    tier: "GROWTH",
    applicationCount: 5,
    totalEvaluations: 1840,
    status: "ACTIVE",
    joinedDate: "Mar 2026",
  },
  {
    id: "org-104",
    name: "Krypton Global Logistics",
    tier: "STARTER",
    applicationCount: 2,
    totalEvaluations: 240,
    status: "PENDING_REVIEW",
    joinedDate: "Oct 2026",
  },
];

export interface OrganisationsTableProps {
  organisations?: OrganisationSummary[];
  isPendingContract?: boolean;
}

export function OrganisationsTable({
  organisations = DEFAULT_ORGS,
  isPendingContract = true,
}: OrganisationsTableProps) {
  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4.5 w-4.5 text-indigo-600" />
            <CardTitle className="text-base font-semibold text-slate-900">
              Organisation Overview
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Registered tenant organizations, application density, and evaluation workloads
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-y border-slate-200">
              <tr>
                <th className="px-6 py-3">Organisation Name</th>
                <th className="px-6 py-3">Tier</th>
                <th className="px-6 py-3">Apps</th>
                <th className="px-6 py-3">Total Evals</th>
                <th className="px-6 py-3">Tenant Status</th>
                <th className="px-6 py-3 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organisations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <span>{org.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {org.tier}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">{org.applicationCount}</td>
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-600">
                    {org.totalEvaluations.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5">
                    {org.status === "ACTIVE" ? (
                      <Badge variant="success">ACTIVE</Badge>
                    ) : (
                      <Badge variant="warning">PENDING</Badge>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-400 text-[11px]">
                    {org.joinedDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isPendingContract && (
          <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center font-mono">
            Integration Note: Backend multi-tenant organisation endpoint pending OpenAPI schema sign-off.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrganisationsTable;

