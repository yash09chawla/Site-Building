"use client";

import type { Ref } from "react";

import { ArrowIcon, TickIcon } from "@/components/momapply/icons";
import { AuthCard } from "@/components/intlcase/AuthCard";
import { CheckForm } from "@/components/intlcase/CheckForm";
import { CandidateForm } from "@/components/intlcase/fields";
import { ReviewBody } from "@/components/intlcase/ReviewBody";
import type { StepId } from "@/components/intlcase/Progress";
import { CHECKS, isCheckKey, type CaseFile, type CaseForm, type CheckKey, type IntlCasePayload } from "@/lib/intlcase/contract";
import type { PricedSelection } from "@/lib/intlcase/offered";

export function StepPane({
  step,
  titleRef,
  banner,
  account,
  paid,
  amountLabel,
  selection,
  form,
  errors,
  keys,
  preview,
  onSignedIn,
  onPay,
  onGo,
  onShared,
  onAnswer,
  onFile,
  onRemove,
  onContinuePaid,
  onContinueYou,
  onContinueCheck,
  onSubmit,
}: {
  step: StepId;
  titleRef: Ref<HTMLHeadingElement>;
  banner: string;
  account: boolean;
  paid: boolean;
  amountLabel: string;
  selection: PricedSelection | null;
  form: CaseForm;
  errors: Record<string, string>;
  keys: readonly CheckKey[];
  preview: IntlCasePayload | null;
  onSignedIn: () => void;
  onPay: () => void;
  onGo: (id: StepId) => void;
  onShared: (shared: CaseForm["shared"]) => void;
  onAnswer: (id: number, value: string) => void;
  onFile: (file: CaseFile) => void;
  onRemove: (typeId: number) => void;
  onContinuePaid: () => void;
  onContinueYou: () => void;
  onContinueCheck: (key: CheckKey) => void;
  onSubmit: () => void;
}) {
  const title = (text: string) => (
    <h2 id="ix-step-t" className="mf-step-t" tabIndex={-1} ref={titleRef}>
      {text}
    </h2>
  );
  return (
    <section className="mf-step" aria-labelledby="ix-step-t">
      {banner ? (
        <p className="ma-err" role="alert">
          {banner}
        </p>
      ) : null}
      {step === "account" ? (
        <>
          {title("Your account")}
          <AuthCard onSignedIn={onSignedIn} />
        </>
      ) : null}
      {step === "payment" && selection ? (
        <>
          {title(paid ? "Paid" : "Payment")}
          <p className="ma-lede">
            {paid
              ? "Payment is recorded. Continue to the form."
              : "After payment the case is registered and the form opens here. The charge is recorded in this browser until the API takes it."}
          </p>
          <ul className="mf-plan-c ix-bill">
            {selection.rows.map((row) => (
              <li key={row.key}>
                <span className="mf-plan-i">
                  <TickIcon />
                </span>
                <span className="mf-plan-cb">
                  <b>{CHECKS[row.key].title}</b>
                  <small>
                    {CHECKS[row.key].code} · master {CHECKS[row.key].masterId} · {row.tat}
                  </small>
                </span>
              </li>
            ))}
          </ul>
          <div className="mf-nav">
            {account ? <span /> : (
              <button type="button" className="btn btn-line mf-back" onClick={() => onGo("account")}>
                <ArrowIcon /> Account
              </button>
            )}
            {paid ? (
              <button type="button" className="btn btn-ink mf-next" onClick={onContinuePaid}>
                Continue <ArrowIcon />
              </button>
            ) : (
              <button type="button" className="btn btn-ink mf-next" onClick={onPay} disabled={!account}>
                Pay {amountLabel} <ArrowIcon />
              </button>
            )}
          </div>
        </>
      ) : null}
      {step === "candidate" ? (
        <>
          {title("Your details")}
          <CandidateForm form={form} keys={keys} errors={errors} onChange={onShared} />
          <div className="mf-nav">
            <button type="button" className="btn btn-line mf-back" onClick={() => onGo("payment")}>
              <ArrowIcon /> Back
            </button>
            <button type="button" className="btn btn-ink mf-next" onClick={onContinueYou}>
              Continue <ArrowIcon />
            </button>
          </div>
        </>
      ) : null}
      {isCheckKey(step) ? (
        <>
          {title(CHECKS[step].title)}
          <CheckForm checkKey={step} form={form} errors={errors} onAnswer={onAnswer} onFile={onFile} onRemove={onRemove} onEditShared={() => onGo("candidate")} />
          <div className="mf-nav">
            <button
              type="button"
              className="btn btn-line mf-back"
              onClick={() => {
                const index = keys.indexOf(step);
                onGo(index <= 0 ? "candidate" : keys[index - 1]);
              }}
            >
              <ArrowIcon /> Back
            </button>
            <button type="button" className="btn btn-ink mf-next" onClick={() => onContinueCheck(step)}>
              Continue <ArrowIcon />
            </button>
          </div>
        </>
      ) : null}
      {step === "review" && preview ? (
        <>
          {title("Review and submit")}
          <ReviewBody form={form} payload={preview} onEdit={onGo} />
          <div className="mf-nav">
            <button type="button" className="btn btn-line mf-back" onClick={() => onGo(keys[keys.length - 1] ?? "candidate")}>
              <ArrowIcon /> Back
            </button>
            <button type="button" className="btn btn-ink mf-next" onClick={onSubmit}>
              Submit case <ArrowIcon />
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
