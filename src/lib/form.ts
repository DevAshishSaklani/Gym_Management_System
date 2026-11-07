import { redirect } from "next/navigation";

export function s(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export function n(fd: FormData, key: string): number | null {
  const v = s(fd, key);
  if (v === "") return null;
  const num = Number(v);
  return Number.isFinite(num) ? num : null;
}

export function int(fd: FormData, key: string): number | null {
  const v = n(fd, key);
  return v === null ? null : Math.trunc(v);
}

/** Redirect to a path with a flash message in the query string. */
export function flash(path: string, kind: "ok" | "error", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

/** Only allow internal paths for return redirects. */
export function safePath(path: string, fallback: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
