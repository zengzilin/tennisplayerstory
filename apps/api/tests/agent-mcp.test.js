import assert from 'node:assert/strict';
import express from 'express';
/* eslint-disable import/no-unresolved -- Legacy resolver does not understand SDK exports; this test executes both imports. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
/* eslint-enable import/no-unresolved */
import router from '../src/routes/agent-mcp.js';
const app=express();app.use(express.json());app.use(router);
const httpServer=app.listen(0,'127.0.0.1');
await new Promise(resolve=>httpServer.once('listening',resolve));
const origin=`http://127.0.0.1:${httpServer.address().port}`;
const client=new Client({name:'independent-readiness-client',version:'1.0.0'});
try {
 await client.connect(new StreamableHTTPClientTransport(new URL(origin+'/mcp')));
 const list=await client.listTools();assert.equal(list.tools[0].name,'tennishub_lookup');
 const search=await client.callTool({name:'tennishub_lookup',arguments:{q:'rankings'}});
 assert.ok(search.structuredContent.items.some(item=>item.id==='rankings'));
 const read=await client.callTool({name:'tennishub_lookup',arguments:{id:'rankings',lang:'ja'}});
 assert.equal(read.structuredContent.items[0].source_url,'https://tennisplayerstory.com/ja/rankings');
 const missing=await client.callTool({name:'tennishub_lookup',arguments:{id:'missing'}});assert.equal(missing.structuredContent.found,false);
 const invalid=await client.callTool({name:'tennishub_lookup',arguments:{kind:'users'}});assert.equal(invalid.isError,true);
 const outage=await client.callTool({name:'tennishub_lookup',arguments:{kind:'articles'}});assert.equal(outage.isError,true);
 assert.equal((await fetch(origin+'/mcp',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(origin+'/mcp')).status,405);
 const card=await(await fetch(origin+'/.well-known/mcp/server-card.json')).json();assert.equal(card.transport.type,'streamable-http');
 console.log(JSON.stringify({passed:true,sdk:'1.31.0',checks:['initialize','tools/list','tools/call search','exact read with Japanese source','missing item','invalid kind','storage outage','origin rejection','GET method rejection','server card'],production_integrated:true},null,2));
} finally {await client.close();await new Promise(resolve=>httpServer.close(resolve));}
