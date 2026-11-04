import Link from "next/link";

import type { MomApplyCopy } from "@/lib/copy/momApply";
import { isInternalHref, localise } from "@/lib/i18n/href";
import { MOM_APPLICANT_PORTAL, MOM_SIGN_IN_PATH } from "@/lib/mom/paths";

/** Create account / Sign in are two pages; this pair moves between them.
 *  Applicant create-account leaves for the portal (`MOM_APPLICANT_PORTAL`). */
export function AccountTabs({
  t,
  locale,
  current,
  paths = { register: MOM_APPLICANT_PORTAL, signIn: MOM_SIGN_IN_PATH },
}: {
  t: Pick<MomApplyCopy, "tabs">;
  locale: string;
  current: "register" | "signIn";
  paths?: { register: string; signIn: string };
}) {
  const tabs = [
    { id: "register", href: paths.register, label: t.tabs.register },
    { id: "signIn", href: paths.signIn, label: t.tabs.signIn },
  ] as const;

  return (
    <nav className="ma-tabs" aria-label={t.tabs.aria}>
      {tabs.map((tab) => {
        const on = tab.id === current;
        const className = on ? "is-on" : undefined;
        const ariaCurrent = on ? ("page" as const) : undefined;
        const href = localise(tab.href, locale);
        if (!isInternalHref(tab.href)) {
          return (
            <a key={tab.id} href={href} className={className} aria-current={ariaCurrent}>
              {tab.label}
            </a>
          );
        }
        return (
          <Link key={tab.id} href={href} className={className} aria-current={ariaCurrent} replace>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
