"use client";

import { usePathname } from "next/navigation";

import { localise } from "@/lib/i18n/href";
import { signOut, useIntlAccount } from "@/lib/intlcase/store";

function onInternational(path: string): boolean {
  return /\/international(\/|$)/.test(path);
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="6.2" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.8 15.2c.7-2.5 2.7-3.8 5.2-3.8s4.5 1.3 5.2 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Profile control in the header Sign Up slot, only on international checks.
 *  Signed out: Sign up and Sign in. Signed in: those, plus Dashboard. */
export function IntlProfileMenu({ locale, placement }: { locale: string; placement: "bar" | "menu" }) {
  const path = usePathname() ?? "";
  const account = useIntlAccount();
  if (!onInternational(path)) return null;

  const signUp = localise("/international/sign-in", locale);
  const signIn = localise("/international/sign-in?mode=sign-in", locale);
  const dashboard = localise("/international/dashboard", locale);
  const items = [
    { href: signUp, label: "Sign up" },
    { href: signIn, label: "Sign in" },
    ...(account ? [{ href: dashboard, label: "Dashboard" }] : []),
  ];

  if (placement === "menu") {
    return (
      <div className="nv-account-menu">
        {account ? <p className="nv-account-name">{account.name}</p> : null}
        {items.map((item) => (
          <a key={item.label} href={item.href} className="nv-ml">
            <span>{item.label}</span>
            <span className="k">→</span>
          </a>
        ))}
        {account ? (
          <button type="button" className="nv-ml" onClick={() => signOut()}>
            <span>Sign out</span>
            <span className="k">→</span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <details className="nv-user nv-profile">
      <summary className="nv-user-sum nv-profile-sum">
        <span className="sr-only">Account</span>
        <ProfileIcon />
      </summary>
      <div className="nv-user-list" role="menu">
        {items.map((item) => (
          <a key={item.label} href={item.href} role="menuitem">
            {item.label}
          </a>
        ))}
        {account ? (
          <button type="button" role="menuitem" onClick={() => signOut()}>
            Sign out
          </button>
        ) : null}
      </div>
    </details>
  );
}
