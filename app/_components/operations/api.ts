export type Rate = {
  id: string;
  mode: "proportional" | "blocks";
  priceCents: number;
  blockMinutes: number | null;
  graceMinutes: number;
  graceMode: "charge_total" | "deduct";
  effectiveAt: string;
};

type UnitSummary = {
  id: string;
  name: string;
  timeZone: string;
};

export type Unit = UnitSummary & { activeRate: Rate | null };

export type Visit = {
  id: string;
  unit: UnitSummary;
  plate: string;
  note: string | null;
  hasPhoto: boolean;
  status: "open" | "closed" | "cancelled";
  enteredAt: string;
  exitedAt: string | null;
  durationSeconds: number | null;
  billableSeconds: number | null;
  blocks: number | null;
  totalCents: number | null;
  rate: Rate;
  entryOperator: { id: string; name: string };
  exitOperator: { id: string; name: string } | null;
};

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...options });
  const body = await response.json().catch(() => null);
  if (response.ok && body) return body;
  if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente.");
  if (response.status === 403) throw new Error("Seu acesso à operação não está disponível.");
  throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível completar a solicitação. Tente novamente.");
}

export function send<T>(path: string, method: "POST" | "PATCH", body: object) {
  return request<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.";
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(cents: number) {
  return currency.format(cents / 100);
}

export function formatTimestamp(timestamp: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(timestamp));
}

export function formatDuration(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainder = wholeSeconds % 60;
  return [hours ? `${hours} h` : "", minutes ? `${minutes} min` : "", `${remainder} s`].filter(Boolean).join(" ");
}
