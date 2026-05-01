import "dotenv/config";

const BASE_URL = "https://a.klaviyo.com/api";

function apiKey(): string {
  const key = process.env.KLAVIYO_API_KEY;
  if (!key || !key.startsWith("pk_")) {
    throw new Error("KLAVIYO_API_KEY missing or invalid (must start with pk_)");
  }
  return key;
}

function revision(): string {
  return process.env.KLAVIYO_API_REVISION ?? "2024-10-15";
}

export type KlaviyoRequest = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

export async function klaviyo<T = unknown>(req: KlaviyoRequest): Promise<T> {
  const url = new URL(BASE_URL + req.path);
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey()}`,
      revision: revision(),
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const detail = typeof parsed === "object" ? JSON.stringify(parsed) : String(parsed);
    throw new Error(`Klaviyo ${req.method} ${req.path} failed: ${res.status} ${res.statusText} — ${detail}`);
  }

  return parsed as T;
}
