/** International checks — the form contract the backend implements.
 *
 *  One case, one submit, after payment. No invite. The candidate fills this
 *  form. Each selected check is its own object: question ids repeat across
 *  checks (2, 98, 442, 443, 603), so answers are NOT one flat map.
 *
 *  Value formats, as the contract states them:
 *    date            dd-mm-yyyy
 *    month and year  mm-yyyy
 *    select          the option text, exactly
 *    checkbox        "Yes" when ticked, and the field is omitted when not
 *    yes / no        "Yes" or "No"
 *
 *  Collected once and copied:
 *    applicant name        passport 158 (first + last), global database 319, education 3
 *    date of birth         passport 2, global database 2
 *    father / mother name  global database 4
 *    gender                passport 180
 *
 *  Never written from this form: 444, 1072, 613, 386.
 *
 *  Files are multipart, separate from the JSON. `documents` names the slot;
 *  the bytes travel as the file for that document type id.
 *
 *  Operations `store.ts` performs today, which the API should replace:
 *    registerAccount, signIn, signOut, currentAccount,
 *    startCase, saveForm, submitCase, listCases, getCase
 *  Search fields (university, college, company) confirm a typed name until
 *  `GET /api/intl-cases/search?kind=&q=` returns the master list. The value
 *  sent is still the confirmed name. */
import { countryOptions, type CountryFormat } from "@/lib/intlcase/countries";

export const CHECK_ORDER = ["education", "employment", "globalDatabase", "passport"] as const;
export type CheckKey = (typeof CHECK_ORDER)[number];

/** Operations fills these. They are not on the candidate form. */
export const OMITTED_QUESTION_IDS = [444, 1072, 613, 386] as const;

export const FILE_MAX_BYTES = 2 * 1024 * 1024;
export const FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
export const FILE_TYPES = "PDF, JPG or PNG, up to 2 MB";

export const GENDER_OPTIONS = ["Male", "Female", "Binary", "Other"] as const;

export const HIGHEST_QUALIFICATION = [
  "10th",
  "12th",
  "Graduation/Bachelor's degree",
  "Post Graduation/Master degree",
  "Diploma/Other",
  "Not Applicable",
] as const;

/** The contract says "qualification-type list" and does not enumerate it.
 *  These strings are what this form sends. Replace the array with the master
 *  list and keep the submitted text identical to that list. */
export const QUALIFICATION_TYPE_OPTIONS = [
  "Secondary",
  "Higher secondary",
  "Diploma",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate",
  "Professional certification",
  "Other",
] as const;

export const COURSE_TYPE_OPTIONS = ["Regular/Full Time", "Correspondence", "Online Course"] as const;

export const EMPLOYMENT_TYPE_OPTIONS = ["Permanent/Full-time", "Contractual/Temporary", "Self-Employment"] as const;

export const YES_NO = ["Yes", "No"] as const;

type Control =
  | { kind: "text"; input?: "text" | "email" | "tel"; caps?: boolean }
  | { kind: "date" }
  | { kind: "monthYear" }
  | { kind: "year" }
  | { kind: "select"; options: readonly string[] }
  | { kind: "yesNo" }
  | { kind: "checkbox" }
  | { kind: "search"; directory: "university" | "college" | "company" }
  | { kind: "country"; format: CountryFormat };

export type QuestionDef = {
  id: number;
  name: string;
  required: boolean;
  control: Control;
  hint?: string;
  placeholder?: string;
  /** Not shown. Still sent. Passport 158 is first name plus last name. */
  hidden?: boolean;
  /** Shown read-only. The value comes from the shared candidate step. */
  fromShared?: "name" | "dateOfBirth" | "gender" | "parentName";
  showWhen?: { id: number; equals: "Yes" };
  group?: string;
  /** Sits beside the next half field. */
  half?: boolean;
};

export type DocumentDef = {
  typeId: number;
  name: string;
  /** What the page tells the candidate this scan must show. */
  what: string;
  required: boolean;
};

export type CheckDef = {
  key: CheckKey;
  title: string;
  /** Short rail label. */
  short: string;
  masterId: number;
  code: string;
  questionGroupId: number;
  questionGroupCode: string;
  /** Catalog id suffix: US-EDU, US-EMP, US-GDB, US-PASS. */
  catalogSuffix: "EDU" | "EMP" | "GDB" | "PASS";
  lede: string;
  /** Set when the check takes no file. */
  noFile?: string;
  documents: readonly DocumentDef[];
  questions: readonly QuestionDef[];
};

const text = (input?: "text" | "email" | "tel", caps?: boolean): Control => ({ kind: "text", input, caps });

export const CHECKS: Record<CheckKey, CheckDef> = {
  education: {
    key: "education",
    title: "International education",
    short: "Education",
    masterId: 28,
    code: "INT-EDU",
    questionGroupId: 28,
    questionGroupCode: "HV-International-Education US",
    catalogSuffix: "EDU",
    lede: "One qualification. This is international education, not the domestic education check. The case country is where the check runs.",
    documents: [
      {
        typeId: 60,
        name: "Degree or graduation certificate",
        what: "The certificate for the qualification below. Include every page if it continues.",
        required: true,
      },
    ],
    questions: [
      { id: 3, name: "Applicant name", required: true, fromShared: "name", control: text() },
      { id: 185, name: "University / board", required: true, control: { kind: "search", directory: "university" }, placeholder: "Search or type the university" },
      { id: 214, name: "College / institute", required: true, control: { kind: "search", directory: "college" }, placeholder: "Search or type the college" },
      { id: 98, name: "Country", required: true, control: { kind: "country", format: "name" } },
      { id: 442, name: "State", required: true, control: text(), half: true },
      { id: 443, name: "City", required: true, control: text(), half: true },
      { id: 603, name: "Postal / zip code", required: true, control: text() },
      { id: 246, name: "Highest qualification", required: true, control: { kind: "select", options: HIGHEST_QUALIFICATION } },
      { id: 222, name: "Qualification type", required: true, control: { kind: "select", options: QUALIFICATION_TYPE_OPTIONS } },
      { id: 45, name: "Type of course", required: true, control: { kind: "select", options: COURSE_TYPE_OPTIONS } },
      { id: 38, name: "Enrollment / roll / seat number", required: true, control: text() },
      { id: 365, name: "Course started", required: true, control: { kind: "monthYear" }, half: true },
      { id: 366, name: "Course ended", required: true, control: { kind: "monthYear" }, half: true },
      { id: 31, name: "Year of passing", required: true, control: { kind: "year" } },
      { id: 32, name: "Subjects / major", required: true, control: text() },
    ],
  },
  employment: {
    key: "employment",
    title: "International employment",
    short: "Employment",
    masterId: 30,
    code: "INT-EMP",
    questionGroupId: 66,
    questionGroupCode: "HV-International-Employment US",
    catalogSuffix: "EMP",
    lede: "One employer. This is international employment, not the domestic employment check. The case country is where the check runs.",
    documents: [
      {
        typeId: 114,
        name: "Appointment, experience, or exit letter",
        what: "One letter is enough. It should show the employer, your role, and the dates you worked.",
        required: true,
      },
    ],
    questions: [
      { id: 63, name: "Company name", required: true, control: { kind: "search", directory: "company" }, placeholder: "Search or type the company" },
      { id: 1000, name: "Employment type", required: true, control: { kind: "select", options: EMPLOYMENT_TYPE_OPTIONS } },
      { id: 62, name: "Employee code", required: true, control: text() },
      { id: 260, name: "Last position held", required: true, control: text() },
      { id: 107, name: "Date of joining", required: true, control: { kind: "date" }, half: true },
      { id: 108, name: "Date of relieving", required: true, control: { kind: "date" }, half: true },
      { id: 299, name: "Organisation address line 1", required: true, control: text() },
      {
        id: 149,
        name: "Organisation address line 2",
        required: true,
        control: text(),
        hint: "Building, floor, or area. Repeat line 1 if there is no second line.",
      },
      { id: 98, name: "Country", required: false, control: { kind: "country", format: "name" } },
      { id: 442, name: "State", required: true, control: text(), half: true },
      { id: 443, name: "City", required: true, control: text(), half: true },
      { id: 603, name: "Postal / zip code", required: true, control: text() },
      { id: 385, name: "I do not have the required experience", required: false, control: { kind: "checkbox" } },
      { id: 1292, name: "Share HR contact to speed up verification?", required: true, control: { kind: "yesNo" } },
      { id: 1713, name: "Share supervisor details?", required: false, control: { kind: "yesNo" } },
      { id: 1093, name: "HR name", required: true, control: text(), showWhen: { id: 1292, equals: "Yes" }, group: "HR contact" },
      { id: 1094, name: "HR phone", required: true, control: text("tel"), showWhen: { id: 1292, equals: "Yes" }, group: "HR contact", half: true },
      { id: 1095, name: "HR email", required: true, control: text("email"), showWhen: { id: 1292, equals: "Yes" }, group: "HR contact", half: true },
      { id: 256, name: "Supervisor name", required: true, control: text(), showWhen: { id: 1713, equals: "Yes" }, group: "Supervisor" },
      { id: 257, name: "Supervisor designation", required: true, control: text(), showWhen: { id: 1713, equals: "Yes" }, group: "Supervisor", half: true },
      { id: 258, name: "Supervisor mobile", required: true, control: text("tel"), showWhen: { id: 1713, equals: "Yes" }, group: "Supervisor", half: true },
      { id: 259, name: "Supervisor email", required: true, control: text("email"), showWhen: { id: 1713, equals: "Yes" }, group: "Supervisor" },
    ],
  },
  globalDatabase: {
    key: "globalDatabase",
    title: "Global Database",
    short: "Global Database",
    masterId: 7,
    code: "GDCO",
    questionGroupId: 6,
    questionGroupCode: "HV-GDC",
    catalogSuffix: "GDB",
    lede: "This check runs from your name, date of birth, and a parent's name.",
    noFile: "Nothing to upload.",
    documents: [],
    questions: [
      { id: 319, name: "Applicant name", required: true, fromShared: "name", control: text() },
      { id: 2, name: "Date of birth", required: true, fromShared: "dateOfBirth", control: { kind: "date" } },
      { id: 4, name: "Father's name / mother's name", required: true, fromShared: "parentName", control: text() },
    ],
  },
  passport: {
    key: "passport",
    title: "Passport",
    short: "Passport",
    masterId: 15,
    code: "Pass",
    questionGroupId: 25,
    questionGroupCode: "HV-Pass-Digital",
    catalogSuffix: "PASS",
    lede: "Use the name as it is printed in the passport. It can differ from the name on the previous step. The full name we send is first name plus last name.",
    documents: [
      {
        typeId: 158,
        name: "Passport front",
        what: "The photo page: your photograph, the printed name, and the machine-readable lines at the bottom.",
        required: true,
      },
      {
        typeId: 159,
        name: "Passport back",
        what: "The address page. On an Indian passport this is the last page, which also prints the file number.",
        required: true,
      },
    ],
    questions: [
      { id: 539, name: "First name as on passport", required: true, control: text(), half: true, placeholder: "As printed" },
      { id: 540, name: "Last name as on passport", required: true, control: text(), half: true, placeholder: "As printed" },
      { id: 72, name: "Passport number", required: true, control: text("text", true), placeholder: "e.g. P1234567" },
      { id: 139, name: "File number (Indian passports, last page)", required: false, control: text(), hint: "Leave blank if the passport has no file number." },
      { id: 620, name: "Country code", required: true, control: { kind: "country", format: "nameCode" } },
      { id: 131, name: "Date of issue", required: true, control: { kind: "date" }, half: true },
      { id: 74, name: "Date of expiry", required: true, control: { kind: "date" }, half: true },
      { id: 2, name: "Date of birth", required: true, fromShared: "dateOfBirth", control: { kind: "date" } },
      { id: 180, name: "Gender", required: true, fromShared: "gender", control: { kind: "select", options: GENDER_OPTIONS } },
      { id: 368, name: "MRZ code", required: false, control: text("text", true), hint: "The two lines of letters and numbers at the bottom of the photo page." },
      { id: 158, name: "Full name as printed", required: true, hidden: true, control: text() },
    ],
  },
};

export function isCheckKey(value: string): value is CheckKey {
  return (CHECK_ORDER as readonly string[]).includes(value);
}

export type SharedIdentity = {
  firstName: string;
  lastName: string;
  /** `yyyy-mm-dd` while it is in the form. Sent as `dd-mm-yyyy`. */
  dateOfBirth: string;
  gender: string;
  parentName: string;
};

export type CaseFile = {
  documentTypeId: number;
  fileName: string;
  mimeType: string;
  size: number;
  /** Present when the browser kept the bytes. The JSON payload never includes it. */
  dataUrl?: string;
};

export type CaseForm = {
  shared: SharedIdentity;
  answers: Partial<Record<CheckKey, Record<string, string>>>;
  files: Partial<Record<CheckKey, Record<string, CaseFile>>>;
};

export function emptyShared(): SharedIdentity {
  return { firstName: "", lastName: "", dateOfBirth: "", gender: "", parentName: "" };
}

export function emptyForm(): CaseForm {
  return { shared: emptyShared(), answers: {}, files: {} };
}

export function fullName(shared: SharedIdentity): string {
  return [shared.firstName.trim(), shared.lastName.trim()].filter(Boolean).join(" ");
}

export type CheckPayload = {
  key: CheckKey;
  masterId: number;
  code: string;
  questionGroupId: number;
  questionGroupCode: string;
  /** Question id → value. Only answers this check is sending. */
  answers: Record<string, string>;
  documents: Array<{ documentTypeId: number; fileName: string; mimeType: string; size: number }>;
};

export type IntlCasePayload = {
  caseId: string;
  countryCode: string;
  currency: string;
  amount: number;
  rush: boolean;
  delivery: "each" | "together";
  /** The contract: do not send an invite. */
  invite: false;
  checks: CheckPayload[];
};

export type FieldErrors = Record<string, string>;

const NAME_VALUES = new Set(countryOptions("name"));
const CODE_VALUES = new Set(countryOptions("nameCode"));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function toWireDate(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function toWireMonth(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return `${m[2]}-${m[1]}`;
}

export function yearOptions(now = new Date()): string[] {
  const max = now.getFullYear();
  const out: string[] = [];
  for (let y = max; y >= 1950; y--) out.push(String(y));
  return out;
}

export function isShown(q: QuestionDef, answers: Record<string, string>): boolean {
  if (q.hidden) return false;
  if (!q.showWhen) return true;
  return answers[String(q.showWhen.id)] === q.showWhen.equals;
}

function rawAnswers(key: CheckKey, form: CaseForm): Record<string, string> {
  const raw: Record<string, string> = { ...(form.answers[key] ?? {}) };
  const name = fullName(form.shared);
  if (key === "education") raw["3"] = name;
  if (key === "globalDatabase") {
    raw["319"] = name;
    raw["2"] = form.shared.dateOfBirth;
    raw["4"] = form.shared.parentName.trim();
  }
  if (key === "passport") {
    raw["2"] = form.shared.dateOfBirth;
    raw["180"] = form.shared.gender;
    raw["539"] = (raw["539"] === undefined ? form.shared.firstName : raw["539"]).trim();
    raw["540"] = (raw["540"] === undefined ? form.shared.lastName : raw["540"]).trim();
    raw["158"] = [raw["539"], raw["540"]].filter(Boolean).join(" ");
  }
  return raw;
}

function wireOf(q: QuestionDef, raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  switch (q.control.kind) {
    case "date":
      return toWireDate(v);
    case "monthYear":
      return toWireMonth(v);
    case "year": {
      const max = new Date().getFullYear();
      const y = Number(v);
      return /^\d{4}$/.test(v) && y >= 1950 && y <= max ? v : null;
    }
    case "checkbox":
      return v === "Yes" ? "Yes" : null;
    case "yesNo":
      return v === "Yes" || v === "No" ? v : null;
    case "select":
      return q.control.options.includes(v) ? v : null;
    case "country":
      return (q.control.format === "nameCode" ? CODE_VALUES : NAME_VALUES).has(v) ? v : null;
    case "text":
      if (q.control.input === "email" && !EMAIL.test(v)) return null;
      return v;
    case "search":
      return v;
    default:
      return v;
  }
}

function missingMessage(q: QuestionDef, raw: string): string {
  const v = raw.trim();
  if (!v) {
    if (q.control.kind === "search") return `Enter ${q.name}.`;
    if (q.control.kind === "select" || q.control.kind === "yesNo" || q.control.kind === "country" || q.control.kind === "year") {
      return `Choose ${q.name}.`;
    }
    return `Enter ${q.name}.`;
  }
  if (q.control.kind === "date") return `Enter a real date for ${q.name}.`;
  if (q.control.kind === "monthYear") return `Enter a month and year for ${q.name}.`;
  if (q.control.kind === "text" && q.control.input === "email") return `Enter a valid email for ${q.name}.`;
  return `Choose ${q.name}.`;
}

/** Which shared answers the selected checks actually copy. */
export function sharedNeeds(keys: readonly CheckKey[]) {
  return {
    name: keys.some((key) => key === "passport" || key === "globalDatabase" || key === "education"),
    dateOfBirth: keys.some((key) => key === "passport" || key === "globalDatabase"),
    gender: keys.includes("passport"),
    parentName: keys.includes("globalDatabase"),
  };
}

export function needsYou(keys: readonly CheckKey[]): boolean {
  const needs = sharedNeeds(keys);
  return needs.name || needs.dateOfBirth || needs.gender || needs.parentName;
}

export function validateShared(form: CaseForm, keys: readonly CheckKey[]): FieldErrors {
  const errors: FieldErrors = {};
  const needs = sharedNeeds(keys);
  const s = form.shared;
  if (needs.name && !s.firstName.trim()) errors["shared.firstName"] = "Enter your first name.";
  if (needs.name && !s.lastName.trim()) errors["shared.lastName"] = "Enter your last name.";
  if (needs.dateOfBirth && !toWireDate(s.dateOfBirth)) errors["shared.dateOfBirth"] = "Enter your date of birth.";
  if (needs.gender && !GENDER_OPTIONS.includes(s.gender as (typeof GENDER_OPTIONS)[number])) errors["shared.gender"] = "Choose a gender.";
  if (needs.parentName && !s.parentName.trim()) errors["shared.parentName"] = "Enter your father's or mother's name.";
  return errors;
}

function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function validateCheck(key: CheckKey, form: CaseForm): FieldErrors {
  const check = CHECKS[key];
  const raw = rawAnswers(key, form);
  const errors: FieldErrors = {};
  for (const q of check.questions) {
    if (q.hidden) continue;
    if (!isShown(q, raw)) continue;
    const value = wireOf(q, raw[String(q.id)] ?? "");
    if (q.required && !value) errors[`${key}.q.${q.id}`] = missingMessage(q, raw[String(q.id)] ?? "");
    else if ((raw[String(q.id)] ?? "").trim() && !value && q.control.kind !== "checkbox") {
      errors[`${key}.q.${q.id}`] = missingMessage(q, raw[String(q.id)] ?? "");
    }
  }
  if (key === "passport" && !errors["passport.q.131"] && !errors["passport.q.74"]) {
    const issue = raw["131"] ?? "";
    const expiry = raw["74"] ?? "";
    if (issue && expiry && compareIso(expiry, issue) <= 0) {
      errors["passport.q.74"] = "Expiry must be after the date of issue.";
    }
  }
  if (key === "employment" && !errors["employment.q.107"] && !errors["employment.q.108"]) {
    const join = raw["107"] ?? "";
    const leave = raw["108"] ?? "";
    if (join && leave && compareIso(leave, join) < 0) {
      errors["employment.q.108"] = "Relieving date must be on or after the joining date.";
    }
  }
  if (key === "education" && !errors["education.q.365"] && !errors["education.q.366"]) {
    const start = raw["365"] ?? "";
    const end = raw["366"] ?? "";
    if (start && end && compareIso(end, start) < 0) {
      errors["education.q.366"] = "Course end must be the same month as the start, or later.";
    }
  }
  const files = form.files[key] ?? {};
  for (const doc of check.documents) {
    const file = files[String(doc.typeId)];
    if (doc.required && !file) errors[`${key}.doc.${doc.typeId}`] = `Upload ${doc.name}.`;
    else if (file && file.size > FILE_MAX_BYTES) errors[`${key}.doc.${doc.typeId}`] = `${doc.name} is over 2 MB.`;
  }
  return errors;
}

export function compile(input: {
  caseId: string;
  countryCode: string;
  currency: string;
  amount: number;
  rush: boolean;
  delivery: "each" | "together";
  checkKeys: readonly CheckKey[];
  form: CaseForm;
}): { payload: IntlCasePayload; errors: FieldErrors } {
  const errors: FieldErrors = { ...validateShared(input.form, input.checkKeys) };
  const checks: CheckPayload[] = [];
  for (const key of CHECK_ORDER) {
    if (!input.checkKeys.includes(key)) continue;
    Object.assign(errors, validateCheck(key, input.form));
    const def = CHECKS[key];
    const raw = rawAnswers(key, input.form);
    const answers: Record<string, string> = {};
    for (const q of def.questions) {
      if (q.showWhen && raw[String(q.showWhen.id)] !== q.showWhen.equals) continue;
      const value = wireOf(q, raw[String(q.id)] ?? "");
      if (value) answers[String(q.id)] = value;
    }
    const files = input.form.files[key] ?? {};
    checks.push({
      key,
      masterId: def.masterId,
      code: def.code,
      questionGroupId: def.questionGroupId,
      questionGroupCode: def.questionGroupCode,
      answers,
      documents: def.documents.flatMap((doc) => {
        const file = files[String(doc.typeId)];
        return file ? [{ documentTypeId: doc.typeId, fileName: file.fileName, mimeType: file.mimeType, size: file.size }] : [];
      }),
    });
  }
  return {
    errors,
    payload: {
      caseId: input.caseId,
      countryCode: input.countryCode,
      currency: input.currency,
      amount: input.amount,
      rush: input.rush,
      delivery: input.delivery,
      invite: false,
      checks,
    },
  };
}

/** Passport names default to the shared name the first time that step opens. */
export function withPassportPrefill(form: CaseForm): CaseForm {
  const prev = form.answers.passport ?? {};
  const passport = { ...prev };
  if (!passport["539"]?.trim() && form.shared.firstName.trim()) passport["539"] = form.shared.firstName.trim();
  if (!passport["540"]?.trim() && form.shared.lastName.trim()) passport["540"] = form.shared.lastName.trim();
  return { ...form, answers: { ...form.answers, passport } };
}

export function sharedDisplay(form: CaseForm, which: NonNullable<QuestionDef["fromShared"]>): string {
  if (which === "name") return fullName(form.shared);
  if (which === "dateOfBirth") return toWireDate(form.shared.dateOfBirth) ?? "";
  if (which === "gender") return form.shared.gender;
  return form.shared.parentName.trim();
}
