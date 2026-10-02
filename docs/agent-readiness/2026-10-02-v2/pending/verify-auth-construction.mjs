import assert from 'node:assert/strict';
import express from 'express';
import auth from './agent-auth-construction.mjs';
const app=express();let parserReached=false;
app.use(auth);
app.use((req,res,next)=>{parserReached=true;next();});
app.use(express.json());
app.get('/api/agent/lookup',(req,res)=>res.json({found:true,public:true}));
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
try {
 const as=await(await fetch(origin+'/.well-known/oauth-authorization-server')).json();
 const prm=await(await fetch(origin+'/.well-known/oauth-protected-resource')).json();
 assert.equal(as.issuer,prm.authorization_servers[0]);assert.equal(prm.resource,as.issuer);
 for(const doc of [as,as.agent_auth,as.agent_auth.anonymous,prm]) {assert.equal(doc.available,false);assert.equal(doc.capabilities_status,'planned_contract_only');assert.equal(doc.launch_date,null);}
 const jwks=await(await fetch(origin+'/.well-known/jwks.json')).json();assert.deepEqual(jwks.keys,[]);assert.equal(jwks.available,false);
 for(const endpoint of ['authorize','token','register','claim','resource']) {
  const res=await fetch(origin+'/agent-auth/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"invalid-json-identity":'});
  assert.equal(res.status,503);assert.equal(res.headers.get('cache-control'),'no-store');assert.equal((await res.json()).error,'temporarily_unavailable');
 }
 assert.equal(parserReached,false);
 const authDoc=await(await fetch(origin+'/auth.md')).text();assert.match(authDoc,/^# TennisHub auth.md/);assert.match(authDoc,/not human login/);assert.match(authDoc,/Coming soon/);
 assert.equal((await fetch(origin+'/api/agent/lookup')).status,200);
 console.log(JSON.stringify({passed:true,checks:['issuer/resource consistency','all capabilities explicitly planned and disabled','disabled empty JWKS','all reserved operations 503/no-store','malformed identity bodies never parsed','public lookup stays available','human login accurately preserved in documentation'],production_mounted:false,owner_acceptance_pending:true},null,2));
} finally {await new Promise(resolve=>server.close(resolve));}
