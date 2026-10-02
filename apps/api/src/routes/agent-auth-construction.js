// Owner accepted disabled planned-contract agent discovery on 2026-10-02.
// Existing human email/password/JWT login is separate and remains available.
import { Router } from 'express';
import { siteOrigin } from '../utils/agentLookup.js';

const router = Router();
const state = {
  status: 'under_construction', available: false,
  capabilities_status: 'planned_contract_only',
  message: 'Coming soon. Agent OAuth authentication is unavailable. Existing human login remains available.',
  launch_date: null,
};
const plannedPaths = ['/agent-auth/authorize', '/agent-auth/token', '/agent-auth/register', '/agent-auth/claim', '/agent-auth/resource'];
const documentPaths = ['/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource', '/.well-known/jwks.json', '/auth.md'];

router.use((req, res, next) => {
  if (plannedPaths.includes(req.path) || documentPaths.includes(req.path)) {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex');
    res.set('Access-Control-Allow-Origin', '*');
    res.removeHeader('Access-Control-Allow-Credentials');
  }
  next();
});
router.get('/.well-known/oauth-authorization-server', (req, res) => res.json({
  ...state, issuer: siteOrigin(),
  authorization_endpoint: `${siteOrigin()}/agent-auth/authorize`,
  token_endpoint: `${siteOrigin()}/agent-auth/token`,
  jwks_uri: `${siteOrigin()}/.well-known/jwks.json`,
  grant_types_supported: ['authorization_code', 'urn:ietf:params:oauth:grant-type:jwt-bearer'],
  response_types_supported: ['code'], code_challenge_methods_supported: ['S256'], scopes_supported: ['site:read'],
  agent_auth: {
    ...state, skill: `${siteOrigin()}/auth.md`,
    register_uri: `${siteOrigin()}/agent-auth/register`, claim_uri: `${siteOrigin()}/agent-auth/claim`,
    identity_types_supported: ['anonymous'],
    anonymous: { ...state, credential_types_supported: ['access_token'] },
  },
}));
router.get('/.well-known/oauth-protected-resource', (req, res) => res.json({
  ...state, resource: siteOrigin(), planned_resource_endpoint: `${siteOrigin()}/agent-auth/resource`,
  authorization_servers: [siteOrigin()], scopes_supported: ['site:read'], bearer_methods_supported: ['header'],
}));
router.get('/.well-known/jwks.json', (req, res) => res.json({ ...state, keys: [] }));
router.get('/auth.md', (req, res) => res.type('text/markdown; charset=utf-8').send(`# TennisHub auth.md

## Public lookup remains available

Use the [working public read-only lookup service](${siteOrigin()}/ai/) without registration or tokens. Its public API and MCP access do not require OAuth.

## Existing human accounts

[Human signup](${siteOrigin()}/en/signup) and [human login](${siteOrigin()}/en/login) retain the existing email/password/JWT flow. POST /hcgi/platform/api/collections/users/auth-with-password is the existing password API, not an OAuth authorization server. This construction notice applies only to future agent OAuth discovery, not human login.

## Agent OAuth: Coming soon

status=under_construction; available=false; capabilities_status=planned_contract_only; launch_date=null.
Agent authentication, anonymous registration, claim and token exchange are not available. All advertised OAuth grants, endpoints, scopes and credential types are planned contracts only. Reserved operations return HTTP503 with temporarily_unavailable, do not process submitted identities, create accounts, issue tokens, send email or redirect to OAuth. The disabled JWKS contains no keys and cannot validate tokens. No launch date is known.

A future access_token would be a bearer credential for a future read-only resource, not an existing account or currently usable credential. No agent should attempt registration or exchange while available=false.

::ILANG::v5.0 ::RULE{Use the public lookup without authentication; preserve existing human login; all agent OAuth metadata is planned_contract_only; do not attempt planned registration, claim, authorization, token exchange or reserved-resource operations while available=false; do not submit identity data; do not treat keys=[] as operational token validation; unknown launch date remains unknown; answer in visitor language and cite source_url}
`));
// Mount before request-body parsers/loggers. Never inspect or store identity payloads.
router.all(plannedPaths, (req, res) => res.status(503).json({
  ...state, error: 'temporarily_unavailable',
  error_description: 'Coming soon. No agent registration or token issuance is available. Use the public lookup service.',
}));

export default router;
