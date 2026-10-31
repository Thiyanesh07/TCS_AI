import * as React from "react";
import { UploadCloud, FileArchive, CheckCircle2, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import {
  ApplicationCategory,
  ApplicationEnvironment,
  ZipUploadPayload,
  RegisteredApplication,
} from "@/types/application.types";
import { useRegisterZipApplication } from "@/hooks/useApplications";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB Backend Constraint Limit

interface ZipUploadZoneProps {
  onSuccess: (app: RegisteredApplication) => void;
}

export function ZipUploadZone({ onSuccess }: ZipUploadZoneProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [version, setVersion] = React.useState("v1.0.0");
  const [category, setCategory] = React.useState<ApplicationCategory>("RAG");
  const [environment, setEnvironment] = React.useState<ApplicationEnvironment>("DEVELOPMENT");

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [formErrors, setFormErrors] = React.useState<{ name?: string }>({});
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const registerMutation = useRegisterZipApplication();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);

    // Validate .zip extension and MIME type
    const isZip =
      file.name.toLowerCase().endsWith(".zip") ||
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed";

    if (!isZip) {
      setFileError("Invalid archive format. Only valid .zip packages are accepted.");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File size exceeds 50MB maximum limit (${formatFileSize(file.size)}).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (registerMutation.isPending) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (registerMutation.isPending) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string } = {};

    if (!name.trim()) {
      errors.name = "Application name is required.";
    }

    if (!selectedFile) {
      setFileError("Please select a .zip package to upload.");
      return;
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: ZipUploadPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      version: version.trim() || "v1.0.0",
      category,
      environment,
      file: selectedFile,
    };

    registerMutation.mutate(
      {
        payload,
        onProgress: (percent) => setUploadProgress(percent),
      },
      {
        onSuccess: (data) => {
          onSuccess(data.application);
        },
        onError: (err) => {
          setFileError(err instanceof Error ? err.message : "Failed to upload ZIP package.");
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Application Identity Meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-800">
            Application Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. LegalIndemnity Parser Pipeline"
            disabled={registerMutation.isPending}
            error={Boolean(formErrors.name)}
            className="h-10 text-sm"
          />
          {formErrors.name && (
            <p className="text-[11px] text-red-600 font-medium">{formErrors.name}</p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-800">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe the AI model workflow, retrieval logic, or target domain..."
            disabled={registerMutation.isPending}
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent transition-all"
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
            <option value="RAG">RAG (Retrieval-Augmented Generation)</option>
            <option value="AGENT">Multi-Turn Autonomous Agent</option>
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
                  name="environment"
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

      {/* ZIP Ingestion Dropzone */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">
          Source Archive Package (.zip) <span className="text-red-500">*</span>
        </label>

        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-150 select-none",
              isDragOver
                ? "border-indigo-500 bg-indigo-50/50 scale-[1.005]"
                : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/60",
              registerMutation.isPending && "opacity-50 pointer-events-none"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={registerMutation.isPending}
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-3 shadow-xs">
              <UploadCloud className="h-6 w-6" />
            </div>

            <h4 className="text-sm font-bold text-slate-900">
              Drag and drop your AI application ZIP package here
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Includes prompt templates, pipeline chains, and model wrappers. Maximum package size is{" "}
              <strong className="text-slate-800">50MB</strong>.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="rounded-xl h-8 text-xs font-semibold"
              >
                Browse Files
              </Button>
            </div>
          </div>
        ) : (
          /* Selected File Card */
          <Card className="border border-slate-200 bg-slate-50/40 p-4">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <FileArchive className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {formatFileSize(selectedFile.size)} • ZIP Archive
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="success" className="gap-1 text-[11px]">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Validated</span>
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={registerMutation.isPending}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Genuine Upload Progress Bar (Derives strictly from Axios byte stream) */}
              {registerMutation.isPending && uploadProgress > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Uploading archive to backend evaluation sandbox...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {fileError && (
          <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Safety Boundary Notice */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-[11px] text-slate-500 space-y-1">
        <span className="font-bold text-slate-700">Security Boundary Notice:</span>
        <p>
          Uploaded source packages are never extracted or executed in your browser. All code
          inspection and sandboxed red-teaming execute exclusively inside secure, ephemeral backend
          worker pods.
        </p>
      </div>

      {/* Submission Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={registerMutation.isPending || !selectedFile}
          isLoading={registerMutation.isPending}
          className="h-9 px-5 text-xs font-bold gap-2"
        >
          <span>Register & Onboard Application</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}

export default ZipUploadZone;
