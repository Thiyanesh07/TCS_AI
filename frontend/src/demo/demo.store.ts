/**
 * QualiTrust AI — Reactive Demo Store
 *
 * Persists demo state in localStorage so that onboarding, evaluations,
 * and release reviews persist across browser refreshes during judge demonstrations.
 */

import { RegisteredApplication } from "@/types/application.types";
import { EvaluationRunDetail } from "@/types/evaluation.types";
import { DetailedFinding } from "@/types/findings.types";
import { ReleaseReviewRecord, RegressionBenchmark } from "@/types/release.types";
import { DemoScenarioId, DEMO_STORAGE_KEY, DEMO_SCENARIO_KEY } from "./demo.config";
import {
  INITIAL_DEMO_APPLICATIONS,
  INITIAL_DEMO_RUNS,
  INITIAL_DEMO_FINDINGS,
  INITIAL_DEMO_RELEASES,
  INITIAL_DEMO_REGRESSIONS,
} from "./demo.data";

export interface DemoStoreState {
  applications: RegisteredApplication[];
  runs: EvaluationRunDetail[];
  findings: DetailedFinding[];
  releaseReviews: ReleaseReviewRecord[];
  regressionBenchmarks: RegressionBenchmark[];
  activeScenarioId: DemoScenarioId;
}

class DemoStore {
  private state: DemoStoreState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DemoStoreState {
    if (typeof window === "undefined") {
      return this.getInitialState();
    }

    try {
      const stored = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          applications: parsed.applications || INITIAL_DEMO_APPLICATIONS,
          runs: parsed.runs || INITIAL_DEMO_RUNS,
          findings: parsed.findings || INITIAL_DEMO_FINDINGS,
          releaseReviews: parsed.releaseReviews || INITIAL_DEMO_RELEASES,
          regressionBenchmarks: parsed.regressionBenchmarks || INITIAL_DEMO_REGRESSIONS,
          activeScenarioId: parsed.activeScenarioId || "HEALTHY_APPLICATION",
        };
      }
    } catch (e) {
      console.warn("Failed to parse demo store state, resetting to initial fixtures", e);
    }

    const initial = this.getInitialState();
    this.persist(initial);
    return initial;
  }

  private getInitialState(): DemoStoreState {
    return {
      applications: [...INITIAL_DEMO_APPLICATIONS],
      runs: [...INITIAL_DEMO_RUNS],
      findings: [...INITIAL_DEMO_FINDINGS],
      releaseReviews: [...INITIAL_DEMO_RELEASES],
      regressionBenchmarks: [...INITIAL_DEMO_REGRESSIONS],
      activeScenarioId: "HEALTHY_APPLICATION",
    };
  }

  private persist(state: DemoStoreState): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
      window.localStorage.setItem(DEMO_SCENARIO_KEY, state.activeScenarioId);
    } catch (e) {
      console.warn("Failed to persist demo store state to localStorage", e);
    }
  }

  // --- Active Scenario Management ---
  public getActiveScenarioId(): DemoScenarioId {
    return this.state.activeScenarioId;
  }

  public setActiveScenarioId(scenarioId: DemoScenarioId): void {
    this.state.activeScenarioId = scenarioId;
    this.persist(this.state);
  }

  // --- Applications ---
  public getApplications(): RegisteredApplication[] {
    return [...this.state.applications];
  }

  public getApplicationById(id: string): RegisteredApplication | null {
    return this.state.applications.find((app) => app.id === id) || null;
  }

  public addApplication(app: RegisteredApplication): void {
    this.state.applications.unshift(app);
    this.persist(this.state);
  }

  // --- Evaluation Runs ---
  public getRuns(): EvaluationRunDetail[] {
    return [...this.state.runs];
  }

  public getRunById(id: string): EvaluationRunDetail | null {
    return this.state.runs.find((run) => run.id === id) || null;
  }

  public addRun(run: EvaluationRunDetail): void {
    this.state.runs.unshift(run);
    this.persist(this.state);
  }

  public updateRun(runId: string, updater: (prev: EvaluationRunDetail) => EvaluationRunDetail): EvaluationRunDetail | null {
    const index = this.state.runs.findIndex((r) => r.id === runId);
    if (index === -1) return null;
    const updated = updater(this.state.runs[index]);
    this.state.runs[index] = updated;
    this.persist(this.state);
    return updated;
  }

  // --- Findings ---
  public getFindings(): DetailedFinding[] {
    return [...this.state.findings];
  }

  public getFindingById(id: string): DetailedFinding | null {
    return this.state.findings.find((f) => f.id === id) || null;
  }

  public addFindings(findings: DetailedFinding[]): void {
    this.state.findings.unshift(...findings);
    this.persist(this.state);
  }

  // --- Release Reviews ---
  public getReleaseReviews(): ReleaseReviewRecord[] {
    return [...this.state.releaseReviews];
  }

  public getReleaseReviewById(id: string): ReleaseReviewRecord | null {
    return this.state.releaseReviews.find((r) => r.id === id) || null;
  }

  public updateReleaseReview(
    reviewId: string,
    updates: Partial<ReleaseReviewRecord>
  ): ReleaseReviewRecord | null {
    const index = this.state.releaseReviews.findIndex((r) => r.id === reviewId);
    if (index === -1) return null;
    const updated = { ...this.state.releaseReviews[index], ...updates };
    this.state.releaseReviews[index] = updated;
    this.persist(this.state);
    return updated;
  }

  public addReleaseReview(review: ReleaseReviewRecord): void {
    this.state.releaseReviews.unshift(review);
    this.persist(this.state);
  }

  // --- Regression Benchmarks ---
  public getRegressionBenchmarks(): RegressionBenchmark[] {
    return [...this.state.regressionBenchmarks];
  }

  // --- Reset Functionality ---
  public resetToInitialState(): void {
    this.state = this.getInitialState();
    this.persist(this.state);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }
}

export const demoStore = new DemoStore();
