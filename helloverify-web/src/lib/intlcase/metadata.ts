/** noindex metadata for the international-case gateway. Not in the sitemap. */
import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/seo/site";

export function intlCaseMetadata(
  locale: string,
  path: "/international/request" | "/international/sign-in" | "/international/dashboard",
  title: string,
): Metadata {
  return {
    title: `${title} — HelloVerify`,
    robots: { index: false, follow: false },
    alternates: { canonical: absoluteUrl(`/${locale}${path}`) },
  };
}
