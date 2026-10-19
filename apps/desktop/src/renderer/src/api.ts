import type { ContentResponse, CreateLfgPostBody, LfgKind, LfgPostDto, MeResponse, RecentMatch, StatsSummary } from '@drill/shared';

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(`${status} ${code}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const [base, token] = await Promise.all([window.drill.apiUrl(), window.drill.getToken()]);
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? 'request_failed');
  }
  return (await res.json()) as T;
}

export const api = {
  me: () => request<MeResponse>('/me'),
  stats: () => request<StatsSummary>('/me/stats'),
  matches: () => request<RecentMatch[]>('/me/matches'),
  sync: () => request<{ newMatches: number; xpAwarded: number }>('/me/sync', { method: 'POST' }),
  content: () => request<ContentResponse>('/content'),
  lfg: (kind: LfgKind) => request<LfgPostDto[]>(`/lfg?kind=${kind}`),
  createLfg: (body: CreateLfgPostBody) => request<{ id: string }>('/lfg', { method: 'POST', body: JSON.stringify(body) }),
  reportLfg: (id: string, reason: string) =>
    request<{ ok: true }>(`/lfg/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) }),
};
