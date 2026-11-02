import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {pathToFileURL} from "node:url";

const pkg=path.resolve("build/package");
const manifest=JSON.parse(fs.readFileSync(path.join(pkg,"package.json"),"utf8"));
const original=JSON.parse(fs.readFileSync(path.join(pkg,"presets/pet.json"),"utf8"));
const focus=JSON.parse(fs.readFileSync(path.join(pkg,"presets/focus.json"),"utf8"));

test("derived identity, original 24 media clips, MIT and explicit noncommercial notices",()=>{
  assert.equal(manifest.name,"dsh-app-pet-fish");
  assert.equal(manifest.version,"1.1.0");
  assert.equal(manifest.license,"MIT");
  assert.equal(Object.keys(original.actions).length,24);
  assert.equal(Object.keys(original.actionMap).length,7);
  assert.equal(Object.keys(focus.actionMap).length,7);
  assert.equal(focus.move.enabled,false);
  assert.equal(focus.appearance.throwEnabled,false);
  const webm=fs.readdirSync(path.join(pkg,"assets/webm")).filter(f=>f.endsWith(".webm"));
  assert.equal(webm.length,24);
  for(const action of Object.values(original.actions))
    assert.ok(fs.statSync(path.join(pkg,"assets/webm",action+".webm")).size>0);
  const notice=fs.readFileSync(path.join(pkg,"THIRD_PARTY_NOTICES.md"),"utf8");
  for(const s of ["PC2005-cloud/dsh-pet","CC BY-NC-SA 4.0","dsh-app-pet","noncommercial"])
    assert.ok(notice.toLowerCase().includes(s.toLowerCase()),s);
});
test("keeps original DSH compatibility and distinct Cordis plugin id",()=>{
  assert.equal(manifest.dsh.compatibility.dshReleases["0.2.0-rc.2"],"compatible");
  assert.equal(manifest.dsh.bundle.patch,"./cordis.patch.yml");
  const patch=fs.readFileSync(path.join(pkg,"cordis.patch.yml"),"utf8");
  assert.ok(patch.includes("dsh-app-pet-fish"));
});

test("tool is read-only unless specifically asked to apply; dangerous args fail closed",async()=>{
  const home=fs.mkdtempSync(path.join(os.tmpdir(),"fish-dsh-"));
  try{
    process.env.DSH_HOME=home;
    process.env.DSH_PET_FISH_DISABLE_BOOT="1";
    const mod=await import(pathToFileURL(path.join(pkg,"lib/index.js")).href);
    assert.equal(mod.name,"dsh-app-pet-fish");
    assert.deepEqual(mod.inject,["tools"]);
    let tool;
    mod.apply({tools:{register(t){tool=t;return ()=>{};}}});
    assert.equal(tool.name,"fish_pet");
    assert.deepEqual(tool.parameters.properties.action.enum,["apply","status","list","verify"]);
    let out=await tool.execute({action:"grant-root"});
    assert.equal(out.ok,false);
    assert.equal(fs.existsSync(path.join(home,"bubble-cmd.json")),false);
    out=await tool.execute({action:"list",preset:"../../etc/passwd"});
    assert.equal(out.ok,false);
    out=await tool.execute({action:"verify"});
    assert.equal(out.ok,true);
    assert.ok(out.message.includes("24"));
    assert.equal(fs.existsSync(path.join(home,"bubble-cmd.json")),false);
    out=await tool.execute({action:"status"});
    assert.equal(out.ok,true);
    assert.ok(out.message.includes("素材"));
    // A harmless fake native result lets us verify protocol and state stamp.
    let seen=0;
    const responder=setInterval(()=>{
      const f=path.join(home,"bubble-cmd.json");
      if(!fs.existsSync(f))return;
      let cmd;
      try{cmd=JSON.parse(fs.readFileSync(f,"utf8"));}catch{return;}
      if(cmd.id===seen)return;
      seen=cmd.id;
      fs.writeFileSync(path.join(home,"bubble-result.json"),
        JSON.stringify({id:cmd.id,ok:true,message:"MOCK_NATIVE_OK"}));
    },10);
    try{
      out=await tool.execute({action:"apply",preset:"focus"});
      assert.equal(out.ok,true,out.message);
    }finally{clearInterval(responder);}
    const config=JSON.parse(fs.readFileSync(path.join(home,"bubble-cmd.json"),"utf8"));
    assert.equal(config.action,"set");
    assert.equal(config.fields.moveEnabled,false);
    assert.equal(Object.keys(config.fields.actions).length,24);
    const applied=JSON.parse(fs.readFileSync(path.join(home,"deskpet/fish-state.json"),"utf8"));
    assert.match(applied.fingerprint,/^[0-9a-f]{16}$/);
    assert.equal(fs.existsSync(path.join(home,"deskpet/state.json")),false);
  }finally{
    fs.rmSync(home,{recursive:true,force:true});
    delete process.env.DSH_HOME;
    delete process.env.DSH_PET_FISH_DISABLE_BOOT;
  }
});
