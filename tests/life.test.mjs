import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const lifeModule=await import(pathToFileURL(path.resolve('build/package/lib/fish-life.mjs')).href);
const {createLife,quiet,cleanText,lifeTool}=lifeModule;
const at=(hours,mins=0)=>new Date(2026,10,2,hours,mins,0);
function env(){
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'fish-life-'));
  let date=at(12),sent=[],active=new Map(),ids=0;
  const host={
    home,now:()=>date,random:()=>0,
    notify:async c=>{sent.push(c);return {ok:true};},
    schedule:(fn,ms)=>{const id=++ids;active.set(id,fn);return {id,unref(){}};},
    unschedule:h=>active.delete(h.id)
  };
  return {host,sent,active,time:d=>{date=d;},cleanup:()=>fs.rmSync(home,{recursive:true,force:true})};
}
test('disabled by default, no timer, no bubble writes',async()=>{
  const e=env();try{
    const l=createLife(e.host);
    assert.equal(e.active.size,0);
    assert.equal(JSON.parse((await l.execute({action:'status'})).message).runtime,'OFF');
    await l.tick();
    assert.equal(e.sent.length,0);
    l.close();
  }finally{e.cleanup();}
});
test('opt-in 45 minute break, minimum interval, repeated due and user OFF',async()=>{
  const e=env();try{
    const l=createLife(e.host);
    assert.equal((await l.execute({action:'configure',feature:'break',enabled:true,intervalMin:4})).ok,false);
    assert.equal((await l.execute({action:'configure',feature:'break',enabled:true,intervalMin:45})).ok,true);
    assert.equal(e.active.size,1);
    e.time(at(12,44));await l.tick();assert.equal(e.sent.length,0);
    e.time(at(12,45));await l.tick();assert.equal(e.sent.length,1);
    assert.equal(e.sent[0].action,'notify');
    assert.equal(e.sent[0].sticky,false);
    e.time(at(12,46));await l.tick();assert.equal(e.sent.length,1);
    assert.equal((await l.execute({action:'off'})).ok,true);
    assert.equal(e.active.size,0);
    e.time(at(14));await l.tick();assert.equal(e.sent.length,1);
    l.close();
  }finally{e.cleanup();}
});
test('quiet hours suppress notices and prevent catch-up spam',async()=>{
  const e=env();try{
    const l=createLife(e.host);
    assert.equal(quiet(at(23),'22:00','08:00'),true);
    assert.equal(quiet(at(9),'22:00','08:00'),false);
    await l.execute({action:'configure',feature:'water',enabled:true,intervalMin:15});
    e.time(at(23));await l.tick();
    assert.equal(e.sent.length,0);
    e.time(at(23,30));await l.tick();
    assert.equal(e.sent.length,0);
    l.close();
  }finally{e.cleanup();}
});
test('manual playful message, safe user text, no audio or files',async()=>{
  const e=env();try{
    const l=createLife(e.host);
    assert.equal((await l.execute({action:'mischief'})).ok,true);
    assert.equal((await l.execute({action:'say',text:'学习继续！'})).ok,true);
    assert.equal((await l.execute({action:'say',text:'secret\nnew line'})).ok,false);
    assert.equal((await l.execute({action:'say',text:'a'.repeat(61)})).ok,false);
    assert.equal((await l.execute({action:'unknown'})).ok,false);
    assert.deepEqual(e.sent.map(x=>x.action),['notify','notify']);
    assert.throws(()=>cleanText('\n'),/INVALID_TEXT/);
    const tool=lifeTool(l);
    assert.equal(tool.name,'fish_pet_life');
    assert.equal(tool.parameters.properties.action.enum.includes('off'),true);
    l.close();
  }finally{e.cleanup();}
});
test('persistent user opt-in starts new countdown after restart; stop kills timer',async()=>{
  const e=env();try{
    let a=createLife(e.host);
    await a.execute({action:'configure',feature:'break',enabled:true,intervalMin:15});
    a.close();assert.equal(e.active.size,0);
    e.time(at(14));
    let b=createLife(e.host);
    assert.equal(e.active.size,1);
    await b.tick();assert.equal(e.sent.length,0);
    e.time(at(14,15));await b.tick();assert.equal(e.sent.length,1);
    b.close();assert.equal(e.active.size,0);
  }finally{e.cleanup();}
});
test('invalid settings do not persist and opt-in status remains false',async()=>{
  const e=env();try{
    const l=createLife(e.host);
    assert.equal((await l.execute({action:'configure',feature:'mischief',enabled:true,quietStart:'bad'})).ok,false);
    assert.equal((await l.execute({action:'configure',feature:'bad',enabled:true})).ok,false);
    assert.equal(JSON.parse((await l.execute({action:'status'})).message).features.mischief.enabled,false);
    assert.equal(fs.existsSync(path.join(e.host.home,'deskpet/fish-life.json')),false);
    l.close();
  }finally{e.cleanup();}
});
