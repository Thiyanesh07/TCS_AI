import * as React from "react";
import { ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/utils/cn";
import {
  ApplicationCategory,
  ApplicationEnvironment,
  HttpMethod,
  AuthType,
  ApiRegistrationPayload,
  RegisteredApplication,
} from "@/types/application.types";
import { useRegisterApiApplication } from "@/hooks/useApplications";

interface ApiRegistrationFormProps {
  onSuccess: (app: RegisteredApplication) => void;
}

export function ApiRegistrationForm({ onSuccess }: ApiRegistrationFormProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [version, setVersion] = React.useState("v1.0.0");
  const [category, setCategory] = React.useState<ApplicationCategory>("AGENT");
  const [environment, setEnvironment] = React.useState<ApplicationEnvironment>("DEVELOPMENT");

  const [baseUrl, setBaseUrl] = React.useState("");
  const [endpointPath, setEndpointPath] = React.useState("/v1/invoke");
  const [httpMethod, setHttpMethod] = React.useState<HttpMethod>("POST");
  const [authType, setAuthType] = React.useState<AuthType>("BEARER");
  const [secretToken, setSecretToken] = React.useState("");
  const [headerName, setHeaderName] = React.useState("Authorization");

  const [requestSchema, setRequestSchema] = React.useState(
    '{\n  "prompt": "string",\n  "temperature": 0.2,\n  "max_tokens": 1024\n}'
  );
  const [responseSchema, setResponseSchema] = React.useState(
    '{\n  "output": "string",\n  "grounding_sources": []\n}'
  );

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const registerMutation = useRegisterApiApplication();

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Application name is required.";
    if (!baseUrl.trim()) {
      newErrors.baseUrl = "API base URL is required.";
    } else if (!validateUrl(baseUrl.trim())) {
      newErrors.baseUrl = "Please enter a valid URL (e.g. https://api.yourdomain.com).";
    }

    if (!endpointPath.trim() || !endpointPath.startsWith("/")) {
      newErrors.endpointPath = "Endpoint path must start with a slash (e.g. /v1/chat).";
    }

    if (authType === "CUSTOM_HEADER" && !headerName.trim()) {
      newErrors.headerName = "Header name is required for custom header authentication.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload: ApiRegistrationPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      version: version.trim() || "v1.0.0",
      category,
      environment,
      baseUrl: baseUrl.trim(),
      endpointPath: endpointPath.trim(),
      httpMethod,
      authType,
      secretToken: secretToken.trim() || undefined,
      headerName: authType === "CUSTOM_HEADER" ? headerName.trim() : undefined,
      requestSchema: requestSchema.trim() || undefined,
      responseSchema: responseSchema.trim() || undefined,
    };

    registerMutation.mutate(payload, {
      onSuccess: (data) => {
        onSuccess(data.application);
      },
      onError: (err) => {
        setErrors({ form: err instanceof Error ? err.message : "Failed to register API endpoint." });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity Meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-800">
            Application Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CustomerCare Agent Endpoint"
            disabled={registerMutation.isPending}
            error={Boolean(errors.name)}
            className="h-10 text-sm"
          />
          {errors.name && (
            <p className="text-[11px] text-red-600 font-medium">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-800">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the application's conversational capabilities, tools, or target models..."
            disabled={registerMutation.isPending}
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">Target Version</label>
          <Input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="v1.0.0"
            disabled={registerMutation.isPending}
            className="h-9 text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">Architecture Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ApplicationCategory)}
            disabled={registerMutation.isPending}
            className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
          >
            <option value="AGENT">Multi-Turn Autonomous Agent</option>
            <option value="RAG">RAG (Retrieval-Augmented Generation)</option>
            <option value="CHATBOT">Conversational Assistant</option>
            <option value="WORKFLOW">Orchestrated AI Workflow</option>
            <option value="CLASSIFIER">Predictive Classifier / Scorer</option>
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-800">Deployment Environment</label>
          <div className="flex items-center gap-3">
            {(["DEVELOPMENT", "STAGING", "PRODUCTION"] as ApplicationEnvironment[]).map((env) => (
              <label
                key={env}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none",
                  environment === env
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <input
                  type="radio"
                  name="environment-api"
                  value={env}
                  checked={environment === env}
                  onChange={() => setEnvironment(env)}
                  disabled={registerMutation.isPending}
                  className="sr-only"
                />
                <span>{env}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Endpoint Connection Settings */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>Endpoint Network & Authentication Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-700">
              API Base URL <span className="text-red-500">*</span>
            </label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.yourdomain.com"
              disabled={registerMutation.isPending}
              error={Boolean(errors.baseUrl)}
              className="h-9 text-xs font-mono"
            />
            {errors.baseUrl && (
              <p className="text-[11px] text-red-600 font-medium">{errors.baseUrl}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700">HTTP Method</label>
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value as HttpMethod)}
              disabled={registerMutation.isPending}
              className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="POST">POST (Recommended)</option>
              <option value="GET">GET</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-bold text-slate-700">
              Endpoint Path <span className="text-red-500">*</span>
            </label>
            <Input
              value={endpointPath}
              onChange={(e) => setEndpointPath(e.target.value)}
              placeholder="/v1/chat/completions"
              disabled={registerMutation.isPending}
              error={Boolean(errors.endpointPath)}
              className="h-9 text-xs font-mono"
            />
            {errors.endpointPath && (
              <p className="text-[11px] text-red-600 font-medium">{errors.endpointPath}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700">Authentication Type</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as AuthType)}
              disabled={registerMutation.isPending}
              className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="BEARER">Bearer Token (Authorization Header)</option>
              <option value="API_KEY">API Key Header</option>
              <option value="CUSTOM_HEADER">Custom Header Token</option>
              <option value="NONE">No Authentication (Public Sandbox)</option>
            </select>
          </div>

          {authType === "CUSTOM_HEADER" && (
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[11px] font-bold text-slate-700">
                Custom Header Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={headerName}
                onChange={(e) => setHeaderName(e.target.value)}
                placeholder="X-Enterprise-API-Key"
                disabled={registerMutation.isPending}
                error={Boolean(errors.headerName)}
                className="h-9 text-xs font-mono"
              />
              {errors.headerName && (
                <p className="text-[11px] text-red-600 font-medium">{errors.headerName}</p>
              )}
            </div>
          )}

          {authType !== "NONE" && (
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[11px] font-bold text-slate-700">
                Secret Token / Key <span className="text-slate-400 font-normal">(Encrypted at rest)</span>
              </label>
              <PasswordInput
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
                placeholder="Paste API secret or Bearer token..."
                disabled={registerMutation.isPending}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[10.5px] text-slate-500">
                Credentials are encrypted using AES-256 before transport and never logged.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contract Schemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">
            Request Payload Schema <span className="text-slate-400 font-normal">(JSON)</span>
          </label>
          <textarea
            value={requestSchema}
            onChange={(e) => setRequestSchema(e.target.value)}
            disabled={registerMutation.isPending}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-[11px] text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">
            Expected Response Schema <span className="text-slate-400 font-normal">(JSON)</span>
          </label>
          <textarea
            value={responseSchema}
            onChange={(e) => setResponseSchema(e.target.value)}
            disabled={registerMutation.isPending}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-mono text-[11px] text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      {errors.form && (
        <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Submission Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={registerMutation.isPending}
          isLoading={registerMutation.isPending}
          className="h-9 px-5 text-xs font-bold gap-2"
        >
          <span>Connect & Register API Endpoint</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}

export default ApiRegistrationForm;
