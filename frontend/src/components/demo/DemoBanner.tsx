import * as React from "react";
import { AlertTriangle, Sparkles, RotateCcw, ChevronDown, Check } from "lucide-react";
import { isDemoMode } from "@/utils/env";
import { demoStore, DEMO_BANNER_MESSAGE, DemoScenarioId, DEMO_SCENARIOS } from "@/demo";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  if (!isDemoMode()) return null;

  const [activeScenario, setActiveScenario] = React.useState<DemoScenarioId>(
    demoStore.getActiveScenarioId()
  );
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleSelectScenario = (id: DemoScenarioId) => {
    demoStore.setActiveScenarioId(id);
    setActiveScenario(id);
    setDropdownOpen(false);
    // Reload active queries / page to apply scenario instantly
    window.location.reload();
  };

  const handleReset = () => {
    if (window.confirm("Reset all demonstration data to default seeds?")) {
      demoStore.resetToInitialState();
    }
  };

  const currentDef = DEMO_SCENARIOS[activeScenario].definition;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 text-white px-4 py-2 text-xs shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
      <div className="flex items-center gap-2 font-medium">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white font-bold text-[10px]">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <span className="font-bold tracking-wide uppercase text-[11px] bg-black/20 px-2 py-0.5 rounded">
          DEMO MODE
        </span>
        <span className="hidden sm:inline text-amber-50">
          {DEMO_BANNER_MESSAGE}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Scenario Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 transition-colors text-[11px] font-semibold border border-white/20"
            title="Switch demonstration scenario"
          >
            <Sparkles className="h-3 w-3 text-amber-200" />
            <span className="truncate max-w-[170px] sm:max-w-[240px]">
              Active: {currentDef.name}
            </span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-80 rounded-xl bg-white text-slate-900 shadow-xl border border-slate-200 p-1.5 z-50 text-xs">
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Select Predefined Judge Scenario
              </div>
              {(Object.keys(DEMO_SCENARIOS) as DemoScenarioId[]).map((key) => {
                const s = DEMO_SCENARIOS[key];
                const isSelected = key === activeScenario;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectScenario(key)}
                    className={`w-full text-left p-2 rounded-lg flex items-start justify-between gap-2 transition-colors ${
                      isSelected
                        ? "bg-indigo-50 text-indigo-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{s.definition.name}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                        Score: {s.definition.overallScore}/100 • Gate: {s.definition.recommendation}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reset Demo State Trigger */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="h-6 px-2 text-[10.5px] text-white border-white/30 bg-white/10 hover:bg-white/20 hover:text-white"
          title="Reset demonstration state"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          <span>Reset Seeds</span>
        </Button>
      </div>
    </div>
  );
}

export default DemoBanner;
