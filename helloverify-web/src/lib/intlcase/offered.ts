/** The four checks every catalog country offers, in the order the form walks. */
import { localise } from "@/lib/i18n/href";
import { formatMoney, INTL_CHECKS, INTL_COUNTRIES, resolveIntlCode, type IntlCheck } from "@/lib/international/catalog";
import { quoteOf, type Delivery, type Quote } from "@/lib/international/order";
import { CHECK_ORDER, CHECKS, isCheckKey, type CheckKey } from "@/lib/intlcase/contract";

export type OfferedCheck = IntlCheck & { key: CheckKey };

const SUFFIX: Record<string, CheckKey> = {
  EDU: "education",
  EMP: "employment",
  GDB: "globalDatabase",
  PASS: "passport",
};

/** Education, employment, global database, passport — and nothing else. */
export function offeredChecks(code: string): OfferedCheck[] {
  const byKey = new Map<CheckKey, IntlCheck>();
  for (const row of INTL_CHECKS[code] ?? []) {
    const key = SUFFIX[row.id.split("-").pop() ?? ""];
    if (key && !byKey.has(key)) byKey.set(key, row);
  }
  return CHECK_ORDER.flatMap((key) => {
    const row = byKey.get(key);
    return row ? [{ ...row, key }] : [];
  });
}

export type PricedSelection = {
  code: string;
  countryName: string;
  keys: CheckKey[];
  rows: OfferedCheck[];
  quote: Quote;
  amountLabel: string;
  rush: boolean;
  delivery: Delivery;
};

export function priceSelection(
  code: string,
  keys: readonly CheckKey[],
  rush: boolean,
  delivery: Delivery,
): PricedSelection | null {
  const offered = offeredChecks(code);
  const rows = CHECK_ORDER.flatMap((key) => {
    if (!keys.includes(key)) return [];
    const row = offered.find((r) => r.key === key);
    return row ? [row] : [];
  });
  if (!rows.length) return null;
  const quote = quoteOf(code, rows, rush, delivery);
  const countryName = INTL_COUNTRIES.find((c) => c.code === code)?.name ?? code;
  return {
    code,
    countryName,
    keys: rows.map((r) => r.key),
    rows,
    quote,
    amountLabel: formatMoney(quote.total, quote.cur),
    rush,
    delivery,
  };
}

/** `?country=&checks=education,passport&rush=1&delivery=together` */
export function parseSelection(countryHint: string, checksParam: string, rush: boolean, delivery: Delivery): PricedSelection | null {
  const code = resolveIntlCode(countryHint);
  if (!code) return null;
  const wanted = checksParam.split(",").map((s) => s.trim()).filter(isCheckKey);
  return priceSelection(code, wanted, rush, delivery);
}

export function gatewayHref(
  locale: string,
  code: string,
  keys: readonly CheckKey[],
  rush: boolean,
  delivery: Delivery,
): string {
  const ordered = CHECK_ORDER.filter((key) => keys.includes(key));
  const q = new URLSearchParams({ country: code, checks: ordered.join(",") });
  if (rush) q.set("rush", "1");
  if (delivery === "together") q.set("delivery", "together");
  return localise(`/international/request?${q.toString()}`, locale);
}

export function checkTitle(key: CheckKey): string {
  return CHECKS[key].title;
}
