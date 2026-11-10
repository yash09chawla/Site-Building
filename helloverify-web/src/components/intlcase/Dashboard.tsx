"use client";

import { useSearchParams } from "next/navigation";

import { CheckTracks, caseLabel } from "@/components/intlcase/Track";
import { localise } from "@/lib/i18n/href";
import { CHECKS, type CheckKey } from "@/lib/intlcase/contract";
import { signOut, useIntlAccount, useIntlCases, useOwnedCase, type IntlCase } from "@/lib/intlcase/store";

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function statusLabel(item: IntlCase): string {
  return caseLabel(item);
}

export function Dashboard({ locale }: { locale: string }) {
  const params = useSearchParams();
  const account = useIntlAccount();
  const cases = useIntlCases();
  const openId = params.get("case") ?? "";
  const owned = useOwnedCase(openId);

  if (!account) {
    const next = localise(`/international/dashboard${openId ? `?case=${openId}` : ""}`, locale);
    return (
      <section className="mf-done">
        <h1 className="mf-step-t">Sign in to see your cases</h1>
        <p className="ma-lede">International checks use their own account, separate from the site sign-in.</p>
        <a className="btn btn-ink" href={localise(`/international/sign-in?next=${encodeURIComponent(next)}`, locale)}>
          Sign in
        </a>
      </section>
    );
  }

  return (
    <div className="ma-apply">
      <div className="ma-apply-head">
        <div>
          <p className="k">International checks</p>
          <h1 className="ma-title">Your cases</h1>
          <p className="ma-lede">
            {account.name} · {account.email}
          </p>
        </div>
        <span className="ix-actions">
          <a className="btn btn-line btn-sm" href={localise("/international", locale)}>
            New request
          </a>
          <button type="button" className="ma-link" onClick={() => signOut()}>
            Sign out
          </button>
        </span>
      </div>

      {owned ? <CaseDetail locale={locale} item={owned} /> : openId ? <p className="ma-lede">That case is not on this account.</p> : null}

      {cases.length === 0 ? (
        <section className="mf-done">
          <h2 className="mf-step-t">No cases yet</h2>
          <p className="ma-lede">Choose a country and the checks you need. Education, employment, global database, and passport are offered everywhere.</p>
          <a className="btn btn-ink" href={localise("/international", locale)}>
            International checks
          </a>
        </section>
      ) : (
        <ul className="ix-list">
          {cases.map((item) => (
            <li key={item.id}>
              <a className={`ix-case${item.id === owned?.id ? " is-on" : ""}`} href={localise(`/international/dashboard?case=${item.id}`, locale)}>
                <span>
                  <span className="ix-meta">{statusLabel(item)}</span>
                  <strong>{item.id}</strong>
                  <span>
                    {item.countryName} · {item.checkKeys.map((key) => CHECKS[key].short).join(", ")}
                  </span>
                </span>
                <span>
                  <b>{item.amountLabel}</b>
                  <span className="ix-meta">{when(item.submittedAt ?? item.createdAt)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CaseDetail({ locale, item }: { locale: string; item: IntlCase }) {
  return (
    <article className="ix-detail">
      <div className="mf-rev-h">
        <h2>{item.id}</h2>
        {item.status === "form" ? (
          <a className="btn btn-ink btn-sm" href={localise(`/international/request?case=${item.id}`, locale)}>
            Continue the form
          </a>
        ) : (
          <span className="ix-meta">Submitted {item.submittedAt ? when(item.submittedAt) : ""}</span>
        )}
      </div>
      <p className="ma-lede">
        {item.countryName} · {item.amountLabel} · {statusLabel(item)}
      </p>
      <CheckTracks item={item} />
      <details className="ix-payload">
        <summary>What you sent</summary>
      <ul className="ix-checks">
        {item.checkKeys.map((key: CheckKey) => {
          const def = CHECKS[key];
          const sent = item.payload?.checks.find((check) => check.key === key);
          return (
            <li key={key}>
              <h3>
                {def.title} <span className="ix-meta">{def.code} · master {def.masterId}</span>
              </h3>
              {sent ? (
                <dl>
                  {Object.entries(sent.answers).map(([id, value]) => {
                    const question = def.questions.find((entry) => String(entry.id) === id);
                    return (
                      <div key={id}>
                        <dt>
                          {id} · {question?.name ?? "Answer"}
                        </dt>
                        <dd>{value}</dd>
                      </div>
                    );
                  })}
                  {sent.documents.map((doc) => (
                    <div key={doc.documentTypeId}>
                      <dt>File {doc.documentTypeId}</dt>
                      <dd>{doc.fileName}</dd>
                    </div>
                  ))}
                  {sent.documents.length === 0 ? (
                    <div>
                      <dt>File</dt>
                      <dd>None</dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <p className="mf-hint">Answers are saved as you go. Submit the form to build the payload.</p>
              )}
            </li>
          );
        })}
      </ul>
      </details>
      {item.payload ? (
        <details className="ix-payload">
          <summary>API payload</summary>
          <pre className="ix-pre">{JSON.stringify(item.payload, null, 2)}</pre>
        </details>
      ) : null}
    </article>
  );
}
