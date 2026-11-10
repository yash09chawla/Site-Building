"use client";

import { CHECKS } from "@/lib/intlcase/contract";
import { caseTrackLabel, trackChecks, type CheckTrack } from "@/lib/intlcase/track";
import type { IntlCase } from "@/lib/intlcase/store";

function marks(state: CheckTrack["steps"][number]["state"]): string {
  if (state === "done") return "is-done";
  if (state === "now") return "is-now";
  return "";
}

export function caseLabel(item: IntlCase): string {
  return caseTrackLabel(trackChecks(item), item.status !== "submitted");
}

/** One timeline per check on the case. The current stage is the filled dot. */
export function CheckTracks({ item }: { item: IntlCase }) {
  const tracks = trackChecks(item);
  return (
    <div className="ix-track">
      <p className="ma-l">Track</p>
      {tracks.map((track) => {
        const def = CHECKS[track.key];
        return (
          <article key={track.key}>
            <h3>
              {def.title}
              <span className="ix-meta">
                {def.code} · {track.statusLabel}
              </span>
            </h3>
            <ol className="mf-tl">
              {track.steps.map((step) => (
                <li key={step.id} className={marks(step.state) || undefined}>
                  <span className="mf-tl-m" aria-hidden="true" />
                  <span>
                    <b>{step.label}</b>
                    <small>{step.detail}</small>
                  </span>
                </li>
              ))}
            </ol>
          </article>
        );
      })}
    </div>
  );
}
