// Proposed destination: apps/api/src/routes/agent-mcp.js.
// Activate only after approval to add @modelcontextprotocol/sdk@^1.31.0.
import { Router } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { lookupSchema, lookupDescription, lookupPublicData, parseLookupInput, siteOrigin } from '../utils/agentLookup.js';

const router = Router();
const serverInfo = { name: 'tennishub-public-lookup', version: '1.0.0' };

router.get('/.well-known/mcp/server-card.json', (req, res) => res.json({
  serverInfo,
  description: 'Public, read-only TennisHub page and approved article lookup.',
  transport: { type: 'streamable-http', endpoint: `${siteOrigin()}/mcp` },
  capabilities: { tools: {} }, authentication: { required: false },
}));

router.post('/mcp', async (req, res, next) => {
  // Only same-origin browsers; non-browser MCP clients can omit Origin.
  if (req.headers.origin && req.headers.origin !== siteOrigin()) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  res.set('Cache-Control', 'no-store');
  const server = new Server(serverInfo, { capabilities: { tools: {} } });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{ name: 'tennishub_lookup', description: lookupDescription, inputSchema: lookupSchema, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } }],
  }));
  server.setRequestHandler(CallToolRequestSchema, async request => {
    if (request.params.name !== 'tennishub_lookup') return { isError: true, content: [{ type: 'text', text: 'Unknown tool.' }] };
    try { parseLookupInput(request.params.arguments || {}); }
    catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] }; }
    try {
      const result = await lookupPublicData(request.params.arguments || {});
      return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result };
    } catch {
      return { isError: true, content: [{ type: 'text', text: 'Public content storage is unavailable. Try again later.' }] };
    }
  });
  res.on('close', () => { server.close().catch(next); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    await server.close();
    next(error);
  }
});
router.all('/mcp', (req, res) => res.set('Allow', 'POST').status(405).json({ error: 'Use POST for stateless Streamable HTTP.' }));

export default router;
