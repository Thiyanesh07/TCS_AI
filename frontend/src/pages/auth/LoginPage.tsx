import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, ArrowRight, Info, Sparkles, UserCheck, ShieldAlert } from "lucide-react";
import { isDemoMode } from "@/utils/env";
import { authService } from "@/services/auth.service";
import { DEMO_CREDENTIALS } from "@/demo";

export function LoginPage() {
  const navigate = useNavigate();
  const demoActive = isDemoMode();

  const [email, setEmail] = React.useState(
    demoActive ? DEMO_CREDENTIALS.ORG_USER.email : ""
  );
  const [password, setPassword] = React.useState(
    demoActive ? DEMO_CREDENTIALS.ORG_USER.password : ""
  );
  const [rememberMe, setRememberMe] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{ email?: string; password?: string }>({});
  const [contractNotice, setContractNotice] = React.useState<string | null>(null);

  const handleQuickDemoLogin = (role: "ORG_USER" | "PLATFORM_ADMIN") => {
    setIsLoading(true);
    setTimeout(() => {
      authService.quickDemoLogin(role);
      setIsLoading(false);
      navigate("/dashboard");
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContractNotice(null);

    // Client-side input validation
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Work email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid business email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    if (demoActive) {
      // In demo mode: instantly authenticate locally and navigate to dashboard
      setTimeout(() => {
        authService.login(email, password);
        setIsLoading(false);
        navigate("/dashboard");
      }, 350);
      return;
    }

    // In production mode: safe gate notice
    window.setTimeout(() => {
      setIsLoading(false);
      setContractNotice(
        "Backend Authentication Contract Status: PENDING_CONFIRMATION. Outbound credentials dispatch is safely gated until OpenAPI endpoint specification is confirmed."
      );
    }, 600);
  };

  return (
    <AuthLayout>
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100">
            <Lock className="h-4.5 w-4.5" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            Sign in to QualiTrust AI
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Enter your enterprise credentials to access your quality workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Judge Demo Quick Access Banner */}
          {demoActive && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50 border border-indigo-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Judge Quick Demo Login (Zero Backend Required)</span>
                </span>
                <span className="text-[10px] uppercase font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">
                  Demo
                </span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed">
                Click below to instantly access the platform under either evaluation role:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDemoLogin("ORG_USER")}
                  disabled={isLoading}
                  className="text-xs font-bold gap-1.5 bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-700 h-8"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Quality Engineer</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDemoLogin("PLATFORM_ADMIN")}
                  disabled={isLoading}
                  className="text-xs font-bold gap-1.5 bg-white border-amber-300 hover:bg-amber-50 text-amber-800 h-8"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Platform Superadmin</span>
                </Button>
              </div>
            </div>
          )}

          {/* Integration Status Notice (Production Mode Only) */}
          {contractNotice && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 animate-in fade-in duration-200"
            >
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <span className="font-semibold block">Authentication Contract Gate</span>
                <span className="text-[11px] leading-relaxed block text-amber-700">
                  {contractNotice}
                </span>
                <div className="pt-1">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                  >
                    <span>Proceed to Dashboard Preview</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                Work Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="engineer@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={Boolean(validationErrors.email)}
                disabled={isLoading}
                autoComplete="email"
              />
              {validationErrors.email && (
                <p className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{validationErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  {demoActive ? "Pre-filled for demo" : "Min 8 characters"}
                </span>
              </div>
              <PasswordInput
                id="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={Boolean(validationErrors.password)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {validationErrors.password && (
                <p className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{validationErrors.password}</span>
                </p>
              )}
            </div>

            {/* Remember Me & Assistance */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Remember session</span>
              </label>

              <span className="text-xs font-semibold text-slate-500">Enterprise SSO</span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-10 text-xs font-bold shadow-xs gap-2 mt-2"
            >
              <span>{demoActive ? "Sign In (Demo Session)" : "Sign in to Platform"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export default LoginPage;
