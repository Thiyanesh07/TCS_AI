import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Building2, Cpu, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export interface ActivityFeedItem {
  id: string;
  type: "ORGANISATION_JOINED" | "APP_REGISTERED" | "EVALUATION_COMPLETED" | "CRITICAL_VIOLATION";
  title: string;
  detail: string;
  timestamp: string;
}

const DEFAULT_ACTIVITIES: ActivityFeedItem[] = [
  {
    id: "act-1",
    type: "CRITICAL_VIOLATION",
    title: "Safety threshold breach flagged",
    detail: "Clinical Document Extractor triggered high-severity PII leak risk in stage 3.",
    timestamp: "8 mins ago",
  },
  {
    id: "act-2",
    type: "APP_REGISTERED",
    title: "New AI application onboarded",
    detail: "Nexus Health Systems connected 'Billing Copilot v2' via API registration.",
    timestamp: "24 mins ago",
  },
  {
    id: "act-3",
    type: "EVALUATION_COMPLETED",
    title: "Automated regression suite passed",
    detail: "Customer Support RAG Agent verified 96% composite readiness score.",
    timestamp: "1 hour ago",
  },
  {
    id: "act-4",
    type: "ORGANISATION_JOINED",
    title: "Tenant organization onboarded",
    detail: "Krypton Global Logistics provisioned Starter tier workspace.",
    timestamp: "3 hours ago",
  },
];

export interface PlatformActivityFeedProps {
  activities?: ActivityFeedItem[];
  isPendingContract?: boolean;
}

export function PlatformActivityFeed({
  activities = DEFAULT_ACTIVITIES,
  isPendingContract = true,
}: PlatformActivityFeedProps) {
  const iconMap = {
    ORGANISATION_JOINED: { icon: Building2, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    APP_REGISTERED: { icon: Cpu, color: "text-slate-700 bg-slate-100 border-slate-200" },
    EVALUATION_COMPLETED: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    CRITICAL_VIOLATION: { icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-100" },
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" />
          <CardTitle className="text-base font-semibold text-slate-900">
            Platform Activity Stream
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-500 mt-1">
          Real-time audit log of multi-tenant application events and security signals
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="divide-y divide-slate-100">
          {activities.map((item) => {
            const cfg = iconMap[item.type] || iconMap.EVALUATION_COMPLETED;
            const Icon = cfg.icon;

            return (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 mt-0.5 ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {isPendingContract && (
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center font-mono">
            Platform activity WebSocket / stream contract pending backend team sign-off.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PlatformActivityFeed;

