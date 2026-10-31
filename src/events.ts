/** Generic workflow signal; no downstream publishing or signing knowledge. */
export interface WorkflowCompleted {
  readonly installationId: number | null;
  readonly repositoryId: number;
  readonly repository: string;
  readonly runId: number;
  readonly attempt: number;
  readonly headSha: string;
  readonly conclusion: string | null;
  readonly workflowId: number;
}

export function workflowCompleted(payload: {
  action?: string;
  installation?: { id: number } | null;
  repository: { id: number; full_name: string };
  workflow_run: {
    id: number;
    run_attempt?: number;
    head_sha: string;
    conclusion: string | null;
    workflow_id: number;
  };
}): WorkflowCompleted | null {
  if (payload.action !== "completed") return null;
  return {
    installationId: payload.installation?.id ?? null,
    repositoryId: payload.repository.id,
    repository: payload.repository.full_name,
    runId: payload.workflow_run.id,
    attempt: payload.workflow_run.run_attempt ?? 1,
    headSha: payload.workflow_run.head_sha,
    conclusion: payload.workflow_run.conclusion,
    workflowId: payload.workflow_run.workflow_id
  };
}
