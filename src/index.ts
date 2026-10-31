import type { Probot } from "probot";
import { workflowCompleted } from "./events.js";

export default (app: Probot): void => {
  app.on("installation.created", async (context) => {
    context.log.info(
      { installationId: context.payload.installation.id },
      "GitHub App installation created"
    );
  });

  app.on("workflow_run.completed", async (context) => {
    const event = workflowCompleted(context.payload);
    if (!event) return;
    context.log.info({ workflow: event }, "Workflow completion received");
    // Intentionally no publishing side effects.
    // Future adapters receive generic envelopes and must not bypass
    // downstream independent provenance checks.
  });

  app.onError((error) => {
    app.log.error(error, "Unhandled GitHub App event error");
  });
};
