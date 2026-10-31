import assert from "node:assert/strict";
import {test} from "node:test";
import {parseArgs,positiveId,repoParts} from "../src/cli.js";

test("parse read-only CLI options",()=>{
  assert.deepEqual(parseArgs(["runs","--installation","123","--repo","acme/mobile"]),{command:"runs",options:{installation:"123",repo:"acme/mobile"}});
});
test("reject malformed CLI arguments",()=>{
  assert.throws(()=>parseArgs(["runs","--repo"]),/Options/);
  assert.throws(()=>parseArgs(["runs","repo","x"]),/Options/);
});
test("validate numeric IDs",()=>{
  assert.equal(positiveId("177191086","installation"),177191086);
  assert.throws(()=>positiveId("-4","id"));
  assert.throws(()=>positiveId("NaN","id"));
});
test("parse repository identity",()=>{
  assert.deepEqual(repoParts("erikg84/apk-signing-poc-app"),{owner:"erikg84",repo:"apk-signing-poc-app"});
  assert.throws(()=>repoParts("../../secrets"));
});
