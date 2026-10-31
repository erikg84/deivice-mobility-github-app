import { readFile } from "node:fs/promises";
import { App } from "@octokit/app";

export function parseArgs(args: string[]): { command: string; options: Record<string,string> } {
  const [command, ...rest] = args;
  const options: Record<string,string> = {};
  for (let i=0;i<rest.length;i+=2) {
    const flag=rest[i];
    if (!flag?.startsWith("--") || !rest[i+1] || rest[i+1].startsWith("--")) throw new Error("Options must be --name value pairs");
    options[flag.slice(2)] = rest[i+1];
  }
  return {command: command ?? "help",options};
}
export function positiveId(s: string | undefined, name: string): number {
  const n=Number(s);
  if (!s || !Number.isSafeInteger(n) || n<=0) throw new Error(`Invalid or missing ${name}`);
  return n;
}
export function repoParts(s: string | undefined): { owner:string;repo:string } {
  if (!s || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(s)) throw new Error("Use --repo owner/name");
  const [owner,repo]=s.split("/");
  return {owner,repo};
}
export async function main(args: string[]): Promise<void> {
  const {command,options}=parseArgs(args);
  if (command === "help") {
    console.log("Usage: npm run cli -- <installations|repos|runs|artifacts> [--installation ID] [--repo owner/name] [--run ID]\nRead-only API commands; requires APP_ID and PRIVATE_KEY_PATH.");
    return;
  }
  if (!["installations","repos","runs","artifacts"].includes(command)) throw new Error("Unknown command; run help");
  const appId=positiveId(process.env.APP_ID,"APP_ID");
  const path=process.env.PRIVATE_KEY_PATH;
  if (!path) throw new Error("PRIVATE_KEY_PATH is required");
  const privateKey=await readFile(path,"utf8");
  const app=new App({appId,privateKey});
  let output:unknown;
  if (command==="installations") {
    const {data}=await app.octokit.request("GET /app/installations",{per_page:100});
    output=data.map(i=>({id:i.id,account:i.account?.login ?? null,target_type:i.target_type}));
  } else {
    const installationId=positiveId(options.installation,"--installation");
    const octokit=await app.getInstallationOctokit(installationId);
    if (command==="repos") {
      const {data:{repositories:data}}=await octokit.request("GET /installation/repositories",{per_page:100});
      output=data.map(r=>({id:r.id,full_name:r.full_name,private:r.private}));
    } else {
      const {owner,repo}=repoParts(options.repo);
      if (command==="runs") {
        const {data:{workflow_runs:data}}=await octokit.request("GET /repos/{owner}/{repo}/actions/runs",{owner,repo,per_page:100});
        output=data.slice(0,25).map(r=>({id:r.id,name:r.name,status:r.status,conclusion:r.conclusion,head_sha:r.head_sha,url:r.html_url}));
      } else {
        const run_id=positiveId(options.run,"--run");
        const {data:{artifacts:data}}=await octokit.request("GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",{owner,repo,run_id,per_page:100});
        output=data.map(a=>({id:a.id,name:a.name,size_in_bytes:a.size_in_bytes,expired:a.expired,archive_download_url:a.archive_download_url}));
      }
    }
  }
  console.log(JSON.stringify(output,null,2));
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main(process.argv.slice(2)).catch((err:unknown)=>{
    console.error(err instanceof Error ? err.message : "Unknown failure");
    process.exitCode=1;
  });
}
