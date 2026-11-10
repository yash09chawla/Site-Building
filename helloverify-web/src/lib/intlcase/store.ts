"use client";

/** Browser stand-in for the international-cases API.
 *
 *  The gateway calls these functions and no URL. When the API exists, keep
 *  the function names and the payload from `compile` in `contract.ts`, and
 *  replace this module. Accounts and cases stay in this browser until then.
 *  Passwords are compared in plain text here on purpose: there is no server
 *  yet, and the UI says so. */
import { useSyncExternalStore } from "react";

import {
  compile,
  emptyForm,
  type CaseForm,
  type CheckKey,
  type IntlCasePayload,
} from "@/lib/intlcase/contract";
import type { CheckTrackUpdate } from "@/lib/intlcase/track";

const KEY = "hv-intl-cases-v1";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

const serverSnapshot = () => "";

export type PublicAccount = { id: string; name: string; email: string };

type Account = PublicAccount & { password: string };

export type IntlCase = {
  id: string;
  accountId: string;
  createdAt: string;
  paidAt: string;
  submittedAt: string | null;
  status: "form" | "submitted";
  countryCode: string;
  countryName: string;
  currency: string;
  amount: number;
  amountLabel: string;
  rush: boolean;
  delivery: "each" | "together";
  checkKeys: CheckKey[];
  form: CaseForm;
  payload: IntlCasePayload | null;
  /** Per-check stage once the API is moving the case. Absent until then. */
  tracks?: Partial<Record<CheckKey, CheckTrackUpdate>>;
};

type Db = { accounts: Account[]; accountId: string | null; cases: IntlCase[] };

export type StoreFailure = { ok: false; message: string };

function emptyDb(): Db {
  return { accounts: [], accountId: null, cases: [] };
}

/** Always available on Sign in. Created in this browser; not a live account. */
export const DEMO_EMAIL = "demo@helloverify.com";
export const DEMO_PASSWORD = "demo1234";

const DEMO: Account = {
  id: "AC-DEMO",
  name: "Demo User",
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
};

function ensureDemo(db: Db): Db {
  if (!db.accounts.some((account) => account.email === DEMO.email)) db.accounts.push({ ...DEMO });
  return db;
}

function read(): Db {
  if (typeof localStorage === "undefined") return ensureDemo(emptyDb());
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return ensureDemo(emptyDb());
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.cases)) return ensureDemo(emptyDb());
    return ensureDemo(parsed);
  } catch {
    return ensureDemo(emptyDb());
  }
}

function write(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    const slim = structuredClone(db);
    for (const item of slim.cases) {
      for (const bucket of Object.values(item.form.files)) {
        if (!bucket) continue;
        for (const file of Object.values(bucket)) {
          if (file) delete file.dataUrl;
        }
      }
    }
    localStorage.setItem(KEY, JSON.stringify(slim));
  }
  emit();
}

function pub(account: Account): PublicAccount {
  return { id: account.id, name: account.name, email: account.email };
}

function id(prefix: string): string {
  const n = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `${prefix}${n}`;
}

const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function currentAccount(): PublicAccount | null {
  const db = read();
  const account = db.accounts.find((a) => a.id === db.accountId);
  return account ? pub(account) : null;
}

export function registerAccount(input: { name: string; email: string; password: string }): { ok: true; account: PublicAccount } | StoreFailure {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, message: "Enter your name." };
  if (!emailOk(email)) return { ok: false, message: "Enter a valid email address." };
  if (input.password.length < 8) return { ok: false, message: "Use at least 8 characters." };
  const db = read();
  if (db.accounts.some((a) => a.email === email)) return { ok: false, message: "An account with this email already exists. Sign in instead." };
  const account: Account = { id: id("AC-"), name, email, password: input.password };
  db.accounts.push(account);
  db.accountId = account.id;
  write(db);
  return { ok: true, account: pub(account) };
}

export function signIn(input: { email: string; password: string }): { ok: true; account: PublicAccount } | StoreFailure {
  const email = input.email.trim().toLowerCase();
  const db = read();
  const account = db.accounts.find((a) => a.email === email && a.password === input.password);
  if (!account) return { ok: false, message: "That email and password do not match." };
  db.accountId = account.id;
  write(db);
  return { ok: true, account: pub(account) };
}

export function signOut() {
  const db = read();
  db.accountId = null;
  write(db);
}

export function listCases(accountId: string): IntlCase[] {
  return read()
    .cases.filter((c) => c.accountId === accountId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getCase(caseId: string): IntlCase | null {
  return read().cases.find((c) => c.id === caseId) ?? null;
}

export function startCase(input: {
  accountId: string;
  countryCode: string;
  countryName: string;
  currency: string;
  amount: number;
  amountLabel: string;
  rush: boolean;
  delivery: "each" | "together";
  checkKeys: CheckKey[];
}): IntlCase {
  const db = read();
  const now = new Date().toISOString();
  const item: IntlCase = {
    id: id("IX-"),
    accountId: input.accountId,
    createdAt: now,
    paidAt: now,
    submittedAt: null,
    status: "form",
    countryCode: input.countryCode,
    countryName: input.countryName,
    currency: input.currency,
    amount: input.amount,
    amountLabel: input.amountLabel,
    rush: input.rush,
    delivery: input.delivery,
    checkKeys: [...input.checkKeys],
    form: emptyForm(),
    payload: null,
  };
  db.cases.push(item);
  write(db);
  return item;
}

export function saveForm(caseId: string, form: CaseForm): IntlCase | null {
  const db = read();
  const item = db.cases.find((c) => c.id === caseId);
  if (!item || item.status !== "form") return item ?? null;
  item.form = form;
  write(db);
  return item;
}

export function submitCase(caseId: string, form: CaseForm): { ok: true; case: IntlCase } | { ok: false; errors: Record<string, string> } | StoreFailure {
  const db = read();
  const item = db.cases.find((c) => c.id === caseId);
  if (!item) return { ok: false, message: "This case is not on this account." };
  if (item.status === "submitted" && item.payload) return { ok: true, case: item };
  const { payload, errors } = compile({
    caseId: item.id,
    countryCode: item.countryCode,
    currency: item.currency,
    amount: item.amount,
    rush: item.rush,
    delivery: item.delivery,
    checkKeys: item.checkKeys,
    form,
  });
  if (Object.keys(errors).length) return { ok: false, errors };
  item.form = form;
  item.payload = payload;
  item.status = "submitted";
  item.submittedAt = new Date().toISOString();
  write(db);
  return { ok: true, case: item };
}

function parseDb(raw: string): Db {
  if (!raw) return emptyDb();
  try {
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.cases)) return emptyDb();
    return parsed;
  } catch {
    return emptyDb();
  }
}

function useIntlDb(): Db {
  return parseDb(useSyncExternalStore(subscribe, snapshot, serverSnapshot));
}

export function useIntlAccount(): PublicAccount | null {
  const db = useIntlDb();
  const account = db.accounts.find((item) => item.id === db.accountId);
  return account ? pub(account) : null;
}

export function useOwnedCase(caseId: string): IntlCase | null {
  const db = useIntlDb();
  if (!caseId || !db.accountId) return null;
  return db.cases.find((item) => item.id === caseId && item.accountId === db.accountId) ?? null;
}

export function useIntlCases(): IntlCase[] {
  const db = useIntlDb();
  if (!db.accountId) return [];
  return db.cases.filter((item) => item.accountId === db.accountId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
