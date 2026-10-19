import test from 'node:test';
import assert from 'node:assert/strict';
import {startLiveRefresh} from '../lib/live-refresh.ts';
const settle=()=>new Promise(r=>setImmediate(r));
test('refresh coalesces events, skips hidden/offline pages and aborts cleanup',async()=>{
 let visible=true,online=true,calls=0,finish,signal;
 const live=startLiveRefresh(s=>{calls++;signal=s;return new Promise(r=>{finish=r;});},{visible:()=>visible,online:()=>online,intervalMs:100000});
 const first=live.refresh();await live.refresh();await live.refresh();assert.equal(calls,1);finish();await first;await settle();assert.equal(calls,2);
 live.stop();assert.equal(signal.aborted,true);finish();await settle();await live.refresh();assert.equal(calls,2);
 const idle=startLiveRefresh(async()=>{calls++;},{visible:()=>visible,online:()=>online,intervalMs:100000});visible=false;await idle.refresh();visible=true;online=false;await idle.refresh();assert.equal(calls,2);idle.stop();
});
test('timer reconciles data even without socket events',async()=>{
 let calls=0;const live=startLiveRefresh(async()=>{calls++;},{visible:()=>true,online:()=>true,intervalMs:5});
 try{await new Promise(r=>setTimeout(r,25));assert.ok(calls>=1);}finally{live.stop();}
});
