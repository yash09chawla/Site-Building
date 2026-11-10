/** /international/sign-in — the case account. noindex. */
import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import "@/app/v2/intlcase.css";
import "@/app/v2/momapply.css";
import "@/app/v2/momflow.css";

import { PageShell } from "@/components/chrome/PageShell";
import { SignInScreen } from "@/components/intlcase/AuthCard";
import { intlCaseMetadata } from "@/lib/intlcase/metadata";
import { PLATFORM } from "@/lib/copy/platform";
import { copy } from "@/lib/copy/request";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return intlCaseMetadata(locale, "/international/sign-in", "Sign in");
}

export default async function InternationalSignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await copy(PLATFORM);

  return (
    <PageShell
      crumbs={[{ label: t.coverage.crumb, href: "/international" }, { label: "Sign in" }]}
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
          <SignInScreen locale={locale} />
        </Suspense>
      </div>
    </PageShell>
  );
}
