/**
 * Fish Life 1.2.0: original, opt-in study reminders and playful text.
 * BASE: dsh-app-pet@1.0.3 (MIT code); 24 assets © PC2005-cloud/dsh-pet,
 * noncommercial. Keep THIRD_PARTY_NOTICES.md. No media/code copied anew.
 * Uses only native bubble notify; NO Android alarms/TTS/shell/network.
 * Timers run only while DSH Node engine is alive. Default OFF.
 */
import fs from 'node:fs';
import path from 'node:path';

const FEATURES=['break','water','mischief'];
const MINS={break:45,water:90,mischief:120};
const WORDS={
  break:['伸个懒腰吧！学了这么久，休息一下～','小鱼提醒你：眼睛也需要远眺片刻。','休息五分钟，回来继续加油！'],
  water:['叮！喝口水，给大脑补补水～','小鱼把水杯推过来啦。','偷偷提醒：别忘记喝水哟。'],
  mischief:['我没在摸鱼！真的！','偷偷把错题本上的烦恼叼走啦～','嘘……我在帮你守护学习进度。','大肥鱼装作在写代码，其实在偷吃零食！']
};
const fresh=()=>({schema:1,quietStart:'22:00',quietEnd:'08:00',
  features:Object.fromEntries(FEATURES.map(k=>[k,{enabled:false,intervalMin:MINS[k]}]))});
const validTime=t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
export function quiet(date,start,end){
  const m=date.getHours()*60+date.getMinutes(),a=minutes(start),b=minutes(end);
  return a===b?false:a<b?m>=a&&m<b:m>=a||m<b;
}
export function cleanText(text){
  if(typeof text!=='string')throw Error('INVALID_TEXT');
  const s=text.trim();
  if(s.length<1||s.length>60||/[\u0000-\u001f\u007f]/.test(s))throw Error('INVALID_TEXT');
  return s;
}
function load(home){
  let c;
  try{c=JSON.parse(fs.readFileSync(path.join(home,'deskpet','fish-life.json'),'utf8'));}
  catch{return fresh();}
  const x=fresh();
  if(c?.schema!==1)return x;
  if(validTime(c.quietStart))x.quietStart=c.quietStart;
  if(validTime(c.quietEnd))x.quietEnd=c.quietEnd;
  for(const k of FEATURES){
    const p=c.features?.[k];
    if(p&&typeof p==='object'){
      if(typeof p.enabled==='boolean')x.features[k].enabled=p.enabled;
      if(Number.isSafeInteger(p.intervalMin)&&p.intervalMin>=15&&p.intervalMin<=240)
        x.features[k].intervalMin=p.intervalMin;
    }
  }
  return x;
}
function save(home,c){
  const dir=path.join(home,'deskpet');
  fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,'fish-life.json'),tmp=file+'.tmp';
  try{
    fs.writeFileSync(tmp,JSON.stringify(c,null,2)+'\n','utf8');
    fs.renameSync(tmp,file);
  }finally{try{fs.unlinkSync(tmp);}catch{}}
}
const res=(ok,message)=>({ok,message});
function pick(arr,random){
  const n=Number(random());
  return arr[Number.isFinite(n)?Math.max(0,Math.min(arr.length-1,Math.floor(n*arr.length))):0];
}
/**
 * @param home Private DSH_HOME. Only write deskpet/fish-life.json.
 * @param notify Trusted DSH bubble command transport; must send {action:'notify'}.
 * No timer is created unless there is a previously enabled preference.
 * A restart always starts a fresh countdown, never bursts missed reminders.
 */
export function createLife({home,notify,now=()=>new Date(),
  random=Math.random,schedule=setInterval,unschedule=clearInterval}){
  if(typeof home!=='string'||!home||typeof notify!=='function')throw Error('INVALID_HOST');
  let state=load(home),handle=null,closed=false,busy=false,lastSent=0;
  const due=Object.fromEntries(FEATURES.map(k=>[k,null]));
  const active=()=>FEATURES.some(k=>state.features[k].enabled);
  const copy=()=>JSON.parse(JSON.stringify(state));
  function resetDue(){
    const t=now().getTime();
    for(const k of FEATURES)due[k]=state.features[k].enabled?
      t+state.features[k].intervalMin*60000:null;
  }
  function timers(){
    if(handle!==null){unschedule(handle);handle=null;}
    if(!closed&&active()){
      handle=schedule(()=>{void tick().catch(()=>{});},30000);
      handle?.unref?.();
    }
  }
  async function say(text){
    if(closed)return res(false,'提醒已停止');
    let s;
    try{s=cleanText(text);}catch{return res(false,'内容必须是 1–60 字且不含换行');}
    try{
      const r=await notify({action:'notify',text:s,durationMs:4000,sticky:false});
      return res(r?.ok===true,r?.ok===true?'已显示桌宠文字':r?.message||'原生悬浮球不可用');
    }catch{return res(false,'原生消息发送失败');}
  }
  async function tick(){
    if(closed||busy||!active())return;
    const d=now(),t=d.getTime();
    if(!Number.isFinite(t)||quiet(d,state.quietStart,state.quietEnd))return;
    if(lastSent!==0&&t-lastSent<15*60000)return;
    for(const k of FEATURES){
      if(!state.features[k].enabled)continue;
      if(due[k]===null){due[k]=t+state.features[k].intervalMin*60000;continue;}
      if(t<due[k])continue;
      due[k]=t+state.features[k].intervalMin*60000;
      busy=true;
      try{const r=await say(pick(WORDS[k],random));if(r.ok)lastSent=t;}
      finally{busy=false;}
      break;
    }
  }
  function configure(a){
    if(closed)return res(false,'已停止');
    if(!FEATURES.includes(a.feature)||typeof a.enabled!=='boolean')
      return res(false,'需要 feature=break/water/mischief 与 enabled 布尔值');
    const interval=a.intervalMin??state.features[a.feature].intervalMin;
    const start=a.quietStart??state.quietStart,end=a.quietEnd??state.quietEnd;
    if(!Number.isSafeInteger(interval)||interval<15||interval>240)
      return res(false,'提醒间隔须为 15–240 分钟');
    if(!validTime(start)||!validTime(end))return res(false,'静音时间应为 HH:MM');
    const next=copy();next.features[a.feature]={enabled:a.enabled,intervalMin:interval};
    next.quietStart=start;next.quietEnd=end;
    try{save(home,next);}catch{return res(false,'配置保存失败，仍维持旧设置');}
    state=next;resetDue();timers();
    return res(true,a.feature+(a.enabled?' 已开启':' 已关闭')+'，间隔 '+interval+' 分钟，静音 '+start+'–'+end);
  }
  function off(){
    const next=copy();for(const k of FEATURES)next.features[k].enabled=false;
    try{save(home,next);}catch{return res(false,'配置保存失败');}
    state=next;resetDue();timers();
    return res(true,'全部定时提醒和调皮互动已关闭');
  }
  async function execute(a){
    if(!a||typeof a!=='object')return res(false,'无效参数');
    switch(a.action){
      case 'status':return res(true,JSON.stringify({...copy(),
        runtime:closed?'STOPPED':active()?'RUNNING':'OFF',
        note:'仅 DSH Node 引擎运行期间可提醒，不等于 Android 系统闹钟'}));
      case 'configure':return configure(a);
      case 'off':return off();
      case 'break':case 'water':case 'mischief':return say(pick(WORDS[a.action],random));
      case 'say':return say(a.text);
      default:return res(false,'未知操作已拒绝');
    }
  }
  function close(){
    closed=true;
    if(handle!==null){unschedule(handle);handle=null;}
    for(const k of FEATURES)due[k]=null;
  }
  resetDue();timers();
  return Object.freeze({execute,tick,close,config:copy});
}
export function lifeTool(life){
  return {
    name:'fish_pet_life',
    description:'Opt-in quiet DSH pet text reminders for break, water and playful mischief. Default OFF. Configure on explicit user request only. Runs only when DSH Node is alive. No real spoken audio or new video.',
    parameters:{type:'object',additionalProperties:false,properties:{
      action:{type:'string',enum:['status','configure','off','break','water','mischief','say']},
      feature:{type:'string',enum:FEATURES},
      enabled:{type:'boolean'},
      intervalMin:{type:'integer',minimum:15,maximum:240},
      quietStart:{type:'string'},quietEnd:{type:'string'},
      text:{type:'string',maxLength:60}
    },required:['action']},
    output:{schema:{type:'object',properties:{ok:{type:'boolean'},message:{type:'string'}},
      required:['ok','message']},render:(_args,r)=>[{type:'text',text:(r.ok?'✓ ':'✗ ')+r.message}]},
    async execute(args){return life.execute(args);}
  };
}
