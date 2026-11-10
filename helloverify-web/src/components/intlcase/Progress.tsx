"use client";

import { TickIcon } from "@/components/momapply/icons";
import { CHECKS, isCheckKey, type CheckKey } from "@/lib/intlcase/contract";

export type StepId = "account" | "payment" | "candidate" | "review" | "done" | CheckKey;

const RAIL: Record<Exclude<StepId, CheckKey>, string> = {
  account: "Account",
  payment: "Payment",
  candidate: "You",
  review: "Review",
  done: "Done",
};

export function stepLabel(id: StepId): string {
  return isCheckKey(id) ? CHECKS[id].short : RAIL[id];
}

export function Progress({ steps, at, onGo }: { steps: readonly StepId[]; at: number; onGo: (id: StepId) => void }) {
  return (
    <nav className="ma-rail" aria-label="Request progress">
      <p className="ma-rail-m">
        <span>
          Step {at + 1} of {steps.length}
        </span>
        <b>{stepLabel(steps[at] ?? "payment")}</b>
      </p>
      <div className="ma-rail-bar" aria-hidden="true">
        {steps.map((id, i) => (
          <i key={id} className={i === at ? "is-now" : i < at ? "is-done" : undefined} />
        ))}
      </div>
      <ol>
        {steps.map((id, i) => {
          const now = i === at;
          const done = i < at;
          const body = (
            <>
              <span className="ma-rail-dot">{done ? <TickIcon /> : i + 1}</span>
              <span className="ma-rail-lab">{stepLabel(id)}</span>
            </>
          );
          return (
            <li key={id} className={[now ? "is-now" : done ? "is-done" : "", i <= at ? "is-reached" : ""].filter(Boolean).join(" ") || undefined} aria-current={now ? "step" : undefined}>
              <span className="ma-rail-line ma-rail-in" aria-hidden="true" />
              <span className="ma-rail-line ma-rail-out" aria-hidden="true" />
              {done ? (
                <button type="button" className="ma-rail-go" onClick={() => onGo(id)}>
                  {body}
                </button>
              ) : (
                <span className="ma-rail-go">{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
