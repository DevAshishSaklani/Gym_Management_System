const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(n: number | null | undefined): string {
  return inr.format(n ?? 0);
}

export const memberCode = (id: number) => `GYM-${String(id).padStart(4, "0")}`;
export const trainerCode = (id: number) => `TRN-${String(id).padStart(3, "0")}`;
export const paymentCode = (id: number) => `PAY-${String(id).padStart(5, "0")}`;

export function methodLabel(m: string): string {
  switch (m) {
    case "upi":
      return "UPI";
    case "bank_transfer":
      return "Bank Transfer";
    case "card":
      return "Card";
    default:
      return "Cash";
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function durationLabel(months: number): string {
  return months === 1 ? "1 Month" : `${months} Months`;
}
