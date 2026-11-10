/** /international/request — pay, then the candidate form for the four checks.
 *  noindex. The field contract is `lib/intlcase/contract.ts`. */
import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import "@/app/v2/intlcase.css";
import "@/app/v2/momapply.css";
import "@/app/v2/momflow.css";

import { PageShell } from "@/components/chrome/PageShell";
import { Gateway } from "@/components/intlcase/Gateway";
import { intlCaseMetadata } from "@/lib/intlcase/metadata";
import { PLATFORM } from "@/lib/copy/platform";
import { copy } from "@/lib/copy/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return intlCaseMetadata(locale, "/international/request", "Request checks");
}

export default async function InternationalRequestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await copy(PLATFORM);

  return (
    <PageShell
      crumbs={[{ label: t.coverage.crumb, href: "/international" }, { label: "Request" }]}
      closing={false}
      showSignUp={false}
    >
      <div className="wrap ma-page">
        <Suspense
          fallback={
            <p className="ma-loading">
              <span className="ma-spin" aria-hidden="true" />
            </p>
          }
        >
          <Gateway locale={locale} />
        </Suspense>
      </div>
    </PageShell>
  );
}
