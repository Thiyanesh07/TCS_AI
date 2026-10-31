import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, ArrowRight } from "lucide-react";
import { authService } from "@/services/auth.service";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

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

    try {
      await authService.login({ email, password });
      await authService.getMe();
      navigate("/dashboard");
    } catch (err: any) {
      setIsLoading(false);
      setLoginError(
        err.response?.data?.detail ||
          err.message ||
          "Authentication failed. Please verify credentials."
      );
    }
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
          {/* Error Message */}
          {loginError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 animate-in fade-in duration-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-1">
                <span className="font-semibold block">Authentication Error</span>
                <span className="text-[11px] leading-relaxed block text-red-700">
                  {loginError}
                </span>
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
                <span className="text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer font-medium">
                  Forgot password?
                </span>
              </div>
              <PasswordInput
                id="password"
                placeholder="••••••••"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Submit Action */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              isLoading={isLoading}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Direct Link to Dashboard Shell */}
          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              to="/dashboard"
              className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1"
            >
              <span>Explore Dashboard Shell directly</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export default LoginPage;
