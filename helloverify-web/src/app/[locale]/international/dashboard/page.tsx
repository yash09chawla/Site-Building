/** /international/dashboard — cases for the signed-in account. noindex. */
import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import "@/app/v2/intlcase.css";
import "@/app/v2/momapply.css";
import "@/app/v2/momflow.css";

import { PageShell } from "@/components/chrome/PageShell";
import { Dashboard } from "@/components/intlcase/Dashboard";
import { intlCaseMetadata } from "@/lib/intlcase/metadata";
import { PLATFORM } from "@/lib/copy/platform";
import { copy } from "@/lib/copy/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return intlCaseMetadata(locale, "/international/dashboard", "Your cases");
}

export default async function InternationalDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await copy(PLATFORM);

  return (
    <PageShell
      crumbs={[{ label: t.coverage.crumb, href: "/international" }, { label: "Your cases" }]}
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
          <Dashboard locale={locale} />
        </Suspense>
      </div>
    </PageShell>
  );
}
