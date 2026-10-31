import { apiClient } from "@/services/api.client";
import { DetailedFinding, QualityReportSummary } from "@/types/findings.types";
import { MOCK_DETAILED_FINDINGS, MOCK_QUALITY_REPORT } from "@/mocks/findings.mock";
import { isDemoMode } from "@/utils/env";
import { demoFindingsService } from "@/demo";

export const findingsService = {
  /**
   * Retrieve list of detected quality findings with optional filtering.
   */
  async getFindings(params?: {
    search?: string;
    severity?: string;
    pillar?: string;
    status?: string;
  }): Promise<DetailedFinding[]> {
    if (isDemoMode()) {
      return demoFindingsService.getFindings(params);
    }

    try {
      const response = await apiClient.get<DetailedFinding[]>("/findings", { params });
      return response.data.map((f) => ({ ...f, dataSource: "LIVE_BACKEND" }));
    } catch {
      let results = [...MOCK_DETAILED_FINDINGS];

      if (params?.search) {
        const q = params.search.toLowerCase();
        results = results.filter(
          (f) =>
            f.title.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.applicationName.toLowerCase().includes(q) ||
            f.id.toLowerCase().includes(q)
        );
      }

      if (params?.severity && params.severity !== "ALL") {
        results = results.filter((f) => f.severity === params.severity);
      }

      if (params?.pillar && params.pillar !== "ALL") {
        results = results.filter((f) => f.pillar === params.pillar);
      }

      if (params?.status && params.status !== "ALL") {
        results = results.filter((f) => f.status === params.status);
      }

      return results;
    }
  },

  /**
   * Retrieve specific finding by unique ID.
   */
  async getFindingById(id: string): Promise<DetailedFinding | null> {
    if (isDemoMode()) {
      return demoFindingsService.getFindingById(id);
    }

    try {
      const response = await apiClient.get<DetailedFinding>(`/findings/${id}`);
      return { ...response.data, dataSource: "LIVE_BACKEND" };
    } catch {
      const found = MOCK_DETAILED_FINDINGS.find((f) => f.id === id);
      return found ? { ...found, dataSource: "DEVELOPMENT_MOCK_ONLY" } : null;
    }
  },

  /**
   * Retrieve structured quality report summary for an evaluation run.
   */
  async getQualityReport(runId: string): Promise<QualityReportSummary> {
    if (isDemoMode()) {
      return demoFindingsService.getQualityReport(runId);
    }

    try {
      const response = await apiClient.get<QualityReportSummary>(`/reports/${runId}`);
      return { ...response.data, dataSource: "LIVE_BACKEND" };
    } catch {
      return { ...MOCK_QUALITY_REPORT, runId, dataSource: "DEVELOPMENT_MOCK_ONLY" };
    }
  },

  /**
   * Export evaluation quality report to client-side CSV or Browser Print / PDF.
   */
  exportReport(report: QualityReportSummary, format: "CSV" | "PRINT") {
    if (isDemoMode()) {
      return demoFindingsService.exportReport(report, format);
    }

    if (format === "PRINT") {
      window.print();
      return;
    }

    // CSV format generation
    const rows = [
      ["Report ID", report.reportId],
      ["Run Identifier", report.runNumber],
      ["Application Name", report.applicationName],
      ["Version", report.applicationVersion],
      ["Environment", report.environment],
      ["Release Recommendation", report.releaseRecommendation],
      ["Overall Quality Score", `${report.overallScore} / 100`],
      ["Total Test Cases", String(report.totalTests)],
      ["Passed Tests", String(report.passedTests)],
      ["Failed Tests", String(report.failedTests)],
      ["Blocker Defects", String(report.blockersCount)],
      ["Warnings", String(report.warningsCount)],
      [],
      ["Quality Dimension", "Score (%)"],
      ["Accuracy", String(report.dimensions.accuracy)],
      ["Grounding", String(report.dimensions.grounding)],
      ["Completeness", String(report.dimensions.completeness)],
      ["Safety", String(report.dimensions.safety)],
      ["Security", String(report.dimensions.security)],
      ["Consistency", String(report.dimensions.consistency)],
      ["Bias", String(report.dimensions.bias)],
      ["Model Drift", String(report.dimensions.modelDrift)],
      ["Release Readiness", String(report.dimensions.releaseReadiness)],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QualiTrust_Report_${report.runNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default findingsService;
