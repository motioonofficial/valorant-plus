// Riot Sign On (OAuth 2.0 authorization code flow).
import type { Config } from '../config.js';
import type { RiotAccount } from './types.js';

const AUTH_BASE = 'https://auth.riotgames.com';

export function redirectUri(config: Config): string {
  return `${config.PUBLIC_URL}/auth/rso/callback`;
}

export function authorizeUrl(config: Config, state: string): string {
  const params = new URLSearchParams({
    client_id: config.RSO_CLIENT_ID,
    redirect_uri: redirectUri(config),
    response_type: 'code',
    scope: 'openid',
    state,
  });
  return `${AUTH_BASE}/authorize?${params}`;
}

export async function exchangeCode(config: Config, code: string): Promise<{ accessToken: string }> {
  const basic = Buffer.from(`${config.RSO_CLIENT_ID}:${config.RSO_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(config),
    }),
  });
  if (!res.ok) throw new Error(`RSO token exchange failed: ${res.status}`);
  const body = (await res.json()) as { access_token: string };
  return { accessToken: body.access_token };
}

export async function fetchAccount(accessToken: string): Promise<RiotAccount> {
  const res = await fetch('https://europe.api.riotgames.com/riot/account/v1/accounts/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`RSO account lookup failed: ${res.status}`);
  return (await res.json()) as RiotAccount;
}
