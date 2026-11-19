/* Confirm that retirement targets the known ad worker without touching others. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const cleaner=fs.readFileSync(path.join(root,'assets/js/retire-ad-worker.js'),'utf8');
let updates=0,foreignUpdates=0,unregisters=0;
const known={active:{scriptURL:'https://hamam16000-glitch.github.io/free-tools-online/sw.js'},update(){updates++;return Promise.resolve();},unregister(){unregisters++;return Promise.resolve(true);}};
const unrelated={active:{scriptURL:'https://hamam16000-glitch.github.io/other-app/sw.js'},update(){foreignUpdates++;return Promise.resolve();}};
const remote={active:{scriptURL:'https://another.example/free-tools-online/sw.js'},update(){foreignUpdates++;return Promise.resolve();}};
(async()=>{
 const context={URL,location:{origin:'https://hamam16000-glitch.github.io'},navigator:{serviceWorker:{getRegistrations:()=>Promise.resolve([known,unrelated,remote])}}};
 vm.runInNewContext(cleaner,context);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(updates,1);assert.equal(foreignUpdates,0);assert.equal(unregisters,0);
 known.update=()=>Promise.reject(new Error('offline'));
 vm.runInNewContext(cleaner,context);await new Promise(resolve=>setImmediate(resolve));assert.equal(unregisters,1);
 const handlers={};let activated=0,skipped=0,pending=[];
 const self={addEventListener(type,handler){handlers[type]=handler;},skipWaiting(){skipped++;return Promise.resolve();},registration:{unregister(){activated++;return Promise.resolve(true);}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self});
 handlers.install({waitUntil(p){pending.push(p);}});handlers.activate({waitUntil(p){pending.push(p);}});await Promise.all(pending);
 assert.equal(skipped,1);assert.equal(activated,1);assert.deepEqual(Object.keys(handlers).sort(),['activate','install']);
 console.log(JSON.stringify({status:'passed',assertions:7}));
})().catch(error=>{console.error(error);process.exitCode=1;});
