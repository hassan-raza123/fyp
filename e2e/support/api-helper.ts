import type { Page } from '@playwright/test';

/**
 * Same-site API calls.
 *
 * The session cookie is `SameSite=Strict`. Playwright's `page.request` issues
 * requests outside any site context, so a Strict cookie is withheld and every
 * authenticated call comes back 401 — an artifact of the harness, not of the
 * app, which works normally in a real browser.
 *
 * Running `fetch` inside the page gives it the page's own site context, so the
 * cookie travels exactly as it does for a real user.
 */

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  body: T;
}

async function call<T>(
  page: Page,
  method: string,
  path: string,
  payload?: unknown
): Promise<ApiResponse<T>> {
  return page.evaluate(
    async ({ method, path, payload }) => {
      const response = await fetch(path, {
        method,
        credentials: 'include',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });

      let body: unknown = null;
      const text = await response.text();
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      return { status: response.status, ok: response.ok, body };
    },
    { method, path, payload }
  ) as Promise<ApiResponse<T>>;
}

export const apiGet = <T = unknown>(page: Page, path: string) =>
  call<T>(page, 'GET', path);

export const apiPost = <T = unknown>(page: Page, path: string, payload?: unknown) =>
  call<T>(page, 'POST', path, payload ?? {});

export const apiPatch = <T = unknown>(page: Page, path: string, payload?: unknown) =>
  call<T>(page, 'PATCH', path, payload ?? {});

export const apiPut = <T = unknown>(page: Page, path: string, payload?: unknown) =>
  call<T>(page, 'PUT', path, payload ?? {});

export const apiDelete = <T = unknown>(page: Page, path: string) =>
  call<T>(page, 'DELETE', path);
