"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { FieldError } from "@/components/momapply/PasswordField";
import { TextField } from "@/components/momapply/flow/Fields";
import { localise } from "@/lib/i18n/href";
import { DEMO_EMAIL, DEMO_PASSWORD, registerAccount, signIn, useIntlAccount, type PublicAccount } from "@/lib/intlcase/store";

/** Email and password for the international-case account. The same card is the
 *  gateway's first step and the sign-in page. */
export function AuthCard({ onSignedIn }: { onSignedIn: (account: PublicAccount) => void }) {
  const modeParam = useSearchParams().get("mode");
  const [mode, setMode] = useState<"signIn" | "register">(modeParam === "sign-in" ? "signIn" : "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result =
      mode === "register" ? registerAccount({ name, email, password }) : signIn({ email, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSignedIn(result.account);
  }

  return (
    <form className="mf-step-b" onSubmit={submit}>
      <div className="ix-tabs" role="tablist" aria-label="Account">
        <button type="button" role="tab" className={mode === "register" ? "is-on" : undefined} aria-selected={mode === "register"} onClick={() => { setMode("register"); setError(""); }}>
          Create account
        </button>
        <button type="button" role="tab" className={mode === "signIn" ? "is-on" : undefined} aria-selected={mode === "signIn"} onClick={() => { setMode("signIn"); setError(""); }}>
          Sign in
        </button>
      </div>
      <p className="ma-lede">
        {mode === "register"
          ? "The account is how you come back to a case. It stays in this browser until the international-cases API is connected."
          : "Sign in to the account you created for international checks."}
      </p>
      <p className="mf-hint">
        Demo: {DEMO_EMAIL} · {DEMO_PASSWORD}
      </p>
      {mode === "register" ? (
        <TextField id="ix-name" label="Your name *" autoComplete="name" value={name} onChange={setName} />
      ) : null}
      <TextField id="ix-email" label="Email *" type="email" autoComplete="email" value={email} onChange={setEmail} />
      <TextField
        id="ix-password"
        label="Password *"
        type="password"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        hint={mode === "register" ? "At least 8 characters." : undefined}
        value={password}
        onChange={setPassword}
      />
      {error ? <FieldError id="ix-auth-err">{error}</FieldError> : null}
      <div className="mf-nav">
        <span />
        <button type="submit" className="btn btn-ink mf-next" disabled={busy}>
          {mode === "register" ? "Create account" : "Sign in"}
        </button>
      </div>
    </form>
  );
}

function safeNext(locale: string, next: string | null): string {
  const home = localise("/international/dashboard", locale);
  const prefix = `/${locale}/international`;
  if (!next || next.includes("://") || next.startsWith("//")) return home;
  if (next === prefix || next.startsWith(`${prefix}/`) || next.startsWith(`${prefix}?`)) return next;
  return home;
}

/** The sign-in page. Sends the person back to the dashboard, or to `?next=`. */
export function SignInScreen({ locale }: { locale: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const account = useIntlAccount();

  useEffect(() => {
    if (account) router.replace(safeNext(locale, params.get("next")));
  }, [account, locale, params, router]);

  if (account) {
    return (
      <p className="ma-loading">
        <span className="ma-spin" aria-hidden="true" />
      </p>
    );
  }

  return (
    <div className="ma-page-solo">
      <div className="ma-card ma-card-narrow">
        <p className="k">International checks</p>
        <h1 className="ma-title">Account</h1>
        <AuthCard onSignedIn={() => router.push(safeNext(locale, params.get("next")))} />
      </div>
    </div>
  );
}
