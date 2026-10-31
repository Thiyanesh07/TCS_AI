import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server } from "lucide-react";

export interface SystemServiceStatus {
  name: string;
  status: "OPERATIONAL" | "DEGRADED" | "DOWN";
  latency: string;
}

const DEFAULT_SERVICES: SystemServiceStatus[] = [
  { name: "Evaluation Sandbox Engine", status: "OPERATIONAL", latency: "24ms" },
  { name: "Safety & Prompt Defense Gateway", status: "OPERATIONAL", latency: "18ms" },
  { name: "Regression Differential Analyzer", status: "OPERATIONAL", latency: "32ms" },
  { name: "Benchmark Grounding Verifier", status: "OPERATIONAL", latency: "29ms" },
];

export interface SystemStatusCardProps {
  services?: SystemServiceStatus[];
  isPendingContract?: boolean;
}

export function SystemStatusCard({
  services = DEFAULT_SERVICES,
  isPendingContract = true,
}: SystemStatusCardProps) {
  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Server className="h-4.5 w-4.5 text-indigo-600" />
            <CardTitle className="text-base font-semibold text-slate-900">
              System Health & Service Telemetry
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Global operational heartbeat across evaluation sandbox microservices
          </CardDescription>
        </div>
        <Badge variant="success">All Systems Operational</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {isPendingContract && (
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-mono text-center">
            Notice: Microservice telemetry endpoint contract pending backend integration.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((srv, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{srv.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Edge Latency: {srv.latency}</div>
                </div>
              </div>
              <Badge variant="success">HEALTHY</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemStatusCard;
