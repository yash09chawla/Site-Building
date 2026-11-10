"use client";

import { CHECKS, type CheckKey } from "@/lib/intlcase/contract";

export function Summary({
  countryName,
  keys,
  rush,
  readyBy,
  paid,
  amountLabel,
}: {
  countryName: string;
  keys: readonly CheckKey[];
  rush: boolean;
  readyBy: string;
  paid: boolean;
  amountLabel: string;
}) {
  return (
    <aside className="mf-sum">
      <p className="k">Your request</p>
      <dl className="mf-sum-dl">
        <div>
          <dt>Country</dt>
          <dd>{countryName}</dd>
        </div>
        <div>
          <dt>Checks</dt>
          <dd>
            <ul>
              {keys.map((key) => (
                <li key={key}>
                  {CHECKS[key].title}
                  <span className="ix-meta"> {CHECKS[key].code}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        {rush ? (
          <div>
            <dt>Speed</dt>
            <dd>Fast track</dd>
          </div>
        ) : null}
        {readyBy ? (
          <div>
            <dt>Results by</dt>
            <dd>{readyBy}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mf-sum-tot">
        <span>{paid ? "Paid" : "Total"}</span>
        <b>{amountLabel}</b>
      </p>
    </aside>
  );
}
