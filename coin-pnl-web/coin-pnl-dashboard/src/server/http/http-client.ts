export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type HttpRequestOptions = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs: number;
};

export class HttpError extends Error {
  readonly status?: number;
  readonly url: string;
  readonly cause?: unknown;

  constructor(message: string, opts: { url: string; status?: number; cause?: unknown }) {
    super(message);
    this.name = "HttpError";
    this.url = opts.url;
    this.status = opts.status;
    this.cause = opts.cause;
  }
}

function buildUrl(url: string, query?: HttpRequestOptions["query"]) {
  if (!query) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

export async function httpJson<T>(opts: HttpRequestOptions): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeoutMs);
  const url = buildUrl(opts.url, opts.query);
  const safeUrl = (() => {
    try {
      const u = new URL(url);
      u.search = "";
      return u.toString();
    } catch {
      return opts.url;
    }
  })();

  try {
    const res = await fetch(url, {
      method: opts.method,
      headers: {
        "content-type": "application/json",
        ...(opts.headers ?? {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status} for ${safeUrl}`, {
        url: safeUrl,
        status: res.status,
        cause: text,
      });
    }

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      throw new HttpError(`Invalid JSON from ${safeUrl}`, { url: safeUrl, status: res.status, cause: e });
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(`Request failed for ${safeUrl}`, { url: safeUrl, cause: e });
  } finally {
    clearTimeout(id);
  }
}

