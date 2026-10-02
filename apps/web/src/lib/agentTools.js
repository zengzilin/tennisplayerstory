import { lookupSchema, lookupDescription } from '../../../../shared/agent-lookup-contract.mjs';

export async function registerAgentTools() {
  const modelContext = document.modelContext || navigator.modelContext;
  if (!modelContext?.registerTool) return;
  const lifecycle = new AbortController();
  await modelContext.registerTool({
    name: 'tennishub_lookup',
    description: lookupDescription,
    inputSchema: lookupSchema,
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    async execute(input) {
      const params = new URLSearchParams(input);
      const response = await fetch(`/api/agent/lookup?${params}`, { credentials: 'omit' });
      const result = await response.json();
      if (!response.ok && response.status !== 404) throw new Error(result.error || 'Public lookup failed.');
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    },
  }, { signal: lifecycle.signal });
  // Abort registrations on disposal while allowing back/forward cache restores.
  window.addEventListener('pagehide', event => { if (!event.persisted) lifecycle.abort(); }, { once: true });
  if (import.meta.hot) import.meta.hot.dispose(() => lifecycle.abort());
}
