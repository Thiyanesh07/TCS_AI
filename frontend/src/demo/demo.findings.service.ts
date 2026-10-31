/**
 * QualiTrust AI — Demo Findings & Quality Reports Service
 */

import { DetailedFinding, QualityReportSummary } from "@/types/findings.types";
import { demoStore } from "./demo.store";

export const demoFindingsService = {
  async getFindings(params?: {
    search?: string;
    severity?: string;
    pillar?: string;
    status?: string;
  }): Promise<DetailedFinding[]> {
    let results = demoStore.getFindings();

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
  },

  async getFindingById(id: string): Promise<DetailedFinding | null> {
    return demoStore.getFindingById(id);
  },

  async getQualityReport(runId: string): Promise<QualityReportSummary> {
    const run = demoStore.getRunById(runId) || demoStore.getRuns()[0];

    const dimensions = run?.dimensions || {
      accuracy: 94,
      grounding: 92,
      completeness: 90,
      safety: 96,
      security: 95,
      consistency: 89,
      bias: 94,
      modelDrift: 88,
      releaseReadiness: 94,
    };

    return {
      reportId: `REP-${run.id.slice(-6).toUpperCase()}`,
      runId: run.id,
      runNumber: run.runNumber,
      applicationId: run.applicationId,
      applicationName: run.applicationName,
      applicationVersion: run.applicationVersion,
      environment: run.environment,
      generatedAt: new Date().toISOString(),
      overallScore: run.overallScore || 92,
      releaseRecommendation: run.recommendation || "RELEASE",
      recommendationExplanation:
        run.recommendationExplanation ||
        "Demonstration run release recommendation based on automated policy thresholds.",
      dimensions,
      totalTests: run.testExecution?.total || 500,
      passedTests: run.testExecution?.passed || 480,
      failedTests: run.testExecution?.failed || 15,
      blockersCount: run.blockersCount,
      warningsCount: run.warningsCount,
      findingsSeverity: run.findingsBreakdown || {
        critical: run.blockersCount,
        high: 1,
        medium: 2,
        low: 1,
      },
      historicalDelta: {
        scoreDelta: 3.5,
        regressedPillars: [],
        improvedPillars: ["Accuracy", "Grounding"],
      },
      isMock: true,
      dataSource: "DEVELOPMENT_MOCK_ONLY",
    };
  },

  exportReport(report: QualityReportSummary, format: "CSV" | "PRINT") {
    if (format === "PRINT") {
      window.print();
      return;
    }

    // Generate real, downloadable CSV file
    const rows = [
      ["# QUALITRUST AI — DEMONSTRATION QUALITY BENCHMARK REPORT"],
      ["# Notice: Demonstration report for hackathon evaluation. No live AI model was invoked."],
      [],
      ["Report ID", report.reportId],
      ["Evaluation Run", report.runNumber],
      ["Application Name", report.applicationName],
      ["Version Tag", report.applicationVersion],
      ["Target Environment", report.environment],
      ["Generated At", report.generatedAt],
      ["Composite Quality Score", `${report.overallScore} / 100`],
      ["Release Recommendation", report.releaseRecommendation],
      ["Total Test Invocations", String(report.totalTests)],
      ["Passed Assertions", String(report.passedTests)],
      ["Failed Assertions", String(report.failedTests)],
      ["Critical Blockers", String(report.blockersCount)],
      ["Active Warnings", String(report.warningsCount)],
      [],
      ["QUALITY DIMENSION", "SCORE (%)", "THRESHOLD STATUS"],
      ["Accuracy", String(report.dimensions.accuracy), report.dimensions.accuracy >= 90 ? "PASSED" : "REVIEW"],
      ["Grounding", String(report.dimensions.grounding), report.dimensions.grounding >= 90 ? "PASSED" : "REVIEW"],
      ["Completeness", String(report.dimensions.completeness), report.dimensions.completeness >= 90 ? "PASSED" : "REVIEW"],
      ["Safety", String(report.dimensions.safety), report.dimensions.safety >= 90 ? "PASSED" : "REVIEW"],
      ["Security", String(report.dimensions.security), report.dimensions.security >= 90 ? "PASSED" : "REVIEW"],
      ["Consistency", String(report.dimensions.consistency), report.dimensions.consistency >= 90 ? "PASSED" : "REVIEW"],
      ["Bias & Fairness", String(report.dimensions.bias), report.dimensions.bias >= 90 ? "PASSED" : "REVIEW"],
      ["Model Drift", String(report.dimensions.modelDrift), report.dimensions.modelDrift >= 90 ? "PASSED" : "REVIEW"],
      ["Release Readiness", String(report.dimensions.releaseReadiness), report.dimensions.releaseReadiness >= 90 ? "PASSED" : "REVIEW"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QualiTrust_Demo_Report_${report.runNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
