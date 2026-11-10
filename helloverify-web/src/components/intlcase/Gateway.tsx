"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { TickIcon } from "@/components/momapply/icons";
import { Progress, type StepId } from "@/components/intlcase/Progress";
import { StepPane } from "@/components/intlcase/StepPane";
import { Summary } from "@/components/intlcase/Summary";
import { localise } from "@/lib/i18n/href";
import { addWorkingDays, shortDate } from "@/lib/international/order";
import {
  CHECKS,
  compile,
  emptyForm,
  isCheckKey,
  needsYou,
  validateCheck,
  validateShared,
  withPassportPrefill,
  type CaseFile,
  type CaseForm,
  type CheckKey,
} from "@/lib/intlcase/contract";
import { parseSelection } from "@/lib/intlcase/offered";
import { saveForm, signOut, startCase, submitCase, useIntlAccount, useOwnedCase } from "@/lib/intlcase/store";

export function Gateway({ locale }: { locale: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const account = useIntlAccount();
  const caseId = params.get("case") ?? "";
  const caseRecord = useOwnedCase(caseId);
  const missing = Boolean(caseId && account && !caseRecord);
  const query = parseSelection(
    params.get("country") ?? "",
    params.get("checks") ?? "",
    params.get("rush") === "1",
    params.get("delivery") === "together" ? "together" : "each",
  );
  const selection = caseRecord
    ? parseSelection(caseRecord.countryCode, caseRecord.checkKeys.join(","), caseRecord.rush, caseRecord.delivery)
    : query;

  const [chosen, setChosen] = useState<StepId | null>(null);
  const [draft, setDraft] = useState<{ id: string; form: CaseForm } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const form = draft && (!caseRecord || draft.id === caseRecord.id) ? draft.form : (caseRecord?.form ?? emptyForm());
  const step: StepId =
    chosen ??
    (!account
      ? "account"
      : missing || !caseRecord
        ? "payment"
        : caseRecord.status === "submitted"
          ? "done"
          : needsYou(caseRecord.checkKeys)
            ? "candidate"
            : (caseRecord.checkKeys[0] ?? "review"));
  const keys = caseRecord?.checkKeys ?? selection?.keys ?? [];
  const amountLabel = caseRecord?.amountLabel ?? selection?.amountLabel ?? "";
  const countryName = caseRecord?.countryName ?? selection?.countryName ?? "";
  const caseKey = caseRecord?.id || draft?.id || "";
  const paid = Boolean(caseKey);

  useEffect(() => {
    if (!moved.current) {
      moved.current = true;
      return;
    }
    titleRef.current?.focus();
  }, [step]);

  function updateForm(next: CaseForm) {
    setDraft({ id: caseRecord?.id || draft?.id || "", form: next });
  }

  function persist(next: CaseForm) {
    if (!caseKey || caseRecord?.status === "submitted") return;
    saveForm(caseKey, next);
  }

  function go(id: StepId) {
    if (!paid && id !== "account" && id !== "payment") return;
    const next = id === "passport" ? withPassportPrefill(form) : form;
    if (next !== form) updateForm(next);
    if (id !== "payment" && id !== "account") persist(next);
    setBanner("");
    setChosen(id);
  }

  function pay() {
    if (!account || !query || caseRecord) return;
    const created = startCase({
      accountId: account.id,
      countryCode: query.code,
      countryName: query.countryName,
      currency: query.quote.cur,
      amount: query.quote.total,
      amountLabel: query.amountLabel,
      rush: query.rush,
      delivery: query.delivery,
      checkKeys: query.keys,
    });
    setDraft({ id: created.id, form: created.form });
    setChosen(needsYou(created.checkKeys) ? "candidate" : (created.checkKeys[0] ?? "review"));
    router.replace(localise(`/international/request?case=${created.id}`, locale), { scroll: false });
  }

  function firstFormStep(): StepId {
    return needsYou(keys) ? "candidate" : (keys[0] ?? "review");
  }

  function continueFromYou() {
    const found = validateShared(form, keys);
    if (Object.keys(found).length) return setErrors(found);
    setErrors({});
    go(keys[0] ?? "review");
  }

  function continueFromCheck(key: CheckKey) {
    const found = validateCheck(key, form);
    if (Object.keys(found).length) return setErrors(found);
    setErrors({});
    const index = keys.indexOf(key);
    go(index >= 0 && index < keys.length - 1 ? keys[index + 1] : "review");
  }

  function submit() {
    if (!caseRecord) return;
    const result = submitCase(caseRecord.id, form);
    if (!result.ok) {
      if ("errors" in result) {
        setErrors(result.errors);
        setBanner("Some answers are still missing.");
        if (Object.keys(result.errors).some((key) => key.startsWith("shared."))) setChosen("candidate");
        else {
          const key = keys.find((item) => Object.keys(result.errors).some((entry) => entry.startsWith(`${item}.`)));
          if (key) setChosen(key);
        }
      } else setBanner(result.message);
      return;
    }
    setBanner("");
    setChosen("done");
  }

  if (missing) {
    return (
      <section className="mf-done">
        <h1 className="mf-step-t">This case is not on this account</h1>
        <p className="ma-lede">Sign in with the account that started it, or begin a new request.</p>
        <a className="btn btn-ink" href={localise("/international", locale)}>
          International checks
        </a>
      </section>
    );
  }

  if (!selection) {
    return (
      <section className="mf-done">
        <h1 className="mf-step-t">Choose the checks first</h1>
        <p className="ma-lede">Pick a country and at least one of education, employment, global database, or passport.</p>
        <a className="btn btn-ink" href={localise("/international", locale)}>
          International checks
        </a>
      </section>
    );
  }

  const steps: StepId[] = [...(account ? [] : (["account"] as const)), "payment", ...(needsYou(keys) ? (["candidate"] as const) : []), ...keys, "review"];
  const preview = caseRecord
    ? compile({
        caseId: caseRecord.id,
        countryCode: caseRecord.countryCode,
        currency: caseRecord.currency,
        amount: caseRecord.amount,
        rush: caseRecord.rush,
        delivery: caseRecord.delivery,
        checkKeys: caseRecord.checkKeys,
        form,
      }).payload
    : null;
  const readyBy = selection.quote.reportDays > 0 ? shortDate(addWorkingDays(selection.quote.reportDays), locale) : "";

  return (
    <div className="ma-apply">
      <div className="ma-apply-head">
        <div>
          <p className="k">International checks</p>
          <h1 className="ma-title">Request</h1>
          <p className="ma-lede">
            {countryName}. You pay, then fill the form on this page. No invite is sent.
          </p>
        </div>
        <span className="ma-demo">Demo — stored in this browser</span>
      </div>
      {account ? (
        <p className="ix-who">
          <span>Signed in as {account.name}</span>
          <span className="ix-actions">
            <a href={localise("/international/dashboard", locale)}>Your cases</a>
            <button
              type="button"
              className="ma-link ma-link-sm"
              onClick={() => {
                if (caseRecord?.status === "form") saveForm(caseRecord.id, form);
                signOut();
                setDraft(null);
                setChosen(null);
              }}
            >
              Sign out
            </button>
          </span>
        </p>
      ) : null}
      {step === "done" && caseRecord ? (
        <section className="mf-done">
          <div className="ma-seal">
            <TickIcon />
          </div>
          <h2 className="mf-step-t">Case registered</h2>
          <p className="mf-done-h">Case id</p>
          <p className="mf-id">{caseRecord.id}</p>
          <p className="mf-done-who">
            {countryName} · {keys.map((key) => CHECKS[key].short).join(", ")} · {amountLabel}
          </p>
          <p className="mf-hint">Your cases page shows the payload, with each answer under its question id.</p>
          <a className="btn btn-ink" href={localise(`/international/dashboard?case=${caseRecord.id}`, locale)}>
            Open in your cases
          </a>
        </section>
      ) : (
        <>
          <Progress steps={steps} at={Math.max(0, steps.indexOf(step))} onGo={go} />
          <div className="mf-work">
            <StepPane
              step={step}
              titleRef={titleRef}
              banner={banner}
              account={Boolean(account)}
              paid={paid}
              amountLabel={amountLabel}
              selection={selection}
              form={form}
              errors={errors}
              keys={keys}
              preview={preview}
              onSignedIn={() => setChosen(null)}
              onPay={pay}
              onGo={go}
              onShared={(shared) => updateForm({ ...form, shared })}
              onAnswer={(id, value) => {
                if (!isCheckKey(step)) return;
                updateForm({ ...form, answers: { ...form.answers, [step]: { ...form.answers[step], [String(id)]: value } } });
              }}
              onFile={(file: CaseFile) =>
                isCheckKey(step)
                  ? updateForm({
                      ...form,
                      files: { ...form.files, [step]: { ...form.files[step], [String(file.documentTypeId)]: file } },
                    })
                  : undefined
              }
              onRemove={(typeId) => {
                if (!isCheckKey(step)) return;
                const bucket = { ...form.files[step] };
                delete bucket[String(typeId)];
                updateForm({ ...form, files: { ...form.files, [step]: bucket } });
              }}
              onContinuePaid={() => go(firstFormStep())}
              onContinueYou={continueFromYou}
              onContinueCheck={continueFromCheck}
              onSubmit={submit}
            />
            <Summary countryName={countryName} keys={keys} rush={Boolean(selection.rush)} readyBy={readyBy} paid={paid} amountLabel={amountLabel} />
          </div>
        </>
      )}
    </div>
  );
}
