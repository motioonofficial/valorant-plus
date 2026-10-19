import type { ContentResponse } from '@drill/shared';
import { useEffect, useState } from 'react';
import { api } from '../api';

// Fetched once per app session and shared by every page.
let pending: Promise<ContentResponse> | null = null;

export function useContent(): ContentResponse | null {
  const [content, setContent] = useState<ContentResponse | null>(null);

  useEffect(() => {
    pending ??= api.content().catch((err: unknown) => {
      pending = null; // allow a retry on the next mount
      throw err;
    });
    let cancelled = false;
    pending.then((c) => !cancelled && setContent(c)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}
