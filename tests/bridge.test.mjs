import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

test('DSH-native bubble notify uses existing mailbox and correct receipt',async()=>{
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'fish-native-mail-'));
  const cmd=path.join(home,'bubble-cmd.json'),reply=path.join(home,'bubble-result.json');
  process.env.DSH_HOME=home;
  process.env.DSH_PET_FISH_DISABLE_BOOT='1';
  let timer;
  try{
    const plugin=await import(pathToFileURL(path.resolve('build/package/lib/index.js')).href);
    const tools=new Map();
    plugin.apply({tools:{register(t){tools.set(t.name,t);}}});
    assert.equal(tools.has('fish_pet'),true);
    assert.equal(tools.has('fish_pet_life'),true);
    const life=tools.get('fish_pet_life');
    let seen=null;
    timer=setInterval(()=>{
      if(!fs.existsSync(cmd))return;
      let payload;
      try{payload=JSON.parse(fs.readFileSync(cmd,'utf8'));}catch{return;}
      if(!payload||payload.id===seen?.id)return;
      seen=payload;
      fs.unlinkSync(cmd); // mock native poll consumes the pending command
      fs.writeFileSync(reply,JSON.stringify({id:payload.id,ok:true,message:'mock native accepted'}));
    },15);
    const response=await life.execute({action:'say',text:'复习一会儿，休息一下～'});
    assert.equal(response.ok,true,response.message);
    assert.equal(seen.action,'notify');
    assert.equal(seen.sticky,false);
    assert.equal(seen.durationMs,4000);
    assert.equal(seen.text,'复习一会儿，休息一下～');
    assert.ok(Number.isSafeInteger(seen.id)&&seen.id>=1300000);
    assert.equal(fs.existsSync(path.join(home,'deskpet','fish-life.json')),false);
  }finally{
    if(timer)clearInterval(timer);
    delete process.env.DSH_HOME;
    delete process.env.DSH_PET_FISH_DISABLE_BOOT;
    fs.rmSync(home,{recursive:true,force:true});
  }
});
test('pending foreign bubble command is not overwritten or acknowledged',async()=>{
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'fish-native-busy-'));
  process.env.DSH_HOME=home;
  process.env.DSH_PET_FISH_DISABLE_BOOT='1';
  try{
    const command={id:10,action:'get'};
    fs.writeFileSync(path.join(home,'bubble-cmd.json'),JSON.stringify(command));
    fs.writeFileSync(path.join(home,'bubble-result.json'),JSON.stringify({id:9,ok:true}));
    const plugin=await import(pathToFileURL(path.resolve('build/package/lib/index.js')).href+'?busy=1');
    const tools=new Map();
    plugin.apply({tools:{register(t){tools.set(t.name,t);}}});
    const response=await tools.get('fish_pet_life').execute({action:'say',text:'hi'});
    assert.equal(response.ok,false);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(home,'bubble-cmd.json'),'utf8')),command);
    assert.equal(JSON.parse(fs.readFileSync(path.join(home,'bubble-result.json'),'utf8')).id,9);
  }finally{
    delete process.env.DSH_HOME;
    delete process.env.DSH_PET_FISH_DISABLE_BOOT;
    fs.rmSync(home,{recursive:true,force:true});
  }
});
