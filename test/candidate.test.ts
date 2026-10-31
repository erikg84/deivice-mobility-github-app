import assert from "node:assert/strict";
import {test} from "node:test";
import {candidateDescriptor} from "../src/candidate.js";
const base={installationId:177191086,repository:{id:1437716718,full_name:"erikg84/apk-signing-poc-app"},run:{id:100,run_attempt:1,status:"completed",conclusion:"success"},artifact:{id:200,expired:false,workflow_run:{id:100}}};
test("emits credential-free candidate",()=>assert.deepEqual(candidateDescriptor(base),{schema_version:"1",source:"github_actions",installation_id:177191086,repository_id:1437716718,repository:"erikg84/apk-signing-poc-app",workflow_run_id:100,run_attempt:1,artifact_id:200}));
test("rejects cancelled run",()=>assert.throws(()=>candidateDescriptor({...base,run:{...base.run,conclusion:"cancelled"}}),/RUN_NOT_SUCCESSFUL/));
test("rejects stale or mismatched artifact",()=>{assert.throws(()=>candidateDescriptor({...base,artifact:{...base.artifact,expired:true}}),/ARTIFACT_RUN_MISMATCH/);assert.throws(()=>candidateDescriptor({...base,artifact:{...base.artifact,workflow_run:{id:101}}}),/ARTIFACT_RUN_MISMATCH/)});
