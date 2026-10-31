import assert from "node:assert/strict";
import { test } from "node:test";
import { workflowCompleted } from "../src/events.js";

const payload = {
  action: "completed",
  installation: { id: 8 },
  repository: { id: 12, full_name: "example/demo" },
  workflow_run: {
    id: 91, run_attempt: 2, head_sha: "abc",
    conclusion: "success", workflow_id: 4
  }
};

test("normalizes completed workflow metadata", () => {
  assert.deepEqual(workflowCompleted(payload), {
    installationId: 8, repositoryId: 12, repository: "example/demo",
    runId: 91, attempt: 2, headSha: "abc",
    conclusion: "success", workflowId: 4
  });
});

test("ignores non-completed workflow events", () => {
  assert.equal(workflowCompleted({ ...payload, action: "requested" }), null);
});

test("handles missing installation and run attempt", () => {
  const result = workflowCompleted({
    ...payload, installation: null,
    workflow_run: { ...payload.workflow_run, run_attempt: undefined }
  });
  assert.equal(result?.installationId, null);
  assert.equal(result?.attempt, 1);
});
