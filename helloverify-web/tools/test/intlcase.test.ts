/** The international-case form contract: four checks on every country, and
 *  one submit payload whose question ids and value formats match the
 *  candidate-form mapping. */
import { check } from "./harness.ts";

import { countryLabel, ISO_COUNTRIES } from "../../src/lib/intlcase/countries.ts";
import {
  CHECK_ORDER,
  CHECKS,
  compile,
  emptyForm,
  OMITTED_QUESTION_IDS,
  validateShared,
  type CaseForm,
  type CheckKey,
} from "../../src/lib/intlcase/contract.ts";
import { offeredChecks } from "../../src/lib/intlcase/offered.ts";
import { caseTrackLabel, trackChecks } from "../../src/lib/intlcase/track.ts";
import { INTL_COUNTRIES } from "../../src/lib/international/catalog.ts";

console.log("0. every catalog country offers the same four checks");
const short = INTL_COUNTRIES.filter((c) => offeredChecks(c.code).map((r) => r.key).join() !== CHECK_ORDER.join());
check("72 countries, education then employment then global database then passport", short.length === 0, short.map((c) => c.code));

const india = ISO_COUNTRIES.find((c) => c.a2 === "IN");
check("passport country code is India (IND)", india !== undefined && countryLabel(india!, "nameCode") === "India (IND)");

console.log("1. a full case sends question ids in the contract's formats");
const form: CaseForm = {
  ...emptyForm(),
  shared: {
    firstName: "Asha",
    lastName: "Rao",
    dateOfBirth: "1994-04-11",
    gender: "Female",
    parentName: "Meera Rao",
  },
  answers: {
    passport: {
      "539": "Asha",
      "540": "Rao",
      "72": "P1234567",
      "139": "AB123456",
      "620": "India (IND)",
      "131": "2018-01-02",
      "74": "2028-01-01",
      "368": "P<INDRAO<<ASHA",
    },
    education: {
      "185": "University of Leeds",
      "214": "School of Computing",
      "98": "United Kingdom",
      "442": "West Yorkshire",
      "443": "Leeds",
      "603": "LS2 9JT",
      "246": "Graduation/Bachelor's degree",
      "222": "Bachelor's degree",
      "45": "Regular/Full Time",
      "38": "20161234",
      "365": "2016-09",
      "366": "2019-06",
      "31": "2019",
      "32": "Computer science",
    },
    employment: {
      "63": "Acme Ltd",
      "1000": "Permanent/Full-time",
      "62": "E-44",
      "260": "Analyst",
      "107": "2020-02-01",
      "108": "2024-03-15",
      "299": "1 High Street",
      "149": "1 High Street",
      "442": "England",
      "443": "London",
      "603": "EC1A 1AA",
      "1292": "Yes",
      "1713": "No",
      "1093": "Priya Shah",
      "1094": "+44 20 7946 0000",
      "1095": "hr@acme.example",
    },
  },
  files: {
    passport: {
      "158": { documentTypeId: 158, fileName: "front.jpg", mimeType: "image/jpeg", size: 1200, dataUrl: "data:image/jpeg;base64,AA==" },
      "159": { documentTypeId: 159, fileName: "back.jpg", mimeType: "image/jpeg", size: 1100, dataUrl: "data:image/jpeg;base64,AA==" },
    },
    education: {
      "60": { documentTypeId: 60, fileName: "degree.pdf", mimeType: "application/pdf", size: 2000, dataUrl: "data:application/pdf;base64,AA==" },
    },
    employment: {
      "114": { documentTypeId: 114, fileName: "experience.pdf", mimeType: "application/pdf", size: 1800 },
    },
  },
};

const keys: CheckKey[] = ["education", "employment", "globalDatabase", "passport"];
const { payload, errors } = compile({
  caseId: "IX-TEST",
  countryCode: "US",
  currency: "USD",
  amount: 275,
  rush: false,
  delivery: "each",
  checkKeys: keys,
  form,
});

check("the sample form has no errors", Object.keys(errors).length === 0, errors);
check("no invite, one case id", payload.invite === false && payload.caseId === "IX-TEST" && payload.checks.length === 4);

const byKey = Object.fromEntries(payload.checks.map((c) => [c.key, c]));
check("master ids and codes", byKey.passport.masterId === 15 && byKey.passport.code === "Pass" && byKey.globalDatabase.masterId === 7 && byKey.globalDatabase.code === "GDCO" && byKey.education.masterId === 28 && byKey.education.code === "INT-EDU" && byKey.employment.masterId === 30 && byKey.employment.code === "INT-EMP");
check("passport dates are dd-mm-yyyy and the hidden full name is first plus last", byKey.passport.answers["2"] === "11-04-1994" && byKey.passport.answers["131"] === "02-01-2018" && byKey.passport.answers["74"] === "01-01-2028" && byKey.passport.answers["158"] === "Asha Rao" && byKey.passport.answers["620"] === "India (IND)" && byKey.passport.answers["180"] === "Female");
check("global database is the three copied answers and no file", byKey.globalDatabase.answers["319"] === "Asha Rao" && byKey.globalDatabase.answers["2"] === "11-04-1994" && byKey.globalDatabase.answers["4"] === "Meera Rao" && byKey.globalDatabase.documents.length === 0);
check("education copies the name and sends month-year", byKey.education.answers["3"] === "Asha Rao" && byKey.education.answers["365"] === "09-2016" && byKey.education.answers["366"] === "06-2019" && byKey.education.answers["98"] === "United Kingdom" && byKey.education.documents[0].documentTypeId === 60);
check("employment sends HR when asked and omits the supervisor and the unticked box", byKey.employment.answers["1292"] === "Yes" && byKey.employment.answers["1095"] === "hr@acme.example" && byKey.employment.answers["1713"] === "No" && byKey.employment.answers["256"] === undefined && byKey.employment.answers["385"] === undefined && byKey.employment.answers["107"] === "01-02-2020" && byKey.employment.documents[0].documentTypeId === 114);
check("passport files are front 158 and back 159, and the JSON has no file bytes", byKey.passport.documents.map((d) => d.documentTypeId).join() === "158,159" && !JSON.stringify(payload).includes("dataUrl"));

const flat = payload.checks.flatMap((c) => Object.keys(c.answers));
check("operations-only questions are never sent", OMITTED_QUESTION_IDS.every((id) => !flat.includes(String(id))));

console.log("2. a missing upload and a bad date are rejected");
const broken = compile({
  caseId: "IX-BAD",
  countryCode: "US",
  currency: "USD",
  amount: 1,
  rush: false,
  delivery: "each",
  checkKeys: ["passport"],
  form: emptyForm(),
});
check("shared fields and both passport pages are required", Boolean(broken.errors["shared.firstName"] && broken.errors["passport.doc.158"] && broken.errors["passport.doc.159"]));

const ordered = { ...form, answers: { ...form.answers, passport: { ...form.answers.passport, "74": "2010-01-01" } } };
const expired = compile({ caseId: "IX-EXP", countryCode: "US", currency: "USD", amount: 1, rush: false, delivery: "each", checkKeys: ["passport"], form: ordered });
check("expiry has to be after issue", expired.errors["passport.q.74"] === "Expiry must be after the date of issue.");

check("every check declares the document type ids from the contract", CHECKS.education.documents[0].typeId === 60 && CHECKS.employment.documents[0].typeId === 114 && CHECKS.globalDatabase.documents.length === 0 && CHECKS.passport.documents.map((d) => d.typeId).join() === "158,159");

const employmentOnly = validateShared(emptyForm(), ["employment"]);
const passportOnly = validateShared(emptyForm(), ["passport"]);
check("employment alone does not collect the shared identity", Object.keys(employmentOnly).length === 0, employmentOnly);
check(
  "passport collects name, date of birth and gender, not a parent's name",
  Boolean(passportOnly["shared.firstName"] && passportOnly["shared.dateOfBirth"] && passportOnly["shared.gender"] && !passportOnly["shared.parentName"]),
  passportOnly,
);

console.log("3. the dashboard track follows the case, then an API update");
const open = trackChecks({
  status: "form",
  paidAt: "2026-11-01T00:00:00.000Z",
  submittedAt: null,
  checkKeys: ["education", "passport"],
  countryCode: "US",
});
check("an open form is waiting for details", open.every((track) => track.status === "awaiting_details" && track.steps.find((step) => step.id === "details")?.state === "now"), open);
const running = trackChecks({
  status: "submitted",
  paidAt: "2026-11-01T00:00:00.000Z",
  submittedAt: "2026-11-02T00:00:00.000Z",
  checkKeys: ["passport"],
  countryCode: "US",
});
check("a submitted check is in verification", running[0].status === "in_verification" && running[0].steps.find((step) => step.id === "verification")?.state === "now" && running[0].turnaround.length > 0, running[0]);
const ready = trackChecks({
  status: "submitted",
  paidAt: "2026-11-01T00:00:00.000Z",
  submittedAt: "2026-11-02T00:00:00.000Z",
  checkKeys: ["passport", "globalDatabase"],
  countryCode: "US",
  tracks: { passport: { status: "report_ready", updatedAt: "2026-11-05T00:00:00.000Z", note: "Clear" } },
});
check("the API can mark one check ready and leave the other running", ready[0].status === "report_ready" && ready[1].status === "in_verification" && caseTrackLabel(ready, false) === "Verification in progress", ready.map((track) => track.status));
