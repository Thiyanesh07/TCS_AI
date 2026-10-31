import { Link } from "react-router-dom";
import { PlusCircle, History, Cpu } from "lucide-react";

export function QuickActionsBar() {
  const buttonBase =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 select-none rounded-lg h-8 px-3 text-xs gap-1.5";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Link
        to="/applications/new"
        className={`${buttonBase} bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs font-semibold`}
      >
        <PlusCircle className="h-3.5 w-3.5" />
        <span>Register Application</span>
      </Link>

      <Link
        to="/history"
        className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs`}
      >
        <History className="h-3.5 w-3.5 text-slate-500" />
        <span>Evaluation History</span>
      </Link>

      <Link
        to="/applications"
        className={`${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs`}
      >
        <Cpu className="h-3.5 w-3.5 text-slate-500" />
        <span>View Applications</span>
      </Link>
    </div>
  );
}

export default QuickActionsBar;
