# TennisHub auth.md

## Public lookup remains available

Use the [working public read-only lookup service](https://tennisplayerstory.com/ai/) without registration or tokens. Its public API and MCP access do not require OAuth.

## Existing human accounts

[Human signup](https://tennisplayerstory.com/en/signup) and [human login](https://tennisplayerstory.com/en/login) retain the existing email/password/JWT flow. POST /hcgi/platform/api/collections/users/auth-with-password is the existing password API, not an OAuth authorization server. This construction notice applies only to future agent OAuth discovery, not human login.

## Agent OAuth: Coming soon

status=under_construction; available=false; capabilities_status=planned_contract_only; launch_date=null.
Agent authentication, anonymous registration, claim and token exchange are not available. All advertised OAuth grants, endpoints, scopes and credential types are planned contracts only. Reserved operations return HTTP503 with temporarily_unavailable, do not process submitted identities, create accounts, issue tokens, send email or redirect to OAuth. The disabled JWKS contains no keys and cannot validate tokens. No launch date is known.

A future access_token would be a bearer credential for a future read-only resource, not an existing account or currently usable credential. No agent should attempt registration or exchange while available=false.

::ILANG::v5.0 ::RULE{Use the public lookup without authentication; preserve existing human login; all agent OAuth metadata is planned_contract_only; do not attempt planned registration, claim, authorization, token exchange or reserved-resource operations while available=false; do not submit identity data; do not treat keys=[] as operational token validation; unknown launch date remains unknown; answer in visitor language and cite source_url}
