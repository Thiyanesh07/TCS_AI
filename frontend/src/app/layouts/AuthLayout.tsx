import * as React from "react";
import { ShieldCheck, Cpu, Activity, Lock, CheckCircle2 } from "lucide-react";

export interface AuthLayoutProps {
  children: React.ReactNode;
}

const EVALUATION_PILLARS = [
  { label: "Accuracy & Grounding", desc: "Hallucination reduction & factual citation verification" },
  { label: "Safety & Security", desc: "Prompt injection, jailbreak defense & PII leak protection" },
  { label: "Model Drift & Consistency", desc: "Automated regression testing across prompt versions" },
  { label: "Release Readiness Gate", desc: "Automated go/no-go intelligence for production pipelines" },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-12 bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Left Column: Brand & Engineering Value Panel (Desktop) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle geometric background highlights */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Top Brand Identity */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              QualiTrust AI
            </span>
            <span className="block text-xs text-slate-400 font-medium">
              Release Intelligence & Quality Platform
            </span>
          </div>
        </div>

        {/* Center Pitch */}
        <div className="relative z-10 space-y-8 my-auto py-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              <span>AI Application Quality Engineering</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Systematic quality evaluation before every production release.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              QualiTrust AI continuously benchmarks LLM applications across 9 enterprise dimensions to ensure safety, accuracy, and release readiness.
            </p>
          </div>

          {/* Pillars List */}
          <div className="grid grid-cols-1 gap-4 pt-2">
            {EVALUATION_PILLARS.map((pillar, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-xs"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">{pillar.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{pillar.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Multi-Tenant Architecture</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-indigo-400" />
            <span>Strict Role Governance</span>
          </span>
        </div>
      </div>

      {/* Right Column: Authentication Card Form Area */}
      <div className="flex-1 lg:col-span-7 xl:col-span-6 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              QualiTrust AI
            </span>
            <span className="block text-[11px] text-slate-500 font-medium">
              Release Intelligence
            </span>
          </div>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;

