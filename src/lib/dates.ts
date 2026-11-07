export const TZ = "Asia/Kolkata";

export function todayStr(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

function parse(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

export function addMonths(s: string, months: number): string {
  const { y, m, d } = parse(s);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  if (dt.getUTCDate() !== d) dt.setUTCDate(0);
  return dt.toISOString().slice(0, 10);
}

export function addDays(s: string, n: number): string {
  const { y, m, d } = parse(s);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** whole days from a to b (b - a) */
export function daysBetween(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

export function daysLeft(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  return daysBetween(todayStr(), expiry);
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const { y, m, d } = parse(s);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function fmtShort(s: string): string {
  const { y, m, d } = parse(s);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function fmtTime(ts: Date | null | undefined): string {
  if (!ts) return "—";
  return ts
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: TZ })
    .toUpperCase();
}

export function nowTimeStr(): string {
  return new Date().toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

/** Build a timestamp from an IST date + time. */
export function istTimestamp(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:30`);
}

export function monthKey(s: string): string {
  return s.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function monthLong(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shiftMonthKey(key: string, delta: number): string {
  return addMonths(`${key}-01`, delta).slice(0, 7);
}
