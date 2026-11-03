/** The Hello Staff storefront. Its `/buy/<package>-<tier>` route starts that
 *  exact tier's purchase and opens login with it selected; the ids are its
 *  `src/data/packages.ts`. `HELLOSTAFF_STORE_URL` overrides the host for a
 *  local run (this file is read on the server). */
export const HELLOSTAFF_LIVE =
  process.env.HELLOSTAFF_STORE_URL?.replace(/\/$/, "") || "https://devhellostaff.helloverify.com";

/** The storefront home. Every link that used to open `/products/hellov` goes
 *  here. Same URL as `HELLOV_STORE` in `lib/seo/legacy-urls.ts` — that file
 *  cannot import this one, so the two strings are kept in step by hand. */
export const HELLOSTAFF_HOME = `${HELLOSTAFF_LIVE}/`;

export type LiveServiceKey =
  | "driver"
  | "homeStaff"
  | "tenant"
  | "nanny"
  | "verifyAnyone"
  | "cyberIdentity"
  | "knowIdentity"
  | "knowContact";

export type LiveTier = "basic" | "advanced";

const LIVE_PACKAGES: Record<LiveServiceKey, string> = {
  driver: "driver",
  homeStaff: "home-staff",
  tenant: "tenant",
  nanny: "nanny",
  verifyAnyone: "verify-anyone",
  cyberIdentity: "cyber-identity",
  knowIdentity: "know-identity",
  knowContact: "know-contact",
};

export function liveBuyUrl(key: LiveServiceKey, tier: LiveTier): string {
  return `${HELLOSTAFF_LIVE}/buy/${LIVE_PACKAGES[key]}-${tier}`;
}
