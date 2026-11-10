/** Where each check is, for the signed-in user.
 *
 *  Until the API writes `tracks`, the stage is derived from the case:
 *  the form is still open, or the check is in verification after submit.
 *  The API can set a check to `report_ready` (and an optional note) without
 *  changing this screen. */
import type { CheckKey } from "@/lib/intlcase/contract";
import { offeredChecks } from "@/lib/intlcase/offered";

export type TrackStatus = "awaiting_details" | "in_verification" | "report_ready";

/** What the API stores per check when it moves the case on. */
export type CheckTrackUpdate = {
  status: TrackStatus;
  updatedAt: string;
  note?: string;
};

export type TrackStep = {
  id: "paid" | "details" | "verification" | "report";
  label: string;
  detail: string;
  state: "done" | "now" | "next";
};

export type CheckTrack = {
  key: CheckKey;
  status: TrackStatus;
  statusLabel: string;
  turnaround: string;
  steps: TrackStep[];
};

const STATUS_LABEL: Record<TrackStatus, string> = {
  awaiting_details: "Waiting for your details",
  in_verification: "Verification in progress",
  report_ready: "Report ready",
};

function when(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function stage(status: TrackStatus): number {
  if (status === "awaiting_details") return 1;
  if (status === "in_verification") return 2;
  return 3;
}

export function trackChecks(input: {
  status: "form" | "submitted";
  paidAt: string;
  submittedAt: string | null;
  checkKeys: readonly CheckKey[];
  countryCode: string;
  tracks?: Partial<Record<CheckKey, CheckTrackUpdate>>;
}): CheckTrack[] {
  const catalog = offeredChecks(input.countryCode);
  const paid = when(input.paidAt);
  const sent = when(input.submittedAt);
  return input.checkKeys.map((key) => {
    const stored = input.tracks?.[key];
    const status: TrackStatus = stored?.status ?? (input.status === "submitted" ? "in_verification" : "awaiting_details");
    const at = stage(status);
    const tat = catalog.find((row) => row.key === key)?.tat ?? "";
    const steps: TrackStep[] = [
      { id: "paid", label: "Paid", detail: paid ? `Paid ${paid}` : "Payment recorded", state: "done" },
      {
        id: "details",
        label: "Details received",
        detail: status === "awaiting_details" ? "Finish the form to send this check." : sent ? `Submitted ${sent}` : "Submitted",
        state: at > 1 ? "done" : "now",
      },
      {
        id: "verification",
        label: "Verification",
        detail:
          status === "report_ready"
            ? "Finished"
            : status === "in_verification"
              ? tat
                ? `With the verification team. Usual turnaround: ${tat}.`
                : "With the verification team."
              : "Starts after you submit.",
        state: at > 2 ? "done" : at === 2 ? "now" : "next",
      },
      {
        id: "report",
        label: "Report ready",
        detail: status === "report_ready" ? stored?.note || "The report is ready on this case." : "Shown here when the check is finished.",
        state: at === 3 ? "now" : "next",
      },
    ];
    return { key, status, statusLabel: STATUS_LABEL[status], turnaround: tat, steps };
  });
}

export function caseTrackLabel(tracks: readonly CheckTrack[], formOpen: boolean): string {
  if (formOpen || tracks.some((track) => track.status === "awaiting_details")) return "Finish the form";
  if (tracks.length > 0 && tracks.every((track) => track.status === "report_ready")) return "Reports ready";
  return "Verification in progress";
}
