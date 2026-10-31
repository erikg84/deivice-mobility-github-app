/** Credential-free candidate metadata. Never an authorization assertion. */
export interface Candidate {
  schema_version:"1";source:"github_actions";installation_id:number;
  repository_id:number;repository:string;workflow_run_id:number;
  run_attempt:number;artifact_id:number;
}
export function candidateDescriptor(input:{
  installationId:number;
  repository:{id:number;full_name:string};
  run:{id:number;run_attempt:number;status:string;conclusion:string|null};
  artifact:{id:number;expired:boolean;workflow_run?:{id:number}|null};
}):Candidate {
  const {installationId,repository,run,artifact}=input;
  if (![installationId,repository.id,run.id,run.run_attempt,artifact.id].every(n=>Number.isSafeInteger(n)&&n>0))throw new Error("INVALID_CANDIDATE_ID");
  if(run.status!=="completed"||run.conclusion!=="success")throw new Error("RUN_NOT_SUCCESSFUL");
  if(artifact.expired||artifact.workflow_run?.id!==run.id)throw new Error("ARTIFACT_RUN_MISMATCH");
  return {schema_version:"1",source:"github_actions",installation_id:installationId,
    repository_id:repository.id,repository:repository.full_name,
    workflow_run_id:run.id,run_attempt:run.run_attempt,artifact_id:artifact.id};
}
